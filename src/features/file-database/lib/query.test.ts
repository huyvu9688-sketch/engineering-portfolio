import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeSearchTerm } from "./query.ts";

test("normalizeSearchTerm trims and returns null when empty", () => {
  assert.equal(normalizeSearchTerm("   "), null);
  assert.equal(normalizeSearchTerm(""), null);
  assert.equal(normalizeSearchTerm("  gearbox housing "), "gearbox housing");
});

test("normalizeSearchTerm collapses internal whitespace", () => {
  assert.equal(normalizeSearchTerm("gear   box"), "gear box");
});
