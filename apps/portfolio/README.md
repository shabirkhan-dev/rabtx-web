# Portfolio Blog

A portfolio and blog built with Next.js App Router, TypeScript and Tailwind CSS,
with the design from the "Portfolio" page of the Rabtx Figma file. Profile, projects and work
live in `src/data/profile.ts`. Posts are written on rabtx.dev; this site lists them from its RSS feed.

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

- Profile, projects and work: `src/data/profile.ts`.
- Writing: posts live in the rabtx-landing repo (`content/writing/*.md`) and are published at
  rabtx.dev/writing. This site reads https://rabtx.dev/writing/feed.xml once a day
  (`src/data/posts.ts`) and links each post there, so there is one original for search engines.
  Old `/blog/...` URLs redirect permanently to the same post on rabtx.dev.
- To add a post, add it to rabtx-landing. It appears here within a day. To show a cover image,
  put it in `public/writing/` and add its slug to `THUMBNAILS` in `src/data/posts.ts`.
- `POSTS_FEED_URL` points the list at another feed, such as a local rabtx-landing server.

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

- `src/app` — App Router pages; `/blog/...` redirects to rabtx.dev in `next.config.ts`
- `src/components` — layout and UI components
- `src/data/site.ts` — static profile, projects, testimonials, nav
- `src/data/posts.ts` — reads the rabtx.dev writing feed
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
