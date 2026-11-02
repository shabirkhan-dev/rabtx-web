---
title: "Building multi-tenant admin systems"
slug: building-multi-tenant-admin-systems
excerpt: "Tenancy models, permissions and data isolation when one codebase serves many customers"
standfirst: "Multi-tenant is not a database flag. It is a product architecture that either protects customers or slowly mixes them together"
order: 1
publishedAt: 2026-07-02
thumbnail: /writing/grid-board.png
---

::lead During testing, I caught a tenant-scoping mistake that allowed one school’s records to appear in another tenant’s report preview. It was fixed before release and became the reason I now make tenant context explicit and testable at every data boundary. This essay is the checklist that came out of that work.

## What “multi-tenant” actually means

People use the phrase casually. In practice you are answering three questions:

1. How is data isolated — shared schema with a `tenant_id`, schema-per-tenant, or database-per-tenant?
2. How is identity scoped — a user in one tenant, many tenants, or a platform operator across all?
3. How does the product make tenancy visible so humans do not make dangerous mistakes?

If you only answer the first question, you will build a clever schema and a confused product.

## Start with blast radius, not with Postgres features

I pick a tenancy model by asking what a bug would destroy.

- **Shared schema + `tenant_id`:** cheapest to operate, highest risk of a missing WHERE clause. Fine for many B2B products if every query path is disciplined and tested.
- **Schema-per-tenant:** stronger isolation, harder migrations, useful when compliance cares about physical separation of tables.
- **Database-per-tenant:** strongest isolation, expensive ops, usually reserved for regulated or huge customers.

Most products I build start shared-schema with ruthless query discipline, then graduate isolation only when a customer or regulator forces it. Premature database-per-tenant is a common way to invent DevOps debt before product-market fit.

## Put tenant context in the request, not in hope

Every server request that touches tenant data should carry an explicit tenant context derived from the session or API key — never from a client-supplied body field alone.

```ts filename="tenant-context.ts"
type TenantContext = {
  tenantId: string;
  actorId: string;
  roles: string[];
};

export function requireTenant(ctx: TenantContext | null): TenantContext {
  if (!ctx?.tenantId) {
    throw new Error("TENANT_REQUIRED");
  }
  return ctx;
}
```

If the UI can “pick a tenant” for platform operators, that selection still becomes server-validated context. A dropdown is not authorization.

## Authorization is a product surface

Role matrices look neat in Notion and explode in code. I keep a small set of roles with clear verbs: `read_students`, `manage_attendance`, `billing_admin`. Then I check verbs in the domain layer, not only by hiding buttons.

Hiding a button is UX. Enforcing a permission is security. You need both. Operators will find the API.

> [!NOTE] If your only authz test is “the menu item is missing,” you do not have authorization — you have obscurity.

## Data access patterns that survive growth

Three rules I enforce early:

1. **Every repository method that returns tenant data takes `tenantId` as a required argument** — not optional, not defaulted from ambient magic unless the ambient context is typed and reviewed.
2. **Cross-tenant analytics go through an explicit platform path** with separate audit logging.
3. **Background jobs rehydrate tenant context** from the job payload. A worker that “just uses the last request’s tenant” will corrupt someone eventually.

## Admin UI: make the tenant obvious

Confusion is a security bug. In the chrome I show:

- Current tenant name
- Environment (prod / staging)
- Role of the signed-in actor

When an operator switches tenants, I clear caches, reset list filters, and force a hard navigation for sensitive screens. Soft state leftover from Tenant A on Tenant B’s page is how people export the wrong CSV.

## Hierarchy for dense operations software

School and workforce admins are dense by nature. Density is fine. Chaos is not. I design each screen around one job:

- Attendance for a single day and cohort
- Approvals queue for one decision type
- Billing for one subscription

Secondary tasks become linked destinations, not panels bolted onto the same viewport. Cards-on-cards usually means the job was never named.

## AI features inside tenancy

If you embed LLM insights, the retrieval layer must be tenant-scoped as hard as the SQL. Embeddings, chat history, and tool calls inherit the same context. A helpful model that “remembers” another tenant’s incident is a compliance incident with a friendly tone.

I also keep a non-AI path for every critical workflow. When the model is down or wrong, the product still works.

## Migrations without midnight panic

Shared-schema tenancy makes migrations easier operationally and scarier socially — one bad migration hits everyone. I prefer:

- Expand / contract migrations
- Feature flags for new write paths
- Backfills that are resumable per tenant batch

Never invent a “quick script” that loops tenants without rate limits and observability. That script will become the outage.

## Observability that names the tenant

Logs without `tenant_id` are almost useless for multi-tenant incidents. Traces, metrics, and error reports should answer: which tenant, which actor, which feature, since when. Otherwise you debug in the dark while five customers tweet.

## A practical launch checklist

Before I call a multi-tenant admin “done”:

1. Can a missing tenant filter be caught by tests or query middleware?
2. Can a platform admin switch tenants without residual client state?
3. Do exports, reports, and AI tools inherit the same scope as the UI?
4. Do jobs and webhooks re-validate tenancy?
5. Can support answer “what did user X do in tenant Y yesterday?”

## Closing

Multi-tenant systems fail quietly before they fail publicly. The craft is not clever sharding diagrams. It is making isolation boring, visible, and enforced in every layer that touches customer data.

When the next feature asks to “just share this table across schools,” the answer is usually no — or yes with a new contract that names the blast radius out loud.
