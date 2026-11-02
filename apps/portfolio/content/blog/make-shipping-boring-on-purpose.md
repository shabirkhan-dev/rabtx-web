---
title: "Make shipping boring on purpose"
slug: make-shipping-boring-on-purpose
excerpt: "Why CI, security checks and typed config should be unavoidable and dull"
standfirst: "The best release process is the one nobody has to heroically remember."
order: 3
publishedAt: 2026-05-08
---

::lead I care about the merge button more than the launch tweet. If shipping depends on one person’s laptop and a checklist in Slack, you do not have a delivery system — you have folklore.

## Put gates where work already flows

CodeQL, secret scanning, lint, typecheck, and tests belong on every merge. The tax is minutes; the alternative is discovering a leaked key or a broken type in production. I wire those gates so they are boring and impossible to skip on purpose.

## Treat config like code

Environment variables that only live in someone’s head will eventually lie. Typed config, reviewed defaults, and clear ownership beat “it works on my machine” every time. If a value can break production, it should not be a silent string in an unmarked `.env`.

## Deploy with a story you can reverse

A release path without rollback is optimism. I want: what shipped, who can reverse it, and how long until users stop seeing the bad version. That story belongs next to the feature design — not in a postmortem draft.

```yaml filename="ci-sketch.yml"
on:
  pull_request:
  push:
    branches: [main]
jobs:
  verify:
    steps:
      - run: pnpm typecheck
      - run: pnpm test
      - run: codeql analyze
```

## Boring is a feature

When shipping feels dramatic, something earlier failed: ownership, tests, or boundaries. Make the path dull, and the team can spend drama on the product instead of the pipeline.

That is release craft — invisible when it works, expensive when it doesn’t.
