# File Database — Design Spec

**Date:** 2026-06-20
**Phase:** 4 (Technical Database)
**Status:** Approved design, pending implementation plan
**Owner:** Joe

## 1. Purpose

A searchable, downloadable library where Joe (single admin) stores **all
his mechanical-engineering documents** — 3D CAD models, 2D drawings,
datasheets, standards, calculation reports, and images — and visitors can
browse, search, and download them.

Built as a **smart file library** (not a full PDM/PLM): rich per-file
metadata, free-form tags, optional project grouping, and Postgres-native
full-text search. No part numbers, BOMs, or revision trees (explicitly out
of scope — see §9).

## 2. Access Model (the security requirement)

**Joe is the only writer. Everyone else is read-only.**

- **Public (anon):** browse, search, view metadata, download files. No
  account required.
- **Admin (Joe only):** upload, edit, delete documents and projects.

This is enforced at **three layers** (defense in depth):

1. **Supabase Auth:** public sign-ups disabled. Exactly one account exists
   (Joe's), provisioned manually once.
2. **Row-Level Security:** an `app_admins(user_id)` table holds Joe's UUID.
   Every write policy checks
   `EXISTS (SELECT 1 FROM app_admins WHERE user_id = auth.uid())`. Even if a
   second account were somehow created, it could not write.
3. **API routes:** every mutation endpoint re-verifies the admin session
   before any write, returning 401/403 otherwise.

No service-role key ships in the app. The only secrets are
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (both safe to
expose; RLS is the real guard). Secrets live in `.env.local`, never
committed.

> Note on file privacy: files are **publicly downloadable** by design
> (visitors "can read and see the data"). The bucket is public-read; the
> *write* side is locked to Joe. If files ever need to be private, the
> schema does not change — we flip the bucket to private and add a
> signed-URL download route. Deferred (§9).

## 3. Architecture & Boundaries

Follows existing project structure (`architecture.md`).

```
src/features/file-database/
  lib/
    categories.ts     Taxonomy: 6 categories + accepted extensions + labels
                      + icons. Single source of truth for validation AND UI.
    types.ts          Document, Project, DocumentFilter types.
    validation.ts     Validate document/project input at the API boundary.
                      Dependency-free (matches repo's minimal-dep style).
    query.ts          Build the Supabase browse/search query from a filter.
  components/
    document-browser.tsx, document-card.tsx, filter-bar.tsx, search-box.tsx
    upload-form.tsx, document-admin-table.tsx, project-manager.tsx
    admin-login.tsx
src/lib/supabase/
    client.ts         Browser client (anon key) for public reads.
    server.ts         Server client (cookie session) for auth checks.
src/app/(site)/database/page.tsx     Public browse (replaces placeholder).
src/app/admin/
    layout.tsx        Server-side session guard (redirect if not admin).
    page.tsx          Login.
    documents/page.tsx, projects/page.tsx
src/app/api/
    documents/route.ts        POST (create metadata)
    documents/[id]/route.ts   PATCH (edit), DELETE (row + storage object)
    projects/route.ts, projects/[id]/route.ts
supabase/migrations/*.sql     Schema, indexes, RLS, trigger, bucket policies.
```

**Data flow:**
- **Reads** (public browse/search): browser/server component queries Supabase
  directly with the anon key. RLS permits public SELECT. No API route for
  reads.
- **Writes** (admin): go through `src/app/api/` routes that verify the admin
  session first. Never direct.
- **File upload:** binary goes **browser → Supabase Storage directly** (not
  through the API route). Reason: Vercel serverless request bodies cap at
  ~4.5 MB; CAD/assembly files exceed that. The browser (authenticated as
  Joe) uploads the file, then POSTs only metadata + storage path to the API
  route. If the metadata insert fails, the orphaned Storage object is
  deleted.

**New dependencies:** `@supabase/supabase-js`, `@supabase/ssr`. No others
(validation is hand-rolled; controls are native token-styled).

## 4. Data Model

### `projects`
```
id          uuid pk default gen_random_uuid()
name        text not null
slug        text not null unique
description text
created_at  timestamptz not null default now()
updated_at  timestamptz not null default now()
```

### `documents`
```
id                uuid pk default gen_random_uuid()
title             text not null
description       text
category          text not null
                    CHECK (category IN
                      ('cad_3d','drawing_2d','datasheet','standard','report','image'))
file_ext          text not null              -- 'step','pdf','dwg' (lowercased)
mime_type         text
size_bytes        bigint not null
tags              text[] not null default '{}'
project_id        uuid references projects(id) on delete set null
storage_path      text not null unique
original_filename text not null
search            tsvector  -- maintained by a BEFORE INSERT/UPDATE trigger
                  -- (to_tsvector over title + description + tags). A STORED
                  -- generated column was rejected by Postgres because
                  -- to_tsvector('english', ...) is not IMMUTABLE; a trigger is
                  -- the standard workaround and keeps the same GIN-indexed search.
created_at        timestamptz not null default now()
updated_at        timestamptz not null default now()
```

### `app_admins`
```
user_id    uuid pk references auth.users(id) on delete cascade
created_at timestamptz not null default now()
```

### Indexes (the "efficient" part)
- `GIN (search)` — full-text ranking
- `GIN (tags)` — tag filter (`tags && ARRAY[...]`)
- `btree (category)`, `btree (project_id)`, `btree (created_at DESC)`

### Triggers
- `updated_at` bumped to `now()` on every UPDATE of `documents` and
  `projects`.

### Categories & accepted extensions (`categories.ts` is canonical)
| key          | label              | accepted extensions                          |
| ------------ | ------------------ | -------------------------------------------- |
| `cad_3d`     | 3D CAD Models      | step, stp, iges, igs, sldprt, x_t, stl, glb  |
| `drawing_2d` | 2D Drawings        | pdf, dwg, dxf                                |
| `datasheet`  | Datasheets         | pdf, docx                                    |
| `standard`   | Standards & Refs   | pdf, docx                                    |
| `report`     | Calcs & Reports    | xlsx, docx, pdf, csv                         |
| `image`      | Images             | png, jpg, jpeg, webp                         |

**Design choices:**
- Category is `text + CHECK`, not a Postgres enum — adding a category later
  means editing one constant + the constraint, not an `ALTER TYPE` dance.
- The canonical category list (keys, labels, icons, accepted extensions)
  lives in `categories.ts` so validation and UI share one source of truth.
- Project name is **not** folded into the `search` tsvector (a generated
  column can't reach another table; not worth denormalizing for one admin).
  Project is a filter facet instead.

## 5. Storage

- One Supabase Storage bucket: `documents`, **public-read**.
- Object path: `{document_id}/{sanitized_filename}` — the doc UUID
  namespaces every file so identical filenames never collide.
- The DB stores only `storage_path`; bytes live only in Storage.
- Per-file size cap: **50 MB** (validated client-side and at the bucket).
- Note: Supabase free tier ≈ 1 GB total storage. Flagged for awareness.

### Storage RLS
- SELECT (download): public.
- INSERT / UPDATE / DELETE: admin only (`app_admins` check, same as tables).

## 6. UI Surfaces

All surfaces are **calm utility surfaces** (`ui-context.md`): same tokens,
fonts, and layout language as the home page / `/tools`, but no custom
cursor, marquee, magnetic buttons, GSAP, or Lenis. Motion = a simple
fade-in on mount at most.

**Token discipline:** `--font-display` uppercase titles, `--font-mono`
uppercase chrome (labels, chips, metadata, buttons), `--font-sans` body.
`--accent` (#eb3a14) only for hover/active/status. Hairline borders.
`rounded-full` pills (search, chips, buttons), `rounded-lg` cards. Mirrors
the `/tools` page structure exactly.

### Public `/database`
- Wrapper `max-w-[1800px] px-4 pb-24 pt-40 md:px-6`.
- Header: `--font-display` **DATABASE** (`text-4xl md:text-7xl uppercase
  tracking-tighter`) + right-aligned `--font-mono` live count
  (e.g. `24 FILES · 6 CATEGORIES`), over `border-b border-hairline`.
- **Pill search** (`rounded-full`, hairline, mono placeholder), debounced →
  full-text query on `search`.
- **Filters:** category chips + project dropdown + tag filter. Mono
  uppercase pills; active = `--accent` border/text.
- **Card grid** (`rounded-lg`, `--surface`, hairline border) per document:
  Lucide file-type icon + category badge, title, muted description, tag
  chips, footer row of mono `tabular-nums` metadata (ext · size · date) +
  **Download** pill (`--ink` bg → `--accent` hover).
- Result count + empty state in mono.
- `.glb` cards may also show "Open in CAD viewer" → optional enhancement,
  needs a `?model=` param on the viewer; out of core scope (§9).

### Admin `/admin/*` (behind login)
- `/admin` — email + password login, accent button. Success → documents.
- `admin/layout.tsx` — server component session guard; no admin session →
  redirect to `/admin`.
- `/admin/documents` — list of all docs with edit + delete; **Upload form**:
  file picker → title, category select (drives accepted-extension
  allowlist), tag chip-input, project select + "new project", description.
  Client validates ext + size, uploads to Storage, POSTs metadata.
- `/admin/projects` — minimal CRUD.
- Controls are native token-styled (matching converter/motor-sizing).

## 7. API Routes

All under `src/app/api/`. Writes only — reads go direct via anon client.

- `POST /api/documents` — create document metadata.
- `PATCH /api/documents/[id]` — edit metadata.
- `DELETE /api/documents/[id]` — delete row + Storage object.
- `POST /api/projects`, `PATCH /api/projects/[id]`, `DELETE /api/projects/[id]`.

Each route: (1) verify admin session → 401/403 if not; (2) validate &
parse input → 400 if invalid; (3) perform Supabase mutation → 500 on db
error. Response shape: `{ data }` on success, `{ error: string }` on
failure, correct HTTP status (per `code-standards.md`).

## 8. Error Handling & Testing

**Error handling:**
- Consistent `{data}` / `{error}` API shapes with proper status codes.
- Failed metadata insert deletes the orphaned Storage object.
- Upload/edit forms show inline `--state-error` messages; validation runs
  before any network call.
- Browse handles empty results and fetch errors gracefully.

**Testing:**
- Pure logic unit-tested with `node:test` (co-located `*.test.ts`):
  - `categories.ts` — accepted-extension allowlist per category.
  - `validation.ts` — document/project input validators.
  - `query.ts` — filter → Supabase query parameters.
- Supabase/UI verified manually.
- **Ship test (success criterion #3):** admin uploads a STEP file; a
  visitor downloads it.

## 9. Out of Scope (YAGNI)

- Part numbers, BOMs, revision/version history (the Mini-PDM option).
- Inside-PDF full-text extraction (metadata + tags search only).
- Download counts / analytics.
- Private files / signed-URL downloads (schema-compatible if needed later).
- "Open in CAD viewer" deep link (optional enhancement; needs a viewer
  `?model=` param — separate, small unit if desired).
- shadcn/ui (available if a richer data table is wanted later; native
  controls for now).

## 10. Build Order

Each step is a separately verifiable commit (honors `ai-workflow-rules.md`:
migrate first, split UI from DB, split auth). Commit locally per step; push
to `main` only when Joe says (Vercel auto-deploys on push).

1. **4.1 Schema** — install supabase deps; `src/lib/supabase/` clients;
   migration (tables, indexes, RLS, `app_admins`, trigger); bucket +
   policies; env vars. Verify: seed a row via SQL, read it from the anon
   client.
2. **4.2 Auth** — `/admin` login, `admin/layout.tsx` session guard,
   sign-out. Verify: Joe logs in; non-admin is redirected.
3. **4.3 Upload + admin** — write API routes, upload form (direct-to-
   Storage), admin table (edit/delete), project manager. Verify: upload a
   STEP file end to end; row + object created.
4. **4.4 Public browse** — `/database` search, filters, card grid,
   download. Verify: visitor searches, filters, downloads (ship test).

## 11. Open Questions

- None blocking. Defaults chosen: 50 MB per-file cap; `/admin` route name;
  no download counts at launch.
