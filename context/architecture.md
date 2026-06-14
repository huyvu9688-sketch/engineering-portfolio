# Architecture Context

## Stack

| Layer        | Technology                  | Role                                      |
| ------------ | --------------------------- | ----------------------------------------- |
| Framework    | Next.js (App Router) + TypeScript | Frontend pages + API routes in one project |
| UI           | Tailwind CSS + shadcn/ui    | Styling and component library              |
| Auth         | Supabase Auth               | Admin sign-in only (single admin user)     |
| Database     | Supabase (PostgreSQL)       | File metadata, categories, project data    |
| File Storage | Supabase Storage            | STEP/SLDPRT/GLB/PDF binaries               |
| Hosting      | Vercel                      | Deployment, CI on git push                 |

## System Boundaries

- `src/app/(site)/` — public routes only: landing, portfolio,
  tools, database pages. No business logic lives here; pages
  compose features.
- `src/app/api/` — server endpoints. Owns auth checks and
  Supabase mutations. Nothing else calls Supabase with write
  access.
- `src/features/portfolio/` — project data plus the project card
  and detail components.
- `src/features/calculators/` — all calculator logic and UIs.
  `lib/` holds pure math functions (no React, no I/O);
  `components/` holds the UIs that call them.
- `src/features/file-database/` — file listing, filters,
  upload form, download handling.
- `src/components/shared/` — navbar, footer, layout shells
  used across features.
- `src/components/ui/` — shadcn-generated components.
  Generated code; do not hand-edit.
- `src/lib/` — Supabase client setup, shared utilities,
  constants. No feature-specific code.

## 3D Viewer (removed)

The interactive in-browser 3D model viewer was **removed on
2026-06-14** (it never rendered reliably across imported CAD GLBs —
see `progress-tracker.md`). The `three` dependency and the
`features/portfolio/viewer/` engine were deleted; the full history
is recoverable from git if it is ever revisited. Note this is only
the in-page *viewer* — the file database can still host GLB files
for **download** (see Storage Model).

## Storage Model

- **PostgreSQL (Supabase)**: file metadata (name, category,
  type, size, storage path, description, upload date),
  categories, and portfolio project records once they outgrow
  the static data file.
- **Supabase Storage**: the actual binaries — STEP, SLDPRT,
  GLB, PDF. The database stores only the storage path, never
  file content.
- **Static data files** (`features/portfolio/data/`): portfolio
  project content during early phases, before DB migration.

## Auth and Access Model

- All content is publicly readable; no visitor accounts exist.
- One admin account (Joe) signs in via Supabase Auth.
- All mutations (upload, edit, delete) require the admin
  session, enforced in API routes AND by Supabase Row Level
  Security policies — never by UI hiding alone.

## Invariants

1. Calculator math lives in pure functions under
   `features/calculators/lib/` — no React, no fetch, no
   Supabase imports. UIs only call these functions.
2. File binaries never go in the database; metadata never
   goes in Storage. Path lives in DB, bytes live in Storage.
3. Every mutation endpoint verifies the admin session before
   any write. RLS policies back this at the database level.
4. Features do not import from other features. Shared code
   goes in `src/lib/` or `src/components/shared/`.
5. No hardcoded colors — all styling uses the tokens defined
   in `ui-context.md`.
