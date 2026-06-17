import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CadViewer } from "@/features/toolkit/viewer/components/cad-viewer";

export const metadata: Metadata = {
  title: "CAD Viewer — Joseph Vu",
};

// Full-screen viewer: this route lives OUTSIDE the (site) layout, so it has no
// navbar/footer — just a Back affordance and the 3D window filling the screen.
export default function CadViewerPage() {
  return (
    <section className="flex h-screen flex-col bg-surface-dark">
      <div className="flex h-14 shrink-0 items-center px-4">
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 rounded-full border border-hairline-dark bg-surface-dark/80 px-4 py-2 font-mono text-xs uppercase tracking-widest text-on-dark-muted backdrop-blur transition-colors hover:bg-white/10 hover:text-on-dark"
        >
          <ArrowLeft className="h-4 w-4 stroke-[1.5]" />
          Back
        </Link>
      </div>
      <div className="min-h-0 flex-1">
        <CadViewer />
      </div>
    </section>
  );
}
