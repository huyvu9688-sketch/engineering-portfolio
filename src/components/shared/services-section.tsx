import Link from "next/link";
import { ArrowUpRight } from "@/components/shared/arrow-up-right";
import { Reveal } from "@/components/shared/reveal";
import { ScrollSectionTitle } from "@/components/shared/scroll-section-title";

interface Service {
  num: string;
  title: string;
  list: string[];
  text: string;
}

const SERVICES: Service[] = [
  {
    num: "01",
    title: "Automation",
    list: ["Robotics", "Machine Vision", "Safety Engineering", "Manufacturing Improvement"],
    text: "Robotic cells, machine vision, and safety-rated systems that keep production improving.",
  },
  {
    num: "02",
    title: "Machine Design",
    list: ["SolidWorks", "AutoCAD", "Manufacturing Processes", "Materials"],
    text: "Fixtures, mechanisms, and tooling modelled for manufacturability and built to last.",
  },
  {
    num: "03",
    title: "AI",
    list: ["Vibe Coding", "AI Platforms", "Automation Tools", "Prompt Engineering", "Workflow Automation"],
    text: "Practical AI in the workflow — vibe-coded tools, AI platforms, and automation that removes repetitive work.",
  },
  {
    num: "04",
    title: "Lean and Quality",
    list: ["Kaizen", "Kanban", "7 QC Tools", "Six Sigma", "5S"],
    text: "Kaizen, Kanban, and the QC toolkit — driving measurable, sustained process improvement.",
  },
];

export function ServicesSection() {
  return (
    <section id="expertise" className="bg-canvas px-4 pt-24 md:px-6 md:pt-40">
      <div className="mx-auto max-w-[1600px]">
        {/* ── Title row ──────────────────────────────────────────── */}
        <div className="flex items-end justify-between">
          <ScrollSectionTitle
            as="h2"
            className="font-display text-[clamp(3.5rem,11vw,11rem)] font-bold uppercase leading-[0.74] tracking-[-0.04em]"
          >
            Expertise
          </ScrollSectionTitle>
          <span className="hidden pb-2 font-display text-sm font-bold uppercase tracking-tight text-ink md:block md:text-xl">
            / what I do
          </span>
        </div>

        {/* ── Expanding card row ─────────────────────────────────── */}
        <div className="mt-10 flex flex-col border-black md:mt-16 md:flex-row md:border-t-2">
          {SERVICES.map((s, i) => (
            <Reveal
              key={s.num}
              delayMs={i * 90}
              className="group flex-1 transition-[flex-grow] duration-700 ease-(--transition-main) md:hover:grow-[2.6]"
            >
              <div className="relative flex h-full min-h-[260px] flex-col overflow-hidden border-b border-[#dedede] px-4 pt-8 transition-colors duration-700 ease-(--transition-main) group-hover:bg-white md:min-h-140 md:border-b-0 md:border-r-2 md:border-r-black md:px-6 md:pt-12">
                {/* Number — grows on hover */}
                <span className="font-display text-base font-bold uppercase leading-none tracking-tight text-ink transition-all duration-500 ease-(--transition-main) md:text-xl md:group-hover:text-4xl">
                  / {s.num}
                </span>

                {/* Title */}
                <h3 className="mt-4 font-display text-3xl font-bold uppercase leading-[0.85] tracking-[-0.03em] text-ink md:mt-10 md:text-5xl">
                  {s.title}
                </h3>

                {/* Reveal zone — capability list + text */}
                <div className="mt-6 flex flex-1 flex-col md:mt-auto md:max-h-0 md:overflow-hidden md:opacity-0 md:transition-all md:duration-700 md:ease-(--transition-main) md:group-hover:max-h-[440px] md:group-hover:opacity-100">
                  <ul className="space-y-1.5">
                    {s.list.map((item) => (
                      <li
                        key={item}
                        className="font-display text-lg font-bold uppercase leading-none tracking-tight text-ink md:text-2xl"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>

                  <p className="mt-6 font-mono text-xs uppercase leading-snug tracking-tight text-ink-muted md:mt-8 md:text-sm">
                    {s.text}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* ── CTA ────────────────────────────────────────────────── */}
        <Reveal delayMs={120}>
          <div className="mt-12 flex justify-end md:mt-16">
            <Link
              href="/portfolio"
              className="link-line font-display text-2xl font-bold uppercase tracking-tight text-ink md:text-4xl"
            >
              See my work
              <ArrowUpRight className="ml-3 h-5 w-5 md:h-8 md:w-8" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
