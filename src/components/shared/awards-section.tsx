"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight } from "@/components/shared/arrow-up-right";
import { Reveal } from "@/components/shared/reveal";
import { SplitText } from "@/components/shared/split-text";

// Reference site lists awarding bodies + counts with a hover image preview.
// Adapted to an engineer's credentials: each row is a discipline with a
// count, and hovering reveals the related mechanism drawings.
interface Credential {
  name: string;
  count: number;
  images: string[];
}

const CREDENTIALS: Credential[] = [
  {
    name: "Automation & Controls",
    count: 6,
    images: ["/mechanisms/belt-conveyor.png", "/mechanisms/index-table.png"],
  },
  {
    name: "SolidWorks / CAD",
    count: 4,
    images: ["/mechanisms/ball-screw.png", "/mechanisms/rack-pinion.png"],
  },
  {
    name: "Motion & Drives",
    count: 3,
    images: ["/mechanisms/direct-drive.png", "/mechanisms/ball-screw.png"],
  },
  {
    name: "Pneumatics",
    count: 2,
    images: ["/mechanisms/belt-conveyor.png"],
  },
];

export function AwardsSection() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section className="px-4 py-24 md:px-8 md:py-40">
      <div className="mx-auto max-w-300">
        <Reveal>
          <div className="flex items-baseline justify-between">
            <SplitText
              as="h2"
              className="font-display text-[clamp(3rem,10vw,10rem)] font-bold uppercase leading-[0.74] tracking-[-0.04em]"
            >
              Credentials
            </SplitText>
            <span className="font-display text-lg font-bold uppercase tracking-tight md:text-3xl">
              skills/4
            </span>
          </div>
        </Reveal>

        <div className="relative mt-16 md:mt-24">
          {/* Hover preview — floats top-right on desktop */}
          <div className="pointer-events-none absolute right-0 top-0 z-10 hidden h-52 w-[28rem] md:block">
            {CREDENTIALS.map((c, i) => (
              <div
                key={c.name}
                className={`absolute inset-0 flex gap-3 transition-opacity duration-500 ${
                  active === i ? "opacity-100" : "opacity-0"
                }`}
              >
                {c.images.map((src, j) => (
                  <div
                    key={`${src}-${j}`}
                    className="relative h-52 flex-1 overflow-hidden bg-[#f1f1f1]"
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      className="object-contain p-4 mix-blend-multiply"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Credential rows */}
          <ul className="border-t border-hairline">
            {CREDENTIALS.map((c, i) => (
              <li
                key={c.name}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                className="group flex items-center justify-between border-b border-hairline py-6 transition-colors duration-300 md:py-8"
              >
                <h3 className="flex items-baseline gap-3 font-display text-3xl font-bold uppercase tracking-tight transition-colors duration-300 group-hover:text-accent md:text-5xl">
                  {c.name}
                  <span className="font-mono text-xs text-ink-muted md:text-sm">
                    ( {c.count} )
                  </span>
                </h3>
                <ArrowUpRight className="h-5 w-5 shrink-0 text-ink-muted transition-all duration-500 group-hover:rotate-45 group-hover:text-accent md:h-7 md:w-7" />
              </li>
            ))}
          </ul>
        </div>

        <Reveal delayMs={80}>
          <p className="mt-14 font-mono text-sm uppercase tracking-tight text-ink-muted md:mt-20 md:text-base">
            More detail in my{" "}
            <a
              href="https://www.linkedin.com/in/quochuyvu99"
              target="_blank"
              rel="noopener noreferrer"
              className="link-line font-display font-bold text-ink"
            >
              LinkedIn
            </a>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
