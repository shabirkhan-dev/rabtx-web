# RabtX landing page

The landing page for RabtX, a studio building AI-native, full-stack products.

Built with Next.js 16, Tailwind CSS 4 and Bun. Light and dark follow the system setting.

## Run

```bash
bun install
bun run dev
```

Production build:

```bash
bun run build
bun run start
```

## Layout

- `src/app` — layout, global tokens (`globals.css`), the home page, `products/[slug]` and `writing/[slug]` pages, `sitemap` and `robots`
- `src/lib` — `products.ts` (product data for the cards, dialogs, product pages and sitemap; bump a product's `updatedAt` when its page changes) and `posts.ts`
- `src/components` — one file per section: `hero`, `every-layer`, `products`, `engineering`, `quickstart`, `footer`, plus `logo`, `agent-logos` and `ui`
- `public/shots` — product screenshots exported from Figma
