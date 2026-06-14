# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Phase 1 — Foundation & landing page: COMPLETE (deployed,
  verified live at https://engineering-portfolio-svy8.vercel.app)
- Phase 2 — Portfolio: IN PROGRESS (units 1, 2, and the unit-4
  viewer core done; unit 3 deferred; unit-4 measurement + view
  cube remaining)

## Phase Plan

1. **Phase 1** — Project setup, theme tokens, navbar/footer,
   landing page, deploy to Vercel ✅ DONE
2. **Phase 2** — Portfolio: about, resume, project cards,
   project detail page, GLB viewer embed
   1. Project data model (`features/portfolio/data/`) + project
      card component + `/portfolio` listing page (placeholder
      projects, same bracketed-placeholder pattern as the
      landing page's Background section)
   2. Project detail page route (`/portfolio/[slug]`)
   3. Resume download link/section
   4. Three.js (react-three-fiber) GLB viewer embed on project
      detail pages
3. **Phase 3** — Toolkit: unit converter → pneumatic cylinder
   calculator → motor sizing calculator
4. **Phase 4** — Database: Supabase setup, schema + RLS,
   admin auth, upload, browse/filter, download
5. **Phase 5+** — Tolerance/fit calculator, standard parts
   library, formula reference, blog/notes

## Current Goal

- Phase 2, unit 4b: add the measurement tool + view cube to the
  3D viewer, and replace the temporary demo model with a real GLB.
- Phase 2, unit 3 (resume download): DEFERRED at owner's request —
  jumped to unit 4 first. Revisit after the viewer is finished.

## Completed

- Next.js 16 scaffold (TypeScript, Tailwind v4, App Router,
  `src/` layout, `@/*` → `./src/*`) — 2026-06-13
- All ui-context.md color/font tokens defined in `globals.css`
  (Tailwind v4 CSS-first config; no hardcoded hex in components)
  — 2026-06-13
- Shared components in `src/components/shared/`: navbar
  (fixed, mix-blend-difference, pill links), footer (dark band,
  oversized wordmark), marquee (CSS-only scroll), reveal
  (IntersectionObserver, plays once), custom cursor (fine
  pointers only), magnetic button — 2026-06-13
- Landing page at `src/app/(site)/page.tsx`: hero with per-line
  blur+rise reveal + status badge + accent glow, skills marquee,
  three entry cards (Portfolio / Toolkit / Database), contact
  band. All motion respects `prefers-reduced-motion` —
  2026-06-13
- Calm placeholder pages for `/portfolio`, `/tools`,
  `/database` so navigation works end to end — 2026-06-13
- `npm run build` passes; all 5 routes prerender static;
  verified 200 + content via dev server — 2026-06-13
- Landing page restyle pass (structural patterns adapted from
  an external single-page portfolio reference, owner-supplied;
  content rewritten for EngiHub) — 2026-06-13:
  - Hero centered (was left-aligned), heading scaled up to
    `text-[13vw] md:text-[10vw]`, subtitle and CTAs centered
  - Status badge restyled to a glass pill (`bg-surface/40
    backdrop-blur-md`) with three accent bars pulsing opacity
    on independent timers, replacing the earlier scaleY bars
  - New `AboutSection` component (`src/components/shared/
    about-section.tsx`): two-column "Background" section with
    sticky intro + education card on the left, vertical
    experience timeline on the right. **Content is placeholder
    (bracketed) — owner to fill in real role/company/education
    details**
  - Contact band gained a "Status: Available for new projects"
    eyebrow and a scroll-to-top button
    (`scroll-to-top-button.tsx`)
  - Marquee gained pause-on-hover
  - `ui-context.md` updated to document the centered hero,
    glass status badge, and Background/Experience section
    conventions
  - `npm run build` passes; landing page verified via dev
    server (curl)
- Hero + contact copy/layout pass (Contact section restructured
  to match the external reference's centered layout; content
  rewritten for EngiHub) — 2026-06-13:
  - Hero title now "Joseph Vu" (was placeholder "Engineering
    Portfolio, Tools & Data"); status badge label changed to
    "Open to work"; subtitle shortened to "Engineering
    Portfolio" (owner to confirm/expand this tagline)
  - Contact section rebuilt: centered `max-w-[1200px]`, accent
    eyebrow ("Status: Open to work"), giant centered two-line
    heading (`text-5xl md:text-9xl`), centered email link with
    `Mail` icon and hairline-to-accent underline, and a
    4-column info grid (Socials / Location / Focus /
    scroll-to-top). **Socials links are `#` placeholders and
    Location is bracketed (`[City, Country]`,
    `[Remote / On-site]`) — owner to fill in**
  - `ui-context.md` updated with a new "Contact section"
    signature-component entry
  - `npm run build` passes; landing page verified via dev
    server (curl)
- Hero icon button + marquee diagnosis — 2026-06-13:
  - Added a third hero CTA: a circular `MagneticButton`-wrapped
    icon link (`ExternalLink` icon, `href="#"` placeholder,
    `target="_blank"`) next to "View Portfolio" / "Open
    Toolkit", matching the external reference's icon-button
    pattern. Note: lucide-react 1.18 has no brand icons (no
    `Github` export) — used `ExternalLink` instead
  - Diagnosed report of marquee "not floating/scrolling": the
    marquee CSS and markup are correct (verified compiled CSS
    has `.marquee-track { animation: 40s linear infinite
    marquee-scroll }`). Root cause was the dev machine having
    Windows "Show animations" OFF → `prefers-reduced-motion:
    reduce` true → our reduced-motion rule disabled it (same
    reason the custom cursor was invisible)
- Cursor + marquee reduced-motion exemption — 2026-06-13:
  - Owner asked (twice, with reference code) to make the
    elastic cursor and scrolling marquee actually show. Both
    were gated behind `prefers-reduced-motion`, which is true
    on the owner's machine. Decision: EXEMPT both from
    reduced-motion (they are core brand effects). Marquee now
    always scrolls; cursor now runs on any fine-pointer device
  - `CustomCursor` rewritten: dot tracks instantly, circle
    lerps (0.2) for an elastic trail, scales to 2× + translucent
    fill over `a, button, .magnetic-btn`; hides the native
    cursor via `body.custom-cursor-active { cursor: none }`
    (scoped so utility pages stay calm). Removed the
    setState-in-effect pattern (elements default `opacity-0`,
    revealed imperatively only on fine pointers — no touch flash)
  - `ui-context.md` motion rules + custom-cursor entry updated
    to document the exemption
  - `npm run build` passes; compiled CSS verified (marquee no
    longer in the reduced-motion block; `custom-cursor-active`
    rule present)

- Git + GitHub setup — 2026-06-13:
  - Initialized git repo (`main`), identity `Joseph Vu
    <huyvu9688@gmail.com>`, `.agents`/`skills-lock.json`
    git-ignored, default scaffold README replaced with a
    project README
  - Reconciled stale metadata in `layout.tsx`: title now
    "Joseph Vu — Engineering Portfolio" (was "EngiHub …", desc
    said "Joe"). EngiHub kept as internal working/package name
  - First commit (31 files, no heavy/ignored dirs) pushed to
    https://github.com/huyvu9688-sketch/engineering-portfolio
    (private). Verified remote `main` matches local HEAD

- Fix Vercel build failure (`EBADPLATFORM`) — 2026-06-13:
  - First Vercel deploy failed during `npm install` with
    `EBADPLATFORM` for `@tailwindcss/oxide-win32-x64-msvc`
    (wanted win32/x64, Vercel runners are linux/x64)
  - Root cause: that package was listed in BOTH
    `devDependencies` (hard dep — fails on platform mismatch)
    AND `optionalDependencies` (correctly skippable) in
    `package.json`/`package-lock.json`. Removed the duplicate
    `devDependencies` entry; the `optionalDependencies` entry
    alone is sufficient — npm installs it on win32/x64 (local
    dev) and silently skips it on linux/x64 (Vercel)
  - `npm run build` re-verified locally after the change —
    still passes
  - Committed and pushed to `main`; Vercel will auto-redeploy
  - Redeploy succeeded (commit `1c97c2a`, status Ready). Live at
    https://engineering-portfolio-svy8.vercel.app — verified
    hero, status badge, marquee, and contact section render
    correctly with no broken assets. Phase 1 deploy is DONE

- Real social links — 2026-06-13:
  - Contact section Socials (LinkedIn, GitHub) and the hero
    icon button now link to the owner's real profiles:
    https://www.linkedin.com/in/quochuyvu99 and
    https://github.com/huyvu9688-sketch (both `target="_blank"`)
  - `npm run build` passes

- Landing "Explore" section replaced with the index3 "showcase"
  layout (owner-supplied reference) — 2026-06-13:
  - Old "Explore / 001 — Entry Points" 3-card grid (Portfolio /
    Toolkit / Database) swapped for a morphed version of
    `engineering-portfolio/index3.html`: centred gradient
    headline → two floating tag pills over a fanned 6-image grid
    → subcopy → two CTAs. Structure/layout/motion kept from the
    reference; restyled to the EngiHub design system
  - New `ExploreShowcase` (`src/components/shared/
    explore-showcase.tsx`, server) composes the section; new
    `ShowcaseCards` (`showcase-cards.tsx`, client) holds the
    fanned grid + the reference's click-to-focus interaction
    (its inline `<script>` rebuilt as React state per
    code-standards.md; added keyboard + `aria-pressed` a11y)
  - Morph decisions: section is a full-bleed light band — owner
    asked for `bg-[oklch(0.97_0_0)]` / `text-[oklch(0.145_0_0)]`
    (Tailwind arbitrary values, the one intentional exception to
    the no-hardcoded-color rule, per explicit request). White→
    neutral gradient headline → `--ink`→`--ink-muted` clip-text
    gradient (kept the technique, avoided accent on a large
    headline). Two colored tag pills → one `--accent`, one
    `--ink` (single-accent system). Elaborate dark-glow primary
    button → standard primary pill (`bg-ink` → `hover:bg-accent`).
    Reference's load-triggered `fadeSlideIn` (0.1/0.3/0.5/0.7s)
    expressed via the project's scroll-triggered `<Reveal>` with
    matching `delayMs` (100/300/500/700)
  - PLACEHOLDERS to revisit: card images are the reference's
    remote Supabase URLs (`<img>`, lint-suppressed) — owner to
    replace; copy ("Showcase your work…", "designer"/"artist"
    tags, "Get started today"/"View Examples") is reference text;
    CTA targets are provisional (`/portfolio`, `/tools`).
    Removing the old section also removed the only on-page
    Portfolio/Toolkit/Database entry-point cards (still reachable
    via the navbar)
  - `npm run build` passes (clean `.next` rebuild); prerendered
    `/` verified to contain the new section and not the old one

- Phase 2 unit 1: portfolio data model + project card +
  `/portfolio` listing page — 2026-06-13:
  - New `Project` type + 3 placeholder entries in
    `src/features/portfolio/data/projects.ts` (slug, title,
    category, summary, tags, optional `image` path under
    `/public`). Content uses the same bracketed-placeholder
    pattern as `AboutSection` — owner to replace with real
    project write-ups
  - New `ProjectRow` (`src/features/portfolio/components/
    project-row.tsx`, server component) implements the
    `ui-context.md` "Project rows" spec: alternating 7/5 grid,
    mono accent eyebrow with `Cog` icon, bordered pill tech
    chips, "View Project" + `ArrowUpRight` link, whole row
    wrapped in a `Link` to `/portfolio/[slug]`. When
    `project.image` is set it renders via `next/image` with the
    spec's grayscale→color hover; until then it shows a
    placeholder box (`ImageOff` icon + "[Project Visual]")
  - `/portfolio/page.tsx` rewritten: real listing (header +
    project count eyebrow, `CustomCursor` + `Reveal` per row —
    marketing-surface treatment per `ui-context.md` Page Modes),
    replacing the "coming in the next build phase" placeholder
  - `npm run build` passes (clean `.next` rebuild); prerendered
    `/portfolio` verified to contain the header, all 3 rows
    (alternating order), tags, icons, and correct links
  - Two follow-up bug fixes (caught in dev by the owner): the
    tag `key` collided on repeated placeholder tags — now keyed
    `${tag}-${index}`; and two Tailwind canonical-class lint
    warnings cleaned up (`aspect-[16/10]` → `aspect-16/10`)

- Phase 2 unit 2: project detail page route `/portfolio/[slug]`
  — 2026-06-13:
  - New dynamic route `src/app/(site)/portfolio/[slug]/page.tsx`
    (SSG): `generateStaticParams` prerenders the 3 project slugs,
    `generateMetadata` sets a per-project title, unknown slugs
    call `notFound()`. Resolves the unit-1 known gap (project
    links no longer 404)
  - Layout (marketing surface — `CustomCursor` + `Reveal`): back
    link → header (accent category eyebrow, big uppercase title,
    summary, tech chips) → full-width hero visual (`next/image`
    when `project.image` set, else `[Project Visual]` placeholder)
    → two-column Overview body + sticky Role/Timeframe/Category
    sidebar → a dashed-border "3D Model Viewer" placeholder slot
    (the react-three-fiber GLB embed is unit 4) → bottom back link
  - `Project` type extended with optional `role`, `timeframe`,
    `overview: string[]`; added `getProjectBySlug()` helper. All
    new content is bracketed placeholders — owner to fill in
  - Build workflow note: verified via the running dev server
    (curl) first; then stopped the dev server cleanly, ran
    `npm run build`, and restarted dev — NOT by deleting `.next`
    under a live dev server (see memory: that corrupts the dev
    cache and 500s the site)
  - `npm run build` passes; route table shows `/portfolio/[slug]`
    as SSG with project-one/two/three prerendered. Dev server
    re-verified: 3 slugs 200, unknown slug 404

- Phase 2 unit 4 (core): Three.js GLB viewer embedded on the
  project detail page — 2026-06-13:
  - DECISION: wrap the owner's existing vanilla Three.js modules
    instead of rewriting them in react-three-fiber (see
    Architecture Decisions + `architecture.md` → "3D Viewer
    Engine"). `three@0.184` installed as a bundled dependency
  - Ported the owner's modules into
    `src/features/portfolio/viewer/lib/` (plain JS): `three.js`
    (import hub), `utils`, `scene-manager`, `model-loader`,
    `component-list`, `interaction`, `controls`, `context-menu`,
    `history-manager`, `viewer-core` (orchestrator). Adapted: CDN
    globals → bundled `three` imports; `outputEncoding`/
    `sRGBEncoding` → `outputColorSpace`/`SRGBColorSpace`; load
    from a URL instead of a file upload; added `dispose()` for
    clean React unmount; removed the body-scroll-lock hack
    (OrbitControls already prevents page scroll on wheel); dropped
    the global-`lucide` dependency (inline SVGs in injected HTML)
  - New typed React client boundary
    `viewer/components/model-viewer.tsx`: dynamically imports the
    engine inside `useEffect` (so `three` never runs during
    SSR/prerender), renders the restyled chrome, owns load/error
    overlay state, and disposes on unmount
  - UI redesigned to the Swiss system: dark "viewport screen"
    framed by the light page; dark-glass toolbar (reset / isolate
    / show-all / edges / grid / axes / undo / redo via
    `lucide-react`), top-right component-list toggle, collapsible
    component-hierarchy panel (mono labels, search pill),
    right-click part context menu, hover/isolate read-out pills,
    and mono loading/error overlays — all on `--on-dark` /
    `--hairline-dark` / `--accent` tokens. Documented in
    `ui-context.md` → "3D model viewer"
  - `Project` type gained an optional `model` (GLB path/URL). The
    detail page renders `<ModelViewer>` when a project has a
    model, else keeps the dashed placeholder. `project-one` points
    at a TEMPORARY public demo GLB (modelviewer.dev Astronaut) so
    the viewer is verifiable end to end — owner to replace with a
    real GLB under `/public/models/`
  - Lint: added `.agents/**` to `eslint.config.mjs` ignores (it's
    already git-ignored + tsconfig-excluded; it was the only
    source of `npm run lint` errors). `npm run lint` now clean
  - `npm run build` passes (TypeScript clean, Turbopack); all 3
    project slugs prerender. Verified the prerendered
    `/portfolio/project-one` HTML contains the viewer chrome
    (toolbar, component panel, "3D Model" header, loading overlay)
    and `/portfolio/project-two` (no model) shows the placeholder
    with no toolbar
  - DEFERRED to unit 4b: `measurement.js` (distance tool) and
    `view-cube.js` (the latter was not in the files the owner
    supplied)

## In Progress

- None.

## Next Up

- Phase 2 unit 4b: port `measurement.js` + add a view cube to the
  viewer; replace the temporary demo GLB with a real model
- Phase 2 unit 3: resume download link/section (deferred)
- Owner to provide real content for Background/Experience,
  Socials, Location, and portfolio project write-ups to replace
  placeholders (see Open Questions)
- shadcn/ui setup deferred until first utility page (Phase 3)
  needs form primitives — nothing on the landing page uses it

## Open Questions

- `AboutSection` ("Background" section on the landing page) has
  placeholder experience/education content in bracketed text
  (`[Company Name]`, `[Degree / Program]`, etc.). Owner to
  provide real role titles, companies, dates, achievements, and
  education before this ships.
- Hero now reads "Joseph Vu" / "Engineering Portfolio" /
  "Open to work", contact email huyvu9688@gmail.com — owner to
  confirm this is final (title/role line still TBD for
  nav/footer)
- Location is bracketed (`[City, Country]`,
  `[Remote / On-site]`) — owner to provide real location
- Final project/site name (working name: EngiHub)
- Domain: Vercel subdomain first, custom domain later?
- Which portfolio projects (and GLB files) go in first? Confirm
  company-IP clearance for anything published. NOTE: `project-one`
  currently loads a TEMPORARY public demo GLB (modelviewer.dev
  Astronaut) purely so the viewer is testable — replace with a
  real model under `/public/models/` (set `project.model`)
- Phase 3 prerequisite: owner writes `calculator-specs.md`
  (formulas, input ranges, units, defaults) before each
  calculator is built — AI must not invent engineering math

## Pre-Flight Checklist (before first build session)

- [x] Node.js LTS installed
- [x] GitHub repo created (huyvu9688-sketch/engineering-portfolio)
- [x] Vercel account linked to GitHub
- [ ] Claude Code installed in VS Code
- [ ] Content gathering started: resume PDF, 2-3 project
      writeups, photos, shareable GLB exports

## Architecture Decisions

- 3D viewer: wrap the owner's existing vanilla Three.js modules in
  one typed React client component rather than rewriting in
  react-three-fiber (decided 2026-06-13). The engine is bundled
  `three` (dynamically imported, client-only), loads models from a
  URL, and is the one place the dark palette leads. See
  `architecture.md` → "3D Viewer Engine". Supersedes the earlier
  "react-three-fiber" note in the stack table.
- FINAL design direction: Swiss-style portfolio template
  (owner-supplied single-page HTML reference, since adapted into
  `ui-context.md`) — light neutral canvas, #111 ink, single
  #EB3A14 accent, Inter + mono chrome, pill buttons, reveal-based
  motion. Replaces both earlier themes
  (dark/amber, Apple/monochrome). Marketing pages get full
  effects (cursor, marquee, magnetic buttons); utility pages
  (calculators, database) stay calm. Percentage loader from
  template intentionally dropped (decided 2026-06-12)
- Next.js + Supabase + Vercel chosen for single-codebase
  simplicity and free-tier hosting (decided 2026-06-12)
- Calculator math isolated as pure functions so logic can be
  tested and reused independently of UI (decided 2026-06-12)
- Internal units are SI; display conversion at UI layer only
  (decided 2026-06-12)

## Session Notes

- Context files created and filled in. Next session: start
  Phase 1 setup.
- 2026-06-13: Phase 1 local build done. Machine note: npm is
  configured to the npmmirror.com registry, which 503'd on
  `@tailwindcss/oxide-win32-x64-msvc` (Tailwind's native
  Windows binary). Fixed by installing that one package with
  `--registry=https://registry.npmjs.org`. If a future install
  mysteriously misses a platform binary, try the official
  registry first.
- 2026-06-13: Phase 1 wrapped up and deployed. Moving to Phase 2
  (Portfolio). Workflow change going forward: commit locally
  after each unit as usual, but hold off on `git push` (which
  triggers a Vercel redeploy) until the owner says a batch of
  work is ready/final. See `ai-workflow-rules.md` → "Git &
  Deploy Workflow".
- 2026-06-13: CORRECTION to the note above — that install was
  saved with `--save-dev`, which duplicated the package into
  `devDependencies` as a hard (non-optional) dependency. That
  broke `npm install` on Vercel (linux/x64) with `EBADPLATFORM`,
  since the package only ships a win32/x64 binary. Fixed by
  removing the `devDependencies` entry; the existing
  `optionalDependencies` entry (added by Tailwind itself) is
  correct and platform-aware on its own. Lesson: never
  `--save-dev` a platform-specific `@tailwindcss/oxide-*` /
  `@next/swc-*`-style native binary package — let
  `optionalDependencies` handle it.
- 2026-06-13: Owner asked to skip unit 3 (resume) for now and jump
  to unit 4 (3D viewer), supplying their pre-built vanilla Three.js
  viewer modules to integrate. Built the viewer core this session
  (see Completed). Engine kept as plain JS behind a typed React
  wrapper; measurement tool + view cube deferred to unit 4b.
  Pushed to GitHub `main` and auto-deployed to Vercel at the
  owner's request (they run/view the site via the deployment
  rather than local dev).
- 2026-06-13: Viewer tweaks (committed locally, NOT pushed —
  owner is batching more changes before the next deploy): viewer
  height 60vh → 75vh; `fitCameraToModel` now adapts clip planes +
  zoom limits to model scale (fixes "reset view" not showing large
  models — the fixed maxDistance/far were clamping them); reset
  view always frames the whole model; added an Import button
  (toolbar) to load a local `.glb` from the user's computer via an
  object URL.
- 2026-06-13: Viewer layout change (committed locally, NOT pushed —
  same batch as above): moved the component list OUT of the 3D view
  zone. It was an absolute overlay covering the canvas; it's now its
  own column to the right of the viewer (`lg:w-72`), so the 3D view
  is the left `flex-1` column and is no longer full page width. The
  engine's DOM ids (`component-list-container`, `toggle-list`,
  `close-list`) are unchanged, so the show/hide toggle still works.
  On narrow screens the list stacks below the viewer.
- 2026-06-13: REVERSED the above per owner — component list is back
  INSIDE the 3D view as an overlay; removed the panel's X (close)
  button since the top-right Toggle button already hides/shows the
  tree (engine still binds `close-list` but it no-ops when absent).
  Instead of the side-column trick, the whole viewer is now capped +
  centered at the page level (`mx-auto max-w-6xl` around the featured
  block in `portfolio/page.tsx`) so the page background shows on both
  sides. Model stays centred automatically (`fitCameraToModel` +
  canvas sized from its mount element). Committed locally, NOT pushed.
- 2026-06-13: Three more viewer features (committed locally, NOT
  pushed — same batch):
  (1) Smarter ISOLATE — if a part is selected in the component tree,
  clicking Isolate isolates it immediately; with nothing selected it
  falls back to the click-to-pick mode. `disableIsolateMode` now also
  clears the toolbar button's active styling.
  (2) EXIT affordances — isolate state shows a top-center banner with
  an Exit button; pick mode + measure mode show top-center banners
  with Cancel; `Esc` backs out of measure → pick mode → isolation (in
  that order). The old bottom-center `isolated-info` read-out was
  replaced by the top banner (`isolated-banner` / `-name`); controls.js
  + history-manager.js repointed to the new ids.
  (3) MEASURE tool (`measure.js`) — toolbar ruler button; click two
  points on the model to draw markers + a line and show the straight-
  line distance (model units) in a bottom-center read-out; a 3rd click
  starts over; markers scale to the model.
  (4) 3D VIEW CUBE — three.js `ViewHelper` axis gizmo wired into
  scene-manager's render loop (bottom-left, clear of the list panel);
  click an axis to snap the camera to that view, orbiting the current
  controls target. Disposed with the scene. `ViewHelper` added to the
  `three.js` import hub. `npm run lint`/`build` pass.
- 2026-06-13: Fixed imported real-CAD models rendering black with no
  visible grid/axes (owner imported a 485-part assembly; nothing showed).
  Root causes + fixes (committed locally, NOT pushed):
  (a) model far from world origin (CAD assembly coords) → `model-loader`
  now RECENTRES the model to the origin on load (translate only, so
  measurements stay true); (b) fixed 20-unit grid / 5-unit axes were
  specks at any real scale → `scene-manager.fitHelpersToModel` scales them
  to the model and drops the grid to its base; (c) metallic/PBR CAD
  materials render black with no IBL → added a neutral `RoomEnvironment`
  PMREM as `scene.environment`; (d) NaN/empty bounding-box guards in
  `fitCameraToModel` + recentre so degenerate geometry can't blank the
  view. `RoomEnvironment` added to the import hub. lint/build pass.
- 2026-06-13: Imported model STILL rendered invisible after the above,
  but the hover read-out showed a real part name — i.e. the raycaster
  was hitting geometry, so it was loaded + framed but rendering blank.
  That's a material problem. `optimizeMaterial` now: forces near-zero
  opacity (<0.2) back to fully opaque (CAD parts often export as
  transparent), sets `envMapIntensity = 1` (some exports zero it, leaving
  metals black), and uses `DoubleSide` (inverted/one-sided CAD normals
  were invisible from outside). lint/build pass. THIS BATCH WAS PUSHED to
  origin/main → Vercel deploy (owner asked to deploy after the fix). All
  the local-only viewer commits since the last deploy went out together.
- 2026-06-13: Still invisible after deploy; console showed
  `GLTFLoader: Couldn't load texture blob:` (embedded textures failing to
  decode) plus harmless Clock/PCFSoftShadowMap deprecations. No CSP in
  next.config, so it's the image data itself. Since hover hit real parts,
  the geometry was loaded + framed but not drawn — a render-not-raycast
  problem. Kitchen-sink fix in `model-loader` (pushed → Vercel):
  per-mesh `frustumCulled = false` + `visible = true` (bad CAD bounding
  spheres get culled from drawing but not raycasting); per-material
  `visible/colorWrite = true`, drop any texture map whose image failed to
  load (so the base colour shows instead of sampling black), force ~zero
  opacity opaque, lift near-black colours by luminance, `DoubleSide`,
  `envMapIntensity = 1`. lint/build pass.
- 2026-06-13: Added two viewer features at owner's request — an
  EXPLODE control (toolbar slider; `explode.js` pushes each mesh
  outward from the model centre) and a persistent part-SELECTION
  glow (picking a part in the component tree applies an accent
  emissive that survives hover). Swapped the featured demo to a
  self-hosted multi-part engine assembly
  (`public/models/2-cylinder-engine.glb`) so both features have
  real parts to show. Built, pushed, deployed, verified live.
- 2026-06-13: Owner asked to move the 3D viewer OUT of the project
  detail pages and onto the main `/portfolio` page. Done: the
  viewer is now a featured section at the top of `/portfolio`
  (loads `FEATURED_MODEL` from projects.ts); detail pages reverted
  to image/placeholder hero only; per-project `model` field
  removed from the `Project` type. `npm run build`/lint pass.
- 2026-06-13: Owner reported `next dev` pegging RAM + SSD to 100%
  (machine thrashing) after `three` was added. Two-part cause:
  the WebGL render loop/context leaked across Strict Mode + Fast
  Refresh, and the TS language server auto-loaded `@types/three`
  plus crawled `three`'s own large type defs. Fixes applied:
  - Viewer lifecycle hardened (full `dispose()` +
    `forceContextLoss()`, single-instance ref, render loop pauses
    on tab hidden, capped pixel-ratio 1.5 + 1024 shadow map).
  - Removed `@types/three` (unused — engine is JS); added
    `viewer/lib/viewer-core.d.ts` and excluded the JS engine from
    the TS program in `tsconfig.json`, so the TS server no longer
    parses `three` types. `three` itself stays a bundled runtime
    dep, lazily compiled only on the `/portfolio/[slug]` route.
  - Owner-side: exclude the project (or `.next` + `node_modules`)
    from Windows Defender real-time scanning — the usual cause of
    SSD 100% during Next dev — and reload the VS Code window so the
    TS server drops the old `three` types from memory.
- 2026-06-14: ROOT-CAUSED the imported-CAD "black viewport" for real
  (the 2026-06-13 saga only chased symptoms). The component list fills
  in (485 parts) and the bottom-left view-cube gizmo renders, so WebGL
  + the render loop are alive — the MAIN scene just frames nothing.
  Cause: the imported GLB contains degenerate geometry (NaN/Inf
  vertices — confirmed via three's own `computeBoundingBox(): Computed
  min/max have NaN values` warning). A single such mesh makes
  `Box3.setFromObject(model)` non-finite for the WHOLE model, so the
  2026-06-13 "NaN guards" in `fitCameraToModel`/`recenterModel`
  EARLY-RETURNED — leaving the camera at its default (5,5,5) pose with
  the model/grid/axes out of frame (hence black, gizmo still drawn).
  The public engine GLB (0 textures, sane bounds) was never affected.
  Fix: new `viewer/lib/bounds.js` — `computeRobustBox()` unions only
  the meshes whose geometry bounding box is finite (skips the bad
  ones), with `isFiniteBox()` + `hasFiniteGeometry()` helpers. Routed
  every bounds consumer through it: `fitCameraToModel` (utils),
  `recenterModel` + `fitHelpersToModel`, and the explode/measure tools.
  `processModel` now also detects degenerate meshes, marks
  `userData.degenerate`, hides them, and keeps them out of `allParts`
  (so hover/isolate/explode/measure ignore broken bodies) while leaving
  them in the component tree. The `GLTFLoader: Couldn't load texture
  blob:` errors are a SEPARATE, non-fatal issue and only on the OLD
  deployed build — three r184 returns null on a failed texture (parse
  still completes) and `optimizeMaterial` already drops the empty map
  so the base colour shows; they'll disappear on redeploy. Verified:
  Node unit test of `bounds.js` (reproduces the NaN-poisoned box, then
  proves the robust box frames the good geometry) + `npm run lint` and
  `npm run build` pass. NOT pushed — owner to verify locally
  (`npm run dev`, import the CAD .glb) before deploying.
