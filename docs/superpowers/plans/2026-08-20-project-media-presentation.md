# Project Media Presentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show complete project stills, rotate detail images, and add compact videos for the first two projects.

**Architecture:** Shared `Project` records add ordered stills and an optional video path. A client-only rotator manages five-second fades; the server detail route supplies that data and conditionally renders a native video. Listing media switches from crop to containment.

**Tech Stack:** Next.js 16, React 19, TypeScript, `next/image`, native HTML video, Node tests, Tailwind v4.

---

### Task 1: Define and test shared media data

**Files:**

- Modify: `src/features/portfolio/data/projects.ts`
- Modify: `src/features/portfolio/data/projects.test.ts`

- [ ] **Step 1: Add failing media assertions**

```ts
assert.deepEqual(getProjectBySlug("project-one")?.images, ["/1.png", "/1.1.png"]);
assert.equal(getProjectBySlug("project-one")?.video, "/1.mp4");
assert.deepEqual(getProjectBySlug("project-two")?.images, ["/2.png", "/2.1.png"]);
assert.equal(getProjectBySlug("project-two")?.video, "/2.mp4");
assert.deepEqual(getProjectBySlug("project-three")?.images, ["/3.png", "/3.1.png", "/3.2.png"]);
assert.equal(getProjectBySlug("project-three")?.video, undefined);
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`

Expected: failure because `images` and `video` are absent.

- [ ] **Step 3: Add exact media fields**

```ts
export interface Project {
  // existing fields
  images?: string[];
  video?: string;
}

// project-one
images: ["/1.png", "/1.1.png"],
video: "/1.mp4",
// project-two
images: ["/2.png", "/2.1.png"],
video: "/2.mp4",
// project-three
images: ["/3.png", "/3.1.png", "/3.2.png"],
```

Do not add `/2.3.mp4` or modify primary cover paths/text fields.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`

Expected: all media and existing regression tests pass.

- [ ] **Step 5: Commit the data mapping**

```bash
git add src/features/portfolio/data/projects.ts src/features/portfolio/data/projects.test.ts
git commit -m "feat: add project media data"
```

### Task 2: Add detail media rotation and optional videos

**Files:**

- Create: `src/features/portfolio/components/project-media-rotator.tsx`
- Modify: `src/app/(site)/portfolio/[slug]/page.tsx`

- [ ] **Step 1: Create a client rotator**

Implement `ProjectMediaRotator({ images, title })` with `useState(0)` and a `useEffect` interval that advances `(index + 1) % images.length` every 5000ms only when `images.length >= 2`; clean up the timer. Render every `next/image` absolutely in a `relative mx-auto aspect-16/10 max-w-[1500px]` frame with `object-contain p-4`, `duration-700`, and opacity based on the active index.

- [ ] **Step 2: Wire the rotator to the detail page**

Use `const projectImages = project.images ?? (project.image ? [project.image] : []);`. Render the rotator for a nonempty set and retain `ImageOff` as the empty-set fallback.

- [ ] **Step 3: Add the conditional native video after Overview**

```tsx
{project.video ? (
  <div className="mt-10 max-w-3xl overflow-hidden rounded-sm border border-hairline bg-surface p-3">
    <video className="aspect-video w-full rounded-sm" src={project.video} autoPlay controls loop muted playsInline preload="metadata" />
  </div>
) : null}
```

- [ ] **Step 4: Commit detail media**

```bash
git add src/features/portfolio/components/project-media-rotator.tsx src/app/(site)/portfolio/[slug]/page.tsx
git commit -m "feat: rotate project detail media"
```

### Task 3: Contain listing images and verify

**Files:**

- Modify: `src/features/portfolio/components/project-row.tsx`
- Modify: `context/progress-tracker.md`

- [ ] **Step 1: Replace the listing image class**

```tsx
className="h-full w-full object-contain p-4 grayscale transition-all duration-500 group-hover:scale-[1.02] group-hover:grayscale-0"
```

The Works carousel already uses contained primary images, so do not change it.

- [ ] **Step 2: Run full verification**

Run: `npm test && npm run lint && npm run build`

Expected: all tests/lint pass and build generates `/`, `/portfolio`, and all three detail routes.

- [ ] **Step 3: Manually verify detail routes**

Confirm full CAD visuals, five-second assigned-still rotation, narrow media frame, videos for projects one/two below Overview, and no video for project three.

- [ ] **Step 4: Record and commit the tracker note safely**

Document containment, image sets, rotation timing, and `/1.mp4`/`/2.mp4`. Stage only the new hunk because the tracker is already dirty.

```bash
git diff --cached -- context/progress-tracker.md
git diff --cached --check
git commit -m "docs: record project media update"
```

- [ ] **Step 5: Commit listing styling**

```bash
git add src/features/portfolio/components/project-row.tsx
git commit -m "style: contain portfolio project images"
```
