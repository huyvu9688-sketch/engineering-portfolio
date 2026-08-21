# Verona Viewer and Auto Router Media Design

## Goal

Make the Verona Expansion 3D model easy to see while it loads and after it is rendered, and include the newly provided still images in Auto Router Cell's rotating media presentation.

## Scope

- Keep Verona's model URL set to `/12400_10000.web.glb`, the browser-safe model asset.
- Add a loading overlay to the existing reserved-size model frame. It will include an animated, non-percentage indicator and the explicit label `Loading 3D model`.
- Remove the overlay only after `GLTFLoader` finishes successfully.
- If the model request or parse fails, replace the loading state with a concise visible error message. This prevents an unexplained blank viewer.
- Improve model legibility with a brighter neutral three-point lighting setup: hemisphere light for broad ambient illumination, a stronger upper-front key light, and a softer opposing fill light. The renderer will continue to preserve sRGB material colors and the white surface frame.
- Add `/2.2.jpg`, `/2.3.jpg`, and `/2.4.png` after the current two Auto Router Cell images. The existing rotator will continue its five-second crossfade through all five still images. `/2.3.mp4` is out of scope because this request is for added pictures.

## Component Boundaries

- `src/features/portfolio/components/project-model-viewer.tsx` owns Three.js lifecycle, loading/error state, lighting, and viewer accessibility status.
- `src/features/portfolio/data/projects.ts` owns the ordered list of static project media paths.
- `src/features/portfolio/data/projects.test.ts` verifies the approved static asset sequence, so a future data edit cannot silently remove the new images or change the viewer source.

## Interaction and Accessibility

- The frame retains its aspect ratio throughout loading, avoiding layout shift.
- The status message is exposed with a polite live region so assistive technology receives the loading completion or failure update.
- The loader has no fabricated percentage; model download and decoding duration are not directly measurable with the present loader configuration.
- Orbit controls remain available as soon as the canvas is mounted, and auto-rotation remains unchanged after the model appears.

## Verification

- First add regression assertions for the full Project 2 image list and retained `.web.glb` source; observe the test failure before implementation.
- Run the project test suite, lint, and production build after the changes.
- Load `/portfolio/project-three` from a fresh local server session and confirm: loading feedback appears before the model, then disappears; the model is visibly brighter; orbit interaction and auto-rotation still work; and browser console has no GLTF errors.
- Load `/portfolio/project-two` and confirm all five still images appear in the intended cycle without layout shift.
