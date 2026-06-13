import Link from "next/link";

const NAV_LINKS = [
  { href: "/portfolio", label: "Portfolio" },
  { href: "/tools", label: "Tools" },
  { href: "/database", label: "Database" },
];

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 mix-blend-difference">
      <nav className="mx-auto flex max-w-[1800px] items-center justify-between px-4 py-4 md:px-6">
        <Link
          href="/"
          className="font-mono text-xs uppercase leading-tight tracking-widest text-white"
        >
          EngiHub
          <br />
          <span className="text-white/60">Engineering</span>
        </Link>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full bg-white/10 px-2 py-1 backdrop-blur md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 font-mono text-xs uppercase tracking-widest text-white transition-colors duration-200 hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <a
          href="mailto:huyvu9688@gmail.com"
          className="rounded-full bg-white px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-black transition-colors duration-200 hover:bg-accent hover:text-white"
        >
          Contact
        </a>
      </nav>
    </header>
  );
}
