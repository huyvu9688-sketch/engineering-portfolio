"use client";

import { useEffect, useRef, type ElementType, type CSSProperties } from "react";

interface SplitTextProps {
  /** The heading text. Split into words (kept whole for wrapping) then letters. */
  children: string;
  /** Element to render — h1/h2/p/span. Defaults to a span. */
  as?: ElementType;
  /** Classes for the root element (font size, alignment, color). */
  className?: string;
  /** Seconds between each letter. */
  stagger?: number;
  /** Base delay before the first letter, in seconds. */
  delay?: number;
  /** Replay the reveal each time it re-enters view (handy while tuning). */
  replay?: boolean;
  /**
   * When the reveal runs:
   * - `"load"` — pure CSS, fires on first paint. Use for above-the-fold
   *   content (the hero) so it never depends on a JS observer firing.
   * - `"scroll"` — IntersectionObserver, fires when scrolled into view.
   *   Use for section titles further down the page.
   */
  trigger?: "load" | "scroll";
  /**
   * When true, letters are staggered from outside-in: the two outermost
   * letters animate first (delay = 0) and the centre letter last. Each
   * letter's `--y` start-depth also scales with distance from centre so
   * outer letters rise from further below, amplifying the wing-spread look.
   */
  centerOut?: boolean;
}

export function SplitText({
  children,
  as,
  className,
  stagger = 0.03,
  delay = 0,
  replay = false,
  trigger = "scroll",
  centerOut = false,
}: SplitTextProps) {
  const Tag = (as ?? "span") as ElementType;
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (trigger !== "scroll") return;

    const el = ref.current;
    if (!el) return;

    el.classList.add("is-prepared");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            if (!replay) observer.unobserve(entry.target);
          } else if (replay) {
            entry.target.classList.remove("is-revealed");
          }
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [replay, trigger]);

  const words = children.split(" ");

  // Pre-count total letters so center-out distances can be computed
  // across the full string regardless of word boundaries.
  const totalLetters = children.replace(/ /g, "").length;
  const centerIndex = (totalLetters - 1) / 2;
  const maxDist = centerIndex; // symmetric — same for odd or even counts

  let globalIndex = 0;

  return (
    <Tag
      ref={ref}
      className={`split-text ${trigger === "load" ? "split-text--load" : ""} ${className ?? ""}`}
      aria-label={children}
    >
      {words.map((word, w) => (
        <span key={`${word}-${w}`} className="split-word" aria-hidden>
          {word.split("").map((char, c) => {
            const i = globalIndex++;
            let letterDelay: number;
            let startY: string;

            if (centerOut) {
              const dist = Math.abs(i - centerIndex);
              // Outermost letters get delay=0, centre letter gets maxDist*stagger.
              letterDelay = delay + (maxDist - dist) * stagger;
              // Outer letters fall from further ABOVE (negative = above the clip box).
              // Each ring step adds 30% extra height, so A/T start highest.
              startY = `-${100 + dist * 30}%`;
            } else {
              letterDelay = delay + i * stagger;
              startY = "110%";
            }

            return (
              <span
                key={`${char}-${c}`}
                className="split-letter"
                style={
                  {
                    "--d": `${letterDelay}s`,
                    "--y": startY,
                  } as CSSProperties
                }
              >
                {char}
              </span>
            );
          })}
          {w < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}
