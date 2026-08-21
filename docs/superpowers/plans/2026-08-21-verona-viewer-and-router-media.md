# Verona Viewer and Auto Router Media Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Brighten Verona's web-safe 3D model, communicate its load state, and rotate the three new Auto Router Cell still images.

**Architecture:** Keep project media as declarative data in `projects.ts`; extend its existing Node regression assertion with Project 2's complete image order and Verona's `.web.glb` path. Keep Three.js lifecycle inside `ProjectModelViewer`, where React state controls an overlay layered above the existing fixed-aspect canvas frame.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Three.js `GLTFLoader`/`DRACOLoader`, Node test runner.

---

### Task 1: Define the approved Auto Router media sequence

**Files:**

- Modify: `src/features/portfolio/data/projects.test.ts`
- Modify: `src/features/portfolio/data/projects.ts`

- [ ] **Step 1: Write the failing media-data assertion**

In the `project-two` expected record in `Works projects expose their approved media`, replace its `images` assertion with:

```ts
images: ["/2.png", "/2.1.png", "/2.2.jpg", "/2.3.jpg", "/2.4.png"],
```

Keep the existing exact Project 3 assertion:

```ts
model: "/12400_10000.web.glb",
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```powershell
npm test -- --test-name-pattern "Works projects expose their approved media"
```

Expected: FAIL because Project 2 currently exposes only `/2.png` and `/2.1.png`.

- [ ] **Step 3: Add only the new still-image paths to project data**

In the `project-two` record in `src/features/portfolio/data/projects.ts`, replace the current image array with:

```ts
images: ["/2.png", "/2.1.png", "/2.2.jpg", "/2.3.jpg", "/2.4.png"],
```

Do not add `/2.3.mp4` and do not change `video: "/2.mp4"`. Do not modify Project 3's `model` value: it remains `/12400_10000.web.glb`.

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```powershell
npm test -- --test-name-pattern "Works projects expose their approved media"
```

Expected: PASS with one matching subtest.

- [ ] **Step 5: Commit the verified data mapping**

```powershell
git add -- src/features/portfolio/data/projects.ts src/features/portfolio/data/projects.test.ts public/2.2.jpg public/2.3.jpg public/2.4.png
git commit -m "feat: add Auto Router project stills"
```

### Task 2: Add an honest 3D viewer loading state and brighter lighting

**Files:**

- Modify: `src/features/portfolio/components/project-model-viewer.tsx`

- [ ] **Step 1: Add an initially failing source-level regression assertion**

Create `src/features/portfolio/components/project-model-viewer.test.ts`:

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("./project-model-viewer.tsx", import.meta.url),
  "utf8",
);

test("ProjectModelViewer provides loading feedback and balanced lighting", () => {
  assert.match(source, /Loading 3D model/);
  assert.match(source, /setLoadState\("ready"\)/);
  assert.match(source, /setLoadState\("error"\)/);
  assert.match(source, /new THREE\.DirectionalLight\(0xffffff, 3\.5\)/);
  assert.match(source, /new THREE\.DirectionalLight\(0xffffff, 1\.8\)/);
});
```

- [ ] **Step 2: Run the new test and verify it fails**

Run:

```powershell
npm test -- --test-name-pattern "ProjectModelViewer provides loading feedback"
```

Expected: FAIL because the current component has no `loadState`, loading copy, failure callback, or fill light.

- [ ] **Step 3: Implement the viewer state, callback, and neutral lighting**

Update the React import and add a load-state type:

```ts
import { useEffect, useRef, useState } from "react";

type LoadState = "loading" | "ready" | "error";
```

At the start of `ProjectModelViewer`, add:

```ts
const [loadState, setLoadState] = useState<LoadState>("loading");
```

At the beginning of the effect, reset it when `src` changes:

```ts
setLoadState("loading");
```

Replace the existing two-light setup with:

```ts
scene.add(new THREE.HemisphereLight(0xffffff, 0x6b7280, 3.2));

const keyLight = new THREE.DirectionalLight(0xffffff, 3.5);
keyLight.position.set(5, 8, 6);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 1.8);
fillLight.position.set(-6, 3, -4);
scene.add(fillLight);
```

After `controls.update()` in the successful `loader.load` callback, add:

```ts
setLoadState("ready");
```

Supply the error callback as the fourth `loader.load` argument:

```ts
undefined,
() => {
  if (!disposed) setLoadState("error");
},
```

Replace the return markup with a frame containing the ref plus a non-interactive status overlay:

```tsx
<div
  className="relative mt-10 aspect-video max-w-3xl overflow-hidden rounded-sm border border-hairline bg-surface"
  role="img"
  aria-label={alt}
>
  <div ref={containerRef} className="h-full w-full" />
  {loadState !== "ready" ? (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface/90 text-ink-muted"
      aria-live="polite"
      aria-atomic="true"
    >
      {loadState === "loading" ? (
        <>
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-ink-faint border-t-accent" aria-hidden="true" />
          <span className="font-mono text-[10px] uppercase tracking-widest">Loading 3D model</span>
        </>
      ) : (
        <span className="max-w-xs text-center font-mono text-[10px] uppercase tracking-widest">Unable to load 3D model</span>
      )}
    </div>
  ) : null}
</div>
```

Keep renderer color-space configuration, camera framing, `OrbitControls`, auto-rotation, Draco decoder path, resize observer, and disposal logic unchanged.

- [ ] **Step 4: Run the new regression test and verify it passes**

Run:

```powershell
npm test -- --test-name-pattern "ProjectModelViewer provides loading feedback"
```

Expected: PASS with one matching subtest.

- [ ] **Step 5: Commit the viewer behavior**

```powershell
git add -- src/features/portfolio/components/project-model-viewer.tsx src/features/portfolio/components/project-model-viewer.test.ts
git commit -m "feat: improve Verona model loading"
```

### Task 3: Verify the release unit and record progress

**Files:**

- Modify: `context/progress-tracker.md`

- [ ] **Step 1: Run automated verification**

Run:

```powershell
npm test
npm run lint
npm run build
```

Expected: every Node test passes, ESLint exits successfully, and Next.js completes the production build.

- [ ] **Step 2: Verify the two routes in a fresh browser session**

Using the owner's existing local development server, hard-reload `/portfolio/project-three` and verify the `Loading 3D model` overlay is visible while the GLB loads, clears when the model appears, and the neutral-lit model is visibly readable while auto-rotating and responding to drag controls. Check the browser console for GLTF/Draco errors.

Hard-reload `/portfolio/project-two`, wait through the five-second transitions, and verify the still order is `/2.png`, `/2.1.png`, `/2.2.jpg`, `/2.3.jpg`, `/2.4.png`; the page frame must remain stable throughout.

- [ ] **Step 3: Add the progress note without overwriting unrelated tracker edits**

Insert a dated first bullet under `## Session Notes (most recent first)` that records:

```md
- **2026-08-21 (Verona viewer + Auto Router media)**: Verona continues to load `/12400_10000.web.glb`; its Three.js frame now gives visible loading/error feedback and uses balanced neutral key/fill lighting for CAD legibility. Auto Router Cell rotates `/2.png`, `/2.1.png`, `/2.2.jpg`, `/2.3.jpg`, and `/2.4.png`; `/2.3.mp4` remains excluded.
```

- [ ] **Step 4: Inspect the staged tracker change and commit it**

```powershell
git add -p -- context/progress-tracker.md
git diff --cached --check
git diff --cached -- context/progress-tracker.md
git commit -m "docs: record portfolio media updates"
```

Only stage the new dated note; leave every pre-existing modified context hunk untouched.
