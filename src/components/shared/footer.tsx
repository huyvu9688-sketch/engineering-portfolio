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
        {/* Phone number — large, right aligned */}
        <a
          href="tel:123456789"
          className="ml-auto mt-16 block w-max font-display text-3xl font-bold lowercase tracking-tight transition-colors duration-300 hover:text-accent md:mt-20 md:text-6xl"
        >
          +123456789
        </a>

        {/* Email — large, right aligned */}
        <a
          href="mailto:huyvu9688@gmail.com"
          className="ml-auto block w-max font-display text-3xl font-bold lowercase tracking-tight transition-colors duration-300 hover:text-accent md:text-6xl"
        >
          huyvu9688@gmail.com
        </a>

        {/* Container for both social links and page navigation side by side */}
        <div className="mt-8 flex items-start justify-between md:mt-10">
          {/* Vertical page links on the left */}
          <div className="flex flex-col gap-2 md:gap-3">
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

          {/* Social links on the right */}
          <div className="flex gap-8 md:gap-16">
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
        </div>

        {/* Address */}
        <div className="mt-8 text-left md:text-right">
          <p className="font-mono text-xs capitalize text-ink-muted md:text-sm">
            Address:
          </p>
          <p className="font-mono text-xs text-ink-muted md:text-sm">
            333 Ashley Furniture Way | Advance, NC 27006
          </p>
        </div>

        {/* Giant name */}
        <div className="overflow-hidden">
          <p className="mt-6 select-none text-center font-display text-[24vw] font-bold uppercase leading-[0.85] tracking-[-0.02em] md:mt-2">
            Vu, Joseph
          </p>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between pt-2">
          <p className="font-mono text-[10px] uppercase tracking-tight text-ink-muted">
            © 2026 Joseph Vu
          </p>
          <div className="flex items-center gap-4 md:gap-6">
            <p className="font-mono text-[10px] uppercase tracking-tight text-ink-muted">
              Automation &amp; Production Engineering
            </p>
            <Link
              href="/admin"
              className="font-mono text-[10px] uppercase tracking-tight text-ink-faint transition-colors duration-300 hover:text-accent"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
