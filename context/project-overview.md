# Joseph Vu — Creative Engineering Portfolio

## Identity

This site is the **primary artifact of craft** for Joseph Vu — an
automation & production engineer actively building toward senior
creative front-end developer. The portfolio itself is the proof of
skill: every section, animation, and interaction must read at the
quality bar of senior creative developers (reference:
olhalazarieva.com).

The engineering toolkit and database are differentiators — they
demonstrate real domain depth beyond pure aesthetics. But the
marketing surfaces (home, portfolio) are the primary product. A
visitor should feel the craft within seconds of landing.

## Goals

1. A live creative portfolio that reads at senior front-end /
   creative developer quality — heavy animation, intentional
   motion, layered composition matching the olhalazarieva.com bar
2. At least 3 working engineering calculators that demonstrate real
   domain expertise (unit conversion DONE, motor sizing DONE,
   pneumatic cylinder pending)
3. A searchable file database where 3D models and technical PDFs can
   be uploaded (admin) and downloaded (visitors)
4. A codebase that grows with the developer — built to extend with
   new pages, animation patterns, and features without rewrites

## Core User Flow

1. Visitor lands on the home page — experiences the design and
   motion immediately; understands who Joe is within the first scroll
2. Visitor browses the portfolio — project showcases with clip-path
   image wipes, grayscale→color reveals, scroll-reactive layout
3. Visitor optionally opens a calculator or browses the database to
   see engineering depth
4. Admin (Joe only) signs in to upload/manage files

## Features

### Marketing Surfaces (primary craft surface)

- **Home**: hero → marquee → about → recent works → services →
  credentials → contact form → footer. Full Olha-clone design
  language: per-letter reveals, clip-path image wipes, scroll-
  reactive GSAP animation, Lenis smooth scroll, custom cursor,
  magnetic buttons
- **Portfolio listing**: project rows with grayscale→color hover,
  clip-path image reveals, hover previews
- **Project detail**: full-bleed hero, case-study layout, rich
  overlapping typography

### Engineering Toolkit

- Unit converter (length, force, pressure, torque, power, flow) —
  DONE
- Motor sizing calculator (direct, lead screw, belt/conveyor,
  rack & pinion, index table; servo/stepper/AC acceptance) — DONE
- Pneumatic cylinder calculator — BLOCKED on spec
- CAD viewer (fullscreen, GLB/GLTF, component tree, measure,
  isolate, explode, section cut, face selection) — DONE
- (Later) ISO 286 tolerance/fit calculator, formula reference pages

### Technical Database

- Categorized file listing (3D models, drawings, documents)
- File metadata: name, category, file type, description, size
- Download for visitors; upload/edit/delete for admin only
- (Later) thumbnail previews for 3D files

## Scope

### In Scope

- Single-admin content management (Joe is the only uploader)
- Public read access to portfolio, tools, and database
- English-language UI

### Out of Scope

- Multi-user accounts, comments, or social features
- Payment or subscription features
- Native mobile apps (responsive web only)
- Real-time collaboration

## Quality Bar

Marketing surfaces must match the quality bar of olhalazarieva.com:
- Per-letter / per-line staggered reveals driven by GSAP ScrollTrigger
- Clip-path image wipes and expanding cards on hover
- Scroll-reactive compositions with Lenis smooth scroll
- Custom cursor with elastic trail and magnetic interactions
- Layered, overlapping type and imagery — oversized condensed display
  type that bleeds past image edges
- Asymmetric indents, sticky/scroll-reactive compositions

Utility surfaces (calculators, database, CAD viewer) stay calm and
focused — same colors and typography, no heavy animation.

## Success Criteria

1. Marketing surfaces pass the "first impression" test: a new visitor
   immediately reads the site as a senior creative developer's work
2. Each calculator produces results matching hand calculation for at
   least 3 verified test cases
3. Admin can upload a STEP file and a visitor can download it
4. New marketing sections can be added by dropping a component into
   the home page layout without touching unrelated code
