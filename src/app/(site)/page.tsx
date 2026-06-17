import Image from "next/image";
import Link from "next/link";
import { AboutSection } from "@/components/shared/about-section";
import { ArrowUpRight } from "@/components/shared/arrow-up-right";
import { AwardsSection } from "@/components/shared/awards-section";
import { CustomCursor } from "@/components/shared/custom-cursor";
import { FormSection } from "@/components/shared/form-section";
import { ProjectsSection } from "@/components/shared/projects-section";
import { ServicesSection } from "@/components/shared/services-section";
import { Marquee } from "@/components/shared/marquee";

// Edit these three to retune the hero identity.
const HERO_WORDS = ["Design", "Engineer"];
const DESCRIPTORS = ["Automation & Controls"];

export default function LandingPage() {
  return (
    <>
      <CustomCursor />

      {/* Hero */}
      <section className="relative overflow-x-hidden pt-32 md:pt-44">
        <div className="relative w-full px-2 md:px-4">

          {/* ── Headline — z-10 so it sits OVER the portrait below ── */}
          <div className="relative z-10 pointer-events-none">
            <h1 className="flex flex-wrap items-end gap-x-[0.2em] font-display text-[clamp(5rem,15.5vw,22rem)] font-bold uppercase leading-[0.85] tracking-[-0.03em]">
              {HERO_WORDS.map((word) => (
                <span key={word}>{word}</span>
              ))}
            </h1>
          </div>

          {/* ── Descriptor zone — starts flush under headline ──────── */}
          <div className="relative z-0">

            {/* "BASED IN VIETNAM" — floats right, at same level as box top */}
            <div className="absolute right-2 top-3 z-20 md:right-4">
              <p className="font-display text-xs font-bold uppercase tracking-[1.2em] text-ink md:text-sm">
                based&nbsp;in&nbsp;vietnam
              </p>
            </div>

            {/* Gray box — 730px centered, matches Olha's hero-designer width */}
            {/* overflow-visible lets the portrait poke above the box top    */}
            <div
              className="relative mx-auto overflow-visible bg-[#f1f1f1]"
              style={{ maxWidth: "730px", minHeight: "380px" }}
            >
              {/* Top padding = the empty zone the headline text "passes over" */}
              <div className="px-8 pb-8 pt-[5vw] md:px-10 md:pb-10">
                <ul className="relative z-10 space-y-1.5">
                  {DESCRIPTORS.map((d) => (
                    <li key={d}>
                      <span className="block font-display text-xl font-bold uppercase tracking-tight md:text-3xl">
                        / {d}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Portrait — absolute, right side, top dips INTO the headline */}
              {/* -top-[12vw] ≈ headline height (15.5vw × 0.85 line-height)  */}
              <div
                className="absolute top-[-1.3vw] right-8 aspect-3/4 overflow-hidden md:right-10"
                style={{ width: "min(280px, 40%)" }}
              >
                <Image
                  src="/joe.png"
                  alt="Joseph Vu"
                  fill
                  className="object-cover object-center"
                  priority
                />
              </div>
            </div>
          </div>

          {/* ── CTAs ────────────────────────────────────────────────── */}
          <div className="mt-12 flex flex-col items-end gap-6 md:mt-16">
            <Link href="/portfolio" className="group block text-right">
              <span className="mb-1 flex items-center justify-end font-mono text-sm uppercase tracking-tight text-ink-muted">
                selected work
                <ArrowUpRight className="ml-2 h-4.5 w-4.5 rotate-90 transition-transform duration-500 group-hover:rotate-45" />
              </span>
              <span className="block font-display text-4xl font-bold uppercase leading-none tracking-tight md:text-6xl">
                portfolio
              </span>
            </Link>

            <a href="mailto:huyvu9688@gmail.com" className="group block text-right">
              <span className="mb-1 flex items-center justify-end font-mono text-sm uppercase tracking-tight text-ink-muted">
                available for work
                <ArrowUpRight className="ml-2 h-4.5 w-4.5 rotate-90 transition-transform duration-500 group-hover:rotate-45" />
              </span>
              <span className="link-line font-display text-3xl font-bold lowercase tracking-tight md:text-4xl">
                huyvu9688@gmail.com
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* Skills marquee */}
      <Marquee />

      {/* About & Experience */}
      <AboutSection />

      {/* Recent works */}
      <ProjectsSection />

      {/* Services — what Joe builds */}
      <ServicesSection />

      {/* Credentials */}
      <AwardsSection />

      {/* Contact form */}
      <FormSection />
    </>
  );
}
