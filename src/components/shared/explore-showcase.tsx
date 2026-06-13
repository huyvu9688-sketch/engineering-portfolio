import Link from "next/link";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";
import { ShowcaseCards } from "@/components/shared/showcase-cards";

/**
 * Landing "Explore" section — morphed from the owner-supplied index3
 * reference into the EngiHub design system. Light band
 * (oklch(0.97 0 0) bg, oklch(0.145 0 0) ink), Inter display + mono
 * chrome, single accent. Structure / layout / motion follow the
 * reference: centred gradient headline, two floating tags over a
 * fanned image grid (ShowcaseCards), subcopy, two CTAs. The
 * reference's staggered fadeSlideIn is expressed with the project's
 * scroll-triggered <Reveal> (delays mirror its 0.1 / 0.3 / 0.5 / 0.7s).
 */
export function ExploreShowcase() {
  return (
    <section className="bg-[oklch(0.97_0_0)] px-6 py-28 text-[oklch(0.145_0_0)] md:py-36">
      <div className="relative mx-auto max-w-7xl">
        {/* Headline */}
        <Reveal className="mx-auto max-w-3xl text-center" delayMs={100}>
          <h2 className="text-4xl font-semibold leading-[1.06] tracking-tighter sm:text-6xl lg:text-7xl">
            Showcase your work to{" "}
            <span className="block bg-gradient-to-r from-ink to-ink-muted bg-clip-text font-semibold tracking-tighter text-transparent">
              the world.
            </span>
          </h2>
        </Reveal>

        {/* Card rail */}
        <Reveal className="relative mx-auto mt-12 max-w-5xl" delayMs={300}>
          {/* Floating tag — left */}
          <div className="absolute -top-5 left-[12%] z-50 sm:-top-7 sm:left-[16%]">
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 font-mono text-[10px] font-medium uppercase tracking-widest text-on-dark shadow-md">
                designer
                <ArrowUpRight className="h-3 w-3 stroke-[1.5]" />
              </span>
              <span className="absolute -bottom-1 left-6 h-2 w-2 rotate-45 bg-accent" />
            </div>
          </div>

          {/* Floating tag — right */}
          <div className="absolute -top-4 right-[10%] z-50 sm:-top-6 sm:right-[14%]">
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 font-mono text-[10px] font-medium uppercase tracking-widest text-on-dark shadow-md">
                artist
                <ArrowUpRight className="h-3 w-3 stroke-[1.5]" />
              </span>
              <span className="absolute -bottom-1 left-6 h-2 w-2 rotate-45 bg-ink" />
            </div>
          </div>

          <ShowcaseCards />
        </Reveal>

        {/* Subcopy */}
        <Reveal className="mx-auto mt-8 max-w-xl text-center" delayMs={500}>
          <p className="text-base leading-relaxed text-ink-muted">
            Build your professional portfolio, connect with collectors, and
            share your creative journey with a global community.
          </p>
        </Reveal>

        {/* CTAs */}
        <Reveal
          className="mt-8 flex items-center justify-center gap-4"
          delayMs={700}
        >
          <Link
            href="/portfolio"
            className="inline-flex items-center justify-center rounded-full bg-ink px-7 py-3.5 font-mono text-xs font-bold uppercase tracking-widest text-on-dark transition-colors duration-300 hover:bg-accent"
          >
            Get started today
          </Link>
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface px-7 py-3.5 font-mono text-xs font-bold uppercase tracking-widest text-ink transition-colors duration-300 hover:text-accent"
          >
            View Examples
            <ExternalLink className="h-4 w-4 stroke-[1.5]" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
