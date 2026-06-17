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

// Large uppercase mono statement lines (mirrors the reference reveal lines).
const STATEMENT = [
  "I design and build automated machines —",
  "and the software that runs them.",
  "Pneumatics, motor sizing, SolidWorks,",
  "and the controls that tie it together.",
];

export function AboutSection() {
  return (
    <section className="bg-surface-dark py-24 text-on-dark md:py-40">
      <div className="mx-auto max-w-[1600px] px-4 md:px-6">
        {/* ── Giant title ────────────────────────────────────────── */}
        <h2 className="block text-center font-display text-[clamp(6rem,28vw,22rem)] font-bold uppercase leading-[0.8] tracking-tighter">
          About
        </h2>

        {/* ── Top row — name / descriptor / tagline ──────────────── */}
        <Reveal>
          <div className="mt-12 flex flex-col gap-6 border-t border-hairline-dark pt-10 md:mt-20 md:flex-row md:items-start md:justify-between md:gap-16">
            <p className="font-display text-2xl font-bold uppercase leading-none tracking-tight md:text-4xl">
              Joseph Vu
            </p>
            <p className="max-w-md font-mono text-sm uppercase leading-snug tracking-tight text-on-dark-muted md:text-base">
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
            <div className="relative aspect-3/4 w-full overflow-hidden bg-white/5">
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
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-on-dark-muted">
                / Experience
              </p>
              <div className="mt-8 divide-y divide-hairline-dark border-t border-hairline-dark">
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
                        entry.current ? "text-accent" : "text-on-dark-muted"
                      }`}
                    >
                      {entry.org}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-12 border border-hairline-dark p-6 md:max-w-md">
                <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                  Education
                </p>
                <p className="mt-3 font-display text-xl font-bold uppercase tracking-tight md:text-2xl">
                  [Degree / Program]
                </p>
                <p className="mt-1 font-mono text-xs text-on-dark-muted">
                  [Institution] · [Years]
                </p>
              </div>

              <a
                href="mailto:huyvu9688@gmail.com"
                className="link-line mt-12 inline-flex font-display text-2xl font-bold lowercase tracking-tight text-on-dark md:text-3xl"
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
