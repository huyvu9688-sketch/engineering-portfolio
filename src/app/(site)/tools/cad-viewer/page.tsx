import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CadViewer } from "@/features/toolkit/viewer/components/cad-viewer";

export const metadata: Metadata = {
  title: "CAD Viewer — Joseph Vu",
};

// What the viewer does — each line maps to a real control, not filler.
const CAPABILITIES: [string, string][] = [
  ["Orbit · zoom · pan", "Drag to rotate, scroll to zoom, right-drag to pan."],
  ["Component tree", "Every part and sub-assembly, searchable; click to focus."],
  ["Isolate · hide", "Right-click a part to isolate, hide, or focus it."],
  ["Measure", "Click two points for a straight-line distance."],
  ["View cube", "Snap to a standard view from the corner gizmo."],
  ["Edges · grid · axes", "Toggle wireframe edges and the reference grid."],
];

export default function CadViewerPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 pt-40 md:px-6">
      <Link
        href="/tools"
        className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ink-muted transition-colors hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4 stroke-[1.5]" />
        Toolkit
      </Link>

      <div className="mt-6 flex items-end justify-between border-b border-hairline pb-6">
        <h1 className="text-4xl font-semibold uppercase tracking-tighter md:text-7xl">
          CAD Viewer
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest text-ink-faint">
          Runs in your browser
        </p>
      </div>

      <p className="mt-8 max-w-2xl text-base leading-relaxed text-ink-muted md:text-lg">
        Drop a GLB or GLTF model to inspect an assembly in 3D — orbit it, walk
        the component tree, isolate and measure parts. The file is read locally
        in your browser; nothing is uploaded or stored.
      </p>

      <div className="mt-12">
        <CadViewer />
      </div>

      {/* Capabilities — a legend for the controls, set as a quiet spec list */}
      <div className="mt-12">
        <div className="flex items-end justify-between border-b border-hairline pb-4">
          <h2 className="text-2xl font-semibold uppercase tracking-tighter md:text-3xl">
            What it does
          </h2>
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">
            Controls
          </p>
        </div>
        <dl className="mt-8 grid gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map(([term, desc]) => (
            <div key={term}>
              <dt className="font-mono text-[10px] uppercase tracking-widest text-accent">
                {term}
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-ink-muted">{desc}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
