import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CATEGORIES,
  CATEGORY_KEYS,
  MAX_FILE_BYTES,
  getCategory,
  isAcceptedExtension,
  acceptAttribute,
} from "./categories.ts";

test("there are exactly 6 categories with unique keys", () => {
  assert.equal(CATEGORIES.length, 6);
  assert.equal(new Set(CATEGORY_KEYS).size, 6);
});

test("getCategory returns def for known key, undefined otherwise", () => {
  assert.equal(getCategory("cad_3d")?.label, "3D CAD Models");
  assert.equal(getCategory("nope"), undefined);
});

test("isAcceptedExtension is case-insensitive and category-scoped", () => {
  assert.equal(isAcceptedExtension("cad_3d", "STEP"), true);
  assert.equal(isAcceptedExtension("cad_3d", "step"), true);
  assert.equal(isAcceptedExtension("cad_3d", "pdf"), false);
  assert.equal(isAcceptedExtension("drawing_2d", "dwg"), true);
  assert.equal(isAcceptedExtension("image", "png"), true);
});

test("acceptAttribute renders a dot-prefixed comma list for <input accept>", () => {
  assert.equal(acceptAttribute("drawing_2d"), ".pdf,.dwg,.dxf");
});

test("MAX_FILE_BYTES is 50 MB", () => {
  assert.equal(MAX_FILE_BYTES, 50 * 1024 * 1024);
});
