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
- Validate unknown external input (form data, API payloads, third-party
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

## Testing

- Pure logic lives in `features/*/lib/` and is unit-tested;
  co-locate tests as `*.test.ts` next to the module.
- Tests use the built-in Node test runner (`node:test` +
  `node:assert/strict`) — no separate test framework.
- Import the module under test with its explicit `.ts` extension
  (the runner needs it; `tsconfig` sets `allowImportingTsExtensions`).

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

No API routes exist right now (removed with Database, 2026-07-03). If any are added
back: validate and parse request input before any logic runs, enforce auth before any
mutation (401/403 early), and return consistent response shapes (`{ data }` on success,
`{ error: string }` on failure with correct HTTP status codes).

## File Organization

- `src/app/` — routes only; thin pages that compose features
- `src/features/<name>/` — self-contained feature code:
  `lib/` (pure logic), `components/` (UI), `data/` (static content)
- `src/components/shared/` — cross-feature layout and marketing
  section components
- `src/components/ui/` — shadcn-generated; never hand-edited
- `src/lib/` — shared utilities, constants
