import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const directory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(directory, "../../../");
const portraitSources = [
  resolve(projectRoot, "src/app/(site)/page.tsx"),
  resolve(directory, "about-section.tsx"),
];

test("homepage and About portraits use the current Joe image", () => {
  assert.equal(existsSync(resolve(projectRoot, "public/joe.jpg")), true);

  for (const source of portraitSources) {
    assert.match(readFileSync(source, "utf8"), /src="\/joe\.jpg"/);
  }
});
