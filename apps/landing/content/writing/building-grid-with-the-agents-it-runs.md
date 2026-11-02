---
title: "Building Grid with the agents it runs"
slug: building-grid-with-the-agents-it-runs
excerpt: "What 18 days, 597 commits and 177 board cards taught me about working with coding agents"
standfirst: "Grid is a workspace for people and coding agents. I built most of it the same way it asks you to work: agents on a board, each in its own lane, with me reviewing every change."
publishedAt: 2026-10-09
cover: /writing/building-grid-with-the-agents-it-runs.jpg
---

::lead On 22 September I turned the RabtX Starter monorepo into Grid. Eighteen days later the public beta went out with a one-line installer. In between there were 597 commits and 223 merged pull requests, and at least 312 of those commits name a coding agent as co-author. This is how that worked, and what I would keep.

## Why Grid exists

Coding agents got good enough to do real work, but the work lived in four places: the task in a tracker, the code on a laptop, the agent in a terminal tab and the pull request on GitHub. I kept losing the thread between them. Grid puts all four around the project folder: a board, live agent threads, the files, a terminal and the pull requests, on the machine that holds the code, opened from any browser or a phone.

## The board is the interface

Every change starts as a card in `.agents/board/`, a Markdown file with a type, an owner, a reviewer, a branch and, most importantly, a scope: the exact paths the change may touch.

```yaml filename="a real card's header"
title: Inbox — everything waiting on you, across projects
assignee: web
reviewer: human
branch: agent/web/inbox
worktree: ../grid-worktrees/inbox
scope:
  - apps/runner/src/inbox/**
  - apps/console/src/modules/inbox/**
```

Writing the card is most of my job. If I cannot say which files a change should touch and how I will know it works, the agent cannot either. 177 cards are in `done/` now, and the ones that went badly almost always had a vague scope.

## Roles and lanes stop agents colliding

Agents work as one of a few roles: backend (the API, runner and launcher), web, and UI/UX. A working contract every agent reads first says what any of them may and may not do. Each card gets its own branch and Git worktree, so two agents never edit the same checkout. An agent can read the whole repository, but it writes only inside its card's scope. If it finds a problem elsewhere, it raises a card for the owner instead of fixing it in passing.

That one rule did more for quality than any prompt. Most bad agent diffs I have seen are drive-by changes: a refactor nobody asked for, a file reformatted, a test quietly loosened. A hard write boundary removes the temptation.

## Evidence, not "done"

The contract has a line I lean on daily: never report a check as passed unless it was actually run. A card closes with what was run and what it printed: lint, typecheck, tests, and for UI work, a check in a real browser. An agent saying "should work now" is not evidence.

The busiest day, 28 September, had 98 commits. That pace is only safe because every change is small, scoped and proven before I look at it.

## What I changed my mind about

**Supporting every agent is a cost.** Grid briefly drove Freebuff by reading its terminal screen. It worked, until the account was suspended and the screen layout changed under it. I removed the adapter, its fake CLI and a dependency only it used. Grid now speaks to Claude Code, Codex, opencode, Antigravity and anything that implements the Agent Client Protocol, and I would rather support a protocol than scrape a screen.

**Updates must never break a running Grid.** Grid updates itself from its settings page, so a failed update would take down the very tool you would use to fix it. Each new version is built beside the running one, and Grid only switches over once the new build works.

**Threads have to outlive the machine.** Agent sessions first lived only in the runner's SQLite, on whichever machine ran them. Moving a project to a new VPS meant losing its history. Threads now sync to Grid's database and come back with `grid restore` on the next machine, and a fresh agent is told the earlier turns of a restored thread.

## What is not there yet

Grid is a working development workspace, not yet the startup operating system I want it to become. Deploying, operating and running a business from it are later areas. Agents still need a person to decide what to build and to review what they wrote. Grid is designed around that, not around pretending otherwise.

## Try it

Grid is open source under MIT or Apache-2.0. On Linux or macOS:

```bash
curl -fsSL https://grid.rabtx.dev/install.sh | bash
```

It starts on port 8080 and prints a link that creates your account. The code, the board and every one of those cards are at [github.com/rabtx/grid](https://github.com/rabtx/grid).
