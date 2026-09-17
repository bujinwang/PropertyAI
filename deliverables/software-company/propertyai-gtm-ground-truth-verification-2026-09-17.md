# PropertyAI — Verified Ground Truth for the GTM / Packaging Plan

> **Owner:** 齐活林 (Qi) · Delivery Director, software-company team
> **Date:** 2026-09-17
> **Method:** direct measurement against the working tree — Prisma schema inspection, static import-graph BFS from `backend/src/index.ts`, and targeted greps. Every claim below is reproducible with the command shown.
> **Purpose:** the user's plan asserts "模块都已存在……纯打包，杠杆最高" (the modules all exist, it's pure packaging, highest leverage). This memo checks that premise. **Three of its load-bearing assumptions do not survive contact with the code.** This is the ground truth the GTM spec and the hard-gaps engineering plan are built on.

---

## TL;DR

| User's premise | Verdict | Evidence |
|---|---|---|
| "Free tier is pure packaging — modules already exist" | **FALSE** | There is **zero billing infrastructure**. No plan/subscription model, no entitlement field, no metering, no checkout. |
| "Public self-serve signup" (implied by items 1–2) | **BLOCKED — security hole** | `POST /api/auth/register` accepts `role: "ADMIN"` from an unauthenticated caller. |
| Maintenance triage is the wedge, "modules already exist" | **PARTLY FALSE** | The CV/photo path is a **7-line placeholder**; the real 626-line AWS implementation is **dead code** with its mount commented out. What is live is **text/NLP** triage, not CV. |
| "Rent collection" works, so a transaction fee can be charged | **FALSE** | It sends **email reminders** (50 lines). There is no tenant-facing payment path. See Finding 6. |
| Self-serve checkout is a small wiring job | **HALF TRUE** | The Stripe calls are real (274 lines), but the route file is **imported and never mounted** and its `require` is elided. See Finding 5. |
| Bulk SMS is "cheap" | **TRUE (but absent)** | Zero code — but it is a genuinely small build. |
| The 4 hard gaps are "the only expensive one" | **DIRECTIONALLY TRUE** | All four have zero code. Confirmed absent. |

**The honest summary:** item 1 is **not** the cheapest item — it is the item with the most missing infrastructure. Items 2 and 4 are cheap *once* the security hole is closed. Item 5 (bulk SMS) is genuinely cheap. The 4 hard gaps are the expensive ones, as the user said.

---

## Finding 1 — There is no billing infrastructure at all

**Premise tested:** "PropertyAI Free（1–2 单元 / ≤3 租约，免卡自助……靠交易费变现）——这是纯打包，模块都已存在."

**Result: FALSE.** A free tier metered on leases and monetized on transaction fees requires five things. Four of them do not exist.

| Requirement | Status | Evidence |
|---|---|---|
| A plan / subscription model | **ABSENT** | No `Subscription`, `Plan`, `Billing`, `Price`, `Tier`, or `Account` model in `backend/prisma/schema.prisma` (94 models). |
| An entitlement field on the user | **ABSENT** | `User` has no `plan`, `tier`, `subscription*`, `billing*`, `trial*`, or `unitLimit` field. |
| Entitlement enforcement / metering | **ABSENT** | Nothing counts units or leases against a limit anywhere in `backend/src`. |
| Self-serve checkout | **ABSENT** | No pricing page, no Stripe Checkout session, no card capture. |
| Billing scaffolding (dead) | **PRESENT BUT DEAD** | `src/config/stripe.config.js` defines `products: {basic, premium, enterprise}`, `prices: {...}`, and a `subscription: {defaultPaymentMethod, enableIncompletePayments, prorationBehavior}` block — **but it is unreachable.** |

**Verify:**
```bash
cd backend
grep -inE "^model (Subscription|Plan|Billing|Invoice|Price|Tier|Account)" prisma/schema.prisma   # -> NONE
grep -icE "invoice|plan|tier|subscription" prisma/schema.prisma                                 # -> 1 (unrelated)
node -e "..."  # reachability BFS: stripe.config.js and stripeService.js are both DEAD
```

The dead Stripe config is a **trap for the unwary**: it reads as though subscription billing was designed. It never was configured — its env fallbacks are literal placeholders (`'price_basic_monthly'`), and its only referrer (`src/services/paymentService.js`) is itself dead code.

**Consequence:** the free tier needs a **schema migration + entitlement middleware + metering + a billing integration**. That is a multi-sprint build, not packaging. Scope accordingly.

---

## Finding 2 — CRITICAL: unauthenticated privilege escalation on `POST /api/auth/register`

**This blocks items 1 and 2 of the plan outright.** Both put a public, no-card, self-serve signup at the front of the funnel, and the existing registration endpoint would let any visitor become an administrator.

### The chain

1. **Route is public and unmounted behind any guard** — `src/routes/authRoutes.ts:11`:
   ```ts
   router.post('/register', validateRegistration, authController.register);
   ```
   Mounted at `/api/auth` by `src/routes/index.ts:90`. No auth middleware. **No rate limiter** — `loginRateLimiter` is applied only to `/login` (line 12).

2. **The validator never inspects `role`** — `src/middleware/validation.ts:5`:
   ```ts
   const { email, password, firstName, lastName } = req.body;
   ```
   It checks email format, password length ≥ 6, and name presence. Grepping for any allowlist (`isIn([...])`, `.includes(`, `allowlist`) across `validation.ts` and `authController.ts` returns **zero matches**.

3. **The controller writes the raw body value straight to the database** — `src/controllers/authController.ts:13,24`:
   ```ts
   const { email, password, firstName, lastName, role } = req.body;   // :13
   // ...
   role,                                                               // :24  -> prisma.user.create
   ```

4. **`UserRole`** = `{ ADMIN, PROPERTY_MANAGER, TENANT, USER, VENDOR, OWNER }`, and `User.role` defaults to `TENANT`.

### Exploit

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"x@y.z","password":"secret1","firstName":"A","lastName":"B","role":"ADMIN"}'
```

→ an `ADMIN` account. There is **no email verification** on this path either.

**Status:** dispatched for fix (two-layer, fail-closed allowlist) alongside the deletion batch. The fix is small; the exposure is not, because the plan intends to *advertise* this endpoint.

---

## Finding 3 — The advertised wedge is largely dead code

The positioning doc rates **"AI maintenance triage (photo/message → prioritized WO → vendor dispatch)"** as PropertyAI's strongest differentiator — "the single row where PA leads the field," "the one honest moat."

**The reachability analysis does not support that as stated.**

| Artifact | Size | Reachable? | What it actually is |
|---|---|---|---|
| `src/cv/photoAnalysis.ts` | **7 lines** | DEAD | `return { labels: ['property','interior'] }` under `// Placeholder for photo analysis logic` |
| `src/services/photoAnalysis.service.ts` | 626 lines | **DEAD** | A **real** AWS Rekognition/S3/sharp implementation — stranded |
| `src/controllers/photoAnalysis.controller.ts` | — | **DEAD** | — |
| `src/routes/photoAnalysis.routes.ts` | — | **DEAD** | Mount is **commented out** (`routes/index.ts:37`, `:117`) |
| `src/services/urgency.service.ts` | — | **DEAD** | — |
| `src/services/triage.service.ts` | 92 lines | **LIVE** | Reached via `contractor.service.ts:80` ← `contractor.controller.ts` |

**Read `triage.service.ts` before repeating the CV claim.** It calls `sentimentService.analyze()` and `nlpService.extractDetails()`. **The live triage is text/NLP, not computer vision.**

**Correction to publish:** the differentiator is *"maintenance triage"*, live and text-based. The *photo/CV* capability is two disconnected halves — a 7-line placeholder on the (commented-out) live route, and a real implementation in dead code. Either wire it and validate it, or stop leading with it.

`src/services/accounting.service.ts` is similarly misleading: **33 lines**, two methods posting to the QuickBooks **sandbox** with a hardcoded company id `123146428700338`, and it is **DEAD**. Do not describe accounting as a strength.

---

## What IS live and safe to build on

Verified reachable from `src/index.ts` (286 reachable modules of 533 files):

| Capability | Module | Status |
|---|---|---|
| Rent collection | `src/services/rentCollection.service.ts` | ✅ LIVE — **but read Finding 6: it sends reminders, it does not collect money** |
| Payments (approval workflow) | `src/controllers/payment.controller.ts`, `src/routes/payment.routes.ts` | ✅ LIVE — approve/reject pending transactions & vendor payments |
| Payments (Stripe: customers, subscriptions, payment-intents, invoices, portal) | `src/routes/paymentRoutes.ts` → `paymentController.ts` | ❌ **NOT MOUNTED — see Finding 5** |
| Tenant portal | `src/routes/tenantRoutes.ts` | ✅ LIVE |
| Maintenance | `src/routes/maintenanceRoutes.ts`, `src/services/triage.service.ts` | ✅ LIVE (NLP) |
| Expense categorization / cash-flow forecast | `src/services/expenseCategorization.service.ts`, `src/services/cashFlowForecasting.service.ts` | ✅ LIVE |
| Comms (chat / voice / translation / sentiment) | `conversation.service.ts`, `routes/voiceRoutes.ts`, `routes/translation.routes.ts`, `routes/sentiment.routes.ts` | ✅ LIVE |
| Screening | `backgroundCheck.service.ts`, `riskAssessment.service.ts` | ✅ reachable, but stubbed (`assessRisk()` = `// Mock implementation for now`) |
| Listing syndication | `src/services/zillow.service.ts` | ✅ LIVE |
| Lease e-sign | `src/routes/signature.routes.ts` | ✅ LIVE |
| Auth | `src/controllers/authController.ts`, `src/routes/authRoutes.ts` | ✅ LIVE (**see Finding 2**) |

**Verified absent entirely** (zero real matches; venv hits excluded): `trustAccount`, `ownerStatement`, `1099`, `csvImport`, `importData`, `dataImport`, `bulkSms`, `massText`, `bulkMessage`.

---

## Schema constraints that bear on the design

Two constraints sit directly under items 1 (lease-meted free tier + transaction fees) and the hard gaps (trust accounting, owner distributions).

1. **`Lease.rentalId` is `@unique`.** One rental ⇒ **at most one lease, ever.** No lease history, no renewals on the same unit. A PM product whose tenants renew, and whose ledger requires sequential leases per unit, cannot be modelled as-is. Relaxing a `@unique` on an existing column is a migration with data implications.
2. **`Transaction.leaseId` is a required `String`.** A transaction cannot exist without a lease. Trust accounting needs transactions belonging to an **owner or a trust account** (owner contribution, management-fee transfer, disbursement) — not necessarily a lease.

**Also:** `TransactionType` = `{ RENT_PAYMENT, SECURITY_DEPOSIT, MAINTENANCE_FEE, REFUND, OTHER }` is a **payment-purpose** enum with **no `INCOME`/`EXPENSE`** direction. Any ledger needs debit/credit. And `TransactionStatus` = `{ PENDING, COMPLETED, FAILED, REFUNDED }` has **no `MISSED`** — because a missed payment produces no row at all.

---

## Revised sequencing (my recommendation)

The user's ordering put the free tier first as "the cheapest thing." Given Finding 1, I'd reorder:

| # | Item | Why here |
|---|---|---|
| **0** | **Fix the `/register` escalation hole** | Non-negotiable precondition. Small. Blocks 1 and 2. **In flight.** |
| **1** | **Public pricing + self-serve checkout** | Cheaper than the free tier, and it is the *trust signal* the user correctly identifies as load-bearing. Pricing is a commercial decision; checkout needs the billing model below. |
| **2** | **Billing / entitlement foundation** | The schema + metering that both the free tier and paid checkout require. This is the real first engineering step, not the free tier. |
| **3** | **Import / migration + trial-data preservation** | Cheap, high switching leverage, and independent of billing. Could run in parallel with 2. |
| **4** | **Bulk SMS on all tiers** | Small build, real tenant-channel value, genuinely cheap. |
| **5** | **"PropertyAI Free"** | Now cheap — because 2 and 4 landed. Metering exists; SMS is the retention channel. |
| **6** | **The 4 hard gaps** | Genuinely the expensive item, as the user said. Trust accounting gates owner distributions. |

**The one-line reframe:** the user is right that the 4 hard gaps are the expensive phase. They are wrong that the free tier is free — it is cheap *only after* a billing foundation that does not currently exist, and it is unsafe *only until* a security hole that is currently open gets closed.

---

## Finding 5 — The entire Stripe surface is imported but **never mounted**. It 404s.

**Found by the PM during the GTM spec, and verified independently by me.**

There are **two** payment route files, and the names are one dot apart — the same trap as `audit.service.ts` / `auditService.ts`.

| File | Imported at | Mounted? | Declares |
|---|---|---|---|
| `src/routes/payment.routes.ts` (**with dot**) | `app.ts:43` | ✅ `app.use('/api/payments', …)` at `app.ts:142` | `transactions/*` and `vendor-payments/*` approve/reject |
| `src/routes/paymentRoutes.ts` (**no dot**) | `routes/index.ts:31` | ❌ **never `router.use`d** | `/customers`, `/payment-intents`, `/subscriptions`, `/webhooks`, `/refunds`, `/setup-intents`, `/invoices`, `/customer-portal-session`, `/calculate-fees` — **15 endpoints** |

**Verify:**
```bash
cd backend
grep -n "paymentRoutes" src/routes/index.ts   # -> only line 31, the import. No router.use.
grep -n "payment" src/app.ts                  # -> mounts ./routes/payment.routes (the dot one)
cp ~/.workbuddy-ai/skills/ts-dead-code-triage/scripts/elision-check.js ./t.js
node ./t.js src/routes/index.ts               # -> "elided/absent  ./paymentRoutes"
```

Two independent reasons it cannot serve:

1. **No mount.** `routes/index.ts:31` imports the binding and never passes it to `router.use()`. An import with no mount serves nothing.
2. **The `require` is elided.** The binding `paymentRoutes` is never used in a value position, so TypeScript removes the import from the emitted JS entirely — the module is never even loaded. Confirmed with `elision-check.js`.

**Consequence for item 2 of the plan (self-serve checkout):** *all* of the Stripe subscription/checkout/portal primitives — `createCustomer`, `createPaymentIntent`, `createSubscription`, `createInvoice`, `getCustomerPortalSession`, `calculateFees` — are **implemented in `payment.service.ts` (274 lines, real Stripe SDK calls) and reachable from nothing.** Mounting `paymentRoutes.ts` is small. Note the contrast with Finding 1: this is scaffolding that *looks* dead but is substantially built; the missing piece is the mount plus the billing **model**, not the Stripe calls.

**Correction to my own earlier note.** An earlier version of this document listed `src/routes/paymentRoutes.ts` as LIVE. That was wrong, and it was wrong for an instructive reason: my `dead-set.js` BFS counts an `import` statement as a reachability edge **without modelling elision**, so an elided-and-unmounted file is counted reachable and silently omitted from the delete set. I have added an explicit **elision-suspect audit** to `dead-set.js` so this class of error is reported mechanically rather than depending on memory. On this repo it now flags exactly one file: `paymentRoutes`.

---

## Finding 6 — "Rent collection" sends reminders; it does not move money

**Verified by reading the whole file — `src/services/rentCollection.service.ts` is 50 lines.**

It is scheduled daily (`scheduleJob('0 0 * * *', …)`) and does one thing: `prisma.lease.findMany({ status:'ACTIVE' })` → `sendEmail(...)` with one of three reminder templates (upcoming / due-soon / overdue).

There is **no payment rail on the tenant side**: no `createPaymentIntent`, no charge, no payment link. The only Stripe methods that exist are in `payment.service.ts` (a mix of live payment-approval methods and the unmounted subscription set from Finding 5).

**Consequence:** the free tier's headline feature — "收租" — is, as built, **an email reminder engine plus an owner-approval queue for transactions**. For a free tier monetized on **transaction fees**, this is the critical gap: *there is no tenant-facing way to pay.* A take-rate on payments requires a payment path, and the payment path is the unmounted Stripe file. This raises the cost of item 1 again, and it directly affects the economics in open decision #1.

---

## Finding 7 — My reachability analysis was backend-only, and that produced a wrong deletion instruction

**This is a methodological gap in my own analysis, and it nearly shipped a user-visible regression.**

The BFS walks the backend import graph from `src/index.ts`. It cannot see a React Native screen or a dashboard page. A route file can be unreachable from the backend **and** be the live API contract for a sibling client app.

**The concrete case:**
- `propertyapp/src/navigation/AppNavigator.tsx` **registers `VisitorManagementScreen`** as a screen.
- `propertyapp/src/services/visitorService.ts` calls `/visitors`, `/visitors/:id/approve`, `/deliveries`.
- `src/routes/visitorManagement.routes.ts` is the **only** backend file declaring those endpoints.
- It is **unmounted** (`grep "visitor" src/app.ts src/routes/index.ts` → nothing), so the screen **404s today**.

So this file is not garbage — **it is the fix material for a broken screen**, and it was on my delete list. It has been removed from the batch. `visitorController.ts` is retained alongside it.

**Standing rule, now enforced by a script:** before deleting any unmounted route file, check whether a client app calls its endpoints. `scripts/frontend-consumers.js` does this — it parses backend mount statements into absolute paths, extracts literal HTTP calls from `propertyapp` / `dashboard` / `ContractorApp`, and reports candidate-dead routes whose endpoints no mounted route serves. **An unmounted route that a client calls is a broken screen, not dead code** — and finding it is often the highest-value outcome of the whole exercise.

---

## Open decisions for the user

1. **Transaction-fee take rate** — the free tier's whole economics. Needs a number before the billing model can be designed. **Note Finding 6: there is currently no tenant payment path, so the take rate cannot be charged at all until one is built.**
2. **`Lease.rentalId` uniqueness** — relax it (migration + data risk) or design around single-lease-per-unit? This affects both the ledger design and the lease-metered free tier.
3. **CV photo triage** — wire the real 626-line implementation and validate it, or drop the claim from the positioning? It is currently the headline differentiator and it is disconnected.
4. **Admin bootstrap** — if no admin-creation path exists, how should the first admin be created (invite endpoint vs env bootstrap)? Pending the engineer's report.
5. **Mount `paymentRoutes.ts`?** — the Stripe subscription/checkout/portal surface is fully implemented but unmounted. Mounting is small; deciding *which* of the 15 endpoints should be public is a product call.

---

*Reproduce every claim: the reachability script is `~/.workbuddy-ai/skills/ts-dead-code-triage/scripts/dead-set.js` (run from `backend/`). Scale: **533 source files, 287 reachable from the app entry, 336 from tests, 192 reachable from neither, 54 unreachable-but-tested (do not delete).** The 192-file delete set carries **93** of the 109 remaining type errors; the 54 test-protected files carry **14**; the last **2** are in `cleanupSchedulerService.ts`, which is commented out in `index.ts`.*
