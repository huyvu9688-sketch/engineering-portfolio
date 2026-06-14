import type { Metadata } from "next";
import { CustomCursor } from "@/components/shared/custom-cursor";
import { Reveal } from "@/components/shared/reveal";
import { ProjectRow } from "@/features/portfolio/components/project-row";
import { ModelViewer } from "@/features/portfolio/viewer/components/model-viewer";
import { PROJECTS, FEATURED_MODEL } from "@/features/portfolio/data/projects";

export const metadata: Metadata = {
  title: "Portfolio — Joseph Vu",
};

export default function PortfolioPage() {
  return (
    <>
      <CustomCursor />
      <section className="mx-auto max-w-[1800px] px-4 pb-24 pt-40 md:px-6">
        <Reveal>
          <div className="flex items-end justify-between border-b border-hairline pb-6">
            <h1 className="text-4xl font-semibold uppercase tracking-tighter md:text-7xl">
              Portfolio
            </h1>
            <p className="font-mono text-xs uppercase tracking-widest text-ink-faint">
              {String(PROJECTS.length).padStart(2, "0")} — Projects
            </p>
          </div>
        </Reveal>

        {/* Interactive 3D viewer — featured at the top of the portfolio.
            Capped width + centered so the page background shows on both sides. */}
        <Reveal>
          <div className="mx-auto mt-12 max-w-6xl md:mt-16">
            <div className="mb-3 flex items-end justify-between">
              <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                Interactive 3D Model
              </p>
              <p className="hidden font-mono text-[10px] uppercase tracking-widest text-ink-faint sm:block">
                Drag to orbit · Scroll to zoom · Right-click a part
              </p>
            </div>
            <ModelViewer src={FEATURED_MODEL} />
          </div>
        </Reveal>

        <Reveal>
          <h2 className="mt-20 border-b border-hairline pb-6 font-mono text-xs uppercase tracking-widest text-ink-faint md:mt-28">
            Selected Projects
          </h2>
        </Reveal>

        <div className="mt-16 flex flex-col gap-20 md:gap-32">
          {PROJECTS.map((project, index) => (
            <Reveal key={project.slug}>
              <ProjectRow project={project} reversed={index % 2 === 1} />
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
