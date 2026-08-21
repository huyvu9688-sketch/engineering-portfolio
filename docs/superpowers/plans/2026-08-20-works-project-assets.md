# Works Project Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the owner-provided titles and primary PNGs for all three projects everywhere they are rendered.

**Architecture:** `PROJECTS` in `src/features/portfolio/data/projects.ts` is the shared source of truth consumed by the home-page Works carousel, portfolio listing, and detail routes. Update only the three corresponding records and add a small data regression test; no component, route, gallery, or video changes are needed.

**Tech Stack:** Next.js 16, TypeScript, Node built-in test runner, ESLint.

---

## File structure

- Modify: `src/features/portfolio/data/projects.ts` — assign the three approved titles and image paths to the existing project records.
- Create: `src/features/portfolio/data/projects.test.ts` — assert that each immutable slug resolves to its approved title and image path.
- Modify: `context/progress-tracker.md` — record the verified content update.

### Task 1: Lock down the approved project mapping

**Files:**
- Create: `src/features/portfolio/data/projects.test.ts`
- Modify: `src/features/portfolio/data/projects.ts:17-62`

- [ ] **Step 1: Write the failing regression test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { getProjectBySlug } from "./projects.ts";

test("maps the three Works projects to their approved titles and primary images", () => {
  assert.deepEqual(
    ["project-one", "project-two", "project-three"].map((slug) => {
      const project = getProjectBySlug(slug);
      return { title: project?.title, image: project?.image };
    }),
    [
      { title: "Foam Cell Automation", image: "/1.png" },
      { title: "Auto Router Cell", image: "/2.png" },
      { title: "Verona Expansion", image: "/3.png" },
    ],
  );
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`

Expected: the mapping assertion fails because the records contain placeholder titles and no image paths.

- [ ] **Step 3: Update the three shared records**

Add these properties to the existing records without changing their slugs, summaries, categories, tags, roles, timeframes, or overview placeholders:

```ts
// project-one
title: "Foam Cell Automation",
image: "/1.png",

// project-two
title: "Auto Router Cell",
image: "/2.png",

// project-three
title: "Verona Expansion",
image: "/3.png",
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`

Expected: the approved mapping test passes, including the existing scroll-letter regression test.

- [ ] **Step 5: Commit the data mapping**

```bash
git add src/features/portfolio/data/projects.ts src/features/portfolio/data/projects.test.ts
git commit -m "feat: add Works project titles and images"
```

### Task 2: Verify the rendered portfolio surfaces and record progress

**Files:**
- Modify: `context/progress-tracker.md`

- [ ] **Step 1: Run static checks**

Run: `npm run lint`

Expected: exit code 0 with no ESLint errors.

- [ ] **Step 2: Build the production app**

Run: `npm run build`

Expected: exit code 0, with `/`, `/portfolio`, and all three static portfolio detail routes generated.

- [ ] **Step 3: Verify the home-page card source uses the shared image data**

Run: `rg -n "src=\{project\.image" src/components/shared/projects-section.tsx`

Expected: the Works card renders `project.image` before its removed-mechanism fallback, so the three approved PNG paths are selected.

- [ ] **Step 4: Update the progress tracker**

Add a dated session note stating that the Works project records now use Foam Cell Automation (`/1.png`), Auto Router Cell (`/2.png`), and Verona Expansion (`/3.png`), while the numbered secondary PNGs and MP4 files remain intentionally unused.

- [ ] **Step 5: Commit the tracker note**

```bash
git add context/progress-tracker.md
git commit -m "docs: record Works project asset update"
```
