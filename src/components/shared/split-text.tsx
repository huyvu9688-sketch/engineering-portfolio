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
}

/**
 * Scroll-triggered per-letter reveal — the reference's signature title
 * effect. Each letter sits below an overflow-hidden mask (per word, so
 * words still wrap) and rises into place, staggered, the first time the
 * heading scrolls into view. Works because every title is uppercase, so
 * there are no descenders to clip.
 *
 * Animation/easing live in globals.css under `.split-text`; reduced-motion
 * users see the text immediately.
 */
export function SplitText({
  children,
  as,
  className,
  stagger = 0.03,
  delay = 0,
  replay = false,
  trigger = "scroll",
}: SplitTextProps) {
  const Tag = (as ?? "span") as ElementType;
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    // "load" mode is a pure-CSS reveal (.split-text--load) that runs on
    // first paint — no observer needed, so nothing here to wire up.
    if (trigger !== "scroll") return;

    const el = ref.current;
    if (!el) return;

    // Respect reduced motion — leave the letters visible, no reveal.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Hide the letters now that JS is running. (Default CSS keeps them
    // visible so they're never stuck hidden if hydration is slow/blocked.)
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
      { threshold: 0.2 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [replay, trigger]);

  const words = children.split(" ");
  let letterIndex = 0;

  return (
    <Tag
      ref={ref}
      className={`split-text ${trigger === "load" ? "split-text--load" : ""} ${className ?? ""}`}
      aria-label={children}
    >
      {words.map((word, w) => (
        <span key={`${word}-${w}`} className="split-word" aria-hidden>
          {word.split("").map((char, c) => {
            const i = letterIndex++;
            return (
              <span
                key={`${char}-${c}`}
                className="split-letter"
                style={{ "--d": `${delay + i * stagger}s` } as CSSProperties}
              >
                {char}
              </span>
            );
          })}
          {/* preserve the inter-word space */}
          {w < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}
