"use client";

import { useState, type FormEvent } from "react";
import { ArrowUpRight } from "@/components/shared/arrow-up-right";
import { Reveal } from "@/components/shared/reveal";
import { SplitText } from "@/components/shared/split-text";

const PROJECT_TYPES = ["Automation", "Machine design", "Consulting"];

const CONTACT_EMAIL = "huyvu9688@gmail.com";

/**
 * Contact form modelled on the reference's "form" section. With no backend
 * wired up, submit composes a mailto: so the message lands in the visitor's
 * mail client addressed to Joe — boring, dependency-free, and it works.
 */
export function FormSection() {
  const [projectType, setProjectType] = useState(PROJECT_TYPES[0]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "");
    const email = String(data.get("email") ?? "");
    const message = String(data.get("message") ?? "");

    const subject = `Project enquiry — ${projectType}`;
    const body = `Name: ${name}\nEmail: ${email}\nProject type: ${projectType}\n\n${message}`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
  }

  return (
    <section id="connect" className="px-4 pb-32 pt-16 md:px-8 md:pb-48">
      <div className="mx-auto max-w-300">
        {/* Heading stack */}
        <Reveal>
          <div className="text-center">
            <h3 className="font-display text-lg font-bold uppercase tracking-tight md:text-3xl">
              Let&apos;s start a conversation
            </h3>
            <SplitText
              as="h2"
              className="mt-6 block font-display text-[clamp(3.5rem,13vw,11rem)] font-bold uppercase leading-[0.74] tracking-[-0.04em]"
            >
              Great machines
            </SplitText>
            <p className="my-4 font-display text-xs font-bold uppercase tracking-[0.6em] md:my-6 md:text-base">
              start with
            </p>
            <SplitText
              as="h2"
              className="block font-display text-[clamp(3.5rem,13vw,11rem)] font-bold uppercase leading-[0.74] tracking-[-0.04em]"
            >
              sharp engineering
            </SplitText>
          </div>
        </Reveal>

        {/* Form */}
        <Reveal delayMs={120}>
          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-20 flex w-full max-w-[42rem] flex-col md:mt-28"
          >
            <input
              type="text"
              name="name"
              placeholder="your name*"
              autoComplete="name"
              required
              className="mb-10 w-full border-b border-ink bg-transparent pb-3 font-mono text-sm uppercase tracking-tight placeholder:text-ink-faint focus:outline-none md:mb-16 md:text-base"
            />
            <input
              type="email"
              name="email"
              placeholder="your email*"
              autoComplete="email"
              required
              className="mb-10 w-full border-b border-ink bg-transparent pb-3 font-mono text-sm uppercase tracking-tight placeholder:text-ink-faint focus:outline-none md:mb-16 md:text-base"
            />
            <textarea
              name="message"
              placeholder="how can i help you"
              required
              rows={3}
              className="mb-10 w-full resize-none border-b border-ink bg-transparent pb-3 font-mono text-sm uppercase tracking-tight placeholder:text-ink-faint focus:outline-none md:mb-12 md:text-base"
            />

            <h4 className="font-mono text-sm uppercase tracking-tight md:text-base">
              project type
            </h4>
            <div className="mt-5 flex flex-wrap gap-x-10 gap-y-3">
              {PROJECT_TYPES.map((type) => (
                <label
                  key={type}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <input
                    type="radio"
                    name="projectType"
                    value={type}
                    checked={projectType === type}
                    onChange={() => setProjectType(type)}
                    className="sr-only"
                  />
                  <span
                    className={`font-mono text-base uppercase tracking-tight transition-all duration-300 md:text-lg ${
                      projectType === type
                        ? "font-semibold text-ink before:mr-1 before:content-['['] after:ml-1 after:content-[']']"
                        : "text-ink-muted"
                    }`}
                  >
                    {type}
                  </span>
                </label>
              ))}
            </div>

            <button
              type="submit"
              className="link-line mx-auto mt-20 font-mono text-xl uppercase tracking-tight md:text-2xl"
            >
              Discuss the project
              <ArrowUpRight className="ml-3 h-4 w-4 md:h-5 md:w-5" />
            </button>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
