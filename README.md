# Joseph Vu — Engineering Portfolio

A personal portfolio and toolkit for an automation & production engineer:
projects, working engineering calculators, and a searchable technical
file library. Working name: **EngiHub**.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- TypeScript (strict)
- Tailwind CSS v4 (CSS-first config via `@theme inline`)
- Deployed on [Vercel](https://vercel.com)

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint
```

## Project structure

```
src/
  app/
    (site)/        # public marketing + utility pages (navbar/footer layout)
      page.tsx     # landing page
      portfolio/   # portfolio (Phase 2)
      tools/       # engineering toolkit (Phase 3)
      database/    # technical file database (Phase 4)
    layout.tsx     # root layout, fonts, metadata
    globals.css    # design tokens + keyframes
  components/
    shared/        # navbar, footer, marquee, cursor, reveal, etc.
context/           # project planning docs (design system, roadmap, standards)
```

## Design system

A Swiss-style system — light neutral canvas, near-black ink, a single
red-orange accent, Inter + monospace chrome. All colors and fonts are
CSS custom-property tokens in `src/app/globals.css`; components never
hardcode hex values. See `context/ui-context.md` for the full spec and
`context/progress-tracker.md` for the build roadmap and status.
