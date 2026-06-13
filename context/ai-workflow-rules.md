# AI Workflow Rules

## Approach

Build this project incrementally using a spec-driven workflow.
Context files define what to build, how to build it, and the
current state of progress. Always implement against these
specs — do not infer or invent behavior from scratch. The
project owner is not a professional developer: explain
non-obvious decisions in one or two plain sentences when
making them, and prefer solutions he can read and maintain.

## Scoping Rules

- Work on one feature unit at a time
- Prefer small, verifiable increments over large speculative
  changes
- Do not combine unrelated system boundaries in a single
  implementation step
- Follow the phase order in `progress-tracker.md`; do not
  start Phase N+1 work while Phase N has open items

## When to Split Work

Split an implementation step if it combines:

- UI changes and API route / database changes
- Multiple unrelated calculators or multiple unrelated pages
- New behavior not clearly defined in the context files
- A Supabase schema change and the feature that uses it
  (migrate first, verify, then build)

If a change cannot be verified end to end quickly, the scope
is too broad — split it.

## Handling Missing Requirements

- Do not invent product behavior not defined in the context
  files
- If a requirement is ambiguous, resolve it in the relevant
  context file before implementing
- If a requirement is missing, add it as an open question in
  `progress-tracker.md` before continuing

## Protected Files

Do not modify the following unless explicitly instructed:

- `src/components/ui/*` — shadcn-generated components
- `context/*` files other than the specific update being made
- Any third-party library internals
- `.env*` files — never print or commit secrets

## Keeping Docs in Sync

Update the relevant context file whenever implementation
changes:

- System architecture or boundaries → `architecture.md`
- Storage model decisions → `architecture.md`
- Code conventions or standards → `code-standards.md`
- Theme or component conventions → `ui-context.md`
- Feature scope → `project-overview.md`

## Before Moving to the Next Unit

1. The current unit works end to end within its defined scope
2. No invariant defined in `architecture.md` was violated
3. `progress-tracker.md` reflects the completed work
4. `npm run build` passes
5. For calculators: results verified against at least one
   hand calculation noted in `progress-tracker.md`
