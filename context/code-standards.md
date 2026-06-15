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
  (all code is strict TS — the earlier plain-JS Three.js viewer
  engine that was the one exception was removed on 2026-06-14)

## Next.js

- Default to server components; add `"use client"` only when
  browser interactivity requires it (calculators, forms)
- Keep route handlers focused on a single responsibility
- Use the App Router conventions; no `pages/` directory

## Testing

- Pure calculator/conversion logic lives in `features/<name>/lib/`
  and is unit-tested; co-locate tests as `*.test.ts` next to the
  module.
- Tests use the built-in Node test runner (`node:test` +
  `node:assert/strict`) and run via `npm test` — no separate test
  framework (Node strips TS types natively). Import the module
  under test with its explicit `.ts` extension (the runner needs
  it; `tsconfig` sets `allowImportingTsExtensions`).
- Each calculator must pass the hand-check cases in its
  `calculator-specs.md` section plus a round-trip / sanity check
  before it ships (per `ai-workflow-rules.md`).

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
- All units stored and computed internally in **coherent SI** —
  metre (m), newton (N), pascal (Pa), newton-metre (N·m), watt
  (W), cubic-metre-per-second (m³/s), plus kg, s, rad/s as needed.
  Conversion to display units (mm, bar, psi, etc.) happens at the
  UI layer only. "Coherent" means formulas carry no correction
  factors (e.g. P·A → Pa × m² = N directly). Chosen 2026-06-14;
  supersedes the earlier "mm, N, bar, Nm" wording (mm and bar are
  not coherent SI). See `calculator-specs.md`.

## File Organization

- `src/app/` — routes and API endpoints only; thin pages that
  compose features
- `src/features/<name>/` — self-contained feature code:
  `lib/` (pure logic), `components/` (UI), `data/` (static
  content)
- `src/components/shared/` — cross-feature layout components
- `src/components/ui/` — shadcn-generated; never hand-edited
- `src/lib/` — Supabase clients, utilities, constants
