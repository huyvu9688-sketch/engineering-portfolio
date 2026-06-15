import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { UnitConverter } from "@/features/toolkit/components/unit-converter";

export const metadata: Metadata = {
  title: "Toolkit — Joseph Vu",
};

const TOOLS: {
  name: string;
  status: string;
  available: boolean;
  href?: string;
  onThisPage?: boolean;
  desc: string;
}[] = [
  {
    name: "Unit Converter",
    status: "Live",
    available: true,
    onThisPage: true,
    desc: "Length, force, pressure, torque, power, and volumetric flow. Values are computed in SI and rounded only for display.",
  },
  {
    name: "Motor Sizing Calculator",
    status: "Live",
    available: true,
    href: "/tools/motor-sizing",
    desc: "Reflected inertia, load and acceleration torque, RMS torque, power, and inertia ratio — with a servo acceptance check. Lead-screw and direct-drive mechanisms live.",
  },
  {
    name: "CAD Viewer",
    status: "Live",
    available: true,
    href: "/tools/cad-viewer",
    desc: "Drop a GLB or GLTF model to inspect an assembly in 3D: orbit, walk the component tree, isolate, hide, and measure parts. Read locally — nothing is uploaded.",
  },
  {
    name: "Pneumatic Cylinder Calculator",
    status: "Coming next",
    available: false,
    desc: "Theoretical push/pull force, force at a chosen efficiency, and air consumption per cycle.",
  },
];

// Quick-reference conversions, pre-split on "=" so the equals signs line up
// into a real reference table (all factors from calculator-specs.md).
const REFERENCE: { group: string; rows: [string, string][] }[] = [
  {
    group: "Length",
    rows: [
      ["1 in", "25.4 mm"],
      ["1 ft", "304.8 mm"],
      ["1 m", "39.3701 in"],
    ],
  },
  {
    group: "Force",
    rows: [
      ["1 kgf", "9.80665 N"],
      ["1 kN", "101.972 kgf"],
    ],
  },
  {
    group: "Pressure",
    rows: [
      ["1 bar", "14.5038 psi"],
      ["1 MPa", "145.038 psi"],
      ["1 kgf/cm²", "0.980665 bar"],
    ],
  },
  {
    group: "Torque",
    rows: [
      ["1 N·m", "0.101972 kgf·m"],
      ["1 kgf·m", "9.80665 N·m"],
    ],
  },
  {
    group: "Power",
    rows: [
      ["1 kW", "1.34102 hp"],
      ["1 hp", "0.7457 kW"],
    ],
  },
  {
    group: "Flow",
    rows: [
      ["1 m³/h", "16.6667 L/min"],
      ["1 L/s", "60 L/min"],
    ],
  },
];

export default function ToolsPage() {
  const live = TOOLS.filter((t) => t.available).length;
  const planned = TOOLS.length - live;

  return (
    <section className="mx-auto max-w-[1800px] px-4 pb-24 pt-40 md:px-6">
      <div className="flex items-end justify-between border-b border-hairline pb-6">
        <h1 className="text-4xl font-semibold uppercase tracking-tighter md:text-7xl">
          Toolkit
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest tabular-nums text-ink-faint">
          {String(live).padStart(2, "0")} Live
          <span className="text-hairline-dark"> · </span>
          {String(planned).padStart(2, "0")} Planned
        </p>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_340px] lg:gap-16">
        {/* Converter — control panel docked far-right; sticks across the whole
            left column, so it stays visible through every section. First on
            mobile (tool-first). */}
        <div className="lg:order-2 lg:sticky lg:top-28 lg:self-start lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-mono text-xs uppercase tracking-widest text-ink-faint">
              Unit Conversion
            </p>
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Live
            </span>
          </div>
          <UnitConverter />
        </div>

        {/* Toolkit overview (left on desktop) */}
        <div className="lg:order-1">
          <p className="max-w-xl text-base leading-relaxed text-ink-muted md:text-lg">
            Engineering calculators for daily design work. The unit converter and
            motor sizing tool are live; the pneumatic calculator follows once its
            formulas are specified. The converter stays pinned on the right so
            it&apos;s always within reach while you work.
          </p>

          <div className="mt-12 border-t border-hairline">
            {TOOLS.map((tool) => {
              const body = (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight transition-colors group-hover:text-accent md:text-xl">
                      {tool.name}
                      {tool.href && (
                        <ArrowUpRight className="h-4 w-4 stroke-[1.5] text-ink-faint transition-colors group-hover:text-accent" />
                      )}
                    </h2>
                    <span
                      className={`shrink-0 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-widest ${
                        tool.available
                          ? "border-accent text-accent"
                          : "border-hairline text-ink-faint"
                      }`}
                    >
                      {tool.status}
                    </span>
                  </div>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted md:text-base">
                    {tool.desc}
                  </p>
                  {tool.onThisPage && (
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink-faint">
                      On this page →
                    </p>
                  )}
                </>
              );

              return tool.href ? (
                <Link
                  key={tool.name}
                  href={tool.href}
                  className="group block border-b border-hairline py-6 transition-colors hover:border-accent"
                >
                  {body}
                </Link>
              ) : (
                <div key={tool.name} className="border-b border-hairline py-6">
                  {body}
                </div>
              );
            })}
          </div>

          {/* Common conversions — quick reference, equals signs aligned */}
          <div className="mt-16">
            <div className="flex items-end justify-between border-b border-hairline pb-4">
              <h2 className="text-2xl font-semibold uppercase tracking-tighter md:text-3xl">
                Common Conversions
              </h2>
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">
                Reference
              </p>
            </div>
            <div className="mt-8 grid gap-x-12 gap-y-10 sm:grid-cols-2">
              {REFERENCE.map((group) => (
                <div key={group.group}>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                    {group.group}
                  </p>
                  <dl className="mt-3 space-y-1.5">
                    {group.rows.map(([lhs, rhs]) => (
                      <div
                        key={lhs}
                        className="grid grid-cols-[1fr_auto_1fr] items-baseline gap-2 font-mono text-sm tabular-nums"
                      >
                        <dt className="text-right text-ink">{lhs}</dt>
                        <span className="text-ink-faint">=</span>
                        <dd className="text-left text-ink-muted">{rhs}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
