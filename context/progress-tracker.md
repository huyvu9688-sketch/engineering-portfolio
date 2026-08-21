# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Phase 1 — Foundation & landing page: COMPLETE (deployed, live at https://engineering-portfolio-svy8.vercel.app)
- Phase 2 — Portfolio: COMPLETE (units 1 & 2 done; resume DROPPED; 3D viewer REMOVED 2026-06-14)
- Phase 3 — Toolkit: REMOVED 2026-07-03 (owner request)
- Phase 4 — Database: REMOVED 2026-07-03 (owner request, after Supabase was pulled out earlier the same day)

## Session Notes (most recent first)

- **2026-08-21 (Deploy blocker: 2.3.mp4 → Vercel Blob)**: First deploy attempt to
  `josephvu-s-projects/engineering-portfolio-svy8` failed — `public/2.3.mp4` (206 MB) exceeds
  Vercel's 100 MB per-file upload limit (separate from GitHub's, which Git LFS already
  handles). `2.3.mp4` is not referenced by any project (`projects.ts` only uses `1.mp4` and
  `2.mp4`) — owner confirmed it's for future use, undecided which project/placement.
  Uploaded it to a new public Vercel Blob store (`portfolio-media`,
  `store_rCbDU7AIlN7mOMWA`) instead of compressing:
  `https://rcbdu7ailn7momwa.public.blob.vercel-storage.com/2.3.mp4`
  Removed `public/2.3.mp4` from the repo (Git LFS entry too) so the deploy isn't blocked.
  When wired into a project, reference this Blob URL directly in a `<video src>` — no
  need to re-add the file to `public/` or `@vercel/blob` SDK (a plain URL is enough for
  playback; the SDK is only needed for programmatic upload/delete, which isn't used here).
  Vercel CLI installed locally via `npm install --no-save --ignore-scripts` (global/scripted
  installs failed: Node v26.5.1 has a spawnSync bug with the space in this folder's path
  — `D:\5. Mechanical App\...` — that breaks native-binary postinstall scripts like esbuild's;
  `--ignore-scripts` sidesteps it). Project linked via `vercel link` to
  `josephvu-s-projects/engineering-portfolio-svy8`. Owner deferred the actual `vercel --prod`
  deploy to another machine.

- **2026-08-21 (Works media + Verona 3D model)**: Completed and pushed the project-media
  update to `main` (`c4579ab`).
  - Works cards use `/1.png`, `/2.png`, and `/3.png` for Foam Cell Automation, Auto Router
    Cell, and Verona Expansion respectively; card images use `object-contain` padding so the
    full engineering view is visible.
  - Project detail media rotates every five seconds: project 1 uses `/1.png` + `/1.1.png`
    and `/1.mp4`; project 2 uses `/2.png` + `/2.1.png` and `/2.mp4`; Verona uses `/3.png`
    + `/3.1.png`. `/3.2.png` and `/2.3.mp4` are intentionally not shown.
  - Verona’s media slot now contains an interactive GLB model. The original SolidWorks GLB
    falsely labelled embedded DDS data as PNG, which caused browser texture failures.
    `/12400_10000.web.glb` is the Git-LFS-tracked, web-safe derivative with only invalid
    texture bindings removed; it retains the model geometry and material colours.
  - `<model-viewer>` was incompatible with this model’s scene graph (repeated “Mesh is
    missing primitive index association” errors), so `ProjectModelViewer` now uses direct
    Three.js with `GLTFLoader`, local Draco decoder assets (`public/draco/`), orbit controls,
    and gentle auto-rotation. A fresh headless Edge load reports no GLTF texture or
    primitive-association errors. Lint and all 3 Node tests pass. The local production build
    was terminated during Turbopack optimisation without a source diagnostic, so browser
    verification is the current end-to-end evidence.

- **2026-08-20 (Scroll-title runtime fix)**: Fixed `Cannot read properties of null (reading
  'style')` in the About and reusable `ScrollSectionTitle` animations. React can detach a
  letter ref while a queued animation frame is still running; transform application now skips
  detached refs. About now reuses `ScrollSectionTitle`, removing the duplicated unsafe loop.
  Added `scroll-letter-animation.test.ts` to cover the detached-ref case; tests and production
  build pass.

- **2026-08-20 (Home page content pass)**: Owner-driven content updates from resume +
  reference screenshots.
  - `about-section.tsx`: `EXPERIENCE` filled in with real roles (Mechanical Design
    Engineer @ Ashley Furniture, Automation Engineer @ Panasonic Electric Works,
    Production Foreman @ Panasonic Electric Works), replacing `[placeholder]` entries.
  - `navbar.tsx`: "Projects" nav link now scrolls to the home page Works section
    (`/#works`, `ProjectsSection`'s id) instead of navigating to `/portfolio`. "Contact
    me" now points to `mailto:huyvu9688@gmail.com` directly (the `/#contact` anchor it
    used to target never existed — `FormSection`'s id was `connect`, and that section is
    now removed anyway).
  - Contact form section removed at owner's request: `<FormSection />` dropped from
    `page.tsx`, `form-section.tsx` deleted outright. Footer already carries direct
    email/phone contact, so no replacement was needed. `SplitText` component left in
    place (generic, reusable) even though currently unused.
  - `services-section.tsx` rewritten: cards 03/04 retitled from "Drive Sizing"/"Controls"
    to "AI" (Vibe Coding, AI Platforms, Automation Tools, Prompt Engineering, Workflow
    Automation) and "Lean and Quality" (Kaizen, Kanban, 7 QC Tools, Six Sigma, 5S). Cards
    01/02 keep their titles but got new capability lists (Robotics/Machine Vision/Safety
    Engineering/Manufacturing Improvement; SolidWorks/AutoCAD/Manufacturing Processes/
    Materials). Also dropped the per-card mechanism-illustration `<Image>` — those files
    (`public/mechanisms/*.png`) were already deleted from disk in an earlier, uncommitted
    session (matches the 2026-07-03 Toolkit removal note below) and the `img` src's were
    dangling. `projects-section.tsx` and `awards-section.tsx` still reference
    `/mechanisms/*.png` too — pre-existing, out of scope for this session, flagged for
    the owner to fix next time those sections are touched.

- **2026-07-03 (Toolkit + Database removal)**: Owner asked to remove the entire Tools and
  Database functionality. Deleted outright:
  - Routes: `(site)/tools/` (unit converter, motor-sizing), `(fullscreen)/tools/cad-viewer/`,
    `(site)/database/`, `admin/`, `api/documents/`, `api/projects/`
  - Feature code: `src/features/toolkit/` (calculators + Three.js CAD viewer engine),
    `src/features/file-database/` (upload/browse/search components + lib)
  - Assets: `public/mechanisms/` (mechanism illustration PNGs, toolkit-only)
  - Deps: `three`, `unpdf` (no longer used by anything)
  - Nav: removed "Tools"/"Database" links from `navbar.tsx`, "Tools" link and "Admin"
    link from `footer.tsx`
  - `tsconfig.json`: dropped the now-dead `toolkit/viewer/lib` exclude entry
  - Portfolio (Phase 1–2) and its home-page marketing sections never referenced Tools or
    Database, so nothing there needed changing.
  - Earlier the same session: Supabase itself (SDK, `src/lib/supabase/`, `src/proxy.ts`,
    `.env.local.example`) was removed first, at the owner's request, before the owner
    decided to drop the whole feature rather than rebuild it on a new backend.
  - `context/architecture.md`'s Supabase-era stack table and file-database code-standards
    references are now historical only — see the stale-notice banner added to
    `architecture.md`.

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
3. **Phase 3** — Toolkit ❌ REMOVED 2026-07-03
4. **Phase 4** — Database ❌ REMOVED 2026-07-03
5. **Phase 5+** — Tolerance/fit calc, standard parts library, formula reference (open —
   owner to say whether this is still wanted now that Toolkit is gone)

## Current Goal

Toolkit and Database are both gone. The site is back to Phases 1–2 scope: landing page +
portfolio. Portfolio inner pages still need the Olha design treatment. Everything under
"Toolkit (Phase 3)" and the pneumatic calculator work below is moot unless the owner
decides to rebuild it.

## Completed

- Scaffold: Next.js 16, TypeScript, Tailwind v4, App Router, `src/` layout
- Theme tokens in `globals.css` (Tailwind CSS-first; no hardcoded hex in components)
- Shared components: navbar, footer, marquee, `Reveal`, custom cursor, `ScrollSectionTitle`
- Home page (Olha clone): hero → marquee → about → works → services → credentials → contact → footer
- Section title scroll animation via `ScrollSectionTitle` (outside-in, lerped, ease-out sine)
- Phase 2 units 1 & 2: portfolio listing + project detail pages

## In Progress

- None.

## Next Up

### Marketing surfaces (Olha quality bar)

- **Portfolio inner pages**: listing + detail pages still use old design. Apply Olha
  treatment: clip-path image wipes, scroll reveals, hover previews.
- **Content**: owner to provide real project write-ups, photos, experience details.

### Infra

- shadcn/ui: defer until a richer primitive is needed.
- Toolkit/Database: both removed 2026-07-03. If either is revisited, treat it as new
  scoping work — the old `architecture.md`/`code-standards.md` sections describing them
  are historical reference only, not a spec to resume from as-is.

## Open Questions

- All `[bracketed]` placeholder content (project write-ups, role titles, company names,
  education, location) — owner to fill before shipping.
- Whether Toolkit and/or Database get rebuilt at all, and on what backend (Database used
  Supabase before removal) — no decision made, not currently planned.

## Pre-Flight Checklist

- [x] Node.js LTS, GitHub repo (`huyvu9688-sketch/engineering-portfolio`), Vercel linked
- [ ] Content: 2–3 project writeups + photos

## Architecture Decisions

- **Animation**: Section titles use `ScrollSectionTitle` (custom scroll-driven JS, no
  GSAP/Lenis). General reveals use `Reveal` (IntersectionObserver). Marquee always runs.
  **Never gate any animation on `prefers-reduced-motion`** — owner's OS has it ON and
  it kills everything.
- **3D Viewer (Portfolio)**: Verona Expansion uses a direct Three.js GLTF/Draco renderer in
  `ProjectModelViewer`. Do not reintroduce `<model-viewer>` for this SolidWorks-derived
  model: its scene-graph layer logs missing primitive associations. Keep GLB assets under
  Git LFS and use web-safe texture data.
- **shadcn/ui**: not yet installed.
- **Deploy**: push `main` → Vercel auto-deploys. Owner confirms before push.
  Dev server run by owner — do NOT launch in IDE.

### Removed (Toolkit + Database, 2026-07-03)

Kept as tribal knowledge in case either feature is rebuilt — none of this reflects
current code, all of it was deleted:
- Toolkit calculators used coherent SI internal units (m, N, Pa, N·m, W, m³/s) with
  display conversion at the UI layer, and a pure-logic/`node --test` pattern.
- The Toolkit's CAD viewer's curved-face picking was BFS flood-fill (40° feature-edge
  stop); screen-space post-processing (SSAO/bloom/composer) was tried and reverted twice
  — looked worse on real CAD models.
- The Database's security model layered Supabase Auth signup-disable + RLS + a
  `requireAdmin()` API re-check so the owner was the only writer.
- The Database's file-type categories (CAD, 3D Model, PDF, Word, Excel, CSV, PowerPoint,
  Image, Text, Archive, Video) were designed so every extension mapped to exactly one
  category, after an earlier purpose-based taxonomy broke auto-detection.