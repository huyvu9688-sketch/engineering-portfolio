# Architecture Context

## Stack

| Layer         | Technology                        | Role                                                   |
| ------------- | --------------------------------- | ------------------------------------------------------ |
| Framework     | Next.js 16 (App Router) + TypeScript | Frontend pages + API routes in one project           |
| UI            | Tailwind CSS v4                   | Styling — CSS-first, token-driven, no separate config  |
| Animation     | GSAP + ScrollTrigger              | Marketing-surface scroll animation, stagger, timelines |
| Smooth Scroll | Lenis                             | Physics-based smooth scroll on marketing pages         |
| 3D (CAD)      | Three.js (vanilla JS engine)      | CAD viewer only — `features/toolkit/viewer/`           |
| Auth          | Supabase Auth                     | Admin sign-in only (single admin user)                 |
| Database      | Supabase (PostgreSQL)             | File metadata, categories, project data                |
| File Storage  | Supabase Storage                  | STEP/SLDPRT/GLB/PDF binaries                           |
| Hosting       | Vercel                            | Deployment, CI on git push                             |

## System Boundaries

- `src/app/(site)/` — public routes with shared navbar/footer:
  home, portfolio, tools, database pages. Thin; pages compose
  features.
- `src/app/(fullscreen)/` — routes that run without navbar/footer
  (e.g. `/tools/cad-viewer` fills the full viewport).
- `src/app/api/` — server endpoints. Owns auth checks and Supabase
  mutations. Nothing else calls Supabase with write access.
- `src/features/portfolio/` — project data plus project card and
  detail components.
- `src/features/calculators/` — all calculator logic and UIs.
  `lib/` holds pure math functions (no React, no I/O);
  `components/` holds the UIs that call them.
- `src/features/file-database/` — file listing, filters, upload
  form, download handling.
- `src/features/toolkit/viewer/` — CAD viewer. Engine in
  `lib/*.js` (plain JS, excluded from tsconfig, typed via
  `viewer-core.d.ts`); React shell in `components/cad-viewer.tsx`.
- `src/components/shared/` — navbar, footer, layout shells, and all
  marketing section components (hero, marquee, about, projects,
  services, credentials, form, cursor, magnetic button, page
  transition, split text reveal).
- `src/components/ui/` — shadcn-generated components. Generated
  code; do not hand-edit.
- `src/lib/` — Supabase client setup, shared utilities, constants.
  No feature-specific code.

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
- Utility pages (`/tools`, `/database`) do NOT use Lenis — native
  scroll only.

**CSS animations** (`@keyframes`, scroll-driven `animation-timeline:
view()`) handle: marquee scroll, page transition, hover states,
status-bar pulse. These never depend on GSAP.

Animation components live in `src/components/shared/` alongside the
section components they serve. No standalone `/animations/` folder.

## Storage Model

- **PostgreSQL (Supabase)**: file metadata (name, category, type,
  size, storage path, description, upload date), categories, and
  portfolio project records once they outgrow the static data file.
- **Supabase Storage**: the actual binaries — STEP, SLDPRT, GLB,
  PDF. The database stores only the storage path, never file content.
- **Static data files** (`features/portfolio/data/`): portfolio
  project content during early phases, before DB migration.

## Auth and Access Model

- All content is publicly readable; no visitor accounts exist.
- One admin account (Joe) signs in via Supabase Auth.
- All mutations (upload, edit, delete) require the admin session,
  enforced in API routes AND by Supabase Row Level Security
  policies — never by UI hiding alone.

## Invariants

1. Calculator math lives in pure functions under
   `features/toolkit/lib/` — no React, no fetch, no Supabase
   imports. UIs only call these functions.
2. File binaries never go in the database; metadata never goes in
   Storage. Path lives in DB, bytes live in Storage.
3. Every mutation endpoint verifies the admin session before any
   write. RLS policies back this at the database level.
4. Features do not import from other features. Shared code goes in
   `src/lib/` or `src/components/shared/`.
5. No hardcoded colors — all styling uses the tokens defined in
   `ui-context.md`.
6. GSAP and Lenis are only initialized on marketing surfaces
   (`"use client"` components). Never on utility pages or in the
   CAD viewer.
7. Three.js (CAD viewer) is excluded from the TS program
   (`tsconfig.json`) so the language server never crawls its
   types — engine is plain JS with a hand-written `.d.ts`.
