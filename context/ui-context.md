# UI Context

## Theme

Swiss-style developer/engineer portfolio: light neutral canvas,
near-black ink, ONE red-orange accent. Oversized tight-tracked
uppercase display type; small uppercase mono labels for all UI
chrome (nav, tags, captions, metadata). Hairline `black/10`
borders. Motion is reveal-based (fade/slide-in once), plus a few
signature marketing-page effects — never scroll-jacked pinning.

This file is the complete, self-contained component spec — built
from an owner-supplied single-page HTML reference during Phase 1
(content rewritten for this project; its imperative JS was
rebuilt as React components per `code-standards.md`). No
separate design-reference file is needed.

## Page Modes — IMPORTANT

- **Marketing surfaces** (landing/home, portfolio, project
  detail): full design language — hero effects, marquee,
  magnetic buttons, custom cursor, reveal animations.
- **Utility surfaces** (calculators, database, formula pages,
  admin): same colors, typography, chips, and borders — but
  CALM. No custom cursor, no marquee, no magnetic buttons, no
  entrance animations beyond a simple fade. People come here to
  work, repeatedly.

## Colors

Base remains Tailwind **neutral** for grays; template colors
mapped to the nearest step. Accent comes from the template.
All via tokens — no hardcoded values in components.

| Role                    | CSS Variable        | Value     | Source            |
| ----------------------- | ------------------- | --------- | ----------------- |
| Canvas (page bg)        | `--canvas`          | `#f5f5f5` | template / n-100  |
| Surface (cards, chips)  | `--surface`         | `#ffffff` | template          |
| Ink (primary text)      | `--ink`             | `#111111` | template          |
| Ink secondary           | `--ink-muted`       | `#555555` | template          |
| Ink faint               | `--ink-faint`       | `#a3a3a3` | n-400             |
| Dark band (marquee, footer) | `--surface-dark` | `#111111` | template          |
| True dark (loader bg)   | `--surface-black`   | `#050505` | template          |
| Text on dark            | `--on-dark`         | `#f5f5f5` | template          |
| Muted on dark           | `--on-dark-muted`   | `#cccccc` | template          |
| **Accent**              | `--accent`          | `#eb3a14` | template          |
| Hairline border (light) | `--hairline`        | `rgba(0,0,0,0.10)` | template |
| Hairline border (dark)  | `--hairline-dark`   | `rgba(255,255,255,0.10)` | template |
| Error                   | `--state-error`     | `#dc2626` | validation only   |
| Success                 | `--state-success`   | `#16a34a` | validation only   |

Accent rules:
- `--accent` is the ONLY color. Used for: hover states on links
  and buttons, the active label/eyebrow, marquee separators,
  selection highlight, small status indicators.
- Never use accent for body text or large surfaces.
- Error/success appear only in form/calculator validation.

## Typography

| Role                          | Font stack                            | Variable      |
| ----------------------------- | ------------------------------------- | ------------- |
| Display + body                | `Inter, ui-sans-serif, system-ui, sans-serif` | `--font-sans` |
| UI chrome / labels / numbers  | `ui-monospace, "SF Mono", Menlo, monospace`   | `--font-mono` |

Type rules from the template:
- Display headlines: uppercase, `font-semibold` (600),
  `tracking-tighter`, oversized (viewport-scaled on hero,
  `text-4xl`–`text-7xl` on section titles).
- ALL chrome text — nav links, eyebrows, chips, captions,
  metadata, buttons — is mono, uppercase, `text-xs`,
  `tracking-widest`.
- Body: Inter 400, `text-base`–`text-lg`, relaxed leading,
  `--ink-muted`.
- Calculator results, units, part numbers, file sizes: mono.
- Numeric data — calculator results, reference tables, input
  fields — use `tabular-nums` so digits align in columns and the
  layout never jitters as values change (an engineering-data
  detail; added 2026-06-15 in the Toolkit refine pass).
- **Instrument readout**: a calculator's single governing result
  is rendered large in tabular mono with the accent and set off by
  a hairline rule (converter "To" output `text-2xl`; motor-sizing
  "Required torque (×SF)" `text-3xl`). It is the one loud element;
  supporting values stay as quiet label→value rows.

## Border Radius

| Context                          | Class          |
| -------------------------------- | -------------- |
| Images / media frames            | `rounded-sm`   |
| Pills (buttons, chips, nav, search) | `rounded-full` |
| Cards / panels (utility pages)   | `rounded-lg`   |
| Full-bleed bands (marquee, footer) | `rounded-none` |

## Signature Components

- **Nav**: fixed top, `mix-blend-difference` white text; center
  links in a `bg-white/10 backdrop-blur` pill; solid white pill
  CTA. Site name in mono uppercase, two lines.
- **Hero**: centered, viewport-scaled uppercase title
  (`text-[13vw] md:text-[10vw]`) with per-line overflow-hidden
  blur+rise reveal; soft radial accent glow (8% opacity,
  blurred) behind; status badge pill with animated accent bars;
  centered subtitle (`max-w-xl mx-auto`); two pill CTAs plus a
  circular icon button (external profile link), all centered
  and magnetic.
- **Status badge**: glass pill (`bg-surface/40 backdrop-blur-md
  border-hairline shadow-sm`); three accent bars of varying
  height (`h-full`, `h-2/3`, `h-full`) pulse opacity on
  independent timers; label in `text-ink font-medium`.
- **Background/Experience section**: two-column layout
  (`md:grid-cols-2`). Left column sticky — accent underline bar,
  intro paragraph, education card (`rounded-lg border-hairline`
  panel). Right column — vertical timeline (`border-l
  border-hairline`), circular markers (accent border for
  current role, hairline for past), role title + mono
  org/dates line (accent for current, muted for past), bullet
  list of points.
- **Contact section**: centered, `max-w-[1200px]`, top hairline
  border. Small accent eyebrow (`Status: ...`,
  `tracking-[0.3em]`); giant centered two-line heading
  (`text-5xl md:text-9xl`); centered email link with icon,
  hairline underline that turns accent on hover. Below a
  top-hairline divider, a 4-column info grid (2 cols mobile):
  Socials, Location, Focus, and a scroll-to-top button in the
  last cell.
- **Marquee band**: dark `--surface-dark` strip, mono uppercase
  items separated by accent dots, slow infinite scroll. Content
  for this project: engineering skills/tools (SolidWorks,
  Automation, Pneumatics, Three.js, ...).
- **Project rows**: alternating 7/5 column grid; image
  grayscale → color on hover with slight scale; mono accent
  eyebrow with icon; tech chips as bordered white pills;
  "View Project ↗" mono link.
- **CAD Viewer** (utility, `/tools/cad-viewer`): intentionally MINIMAL.
  One vanilla Three.js engine file (`viewer/lib/viewer-core.js`,
  excluded from tsconfig, typed via `viewer-core.d.ts`) wrapped by
  `viewer/components/cad-viewer.tsx`. **Dark 3D environment**
  (`0x111111`, the `--surface-dark` token); dark overlays/landing to
  match. Controls: **import** (file picker + drag-drop, read locally),
  orbit/zoom/pan, and a searchable **component tree** (top-right toggle
  → `component-list.js`; click a part to frame it + accent-glow it,
  collapse/expand groups). No toolbar, measure, isolate, or view-cube
  yet (being re-added one at a time). **Real component colours**: the
  file's own materials are KEPT and lit by a neutral `RoomEnvironment`
  map under `NeutralToneMapping`; only sanitised for invisible-import
  causes (near-zero opacity → opaque, broken texture maps stripped,
  `DoubleSide`, `envMapIntensity = 1`); normals recomputed,
  `frustumCulled` off, model recentred to origin, camera fit to scale.
  Lifecycle hardened: one WebGL context per mount, `dispose()` +
  `forceContextLoss()`, capped DPR (1.5), visibility-pause.
  - ⚠️ TWO things to know before re-adding features:
    (1) The "invisible model" was never a render bug — it was a grey
    machine on the old near-black viewport (white bg fixed it).
    (2) three.js `ViewHelper.render()` re-clears the canvas every frame;
    with the default `renderer.autoClear = true` it wiped the white bg
    (+ model) to black, leaving only the gizmo. If a view-cube is
    re-added, set `renderer.autoClear = false` and clear manually
    (`renderer.clear()` → render scene → `viewHelper.render()`), or it
    will black out a light background.
- **Chips/tags**: white pill, hairline border, mono uppercase
  `text-[10px]`–`text-xs`, `--ink-muted`.
- **Buttons**: pill, mono uppercase bold; primary = `--ink` bg
  white text, hover → `--accent`; secondary = white bg hairline
  border.
- **Custom cursor** (marketing pages, fine pointers only):
  dot tracks the pointer instantly; a circle eases (lerps, 0.2)
  behind it for an elastic trail, both `mix-blend-exclusion`.
  Over `a, button, .magnetic-btn` the circle scales to 2× and
  fills `rgba(255,255,255,0.1)` with a transparent border. While
  mounted it hides the native cursor (`body.custom-cursor-active
  { cursor: none }`). Disabled on touch devices and utility
  pages. Runs regardless of reduced-motion (core brand effect).
- **Magnetic buttons** (marketing pages only): slight
  translate-toward-cursor on hover.
- **Unit converter** (utility, `/tools`): calm — no cursor,
  marquee, or magnetic effects. Lives in a **sticky control-panel
  card docked at the far right** of the page (`lg:order-2 lg:sticky
  lg:top-28 lg:self-start lg:max-h-[calc(100vh-8rem)]
  lg:overflow-y-auto`). The `/tools` page is a wide two-column grid
  (`max-w-[1800px]`, `lg:grid-cols-[1fr_320px]`) — ALL page
  sections go in the LEFT column, so the right panel stays visible
  while scrolling through every section (it releases only at the
  page bottom; on short viewports it scrolls internally). On mobile
  it stacks first, above the content. Note: this utility page
  intentionally uses the wide `max-w-[1800px]` (not the usual
  `max-w-6xl`) to dock the panel far-right; body text stays capped
  (`max-w-xl`) for readability. The left column also carries a
  static "Common Conversions" quick-reference grid. Inside the
  `rounded-lg` hairline
  card the content is a **vertical stack**: category pills (mono
  uppercase; active = `--ink` fill + `--on-dark`, inactive =
  hairline + `--ink-muted`, hover → accent) → **From** (value
  `<input>` + unit `<select>`) → a centered circular **Swap**
  button (`ArrowLeftRight`, rotated 90°) → **To** (read-only
  `<output>` on `--canvas` + unit `<select>`) → a top-hairline
  footer with a live `1 x = y` equivalence and a precision selector
  (4/6/8/10 sig figs). All numbers mono; invalid input switches the
  field + helper text to `--state-error`. Built from native
  token-styled form controls (not shadcn).
- **Motor sizing calculator** (utility, `/tools/motor-sizing`):
  calm, its own route (linked from the toolkit overview). Two-column
  `lg:grid-cols-[1fr_360px]`: a left input stack of grouped
  `<fieldset>` cards (Mechanism / Motion / Drive / Candidate motor),
  each with a mono accent `<legend>` and a `sm:grid-cols-2` field
  grid; a right **sticky results card** (`lg:sticky lg:top-28`) of
  label→value rows (peak speed, torques, power, inertia, ratio, duty
  cycle) plus a pass/over acceptance block. The **mechanism
  selector is an illustration card grid** (`grid-cols-2
  sm:grid-cols-3 lg:grid-cols-5`): each card shows a line-art
  mechanism image (`/public/mechanisms/*.png` — ball screw, belt
  conveyor, rack & pinion, index table, direct drive; ~96 px,
  `object-contain`) over a mono label, with the active card
  `border-accent`. If an image file is missing, the card falls back
  automatically to the built-in SVG line icon (`mechanism-icons.tsx`
  + the `MechanismVisual` `onError` swap). **Nothing below the cards
  shows until one is selected** — on open, only the card grid + a
  "select a mechanism" hint appear; clicking a card reveals that
  mechanism's **formula panel** (reflected inertia / load torque /
  motor speed + shared force, accel-torque, required-torque
  formulas), the input fieldsets, and the results column. Motor type
  is a pill group (none / servo / stepper / AC); acceptance checks
  use small `--state-success` / `--state-error` bordered pills.
  Native token-styled controls; results format via the converter's
  `formatResult`.

## Motion Rules

- Reveals: fade/slide/blur-in ONCE on scroll into view
  (IntersectionObserver or GSAP `from` with
  `toggleActions: "play none none none"`). No scrub-pinned
  sections anywhere.
- Hover transitions: 200–500ms, ease-out.
- Respect `prefers-reduced-motion` for reveals (content visible
  immediately) and the hero one-shot/status-bar pulse. The
  custom cursor and the marquee scroll are EXEMPT — they are
  core brand effects and always run (owner's decision,
  2026-06-13). The marquee is a slow, non-flashing continuous
  motion; the cursor is fine-pointer only. Revisit if shipping
  to a motion-sensitive audience.
- **Skip the template's percentage loader.** It fakes progress
  and punishes repeat visitors. Site loads fast; no loader.

## Component Library

shadcn/ui (neutral base) is reserved for **richer** utility
primitives (dialogs, data tables, comboboxes) — restyle via
tokens to match this system. It is NOT yet installed: simple form
fields (the unit converter's inputs/selects) use native,
token-styled controls, which is preferred when a plain `<input>`/
`<select>` does the job (fewer deps, and shadcn init won't touch
the token-defined `globals.css`). Add shadcn when the first richer
primitive is actually needed (likely the database page). Marketing
components (hero, marquee, project rows, cursor) are custom, built
in `src/components/shared/` or feature folders. Never hand-edit
`components/ui/*`.

## Layout Patterns

- Content max-width: `max-w-[1800px]` marketing,
  `max-w-6xl` utility pages. Padding `px-4 md:px-6`.
- Section headers: title + mono metadata right-aligned, bottom
  hairline border (`border-b border-black/10 pb-6`). The metadata
  must state something true (live/planned counts, "Computed in
  SI", a method credit) — not a decorative `01 —` index.
- Landing flow: hero → marquee → entry points (portfolio /
  toolkit / database) → background &amp; experience →
  contact/footer.
- Calculators: white card, hairline border, `rounded-lg`;
  inputs left / live results right (stacked mobile); results
  update on input.
- Database: pill search + chip filters + card grid.
- Footer: dark band, oversized wordmark, mono link columns.

## Icons

Lucide (stroke-based), `stroke-[1.5]`. `w-4 h-4` inline,
`w-5 h-5` in buttons, `w-3 h-3` in eyebrows/chips. Color
follows text color; accent only when the icon is the
interactive element.
