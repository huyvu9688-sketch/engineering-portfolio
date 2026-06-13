# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Phase 1 — Foundation & landing page (In progress — local build
  complete; deploy to Vercel remaining)

## Phase Plan

1. **Phase 1** — Project setup, theme tokens, navbar/footer,
   landing page, deploy to Vercel
2. **Phase 2** — Portfolio: about, resume, project cards,
   project detail page, GLB viewer embed
3. **Phase 3** — Toolkit: unit converter → pneumatic cylinder
   calculator → motor sizing calculator
4. **Phase 4** — Database: Supabase setup, schema + RLS,
   admin auth, upload, browse/filter, download
5. **Phase 5+** — Tolerance/fit calculator, standard parts
   library, formula reference, blog/notes

## Current Goal

- Connect Vercel, verify live URL (GitHub push done)

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

## In Progress

- None.

## Next Up

- Connect Vercel to the GitHub repo, deploy, verify live URL
  (needs owner's Vercel account — quick web flow)
- shadcn/ui setup deferred until first utility page (Phase 3)
  needs form primitives — nothing on the landing page uses it

## Open Questions

- `AboutSection` ("Background" section on the landing page) has
  placeholder experience/education content in bracketed text
  (`[Company Name]`, `[Degree / Program]`, etc.). Owner to
  provide real role titles, companies, dates, achievements, and
  education before this ships.
- `context/design-reference.html` is referenced by CLAUDE.md
  and ui-context.md but does not exist in the repo. Phase 1 was
  built from the written component specs in ui-context.md.
  Restore the file or remove the references.
- Hero now reads "Joseph Vu" / "Engineering Portfolio" /
  "Open to work", contact email huyvu9688@gmail.com — owner to
  confirm this is final (title/role line still TBD for
  nav/footer)
- Contact section's Socials column links to `#` placeholders
  (LinkedIn, GitHub) and Location is bracketed
  (`[City, Country]`, `[Remote / On-site]`) — owner to provide
  real URLs and location
- Final project/site name (working name: EngiHub)
- Domain: Vercel subdomain first, custom domain later?
- Which portfolio projects (and GLB files) go in first? Confirm
  company-IP clearance for anything published
- Phase 3 prerequisite: owner writes `calculator-specs.md`
  (formulas, input ranges, units, defaults) before each
  calculator is built — AI must not invent engineering math

## Pre-Flight Checklist (before first build session)

- [x] Node.js LTS installed
- [x] GitHub repo created (huyvu9688-sketch/engineering-portfolio)
- [ ] Vercel account linked to GitHub
- [ ] Claude Code installed in VS Code
- [ ] Content gathering started: resume PDF, 2-3 project
      writeups, photos, shareable GLB exports

## Architecture Decisions

- FINAL design direction: Swiss-style portfolio template
  (`context/design-reference.html`) — light neutral canvas,
  #111 ink, single #EB3A14 accent, Inter + mono chrome, pill
  buttons, reveal-based motion. Replaces both earlier themes
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
