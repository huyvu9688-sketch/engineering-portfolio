"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowUpRight } from "@/components/shared/arrow-up-right";
import { Reveal } from "@/components/shared/reveal";

interface ExperienceEntry {
  role: string;
  org: string;
  current?: boolean;
}

const EXPERIENCE: ExperienceEntry[] = [
  {
    role: "Automation & Production Engineer",
    org: "[Company Name] · [Start Year] – Present",
    current: true,
  },
  {
    role: "[Previous Role Title]",
    org: "[Company Name] · [Start Year] – [End Year]",
  },
];

const STATEMENT = [
  "I design and build automated machines —",
  "and the software that runs them.",
  "Pneumatics, motor sizing, SolidWorks,",
  "and the controls that tie it together.",
];

const WORD      = "ABOUT";
const CENTER    = (WORD.length - 1) / 2; // 2
const MAX_DIST  = CENTER;                 // 2

// Scroll window: how many viewport-heights of scroll spans the full reveal.
const SCROLL_WINDOW = 0.8;
// Each letter's sub-phase as a fraction of the overall window.
const PHASE = 0.6;
// Starting Y (negative = above the split-word overflow:hidden boundary).
const BASE_Y = -100;
const RING_Y = -30; // extra depth per ring step outward

// Lerp factor: how quickly the animated value chases the scroll target.
// Lower = smoother but more lag; 0.10 gives a nice spring-like follow.
const LERP = 0.10;

export function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>(
    Array(WORD.length).fill(null),
  );

  useEffect(() => {
    const section = sectionRef.current;
    const letters = letterRefs.current as HTMLSpanElement[];
    if (!section || letters.some((l) => !l)) return;

    letters.forEach((letter, i) => {
      letter.style.willChange = "transform";
      letter.style.transform  = `translateY(${BASE_Y + Math.abs(i - CENTER) * RING_Y}%)`;
    });

    let raf     = 0;
    let current = 0; // smoothed progress
    let target  = 0; // raw scroll progress

    const applyProgress = (p: number) => {
      letters.forEach((letter, i) => {
        const dist       = Math.abs(i - CENTER);
        const normalized = MAX_DIST > 0 ? dist / MAX_DIST : 0;
        const phaseStart = (1 - normalized) * (1 - PHASE);
        const lp         = Math.max(0, Math.min((p - phaseStart) / PHASE, 1));
        // Ease-out sine: gentler deceleration, no jarring burst at phase start.
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
      const vh    = window.innerHeight;
      const sRect = section.getBoundingClientRect();
      target = Math.max(0, Math.min((vh - sRect.top) / (vh * SCROLL_WINDOW), 1));
      if (!raf) raf = requestAnimationFrame(tick);
    };

    onScroll(); // seed correct position immediately
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={sectionRef} className="bg-canvas py-16 text-ink md:py-24">
      <div className="mx-auto max-w-[1600px] px-4 md:px-6">

        {/* ── Giant title — scroll-driven per-letter fall, outside-in ── */}
        <h2
          aria-label={WORD}
          className="block text-center font-display text-[clamp(6rem,28vw,22rem)] font-bold uppercase leading-[0.65] tracking-[-0.07em]"
        >
          <span className="split-word" aria-hidden>
            {WORD.split("").map((char, i) => (
              <span
                key={i}
                className="split-letter"
                ref={(el) => { letterRefs.current[i] = el; }}
              >
                {char}
              </span>
            ))}
          </span>
        </h2>

        {/* ── Top row ────────────────────────────────────────────── */}
        <Reveal>
          <div className="mt-8 flex flex-col gap-6 border-t border-hairline pt-10 md:mt-12 md:flex-row md:items-start md:justify-between md:gap-16">
            <p className="font-display text-2xl font-bold uppercase leading-none tracking-tight md:text-4xl">
              Joseph Vu
            </p>
            <p className="max-w-md font-mono text-sm uppercase leading-snug tracking-tight text-ink-muted md:text-base">
              Automation &amp; production engineer — Vietnam
            </p>
            <p className="max-w-sm font-display text-lg font-bold uppercase leading-tight tracking-tight md:text-2xl">
              Building machines that make things
            </p>
          </div>
        </Reveal>

        {/* ── Statement reveal lines ─────────────────────────────── */}
        <div className="mt-20 md:mt-40">
          {STATEMENT.map((line, i) => (
            <Reveal key={line} delayMs={i * 80}>
              <p
                className={`font-mono text-xl font-light uppercase leading-tight tracking-tight md:text-4xl ${
                  i % 2 === 1 ? "text-right md:pr-[12vw]" : "md:pl-[18vw]"
                }`}
              >
                {line}
              </p>
            </Reveal>
          ))}
        </div>

        {/* ── Portrait + experience ──────────────────────────────── */}
        <div className="mt-24 grid grid-cols-1 gap-12 md:mt-40 md:grid-cols-[minmax(0,360px)_1fr] md:gap-24">
          <Reveal>
            <div className="relative aspect-3/4 w-full overflow-hidden bg-black/5">
              <Image
                src="/joe.png"
                alt="Joseph Vu"
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 360px"
              />
            </div>
          </Reveal>

          <Reveal delayMs={100}>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-muted">
                / Experience
              </p>
              <div className="mt-8 divide-y divide-hairline border-t border-hairline">
                {EXPERIENCE.map((entry) => (
                  <div
                    key={entry.role}
                    className="flex flex-col gap-1 py-6 md:flex-row md:items-baseline md:justify-between"
                  >
                    <h3 className="font-display text-2xl font-bold uppercase leading-none tracking-tight md:text-3xl">
                      {entry.role}
                    </h3>
                    <p
                      className={`font-mono text-xs uppercase tracking-wider ${
                        entry.current ? "text-accent" : "text-ink-muted"
                      }`}
                    >
                      {entry.org}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-12 border border-hairline p-6 md:max-w-md">
                <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                  Education
                </p>
                <p className="mt-3 font-display text-xl font-bold uppercase tracking-tight md:text-2xl">
                  [Degree / Program]
                </p>
                <p className="mt-1 font-mono text-xs text-ink-muted">
                  [Institution] · [Years]
                </p>
              </div>

              <a
                href="mailto:huyvu9688@gmail.com"
                className="link-line mt-12 inline-flex font-display text-2xl font-bold lowercase tracking-tight text-ink md:text-3xl"
              >
                huyvu9688@gmail.com
                <ArrowUpRight className="ml-3 h-6 w-6" />
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
