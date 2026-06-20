# File Database Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a searchable, downloadable file library on Supabase where Joe (single admin) uploads/manages mechanical-engineering documents and visitors browse, search, and download them.

**Architecture:** Next.js 16 App Router. File metadata in Postgres (`projects`, `documents`), binaries in a public-read Supabase Storage bucket. Public reads go direct via the anon key (RLS allows SELECT). All writes go through `/api/*` routes guarded by an admin session AND Row-Level Security keyed to an `app_admins` table — only Joe's user-id can write. Large files upload browser → Storage directly (Vercel's ~4.5 MB body cap), then metadata is POSTed to the API. Pure logic (taxonomy, validation, query building, formatting) is unit-tested with `node:test`; Supabase/UI is verified manually.

**Tech Stack:** Next.js 16, TypeScript (strict), Tailwind v4 (token-driven), `@supabase/supabase-js`, `@supabase/ssr`, Postgres full-text search (`tsvector` + GIN), `node:test`.

**Spec:** `docs/superpowers/specs/2026-06-20-file-database-design.md`

---

## File Structure

**Pure logic (unit-tested):**
- `src/features/file-database/lib/types.ts` — shared types
- `src/features/file-database/lib/categories.ts` — 6-category taxonomy + accepted extensions + helpers
- `src/features/file-database/lib/format.ts` — file size, extension, filename sanitize, slugify
- `src/features/file-database/lib/validation.ts` — validate document/project input at API boundary
- `src/features/file-database/lib/query.ts` — normalize search term, build typed filter from UI/URL params
- `*.test.ts` co-located next to each of the above

**Supabase plumbing:**
- `src/lib/supabase/client.ts` — browser client (anon)
- `src/lib/supabase/server.ts` — server client (cookie session)
- `src/lib/supabase/middleware.ts` — `updateSession` token refresh
- `src/lib/supabase/admin-guard.ts` — `requireAdmin()` for API routes
- `src/middleware.ts` — Next middleware entry
- `supabase/migrations/0001_file_database.sql` — tables, indexes, RLS, trigger, `app_admins`, `is_admin()`
- `supabase/migrations/0002_storage.sql` — bucket + storage policies

**API routes (writes only):**
- `src/app/api/documents/route.ts` — POST
- `src/app/api/documents/[id]/route.ts` — PATCH, DELETE
- `src/app/api/projects/route.ts` — POST
- `src/app/api/projects/[id]/route.ts` — PATCH, DELETE

**Admin UI (behind login):**
- `src/app/admin/page.tsx` — login (public)
- `src/app/admin/(dashboard)/layout.tsx` — session guard + admin chrome + sign-out
- `src/app/admin/(dashboard)/documents/page.tsx` — list + upload + edit/delete
- `src/app/admin/(dashboard)/projects/page.tsx` — project CRUD
- `src/features/file-database/components/upload-form.tsx`
- `src/features/file-database/components/document-admin-table.tsx`
- `src/features/file-database/components/project-manager.tsx`
- `src/features/file-database/components/sign-out-button.tsx`

**Public UI:**
- `src/app/(site)/database/page.tsx` — server component (replaces placeholder)
- `src/features/file-database/components/document-browser.tsx` — client, holds filter state
- `src/features/file-database/components/filter-bar.tsx`
- `src/features/file-database/components/search-box.tsx`
- `src/features/file-database/components/document-card.tsx`

---

# PHASE 4.1 — Schema & Infrastructure

## Task 1: Install dependencies & env scaffolding

**Files:**
- Modify: `package.json` (via npm)
- Create: `.env.local.example`
- Modify: `.gitignore` (verify `.env*.local` ignored)

- [ ] **Step 1: Install Supabase packages**

Run:
```bash
npm install @supabase/supabase-js @supabase/ssr
```
Expected: both added to `dependencies` in `package.json`.

- [ ] **Step 2: Create env example file**

Create `.env.local.example`:
```
# Supabase — from your project's Settings → API. Both are safe to expose
# (Row-Level Security is the real guard). Copy this file to .env.local and fill in.
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

- [ ] **Step 3: Verify .gitignore ignores local env**

Run:
```bash
grep -n "env" .gitignore
```
Expected: a line matching `.env*.local` (Next.js scaffolds this). If absent, add `.env*.local` to `.gitignore`. NEVER commit `.env.local`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .env.local.example .gitignore
git commit -m "chore(database): add supabase deps + env example"
```

---

## Task 2: Types & category taxonomy (TDD)

**Files:**
- Create: `src/features/file-database/lib/types.ts`
- Create: `src/features/file-database/lib/categories.ts`
- Test: `src/features/file-database/lib/categories.test.ts`

- [ ] **Step 1: Write the types module**

Create `src/features/file-database/lib/types.ts`:
```ts
export type CategoryKey =
  | "cad_3d"
  | "drawing_2d"
  | "datasheet"
  | "standard"
  | "report"
  | "image";

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentRecord {
  id: string;
  title: string;
  description: string | null;
  category: CategoryKey;
  file_ext: string;
  mime_type: string | null;
  size_bytes: number;
  tags: string[];
  project_id: string | null;
  storage_path: string;
  original_filename: string;
  created_at: string;
  updated_at: string;
}

/** Payload accepted by POST /api/documents (no server-generated columns). */
export interface DocumentInput {
  title: string;
  description: string | null;
  category: CategoryKey;
  file_ext: string;
  mime_type: string | null;
  size_bytes: number;
  tags: string[];
  project_id: string | null;
  storage_path: string;
  original_filename: string;
}

export interface ProjectInput {
  name: string;
  slug: string;
  description: string | null;
}
```

- [ ] **Step 2: Write the failing test**

Create `src/features/file-database/lib/categories.test.ts`:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CATEGORIES,
  CATEGORY_KEYS,
  MAX_FILE_BYTES,
  getCategory,
  isAcceptedExtension,
  acceptAttribute,
} from "./categories.ts";

test("there are exactly 6 categories with unique keys", () => {
  assert.equal(CATEGORIES.length, 6);
  assert.equal(new Set(CATEGORY_KEYS).size, 6);
});

test("getCategory returns def for known key, undefined otherwise", () => {
  assert.equal(getCategory("cad_3d")?.label, "3D CAD Models");
  assert.equal(getCategory("nope"), undefined);
});

test("isAcceptedExtension is case-insensitive and category-scoped", () => {
  assert.equal(isAcceptedExtension("cad_3d", "STEP"), true);
  assert.equal(isAcceptedExtension("cad_3d", "step"), true);
  assert.equal(isAcceptedExtension("cad_3d", "pdf"), false);
  assert.equal(isAcceptedExtension("drawing_2d", "dwg"), true);
  assert.equal(isAcceptedExtension("image", "png"), true);
});

test("acceptAttribute renders a dot-prefixed comma list for <input accept>", () => {
  assert.equal(acceptAttribute("drawing_2d"), ".pdf,.dwg,.dxf");
});

test("MAX_FILE_BYTES is 50 MB", () => {
  assert.equal(MAX_FILE_BYTES, 50 * 1024 * 1024);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run:
```bash
npm test
```
Expected: FAIL — cannot find module `./categories.ts`.

- [ ] **Step 4: Write the implementation**

Create `src/features/file-database/lib/categories.ts`:
```ts
import type { CategoryKey } from "./types.ts";

export interface CategoryDef {
  key: CategoryKey;
  label: string;
  /** lowercase, no leading dot */
  extensions: string[];
}

export const CATEGORIES: CategoryDef[] = [
  { key: "cad_3d", label: "3D CAD Models", extensions: ["step", "stp", "iges", "igs", "sldprt", "x_t", "stl", "glb"] },
  { key: "drawing_2d", label: "2D Drawings", extensions: ["pdf", "dwg", "dxf"] },
  { key: "datasheet", label: "Datasheets", extensions: ["pdf", "docx"] },
  { key: "standard", label: "Standards & Refs", extensions: ["pdf", "docx"] },
  { key: "report", label: "Calcs & Reports", extensions: ["xlsx", "docx", "pdf", "csv"] },
  { key: "image", label: "Images", extensions: ["png", "jpg", "jpeg", "webp"] },
];

export const CATEGORY_KEYS: CategoryKey[] = CATEGORIES.map((c) => c.key);

export const MAX_FILE_BYTES = 50 * 1024 * 1024;

export function getCategory(key: string): CategoryDef | undefined {
  return CATEGORIES.find((c) => c.key === key);
}

export function isAcceptedExtension(category: CategoryKey, ext: string): boolean {
  const def = getCategory(category);
  if (!def) return false;
  return def.extensions.includes(ext.toLowerCase());
}

/** Value for an <input type="file" accept="..."> attribute. */
export function acceptAttribute(category: CategoryKey): string {
  const def = getCategory(category);
  if (!def) return "";
  return def.extensions.map((e) => `.${e}`).join(",");
}
```

- [ ] **Step 5: Run test to verify it passes**

Run:
```bash
npm test
```
Expected: PASS (all categories tests green).

- [ ] **Step 6: Commit**

```bash
git add src/features/file-database/lib/types.ts src/features/file-database/lib/categories.ts src/features/file-database/lib/categories.test.ts
git commit -m "feat(database): category taxonomy + types"
```

---

## Task 3: Format helpers (TDD)

**Files:**
- Create: `src/features/file-database/lib/format.ts`
- Test: `src/features/file-database/lib/format.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/file-database/lib/format.test.ts`:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { formatFileSize, fileExtension, sanitizeFilename, slugify } from "./format.ts";

test("formatFileSize renders human-readable sizes", () => {
  assert.equal(formatFileSize(0), "0 B");
  assert.equal(formatFileSize(512), "512 B");
  assert.equal(formatFileSize(1024), "1 KB");
  assert.equal(formatFileSize(1536), "1.5 KB");
  assert.equal(formatFileSize(1048576), "1 MB");
  assert.equal(formatFileSize(52428800), "50 MB");
});

test("fileExtension returns lowercase extension without dot", () => {
  assert.equal(fileExtension("Bracket.STEP"), "step");
  assert.equal(fileExtension("drawing.final.pdf"), "pdf");
  assert.equal(fileExtension("noext"), "");
});

test("sanitizeFilename strips unsafe chars but keeps a usable name", () => {
  assert.equal(sanitizeFilename("My Part #3 (rev A).step"), "my-part-3-rev-a.step");
  assert.equal(sanitizeFilename("  spaced  .pdf "), "spaced.pdf");
});

test("slugify produces url-safe slugs", () => {
  assert.equal(slugify("Gearbox Assembly 2025"), "gearbox-assembly-2025");
  assert.equal(slugify("  Hello---World!! "), "hello-world");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot find module `./format.ts`.

- [ ] **Step 3: Write the implementation**

Create `src/features/file-database/lib/format.ts`:
```ts
const UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

/** Bytes → human string, e.g. 1536 → "1.5 KB". Trailing .0 trimmed. */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < UNITS.length - 1) {
    size /= 1024;
    unit += 1;
  }
  const rounded = unit === 0 ? Math.round(size) : Math.round(size * 10) / 10;
  return `${rounded} ${UNITS[unit]}`;
}

/** Lowercase extension without the dot; "" if none. */
export function fileExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot <= 0 || dot === filename.length - 1) return "";
  return filename.slice(dot + 1).toLowerCase();
}

/** Lowercase, dash-separated, safe-for-storage filename, extension preserved. */
export function sanitizeFilename(filename: string): string {
  const trimmed = filename.trim();
  const dot = trimmed.lastIndexOf(".");
  const base = dot > 0 ? trimmed.slice(0, dot) : trimmed;
  const ext = dot > 0 ? trimmed.slice(dot + 1) : "";
  const safeBase = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const safeExt = ext.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return safeExt ? `${safeBase}.${safeExt}` : safeBase;
}

/** URL-safe slug from a project name. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/file-database/lib/format.ts src/features/file-database/lib/format.test.ts
git commit -m "feat(database): format/sanitize/slugify helpers"
```

---

## Task 4: Input validation (TDD)

**Files:**
- Create: `src/features/file-database/lib/validation.ts`
- Test: `src/features/file-database/lib/validation.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/file-database/lib/validation.test.ts`:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateDocumentInput, validateProjectInput } from "./validation.ts";

const validDoc = {
  title: "Gearbox Housing",
  description: "Cast housing, rev A",
  category: "cad_3d",
  file_ext: "step",
  mime_type: "model/step",
  size_bytes: 1024,
  tags: ["gearbox", "housing"],
  project_id: null,
  storage_path: "abc/gearbox.step",
  original_filename: "gearbox.step",
};

test("accepts a valid document and trims/normalizes tags", () => {
  const r = validateDocumentInput({ ...validDoc, tags: [" Gearbox ", "gearbox", ""] });
  assert.equal(r.ok, true);
  if (r.ok) assert.deepEqual(r.value.tags, ["gearbox"]);
});

test("rejects missing title", () => {
  const r = validateDocumentInput({ ...validDoc, title: "  " });
  assert.equal(r.ok, false);
});

test("rejects unknown category", () => {
  const r = validateDocumentInput({ ...validDoc, category: "blueprints" });
  assert.equal(r.ok, false);
});

test("rejects extension not allowed for the category", () => {
  const r = validateDocumentInput({ ...validDoc, file_ext: "pdf" });
  assert.equal(r.ok, false);
});

test("rejects size over the cap", () => {
  const r = validateDocumentInput({ ...validDoc, size_bytes: 60 * 1024 * 1024 });
  assert.equal(r.ok, false);
});

test("rejects non-object payload", () => {
  assert.equal(validateDocumentInput(null).ok, false);
  assert.equal(validateDocumentInput("x").ok, false);
});

test("validateProjectInput requires name and derives nothing it cannot", () => {
  const ok = validateProjectInput({ name: "Line 4 Retrofit", slug: "line-4-retrofit", description: null });
  assert.equal(ok.ok, true);
  const bad = validateProjectInput({ name: "", slug: "", description: null });
  assert.equal(bad.ok, false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot find module `./validation.ts`.

- [ ] **Step 3: Write the implementation**

Create `src/features/file-database/lib/validation.ts`:
```ts
import type { CategoryKey, DocumentInput, ProjectInput } from "./types.ts";
import { CATEGORY_KEYS, MAX_FILE_BYTES, isAcceptedExtension } from "./categories.ts";

export type Validated<T> = { ok: true; value: T } | { ok: false; error: string };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function cleanString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

function normalizeTags(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const seen = new Set<string>();
  for (const raw of v) {
    if (typeof raw !== "string") continue;
    const t = raw.trim().toLowerCase();
    if (t) seen.add(t);
  }
  return [...seen];
}

export function validateDocumentInput(raw: unknown): Validated<DocumentInput> {
  if (!isObject(raw)) return { ok: false, error: "Invalid payload." };

  const title = cleanString(raw.title);
  if (!title) return { ok: false, error: "Title is required." };

  const category = raw.category;
  if (typeof category !== "string" || !CATEGORY_KEYS.includes(category as CategoryKey)) {
    return { ok: false, error: "Unknown category." };
  }

  const file_ext = cleanString(raw.file_ext)?.toLowerCase() ?? null;
  if (!file_ext) return { ok: false, error: "File extension is required." };
  if (!isAcceptedExtension(category as CategoryKey, file_ext)) {
    return { ok: false, error: `.${file_ext} is not allowed for this category.` };
  }

  const size_bytes = raw.size_bytes;
  if (typeof size_bytes !== "number" || !Number.isFinite(size_bytes) || size_bytes <= 0) {
    return { ok: false, error: "File size is invalid." };
  }
  if (size_bytes > MAX_FILE_BYTES) {
    return { ok: false, error: "File exceeds the 50 MB limit." };
  }

  const storage_path = cleanString(raw.storage_path);
  if (!storage_path) return { ok: false, error: "Storage path is required." };

  const original_filename = cleanString(raw.original_filename);
  if (!original_filename) return { ok: false, error: "Original filename is required." };

  const project_id =
    raw.project_id === null || raw.project_id === undefined
      ? null
      : typeof raw.project_id === "string" && raw.project_id.trim()
        ? raw.project_id.trim()
        : null;

  return {
    ok: true,
    value: {
      title,
      description: cleanString(raw.description),
      category: category as CategoryKey,
      file_ext,
      mime_type: cleanString(raw.mime_type),
      size_bytes: Math.round(size_bytes),
      tags: normalizeTags(raw.tags),
      project_id,
      storage_path,
      original_filename,
    },
  };
}

export function validateProjectInput(raw: unknown): Validated<ProjectInput> {
  if (!isObject(raw)) return { ok: false, error: "Invalid payload." };
  const name = cleanString(raw.name);
  if (!name) return { ok: false, error: "Project name is required." };
  const slug = cleanString(raw.slug);
  if (!slug) return { ok: false, error: "Project slug is required." };
  return { ok: true, value: { name, slug, description: cleanString(raw.description) } };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/file-database/lib/validation.ts src/features/file-database/lib/validation.test.ts
git commit -m "feat(database): document/project input validation"
```

---

## Task 5: Search term normalization (TDD)

**Files:**
- Create: `src/features/file-database/lib/query.ts`
- Test: `src/features/file-database/lib/query.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/file-database/lib/query.test.ts`:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeSearchTerm } from "./query.ts";

test("normalizeSearchTerm trims and returns null when empty", () => {
  assert.equal(normalizeSearchTerm("   "), null);
  assert.equal(normalizeSearchTerm(""), null);
  assert.equal(normalizeSearchTerm("  gearbox housing "), "gearbox housing");
});

test("normalizeSearchTerm collapses internal whitespace", () => {
  assert.equal(normalizeSearchTerm("gear   box"), "gear box");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot find module `./query.ts`.

- [ ] **Step 3: Write the implementation**

Create `src/features/file-database/lib/query.ts`:
```ts
/**
 * Turn raw search-box text into a clean term for Postgres websearch, or null
 * when there's nothing to search. The browser passes the result straight to
 * `.textSearch("search", term, { type: "websearch" })`.
 */
export function normalizeSearchTerm(raw: string): string | null {
  const t = raw.trim().replace(/\s+/g, " ");
  return t.length ? t : null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS. Full suite (categories + format + validation + query) green.

- [ ] **Step 5: Commit**

```bash
git add src/features/file-database/lib/query.ts src/features/file-database/lib/query.test.ts
git commit -m "feat(database): search term normalization"
```

---

## Task 6: SQL migrations (manual apply + verify)

**Files:**
- Create: `supabase/migrations/0001_file_database.sql`
- Create: `supabase/migrations/0002_storage.sql`

> This task needs a live Supabase project. If one does not exist, the executor MUST pause and ask Joe to: (1) create a free project at supabase.com, (2) copy URL + anon key into `.env.local` (from `.env.local.example`), (3) create his admin auth user under Authentication → Users, and (4) disable public sign-ups under Authentication → Providers → Email (toggle off "Allow new users to sign up").

- [ ] **Step 1: Write the schema migration**

Create `supabase/migrations/0001_file_database.sql`:
```sql
-- Projects -----------------------------------------------------------------
create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Documents ----------------------------------------------------------------
create table public.documents (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  description       text,
  category          text not null check (category in
                      ('cad_3d','drawing_2d','datasheet','standard','report','image')),
  file_ext          text not null,
  mime_type         text,
  size_bytes        bigint not null,
  tags              text[] not null default '{}',
  project_id        uuid references public.projects(id) on delete set null,
  storage_path      text not null unique,
  original_filename text not null,
  search            tsvector generated always as (
                      to_tsvector('english',
                        coalesce(title,'') || ' ' ||
                        coalesce(description,'') || ' ' ||
                        array_to_string(tags,' '))) stored,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index documents_search_idx   on public.documents using gin (search);
create index documents_tags_idx     on public.documents using gin (tags);
create index documents_category_idx on public.documents (category);
create index documents_project_idx  on public.documents (project_id);
create index documents_created_idx  on public.documents (created_at desc);

-- Admin allow-list ---------------------------------------------------------
create table public.app_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- is_admin(): security definer so it can read app_admins under RLS ---------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.app_admins where user_id = auth.uid());
$$;

-- updated_at trigger -------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

-- Row-Level Security -------------------------------------------------------
alter table public.projects   enable row level security;
alter table public.documents  enable row level security;
alter table public.app_admins enable row level security;

create policy "projects public read"  on public.projects  for select using (true);
create policy "documents public read" on public.documents for select using (true);

create policy "projects admin write"  on public.projects
  for all using (public.is_admin()) with check (public.is_admin());
create policy "documents admin write" on public.documents
  for all using (public.is_admin()) with check (public.is_admin());

create policy "app_admins admin read" on public.app_admins
  for select using (public.is_admin());
```

- [ ] **Step 2: Write the storage migration**

Create `supabase/migrations/0002_storage.sql`:
```sql
-- Public-read bucket, 50 MB per-file cap.
insert into storage.buckets (id, name, public, file_size_limit)
values ('documents', 'documents', true, 52428800)
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit;

-- Anyone may download; only admins may write.
create policy "documents bucket public read"
  on storage.objects for select
  using (bucket_id = 'documents');

create policy "documents bucket admin insert"
  on storage.objects for insert
  with check (bucket_id = 'documents' and public.is_admin());

create policy "documents bucket admin update"
  on storage.objects for update
  using (bucket_id = 'documents' and public.is_admin());

create policy "documents bucket admin delete"
  on storage.objects for delete
  using (bucket_id = 'documents' and public.is_admin());
```

- [ ] **Step 3: Apply both migrations**

In the Supabase dashboard → SQL Editor, paste and run `0001_file_database.sql`, then `0002_storage.sql`. Expected: "Success. No rows returned" for each.

- [ ] **Step 4: Register Joe as admin**

Find Joe's user id (Authentication → Users → click the user → copy UID). In SQL Editor:
```sql
insert into public.app_admins (user_id) values ('PASTE-JOE-UUID-HERE');
```
Expected: 1 row inserted.

- [ ] **Step 5: Verify public read + admin gate**

In SQL Editor (runs as service role, bypasses RLS) seed one row:
```sql
insert into public.documents
  (title, category, file_ext, size_bytes, storage_path, original_filename)
values
  ('Smoke Test', 'report', 'pdf', 1024, 'seed/smoke.pdf', 'smoke.pdf');
```
Then verify the anon client can read it (after Task 7, run a quick read). For now confirm the row exists:
```sql
select id, title, category from public.documents;
```
Expected: the seeded row is returned. (Delete it later: `delete from public.documents where storage_path = 'seed/smoke.pdf';`)

- [ ] **Step 6: Commit the migration files**

```bash
git add supabase/migrations/0001_file_database.sql supabase/migrations/0002_storage.sql
git commit -m "feat(database): schema, indexes, RLS, storage bucket migrations"
```

---

## Task 7: Supabase clients & middleware

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/middleware.ts`
- Create: `src/middleware.ts`

- [ ] **Step 1: Browser client**

Create `src/lib/supabase/client.ts`:
```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 2: Server client**

Create `src/lib/supabase/server.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — middleware refreshes the session.
          }
        },
      },
    },
  );
}
```

- [ ] **Step 3: Session-refresh middleware helper**

Create `src/lib/supabase/middleware.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Touch the session so expired access tokens get refreshed into cookies.
  await supabase.auth.getUser();
  return response;
}
```

- [ ] **Step 4: Middleware entry**

Create `src/middleware.ts`:
```ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|glb|gltf)$).*)",
  ],
};
```

- [ ] **Step 5: Verify the app still builds**

Run:
```bash
npm run build
```
Expected: build succeeds (clients compile; middleware recognized).

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabase src/middleware.ts
git commit -m "feat(database): supabase browser/server clients + session middleware"
```

**PHASE 4.1 verification gate:** `npm test` green; `npm run build` passes; the seeded row reads back. Update `context/progress-tracker.md` Phase 4 line to note 4.1 done (deferred to Task 18). Do NOT push yet.

---

# PHASE 4.2 — Admin Auth

## Task 8: Admin login page

**Files:**
- Create: `src/app/admin/page.tsx`

- [ ] **Step 1: Build the login page**

Create `src/app/admin/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setError("Sign-in failed. Check your email and password.");
      return;
    }
    router.replace("/admin/documents");
    router.refresh();
  }

  return (
    <section className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 md:px-6">
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">
        Admin
      </p>
      <h1 className="mt-2 text-4xl font-semibold uppercase tracking-tighter md:text-5xl">
        Sign In
      </h1>
      <form onSubmit={onSubmit} className="mt-10 space-y-5">
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
            Email
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-lg border border-hairline bg-surface px-4 py-3 text-base outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
            Password
          </span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-lg border border-hairline bg-surface px-4 py-3 text-base outline-none focus:border-accent"
          />
        </label>
        {error && (
          <p className="font-mono text-xs uppercase tracking-widest text-state-error">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-ink px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest text-on-dark transition-colors hover:bg-accent disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </section>
  );
}
```

- [ ] **Step 2: Verify it renders**

Ask Joe to run the dev server (per project rule, the executor does NOT launch it) and visit `/admin`. Expected: the form renders in project tokens; a wrong password shows the error line; a correct one redirects to `/admin/documents` (404 until Task 9 — acceptable here).

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat(database): admin login page"
```

---

## Task 9: Dashboard guard, admin chrome & sign-out

**Files:**
- Create: `src/app/admin/(dashboard)/layout.tsx`
- Create: `src/features/file-database/components/sign-out-button.tsx`
- Create: `src/lib/supabase/admin-guard.ts`

- [ ] **Step 1: API admin-guard helper**

Create `src/lib/supabase/admin-guard.ts`:
```ts
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminGuardResult =
  | { ok: true; supabase: SupabaseClient; userId: string }
  | { ok: false; error: string; status: 401 | 403 };

/** Verify the caller is the admin. Use at the top of every write route. */
export async function requireAdmin(): Promise<AdminGuardResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated.", status: 401 };

  const { data: admin } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) return { ok: false, error: "Forbidden.", status: 403 };

  return { ok: true, supabase, userId: user.id };
}
```

- [ ] **Step 2: Sign-out button**

Create `src/features/file-database/components/sign-out-button.tsx`:
```tsx
"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/admin");
    router.refresh();
  }
  return (
    <button
      onClick={signOut}
      className="rounded-full border border-hairline px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-ink-muted transition-colors hover:border-accent hover:text-accent"
    >
      Sign Out
    </button>
  );
}
```

- [ ] **Step 3: Guarded dashboard layout**

Create `src/app/admin/(dashboard)/layout.tsx`:
```tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/features/file-database/components/sign-out-button";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin");

  const { data: admin } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) redirect("/admin");

  return (
    <div className="mx-auto max-w-[1800px] px-4 pb-24 pt-32 md:px-6">
      <header className="flex items-center justify-between border-b border-hairline pb-6">
        <nav className="flex items-center gap-6 font-mono text-[10px] uppercase tracking-widest">
          <Link href="/admin/documents" className="transition-colors hover:text-accent">
            Documents
          </Link>
          <Link href="/admin/projects" className="transition-colors hover:text-accent">
            Projects
          </Link>
        </nav>
        <SignOutButton />
      </header>
      <main className="mt-10">{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: Verify the guard**

Build, then ask Joe to test: signed out → `/admin/documents` redirects to `/admin`; signed in as admin → it renders the chrome (child pages 404 until Task 13 — acceptable). Run:
```bash
npm run build
```
Expected: build passes.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/\(dashboard\)/layout.tsx src/features/file-database/components/sign-out-button.tsx src/lib/supabase/admin-guard.ts
git commit -m "feat(database): admin session guard, chrome, sign-out, requireAdmin"
```

**PHASE 4.2 gate:** signed-out users cannot reach dashboard routes; admin can; `npm run build` passes. Do NOT push yet.

---

# PHASE 4.3 — Admin Writes (API + Upload + Management)

## Task 10: Documents write API

**Files:**
- Create: `src/app/api/documents/route.ts`
- Create: `src/app/api/documents/[id]/route.ts`

- [ ] **Step 1: POST (create) route**

Create `src/app/api/documents/route.ts`:
```ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-guard";
import { validateDocumentInput } from "@/features/file-database/lib/validation";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const raw = await request.json().catch(() => null);
  const parsed = validateDocumentInput(raw);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { data, error } = await auth.supabase
    .from("documents")
    .insert(parsed.value)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data }, { status: 201 });
}
```

- [ ] **Step 2: PATCH + DELETE route**

Create `src/app/api/documents/[id]/route.ts`:
```ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-guard";
import { validateDocumentInput } from "@/features/file-database/lib/validation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const raw = await request.json().catch(() => null);
  const parsed = validateDocumentInput(raw);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { data, error } = await auth.supabase
    .from("documents")
    .update(parsed.value)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data: doc, error: fetchErr } = await auth.supabase
    .from("documents")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!doc) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { error: delErr } = await auth.supabase.from("documents").delete().eq("id", id);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  // Remove the binary; ignore storage error so a missing object can't block the row delete.
  await auth.supabase.storage.from("documents").remove([doc.storage_path]);

  return NextResponse.json({ data: { id } });
}
```

- [ ] **Step 3: Verify build + auth gate**

Run: `npm run build`
Expected: passes. Manual: a `POST /api/documents` without a session returns 401 (ask Joe to test with the browser devtools or after the upload form lands in Task 12).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/documents
git commit -m "feat(database): documents write API (create/edit/delete + storage cleanup)"
```

---

## Task 11: Projects write API

**Files:**
- Create: `src/app/api/projects/route.ts`
- Create: `src/app/api/projects/[id]/route.ts`

- [ ] **Step 1: POST route**

Create `src/app/api/projects/route.ts`:
```ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-guard";
import { validateProjectInput } from "@/features/file-database/lib/validation";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const raw = await request.json().catch(() => null);
  const parsed = validateProjectInput(raw);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { data, error } = await auth.supabase
    .from("projects")
    .insert(parsed.value)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data }, { status: 201 });
}
```

- [ ] **Step 2: PATCH + DELETE route**

Create `src/app/api/projects/[id]/route.ts`:
```ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-guard";
import { validateProjectInput } from "@/features/file-database/lib/validation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const raw = await request.json().catch(() => null);
  const parsed = validateProjectInput(raw);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { data, error } = await auth.supabase
    .from("projects")
    .update(parsed.value)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  // documents.project_id is ON DELETE SET NULL, so member files survive un-grouped.
  const { error } = await auth.supabase.from("projects").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: { id } });
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/projects
git commit -m "feat(database): projects write API"
```

---

## Task 12: Upload form component

**Files:**
- Create: `src/features/file-database/components/upload-form.tsx`

- [ ] **Step 1: Build the upload form**

Create `src/features/file-database/components/upload-form.tsx`:
```tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, MAX_FILE_BYTES, acceptAttribute, isAcceptedExtension } from "@/features/file-database/lib/categories";
import { fileExtension, sanitizeFilename, formatFileSize } from "@/features/file-database/lib/format";
import type { CategoryKey, DocumentInput, Project } from "@/features/file-database/lib/types";

export function UploadForm({ projects, onUploaded }: { projects: Project[]; onUploaded: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CategoryKey>("cad_3d");
  const [description, setDescription] = useState("");
  const [tagText, setTagText] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function onPickFile(f: File | null) {
    setFile(f);
    setError(null);
    if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!file) return setError("Choose a file first.");
    if (file.size > MAX_FILE_BYTES) return setError(`File exceeds ${formatFileSize(MAX_FILE_BYTES)}.`);
    const ext = fileExtension(file.name);
    if (!ext) return setError("File has no extension.");
    if (!isAcceptedExtension(category, ext)) {
      return setError(`.${ext} is not allowed for ${category}. Pick the right category.`);
    }
    if (!title.trim()) return setError("Title is required.");

    setBusy(true);
    const supabase = createClient();
    const id = crypto.randomUUID();
    const storagePath = `${id}/${sanitizeFilename(file.name)}`;

    // 1) Upload the binary straight to Storage (bypasses Vercel's body cap).
    const up = await supabase.storage.from("documents").upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (up.error) {
      setBusy(false);
      return setError(`Upload failed: ${up.error.message}`);
    }

    // 2) POST metadata to the admin-guarded API.
    const payload: DocumentInput = {
      title: title.trim(),
      description: description.trim() || null,
      category,
      file_ext: ext,
      mime_type: file.type || null,
      size_bytes: file.size,
      tags: tagText.split(",").map((t) => t.trim()).filter(Boolean),
      project_id: projectId || null,
      storage_path: storagePath,
      original_filename: file.name,
    };
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);

    if (!res.ok) {
      // 3) Roll back the orphaned object so Storage and DB stay consistent.
      await supabase.storage.from("documents").remove([storagePath]);
      const body = await res.json().catch(() => ({ error: "Save failed." }));
      return setError(body.error ?? "Save failed.");
    }

    // Reset and notify parent to refresh the list.
    setFile(null);
    setTitle("");
    setDescription("");
    setTagText("");
    setProjectId("");
    onUploaded();
  }

  const labelCls = "font-mono text-[10px] uppercase tracking-widest text-ink-muted";
  const inputCls = "mt-2 w-full rounded-lg border border-hairline bg-surface px-4 py-3 text-base outline-none focus:border-accent";

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-hairline bg-surface p-6">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className={labelCls}>File (max {formatFileSize(MAX_FILE_BYTES)})</span>
          <input
            type="file"
            accept={acceptAttribute(category)}
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            className={inputCls}
          />
          {file && (
            <span className="mt-1 block font-mono text-[10px] uppercase tracking-widest text-ink-faint">
              {file.name} · {formatFileSize(file.size)}
            </span>
          )}
        </label>

        <label className="block">
          <span className={labelCls}>Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
        </label>

        <label className="block">
          <span className={labelCls}>Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryKey)}
            className={inputCls}
          >
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={labelCls}>Project (optional)</span>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputCls}>
            <option value="">— None —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={labelCls}>Tags (comma-separated)</span>
          <input value={tagText} onChange={(e) => setTagText(e.target.value)} className={inputCls} />
        </label>

        <label className="block md:col-span-2">
          <span className={labelCls}>Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={inputCls}
          />
        </label>
      </div>

      {error && (
        <p className="mt-4 font-mono text-xs uppercase tracking-widest text-state-error">{error}</p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-6 rounded-full bg-ink px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest text-on-dark transition-colors hover:bg-accent disabled:opacity-50"
      >
        {busy ? "Uploading…" : "Upload Document"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: passes (component compiles; consumed in Task 13).

- [ ] **Step 3: Commit**

```bash
git add src/features/file-database/components/upload-form.tsx
git commit -m "feat(database): upload form (direct-to-storage + metadata POST + rollback)"
```

---

## Task 13: Admin documents page (list + upload + delete)

**Files:**
- Create: `src/features/file-database/components/document-admin-table.tsx`
- Create: `src/app/admin/(dashboard)/documents/page.tsx`

- [ ] **Step 1: Admin table component**

Create `src/features/file-database/components/document-admin-table.tsx`:
```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UploadForm } from "./upload-form";
import { getCategory } from "@/features/file-database/lib/categories";
import { formatFileSize } from "@/features/file-database/lib/format";
import type { DocumentRecord, Project } from "@/features/file-database/lib/types";

export function DocumentAdminTable({ initialProjects }: { initialProjects: Project[] }) {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setDocs(data as DocumentRecord[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This removes the file and its record.`)) return;
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Delete failed." }));
      setError(body.error ?? "Delete failed.");
      return;
    }
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">
          Upload New
        </h2>
        <div className="mt-3">
          <UploadForm projects={initialProjects} onUploaded={load} />
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between border-b border-hairline pb-3">
          <h2 className="text-2xl font-semibold uppercase tracking-tighter">Documents</h2>
          <span className="font-mono text-[10px] uppercase tracking-widest tabular-nums text-ink-faint">
            {docs.length} total
          </span>
        </div>

        {error && (
          <p className="mt-4 font-mono text-xs uppercase tracking-widest text-state-error">{error}</p>
        )}
        {loading ? (
          <p className="mt-6 font-mono text-xs uppercase tracking-widest text-ink-faint">Loading…</p>
        ) : (
          <ul className="mt-2 divide-y divide-hairline">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="truncate text-base font-medium">{d.title}</p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">
                    {getCategory(d.category)?.label} · .{d.file_ext} · {formatFileSize(d.size_bytes)}
                  </p>
                </div>
                <button
                  onClick={() => onDelete(d.id, d.title)}
                  className="shrink-0 rounded-full border border-hairline px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-ink-muted transition-colors hover:border-state-error hover:text-state-error"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Admin documents page (server) loads projects, renders table**

Create `src/app/admin/(dashboard)/documents/page.tsx`:
```tsx
import { createClient } from "@/lib/supabase/server";
import { DocumentAdminTable } from "@/features/file-database/components/document-admin-table";
import type { Project } from "@/features/file-database/lib/types";

export default async function AdminDocumentsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("*").order("name");
  return <DocumentAdminTable initialProjects={(data ?? []) as Project[]} />;
}
```

- [ ] **Step 3: End-to-end verification (the ship test)**

Ask Joe to run the dev server, sign in, and upload a real STEP file with a title, category "3D CAD Models", and a tag. Expected: upload succeeds; the file appears in the list; the row exists in Supabase (`select * from documents`) and the object exists in the `documents` bucket. Then Delete it and confirm both the row and the object are gone.

- [ ] **Step 4: Commit**

```bash
git add src/features/file-database/components/document-admin-table.tsx "src/app/admin/(dashboard)/documents/page.tsx"
git commit -m "feat(database): admin documents page (list, upload, delete)"
```

---

## Task 14: Project manager page

**Files:**
- Create: `src/features/file-database/components/project-manager.tsx`
- Create: `src/app/admin/(dashboard)/projects/page.tsx`

- [ ] **Step 1: Project manager component**

Create `src/features/file-database/components/project-manager.tsx`:
```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/features/file-database/lib/format";
import type { Project } from "@/features/file-database/lib/types";

export function ProjectManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await createClient().from("projects").select("*").order("name");
    if (error) setError(error.message);
    else setProjects(data as Project[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Name is required.");
    setBusy(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), slug: slugify(name), description: description.trim() || null }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Create failed." }));
      return setError(body.error ?? "Create failed.");
    }
    setName("");
    setDescription("");
    void load();
  }

  async function onDelete(id: string, label: string) {
    if (!confirm(`Delete project "${label}"? Its documents stay but become ungrouped.`)) return;
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Delete failed." }));
      return setError(body.error ?? "Delete failed.");
    }
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  const labelCls = "font-mono text-[10px] uppercase tracking-widest text-ink-muted";
  const inputCls = "mt-2 w-full rounded-lg border border-hairline bg-surface px-4 py-3 text-base outline-none focus:border-accent";

  return (
    <div className="space-y-10">
      <form onSubmit={onCreate} className="rounded-lg border border-hairline bg-surface p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className={labelCls}>Project name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
            {name && (
              <span className="mt-1 block font-mono text-[10px] uppercase tracking-widest text-ink-faint">
                slug: {slugify(name)}
              </span>
            )}
          </label>
          <label className="block">
            <span className={labelCls}>Description (optional)</span>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
          </label>
        </div>
        {error && (
          <p className="mt-4 font-mono text-xs uppercase tracking-widest text-state-error">{error}</p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="mt-6 rounded-full bg-ink px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest text-on-dark transition-colors hover:bg-accent disabled:opacity-50"
        >
          {busy ? "Creating…" : "Add Project"}
        </button>
      </form>

      <section>
        <div className="flex items-end justify-between border-b border-hairline pb-3">
          <h2 className="text-2xl font-semibold uppercase tracking-tighter">Projects</h2>
          <span className="font-mono text-[10px] uppercase tracking-widest tabular-nums text-ink-faint">
            {projects.length} total
          </span>
        </div>
        <ul className="mt-2 divide-y divide-hairline">
          {projects.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0">
                <p className="truncate text-base font-medium">{p.name}</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">{p.slug}</p>
              </div>
              <button
                onClick={() => onDelete(p.id, p.name)}
                className="shrink-0 rounded-full border border-hairline px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-ink-muted transition-colors hover:border-state-error hover:text-state-error"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Projects page**

Create `src/app/admin/(dashboard)/projects/page.tsx`:
```tsx
import { ProjectManager } from "@/features/file-database/components/project-manager";

export default function AdminProjectsPage() {
  return <ProjectManager />;
}
```

- [ ] **Step 3: Verify**

Run: `npm run build`. Then ask Joe (signed in) to create a project, see it listed, and confirm it appears in the upload form's Project dropdown. Delete it and confirm any member docs survive ungrouped.

- [ ] **Step 4: Commit**

```bash
git add src/features/file-database/components/project-manager.tsx "src/app/admin/(dashboard)/projects/page.tsx"
git commit -m "feat(database): project manager (create/list/delete)"
```

**PHASE 4.3 gate:** ship test passes (upload a STEP, see it; delete it, gone from DB + Storage); projects CRUD works; `npm run build` passes. Do NOT push yet.

---

# PHASE 4.4 — Public Browse, Search, Download

## Task 15: Card, search box, and filter bar

**Files:**
- Create: `src/features/file-database/components/document-card.tsx`
- Create: `src/features/file-database/components/search-box.tsx`
- Create: `src/features/file-database/components/filter-bar.tsx`

- [ ] **Step 1: Document card**

Create `src/features/file-database/components/document-card.tsx`:
```tsx
import { Download, FileText, Box, Image as ImageIcon, FileSpreadsheet, BookText } from "lucide-react";
import { getCategory } from "@/features/file-database/lib/categories";
import { formatFileSize } from "@/features/file-database/lib/format";
import type { CategoryKey, DocumentRecord } from "@/features/file-database/lib/types";

const ICON: Record<CategoryKey, typeof FileText> = {
  cad_3d: Box,
  drawing_2d: FileText,
  datasheet: FileText,
  standard: BookText,
  report: FileSpreadsheet,
  image: ImageIcon,
};

export function DocumentCard({ doc, downloadUrl }: { doc: DocumentRecord; downloadUrl: string }) {
  const Icon = ICON[doc.category] ?? FileText;
  const date = new Date(doc.created_at).toISOString().slice(0, 10);

  return (
    <article className="flex flex-col rounded-lg border border-hairline bg-surface p-5 transition-colors hover:border-accent">
      <div className="flex items-start justify-between gap-3">
        <Icon className="h-5 w-5 stroke-[1.5] text-ink-muted" />
        <span className="rounded-full border border-hairline px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-ink-muted">
          {getCategory(doc.category)?.label}
        </span>
      </div>

      <h3 className="mt-4 text-lg font-semibold tracking-tight">{doc.title}</h3>
      {doc.description && (
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-muted">{doc.description}</p>
      )}

      {doc.tags.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {doc.tags.map((t) => (
            <li
              key={t}
              className="rounded-full border border-hairline px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-ink-faint"
            >
              {t}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex items-center justify-between border-t border-hairline pt-4">
        <span className="font-mono text-[10px] uppercase tracking-widest tabular-nums text-ink-faint">
          .{doc.file_ext} · {formatFileSize(doc.size_bytes)} · {date}
        </span>
        <a
          href={downloadUrl}
          download={doc.original_filename}
          className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-on-dark transition-colors hover:bg-accent"
        >
          <Download className="h-3 w-3 stroke-[1.5]" />
          Download
        </a>
      </div>
    </article>
  );
}
```

- [ ] **Step 2: Search box**

Create `src/features/file-database/components/search-box.tsx`:
```tsx
"use client";

import { Search } from "lucide-react";

export function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 stroke-[1.5] text-ink-faint" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="SEARCH TITLE, DESCRIPTION, TAGS"
        className="w-full rounded-full border border-hairline bg-surface py-3 pl-11 pr-4 font-mono text-xs uppercase tracking-widest outline-none placeholder:text-ink-faint focus:border-accent"
      />
    </div>
  );
}
```

- [ ] **Step 3: Filter bar (category chips + project select)**

Create `src/features/file-database/components/filter-bar.tsx`:
```tsx
"use client";

import { CATEGORIES } from "@/features/file-database/lib/categories";
import type { CategoryKey, Project } from "@/features/file-database/lib/types";

export function FilterBar({
  category,
  projectId,
  projects,
  onCategory,
  onProject,
}: {
  category: CategoryKey | null;
  projectId: string | null;
  projects: Project[];
  onCategory: (c: CategoryKey | null) => void;
  onProject: (p: string | null) => void;
}) {
  const chip = (active: boolean) =>
    `rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${
      active ? "border-accent text-accent" : "border-hairline text-ink-muted hover:border-accent"
    }`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={() => onCategory(null)} className={chip(category === null)}>
        All
      </button>
      {CATEGORIES.map((c) => (
        <button key={c.key} onClick={() => onCategory(c.key)} className={chip(category === c.key)}>
          {c.label}
        </button>
      ))}

      <select
        value={projectId ?? ""}
        onChange={(e) => onProject(e.target.value || null)}
        className="ml-auto rounded-full border border-hairline bg-surface px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-ink-muted outline-none focus:border-accent"
      >
        <option value="">All Projects</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: passes (components compile; wired in Task 16).

- [ ] **Step 5: Commit**

```bash
git add src/features/file-database/components/document-card.tsx src/features/file-database/components/search-box.tsx src/features/file-database/components/filter-bar.tsx
git commit -m "feat(database): document card, search box, filter bar"
```

---

## Task 16: Document browser (client, holds filter state)

**Files:**
- Create: `src/features/file-database/components/document-browser.tsx`

- [ ] **Step 1: Build the browser**

Create `src/features/file-database/components/document-browser.tsx`:
```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SearchBox } from "./search-box";
import { FilterBar } from "./filter-bar";
import { DocumentCard } from "./document-card";
import { normalizeSearchTerm } from "@/features/file-database/lib/query";
import type { CategoryKey, DocumentRecord, Project } from "@/features/file-database/lib/types";

const BUCKET = "documents";

export function DocumentBrowser({
  initialDocuments,
  projects,
}: {
  initialDocuments: DocumentRecord[];
  projects: Project[];
}) {
  const [docs, setDocs] = useState<DocumentRecord[]>(initialDocuments);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryKey | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Public download URL for a stored object (bucket is public-read).
  function publicUrl(path: string): string {
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      let q = supabase.from("documents").select("*").order("created_at", { ascending: false });
      const term = normalizeSearchTerm(query);
      if (term) q = q.textSearch("search", term, { type: "websearch" });
      if (category) q = q.eq("category", category);
      if (projectId) q = q.eq("project_id", projectId);
      const { data } = await q;
      if (data) setDocs(data as DocumentRecord[]);
    }, 250);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query, category, projectId, supabase]);

  return (
    <div className="mt-10 space-y-6">
      <SearchBox value={query} onChange={setQuery} />
      <FilterBar
        category={category}
        projectId={projectId}
        projects={projects}
        onCategory={setCategory}
        onProject={setProjectId}
      />

      <p className="font-mono text-[10px] uppercase tracking-widest tabular-nums text-ink-faint">
        {docs.length} {docs.length === 1 ? "result" : "results"}
      </p>

      {docs.length === 0 ? (
        <p className="py-16 text-center font-mono text-xs uppercase tracking-widest text-ink-faint">
          No documents match your filters.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((d) => (
            <DocumentCard key={d.id} doc={d} downloadUrl={publicUrl(d.storage_path)} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add src/features/file-database/components/document-browser.tsx
git commit -m "feat(database): document browser with debounced full-text search + filters"
```

---

## Task 17: Public /database page (replace placeholder)

**Files:**
- Modify: `src/app/(site)/database/page.tsx`

- [ ] **Step 1: Replace the placeholder with the real page**

Replace the entire contents of `src/app/(site)/database/page.tsx`:
```tsx
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { DocumentBrowser } from "@/features/file-database/components/document-browser";
import { CATEGORIES } from "@/features/file-database/lib/categories";
import type { DocumentRecord, Project } from "@/features/file-database/lib/types";

export const metadata: Metadata = {
  title: "Database — Joseph Vu",
};

// Always fetch fresh counts/listing on request.
export const dynamic = "force-dynamic";

export default async function DatabasePage() {
  const supabase = await createClient();
  const [{ data: docs }, { data: projects }] = await Promise.all([
    supabase.from("documents").select("*").order("created_at", { ascending: false }),
    supabase.from("projects").select("*").order("name"),
  ]);

  const documents = (docs ?? []) as DocumentRecord[];
  const projectList = (projects ?? []) as Project[];
  const categoryCount = new Set(documents.map((d) => d.category)).size;

  return (
    <section className="mx-auto max-w-[1800px] px-4 pb-24 pt-40 md:px-6">
      <div className="flex items-end justify-between border-b border-hairline pb-6">
        <h1 className="text-4xl font-semibold uppercase tracking-tighter md:text-7xl">
          Database
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest tabular-nums text-ink-faint">
          {String(documents.length).padStart(2, "0")} Files
          <span className="text-hairline-dark"> · </span>
          {String(categoryCount).padStart(2, "0")} / {CATEGORIES.length} Categories
        </p>
      </div>

      <p className="mt-8 max-w-xl text-base leading-relaxed text-ink-muted md:text-lg">
        A downloadable library of 3D CAD models, drawings, datasheets, standards,
        and calculation reports. Search by name or tag, filter by category or
        project, and download any file directly.
      </p>

      <DocumentBrowser initialDocuments={documents} projects={projectList} />
    </section>
  );
}
```

- [ ] **Step 2: End-to-end verification (ship test, visitor side)**

Ask Joe to (signed out, or in a private window) visit `/database`. Expected: uploaded files render as cards; typing in search narrows results (full-text); category chips and the project dropdown filter; Download fetches the real file. Confirm the header count is accurate.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(site)/database/page.tsx"
git commit -m "feat(database): public /database browse, search, download page"
```

---

## Task 18: Update progress tracker & final verification

**Files:**
- Modify: `context/progress-tracker.md`

- [ ] **Step 1: Run the full test suite and build**

Run:
```bash
npm test && npm run build
```
Expected: all `node:test` units pass; build succeeds.

- [ ] **Step 2: Update the progress tracker**

In `context/progress-tracker.md`: change the Phase 4 line under "Current Phase" to `COMPLETE`, add a Session Note dated 2026-06-20 summarizing the file database (schema, RLS hardened via `app_admins`, direct-to-Storage upload, `/admin` management, public `/database` browse/search/download), move the Phase 4 item under "Completed", and note the new architecture decisions (Supabase clients in `src/lib/supabase/`, reads-direct/writes-via-API pattern, public-read bucket).

- [ ] **Step 3: Commit**

```bash
git add context/progress-tracker.md
git commit -m "docs: mark Phase 4 (file database) complete in progress tracker"
```

- [ ] **Step 4: Hand off for deploy**

Tell Joe the batch is ready. He decides when to `git push` (Vercel auto-deploys). Before the first deploy he must add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the Vercel project's Environment Variables, or the live site's database calls will fail.

---

## Notes for the executor

- **Project rule:** the dev server is run by Joe, never launched in the IDE. Steps that need a running app say "ask Joe."
- **Push rule:** commit locally after every task; do NOT `git push` until Joe says the batch is ready.
- **Tokens only:** no hardcoded hex — use the CSS variable tokens already in `globals.css` (`bg-surface`, `text-ink-muted`, `border-hairline`, `bg-accent`, `text-state-error`, etc.), exactly as the `/tools` page does.
- **No `any`:** strict TypeScript throughout; validate external input at the boundary (already covered by `validation.ts`).
- **Supabase project is a prerequisite** for Tasks 6+. If it is not set up, pause at Task 6 Step 1 and get Joe to create it.
```
