# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Phase 1 — Foundation & landing page: COMPLETE (deployed, live at https://engineering-portfolio-svy8.vercel.app)
- Phase 2 — Portfolio: COMPLETE (units 1 & 2 done; resume DROPPED; 3D viewer REMOVED 2026-06-14)
- Phase 3 — Toolkit: IN PROGRESS (unit converter DONE; motor-sizing slices 1–4 DONE; pneumatic pending; CAD viewer re-added 2026-06-15)
- Phase 4 — Database: COMPLETE (deployed 2026-06-22; schema, RLS, auth, upload/browse/search/download, PDF text search, file-type categories)

## Session Notes (most recent first)

- **2026-06-22 (WRAP-UP, Database deploy)**: Phase 4 file database shipped and deployed.
  - **Schema/auth/storage** (Supabase): `documents`/`projects`/`app_admins` tables, RLS
    (public read, admin-only write via `is_admin()`), public-read Storage bucket, 50 MB cap,
    weighted tsvector search trigger. Three-layer write lock: Auth signups disabled, RLS,
    `requireAdmin()` re-check in every API route. No service-role key in the app.
  - **Consolidated UX**: upload + delete moved onto the public `/database` page (visible
    only when signed in), drag-and-drop upload card, auto category detection from file
    extension. `/admin` reduced to login-only, auto-redirects to `/database`. Projects
    removed from the UI (schema kept dormant for later). Footer has a discreet Admin link.
  - **PDF full-text search**: `unpdf` (lazy-loaded, admin-only bundle cost) extracts PDF
    body text client-side at upload; stored in `content_text`; folded into the search
    `tsvector` with weighted ranking (title > description/tags > body).
  - **Categories rebuilt twice this session**: first attempt grouped by document purpose
    (datasheet/standard/report) — all four of those accepted `.pdf`, so auto-detect always
    guessed the same category. Replaced with 11 categories keyed to literal file type
    (CAD, 3D Model, PDF, Word, Excel, CSV, PowerPoint, Image, Text, Archive, Video) where
    every extension belongs to exactly one category — detection is now always exact.
    `firstCategoryForExtension()` in `categories.ts` is the single source of truth.
  - **Migrations 0001–0004** all run live on Supabase by the owner (interactively, with a
    few SQL/dashboard hiccups along the way — see commit history for fixes). Pushed to
    `main` (`7a32ee8`) and Vercel auto-deployed via GitHub integration.
  - Ship test (upload as admin, download as anonymous visitor) — owner to confirm on the
    live deployed URL.

- **2026-06-19 (WRAP-UP, CAD viewer)**: Face picking + measure + export upgrades.
  - **Face selection** rewritten (`face-select.js`): coplanar-normal scan replaced with
    BFS flood-fill along shared edges, stopping at >40° dihedral feature edges. Now selects
    whole curved faces (cylinders, tubes, spheres) not just flat ones. Per-mesh tri-normal
    and edge-adjacency caches on `geometry.userData` keep hover cheap after first build.
  - **Measure** (`measure.js`): distance mode auto-detects cylindrical picks via
    `FaceSelector.analyzeFace` (least-squares circle fit → axis centre). Two cylinder picks →
    "Axis C–C" between centres; mixed/flat → original axis-aligned gap. Marker spheres
    halved (0.008→0.004 of model size), 12-seg.
  - **STL export** added (`viewer-core.js` `exportSTL`): dynamic-imports `STLExporter`, bakes
    each visible mesh's world matrix into cloned geometry, writes one binary STL at full
    tessellation (no decimation). Toolbar Download button (`#export-stl`).
  - **Render / "RealView" mode: ATTEMPTED THEN REMOVED.** Tried post-processing
    (SSAO+bloom+SMAA, then SMAA-only) and a lights+reflective-floor "quality view" —
    both looked worse (bloom blew out light parts; SSAO haloed DoubleSide/transparent
    materials). Fully reverted; `render-mode.js`/`quality-view.js` deleted. Do not re-add
    screen-space post FX to this viewer.
  - **Cleanup**: removed dead emissive-hover system (`setHover`/core `clearHover`,
    `HOVER_COLOR`/`HOVER_INTENSITY`, `hoveredMesh`/`hoverSaved`) — superseded by
    `faceSelector` overlay hover and never called. Lint + build + 21 tests green.

- **2026-06-19 (WRAP-UP)**: Section title scroll animations. Created `ScrollSectionTitle`
  (`src/components/shared/scroll-section-title.tsx`) — self-contained scroll-driven
  component: letters fall outside-in (outermost first), lerped progress
  (`current += delta * 0.10` in a RAF loop), ease-out sine, clipped by
  `.split-word { overflow: hidden }`. Applied to Works, Services, Credentials.
  Unified all three to `clamp(3.5rem,11vw,11rem) / tracking -0.04em`.
  About section and marquee switched to light canvas (`bg-canvas`, `text-ink`).
  Removed `prefers-reduced-motion` guard from `reveal.tsx`, `split-text.tsx`, and the
  `globals.css` animation-override block. All animations now run unconditionally —
  owner's OS has reduced-motion ON and gating kills everything.

- **2026-06-18 (WRAP-UP)**: ROOT CAUSE of all past animation failures confirmed: owner's
  OS has `prefers-reduced-motion: reduce` ON, silently disabling reveals via `globals.css`.
  Fixed by removing those overrides. `SplitText` gained `centerOut` prop (outermost
  letters first, fall from above). About section wired with scroll-driven letter reveal
  in `about-section.tsx` (lerp + ease-out sine).

- **2026-06-17 (WRAP-UP)**: Home page 1:1 Olha clone. Section order:
  hero → marquee → about → works → services → credentials → contact form → footer.
  Built `ProjectsSection`, `AwardsSection`, `FormSection`; rebuilt `Footer`.
  `PageTransition` added. Hero: Sofia Sans Condensed giant headline,
  gray descriptor box + portrait, `BASED IN VIETNAM` label.

- **2026-06-16 (WRAP-UP)**: CAD Viewer expansion — fullscreen route, TrackballControls,
  custom view cube (scissored corner render), explode slider, section cut (X/Y/Z/flip/
  face-align), face properties card (area, axis, material, weight), volume readout,
  3-mode measure (distance/diameter/C-C). Curved-face selection attempted then REVERTED
  at owner request — strip-highlight on round faces is a known limit.

- **2026-06-15 (WRAP-UP)**: Re-added CAD Viewer as `/tools/cad-viewer`. Engine rebuilt
  in `src/features/toolkit/viewer/lib/*.js`. Full-screen, component tree, isolate,
  measure, explode, edges, section cut, face selection. Motor-sizing slice 4
  (stepper + AC acceptance, discriminated union, duty cycle) DONE. 21/21 tests.

- **2026-06-14 (WRAP-UP)**: Unit converter built (Phase 3 unit 1, 5/5 tests).
  Motor-sizing slices 1–3: engine + direct + lead/ball screw + belt + rack & pinion +
  index table (16/16 tests, Repanich cross-checks). 3D viewer removed from Portfolio
  (unrecoverable black-viewport). Resume DROPPED. Phase 2 closed.

- **2026-06-13 (WRAP-UP)**: Phase 1 complete. Scaffold, tokens, navbar, footer, marquee,
  custom cursor, hero, landing page, deployed to Vercel. Phase 2 portfolio listing +
  detail pages. 3D viewer (many iterations). Pushed to GitHub `main`.

## Phase Plan

1. **Phase 1** — Setup, theme, landing page, deploy ✅
2. **Phase 2** — Portfolio listing + detail pages ✅ (resume DROPPED; viewer REMOVED)
3. **Phase 3** — Toolkit: unit converter ✅ · motor sizing ✅ · pneumatic (pending) · CAD viewer ✅
4. **Phase 4** — Database: Supabase, admin auth, upload, browse/download ✅
5. **Phase 5+** — Tolerance/fit calc, standard parts library, formula reference

## Current Goal

Phase 4 shipped and deployed. Phase 3 pneumatic calculator still BLOCKED — owner must
fill §2 of `calculator-specs.md`. Motor-sizing slice 5 (optional: hoist, preload,
multi-RMS) low priority. Portfolio inner pages still need Olha design treatment.

## Completed

- Scaffold: Next.js 16, TypeScript, Tailwind v4, App Router, `src/` layout
- Theme tokens in `globals.css` (Tailwind CSS-first; no hardcoded hex in components)
- Shared components: navbar, footer, marquee, `Reveal`, custom cursor, `ScrollSectionTitle`
- Home page (Olha clone): hero → marquee → about → works → services → credentials → contact → footer
- Section title scroll animation via `ScrollSectionTitle` (outside-in, lerped, ease-out sine)
- Phase 2 units 1 & 2: portfolio listing + project detail pages
- Phase 3 unit 1: unit converter (length, force, pressure, torque, power, flow)
- Phase 3 unit 3 slices 1–4: motor-sizing (engine + 5 mechanisms + servo/stepper/AC)
- CAD Viewer (`/tools/cad-viewer`): fullscreen, tree, isolate, BFS curved-face pick,
  measure (incl. cylinder axis C–C), explode, section cut, face props, STL export
- Phase 4 Database (`/database`): Supabase schema + RLS, admin-only write (Auth +
  RLS + API guard), drag-and-drop upload with auto file-type categorization (11
  categories), full-text search incl. PDF body text, public download, deployed to Vercel

## In Progress

- None.

## Next Up

### Marketing surfaces (Olha quality bar)

- **Portfolio inner pages**: listing + detail pages still use old design. Apply Olha
  treatment: clip-path image wipes, scroll reveals, hover previews.
- **Content**: owner to provide real project write-ups, photos, experience details.

### Toolkit (Phase 3)

- Pneumatic cylinder calculator: BLOCKED until owner fills §2 of `calculator-specs.md`.
- Motor-sizing slice 5 (optional): vertical hoist, ball-screw preload, multi-segment RMS.

### Infra

- shadcn/ui: defer until a richer primitive is needed.
- Database fast-follows (deferred, see spec §9): metadata edit UI (PATCH routes already
  built), part numbers/BOMs/revision history (out of scope), download analytics, private
  files/signed URLs, "open in CAD viewer" deep link from a document card.

## Open Questions

- All `[bracketed]` placeholder content (project write-ups, role titles, company names,
  education, location) — owner to fill before shipping.
- Pneumatic calculator: owner to fill §2 of `calculator-specs.md`.
- Mechanism illustration PNGs: drop in `/public/mechanisms/` (filenames in `README.md` there).

## Pre-Flight Checklist

- [x] Node.js LTS, GitHub repo (`huyvu9688-sketch/engineering-portfolio`), Vercel linked
- [ ] Content: 2–3 project writeups + photos
- [ ] Mechanism PNGs in `/public/mechanisms/`

## Architecture Decisions

- **SI units**: coherent SI (m, N, Pa, N·m, W, m³/s) internal base; display conversion
  at UI layer only.
- **Calculator pattern**: pure logic + `node --test` tests in `src/features/toolkit/lib/`;
  calm client UI in `src/features/toolkit/components/`. No test framework — Node 26
  strips TS types natively.
- **Animation**: Section titles use `ScrollSectionTitle` (custom scroll-driven JS, no
  GSAP/Lenis). General reveals use `Reveal` (IntersectionObserver). Marquee always runs.
  **Never gate any animation on `prefers-reduced-motion`** — owner's OS has it ON and
  it kills everything.
- **3D Viewer (Toolkit)**: vanilla JS engine in `src/features/toolkit/viewer/lib/*.js`,
  excluded from tsconfig, typed via `.d.ts`. React shell dynamically imports on client.
  `three@0.184`. Face picking is BFS flood-fill (40° feature-edge stop) for curved faces.
  ⚠️ Do NOT add `ViewHelper` without `renderer.autoClear = false` — it clears the canvas
  every frame. ⚠️ Do NOT add screen-space post-processing (SSAO/bloom/composer) or a
  "render/RealView" mode — tried 2026-06-19, looked worse on real CAD models, reverted.
- **3D Viewer (Portfolio)**: REMOVED 2026-06-14. Use `<model-viewer>` web component if
  revisited.
- **shadcn/ui**: not yet installed. Native token-styled controls for calculators.
- **Deploy**: push `main` → Vercel auto-deploys. Owner confirms before push.
  Dev server run by owner — do NOT launch in IDE.
- **Database security model**: owner is the only writer, everyone else is read-only —
  enforced at three layers (Supabase Auth signups disabled, RLS via `app_admins` +
  `is_admin()`, and `requireAdmin()` re-check in every API route). No service-role key
  ships in the app; only the public URL + anon key, which are safe to expose because RLS
  is the real guard.
- **Database categories**: keyed to literal file type (CAD, 3D Model, PDF, Word, Excel,
  CSV, PowerPoint, Image, Text, Archive, Video) in `categories.ts`, the single source of
  truth for both validation and the UI. Every extension belongs to exactly one category —
  do NOT let any future category share an extension with another; that breaks
  `firstCategoryForExtension()`'s auto-detect on upload (this happened once already with
  a purpose-based taxonomy where 4 categories all accepted `.pdf`).
- **Database file upload**: browser uploads the binary straight to Supabase Storage
  (bypasses Vercel's ~4.5 MB serverless body cap), then POSTs only metadata to the API
  route. PDF body text is extracted client-side via lazy-loaded `unpdf` (admin-only
  bundle cost) and folded into the search `tsvector` with weighted ranking.
