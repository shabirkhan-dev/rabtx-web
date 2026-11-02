---
title: "Synone: a life app that works offline first"
slug: synone-a-life-app-that-works-offline
excerpt: "Why the phone writes first, how sync stays boring, and where AI is allowed to help"
standfirst: "Synone puts your day, training, money, food and faith on one calendar. The hard part was not the screens. It was making every one of them work without a network."
publishedAt: 2026-11-03
cover: /writing/synone-a-life-app-that-works-offline.jpg
---

::lead Most people run their life across a notes app, a budget app, a workout app and a calendar that knows about none of them. Synone is my attempt to put those parts in one place: a mobile app where a training session, a bill and an interview land on the same calendar. This post is about the decisions underneath it, because they matter more than any single screen.

## One person, one phone, many modules

Synone is built for one person. There are no teams, workspaces or roles, and every row on the server belongs to exactly one user. That sounds like a small detail, but it removed a whole class of problems before they started: no permissions model, no sharing rules, no "who can see this" screens.

Each part of life is a module you switch on when you want it: daily life, training, career, finance, food, care, faith, fashion and a wishlist. Every module has its own home, its own insights and the same ask bar at the bottom. Type "500 food" or "45 min gym" and it lands in the right place.

The calendar is the thread that ties them together. It reads every module's dated items, training sessions and program weeks, interviews and follow-ups, bill due days, and shows them next to your own events.

## The phone writes first

The first rule I wrote down was: **logging an expense, a meal or a workout never waits on the network.** If you are standing in a gym with one bar of signal, the app should not spin.

So every module writes to one SQLite database on the phone. There is a single `records` table, and each module defines typed collections on top of it:

```ts filename="a collection, roughly"
const applications = defineCollection("career.applications", parseApplication);
```

The `parse` function turns any stored value, old or damaged, into a valid one. That means a schema change never crashes a screen: the next read just fixes the shape. Writes are instant, happen in a transaction, and mark the record as dirty so sync knows to send it.

Reads go through React Query with the network mode set to always, so queries work offline and every write refreshes the collection that changed.

## Sync that stays boring

Sync is one endpoint. The phone pushes its dirty records and pulls everything that changed since its last cursor, in one round trip, paged so a long-offline phone does not send one huge request.

A few rules keep it predictable:

- **The newest edit wins, per record.** If the server already has a newer copy, the push comes back as a conflict and the phone takes the server's version. Deletes are tombstones, so they sync like any other change.
- **The cursor is a sequence number, not a timestamp.** Device clocks are wrong more often than you would think. A per-row sequence means a phone's clock never decides what it pulls.
- **One sync per user at a time.** A per-user lock on the server makes sure two devices syncing at once cannot skip a change.

The app syncs after sign-in, when it comes back to the foreground, a few seconds after a local change and every five minutes. Offline, it just waits.

Last write wins has a cost: if you edit the same record on two devices while both are offline, only the newer edit survives. For one person, that is a trade I am happy to make. It kept sync small enough to reason about in one sitting.

## Where AI is allowed to help

Synone is AI-native, but AI is never the only path. Every AI feature has an offline fallback:

- The ask bar uses an on-device parser when there is no connection.
- Forms can always be filled by hand.
- Screens say plainly when a feature needs the network, instead of failing quietly.

AI runs only in the cloud, inside the API. The provider key is a secret on the server, never in the app. Every task asks the model for JSON that matches a schema, and the answer is checked before it reaches the phone. Each person has a daily allowance, and the app says so when it is used up.

The other rule is privacy: the server keeps only what it needs, and AI never sees data you have not chosen to share. Money, body and routines are personal, and the design starts from that.

## One small API

The backend is one Hono app on Cloudflare Workers, talking to PostgreSQL through Drizzle. It handles email-code sign-in, sync, uploads and the AI tasks, and nothing else. Images go straight from the phone to R2 with a presigned URL, so the API never carries the bytes. Long videos, like exercise demos, stay in Google Drive and play in Drive's own player.

A new module needs no server change at all: a collection name and a parse function on the phone, and sync carries it.

## What I would keep

If I started again tomorrow, I would keep three things:

1. **Decide the offline story first.** Every screen got simpler once "write locally, sync later" was the only path.
2. **Parse on read.** Treating stored data as untrusted made schema changes painless.
3. **Give AI a fallback before giving it a feature.** An ask bar that degrades to a parser is better than one that breaks on a train.

Synone is open source and in active development. The code is on [GitHub](https://github.com/shabirkhan-dev/personal-os), and the [product page](/products/synone) has the screens.
