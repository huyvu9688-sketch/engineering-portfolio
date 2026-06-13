import Link from "next/link";
import { ExternalLink, Mail } from "lucide-react";
import { AboutSection } from "@/components/shared/about-section";
import { CustomCursor } from "@/components/shared/custom-cursor";
import { ExploreShowcase } from "@/components/shared/explore-showcase";
import { MagneticButton } from "@/components/shared/magnetic-button";
import { Marquee } from "@/components/shared/marquee";
import { Reveal } from "@/components/shared/reveal";
import { ScrollToTopButton } from "@/components/shared/scroll-to-top-button";

const HERO_LINES = ["Joseph", "Vu"];

export default function LandingPage() {
  return (
    <>
      <CustomCursor />

      {/* Hero */}
      <section className="relative flex min-h-svh flex-col justify-center overflow-hidden px-4 pt-24 md:px-6">
        <div className="hero-glow absolute left-1/2 top-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2" />

        <div className="relative mx-auto flex w-full max-w-[1800px] flex-col items-center text-center">
          <div className="hero-line">
            <span style={{ "--rise-delay": "0s" } as React.CSSProperties}>
              <span className="inline-flex items-center gap-3 rounded-full border border-hairline bg-surface/40 px-4 py-1.5 shadow-sm backdrop-blur-md">
                <span className="flex h-3 items-center gap-1" aria-hidden>
                  <span
                    className="status-bar h-full w-1"
                    style={{ "--pulse-duration": "1s" } as React.CSSProperties}
                  />
                  <span
                    className="status-bar h-2/3 w-1"
                    style={{ "--pulse-duration": "1.2s" } as React.CSSProperties}
                  />
                  <span
                    className="status-bar h-full w-1"
                    style={{ "--pulse-duration": "0.8s" } as React.CSSProperties}
                  />
                </span>
                <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-ink md:text-xs">
                  Open to work
                </span>
              </span>
            </span>
          </div>

          <h1 className="mt-8 text-[13vw] font-semibold uppercase leading-[0.95] tracking-tighter md:text-[10vw]">
            {HERO_LINES.map((line, index) => (
              <span key={line} className="hero-line">
                <span
                  style={
                    {
                      "--rise-delay": `${0.15 + index * 0.12}s`,
                    } as React.CSSProperties
                  }
                >
                  {line}
                </span>
              </span>
            ))}
          </h1>

          <div className="hero-line mt-10">
            <span style={{ "--rise-delay": "0.65s" } as React.CSSProperties}>
              <span className="mx-auto block max-w-xl text-base leading-relaxed text-ink-muted md:text-lg">
                Engineering Portfolio
              </span>
            </span>
          </div>

          <div className="hero-line mt-10">
            <span
              className="flex flex-wrap justify-center gap-4"
              style={{ "--rise-delay": "0.8s" } as React.CSSProperties}
            >
              <MagneticButton>
                <Link
                  href="/portfolio"
                  className="inline-block rounded-full bg-ink px-7 py-3.5 font-mono text-xs font-bold uppercase tracking-widest text-on-dark transition-colors duration-300 hover:bg-accent"
                >
                  View Portfolio
                </Link>
              </MagneticButton>
              <MagneticButton>
                <Link
                  href="/tools"
                  className="inline-block rounded-full border border-hairline bg-surface px-7 py-3.5 font-mono text-xs font-bold uppercase tracking-widest text-ink transition-colors duration-300 hover:text-accent"
                >
                  Open Toolkit
                </Link>
              </MagneticButton>
              <MagneticButton>
                <a
                  href="https://github.com/huyvu9688-sketch"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub profile"
                  className="inline-flex items-center justify-center rounded-full border border-hairline bg-surface p-3.5 text-ink transition-colors duration-300 hover:text-accent"
                >
                  <ExternalLink className="h-5 w-5 stroke-[1.5]" />
                </a>
              </MagneticButton>
            </span>
          </div>
        </div>
      </section>

      {/* Skills marquee */}
      <Marquee />

      {/* Explore showcase — morphed from index3 reference */}
      <ExploreShowcase />

      {/* About & Experience */}
      <AboutSection />

      {/* Contact */}
      <section className="border-t border-hairline px-4 py-20 md:px-6 md:py-40">
        <div className="mx-auto max-w-[1200px] text-center">
          <Reveal>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent md:text-xs">
              Status: Open to work
            </p>
            <h2 className="mb-10 mt-6 text-5xl font-semibold uppercase leading-none tracking-tighter md:mb-12 md:text-9xl">
              Let&apos;s build
              <br />
              something
            </h2>
          </Reveal>

          <Reveal delayMs={100}>
            <div className="flex flex-col items-center justify-center gap-4 md:flex-row md:gap-12">
              <MagneticButton>
                <a
                  href="mailto:huyvu9688@gmail.com"
                  className="group inline-flex items-center gap-3 border-b border-hairline pb-1 font-mono text-lg text-ink transition-all duration-300 hover:border-accent hover:text-accent md:text-2xl"
                >
                  <Mail className="h-4 w-4 stroke-[1.5] md:h-5 md:w-5" />
                  huyvu9688@gmail.com
                </a>
              </MagneticButton>
            </div>
          </Reveal>

          <Reveal delayMs={200}>
            <div className="mt-16 grid grid-cols-2 gap-8 border-t border-hairline pt-12 text-center md:mt-24 md:grid-cols-4 md:gap-4 md:text-left">
              <div>
                <h4 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-ink-muted">
                  Socials
                </h4>
                <a
                  href="https://www.linkedin.com/in/quochuyvu99"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-1 block text-sm font-medium transition-colors duration-300 hover:text-accent md:text-base"
                >
                  LinkedIn
                </a>
                <a
                  href="https://github.com/huyvu9688-sketch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm font-medium transition-colors duration-300 hover:text-accent md:text-base"
                >
                  GitHub
                </a>
              </div>
              <div>
                <h4 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-ink-muted">
                  Location
                </h4>
                <p className="text-sm font-medium md:text-base">
                  [City, Country]
                </p>
                <p className="text-sm font-medium text-ink-muted md:text-base">
                  [Remote / On-site]
                </p>
              </div>
              <div>
                <h4 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-ink-muted">
                  Focus
                </h4>
                <p className="text-sm font-medium md:text-base">
                  Automation / Pneumatics
                </p>
                <p className="text-sm font-medium md:text-base">
                  SolidWorks / Motor Sizing
                </p>
              </div>
              <div className="col-span-2 mt-4 flex items-end justify-center md:col-span-1 md:mt-0 md:justify-end">
                <ScrollToTopButton />
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
