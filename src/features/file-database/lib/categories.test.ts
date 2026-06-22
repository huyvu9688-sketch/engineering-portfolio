import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CATEGORIES,
  CATEGORY_KEYS,
  MAX_FILE_BYTES,
  getCategory,
  isAcceptedExtension,
  acceptAttribute,
  firstCategoryForExtension,
} from "./categories.ts";

test("there are exactly 11 categories with unique keys", () => {
  assert.equal(CATEGORIES.length, 11);
  assert.equal(new Set(CATEGORY_KEYS).size, 11);
});

test("getCategory returns def for known key, undefined otherwise", () => {
  assert.equal(getCategory("cad")?.label, "CAD");
  assert.equal(getCategory("nope"), undefined);
});

test("isAcceptedExtension is case-insensitive and category-scoped", () => {
  assert.equal(isAcceptedExtension("cad", "STEP"), true);
  assert.equal(isAcceptedExtension("cad", "step"), true);
  assert.equal(isAcceptedExtension("cad", "pdf"), false);
  assert.equal(isAcceptedExtension("model_3d", "stl"), true);
  assert.equal(isAcceptedExtension("image", "png"), true);
});

test("acceptAttribute renders a dot-prefixed comma list for <input accept>", () => {
  assert.equal(acceptAttribute("ppt"), ".ppt,.pptx");
});

test("MAX_FILE_BYTES is 50 MB", () => {
  assert.equal(MAX_FILE_BYTES, 50 * 1024 * 1024);
});

test("no extension belongs to more than one category", () => {
  const seen = new Set<string>();
  for (const c of CATEGORIES) {
    for (const ext of c.extensions) {
      assert.equal(seen.has(ext), false, `${ext} appears in more than one category`);
      seen.add(ext);
    }
  }
});

test("firstCategoryForExtension maps every category's extensions exactly", () => {
  assert.equal(firstCategoryForExtension("step"), "cad");
  assert.equal(firstCategoryForExtension("DWG"), "cad"); // case-insensitive
  assert.equal(firstCategoryForExtension("sldprt"), "cad");
  assert.equal(firstCategoryForExtension("stl"), "model_3d");
  assert.equal(firstCategoryForExtension("glb"), "model_3d");
  assert.equal(firstCategoryForExtension("pdf"), "pdf");
  assert.equal(firstCategoryForExtension("docx"), "word");
  assert.equal(firstCategoryForExtension("doc"), "word");
  assert.equal(firstCategoryForExtension("xlsx"), "excel");
  assert.equal(firstCategoryForExtension("csv"), "csv");
  assert.equal(firstCategoryForExtension("ppt"), "ppt");
  assert.equal(firstCategoryForExtension("png"), "image");
  assert.equal(firstCategoryForExtension("svg"), "image");
  assert.equal(firstCategoryForExtension("txt"), "text");
  assert.equal(firstCategoryForExtension("zip"), "archive");
  assert.equal(firstCategoryForExtension("mp4"), "video");
  // Unknown extension → null.
  assert.equal(firstCategoryForExtension("xyz"), null);
});
