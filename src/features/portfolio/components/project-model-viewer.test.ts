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
