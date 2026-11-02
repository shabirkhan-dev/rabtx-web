# Portfolio Blog

A portfolio and blog built with Next.js App Router, TypeScript and Tailwind CSS,
with the design from the "Portfolio" page of the Rabtx Figma file. Blog posts are static
Markdown files under `content/blog/`; profile, projects and work live in `src/data/profile.ts`.

## Getting Started

Install dependencies with Bun:

```bash
bun install
```

Optionally set the public site URL:

```bash
cp .env.example .env
```

Run the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Optional | Public URL for sitemap/metadata. |

## Content

- Blog posts: Markdown files in `content/blog/*.md`, loaded by `src/data/posts.server.ts`.
- Blog types + Markdown helpers (reading time, TOC, Listen text): `src/data/posts.ts`.
- Everything else (profile, projects, testimonials, nav): `src/data/site.ts`.

### Adding a post

Create `content/blog/your-slug.md`:

```md
---
title: "Your title"
slug: your-slug
category: Engineering
excerpt: "Short card blurb."
summary: "Slightly longer summary."
standfirst: "Optional opening line."
featured: false
publishedAt: 2026-07-13
takeaways:
  - "Optional bullet"
---

::lead Opening paragraph...

## Section

Body markdown...
```

Set `draft: true` (or `status: draft`) to keep a post out of the published list.

### Markdown format

| Syntax | Renders as |
| --- | --- |
| `## Heading` | Section heading (collected into the table of contents) |
| `### Subheading` | Subheading (not in TOC) |
| `::lead Your text` | Large lead paragraph |
| `> quote` | Pull quote |
| `> [!NOTE] text` | Callout box (label can be any word) |
| ` ```ts filename.ts ` | Code block with window chrome |
| `- item` / `1. item` | Styled bullet / numbered list |
| `---` | Decorative divider |

## Project Structure

- `content/blog` — static Markdown essays
- `src/app` — App Router pages (`/`, `/blog`, `/blog/[slug]`, etc.)
- `src/components` — layout, UI, and blog components
- `src/data/site.ts` — static profile, projects, testimonials, nav
- `src/data/posts.ts` — client-safe blog types + Markdown helpers
- `src/data/posts.server.ts` — filesystem post loader

## Useful Commands

```bash
bun dev        # start the dev server
bun run build  # production build
bun run lint   # lint
```

## Deploy on Vercel

Push to GitHub and import in Vercel (`bun install` / `bun run build`). Set
`NEXT_PUBLIC_SITE_URL` if you want absolute sitemap/metadata URLs.
