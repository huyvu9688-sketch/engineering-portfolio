import Link from "next/link";

const NAVIGATE_LINKS = [
  { href: "/portfolio", label: "Portfolio" },
  { href: "/tools", label: "Tools" },
  { href: "/database", label: "Database" },
];

export function Footer() {
  return (
    <footer className="bg-surface-dark text-on-dark">
      <div className="mx-auto max-w-[1800px] px-4 py-16 md:px-6">
        <p className="text-[18vw] font-semibold uppercase leading-none tracking-tighter md:text-[12vw]">
          EngiHub
        </p>

        <div className="mt-16 grid grid-cols-2 gap-8 border-t border-hairline-dark pt-8 md:grid-cols-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-on-dark-muted">
              Navigate
            </p>
            <ul className="mt-4 space-y-2">
              {NAVIGATE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-mono text-xs uppercase tracking-widest transition-colors duration-200 hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-on-dark-muted">
              Connect
            </p>
            <ul className="mt-4 space-y-2">
              <li>
                <a
                  href="mailto:huyvu9688@gmail.com"
                  className="font-mono text-xs uppercase tracking-widest transition-colors duration-200 hover:text-accent"
                >
                  Email
                </a>
              </li>
            </ul>
          </div>

          <div className="col-span-2 flex items-end justify-start md:justify-end">
            <p className="font-mono text-xs uppercase tracking-widest text-on-dark-muted">
              © 2026 EngiHub — Automation & Production Engineering
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
