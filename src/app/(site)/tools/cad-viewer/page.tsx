import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CadViewer } from "@/features/toolkit/viewer/components/cad-viewer";

export const metadata: Metadata = {
  title: "CAD Viewer — Joseph Vu",
};

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
        Drop a GLB or GLTF model to inspect an assembly in 3D — walk its
        component tree, isolate a part, and measure between two points. The file
        is read locally in your browser — nothing is uploaded or stored.
      </p>

      <div className="mt-12">
        <CadViewer />
      </div>

      <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-ink-faint">
        Drag to orbit · Scroll to zoom · Click a part to focus · Isolate · Measure
      </p>
    </section>
  );
}
