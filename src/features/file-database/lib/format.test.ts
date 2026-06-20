import { test } from "node:test";
import assert from "node:assert/strict";
import { formatFileSize, fileExtension, sanitizeFilename, slugify } from "./format.ts";

test("formatFileSize renders human-readable sizes", () => {
  assert.equal(formatFileSize(0), "0 B");
  assert.equal(formatFileSize(512), "512 B");
  assert.equal(formatFileSize(1024), "1 KB");
  assert.equal(formatFileSize(1536), "1.5 KB");
  assert.equal(formatFileSize(1048576), "1 MB");
  assert.equal(formatFileSize(52428800), "50 MB");
});

test("fileExtension returns lowercase extension without dot", () => {
  assert.equal(fileExtension("Bracket.STEP"), "step");
  assert.equal(fileExtension("drawing.final.pdf"), "pdf");
  assert.equal(fileExtension("noext"), "");
});

test("sanitizeFilename strips unsafe chars but keeps a usable name", () => {
  assert.equal(sanitizeFilename("My Part #3 (rev A).step"), "my-part-3-rev-a.step");
  assert.equal(sanitizeFilename("  spaced  .pdf "), "spaced.pdf");
});

test("slugify produces url-safe slugs", () => {
  assert.equal(slugify("Gearbox Assembly 2025"), "gearbox-assembly-2025");
  assert.equal(slugify("  Hello---World!! "), "hello-world");
});
