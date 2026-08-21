"use client";

import { useEffect, useRef, type ReactNode, type CSSProperties } from "react";

interface RevealProps {
  children: ReactNode;
  delayMs?: number;
  className?: string;
}

export function Reveal({ children, delayMs = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      // threshold 0 — a block taller than the viewport can never reach a
      // fractional ratio, which used to leave tall columns stuck hidden.
      { threshold: 0, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(el);

    // Safety net: if the observer never fires (tab restored in the background,
    // scroll position restored past the element), reveal rather than stay blank.
    const fallback = window.setTimeout(() => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add("is-revealed");
        observer.unobserve(el);
      }
    }, 1200);

    return () => {
      window.clearTimeout(fallback);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      data-reveal
      className={className}
      style={delayMs ? ({ transitionDelay: `${delayMs}ms` } as CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
