# RabtX web

Bun workspace for the RabtX websites.

| App | Path | What it is |
| --- | --- | --- |
| `landing` | `apps/landing` | RabtX studio landing page (rabtx.dev) |
| `portfolio` | `apps/portfolio` | Shabir Khan's portfolio and blog |

Both apps are Next.js 16 + Tailwind 4. Dependency versions live once, in the `catalog`
of the root `package.json`; apps reference them as `"catalog:"`.

## Run

```bash
bun install
bun run dev:landing      # http://localhost:3000
bun run dev:portfolio    # http://localhost:3000
```

From the root, `bun run build`, `bun run lint` and `bun run typecheck` run across every app.

## Deploy

Each app is its own Vercel project, with its Root Directory set to `apps/landing` or
`apps/portfolio`.

## History

Both apps were imported with `git subtree`, so `git log -- apps/<app>` shows their full history
from the original `rabtx-landing` and `porfolio-blog` repos.
