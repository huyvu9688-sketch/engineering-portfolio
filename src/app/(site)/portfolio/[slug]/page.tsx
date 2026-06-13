import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Cog, ImageOff } from "lucide-react";
import { CustomCursor } from "@/components/shared/custom-cursor";
import { Reveal } from "@/components/shared/reveal";
import { ModelViewer } from "@/features/portfolio/viewer/components/model-viewer";
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
          {project.image ? (
            <div className="mt-10 aspect-video overflow-hidden rounded-sm border border-hairline bg-surface md:mt-12">
              <Image
                src={project.image}
                alt={project.title}
                width={1920}
                height={1080}
                className="h-full w-full object-cover"
                priority
              />
            </div>
          ) : project.model ? (
            <div className="mt-10 md:mt-12">
              <div className="mb-3 flex items-end justify-between">
                <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                  Interactive 3D Model
                </p>
                <p className="hidden font-mono text-[10px] uppercase tracking-widest text-ink-faint sm:block">
                  Drag to orbit · Scroll to zoom · Right-click a part
                </p>
              </div>
              <ModelViewer src={project.model} />
            </div>
          ) : (
            <div className="mt-10 flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-sm border border-hairline bg-surface text-ink-faint md:mt-12">
              <ImageOff className="h-10 w-10 stroke-[1.5]" />
              <span className="font-mono text-[10px] uppercase tracking-widest">
                [Project Visual]
              </span>
            </div>
          )}
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

        {/* When a project has BOTH an image (hero) and a model, the viewer
            gets its own section here. Model-only projects show the viewer as
            the hero above, so this section is skipped for them. */}
        {project.image && project.model ? (
          <Reveal>
            <section className="mt-16 md:mt-24">
              <div className="flex items-end justify-between border-b border-hairline pb-6">
                <h2 className="font-mono text-xs uppercase tracking-widest text-ink-faint">
                  3D Model
                </h2>
                <p className="hidden font-mono text-[10px] uppercase tracking-widest text-ink-faint sm:block">
                  Drag to orbit · Scroll to zoom · Right-click a part
                </p>
              </div>
              <div className="mt-8">
                <ModelViewer src={project.model} />
              </div>
            </section>
          </Reveal>
        ) : null}

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
