import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, ImageOff } from "lucide-react";
import { CustomCursor } from "@/components/shared/custom-cursor";
import { Reveal } from "@/components/shared/reveal";
import { ProjectMediaRotator } from "@/features/portfolio/components/project-media-rotator";
import { ProjectModelViewer } from "@/features/portfolio/components/project-model-viewer";
import { ProjectVideo } from "@/features/portfolio/components/project-video";
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
      <article className="mx-auto max-w-[1800px] px-6 pb-24 pt-32 md:px-14 md:pt-40">
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
            <h1 className="max-w-4xl text-4xl font-semibold uppercase leading-[0.95] tracking-tighter md:text-7xl">
              {project.title}
            </h1>
          </header>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-8 md:mt-12 md:grid-cols-12 md:items-center md:gap-12">
          <Reveal className="md:col-span-3">
            <div className="space-y-8">
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

          <Reveal className="md:col-span-9" delayMs={100}>
            {projectImages.length > 0 ? (
              <ProjectMediaRotator images={projectImages} title={project.title} />
            ) : (
              <div className="aspect-video max-h-[70vh] overflow-hidden rounded-sm border border-hairline bg-surface">
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink-faint">
                  <ImageOff className="h-10 w-10 stroke-[1.5]" />
                  <span className="font-mono text-[10px] uppercase tracking-widest">
                    [Project Visual]
                  </span>
                </div>
              </div>
            )}
          </Reveal>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-12 md:mt-20 md:grid-cols-12 md:gap-16">
          {project.model || project.video ? (
            <Reveal className="md:col-span-6">
              <div className="md:sticky md:top-32">
                {project.model ? (
                  <ProjectModelViewer
                    src={project.model}
                    alt={`${project.title} interactive 3D model`}
                  />
                ) : project.video ? (
                  <div className="aspect-video overflow-hidden rounded-sm border border-hairline bg-surface">
                    <ProjectVideo src={project.video} />
                  </div>
                ) : null}
              </div>
            </Reveal>
          ) : null}

          <Reveal className="md:col-span-6" delayMs={100}>
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
