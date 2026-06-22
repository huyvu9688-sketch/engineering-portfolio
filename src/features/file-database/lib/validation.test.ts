import { test } from "node:test";
import assert from "node:assert/strict";
import { validateDocumentInput, validateProjectInput } from "./validation.ts";

const validDoc = {
  title: "Gearbox Housing",
  description: "Cast housing, rev A",
  category: "cad",
  file_ext: "step",
  mime_type: "model/step",
  size_bytes: 1024,
  tags: ["gearbox", "housing"],
  project_id: null,
  storage_path: "abc/gearbox.step",
  original_filename: "gearbox.step",
};

test("accepts a valid document and trims/normalizes tags", () => {
  const r = validateDocumentInput({ ...validDoc, tags: [" Gearbox ", "gearbox", ""] });
  assert.equal(r.ok, true);
  if (r.ok) assert.deepEqual(r.value.tags, ["gearbox"]);
});

test("rejects missing title", () => {
  const r = validateDocumentInput({ ...validDoc, title: "  " });
  assert.equal(r.ok, false);
});

test("rejects unknown category", () => {
  const r = validateDocumentInput({ ...validDoc, category: "blueprints" });
  assert.equal(r.ok, false);
});

test("rejects extension not allowed for the category", () => {
  const r = validateDocumentInput({ ...validDoc, file_ext: "pdf" });
  assert.equal(r.ok, false);
});

test("rejects size over the cap", () => {
  const r = validateDocumentInput({ ...validDoc, size_bytes: 60 * 1024 * 1024 });
  assert.equal(r.ok, false);
});

test("normalizes content_text and defaults it to null when absent", () => {
  const without = validateDocumentInput(validDoc);
  assert.equal(without.ok, true);
  if (without.ok) assert.equal(without.value.content_text, null);

  const withText = validateDocumentInput({ ...validDoc, content_text: "  Spec  sheet\n M8 " });
  assert.equal(withText.ok, true);
  if (withText.ok) assert.equal(withText.value.content_text, "Spec sheet M8");
});

test("rejects non-object payload", () => {
  assert.equal(validateDocumentInput(null).ok, false);
  assert.equal(validateDocumentInput("x").ok, false);
});

test("validateProjectInput requires name and derives nothing it cannot", () => {
  const ok = validateProjectInput({ name: "Line 4 Retrofit", slug: "line-4-retrofit", description: null });
  assert.equal(ok.ok, true);
  const bad = validateProjectInput({ name: "", slug: "", description: null });
  assert.equal(bad.ok, false);
});
