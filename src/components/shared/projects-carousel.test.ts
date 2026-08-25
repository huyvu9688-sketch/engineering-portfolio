import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const carousel = readFileSync(
  "src/components/shared/projects-carousel.tsx",
  "utf8",
);
// Comments in this file discuss the old broken approach by name, so the
// "is it gone?" checks below must read code only.
const carouselCode = carousel
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");
const globals = readFileSync("src/app/globals.css", "utf8");

// The row froze twice before: once from a scrollLeft edge-check that fired
// on the first sub-pixel frame, once from a reduced-motion early return.
// These guard the mechanism that replaced both.

test("carousel drives motion from CSS, not a scrollLeft loop", () => {
  assert.ok(
    !carouselCode.includes("scrollLeft"),
    "scrollLeft animation reintroduced — it is what froze the row before",
  );
  assert.ok(
    !carouselCode.includes("requestAnimationFrame"),
    "rAF loop reintroduced; motion should come from the CSS keyframes",
  );
});

test("no reduced-motion early return that kills the slide entirely", () => {
  assert.ok(
    !carouselCode.includes("prefers-reduced-motion"),
    "a reduced-motion guard here silently freezes the row on machines " +
      "with Windows animation effects off",
  );
});

test("animation still runs if the measuring effect never does", () => {
  assert.match(
    carousel,
    /data-works-overflowing="true"/,
    "SSR default must animate; JS only turns it off when nothing overflows",
  );
  assert.match(
    globals,
    /var\(--works-shift,\s*-50%\)/,
    "keyframes need a shift fallback for before/without JS measurement",
  );
  assert.match(
    globals,
    /var\(--works-duration,\s*\d+s\)/,
    "keyframes need a duration fallback for before/without JS measurement",
  );
});

test("track travels exactly its overflow and ping-pongs", () => {
  assert.match(globals, /animation:\s*works-marquee/);
  assert.match(globals, /infinite\s+alternate/, "must slide back, not jump");
  assert.match(
    carousel,
    /track\.scrollWidth - viewport\.clientWidth/,
    "shift must equal the overflow so the last card lands flush",
  );
});

test("pauses on hover and keyboard focus", () => {
  // Owned by JS (inline animationPlayState), not CSS :hover/:focus-within —
  // an inline style set from a hover handler would silently outrank any
  // CSS pause rule, so the two must not both try to own this.
  assert.match(carouselCode, /mouseenter/);
  assert.match(carouselCode, /focusin/);
  assert.match(carouselCode, /animationPlayState/);
  assert.ok(
    !globals.includes(".works-viewport:hover"),
    "a CSS :hover pause rule here would race the inline JS one",
  );
});

test("re-measures when cards or viewport resize", () => {
  assert.match(
    carousel,
    /new ResizeObserver/,
    "vw-based card widths and late-loading images change the distance",
  );
});

test("slide waits until the section has been visible for a beat", () => {
  assert.match(
    carousel,
    /new IntersectionObserver/,
    "start must be gated on the section actually being on screen",
  );
  assert.match(
    carousel,
    /START_DELAY_MS\s*=\s*1000/,
    "requested delay is 1s after the section becomes visible",
  );
  assert.match(
    carousel,
    /data-works-armed="false"/,
    "SSR default must be un-armed so the row waits before its first slide",
  );
  assert.match(
    globals,
    /\[data-works-armed="false"\]\s*\.works-track\s*\{\s*animation-play-state:\s*paused/,
    "CSS must hold the track paused until JS arms it",
  );
});

test("end-of-row dwell is a fixed pause, not a percent of duration", () => {
  // Regression: the keyframes used to hold at "0%, 6%" / "94%, 100%".
  // That fraction is of animation-duration, which scales with travel
  // distance — so on a wide row (long duration) the same 6% stretched
  // into several extra *seconds* of stall on top of the 1s start delay,
  // which is what the user actually saw ("4-5s" instead of "1s").
  assert.ok(
    !globals.includes("94%"),
    "percentage-based end dwell reintroduced — it scales with row width",
  );
  assert.match(
    carouselCode,
    /EDGE_PAUSE_MS\s*=\s*\d+/,
    "the end-of-row pause must be a fixed millisecond constant",
  );
  assert.match(
    carouselCode,
    /animationiteration/,
    "fixed-length dwell must be driven by the animation's iteration event",
  );
});
