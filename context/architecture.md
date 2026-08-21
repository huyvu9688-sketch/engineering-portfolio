# Architecture Context

> **Toolkit and Database removed 2026-07-03** at the owner's request. Everything below
> that mentions Supabase, `features/toolkit/`, or `features/file-database/` is historical
> — kept as reference in case either feature is rebuilt, not a description of current
> code. See `progress-tracker.md` for what was deleted.

## Stack

| Layer         | Technology                        | Role                                                   |
| ------------- | --------------------------------- | ------------------------------------------------------ |
| Framework     | Next.js 16 (App Router) + TypeScript | Frontend pages in one project                        |
| UI            | Tailwind CSS v4                   | Styling — CSS-first, token-driven, no separate config  |
| Animation     | GSAP + ScrollTrigger              | Marketing-surface scroll animation, stagger, timelines |
| Smooth Scroll | Lenis                             | Physics-based smooth scroll on marketing pages         |
| Hosting       | Vercel                            | Deployment, CI on git push                             |

## System Boundaries

- `src/app/(site)/` — public routes with shared navbar/footer: home
  and portfolio pages. Thin; pages compose features.
- `src/features/portfolio/` — project data plus project card and
  detail components. Project media lives in `public/`; `.glb` assets
  are tracked with Git LFS and rendered client-side with direct Three.js
  + GLTF/Draco loaders.
- `src/components/shared/` — navbar, footer, layout shells, and all
  marketing section components (hero, marquee, about, projects,
  services, credentials, form, cursor, magnetic button, page
  transition, split text reveal).
- `src/components/ui/` — shadcn-generated components. Generated
  code; do not hand-edit.
- `src/lib/` — shared utilities and constants. No feature-specific
  code.

### Removed (historical reference only)

- `src/app/(fullscreen)/` — held `/tools/cad-viewer` (ran without
  navbar/footer to fill the viewport). Removed with Toolkit.
- `src/app/api/` — held the Database feature's auth-checked Supabase
  mutation endpoints. Removed with Database; no API routes exist now.
- `src/features/toolkit/` — calculator logic/UIs (`lib/` pure math,
  `components/` UIs) plus `viewer/` (Three.js CAD viewer engine in
  plain JS, typed via a hand-written `.d.ts`, excluded from tsconfig).
- `src/features/file-database/` — file listing, filters, upload
  form, download handling.

## Animation Architecture

GSAP is the primary animation library for all marketing-surface
scroll effects. CSS animations handle simpler self-contained effects.

**GSAP patterns used on marketing surfaces:**
- `gsap.fromTo()` + `ScrollTrigger` for per-letter / per-section
  scroll reveals (`start: "top 90%"`, `toggleActions: "play none
  none none"`)
- `gsap.timeline()` for sequenced entrance animations
- `stagger` on `.split-letter` spans for per-letter effects
- `scrub: 1` for scroll-scrubbed parallax or title translations

**Lenis integration:**
- Lenis wraps the document scroll on marketing pages for physics-
  based smoothing. Initialize Lenis in a root layout client component
  and sync it to GSAP's ticker: `gsap.ticker.add(time =>
  lenis.raf(time * 1000))`. Do NOT call `lenis.raf` inside a
  `requestAnimationFrame` loop separately.

**CSS animations** (`@keyframes`, scroll-driven `animation-timeline:
view()`) handle: marquee scroll, page transition, hover states,
status-bar pulse. These never depend on GSAP.

Animation components live in `src/components/shared/` alongside the
section components they serve. No standalone `/animations/` folder.

## Storage Model

- **Static data files** (`features/portfolio/data/`): portfolio
  project content during early phases, before DB migration.
- **Static project media** (`public/`): project images/videos and
  Git-LFS-tracked GLB models referenced by portfolio data.

## Auth and Access Model

- All content is publicly readable; no visitor accounts or admin
  auth exist in the app right now (removed with Database).

## Invariants

1. Features do not import from other features. Shared code goes in
   `src/lib/` or `src/components/shared/`.
2. No hardcoded colors — all styling uses the tokens defined in
   `ui-context.md`.
3. GSAP and Lenis are only initialized on marketing surfaces
   (`"use client"` components).
