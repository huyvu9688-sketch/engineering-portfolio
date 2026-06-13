# Code Standards

## General

- Keep modules small and single-purpose; if a file does two
  unrelated things, split it
- Fix root causes — do not layer workarounds on workarounds
- Do not mix unrelated concerns in one component or route
- Prefer boring, readable code over clever code; the
  maintainer is not a professional developer

## TypeScript

- Strict mode required throughout the project
- No `any` — use explicit interfaces or narrowly scoped types
- Calculator functions declare input/output units in their
  types or JSDoc (e.g. `boreDiameterMm`, `pressureBar`) —
  never bare `number` names like `x` or `value`
- Validate unknown external input (form data, API payloads,
  Supabase responses) at system boundaries before trusting it
- **One documented exception:** the imperative Three.js viewer
  engine under `features/portfolio/viewer/lib/` is plain JS (the
  owner's authored modules, adapted). It is wrapped by a strictly
  typed React component (`viewer/components/model-viewer.tsx`),
  which is the typed boundary. All other code is strict TS.

## Next.js

- Default to server components; add `"use client"` only when
  browser interactivity requires it (calculators, forms,
  3D viewer)
- Keep route handlers focused on a single responsibility
- Use the App Router conventions; no `pages/` directory

## Styling

- Use the CSS custom property tokens from `ui-context.md` —
  no hardcoded hex values anywhere
- Follow the border radius scale defined in `ui-context.md`
- Tailwind utility classes only; no separate CSS files except
  the global token definitions

## API Routes

- Validate and parse request input before any logic runs
- Enforce admin auth before any mutation — return 401/403
  early
- Return consistent response shapes:
  `{ data }` on success, `{ error: string }` on failure,
  with correct HTTP status codes

## Data and Storage

- Metadata belongs in PostgreSQL
- File binaries belong in Supabase Storage
- Never store file content, base64 blobs, or large text in
  the database
- All units stored and computed internally in SI (mm, N, bar,
  Nm); conversion to display units happens at the UI layer only

## File Organization

- `src/app/` — routes and API endpoints only; thin pages that
  compose features
- `src/features/<name>/` — self-contained feature code:
  `lib/` (pure logic), `components/` (UI), `data/` (static
  content)
- `src/components/shared/` — cross-feature layout components
- `src/components/ui/` — shadcn-generated; never hand-edited
- `src/lib/` — Supabase clients, utilities, constants
