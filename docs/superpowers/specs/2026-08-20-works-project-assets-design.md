# Works project asset update

## Scope

Update the existing three shared portfolio records so the home-page Works carousel,
portfolio listing, and project detail pages show the owner-provided project names and
primary PNGs. No layout, interaction, routing, gallery, or video behavior changes.

## Project mapping

| Order | Title | Primary image |
| --- | --- | --- |
| 01 | Foam Cell Automation | `/1.png` |
| 02 | Auto Router Cell | `/2.png` |
| 03 | Verona Expansion | `/3.png` |

## Deferred assets

`1.1.png`, `2.1.png`, `3.1.png`, `3.2.png`, `1.mp4`, and `2.mp4` remain in `public/`
but are not rendered. Gallery and video support are explicitly out of scope.

## Implementation and verification

Change only `src/features/portfolio/data/projects.ts`, the shared source of truth for
project card and detail content. Verify the three image paths and titles through a
production build and lint run.
