# Verona Model Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render Verona’s GLB model in the detail-page media panel and remove its third rotating still.

**Architecture:** Git LFS stores the 110 MB GLB pointer. Shared project data exposes an optional model path; a client wrapper registers `@google/model-viewer`; the detail route selects model panel over video. Existing rotating stills remain client-managed.

**Tech Stack:** Git LFS, Next.js 16, TypeScript, `@google/model-viewer`, Node tests.

---

### Task 1: Track the GLB and define its shared data

**Files:** `.gitattributes`, `public/12400_10000.glb`, `src/features/portfolio/data/projects.ts`, `src/features/portfolio/data/projects.test.ts`

- [ ] Write failing test assertions: Verona `images` equals `["/3.png", "/3.1.png"]`, `model` equals `"/12400_10000.glb"`; the other two `model` values are undefined.
- [ ] Run `npm test`; expect the new mappings to fail.
- [ ] Add optional `model?: string`, remove `/3.2.png` from Verona’s image list, add its model path.
- [ ] Run `git lfs track "*.glb"`, stage `.gitattributes` and only `public/12400_10000.glb`, and verify `git lfs ls-files` lists the model.
- [ ] Run `npm test`; expect passing media assertions.
- [ ] Commit only data/test/LFS pointer files: `feat: add Verona project model`.

### Task 2: Render the interactive model panel

**Files:** `package.json`, `package-lock.json`, `src/features/portfolio/components/project-model-viewer.tsx`, `src/app/(site)/portfolio/[slug]/page.tsx`

- [ ] Install `@google/model-viewer`.
- [ ] Create a client `ProjectModelViewer({ src, alt })` that imports the web component and renders `<model-viewer src={src} alt={alt} camera-controls auto-rotate shadow-intensity="1" />` inside the compact 16:9 bordered panel.
- [ ] Update the detail page to render the model panel when `project.model` is defined; otherwise preserve the existing conditional video behavior.
- [ ] Run `npm test && npm run lint && npm run build`; expect all checks to pass and all project routes to generate.
- [ ] Commit only package, wrapper, and detail-page files: `feat: display Verona project model`.
