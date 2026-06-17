# Code Standards

## General

- The quality bar for this codebase is senior front-end / creative
  developer. Prefer elegant, production-quality patterns — the same
  approach a developer at olhalazarieva.com's level would use.
- Keep modules small and single-purpose. If a file does two unrelated
  things, split it.
- Fix root causes — do not layer workarounds on workarounds.
- Leverage advanced language features, abstractions, and design
  patterns where they improve clarity or performance. The maintainer
  has technical depth and can reason about non-trivial code.

## TypeScript

- Strict mode required throughout.
- No `any` — use explicit interfaces or narrowly scoped types.
- Calculator functions declare input/output units in their types or
  JSDoc (e.g. `boreDiameterMm`, `pressureBar`) — never bare `number`
  names like `x` or `value`.
- Validate unknown external input (form data, API payloads, Supabase
  responses) at system boundaries before trusting it.

## Next.js

- Default to server components; add `"use client"` only when browser
  interactivity requires it (animation, calculators, forms).
- Keep route handlers focused on a single responsibility.
- Use App Router conventions; no `pages/` directory.
- Marketing animation components (`"use client"`) — GSAP, Lenis,
  scroll observers — must be dynamic-imported or wrapped in client
  boundaries so they never run during SSR.

## Animation (GSAP + CSS)

### GSAP on marketing surfaces
- Import from `"gsap"` and `"gsap/ScrollTrigger"`. Register once per
  component mount: `gsap.registerPlugin(ScrollTrigger)`.
- Use `useGSAP()` hook (from `@gsap/react`) instead of `useEffect`
  for GSAP setup — it handles cleanup and scope correctly.
- Tween to a revealed state, not from a hidden state: always pass
  `from` as the first argument to `gsap.fromTo()` so content is
  always readable if JS fails to run.
- Always use `toggleActions: "play none none none"` — reveals happen
  once, they do not reverse on scroll-back.
- Respect `prefers-reduced-motion`: check it before creating GSAP
  ScrollTrigger instances; if true, make content visible immediately.

### CSS animations
- Use `@keyframes` in `globals.css` for: marquee scroll,
  page transition, status-bar pulse, simple hover states.
- CSS scroll-driven `animation-timeline: view()` is acceptable for
  single-element effects on Chromium 115+ — note the Firefox/Safari
  gap.

### Lenis smooth scroll
- Initialize Lenis once in the marketing layout root (a client
  component). Sync to GSAP's ticker:
  `gsap.ticker.add((time) => lenis.raf(time * 1000))`.
- Disable GSAP's default `requestAnimationFrame` when using Lenis:
  `gsap.ticker.lagSmoothing(0)`.
- Never initialize Lenis on utility pages (`/tools`, `/database`) or
  in the CAD viewer.

## Testing

- Pure calculator/conversion logic lives in `features/*/lib/` and is
  unit-tested; co-locate tests as `*.test.ts` next to the module.
- Tests use the built-in Node test runner (`node:test` +
  `node:assert/strict`) — no separate test framework.
- Import the module under test with its explicit `.ts` extension
  (the runner needs it; `tsconfig` sets `allowImportingTsExtensions`).
- Each calculator must pass the hand-check cases in its
  `calculator-specs.md` section before it ships.

## Styling

- Use the CSS custom property tokens from `ui-context.md` —
  no hardcoded hex values anywhere.
- Follow the border radius scale defined in `ui-context.md`.
- Tailwind utility classes only; no separate CSS files except the
  global token definitions in `globals.css`.
- Font variables: use `var(--font-display)` for condensed display
  type, `var(--font-mono)` for UI chrome, `var(--font-sans)` for
  body. Never mix roles (e.g. body text in display font).

## API Routes

- Validate and parse request input before any logic runs.
- Enforce admin auth before any mutation — return 401/403 early.
- Return consistent response shapes: `{ data }` on success,
  `{ error: string }` on failure, with correct HTTP status codes.

## Data and Storage

- Metadata belongs in PostgreSQL.
- File binaries belong in Supabase Storage.
- Never store file content, base64 blobs, or large text in the
  database.
- All units stored and computed internally in **coherent SI** —
  metre (m), newton (N), pascal (Pa), newton-metre (N·m), watt (W),
  cubic-metre-per-second (m³/s), plus kg, s, rad/s. Display
  conversion to mm/bar/etc. happens at the UI layer only.

## File Organization

- `src/app/` — routes and API endpoints only; thin pages that
  compose features
- `src/features/<name>/` — self-contained feature code:
  `lib/` (pure logic), `components/` (UI), `data/` (static content)
- `src/components/shared/` — cross-feature layout and marketing
  section components
- `src/components/ui/` — shadcn-generated; never hand-edited
- `src/lib/` — Supabase clients, utilities, constants
