import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeExtractedText } from "./pdf-text.ts";

test("collapses whitespace and trims", () => {
  assert.equal(
    normalizeExtractedText("  Bolt   M8\n\n\tDIN  933 \n"),
    "Bolt M8 DIN 933",
  );
});

test("returns null for empty, whitespace-only, or non-string input", () => {
  assert.equal(normalizeExtractedText(""), null);
  assert.equal(normalizeExtractedText("   \n\t "), null);
  assert.equal(normalizeExtractedText(null), null);
  assert.equal(normalizeExtractedText(undefined), null);
  assert.equal(normalizeExtractedText(42), null);
});

test("truncates to the supplied cap", () => {
  const long = "a ".repeat(1000); // 2000 chars before trim
  const r = normalizeExtractedText(long, 50);
  assert.equal(r?.length, 50);
});

test("keeps text at or below the cap intact", () => {
  assert.equal(normalizeExtractedText("short text", 50), "short text");
});
