# Architecture Context

## Stack

| Layer        | Technology                  | Role                                      |
| ------------ | --------------------------- | ----------------------------------------- |
| Framework    | Next.js (App Router) + TypeScript | Frontend pages + API routes in one project |
| UI           | Tailwind CSS + shadcn/ui    | Styling and component library              |
| Auth         | Supabase Auth               | Admin sign-in only (single admin user)     |
| Database     | Supabase (PostgreSQL)       | File metadata, categories, project data    |
| File Storage | Supabase Storage            | STEP/SLDPRT/GLB/PDF binaries               |
| 3D Viewer    | Three.js (vanilla engine + React wrapper) | GLB model rendering in portfolio/database |
| Hosting      | Vercel                      | Deployment, CI on git push                 |

## System Boundaries

- `src/app/(site)/` — public routes only: landing, portfolio,
  tools, database pages. No business logic lives here; pages
  compose features.
- `src/app/api/` — server endpoints. Owns auth checks and
  Supabase mutations. Nothing else calls Supabase with write
  access.
- `src/features/portfolio/` — project data, project card and
  detail components, and the 3D viewer:
  - `viewer/lib/` — the imperative Three.js engine (scene,
    loader, component hierarchy, interaction, controls, context
    menu, undo/redo history). Plain JS, framework-agnostic, owns
    all WebGL/DOM work for the viewport.
  - `viewer/components/` — the `ModelViewer` React client
    component: the only React boundary, renders the restyled
    chrome and drives the engine via init/loadModel/dispose.
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

## 3D Viewer Engine

The GLB viewer is a self-contained imperative Three.js engine
(`features/portfolio/viewer/lib/`, plain JS) wrapped by one typed
React client component (`viewer/components/model-viewer.tsx`).

- **Why not react-three-fiber:** the engine (component hierarchy,
  isolate/hide, undo/redo, context menu, measurement) was authored
  as working vanilla Three.js modules. Wrapping them is far less
  risky and more maintainable than re-expressing all of it as R3F
  components, and reuses code the owner already understands.
- **Boundary:** React renders the chrome (toolbar, panels,
  banners, overlays) with the element IDs the engine expects and
  owns load/error overlay state; the engine attaches listeners and
  does all scene/DOM work. `three` is a bundled dependency and is
  dynamically imported inside the component's effect, so it never
  runs during SSR/prerender. DRACO decoder is loaded from the
  gstatic CDN.
- **Models** load from a URL — the `FEATURED_MODEL` constant in
  `features/portfolio/data/projects.ts` (a path under `/public`
  or an absolute URL). The viewer is featured on the `/portfolio`
  listing page; there is no file-upload UI on the public site.

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
