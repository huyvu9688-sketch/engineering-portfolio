import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Cog, ImageOff } from "lucide-react";
import type { Project } from "@/features/portfolio/data/projects";

interface ProjectRowProps {
  project: Project;
  /** Swap the image/text columns for an alternating layout. */
  reversed?: boolean;
}

export function ProjectRow({ project, reversed }: ProjectRowProps) {
  return (
    <Link
      href={`/portfolio/${project.slug}`}
      className="group grid grid-cols-1 gap-8 md:grid-cols-12 md:items-center md:gap-12"
    >
      <div className={`md:col-span-7 ${reversed ? "md:order-2" : ""}`}>
        <div className="aspect-16/10 overflow-hidden rounded-sm border border-hairline bg-surface">
          {project.image ? (
            <Image
              src={project.image}
              alt={project.title}
              width={1280}
              height={800}
              className="h-full w-full object-cover grayscale transition-all duration-500 group-hover:scale-[1.02] group-hover:grayscale-0"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink-faint transition-transform duration-500 group-hover:scale-[1.02]">
              <ImageOff className="h-8 w-8 stroke-[1.5]" />
              <span className="font-mono text-[10px] uppercase tracking-widest">
                [Project Visual]
              </span>
            </div>
          )}
        </div>
      </div>
      <div className={`md:col-span-5 ${reversed ? "md:order-1" : ""}`}>
        <p className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent">
          <Cog className="h-3 w-3 stroke-[1.5]" />
          {project.category}
        </p>
        <h3 className="mt-4 text-3xl font-semibold uppercase tracking-tighter md:text-4xl">
          {project.title}
        </h3>
        <p className="mt-4 text-base leading-relaxed text-ink-muted">
          {project.summary}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {project.tags.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="rounded-full border border-hairline bg-surface px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-ink-muted"
            >
              {tag}
            </span>
          ))}
        </div>
        <span className="mt-8 inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-ink transition-colors duration-300 group-hover:text-accent">
          View Project
          <ArrowUpRight className="h-4 w-4 stroke-[1.5] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
