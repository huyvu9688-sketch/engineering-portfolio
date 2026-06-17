# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Phase 1 — Foundation & landing page: COMPLETE (deployed,
  verified live at https://engineering-portfolio-svy8.vercel.app)
- Phase 2 — Portfolio: COMPLETE (units 1 & 2 done; unit 3 —
  resume download — DROPPED on 2026-06-14 at the owner's request
  ["I don't think we need to add resume"]; unit 4 — the 3D viewer
  — was built then REMOVED on 2026-06-14 because it never rendered
  reliably for imported CAD GLBs, see Session Notes)
- Phase 3 — Toolkit: IN PROGRESS (unit converter DONE; motor-sizing
  calculator slices 1–4 — engine + all five mechanisms (direct,
  lead/ball screw, belt/conveyor, rack & pinion, index table) +
  servo / stepper / AC-induction acceptance — DONE & verified
  2026-06-15; only slice 5 extras remain; pneumatic-cylinder
  calculator still needs its spec section; CAD VIEWER re-added to the
  Toolkit 2026-06-15 — see Session Notes)

## Session Notes (most recent first)

- 2026-06-17 (WRAP-UP): TITLE ANIMATION — three more attempts, all reported "still
  doesn't work" by the owner, then REMOVED at the owner's request ("remove animations
  in Hero section and in About text section, we'll skip this for now"). Sequence:
  1. Hero headline: switched `SplitText` from the JS IntersectionObserver reveal to a
     pure-CSS on-load variant (`trigger="load"` → `.split-text--load`, a plain keyframe
     like the working marquee, no observer/class-toggle). Reported not working.
  2. About title: built `scrub-title.tsx` to clone the reference's `animation-title`
     scroll reveal (verified the exact reference logic in `../portfolio` minified bundle:
     GSAP ScrollTrigger `fromTo(letters,{y:"-120%"},{y:0,ease:"power3.out",
     stagger:{each:.05,from:"center"},scrollTrigger:{start:"top 100%",end:"bottom 30%",
     scrub:1}})`; letters are NOT masked — they translate freely). First did it as a JS
     scroll handler. Owner's screenshots PROVED the per-letter transforms were never
     applied (letters sat at layout position when a working handler would have shoved
     them ~450px up) → the React `useEffect` is not executing on the owner's machine.
  3. Rewrote `scrub-title.tsx` as a PURE-CSS, no-JS server component: a scroll-driven
     `view()` timeline on the title, per-letter stagger baked into each letter's inline
     `animation-range` (server-rendered — confirmed 5 ranges, symmetric center-out, in
     the static `/` HTML). Runs without hydration (Chromium 115+). Owner STILL reported
     "doesn't work" → removed both sections' animations.
  FINAL STATE: hero headline + "based in vietnam" + descriptor + portrait + the About
  title are all PLAIN STATIC markup again (page.tsx + about-section.tsx). Other section
  titles (Recent Works/Services/Credentials/form) still use `SplitText`; custom cursor +
  marquee-pause are still JS. The `SplitText`/`ScrubTitle` component files + their CSS
  were LEFT in place (unused) for easy revisit. Build + lint green throughout.
  KEY UNRESOLVED FINDING (strong signal): the owner has now reported FOUR animation
  attempts as non-working — including a pure-CSS on-load keyframe (#1) and a pure-CSS
  scroll-timeline (#3), the SAME class of tech as the marquee, which DOES work for them.
  That contradiction points hard at a STALE DEV SERVER: the owner's running server is
  likely not serving the rebuilt output (memory: a lingering PID on :3000, my fresh
  `next dev` fell back to :3001), so none of these changes — CSS or JS — ever reached
  the browser. Alternatives (less likely): a browser without `animation-timeline: view()`
  (Firefox/Safari) for #3 only, and/or React not hydrating (would also break the custom
  cursor). NEXT TIME, before building any more animation: hard-confirm a FRESH `next dev`
  (kill all node, verify the port the browser is on) and Ctrl+Shift+R, then check the
  DevTools console for hydration errors and whether the custom cursor follows the mouse.
  See memory [[home-text-animation-not-firing]] and [[dev-server-run-by-owner]].

- 2026-06-17 (WRAP-UP): TEXT ANIMATION pass (continuation of the home clone).
  Built `split-text.tsx` — a per-letter scroll reveal (the reference's signature
  giant-title effect) — and wired it into the hero "DESIGN ENGINEER" headline
  and the four giant titles (ABOUT / RECENT WORKS / CREDENTIALS / GREAT
  MACHINES + SHARP ENGINEERING). Build green, lint clean.
  KNOWN ISSUE — reveal does NOT visibly fire on the owner's machine ("static",
  then "no animation"). Debugging established:
  * NOT prefers-reduced-motion — the reference (olhalazarieva.com) animates in
    the same browser, ours doesn't.
  * Markup is correct (served HTML has `.split-letter` spans + `--d` stagger,
    no premature `is-revealed`); CSS rules are in the served bundle; page is
    styled (so CSS loads).
  * A TEMP diagnostic (infinite `@keyframes` + `color:red !important` on
    `.split-letter`) DID animate → CSS animation + the selector both work.
    Therefore the break is the reveal MECHANISM, not CSS.
  * v1 used a CSS *transition* toggled by an IntersectionObserver `is-revealed`
    class → snapped with no motion (transition needs the hidden state painted
    first). v2 (current) switched to a keyframe `split-rise` animation gated by
    `is-prepared`(JS adds on mount to hide) + `is-revealed`(JS adds on scroll),
    letters visible-by-default so they never get stuck hidden. Still reported as
    no animation → strongly implies the JS observer/`useEffect` isn't toggling
    the classes on the owner's running server.
  LEADING SUSPECT for next session: a long-lived dev server on :3000 (saw PID
  37696 holding the port; my fresh `next dev` fell back to :3001) that may not
  be recompiling — i.e., the owner may be viewing output that never picked up
  the JS changes. NEXT STEPS: (1) hard-confirm a FRESH `next dev` (kill all node,
  verify port) before judging; (2) add a temp `console.log` in SplitText's
  effect to confirm it runs + the observer fires; (3) if hydration is fine,
  consider pure-CSS scroll-driven reveal via `animation-timeline: view()`
  (no JS/observer dependency, Chromium 115+). Current state is SAFE: titles
  render visible; animation is a non-firing enhancement, not a breakage.
  Owner runs the dev server themselves — do NOT launch a server in the IDE.

- 2026-06-17 (WRAP-UP): HOME PAGE 1:1 clone of the owner-supplied reference
  (olhalazarieva.com, source in `../portfolio`). Direction shift: marketing
  surfaces now target senior-front-end ambition (heavy animation, complex/
  layered UI) — `ui-context.md` updated with a new "Design ambition" section.
  - New home section order matches the reference exactly: hero → marquee →
    about → recent works → services → credentials → contact form → footer.
  - Built four new shared components: `projects-section.tsx` (dark snap-scroll
    "Recent Works", grayscale→color cards, reference three.js slider recreated
    in CSS), `awards-section.tsx` → "Credentials" (hover-preview list adapted
    to engineering disciplines + counts), `form-section.tsx` (contact form,
    "GREAT MACHINES / start with / SHARP ENGINEERING", project-type radios,
    submits via mailto: — no backend), and a rebuilt `footer.tsx` (giant
    "JOSEPH VU" wordmark, email, socials, pages/location).
  - Replaced the old inline Contact section in `page.tsx`; removed unused
    Mail/MagneticButton/ScrollToTopButton/TAGLINE.
  - Services & About were reviewed and approved earlier in the session.
  - All content is placeholder data (owner fills projects/credentials later);
    focus was UI/layout/animation. `npm run build` passes; prod `npm start`
    verified serving `/` 200. NOT pushed/deployed to Vercel.

- 2026-06-16 (WRAP-UP): Attempted to fix ROUND/TUBE face selection, then REVERTED
  at the owner's request ("remove all the fixes for the tube faces measuring …
  we'll skip this for now"). The coplanar grouping in `face-select.js` only grabs
  a thin coplanar strip on a curved surface (the original "single line on a round
  face" complaint). Tried, in order: smooth-region flood-fill across shared edges;
  robust vertex welding (27-cell, edge-relative tolerance) to bridge Draco-split
  seams; proximity-based adjacency (centroid reach) to bridge non-coincident
  seams; raising the feature angle 30°→40°; and switching the highlight overlay to
  `depthTest:false` to rule out z-fighting on curves. Unit tests reproduced every
  failure mode and passed, but on the owner's real model the highlight stayed a
  thin strip through ALL attempts — byte-identical even after the render-level
  change. Leading theory (unconfirmed): the viewer's `.js` libs weren't reloading
  — Next.js fast-refresh keeps the running `CadViewer`/WebGL instance alive, so
  editing the engine modules does nothing until a FULL page reload (the dynamic
  `import()` only runs on a fresh mount). If revisited: hard-reload first to
  confirm new code runs (add a temp `console` line in `computeFace`), then the
  flood-fill + proximity approach is the right direction. `face-select.js` restored
  to its session-start coplanar version; the added `face-select.test.ts` removed.
  Curved-face selection remains a KNOWN LIMITATION (strip on round faces).

- 2026-06-16 (WRAP-UP): Major CAD VIEWER expansion (one long session). Engine in
  `src/features/toolkit/viewer/lib/*.js`, React shell `cad-viewer.tsx`. All of the
  below: lint + build pass; `/tools/cad-viewer` prerenders; NOT pushed.
  - FULL-SCREEN, chrome-free page: route moved to a new `(fullscreen)` route group
    (no navbar/footer) with a "Back" pill → /tools; viewer fills the viewport.
  - ROTATION: swapped OrbitControls → TrackballControls so the model tumbles a full
    360° about any axis (OrbitControls clamps at the poles, which also made the
    view-cube top/bottom snaps feel stuck). `handleResize` wired; framing resets up.
  - VIEW CUBE (`view-cube.js`): drawn bottom-left via a scissored corner render
    (autoClear=false + clearDepth) — deliberately NOT three's ViewHelper (its full
    clear blanks the canvas — see 2026-06-15 root-cause). Click a face → snap to
    that standard view; a transparent DOM hit-area captures clicks so picking never
    fights the camera controls.
  - RIGHT-CLICK CONTEXT MENU: isolate a part from the 3D view OR the tree;
    isolate/show-all now keep the camera STABLE (removed the fitToObject re-frame).
    Measure resets when you click empty space.
  - EXPLODE: toolbar toggle + amount SLIDER (starts at 0). Groups meshes by named
    part via resolvePartNode (falls back to per-mesh); pushes radially from centre.
    KEY FIX: convert the world offset into each part's PARENT-LOCAL space, else a
    CAD unit-scale on a parent node collapses the displacement to ~0 (the "nothing
    explodes" bug).
  - SECTION VIEW (`Scissors`): clipping-plane cutaway via PER-MATERIAL clippingPlanes
    (so the cube/markers/measure aren't cut) + `renderer.localClippingEnabled`.
    Banner: X/Y/Z axis, position slider, FLIP (negates normal AND constant → stays
    in place, just swaps the kept side), FACE (align the cut to a clicked face).
    Entering section starts the cut FROM the currently selected face (oriented
    toward the model centre so the part stays visible — slide to cut inward).
  - EDGES toggle (feature edges >30°, parented to each mesh, clipped under section)
    and VOLUME read-out (closed-mesh signed-tetra volume of VISIBLE parts; cm³/in³/mm³).
  - PROPERTIES CARD (top-left): component name, material + colour swatch (from the
    GLB material), volume, and estimated WEIGHT = volume × density inferred from the
    material name (table of common materials; assumed steel when unknown, flagged).
  - FACE-LEVEL INTERACTION (`face-select.js`): hover/click highlights an individual
    coplanar face (same normal + plane offset), not the whole part; click adds the
    face's area + ⟂ axis to the properties card. Planar faces only — curved faces
    highlight just the patch under the cursor (noted limit; needs adjacency flood-
    fill for curves).
  - COMPONENT TREE: hides BODY (mesh ingredient) + UNKNOWN rows; descends through
    Unknown so real parts under a wrapper still show; a Part whose bodies are hidden
    shows no expand arrow.
  - MEASURE: now 3 modes (banner selector Dist · Ø · C-C) — Distance (axis gap),
    Diameter/Radius (3-point circle fit), Center-to-center (two fitted circles).
    `fitCircle` = 3D circumcentre (hand-verified). Read-out label updates per mode.
  - Stack notes: TrackballControls + per-material clipping on `three@0.184`; new
    engine modules `view-cube.js`, `face-select.js`; left-click now selects a face
    (drag-threshold so it doesn't fire on orbit).

- 2026-06-16: CAD Viewer page — stripped to a FULL-SCREEN viewer (owner:
  "remove all context in this section, expand the 3D window to full
  screen, only the screen"). `/tools/cad-viewer` page.tsx no longer has
  the back link, title/"Runs in your browser" header, description, or the
  drag/zoom hint — just `<CadViewer>` in a `h-screen` flex column with a
  `h-20` spacer so the viewer toolbar clears the fixed navbar. The
  `CadViewer` root went from `h-[75vh] min-h-130 … rounded-lg border` to
  full-bleed `h-full w-full` (fills the parent, no frame). Navbar/footer
  (shared site layout) are untouched. lint + build pass; prerenders. NOT
  pushed.

- 2026-06-16: CAD Viewer measure — reworked to FACE PICKING by click +
  axis-from-face-normal (owner: "choose the component face by click, not
  click-hold-drag taking the point where I let go; show the measure as X
  or Y or Z which 2 faces are parallel, not 2 axis lines"). Three changes
  in `measure.js`: (1) replaced the bare `click` listener (which fires
  even after an orbit-drag, dropping a point on release) with
  pointerdown→pointerup + a 5 px DRAG THRESHOLD, so dragging to rotate
  never measures; (2) each pick now reads the hit face's world NORMAL and
  derives its dominant axis, so the tool reports which axis the two
  (parallel) faces are perpendicular to — gap measured along that axis;
  (3) draws ONE dimension line only (removed the faint connector — the
  "2 axis line"), plus a small normal arrow at each pick to show the
  chosen face. Read-out: `mm (in) · axis` + a "two parallel faces / not
  parallel" note. Added `id="measure-instruction"` to the measure banner
  so the tool updates the prompt (first face → parallel face). lint +
  build pass; `/tools/cad-viewer` prerenders. NOT pushed.

- 2026-06-15: CAD Viewer — added HOVER GLOW (soft blue emissive on the
  mesh under the cursor, throttled ~30fps, non-destructive save/restore
  so a selected part keeps its accent), and made MEASURE axis-aligned
  again but face-anchored: both clicked points stay as markers on the
  surfaces, the dimension line is drawn parallel to the dominant X/Y/Z
  axis, and a faint connector ties the axis line back to the 2nd face so
  the endpoint no longer floats. Read-out: axis distance `· X` + ΔX/ΔY/ΔZ
  (mm/in). lint/build pass; pushed.

- 2026-06-15: CAD Viewer measure — switched from axis-snapped to
  FACE-TO-FACE point distance (owner: "measure from component face to
  component face, not a random position in 3D"). The axis-snap projected
  the 2nd point to a floating spot in space — that was the "random
  position". Now both endpoints stay on the raycast surface hits, line
  drawn directly between; read-out shows straight distance + ΔX/ΔY/ΔZ
  (mm/in). lint/build pass; pushed.

- 2026-06-15: CAD Viewer measure — now AXIS-ALIGNED (owner picked
  "measure along one axis"): two clicks → dominant X/Y/Z axis, reports
  that axis distance. Units shown as `mm (in)` with `unitToMm`
  auto-detected from model span (< 10 units → ×1000 metre export, else
  ×1 mm). Read-out: `1234.5 mm (48.60 in) · X`. lint/build pass; pushed.

- 2026-06-15: CAD Viewer — added ISOLATE + MEASURE. Toolbar (top-left):
  reset view, isolate, show-all, measure, import. Isolate = toolbar
  button isolates the selected tree part, else click-to-pick; show-all
  or Esc to exit; banner shows the isolated part. Measure = new
  `measure.js`, click two points → distance (bottom-centre read-out);
  Esc exits. Engine tracks `allParts` for visibility/raycast. Still no
  view cube (kept out — it blanks the canvas). lint + build pass; pushed.

- 2026-06-15: CAD Viewer — re-added the COMPONENT TREE (first feature
  back after the minimal reset). New `component-list.js` (pure DOM,
  searchable, collapsible); engine builds the hierarchy on load, a
  top-right toggle shows/hides the dark panel, clicking a part frames it
  + applies an accent emissive glow. Dark background kept. Still no
  toolbar/measure/isolate/view-cube (adding one at a time; view-cube
  last, with the autoClear fix). lint + build pass; pushed (deploy).

- 2026-06-15: CAD Viewer REVERTED to minimal (white bg, import + orbit,
  real colours; no tree/toolbar/measure/isolate/view-cube). ROOT CAUSE
  of the black background found: three.js `ViewHelper.render()` re-clears
  the canvas each frame; with `renderer.autoClear = true` (default) it
  wiped the white background + model to black, leaving only the gizmo —
  matched the screenshots exactly (black, no model, gizmo visible). It
  was masked on the old dark viewport. The earlier "stale build" theory
  was WRONG; the deployed full build showed it too. To re-add a view
  cube later: `renderer.autoClear = false` + manual clear. Committed +
  pushed (deploy).

- 2026-06-15: CAD Viewer — RE-ADDED ALL FUNCTIONS on the white
  background (owner: "re-adding all functions we have, but temporary
  still keep the white background"). Restored the full multi-module
  engine (scene-manager, model-loader, component-list, interaction,
  controls, context-menu, history-manager, measure, view-cube via
  three.js ViewHelper, viewer-core). Kept the approved real-colour
  material handling (RoomEnvironment + NeutralToneMapping + light-touch
  sanitise — NO clay override) and WHITE scene background. Floating
  chrome is dark (reads over white, survives a later dark-bg flip);
  empty/loading/error overlays are light. Confirmed the original
  "invisible model" was just a grey machine on a near-black viewport —
  the engine was fine. lint + build pass; `/tools/cad-viewer`
  prerenders. NOT committed/pushed.

- 2026-06-15: CAD Viewer now shows REAL component colours (owner: grey
  clay worked, wants real colours). Dropped the clay override; keep the
  file's own materials, lit by a neutral `RoomEnvironment` map under
  `NeutralToneMapping` (preserves authored colour). Materials only
  sanitised for invisible-import causes (near-zero opacity → opaque,
  broken texture maps stripped, DoubleSide, envMapIntensity=1); normals
  recomputed, frustumCulled off, recenter + fit unchanged. White
  background kept. lint + build pass. NOT committed/pushed.

- 2026-06-15: CAD Viewer STRIPPED TO MINIMAL after the owner still
  couldn't see imported models ("we fix this many time but it dont
  work. start from zero, remove all function, just the model window and
  import, white background"). Deleted the 10-module engine; replaced
  with one ~250-line `viewer-core.js`. Now: WHITE 3D background, import
  (picker + drag-drop) + orbit only — no tree/toolbar/measure/isolate/
  view-cube. Key visibility fix beyond the white bg: every mesh is
  reassigned ONE grey clay `MeshStandardMaterial` (DoubleSide) on load,
  normals recomputed, frustumCulled off, recentred to origin, camera
  fit — i.e. the file's own (often broken/black/transparent) materials
  are discarded entirely. Lifecycle hardening kept (single context,
  dispose+forceContextLoss, capped DPR, visibility-pause). lint + build
  pass. NOT yet committed/pushed.

- 2026-06-15: Toolkit UI refine pass (frontend-design +
  ui-ux-pro-max skills) — tabular figures everywhere, aligned
  conversion table, instrument-readout treatment for governing
  results, truthful header metadata, PASS/UNDERSIZED verdict banner.
  See ui-context.md (Typography + Layout updates). lint/build/21 tests
  pass. Not yet committed at time of writing.
- 2026-06-15: RE-ADDED the 3D viewer as a Toolkit tool at
  `/tools/cad-viewer` (the Portfolio version was removed 2026-06-14
  for instability; this is a clean rebuild from the owner's vanilla-JS
  modules). Engine in `src/features/toolkit/viewer/lib/*.js` (plain JS,
  excluded from tsconfig, typed via `viewer-core.d.ts`), wrapped by
  `viewer/components/cad-viewer.tsx`. Upload/drop a GLB/GLTF (read
  locally). Features: orbit/zoom, searchable component tree,
  hover-highlight, isolate/show-all, right-click context menu, measure
  (2-point), undo/redo, edges/grid/axes toggles, view-cube (three.js
  `ViewHelper`). ALL the hardening from the failed Portfolio attempt is
  carried forward: single WebGL context + full dispose/forceContextLoss,
  capped DPR (1.5), visibility-pause, model recentre-to-origin, helpers
  scaled to model, RoomEnvironment IBL, materials forced opaque/
  double-sided + broken textures stripped + frustumCulled off, DRACO +
  KTX2 + meshopt decoders. `three@0.184.0` reinstalled (no @types/three).
  lint + build pass; `/tools/cad-viewer` prerenders. Not yet committed.

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
   3. Resume download link/section — DROPPED 2026-06-14 (owner
      decided a resume download isn't needed)
   4. Three.js (react-three-fiber) GLB viewer embed on project
      detail pages — REMOVED 2026-06-14 (see Architecture
      Decisions)
3. **Phase 3** — Toolkit: unit converter → pneumatic cylinder
   calculator → motor sizing calculator
4. **Phase 4** — Database: Supabase setup, schema + RLS,
   admin auth, upload, browse/filter, download
5. **Phase 5+** — Tolerance/fit calculator, standard parts
   library, formula reference, blog/notes

## Current Goal

- Phase 2 is COMPLETE. Unit 3 (resume download) was DROPPED on
  2026-06-14 — the owner decided a resume download isn't needed.
  Unit 4 (3D viewer) was removed earlier the same day.
- Phase 3 unit converter is DONE (built & verified 2026-06-14
  against the approved NIST-sourced spec). Next Toolkit items are
  the pneumatic-cylinder calculator, then motor sizing — both
  BLOCKED until the owner fills in their sections of
  `calculator-specs.md`. AI must not invent engineering math
  beyond what the spec defines.
- The 3D viewer is shelved (removed 2026-06-14). Only revisit if
  the owner explicitly wants to try a different approach (e.g.
  Google `<model-viewer>` web component) — the bespoke Three.js
  engine never rendered imported CAD GLBs reliably.

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

- Phase 3 unit 1: unit converter (length, force, pressure, torque,
  power, flow) — 2026-06-14:
  - Pure logic in `src/features/toolkit/lib/units.ts`: `CategoryId`
    type, `Unit`/`Category` interfaces, the six SI-based factor
    tables (factors copied verbatim from `calculator-specs.md`,
    exact ratios written as divisions), and pure functions
    `convert`, `convertById`, `parseInput`, `formatResult`
    (6-sig-fig default, trailing zeros stripped, exponential for
    very large/small). No UI in this file (testable in isolation).
  - Tests in `units.test.ts` run via `node --test` (Node 26 strips
    TS types natively — no test framework added). Covers the
    spec's 12 hand-check cases, an A→B→A round-trip over every unit
    pair, a base-unit sanity check, and formatter/parser edge
    cases. `npm test` script added (glob `src/**/*.test.ts`).
  - UI: `src/features/toolkit/components/unit-converter.tsx`
    (`"use client"`) — calm utility surface per ui-context Page
    Modes (no cursor/marquee/magnetic effects). Category pills →
    From input + unit select / Swap button / To result + unit
    select → footer with live `1 x = y` equivalence and a
    precision selector (4/6/8/10 sig figs). `/tools` page now
    renders it (was a placeholder). Inline validation shows "Enter
    a valid number" on bad input.
  - DECISION: used native, token-styled `<input>`/`<select>`
    instead of setting up shadcn/ui for this first calculator —
    simpler, no new deps, and it avoids the shadcn init touching
    the token-defined `globals.css`. shadcn stays the plan for
    richer primitives (dialog/table/combobox), likely the database
    page. ui-context.md updated to record this.
  - Build note: added `"allowImportingTsExtensions": true` to
    tsconfig so the `./units.ts` import the Node test runner
    requires also type-checks under `next build`.
  - Verified: `npm test` (5/5), `npm run lint` clean, `npm run
    build` clean (all routes prerender, `/tools` static). The
    prerendered `/tools` HTML contains the converter and the
    correct default result (100 mm → 3.93701 in).

- Phase 3 unit 3 (slice 1): motor-sizing calculator — engine +
  direct drive + lead/ball screw + servo acceptance — 2026-06-14:
  - Pure logic in `src/features/toolkit/lib/motor-sizing.ts`
    (coherent SI): inertia helpers (solid/hollow cylinder, parallel
    axis, gear reflection), force assembly (horizontal/vertical/
    incline), motion profile (triangular↔trapezoidal), RMS torque,
    core `evaluateDrive`, mechanisms `sizeDirectDrive` +
    `sizeLeadScrew`, and `evaluateServo` (peak ≤ motor peak, RMS ≤
    rated, speed ≤ rated, inertia ratio ≤ 10 / ideal ≤ 5).
  - IMPORTANT modeling detail (Repanich, verified): the driven
    load's reflected inertia is divided by efficiency in the accel
    torque (`J_load/η`); transmission + motor inertia are not; the
    inertia ratio uses total reflected load inertia WITHOUT `/η`.
    Spec §3.1/§3.6 updated to match.
  - Tests `motor-sizing.test.ts` (node --test) reproduce Repanich
    Ex.1 (direct, `Ta=0.0056`, `P=0.93 W`, ratio 3.6), Ex.3 (lead
    screw, `Ta=34.69 oz·in`, `Tpeak=60.08`, ratio 2.48), Problem #1
    (~20 N·m @ 0.56 rev/s), plus force/profile/RMS/servo units —
    12/12 pass with the converter tests.
  - UI: `motor-sizing-calculator.tsx` (client) at a new route
    `/tools/motor-sizing` — calm: mechanism tabs (lead screw /
    direct), grouped input fieldsets (mechanism, motion, drive,
    optional candidate servo motor), live results panel (peak speed,
    accel/load/peak/required/RMS torque, power, load inertia,
    inertia ratio) + servo pass/over checks. Inputs in friendly
    units, converted to SI before calling the lib. Defaults per
    mechanism reproduce the worked examples (lead-screw default →
    1500 rpm, peak 0.5209 N·m, ratio 2.48, verified in the
    prerendered HTML).
  - `/tools` overview: "Motor Sizing Calculator" now Available and
    links to the route (ArrowUpRight). `npm test` 12/12, lint clean,
    build clean (`/tools/motor-sizing` prerenders static).

- Phase 3 unit 3 (slice 3): motor-sizing mechanisms — belt/
  conveyor, rack & pinion, rotary index table — 2026-06-14:
  - Added to `motor-sizing.ts`: a shared `sizeLinearDrive` core
    (tangential: J=m·R², T=F·R/η, ω=v/R) feeding `sizeBeltPulley`
    (load + belt mass driven; drive/idler pulleys as ½m R²
    transmission) and `sizeRackPinion` (load driven; pinion ½m R²).
    `sizeIndexTable` composes disc (½M R²) + workpieces (point
    masses m·d², parallel axis) + fixtures and delegates to
    `sizeDirectDrive`. Formulas cross-checked: Oriental Motor (belt
    & rack both T=F·r, J=m·r²) + Repanich tangential — agree.
  - Tests: hand-derived first-principles cases for belt (incl.
    vertical holding torque = mgR/η), rack, and index table —
    `npm test` now 16/16.
  - UI: `motor-sizing-calculator.tsx` extended to five mechanism
    tabs with per-mechanism input fieldsets (belt: pulley radius +
    drive/idler/belt masses + friction + orientation; rack: pinion
    radius/mass; index: table mass/radius + workpiece mass/count/
    radius + fixture inertia + friction/process torque + index
    angle). Linear vs rotary move + max-speed units switch
    automatically; shared orientation/incline/force block factored
    out. Prerendered HTML shows all five tabs.
  - `npm test` 16/16, lint clean, build clean
    (`/tools/motor-sizing` prerenders static).

- Phase 3 unit 3 (slice 4): motor-sizing acceptance — stepper &
  AC induction (servo prioritised earlier) — 2026-06-15:
  - Refactored `motor-sizing.ts` to a typed motor union
    `MotorCandidate = ServoSpec | StepperSpec | ACSpec` (discriminated
    by `type`). Added `evaluateStepper` (required ≤ pull-out torque
    at speed; inertia ratio ≤ limit, default 10 / up to 30; running
    duty cycle < 50 %) and `evaluateAC` (required ≤ starting torque;
    running load torque ≤ rated; speed ≤ rated; reflected inertia ≤
    gearhead permissible). `SizingResult` now carries `runningTime`,
    `dutyCycle`, and a discriminated `acceptance` union (was `servo`).
  - Criteria sourced from Oriental Motor Tech Ref (F-4/F-5: stepper
    duty <50 %, inertia ratio αstep 30 / RK 10, Sf 1.5–2; AC: size
    by starting torque + permissible inertia, Sf ~2).
  - Tests: added `evaluateStepper`, `evaluateAC`, and a duty-cycle
    case; updated servo objects to `type:"servo"`. 21/21 pass
    (incl. the Repanich + Oriental Motor cross-checks).
  - UI: motor section is now a type selector (None / Servo / Stepper
    / AC Induction) with per-type input fields and a per-type
    acceptance read-out; results panel gained a Duty-cycle row.
    Picking stepper/AC sets the safety factor to 2, servo to 1.5.
  - `npm test` 21/21, lint clean, build clean; prerendered
    `/tools/motor-sizing` shows all motor-type tabs + checks.

## In Progress

- None.

## Session Notes (2026-06-17 — Olha redesign session)

- Hero redesign: replaced the old centered Inter/pill hero with a full Olha-clone
  — Sofia Sans Condensed giant headline (`DESIGN ENGINEER`, `clamp(5rem,15.5vw,22rem)`),
  per-letter staggered rise animation, mix-blend-difference navbar (`joseph vu` logo +
  CSS-grid screen-centered bracket links + contact CTA), gray descriptor box with
  portrait overlap, `BASED IN VIETNAM` label. Fonts loaded via `next/font/google`
  (Sofia Sans Condensed + Spline Sans Mono); tokens added (`--transition-main`,
  `--canvas #f7f7f7`, `--ink #101010`). `ArrowUpRight` shared SVG component added.

- Portrait fix: `joe.png` loaded from `/public`. Container switched from constrained
  `bottom-8` + fill/object-top (was ~108px tall) to `aspect-3/4` + `object-center`;
  gray box given `minHeight: 380px`. Full portrait now visible.

- ServicesSection (new `src/components/shared/services-section.tsx`): replaces the
  placeholder ExploreShowcase. Dark `--surface-dark` zone, four Olha-style numbered
  service rows (Automation Systems / Machine Design / Motor & Drive Sizing / Control
  Engineering) with condensed display titles, hairline-dark dividers, hover accent +
  arrow. "See my work" link-line CTA at bottom.

- AboutSection rebuild (`about-section.tsx`): rewrote from light-surface to dark
  `--surface-dark` zone matching ServicesSection. Condensed display type for role
  titles; experience timeline uses `hairline-dark` borders and `on-dark` palette.
  Education card restyled in dark. Bracket `/` list markers for experience points.

- PageTransition (`src/components/shared/page-transition.tsx`): client component that
  re-keys on `usePathname()` change, triggering `animation: page-enter` on every
  route navigation. Wrapped around `{children}` in `(site)/layout.tsx`. CSS keyframe
  added to `globals.css` (0.65s, `cubic-bezier(0.22,1,0.36,1)`, disabled under
  `prefers-reduced-motion`).

- All changes: `npm run build` clean (lint + static prerender pass).

## Next Up

### Marketing surfaces (priority — Olha quality bar)

- **GSAP + Lenis**: install `gsap` + `lenis` + `@gsap/react`. Wire
  Lenis into the marketing layout root (sync to GSAP ticker). Replace
  the `Reveal` IntersectionObserver component on marketing surfaces
  with GSAP ScrollTrigger reveals. Per-letter stagger on section
  titles (SplitText currently unused — revisit once GSAP is confirmed
  running). Confirm on a FRESH dev server + hard reload before
  judging animation. See [[home-text-animation-not-firing]] for
  debugging context — stale dev server was the likely culprit.
- **Portfolio inner pages**: listing + detail pages still use the old
  design language. Apply full Olha treatment: clip-path image wipes
  on project cards, hover previews, grayscale→color with GSAP, scroll
  reveal on project rows.
- **Content**: owner to provide real project write-ups, photos,
  experience details to replace all bracketed placeholders.

### Toolkit (Phase 3)

- Motor-sizing slice 5 (OPTIONAL): vertical hoist, ball-screw
  preload, multi-segment RMS.
- Pneumatic cylinder calculator: BLOCKED until owner fills §2 of
  `calculator-specs.md`.
- Follow the established shape: pure logic + `node --test` tests in
  `src/features/toolkit/lib/`, calm UI in
  `src/features/toolkit/components/`.

### Infra

- shadcn/ui still NOT set up — defer until a richer primitive is
  actually needed (dialog, data table) — most likely the database
  page (Phase 4).
- Phase 4 (Database): Supabase schema + RLS, admin auth, upload,
  browse/filter, download. Still pending.

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
- Phase 3 prerequisite: `calculator-specs.md` exists. The unit-
  converter section is AI-drafted from NIST SP 811 and awaits the
  owner's approval; the pneumatic & motor sections are still
  stubs the owner must fill in (formulas, assumptions, input
  ranges, defaults) before those calculators are built — AI must
  not invent engineering math

## Pre-Flight Checklist (before first build session)

- [x] Node.js LTS installed
- [x] GitHub repo created (huyvu9688-sketch/engineering-portfolio)
- [x] Vercel account linked to GitHub
- [ ] Claude Code installed in VS Code
- [ ] Content gathering started: 2-3 project writeups, photos
      (resume PDF no longer needed — download dropped 2026-06-14)

## Architecture Decisions

- 3D viewer: REMOVED 2026-06-14. The decision to wrap the owner's
  vanilla Three.js modules in a typed React component (2026-06-13)
  is reversed — after many fixes it still rendered black for the
  owner's imported CAD GLBs even when diagnostics showed a perfect
  scene (canvas sized, camera framed on a centred model, all meshes
  drawn). Deleted the `features/portfolio/viewer/` engine, the
  `ModelViewer` usage, the `three` dependency, and the demo GLB;
  recoverable from git. If revisited, prefer Google's
  `<model-viewer>` web component over a bespoke engine.
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
  (decided 2026-06-12). REFINED 2026-06-14: the internal base is
  *coherent* SI (m, N, Pa, N·m, W, m³/s) — not mm/bar — so
  engineering formulas need no correction factors. The unit
  converter and all calculators share this base.

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
- 2026-06-14 (later): the bounds fix was deployed, but the viewer was
  STILL black — even for the clean public engine GLB. Frame
  diagnostics added to the engine proved the scene was perfect:
  canvas 711x620, camera framed on a model centred at the origin
  (size ~745x303x275), all 115 meshes drawn, 0 hidden. So it was not
  geometry, framing, canvas size, or a stuck overlay. With a correct
  scene still rendering black across all models, the owner decided to
  STOP and REMOVE the viewer.
- 2026-06-14: REMOVED the entire 3D viewer feature at the owner's
  request. Deleted `src/features/portfolio/viewer/` (engine + React
  wrapper), the `<ModelViewer>` usage and "Interactive 3D Model"
  section on `/portfolio` (page is now header → project rows; the
  redundant "Selected Projects" heading went too), the
  `FEATURED_MODEL` constant, the demo `public/models/2-cylinder-
  engine.glb`, the `three` dependency (uninstalled — also resolves
  the 2026-06-13 dev RAM/SSD thrashing), and the viewer's
  `tsconfig.json` JS-exclude. Context files updated to match
  (architecture, ui-context, project-overview, code-standards,
  this tracker). All of it is recoverable from git history if the
  viewer is ever revisited (a Google `<model-viewer>` web component
  would be the simpler next attempt). `npm run lint` + `npm run
  build` pass clean.
- 2026-06-14 (later): Owner decided NOT to add a resume download
  (Phase 2 unit 3) — "I don't think we need to add resume." Unit 3
  is DROPPED, not deferred. That closes out Phase 2 (units 1 & 2
  shipped; units 3 & 4 dropped/removed). No resume code ever
  existed (it had only been deferred), so nothing to delete;
  project-overview.md updated to drop the "resume download"
  mention from the Portfolio feature list. Next: Phase 3
  (Toolkit), gated on the owner supplying calculator-specs.md.
- 2026-06-14 (later): Drafted `context/calculator-specs.md` for the
  unit converter at the owner's request (option 1 — AI drafts, owner
  approves). Researched conversion factors from NIST SP 811
  Appendix B.8 and derived full double-precision values from the
  exact base definitions (international yard & pound, g₀ = 9.80665,
  IT calorie). Six categories: length, force, pressure, torque,
  power, volumetric flow — each with a coherent-SI base unit, a
  factor table (with an exact/ratio/def. exactness column),
  defaults, and 13 hand-checkable test cases. All test-case results
  re-verified numerically with Node. Deliberately scoped OUT:
  temperature (affine), mass flow, and normal/standard "free air"
  flow (Nl/min, scfm — moved to the pneumatic calculator's spec).
  Pneumatic & motor sections left as owner stubs. Awaiting owner
  approval before building the converter.
- 2026-06-14 (later): Owner trimmed the unit list (dropped yd, ozf,
  lbf, atm, at, mmHg, Torr, inHg, kgf·cm, ozf·in, lbf·in, lbf·ft,
  ft·lbf/s, BTU/h, kcal/h, PS, CFM/CFH, GPM US/UK) and confirmed the
  converter should pivot on the coherent SI unit per category, with
  the calculators using the SAME SI base internally so converted
  values flow straight into formulas. calculator-specs.md updated
  (tables, notes, defaults, and test cases all reconciled).
  RESOLVED: owner chose coherent SI (m, N, Pa, N·m, W, m³/s) as the
  internal base for BOTH the converter and the calculators (over the
  mm-N-MPa alternative). code-standards.md updated accordingly
  (superseding the old "mm, N, bar, Nm" wording); the converter spec
  already pivots on these SI units, so no spec change was needed.
- 2026-06-14 (later): Dropped electric horsepower (746 W) from the
  converter — owner keeps a single `hp` (mechanical, 745.6999 W).
  Clarified (per owner's question) that electric hp is NOT a motor-
  sizing safety factor — it's the same unit rounded by 0.04%. The
  motor-sizing spec stub (Section 3) now spells out the real margin
  policy: service factor (NEMA ~1.15) vs. design/sizing safety
  factor (~1.15–1.5), both owner-defined when that calculator is
  specced.
- 2026-06-14 (later): Built Phase 3 unit 1 — the unit converter
  (see Completed for detail). Owner approved the spec ("yes go
  ahead"). Established the Toolkit's build pattern: pure logic +
  co-located `*.test.ts` run by `node --test` (no test framework
  — Node 26 strips TS types), a calm client UI, native styled form
  controls (shadcn deferred again). All checks green; NOT pushed
  (batching per the Git & Deploy workflow — owner says when to
  deploy).
- 2026-06-14 (later): Layout change at owner's request — the
  converter now lives in a STICKY control-panel card pinned to the
  right of `/tools` (stays in view while scrolling). `/tools` is now
  a two-column grid (`lg:grid-cols-[1fr_minmax(360px,400px)]`):
  toolkit overview on the left (intro + a status list: Unit
  Converter = Available, Pneumatic = Coming next, Motor Sizing =
  Planned), converter panel on the right
  (`lg:order-2 lg:sticky lg:top-28 lg:self-start`); on mobile the
  panel stacks first. The converter's internal layout was reflowed
  from a 3-column row to a VERTICAL stack so it reads well in the
  narrow panel. Logic untouched (tests still green); lint + build
  clean. ui-context.md updated.
- 2026-06-14 (later): Owner wanted the converter docked at the FAR
  right and visible across the WHOLE page (all sections), not just
  one block. Widened `/tools` to `max-w-[1800px]` with
  `lg:grid-cols-[1fr_380px]`; ALL sections live in the left column
  so the sticky panel (now `lg:max-h-[calc(100vh-8rem)]
  lg:overflow-y-auto`) stays pinned through every section, releasing
  only at the page bottom. Added a static "Common Conversions"
  quick-reference grid to the left column (real values from
  calculator-specs.md) — useful, and gives the page enough height to
  show the pinning now. Intentional deviation from the utility-page
  `max-w-6xl` convention (documented in ui-context). Lint + build
  clean. Still NOT pushed.
- 2026-06-14 (later): Tightened the converter panel — renamed the
  eyebrow "Control Panel" → "Unit Conversion", narrowed the column
  (`380px` → `320px`), and reduced internal sizing (card `p-4`,
  field padding `py-2`, result text `text-base`, smaller gaps) to
  cut the excess whitespace the owner flagged. Lint + build clean.
- 2026-06-14 (later): Owner reprioritised to the MOTOR-SIZING
  calculator (Phase 3 unit 3) ahead of the pneumatic one, supplying
  the Repanich CSU-Chico "Introduction to Motor Sizing" PDF + the
  Oriental Motor sizing page and asking for AC/stepper/servo
  coverage and mechanism cases (belt conveyor, rack & pinion, index
  table, …). Researched (Oriental Motor Technical Reference + blog,
  servo inertia-ratio / safety-factor guidance) and DRAFTED a full
  motor-sizing spec into `calculator-specs.md` §3: coherent-SI
  method, motion profile, inertia building blocks, force/orientation,
  five mechanism modules (direct, lead/ball screw, belt/conveyor,
  rack & pinion, rotary index table; optional vertical hoist),
  torque/RMS/power, and AC/stepper/servo acceptance + margin policy.
  Re-derived Repanich Examples #1 and #3 by hand — formulas
  reproduce them exactly (e.g. Ta=0.0056 N·m, P=0.93 W; J_load=0.81
  oz·in²) — and captured them plus an Oriental Motor RMS example as
  the §3.9 test cases. Spec proposes a 5-slice build order (3.10).
  AWAITING owner approval + which slice to build first. NOTE:
  pneumatic-cylinder spec (§2) still a stub; phase order deviated at
  owner's choice. Nothing built yet for motor sizing.
- 2026-06-14 (later): Owner approved "core + direct + lead screw
  first" and prioritised SERVO. Built motor-sizing slice 1 (see
  Completed): engine + direct drive + lead/ball screw + servo
  acceptance, tests reproducing the Repanich worked examples
  (12/12), and a calm UI at `/tools/motor-sizing` linked from the
  toolkit overview. Surfaced + fixed a modeling detail (driven-load
  inertia is divided by efficiency in the accel torque — Repanich
  convention; spec updated). Lint + build clean. Still NOT pushed.
- 2026-06-14 (later): Before extending, re-verified all motor-sizing
  formulas at the owner's request (reproduce two independent
  Repanich worked examples to <0.2% + first-principles re-derivation
  + cross-check vs Oriental Motor). Then built slice 3 (belt/
  conveyor, rack & pinion, rotary index table) — see Completed.
  16/16 tests, lint + build clean. Still NOT pushed.
- 2026-06-15: Owner supplied more references (Oriental Motor Tech
  Ref TecMtrSiz.pdf with worked examples, Parker linear-motor,
  FAULHABER DC) and asked to double-check our formulas. Did a full
  cross-check — ALL formulas confirmed: cylinder inertia (½mR² =
  (π/32)ρLD⁴), linear-mass inertia (m·(A/2π)² → pulley m·R²),
  parallel axis, belt/rack load torque (F·R/η), power (T·N/9.5493),
  inertia ratio (J/(J0·i²)), trapezoidal profile (OM/Parker 25%
  accel ⇔ Vmax=1.33·Vavg is the special case of our t_a=t_m−X/V).
  Added 2 OM worked-example cross-check tests (belt conveyor 320
  oz·in; ball screw 0.4775 lb·in) — both reproduce exactly → 18/18.
  ONE intentional modeling difference confirmed & documented: OM's
  examples do NOT divide reflected load inertia by η in the accel
  torque; WE DO (Repanich) — it is the physically rigorous +
  conservative choice (proved by derivation). Also documented:
  η = TOTAL drivetrain efficiency (gear treated as ideal kinematic
  ratio i; fold gearhead loss into η); index-table workpieces are
  point masses (omit own J_cg, ~1% — add via fixture inertia if
  large). Spec §3 updated; no code formula changes needed. Lint +
  build clean. Still NOT pushed.
- 2026-06-15 (later): Built motor-sizing slice 4 — stepper & AC
  acceptance (see Completed). Refactored the motor layer to a typed
  union and a discriminated `acceptance` result; added
  `evaluateStepper`/`evaluateAC` + duty cycle; UI gained a
  motor-type selector (None/Servo/Stepper/AC) with per-type fields
  and checks. 21/21 tests, lint + build clean. ui-context.md gained
  a motor-sizing calculator entry. Still NOT pushed. Motor sizing is
  now feature-complete except optional slice 5.
- 2026-06-15 (later): UX polish on the motor-sizing tool at owner's
  request — replaced the text mechanism pills with an ICON CARD GRID
  (new `mechanism-icons.tsx`: custom line-art SVG schematics for
  ball screw, belt conveyor, rack & pinion, index table, direct
  drive, in the project's lucide/Swiss line style). Selecting a card
  now also REVEALS that mechanism's equations (reflected inertia /
  load torque / motor speed + shared force/accel/required formulas)
  in a calm `--canvas` panel. Lint + build clean; prerendered page
  shows all five cards (with `<svg>`) + the formula panel.
  ui-context.md updated. Still NOT pushed.
- 2026-06-15 (later): More motor-sizing UX per owner — cards now
  display LINE-ART ILLUSTRATION IMAGES (owner-supplied) from
  `/public/mechanisms/*.png` at ~96 px, with `MechanismVisual`
  falling back to the built-in SVG line icon (`onError`) if a file
  is absent. Added `public/mechanisms/README.md` listing the exact
  filenames the owner must drop in (ball-screw / belt-conveyor /
  rack-pinion / index-table / direct-drive .png) — the AI can't
  write binary PNGs from chat, so the owner saves them there.
  Behaviour change: the tool now opens with NO inputs — only the
  mechanism cards + a hint; selecting a card reveals the formula
  panel, input fieldsets, and results (`mechanism` state is now
  `Mechanism | null`, initial null). Also fixed a stray backtick
  that had been left at the top of `unit-converter.tsx` (`` `"use
  client" ``) which broke the build. Lint + build clean;
  prerendered page confirms cards + hint with inputs hidden.
  ui-context.md updated. Still NOT pushed.
