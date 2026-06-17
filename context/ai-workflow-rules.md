# AI Workflow Rules

## Approach

Build this project incrementally using a spec-driven workflow.
Context files define what to build, how to build it, and the current
state of progress. Always implement against these specs — do not
infer or invent behavior from scratch.

The quality bar is **senior front-end / creative developer**
(reference: olhalazarieva.com). On marketing surfaces, prefer
elegant, animation-rich, layered solutions — not simplified
placeholders. On utility surfaces (calculators, database, CAD
viewer), favor calm, readable, correct behavior. Non-obvious
engineering math is never invented by the AI — it comes from the
owner-approved spec.

## Scoping Rules

- Work on one feature unit at a time.
- Prefer small, verifiable increments over large speculative changes.
- Do not combine unrelated system boundaries in a single
  implementation step.
- Follow the phase order in `progress-tracker.md`; do not start
  Phase N+1 work while Phase N has open items.

## When to Split Work

Split an implementation step if it combines:

- UI changes and API route / database changes
- Multiple unrelated calculators or multiple unrelated pages
- New behavior not clearly defined in the context files
- A Supabase schema change and the feature that uses it
  (migrate first, verify, then build)
- A GSAP animation addition and a structural layout change (do
  layout first, animate second — easier to verify each independently)

If a change cannot be verified end to end quickly, the scope is
too broad — split it.

## Handling Missing Requirements

- Do not invent product behavior not defined in the context files.
- If a requirement is ambiguous, resolve it in the relevant context
  file before implementing.
- If a requirement is missing, add it as an open question in
  `progress-tracker.md` before continuing.

## Animation Quality Gate

Before marking a marketing animation as done, verify:
1. The animation runs — confirm via a fresh dev server and hard
   reload before judging (stale dev server is the most common cause
   of "animation not working" reports)
2. Content is visible immediately if the animation fails or if
   `prefers-reduced-motion` is enabled
3. The motion feels intentional — not just a fade, but a
   well-paced staggered reveal that matches the reference quality
4. No jank on scroll; GSAP ScrollTrigger and Lenis are in sync

## Protected Files

Do not modify the following unless explicitly instructed:

- `src/components/ui/*` — shadcn-generated components
- `context/*` files other than the specific update being made
- Any third-party library internals
- `.env*` files — never print or commit secrets

## Keeping Docs in Sync

Update the relevant context file whenever implementation changes:

- System architecture or boundaries → `architecture.md`
- Storage model decisions → `architecture.md`
- Code conventions or standards → `code-standards.md`
- Theme, fonts, or component conventions → `ui-context.md`
- Feature scope → `project-overview.md`
- Progress → `progress-tracker.md` (after each meaningful unit)

## Git & Deploy Workflow

- Commit locally after each verified unit, as usual (small,
  descriptive commits).
- Do NOT `git push` to `main` after every commit. Pushing triggers
  a Vercel rebuild for each one, which is slow for WIP. Batch local
  commits and push only when the owner says a batch is ready to go
  live.
- Exception: if a change must be live immediately (a hotfix to the
  deployed site), push right away and say so.

## Before Moving to the Next Unit

1. The current unit works end to end within its defined scope
2. No invariant defined in `architecture.md` was violated
3. `progress-tracker.md` reflects the completed work
4. `npm run build` passes
5. For calculators: results verified against at least one hand
   calculation noted in `progress-tracker.md`
6. For marketing animations: animation quality gate passed (see above)
