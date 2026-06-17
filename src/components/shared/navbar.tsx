import Link from "next/link";
import { ArrowUpRight } from "@/components/shared/arrow-up-right";

const NAV_LINKS = [
  { href: "/portfolio", label: "Portfolio" },
  { href: "/tools", label: "Tools" },
  { href: "/database", label: "Database" },
];

export function Navbar() {
  return (
    // mix-blend-difference inverts against whatever scrolls beneath, so
    // one near-white color stays legible over both light and dark zones.
    <header className="fixed inset-x-0 top-0 z-50 text-[#efefef] mix-blend-difference">
      {/* Three-column grid: logo | nav (screen-center) | contact */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-6 md:px-8 md:py-8">
        {/* Logo — condensed display, lowercase */}
        <Link
          href="/"
          className="font-display text-2xl font-bold uppercase leading-none tracking-tight md:text-4xl"
        >
          VU, JOSEPH
        </Link>

        {/* Center nav — bracket links, screen-center via grid */}
        <div className="hidden items-center gap-5 md:flex lg:gap-10">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="link-bracket text-sm lg:text-base"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Contact — underline-wipe + rotating arrow, right-aligned */}
        <div className="flex justify-end">
          <Link
            href="/#contact"
            className="link-line font-mono text-sm uppercase tracking-tight md:text-base"
          >
            contact me
            <ArrowUpRight className="ml-2 h-4.5 w-4.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
