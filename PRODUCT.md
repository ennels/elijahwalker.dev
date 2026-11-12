# Product

<!-- impeccable:product-schema 1 -->
<!-- Product context for design work on this site. Tokens: src/styles/tokens.css. -->

## Platform

web

## Users

Recruiters, engineering programs (Boise State transfer), and fellowship reviewers who click the link from an application next to LinkedIn and GitHub. They scan for 30 seconds: who he is, what he has built, proof, how to reach him. Secondary: anyone looking at his creative work.

## Product Purpose

Elijah Walker's portfolio at elijahwalker.dev. Success is a reviewer finding the right project, the resume, and the email within one visit, and remembering the site afterward.

## Positioning

An AI and cloud computing student who has worked a semiconductor fab floor (SPC charts, metrology data, CVD tools at Micron) and builds Python and LLM tools, with ten years of digital media work behind him.

## Capabilities and Constraints

- Astro static build, GitHub Pages, deployed on push to `main`.
- All content is YAML in `content/`; empty fields hide instead of showing placeholders.
- Keep: headshot, all project content, GitHub (ennels) and LinkedIn links.
- Decided Nov 7, 2026:
  - The gravity-assist game is retired.
  - Content is never gated.
  - Creative work (drawings, photographs, music) gets its own section, and engineering leads.
  - New `/projects/<id>/` pages are approved; existing `#section` anchors keep working.
  - Creative items use labeled placeholders until files are supplied.
- Decided Nov 11, 2026 (Phase 3 pick):
  - Base direction: Sleeve (palette, cover hero, tracklist, project pages).
  - From Datasheet: project icons only, leading each title in the accent color.
  - From Contact sheet: the studio (film strips, music list, media frames), inside Sleeve's Side B band.
  - Nav stays at 5 items: Projects, About, Resume, Studio, Contact.
  - Design tokens are locked in `src/styles/tokens.css`.
- Decided Nov 12, 2026 (revision 1):
  - Project pages have no cover art; a small accent icon sits beside the title (same pairing as the tracklist).
  - Drawings use square frames, four to a strip; photos keep 3:2 frames, three to a strip.
  - A studio frame with a file links to the full-size image.
- Never publish the phone number. Keep job-offer status off the site. Sanitize Quorum (payroll data) and the HAL 9000 config before linking either.

## Evidence on Hand

- `content/*.yaml`: profile, 6 projects, 4 media pieces, resume, 3 lab notes (no dates or links yet), Now list.
- `public/headshot.jpg` (460 px).
- Four drawings (supplied Nov 12; titles still to come). No project screenshots, photos, or music files yet.
- No resume PDF without a phone number yet.

## Product Principles

1. Everything is readable on arrival; nothing is locked or hidden behind play.
2. Engineering proof first, creative range second, with both crafted to the same standard.
3. Specific numbers and real mechanisms over adjectives.
4. One memorable idea per page, kept quiet around it.

## Accessibility & Inclusion

WCAG 2.1 AA minimum: keyboard-complete, visible focus, reduced motion honored, 200% zoom without loss.
