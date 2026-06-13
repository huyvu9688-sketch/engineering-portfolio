import { Reveal } from "@/components/shared/reveal";

interface ExperienceEntry {
  role: string;
  org: string;
  current?: boolean;
  points: string[];
}

const EXPERIENCE: ExperienceEntry[] = [
  {
    role: "Automation & Production Engineer",
    org: "[Company Name] · [Start Year] – Present",
    current: true,
    points: [
      "[Describe your current responsibilities — e.g. line automation, process improvement, equipment design]",
      "[Add a measurable result or project highlight]",
    ],
  },
  {
    role: "[Previous Role Title]",
    org: "[Company Name] · [Start Year] – [End Year]",
    points: ["[Describe a key responsibility or achievement from this role]"],
  },
];

export function AboutSection() {
  return (
    <section className="px-4 py-24 md:px-6">
      <div className="mx-auto max-w-[1800px]">
        <Reveal>
          <div className="flex items-end justify-between border-b border-hairline pb-6">
            <h2 className="text-4xl font-semibold uppercase tracking-tighter md:text-7xl">
              Background
            </h2>
            <p className="font-mono text-xs uppercase tracking-widest text-ink-faint">
              002 — Experience
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-24">
          <Reveal>
            <div className="md:sticky md:top-32">
              <div className="h-1 w-12 bg-accent md:w-16" />
              <p className="mt-6 text-base leading-relaxed text-ink-muted md:text-lg">
                Automation &amp; production engineer focused on practical
                design work — pneumatic systems, motor sizing, and SolidWorks
                modeling. EngiHub collects the projects, calculators, and
                technical files from that work in one place.
              </p>
              <div className="mt-8 rounded-lg border border-hairline bg-surface p-6">
                <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                  Education
                </p>
                <p className="mt-3 text-sm font-semibold md:text-base">
                  [Degree / Program]
                </p>
                <p className="text-xs text-ink-muted md:text-sm">
                  [Institution] · [Years]
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delayMs={100}>
            <div className="space-y-12 border-l border-hairline pl-6 md:space-y-16 md:pl-12">
              {EXPERIENCE.map((entry) => (
                <div key={entry.role} className="group relative">
                  <div
                    className={`absolute -left-[1.95rem] top-1.5 h-3 w-3 rounded-full border-2 bg-surface md:-left-[3.25rem] ${
                      entry.current
                        ? "border-accent"
                        : "border-hairline group-hover:border-accent"
                    } transition-colors duration-300`}
                  />
                  <h3 className="text-xl font-semibold tracking-tight md:text-2xl">
                    {entry.role}
                  </h3>
                  <p
                    className={`mb-3 mt-1 font-mono text-xs uppercase tracking-wider md:text-sm ${
                      entry.current ? "text-accent" : "text-ink-muted"
                    }`}
                  >
                    {entry.org}
                  </p>
                  <ul className="list-disc space-y-2 pl-4 text-sm text-ink-muted marker:text-ink-faint md:text-base">
                    {entry.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
