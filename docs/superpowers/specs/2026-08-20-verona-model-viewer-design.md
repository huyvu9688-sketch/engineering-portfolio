# Verona model viewer design

## Scope

Replace Verona Expansion’s third rotating still (`/3.2.png`) with an interactive GLB viewer
below Overview, in the same compact 16:9 panel used for project videos. The model is
`/12400_10000.glb`; it must be tracked with Git LFS because its 110 MB size exceeds GitHub’s
normal file limit.

## Implementation

- Configure Git LFS to track `*.glb` and commit the resulting `.gitattributes` entry plus the
  GLB pointer file.
- Add `@google/model-viewer` and load its web component only on the Verona detail page via a
  client-side wrapper.
- Add optional `model?: string` to shared project data. Verona uses `/12400_10000.glb`; Foam
  and Router have no model.
- Verona still rotation becomes `/3.png` then `/3.1.png`; `/3.2.png` remains unrendered.
- In the shared below-Overview panel, render `model-viewer` when `project.model` exists;
  otherwise retain the existing optional video. The model gets `camera-controls`, `auto-rotate`,
  `shadow-intensity="1"`, and an accessible `alt` description.

## Verification

Confirm Git LFS tracks the GLB, build/lint/tests pass, Verona renders the interactive model
with no video, and Foam/Router continue to render their videos.
