import Link from "next/link";
import { ArrowUpRight } from "@/components/shared/arrow-up-right";

const PAGES = [
  { href: "/", label: "About me" },
  { href: "/tools", label: "Tools" },
  { href: "/portfolio", label: "Works" },
];

const SOCIALS = [
  { href: "https://www.linkedin.com/in/quochuyvu99", label: "LinkedIn" },
  { href: "https://github.com/huyvu9688-sketch", label: "GitHub" },
];

export function Footer() {
  return (
    <footer className="bg-canvas px-4 pb-6 pt-12 text-ink md:px-8 md:pb-8">
      <div className="mx-auto max-w-[1800px]">
        {/* Email — large, right aligned */}
        <a
          href="mailto:huyvu9688@gmail.com"
          className="ml-auto block w-max font-display text-3xl font-bold lowercase tracking-tight transition-colors duration-300 hover:text-accent md:text-6xl"
        >
          huyvu9688@gmail.com
        </a>

        {/* Social row */}
        <div className="mt-8 flex justify-end gap-8 md:mt-10 md:gap-16">
          {SOCIALS.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="link-line font-mono text-sm uppercase tracking-tight md:text-lg"
            >
              {social.label}
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </a>
          ))}
        </div>

        {/* Pages + location */}
        <div className="mt-12 flex flex-col-reverse items-center justify-between gap-8 md:mt-16 md:flex-row md:items-end">
          <div className="flex gap-8 md:gap-12">
            {PAGES.map((page) => (
              <Link
                key={page.label}
                href={page.href}
                className="font-mono text-base uppercase tracking-tight transition-colors duration-300 hover:text-accent md:text-xl"
              >
                {page.label}
              </Link>
            ))}
          </div>
          <div className="text-center md:text-right">
            <p className="font-mono text-xs capitalize text-ink-muted md:text-sm">
              Based in
            </p>
            <p className="font-mono text-xs capitalize text-ink-muted md:text-sm">
              Vietnam
            </p>
          </div>
        </div>

        {/* Giant name */}
        <div className="overflow-hidden">
          <p className="mt-6 select-none text-center font-display text-[24vw] font-bold uppercase leading-[0.85] tracking-[-0.06em] md:mt-2">
            Joseph Vu
          </p>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between pt-2">
          <p className="font-mono text-[10px] uppercase tracking-tight text-ink-muted">
            © 2026 Joseph Vu
          </p>
          <p className="font-mono text-[10px] uppercase tracking-tight text-ink-muted">
            Automation &amp; Production Engineering
          </p>
        </div>
      </div>
    </footer>
  );
}
