import assert from "node:assert/strict";
import test from "node:test";
import { applyScrollLetterProgress } from "./scroll-letter-animation.ts";

interface Letter {
  style: { transform: string };
}

test("applies scroll transforms to mounted letters and skips detached refs", () => {
  const outerLetter: Letter = { style: { transform: "" } };
  const centerLetter: Letter = { style: { transform: "" } };

  applyScrollLetterProgress([outerLetter, null, centerLetter], {
    progress: 1,
    center: 1,
    maxDistance: 1,
    phase: 0.6,
    baseY: -100,
    ringY: -30,
  });

  assert.equal(outerLetter.style.transform, "translateY(0%)");
  assert.equal(centerLetter.style.transform, "translateY(0%)");
});
