import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MotorSizingCalculator } from "@/features/toolkit/components/motor-sizing-calculator";

export const metadata: Metadata = {
  title: "Motor Sizing — Joseph Vu",
};

export default function MotorSizingPage() {
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
          Motor Sizing
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest text-ink-faint">
          Computed in SI
        </p>
      </div>

      <p className="mt-8 max-w-2xl text-base leading-relaxed text-ink-muted md:text-lg">
        Size a motor from the load and motion: reflected inertia, load and
        acceleration torque, RMS torque, power, and the load-to-motor inertia
        ratio — with a servo acceptance check. Math is done in SI; method after
        Repanich (CSU Chico) and Oriental Motor. Lead-screw and direct-drive
        mechanisms are live; belt, rack &amp; pinion, and index table follow.
      </p>

      <div className="mt-12">
        <MotorSizingCalculator />
      </div>
    </section>
  );
}
