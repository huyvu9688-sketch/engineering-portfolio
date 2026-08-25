"use client";

import { useEffect, useRef } from "react";

// Travel speed of the row. Duration is derived from this so a longer
// project list slides at the same pace rather than the same duration.
const PX_PER_SECOND = 55;
// Wait after the section becomes visible before the slide starts.
const START_DELAY_MS = 1000;
// Dwell at each end of the slide (row fully left, then fully right)
// before it reverses direction.
const EDGE_PAUSE_MS = 900;

/**
 * Auto-slides its children left, then back right, forever — so every card
 * drifts into view without the viewer scrolling. Starts once the section
 * has been visible for a beat, dwells at each end, and pauses on
 * hover/focus.
 *
 * The motion is a CSS transform animation, not a scripted `scrollLeft`
 * loop: a scroll-driven version depends on sub-pixel scroll rounding,
 * rAF timing and scroll-container quirks, all of which vary by browser
 * and can silently freeze the row. CSS just runs.
 *
 * The end-of-row dwell is done here in JS — via `animation-play-state`
 * toggled on `animationiteration` — rather than as a percentage inside
 * the keyframes (e.g. "0%, 6% { ...hold... }"). A percentage dwell is a
 * fraction of animation-duration, so the same "6%" that reads as a quick
 * beat on a short row stretches into several extra *seconds* of stall on
 * a wide one, since duration scales with travel distance. Doing it as a
 * fixed millisecond pause here keeps it constant regardless of row width.
 */
export function ProjectsCarousel({ children }: { children: React.ReactNode }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const measure = () => {
      // How much of the track hangs off the right edge — that is exactly
      // how far left it must travel to bring the last card flush.
      const distance = Math.max(0, track.scrollWidth - viewport.clientWidth);

      viewport.style.setProperty("--works-shift", `-${distance}px`);
      viewport.style.setProperty(
        "--works-duration",
        `${Math.max(distance / PX_PER_SECOND, 1).toFixed(2)}s`,
      );
      // Everything already fits: don't animate a zero-length slide.
      viewport.dataset.worksOverflowing = distance > 0 ? "true" : "false";
    };

    measure();

    // Card widths are vw-based and images load in, so both the viewport
    // and the track can change size after first paint.
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(viewport);
    resizeObserver.observe(track);

    // Three independent reasons the track can be paused: it hasn't been
    // armed yet, the viewer is hovering/focusing it, or it's mid-dwell at
    // an edge. Any one holds it; resuming requires all three to clear.
    // (Tracked here rather than left to the CSS [data-works-armed] rule
    // alone because this function also runs from hover/focus handlers,
    // and an inline style set from JS would otherwise outrank — and
    // silently defeat — that CSS gate before the row is armed.)
    let armed = false;
    let hovered = false;
    let dwelling = false;
    let edgeTimeout: ReturnType<typeof setTimeout> | undefined;
    const applyPlayState = () => {
      track.style.animationPlayState =
        armed && !hovered && !dwelling ? "running" : "paused";
    };
    applyPlayState();

    const onIteration = () => {
      dwelling = true;
      applyPlayState();
      edgeTimeout = setTimeout(() => {
        dwelling = false;
        applyPlayState();
      }, EDGE_PAUSE_MS);
    };
    track.addEventListener("animationiteration", onIteration);

    const pause = () => {
      hovered = true;
      applyPlayState();
    };
    const resume = () => {
      hovered = false;
      applyPlayState();
    };
    viewport.addEventListener("mouseenter", pause);
    viewport.addEventListener("mouseleave", resume);
    viewport.addEventListener("touchstart", pause, { passive: true });
    viewport.addEventListener("touchend", resume);
    viewport.addEventListener("touchcancel", resume);
    viewport.addEventListener("focusin", pause);
    viewport.addEventListener("focusout", resume);

    // Don't start sliding until the section is actually on screen, then
    // hold a beat so the viewer sees the row at rest before it moves.
    let startTimeout: ReturnType<typeof setTimeout> | undefined;
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !startTimeout) {
          startTimeout = setTimeout(() => {
            armed = true;
            viewport.dataset.worksArmed = "true";
            applyPlayState();
          }, START_DELAY_MS);
        }
      },
      { threshold: 0.2 },
    );
    intersectionObserver.observe(viewport);

    return () => {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      track.removeEventListener("animationiteration", onIteration);
      viewport.removeEventListener("mouseenter", pause);
      viewport.removeEventListener("mouseleave", resume);
      viewport.removeEventListener("touchstart", pause);
      viewport.removeEventListener("touchend", resume);
      viewport.removeEventListener("touchcancel", resume);
      viewport.removeEventListener("focusin", pause);
      viewport.removeEventListener("focusout", resume);
      clearTimeout(startTimeout);
      clearTimeout(edgeTimeout);
    };
  }, []);

  return (
    <div
      ref={viewportRef}
      // Defaults to overflowing: if the measure effect never runs, the
      // row still slides on the keyframe fallbacks rather than sitting
      // frozen once armed.
      data-works-overflowing="true"
      // Flips true once the section has been visible for START_DELAY_MS —
      // CSS uses this to gate when the animation is allowed to run.
      data-works-armed="false"
      className="works-viewport mt-12 overflow-hidden md:mt-20"
    >
      <div
        ref={trackRef}
        className="works-track flex w-max gap-5 px-4 pb-6 md:gap-8 md:px-8"
      >
        {children}
      </div>
    </div>
  );
}
