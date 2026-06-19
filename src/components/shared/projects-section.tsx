import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "@/components/shared/arrow-up-right";
import { Reveal } from "@/components/shared/reveal";
import { ScrollSectionTitle } from "@/components/shared/scroll-section-title";
import { PROJECTS } from "@/features/portfolio/data/projects";

// Mechanism line-drawings double as project visuals until real photos
// are added. Cycled in order so each card gets a distinct image.
const FALLBACK_IMAGES = [
  "/mechanisms/belt-conveyor.png",
  "/mechanisms/index-table.png",
  "/mechanisms/rack-pinion.png",
  "/mechanisms/ball-screw.png",
  "/mechanisms/direct-drive.png",
];

/**
 * "Recent works" — the reference renders this as a scroll-driven three.js
 * slider. We keep the spirit (a dark, full-bleed works showcase) with a
 * horizontal snap-scroll of grayscale cards that color on hover.
 */
export function ProjectsSection() {
  return (
    <section
      id="works"
      className="bg-surface-dark py-24 text-on-dark md:py-36"
    >
      <ScrollSectionTitle
        as="h2"
        className="block px-4 text-center font-display text-[clamp(3.5rem,11vw,11rem)] font-bold uppercase leading-[0.8] tracking-[-0.04em] md:px-8"
      >
        Works
      </ScrollSectionTitle>

      <div className="mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-6 md:mt-20 md:gap-8 md:px-8 scrollbar-none">
        {PROJECTS.map((project, i) => (
          <Link
            key={project.slug}
            href={`/portfolio/${project.slug}`}
            className="group relative w-[80vw] shrink-0 snap-start md:w-[clamp(28rem,38vw,40rem)]"
          >
            <div className="relative aspect-4/3 overflow-hidden bg-[#1b1b1b]">
              <Image
                src={project.image ?? FALLBACK_IMAGES[i % FALLBACK_IMAGES.length]}
                alt={project.title}
                fill
                className="object-contain p-10 opacity-60 grayscale transition-all duration-700 ease-[cubic-bezier(0.11,0.82,0.39,0.92)] group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0"
              />
              <span className="absolute left-5 top-5 font-mono text-[10px] uppercase tracking-[0.3em] text-on-dark-muted">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>

            <div className="mt-5 flex items-start justify-between gap-4">
              <div>
                <p className="font-display text-2xl font-bold uppercase leading-none tracking-tight md:text-3xl">
                  {project.title}
                </p>
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-on-dark-muted">
                  {project.category}
                </p>
              </div>
              <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-on-dark-muted transition-all duration-500 group-hover:rotate-45 group-hover:text-accent md:h-6 md:w-6" />
            </div>
          </Link>
        ))}
      </div>

      <Reveal delayMs={100}>
        <div className="mt-12 flex justify-center px-4 md:mt-16">
          <Link
            href="/portfolio"
            className="link-line font-display text-2xl font-bold uppercase tracking-tight md:text-4xl"
          >
            View all projects
            <ArrowUpRight className="ml-3 h-5 w-5 md:h-7 md:w-7" />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
