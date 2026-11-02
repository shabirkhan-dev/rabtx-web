---
title: "Frontend performance under real traffic"
slug: frontend-performance-under-real-traffic
excerpt: "Making React and Next.js feel fast on messy networks and mid-range phones"
standfirst: "Lab scores are useful. Real users on mid-range phones and hotel Wi‑Fi are the exam."
order: 2
publishedAt: 2026-07-10
thumbnail: /writing/starter-site.png
---

::lead I have watched teams celebrate a green Lighthouse score while support tickets said the admin “felt laggy.” Both can be true. Performance work that only chases lab metrics will miss the product moments that actually hurt: first useful paint of a dashboard, sorting a 10k-row table, submitting a form on a bad connection.

This is the longer field guide I use when a React / Next.js surface has to hold under real traffic.

## Define “fast” as a user job

Before profiles and bundlers, I write the jobs:

- Time to first meaningful control on the primary screen
- Time to interactive for the primary action
- Time to complete a common mutation (save, approve, sync)
- Stability under repeat navigation (no jank tax)

If you cannot name the job, you will optimize the wrong thing — usually a hero animation nobody needed.

## Measure where users actually are

I look at:

- Field data (CrUX / RUM) for LCP, INP, CLS on the routes that matter
- Product analytics for drop-offs after slow steps
- Session traces for a handful of real customer accounts

Synthetic tests still help for regressions. They do not replace a mid-range Android device on throttled 4G.

> A dashboard that scores 95 in the lab and stutters when filters change is not fast. It is well-lit.

## The critical path is a product decision

On first load I ask: what must be on screen for the user to start work? Everything else is deferred.

Typical cuts:

- Secondary widgets below the fold
- Charts that are not the first decision
- Marketing chrome on authenticated apps
- Fonts you do not need for the first paint

In Next.js terms that often means: smaller server payloads for the route, fewer client islands, and honest streaming where it helps — not sprinkling `"use client"` until the tree is a client monolith.

## Data shape beats micro-optimizations

I have spent days `useMemo`-ing a tree that was slow because the API returned a 2MB JSON blob for a table that showed twenty rows. Fix the contract:

- Paginate or window large collections
- Return only columns the view needs
- Push aggregations to the server
- Avoid nested fan-out that forces the client to re-join the world

```ts filename="list-query.ts"
// Prefer this
type AttendanceRow = {
  id: string;
  name: string;
  status: "present" | "absent" | "late";
};

// Not a kitchen-sink student document for every list cell
```

When payload size drops, “React performance” problems often evaporate.

## Rendering discipline in React

A few rules that keep paying rent:

1. **Keep state local.** Global stores that update on every keystroke will re-render continents.
2. **Split list items carefully.** Virtualize when rows exceed what a screen can honestly show.
3. **Don’t block input.** Expensive derived data belongs in workers or servers, not in the keystroke path.
4. **Memoization is a scalpel.** Profile first. Memo everywhere is a smell that the dataflow is wrong.

INP (Interaction to Next Paint) is where many modern apps fail: a click that waits on a giant re-render feels broken even if the network is fine.

## Loading states that preserve trust

Spinners that replace the whole page teach users that the product is unstable. I prefer:

- Skeleton layouts that match final geometry
- Partial hydration of known chrome
- Optimistic UI only when rollback is clear
- Disabled buttons that still explain what is happening

Layout shift is not only a CLS metric — it is a credibility problem. If the primary button jumps as fonts load, people misclick. That is a product bug.

## Images, fonts, and the quiet tax

Authenticated products still pay for media mistakes:

- Unsized images that shove content down
- Too many font weights
- Icon packs imported as entire libraries

I set explicit dimensions, subset fonts when possible, and import icons per-use. Boring discipline, large wins.

## Caching without lying

Caching should make repeat visits faster without showing stale money, permissions, or attendance counts as truth.

I separate:

- **Immutable assets** — aggressive cache
- **User-specific data** — short TTL or revalidate on focus
- **Permissions** — never casually stale

A fast wrong answer is worse than a slow right one in admin tools.

## Network reality

Assume:

- Packets drop
- Tabs background
- Users submit twice
- Offline happens mid-mutation

Idempotent APIs, clear pending states, and retries with backoff are frontend concerns as much as backend ones. The UI must say what is in flight.

## A workflow I actually run

When a surface feels slow:

1. Reproduce on a real device profile
2. Record the user job, not a homepage load
3. Check network waterfalls and payload sizes
4. Check main-thread long tasks during interaction
5. Fix data and critical path first
6. Only then micro-optimize components
7. Re-measure field metrics after release

Teams that jump to step six ship clever diffs and unchanged tickets.

## Case patterns from production

**Heavy admin table:** windowed list + server sort/filter + column allowlist. Perceived performance flipped before any fancy animation work.

**Marketplace ops screens:** WebSocket updates for a few live fields instead of refetching the universe. Payload overhead dropped hard when the API stopped sending decorative joins.

**Multi-tenant dashboards:** tenant-scoped queries with fixed page sizes; AI insight panels deferred until after the primary KPIs painted.

## What I refuse to optimize for

- Pixel-perfect Lighthouse theater on authenticated routes nobody benchmarks
- Premature micro-frontends “for performance”
- Animations that delay primary content

Performance is empathy for the user’s time and device. Everything else is decoration.

## Closing checklist

Before I call a frontend “fast enough”:

1. Named jobs have budgets
2. Field metrics exist for those routes
3. Payloads match the view
4. Loading preserves layout
5. Interactions stay responsive under load
6. Failure and retry are visible
7. We measured after shipping, not only before

Do that consistently and the interface starts to feel inevitable — not because it is flashy, but because it never makes people wait without a reason.
