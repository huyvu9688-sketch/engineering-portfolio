import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getProjectBySlug, PROJECTS } from "../../../../features/portfolio/data/projects.ts";

const routeSource = readFileSync(
  new URL("./route.ts", import.meta.url),
  "utf8",
);
// The explanatory comment about the content-length bug necessarily
// mentions the removed code by name, so "is it gone?" checks must read
// code only.
const routeCode = routeSource
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");

test("every /api/asset key referenced by projects.ts has a route mapping", () => {
  const mapped = new Set(
    [...routeSource.matchAll(/^\s*"([A-Za-z0-9_-]+)":\s*\{\s*pathname:/gm)].map(
      (m) => m[1],
    ),
  );
  assert.ok(mapped.size > 0, "failed to parse any keys out of route.ts — regex may be stale");

  for (const project of PROJECTS) {
    for (const url of [project.video, project.model].filter(Boolean)) {
      if (!url!.startsWith("/api/asset/")) continue;
      const key = url!.slice("/api/asset/".length);
      assert.ok(
        mapped.has(key),
        `${project.slug} references /api/asset/${key}, but route.ts has no mapping for it`,
      );
    }
  }
});

test("unknown keys have no entry (route returns 404 for them)", () => {
  assert.ok(
    !routeSource.includes('"not-a-real-key"'),
    "sanity check placeholder didn't leak in",
  );
  assert.match(
    routeSource,
    /if \(!asset\) \{\s*return new Response\("Not found", \{ status: 404 \}\);/,
    "route must 404 on a key with no mapping, not fall through to some default asset",
  );
});

test("Blob pathname is never derived from the request — no path passed through unmapped", () => {
  // Regression guard: an earlier version of this route could have taken
  // `key` (or a `path` param) and used it directly as the Blob pathname,
  // which would let a visitor request *any* object in the store just by
  // guessing/brute-forcing pathnames. The route must only ever look up a
  // pathname from the fixed ASSETS map, never build one from the request.
  assert.ok(
    !/get\(\s*(request|key|params)/.test(routeSource),
    "get() must be called with a pathname from the ASSETS map, not request input directly",
  );
});

test("streams the response instead of buffering the whole file", () => {
  assert.match(
    routeSource,
    /new Response\(result\.stream/,
    "large (up to ~56MB) files must be streamed, not buffered into memory",
  );
});

test("project-three's model key matches the Verona expansion project", () => {
  const project = getProjectBySlug("project-three");
  assert.equal(project?.model, "/api/asset/Ut3FhIPX_16r");
});

test("does not set content-length from blob.size", () => {
  // Regression: result.blob.size came back 0 for these compressed
  // (content-encoding: br), chunked-transfer Blob responses even though
  // the stream itself had real data. Setting content-length to that wrong
  // value made fetch() truncate the body to 0 bytes client-side — every
  // asset silently "downloaded" empty. Omitting content-length lets the
  // response stay chunked, which the browser/video/glTF loader all handle.
  assert.ok(
    !routeCode.includes("result.blob.size"),
    "content-length must not be derived from result.blob.size — it's unreliable for compressed/chunked Blob responses and produces a truncated body",
  );
});
