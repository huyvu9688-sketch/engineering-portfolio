import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Cog, ImageOff } from "lucide-react";
import { CustomCursor } from "@/components/shared/custom-cursor";
import { Reveal } from "@/components/shared/reveal";
import { ProjectMediaRotator } from "@/features/portfolio/components/project-media-rotator";
import { PROJECTS, getProjectBySlug } from "@/features/portfolio/data/projects";

interface ProjectDetailPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return PROJECTS.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: ProjectDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return { title: "Project not found — Joseph Vu" };
  return { title: `${project.title} — Joseph Vu` };
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();
  const projectImages = project.images ?? (project.image ? [project.image] : []);

  return (
    <>
      <CustomCursor />
      <article className="mx-auto max-w-[1800px] px-4 pb-24 pt-32 md:px-6 md:pt-40">
        <Reveal>
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ink-muted transition-colors duration-300 hover:text-accent"
          >
            <ArrowLeft className="h-4 w-4 stroke-[1.5]" />
            All Projects
          </Link>
        </Reveal>

        <Reveal>
          <header className="mt-10 border-b border-hairline pb-10 md:mt-12">
            <p className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent">
              <Cog className="h-3 w-3 stroke-[1.5]" />
              {project.category}
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold uppercase leading-[0.95] tracking-tighter md:text-7xl">
              {project.title}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-muted md:text-lg">
              {project.summary}
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {project.tags.map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="rounded-full border border-hairline bg-surface px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-ink-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          </header>
        </Reveal>

        <Reveal>
          <div className="mt-10 md:mt-12">
            {projectImages.length > 0 ? (
              <ProjectMediaRotator images={projectImages} title={project.title} />
            ) : (
              <div className="aspect-16/10 overflow-hidden rounded-sm border border-hairline bg-surface">
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink-faint">
                  <ImageOff className="h-10 w-10 stroke-[1.5]" />
                  <span className="font-mono text-[10px] uppercase tracking-widest">
                    [Project Visual]
                  </span>
                </div>
              </div>
            )}
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-12 md:mt-20 md:grid-cols-12 md:gap-16">
          <Reveal className="md:col-span-8">
            <h2 className="font-mono text-xs uppercase tracking-widest text-ink-faint">
              Overview
            </h2>
            <div className="mt-6 space-y-6">
              {(project.overview ?? [project.summary]).map((paragraph, index) => (
                <p
                  key={index}
                  className="text-base leading-relaxed text-ink-muted md:text-lg"
                >
                  {paragraph}
                </p>
              ))}
            </div>
            {project.video ? (
              <div className="mt-10 max-w-3xl overflow-hidden rounded-sm border border-hairline bg-surface">
                <video
                  src={project.video}
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                  preload="metadata"
                  className="h-auto w-full"
                />
              </div>
            ) : null}
          </Reveal>

          <Reveal className="md:col-span-4" delayMs={100}>
            <div className="space-y-8 md:sticky md:top-32">
              <div>
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">
                  Role
                </h3>
                <p className="mt-2 text-sm font-medium md:text-base">
                  {project.role ?? "[Your role]"}
                </p>
              </div>
              <div>
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">
                  Timeframe
                </h3>
                <p className="mt-2 text-sm font-medium md:text-base">
                  {project.timeframe ?? "[Year]"}
                </p>
              </div>
              <div>
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">
                  Category
                </h3>
                <p className="mt-2 text-sm font-medium md:text-base">
                  {project.category}
                </p>
              </div>
            </div>
          </Reveal>
        </div>


        <Reveal>
          <div className="mt-20 border-t border-hairline pt-10">
            <Link
              href="/portfolio"
              className="group inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-ink transition-colors duration-300 hover:text-accent"
            >
              Back to all projects
              <ArrowUpRight className="h-4 w-4 stroke-[1.5] transition-transform duration-300 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </Reveal>
      </article>
    </>
  );
}
