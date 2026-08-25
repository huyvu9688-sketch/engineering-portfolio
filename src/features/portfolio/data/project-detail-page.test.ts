import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const pagePath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../app/(site)/portfolio/[slug]/page.tsx",
);

test("grouped projects show only their individual project sections", () => {
  const source = readFileSync(pagePath, "utf8");

  assert.match(source, /const isGroupedProject = Boolean\(project\.subprojects\?\.length\);/);
  assert.match(source, /\{!isGroupedProject \? \(/);
});