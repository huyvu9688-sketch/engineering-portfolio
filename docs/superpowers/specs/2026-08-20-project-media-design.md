# Project media presentation update

## Scope

Improve the portfolio’s project-media presentation without changing the existing project
routes, text content, or visual language. All still images remain framed without cropping;
detail pages rotate their project-specific image sets and show native videos for projects one
and two below Overview.

## Shared project data

Extend the existing `Project` record with optional media fields:

- `images?: string[]` — ordered detail-page stills. `image` remains the primary cover used
  by the Works carousel and portfolio listing.
- `video?: string` — a detail-page native video source.

| Project | Cover and rotating stills | Video |
| --- | --- | --- |
| Foam Cell Automation | `/1.png`, `/1.1.png` | `/1.mp4` |
| Auto Router Cell | `/2.png`, `/2.1.png` | `/2.mp4` |
| Verona Expansion | `/3.png`, `/3.1.png`, `/3.2.png` | none |

`2.3.mp4` is intentionally out of scope.

## Detail-page media

Create a client-side media component used only by project detail pages. It starts on the
primary image, advances every five seconds, loops to the first image, and cross-fades between
stills. A one-image project would remain static, but all three current projects have two or
more images. The component supplies a full, descriptive alt text for the active still.

The detail media frame becomes a centered `max-w-[1500px]` 16:10 frame. Images use
`object-contain` with internal padding so every CAD drawing remains completely visible rather
than cropped. The compact width preserves more whitespace than the current full 1800px layout.

## Listing and Works cards

Both continue to use only the existing primary `image` path. Their image classes switch to
`object-contain` with padding so their cover visuals are fully visible. No carousel, row, or
route behavior changes.

## Videos

Immediately below the Overview content, render a compact 16:9 native `<video>` panel only
when `project.video` exists. It uses `autoPlay`, `muted`, `loop`, `playsInline`, `controls`,
and `preload="metadata"`. It is not rendered for Verona Expansion.

## Verification

Unit-test the shared media mapping. Build and lint the app, and manually verify that each
detail route rotates only through its assigned PNGs; Foam and Router show a controllable,
muted looping video below Overview; Verona has no video panel; all image frames show their
complete visual.
