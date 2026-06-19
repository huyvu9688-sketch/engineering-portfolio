"use client";

import { useEffect, useRef, type ElementType } from "react";

// Animation constants — same values as AboutSection for visual consistency.
const BASE_Y = -100; // % above the split-word clip boundary for centre letter
const RING_Y = -30;  // extra % per ring step outward (outermost starts highest)
const LERP   = 0.10; // how quickly the animated value chases the scroll target

interface ScrollSectionTitleProps {
  children: string;
  as?: ElementType;
  className?: string;
  /** Viewport-heights of scroll over which the full reveal spans. */
  scrollWindow?: number;
  /** Fraction of the total window each individual letter occupies. */
  phase?: number;
}

/**
 * A giant section heading whose letters fall into place as the user scrolls,
 * staggered outside-in so the outermost letters drop first.
 * Self-contained: drives progress off its own bounding rect, no parent ref needed.
 */
export function ScrollSectionTitle({
  children,
  as,
  className,
  scrollWindow = 0.8,
  phase = 0.6,
}: ScrollSectionTitleProps) {
  const Tag  = (as ?? "h2") as ElementType;
  const elRef = useRef<HTMLElement>(null);

  const word   = children.trim();
  const chars  = word.replace(/ /g, "").split("");
  const center  = (chars.length - 1) / 2;
  const maxDist = center;

  const letterRefs = useRef<(HTMLSpanElement | null)[]>(
    Array(chars.length).fill(null),
  );

  useEffect(() => {
    const el      = elRef.current;
    const letters = letterRefs.current as HTMLSpanElement[];
    if (!el || letters.some((l) => !l)) return;

    // Seed each letter at its starting position above the clip boundary.
    letters.forEach((letter, i) => {
      letter.style.willChange = "transform";
      letter.style.transform  = `translateY(${BASE_Y + Math.abs(i - center) * RING_Y}%)`;
    });

    let raf     = 0;
    let current = 0;
    let target  = 0;

    const applyProgress = (p: number) => {
      letters.forEach((letter, i) => {
        const dist       = Math.abs(i - center);
        const normalized = maxDist > 0 ? dist / maxDist : 0;
        // Outer letters (normalized=1) start at overall=0; centre (0) starts at (1-phase).
        const phaseStart = (1 - normalized) * (1 - phase);
        const lp         = Math.max(0, Math.min((p - phaseStart) / phase, 1));
        // Ease-out sine: smooth deceleration, no jarring burst at phase boundaries.
        const eased      = Math.sin((lp * Math.PI) / 2);
        letter.style.transform = `translateY(${(BASE_Y + dist * RING_Y) * (1 - eased)}%)`;
      });
    };

    const tick = () => {
      const delta = target - current;
      if (Math.abs(delta) < 0.0002) {
        current = target;
        applyProgress(current);
        raf = 0;
        return;
      }
      current += delta * LERP;
      applyProgress(current);
      raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      const vh   = window.innerHeight;
      const rect = el.getBoundingClientRect();
      target = Math.max(0, Math.min((vh - rect.top) / (vh * scrollWindow), 1));
      if (!raf) raf = requestAnimationFrame(tick);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build letter spans — one split-word wrapper per word for the overflow mask.
  const words = word.split(" ");
  let gi = 0; // global letter index across all words

  return (
    <Tag ref={elRef} className={className} aria-label={word}>
      {words.map((w, wi) => (
        <span key={wi} className="split-word" aria-hidden>
          {w.split("").map((char, ci) => {
            const idx = gi++;
            return (
              <span
                key={ci}
                className="split-letter"
                ref={(el) => { letterRefs.current[idx] = el; }}
              >
                {char}
              </span>
            );
          })}
        </span>
      ))}
      {/* Visually hidden fallback for search engines / no-JS */}
    </Tag>
  );
}
