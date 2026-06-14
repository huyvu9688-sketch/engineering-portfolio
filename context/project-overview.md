# EngiHub — Personal Engineering Platform

## Overview

EngiHub is a personal portfolio and mechanical engineering web
application built by Joe, an automation & production engineer.
It showcases his profile and projects, hosts a downloadable
technical database (3D models, PDFs), and provides interactive
engineering calculators for daily design work. It solves two
problems: a professional online presence, and a single place
for the reference tools and files engineers normally scatter
across bookmarks, USB drives, and vendor catalogs.

## Goals

1. A deployed, professional portfolio that a hiring manager or
   colleague can browse in under 2 minutes
2. At least 3 working engineering calculators used in real
   design work (pneumatic, motor sizing, unit conversion)
3. A searchable file database where 3D models and technical
   PDFs can be uploaded (admin) and downloaded (visitors)
4. A codebase a non-professional developer can maintain and
   extend without rewrites

## Core User Flow

1. Visitor lands on the homepage and sees three entry points:
   Portfolio, Tools, Database
2. Visitor browses portfolio projects
3. Visitor opens a calculator, enters inputs, gets instant
   results with units
4. Visitor browses the file database by category and downloads
   a STEP file or PDF
5. Admin (Joe only) signs in to upload/manage files

## Features

### Portfolio

- About/profile section with resume download
- Project cards with detail pages
  (an in-browser 3D model viewer was tried and removed on
  2026-06-14 — see progress-tracker.md)

### Engineering Toolkit

- Unit converter (length, force, pressure, torque, power, flow)
- Pneumatic cylinder calculator (force, air consumption)
- Motor sizing calculator (torque, inertia, gearbox ratio)
- Formula quick-reference pages
- (Later) ISO 286 tolerance/fit calculator
- (Later) Standard parts lookup (cylinders, bearings, fasteners)

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

## Success Criteria

1. Site is live on a public URL and loads in under 2 seconds
2. Each calculator produces results matching hand calculation
   for at least 3 verified test cases
3. Admin can upload a STEP file and a visitor can download it
4. A new feature (e.g. a 4th calculator) can be added without
   touching unrelated code
