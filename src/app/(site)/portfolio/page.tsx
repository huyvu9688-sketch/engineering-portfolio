import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio — EngiHub",
};

export default function PortfolioPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 pt-40 md:px-6">
      <div className="flex items-end justify-between border-b border-hairline pb-6">
        <h1 className="text-4xl font-semibold uppercase tracking-tighter md:text-7xl">
          Portfolio
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest text-ink-faint">
          Phase 2 — In Planning
        </p>
      </div>
      <p className="mt-8 max-w-xl text-base leading-relaxed text-ink-muted md:text-lg">
        Project case studies and 3D model viewers are coming in the next
        build phase.
      </p>
    </section>
  );
}
