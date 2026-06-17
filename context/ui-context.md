# UI Context

## Design Identity

Swiss-style creative engineering portfolio. The reference is
olhalazarieva.com — match that quality bar on all marketing
surfaces. Light neutral canvas, near-black ink, ONE red-orange
accent. Oversized condensed display type dominates; small uppercase
mono labels for all UI chrome. Hairline borders everywhere.

## Page Modes — CRITICAL

- **Marketing surfaces** (home, portfolio, project detail): full
  design language at senior creative-developer ambition — per-letter
  scroll reveals, clip-path image wipes, expanding cards, hover
  previews, marquee, magnetic buttons, custom cursor, Lenis smooth
  scroll, GSAP ScrollTrigger. See "Design Ambition" below.
- **Utility surfaces** (calculators, database, formula pages,
  admin, CAD viewer): same colors, typography, chips, and borders —
  but CALM. No custom cursor, no marquee, no magnetic buttons, no
  entrance animations beyond a simple fade. People come here to
  work, repeatedly.

## Design Ambition (marketing surfaces)

The bar is a senior front-end / creative-developer portfolio.
Heavy, intentional animation and rich layered composition — not a
template:

- Section-scale motion: staggered per-letter / per-line scroll
  reveals (GSAP + ScrollTrigger), clip-path image wipes, expanding
  morphing cards, hover-driven previews, marquees, magnetic +
  custom cursor
- Layered overlapping layout: oversized display type that crosses
  image and box edges, asymmetric indents, sticky/scroll-reactive
  composition
- Recreate reference sections 1:1 in spirit before adapting content;
  match the reference's section order and rhythm
- `--transition-main` on every hover/state transition for consistent
  motion feel
- Never scroll-jack in a way that traps the user; always honor
  `prefers-reduced-motion` for scroll reveals (content visible
  immediately; cursor and marquee are exempt — core brand effects)

## Colors

| Role                     | CSS Variable        | Value                   |
| ------------------------ | ------------------- | ----------------------- |
| Canvas (page bg)         | `--canvas`          | `#f7f7f7`               |
| Surface (cards, chips)   | `--surface`         | `#ffffff`               |
| Ink (primary text)       | `--ink`             | `#101010`               |
| Ink secondary            | `--ink-muted`       | `#555555`               |
| Ink faint                | `--ink-faint`       | `#a3a3a3`               |
| Dark band (about, footer)| `--surface-dark`    | `#111111`               |
| True dark (loader bg)    | `--surface-black`   | `#050505`               |
| Text on dark             | `--on-dark`         | `#f5f5f5`               |
| Muted on dark            | `--on-dark-muted`   | `#cccccc`               |
| **Accent**               | `--accent`          | `#eb3a14`               |
| Hairline border (light)  | `--hairline`        | `rgba(0,0,0,0.10)`      |
| Hairline border (dark)   | `--hairline-dark`   | `rgba(255,255,255,0.10)`|
| Error                    | `--state-error`     | `#dc2626`               |
| Success                  | `--state-success`   | `#16a34a`               |

Accent rules:
- `--accent` is the ONLY non-neutral color. Used for: hover states,
  active labels/eyebrows, marquee separators, selection highlights,
  small status indicators, service-row hover arrows.
- Never use accent for body text or large surfaces.
- Error/success appear only in form/calculator validation.

## Typography

Three fonts — each with a specific role. Never mix roles.

| Role                          | Font                        | CSS Variable      |
| ----------------------------- | --------------------------- | ----------------- |
| Display (hero, section titles)| Sofia Sans Condensed        | `--font-display`  |
| Body text                     | Inter, ui-sans-serif        | `--font-sans`     |
| UI chrome (labels, nav, mono) | Spline Sans Mono            | `--font-mono`     |

Both display fonts are loaded via `next/font/google`:
```ts
Sofia_Sans_Condensed({ subsets: ["latin"], weight: ["400","700","900"] })
Spline_Sans_Mono({ subsets: ["latin"], weight: ["400","500"] })
```

Type rules:
- **Display** (`--font-display`): uppercase only, tight tracking
  (`tracking-tighter`), weight 700–900. Viewport-scaled on hero
  (`clamp(5rem,15.5vw,22rem)`), `text-5xl`–`text-8xl` on section
  titles. This is the dominant visual element on every marketing page.
- **Mono chrome** (`--font-mono`): ALL nav links, eyebrows, chips,
  captions, metadata, buttons, labels — always uppercase,
  `text-[10px]`–`text-xs`, `tracking-widest`.
- **Body** (`--font-sans`): Inter 400, `text-base`–`text-lg`,
  relaxed leading, `--ink-muted`. Paragraphs, descriptions, long
  copy only.
- Calculator results, units, part numbers, file sizes: `--font-mono`.
- Numeric data: `tabular-nums` so digits align and layout never
  jitters as values change.
- **Instrument readout**: a calculator's governing result renders
  large in tabular mono with accent color, set off by a hairline
  rule. One loud element; supporting values stay as quiet label→value
  rows.

## Border Radius

| Context                             | Class          |
| ----------------------------------- | -------------- |
| Images / media frames               | `rounded-sm`   |
| Pills (buttons, chips, nav, search) | `rounded-full` |
| Cards / panels (utility pages)      | `rounded-lg`   |
| Full-bleed bands (marquee, footer)  | `rounded-none` |

## Signature Components

### Navbar
Fixed top, `mix-blend-difference` so text inverts over any
background. `joseph vu` in `--font-display` condensed, two lines,
uppercase. Center links in a CSS-grid `[ bracket ]` format via
`.link-bracket` class. `link-line` contact CTA (underline-wipe on
hover). Solid pill CTA for contact.

### Hero
Full-viewport opening section. `DESIGN ENGINEER` in
`--font-display` at `clamp(5rem,15.5vw,22rem)` — the dominant
visual. Per-letter staggered rise animation (`.hero-letter`,
`--delay` CSS variable per letter). Gray descriptor box containing
portrait (`joe.png`) at `aspect-3/4`, overlapping the headline.
`BASED IN VIETNAM` mono label. Portfolio + email CTAs with
`ArrowUpRight` arrow that rotates 45° on hover. Page-load one-shot
animation — not scroll-triggered.

### Marquee band
Dark `--surface-dark` strip, `--font-mono` uppercase items
separated by `--accent` dot separators, slow `40s linear infinite`
CSS animation. Engineering skills: SolidWorks, Automation,
Pneumatics, Three.js, Motor Sizing, etc. Pauses on hover.
Always runs — exempt from `prefers-reduced-motion`.

### ServicesSection
Dark `--surface-dark` zone. Four numbered Olha-style service rows:
`01 / AUTOMATION SYSTEMS`, etc. Condensed `--font-display` service
titles, hairline-dark dividers. On hover: row background flashes
accent, arrow icon rotates 45°. "See my work" `link-line` CTA at
bottom.

### AboutSection
Dark `--surface-dark` zone (same surface as ServicesSection —
they read as one continuous dark band). Two-column layout.
Left: intro paragraph + education card. Right: experience timeline
with `--hairline-dark` vertical rule, circular role markers, `[ /
bracket ]` bullet list points. All text on-dark palette; role
titles in `--font-display` condensed.

### ProjectsSection ("Recent Works")
Dark snap-scroll showcase section. Three.js-inspired slider
recreated in CSS scroll snap. Project cards: grayscale → color
on hover, slight scale. Mono accent eyebrow with project number.
Tech chips as bordered pills. "View Project ↗" mono link.

### CredentialsSection ("Awards / Recognition")
Hover-preview list. Each credential row: number, title, mono
metadata. On hover: a preview image wipes in via clip-path;
the row highlights in accent. Engineering disciplines + counts
adapted from Olha's awards section.

### Contact form section
Giant condensed display headline: `GREAT MACHINES / start with /
SHARP ENGINEERING`. Project-type radio pills. Name/email/message
fields. Submits via `mailto:` (no backend needed). Mono labels,
hairline borders.

### Footer
Dark `--surface-dark` band. Oversized `JOSEPH VU` wordmark in
`--font-display`. Email link. Socials (LinkedIn, GitHub). Pages
column. Location column. All text `--on-dark`.

### Contact / info grid
Centered `max-w-[1200px]`, top hairline border. Small accent
eyebrow (`Status: Available`, `tracking-[0.3em]`); giant centered
two-line `--font-display` heading; email link with icon + underline-
to-accent hover. Below a top-hairline divider: 4-column info grid
(Socials, Location, Focus, scroll-to-top button).

### Custom cursor (marketing pages, fine pointers only)
Dot tracks pointer instantly; a circle lerps (0.2 factor) behind it
for an elastic trail. Both `mix-blend-exclusion`. Over `a, button,
.magnetic-btn`: circle scales to 2× + fills `rgba(255,255,255,0.1)`.
While mounted: `body.custom-cursor-active { cursor: none }`.
Disabled on touch devices and utility pages. Exempt from
`prefers-reduced-motion` — core brand effect.

### Magnetic buttons (marketing pages only)
Slight `translate` toward the cursor on hover, returns on leave.
Applied to primary CTAs and the custom cursor target group.

### Page transition
`PageTransition` client component re-keyed on `usePathname()`.
On route change, `animation: page-enter 0.65s
cubic-bezier(0.22,1,0.36,1)` fires once. Disabled under
`prefers-reduced-motion`.

### Project rows (portfolio listing)
Alternating 7/5 column grid. Image: `next/image`, grayscale →
color + slight scale on hover. Mono accent eyebrow with icon. Tech
chips as bordered white pills. "View Project ↗" mono link. Whole
row wrapped in a `Link` to `/portfolio/[slug]`.

### CAD Viewer (utility, `/tools/cad-viewer`, fullscreen route)
Intentionally MINIMAL — utility surface, not marketing. Dark 3D
environment (`0x111111`). One vanilla Three.js engine
(`viewer/lib/viewer-core.js`). Controls: toolbar (reset, isolate,
show-all, measure, import), component tree (searchable, collapsible),
isolate mode (banner), hover glow (blue emissive), measure tool
(face-to-face axis distance, mm + inches), explode slider, section
cut (X/Y/Z, flip, face-align), face properties card, volume + weight
readout. Real component colors from GLB materials kept. No custom
cursor, no GSAP, no Lenis. See architecture.md for engine details.
⚠️ Do not re-add a three.js ViewHelper view-cube without setting
`renderer.autoClear = false` — it clears the canvas every frame.

### Chips/tags
White pill, hairline border, `--font-mono` uppercase `text-[10px]`–
`text-xs`, `--ink-muted`. On dark surfaces: `--on-dark-muted`.

### Buttons
Pill, `--font-mono` uppercase bold. Primary = `--ink` bg / white
text, hover → `--accent`. Secondary = white bg / hairline border.

### Unit converter (utility, `/tools`)
Calm — no cursor, marquee, or magnetic effects. Sticky control-panel
card docked far-right (`lg:order-2 lg:sticky lg:top-28
lg:self-start`). `/tools` page is wide two-column grid
(`max-w-[1800px]`, `lg:grid-cols-[1fr_320px]`) — all sections in
left column so the panel stays visible while scrolling. Vertical
stack: category pills → From input + unit select → Swap button →
To output + unit select → live `1 x = y` equivalence + precision
selector. Native token-styled form controls (not shadcn).

### Motor sizing calculator (utility, `/tools/motor-sizing`)
Calm. Two-column `lg:grid-cols-[1fr_360px]`. Mechanism selector
is an illustration card grid (5 cards: ball screw, belt conveyor,
rack & pinion, index table, direct drive) — nothing shows until one
is selected. Left: grouped `<fieldset>` cards (Mechanism / Motion /
Drive / Candidate motor). Right: sticky results card with
label→value rows + pass/over acceptance block. Motor type is a pill
group (None / Servo / Stepper / AC). Native token-styled controls.

## Motion Rules

### Marketing surfaces
- **Scroll reveals** (GSAP ScrollTrigger): fade/blur/slide or
  per-letter stagger, triggered once per page load
  (`toggleActions: "play none none none"`). Never scrub-pinned.
- **Per-letter reveals** (`.split-letter` spans + `--d` stagger CSS
  var): `gsap.fromTo(".split-letter", { y: "120%", opacity: 0 }, {
  y: 0, opacity: 1, stagger: 0.03, ease: "power3.out",
  scrollTrigger: { start: "top 90%" } })`
- **Hover transitions**: 200–500ms, ease-out, via `--transition-main`
- **Page transition**: `page-enter` CSS keyframe, 0.65s, fires on
  route change
- **Lenis smooth scroll**: initialize on marketing layout root;
  sync to GSAP ticker

### Utility surfaces
Simple fade-in on mount at most. No scroll triggers, no GSAP.

### Reduced motion
`prefers-reduced-motion: reduce` → scroll reveal content appears
immediately (skip animation). Exempt: custom cursor (fine-pointer
only, no flash), marquee (slow non-flashing scroll, always on).
Both are core brand effects and always run per owner decision.

### Do NOT add
- A percentage/progress loader — it fakes progress and punishes
  repeat visitors. Site loads fast; no loader.
- Scroll-jacking that traps the user mid-page.
- GSAP or Lenis on utility pages or in the CAD viewer.

## Component Library

shadcn/ui (neutral base) is reserved for richer utility primitives
(dialogs, data tables, comboboxes) — restyle via tokens. Not yet
installed: the unit converter uses native, token-styled controls
(fewer deps; shadcn init won't touch `globals.css`). Add shadcn
when the first richer primitive is actually needed (likely the
database page). Marketing components (hero, marquee, project rows,
cursor) are custom in `src/components/shared/`. Never hand-edit
`components/ui/*`.

## Layout Patterns

- Content max-width: `max-w-[1800px]` marketing,
  `max-w-6xl` utility pages. Padding `px-4 md:px-6 lg:px-8`.
- Section headers: `--font-display` title + `--font-mono` metadata
  right-aligned, bottom hairline border
  (`border-b border-black/10 pb-6`). Metadata states something true
  (counts, method credit) — not a decorative `01 —` index.
- Home section order: hero → marquee → about → recent works →
  services → credentials → contact form → footer
- Portfolio: listing (project rows) → detail (case study)
- Calculators: white card, hairline border, `rounded-lg`; inputs
  left / live results right (stacked on mobile)
- Database: pill search + chip filters + card grid
- Footer: dark band, oversized `--font-display` wordmark, mono link
  columns

## Icons

Lucide (stroke-based), `stroke-[1.5]`. `w-4 h-4` inline,
`w-5 h-5` in buttons, `w-3 h-3` in eyebrows/chips. Color follows
text; accent only when the icon is the interactive element.
`ArrowUpRight` is a shared SVG component (`components/shared/
arrow-up-right.tsx`) used for all external/CTA links — rotates 45°
on hover.
