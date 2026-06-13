"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

interface ShowcaseCard {
  src: string;
  alt: string;
  /** Resting transform classes for the fanned / scattered layout */
  scatter: string;
}

// Placeholder imagery carried over from the index3 reference — swap later.
const CARDS: ShowcaseCard[] = [
  {
    src: "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/917d6f93-fb36-439a-8c48-884b67b35381_1600w.jpg",
    alt: "Showcase card 1",
    scatter: "-rotate-[8deg] translate-y-3 sm:translate-y-5",
  },
  {
    src: "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/4734259a-bad7-422f-981e-ce01e79184f2_1600w.jpg",
    alt: "Showcase card 2",
    scatter: "-rotate-[2deg] translate-y-5 sm:translate-y-7",
  },
  {
    src: "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/c543a9e1-f226-4ced-80b0-feb8445a75b9_1600w.jpg",
    alt: "Showcase card 3",
    scatter: "rotate-[3deg] translate-y-2",
  },
  {
    src: "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/5bab247f-35d9-400d-a82b-fd87cfe913d2_1600w.webp",
    alt: "Showcase card 4",
    scatter: "rotate-0 -translate-y-1",
  },
  {
    src: "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/30104e3c-5eea-4b93-93e9-5313698a7156_1600w.webp",
    alt: "Showcase card 5",
    scatter: "-rotate-[2deg] translate-y-3",
  },
  {
    src: "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/917d6f93-fb36-439a-8c48-884b67b35381_1600w.jpg",
    alt: "Showcase card 6",
    scatter: "rotate-[6deg] translate-y-6",
  },
];

/**
 * Fanned grid of showcase images. Clicking a card brings it to the
 * centre (zoom + un-rotate) and blurs / dims the rest; clicking it
 * again — or anywhere outside the grid — resets. Adapted from the
 * owner-supplied index3 reference: its inline <script> was rebuilt
 * as React state per code-standards.md.
 */
export function ShowcaseCards() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeIndex === null) return;

    function handleOutsideClick(event: MouseEvent) {
      if (gridRef.current && !gridRef.current.contains(event.target as Node)) {
        setActiveIndex(null);
      }
    }

    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [activeIndex]);

  function focusStyle(index: number): CSSProperties | undefined {
    if (activeIndex === null) return undefined;
    if (index === activeIndex) {
      return {
        transform: "translate(0, 0) rotate(0deg) scale(1.15)",
        filter: "blur(0px)",
        opacity: 1,
        zIndex: 10,
      };
    }
    return { filter: "blur(8px)", opacity: 0.4 };
  }

  function toggle(index: number) {
    setActiveIndex((current) => (current === index ? null : index));
  }

  return (
    <div className="flex justify-center">
      <div ref={gridRef} className="grid grid-cols-6 gap-x-3 gap-y-3 sm:gap-4">
        {CARDS.map((card, index) => (
          <div
            key={index}
            role="button"
            tabIndex={0}
            aria-pressed={activeIndex === index}
            onClick={(event) => {
              event.stopPropagation();
              toggle(index);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                toggle(index);
              }
            }}
            className={`col-span-2 transform cursor-pointer self-end transition-all duration-700 ease-out hover:scale-105 sm:col-span-1 ${card.scatter}`}
            style={focusStyle(index)}
          >
            <div className="aspect-[3/4] overflow-hidden rounded-lg ring-1 ring-hairline shadow-lg transition-shadow duration-500 hover:shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element -- placeholder remote imagery, replaced later */}
              <img
                src={card.src}
                alt={card.alt}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
