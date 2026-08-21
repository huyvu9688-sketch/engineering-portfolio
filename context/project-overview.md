# Joseph Vu — Creative Engineering Portfolio

## Identity

This site is the **primary artifact of craft** for Joseph Vu — an
automation & production engineer actively building toward senior
creative front-end developer. The portfolio itself is the proof of
skill: every section, animation, and interaction must read at the
quality bar of senior creative developers (reference:
olhalazarieva.com).

The marketing surfaces (home, portfolio) are the primary product. A
visitor should feel the craft within seconds of landing.

> **Engineering Toolkit and Technical Database removed 2026-07-03**
> at the owner's request (see `progress-tracker.md`). They are no
> longer part of the product; the sections below are kept only as a
> historical record in case either is rebuilt from scratch later.

## Goals

1. A live creative portfolio that reads at senior front-end /
   creative developer quality — heavy animation, intentional
   motion, layered composition matching the olhalazarieva.com bar
2. A codebase that grows with the developer — built to extend with
   new pages, animation patterns, and features without rewrites

## Core User Flow

1. Visitor lands on the home page — experiences the design and
   motion immediately; understands who Joe is within the first scroll
2. Visitor browses the portfolio — project showcases with clip-path
   image wipes, grayscale→color reveals, scroll-reactive layout

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
  overlapping typography, rotating supporting media, and an interactive
  3D model where a project provides one

### Removed — historical reference only

- **Engineering Toolkit** (unit converter, motor sizing calculator,
  pneumatic cylinder calculator, CAD viewer) — all removed.
- **Technical Database** (categorized file listing, upload/download,
  admin auth via Supabase) — removed.

## Scope

### In Scope

- Public read access to the portfolio
- English-language UI

### Out of Scope

- Multi-user accounts, comments, or social features
- Payment or subscription features
- Native mobile apps (responsive web only)
- Real-time collaboration
- Engineering calculators, file database, admin auth — removed
  2026-07-03; not currently planned

## Quality Bar

Marketing surfaces must match the quality bar of olhalazarieva.com:
- Per-letter / per-line staggered reveals driven by GSAP ScrollTrigger
- Clip-path image wipes and expanding cards on hover
- Scroll-reactive compositions with Lenis smooth scroll
- Custom cursor with elastic trail and magnetic interactions
- Layered, overlapping type and imagery — oversized condensed display
  type that bleeds past image edges
- Asymmetric indents, sticky/scroll-reactive compositions

## Success Criteria

1. Marketing surfaces pass the "first impression" test: a new visitor
   immediately reads the site as a senior creative developer's work
2. New marketing sections can be added by dropping a component into
   the home page layout without touching unrelated code
