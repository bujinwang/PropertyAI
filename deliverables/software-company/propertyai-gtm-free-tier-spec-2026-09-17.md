# PropertyAI — GTM Spec: Free Tier, Published Pricing & Self-Serve Checkout, Import, Bulk SMS

**Owner:** 许清楚 (Xu) · Product Manager
**Date:** 2026-09-17
**Status:** Working spec — executable. Grounds every claim in code verified 2026-09-17.
**Verification anchor:** `HEAD = 6bd66e54` ("chore(backend): delete dead services, utils, types, nlp/cv/mocks (81)"), working tree clean.

> **Read this before the tables.** Two of the four items in the user's plan are **not** what the user's own summary says they are. Item 1 ("produce free tier") is described as "纯打包，模块都已存在，杠杆最高". **This is false: there is no billing layer at all, and that is schema + middleware work.** Item 5 ("bulk SMS") is described as "the only expensive one". **It is not the only one — item 1 is more expensive.** Full reconciliation in §7.
>
> A third finding, not in the original brief, is material enough to change the sequence: **35 route mounts in `app.ts` are unreachable behind a 404 catch-all — including every Stripe checkout endpoint and the e-signature route.** Shipping checkout "by turning on billing" would ship a 404. §2.1 and §6.

---

## 1. Free-tier definition ("PropertyAI Free")

### 1.1 Limits

| Dimension | Limit | Rationale |
|---|---|---|
| Units (i.e. `Rental` rows) | **max 2** | Covers the 1–2 unit accidental landlord; below Hemlane's free tier's openness but honest |
| Active leases | **max 3** (`Lease.status = ACTIVE`) | Metered on **leases**, not units — matches how the market prices (TenantCloud caps leases at 10/30/60) and matches MagicDoor's occupancy-based model |
| Credit card | **not required** | Table stakes. Hemlane free-forever and MagicDoor free account both omit it |
| Self-serve | **100%** | No demo, no sales call |
| Support SLA | **none** (community/email only) | Keeps unit cost near zero; the documented reason Hemlane's free tier is affordable |
| Tenants | unlimited (bounded by the 3-lease cap) | Tenants are `User` rows reached via `Lease.tenantId`; they cost nothing marginal |

**Included on Free:** rent collection, maintenance triage, tenant portal, bulk SMS (§5 — deliberately ungated), online lease e-sign, listing syndication.
**Deliberately gated (paid only):** owner statements/distributions, trust accounting, 1099 e-filing, bank reconciliation, team seats (>1), screening, API keys, white-label, priority support.
**Expiry:** Free is a **funnel, not a home**. Cap at 3 leases. No free-forever at 5+ units. This is the market consensus — and TenantCloud's dead free plan is the cautionary tale (killed in the 2021 repricing, still marketed).

### 1.2 Monetization math — the take-rate floor, with arithmetic

Monetized by transaction fees rather than subscription, per the user's brief. **Who pays matters more than how much.**

**Rail costs (published, verified 2026-09-17):** Stripe ACH Direct Debit **0.8%, capped at $5.00/transaction**; Stripe cards **2.9% + $0.30**.

**Step 1 — allocated cost per free account** *(all inference; no cost data in repo)*

| Component | Monthly | Source of the estimate |
|---|---|---|
| A2P 10DLC campaign (sole-prop: $2/mo) + per-segment carrier fees at low volume | ~$2.50 | Twilio published fees (verified) |
| Share of one dedicated number + Messaging Service | ~$0.50 | inference |
| Hosting / Postgres / Redis allocation | ~$3.00 | inference |
| Support (email-only, no SLA) | ~$1.00 | inference |
| **Total allocated cost** | **~$7.00/mo = $84/yr** | |

**Step 2 — rent processed per free account.** 2 units × 2 active leases × $1,800/mo rent × 12 = **$43,200/yr**.

**Step 3 — the floor.** To break even: `$84 / $43,200` = **0.194% of rent processed**.

**Step 4 — the problem with "flat fee".** A flat fee (TurboTenant's $2.00/ACH) is **loss-making on ACH** above $625 rent: Stripe's 0.8% hits its $5.00 cap at $625, so on a $1,800 payment PA pays $5.00 and collects $2.00 → **−$3.00/payment**. A flat fee below the rail cap is structurally negative in a high-rent market. **Do not copy TurboTenant's flat fee.** Use a percentage with a floor and a cap.

**Step 5 — recommended fee and the resulting contribution.**

| Item | Value |
|---|---|
| **Tenant-paid ACH convenience fee** | **1.25%, min $2.50, max $12.00** |
| Rail cost on $1,800 rent | $5.00 (0.8% capped) |
| Fee collected on $1,800 | $22.50 |
| **Net per payment** | **$17.50** |
| Payments/yr (2 leases × 12) | 24 |
| **Annual gross fee margin** | **$420** |
| Less allocated cost | −$84 |
| **Contribution per free account** | **+$336/yr** |
| **Contribution margin** | **4.4× allocated cost** |

**Take-rate floor, stated plainly: the tenant-facing ACH fee must be ≥ 1.10% (0.80% rail + 0.30% spread) with a $2.50 minimum.** Below that, the free tier consumes cash.

**Card rail:** tenant pays 3.50% → on $1,800 = $63.00 collected, Stripe $52.50 → net **$10.50/payment**. Positive, thinner than ACH. ACH remains the default.

**Who pays: the tenant, mandatorily.** A landlord-paid fee on a $0 tier makes the free tier revenue-free — no set of numbers rescues it. Landlord-paid only works on paid tiers.

**Two rails required, and only one exists today:**
- Stripe — `stripe` is a declared dependency and `payment.service.ts` (274 LOC, reachable on the import graph) calls `stripe.paymentIntents`, `stripe.customers`, `stripe.subscriptions`, `stripe.invoices`, `stripe.billingPortal`. **But it exposes a PULL model (payments INTO PropertyAI), not a marketplace split.** There is **no** `application_fee_amount`, **no** `transfer_data`, **no** `on_behalf_of`, **no** Stripe Connect anywhere in the backend (grep: 0 matches). To take a fee while the landlord receives rent, Connect **must** be built. ⚠️ **And `/api/payments` is dead on BOTH HTTP surfaces (§2.3, §2.5)** — this module cannot serve a payment today.
- Plaid — `plaid.service.ts` exists and is reachable, but its only caller is `dataIngestion.service.ts` → `dataIngestion.controller.ts` → **both DEAD**. So Plaid is present on the import graph and non-functional in practice. Bank-feed reconciliation is paid-tier only.
- **`.env` holds literal placeholders, not real credentials** (verified, masked): `STRIPE_SECRET_KEY` len=22 (`your_st…`), `STRIPE_WEBHOOK_SECRET` len=26, `TWILIO_AUTH_TOKEN` len=34 (`your_tw…`), `SENDGRID_API_KEY` len=31 (`SG.plac…`), `PLAID_CLIENT_ID` len=20 (`your_pl…`). A real Stripe test key is ~107 chars. **No live Stripe account has ever been wired.** Also `backend/src/config/stripe.config.js` — the dead file the director cited, with its `products:{basic,premium,enterprise}` / `prices:{…}` and literal `'price_basic_monthly'` fallbacks — **was deleted in `6bd66e54`**. The finding was correct; the file no longer exists. Nothing replaced it.

### 1.3 Entitlement enforcement — does not exist

| Required | Status at `6bd66e54` |
|---|---|
| `Subscription` / `Plan` / `Price` / `Tier` / `Account` / `Invoice` model | **0 matches** in `prisma/schema.prisma` (94 models) |
| `plan` / `tier` / `subscription*` / `billing*` / `trial*` / `unitLimit` field on `User` | **0 matches** |
| Middleware counting units/leases against a limit | **none** |
| `subscription\|billing\|checkout\|priceId\|planId\|trial\|signup\|onboard` across `backend/src` | **0 files** |
| Usage metering against `Lease` | **none** |
| Transaction-fee billing path | **none** |

There is **no billing scaffolding to build on.** This is a from-scratch schema + middleware + webhook + reconciliation build.

---

## 2. Signup / checkout flow

### 2.1 ⛔ Hard preconditions (both are release blockers)

**P0-A — privilege escalation on `POST /api/auth/register`.** Verified unauth at HEAD:
- `backend/src/middleware/validation.ts:5` — `validateRegistration` destructures only `{email, password, firstName, lastName}`. **It never inspects `role`.**
- `backend/src/controllers/authController.ts:13,24` — destructures `role` **from `req.body`** and writes it into `prisma.user.create({data:{...,role}})`.
- `backend/src/routes/authRoutes.ts:11` — `router.post('/register', validateRegistration, authController.register)`. **No rate limiter** (`loginRateLimiter` guards only `/login`).
- `UserRole = {ADMIN, PROPERTY_MANAGER, TENANT, USER, VENDOR, OWNER}`.
- Live confirmation: `POST /api/auth/register` with `{}` returns the validator's `400 "Please provide a valid email address"` — proving the route is mounted, unauthenticated, and reachable from the open internet. (The `role:"ADMIN"` write itself was confirmed by reading the controller; no account was created during verification — an existing-email probe failed on the unique constraint and created nothing.)

⇒ Anyone on the internet can self-register as `ADMIN`. The plan puts a **public, no-card signup at the front of the funnel**. **Fix before any launch.** A separate engineer is dispatched; treat as **fixed and verified** before §2.2 ships.

**Fix status observed 2026-09-17 (uncommitted working tree, `HEAD` still `6bd66e54`).** The dispatched fix adds a `PUBLIC_SIGNUP_ROLES` allowlist in `authController.ts` (defence-in-depth, re-checked in the controller) and a mirrored allowlist in `validation.ts`, failing closed on unknown roles and passing `undefined` so the Prisma `TENANT` default applies. **This closes the `ADMIN` escalation — the critical finding.**

**Two residual gaps remain, and both bear on this GTM plan:**

| Residual | Evidence | Impact |
|---|---|---|
| `PROPERTY_MANAGER` and `VENDOR` are **still self-assignable** | The allowlist is `['TENANT','OWNER','PROPERTY_MANAGER','USER','VENDOR']` | `PROPERTY_MANAGER` is granted privileged access across the app: `checkRole(['ADMIN','PROPERTY_MANAGER'])` guards `vendor.routes.ts:11` (vendor management), `vendorPayment.routes.ts:10` (**vendor payout initiation**), `predictiveMaintenance.routes.ts:10`, `maintenanceRoutes.ts:28`, `imageRoutes.ts:14`, `aiRouting.routes.ts:10`. A self-serve signup can therefore self-assign a role that can initiate vendor payments. **Recommendation: narrow the public allowlist to `OWNER` only** (plus `TENANT` via explicit invite/lease flow). §2.2 step 3 assumes this |
| **No rate limiter on `/register`** | `authRoutes.ts:11` still `router.post('/register', validateRegistration, authController.register)` — unchanged | A public no-card signup endpoint with no rate limit is an account-farming and enumeration vector. Add `loginRateLimiter` (already imported in this file) or a dedicated limiter |

**P0-B — unauthenticated tenant PII leak.** `GET /api/tenants/search?q=a` → **HTTP 200** with real tenant names and emails, **no auth** (verified live). `backend/src/routes/tenantRoutes.ts:9` carries the comment `// Temporarily remove auth for testing`. On a free tier that invites anonymous traffic, this is a reportable data exposure. Fix before launch.

### 2.2 The flow, step by step, naming the live module each step touches

| # | Step | Surface | Live module touched (verified reachable) | Notes |
|---|---|---|---|---|
| 1 | Landing page → **"Start free — no card"** | marketing site (does not exist in repo; must be created) | — | No marketing site, no pricing page, no landing page anywhere in the repo |
| 2 | Email + password + name → account created | `POST /api/auth/register` | `authController.ts` ✅, `authRoutes.ts` ✅, `validation.ts` ✅ | **Requires P0-A fix.** No email verification on this path today |
| 3 | Role fixed server-side to `OWNER`; plan = `FREE` | new entitlement middleware | **does not exist** — must be built | This is the schema work |
| 4 | Guided onboarding: add first rental | `POST /api/rentals` | `rentalController.ts` ✅ | `Rental.slug` is `@unique` + required, and `managerId`/`ownerId`/`createdById` are required → **onboarding must synthesize slug + set all three to the new user** |
| 5 | Add tenant + lease | `POST /api/leases` | `leaseController.ts` ✅ | `Lease.rentalId` is **`@unique`** → one lease per rental, ever (§2.4) |
| 6 | Invite tenant → tenant portal | tenant app screens | `propertyapp` — `TenantDashboardScreen.tsx`, `RentPaymentScreen.tsx` etc. ✅ | The tenant portal **is the Expo app**, not a web portal. Tenant must install an app. MagicDoor's pitch is explicitly *"tenants need no app (SMS)"* — a direct competitive weakness |
| 7 | Tenant sets up autopay / pays rent | **checkout** | `paymentController.ts` (163 LOC, 15 methods incl. `createSubscription`, `createInvoice`, `getCustomerPortalSession`) — **reachable on the import graph but its HTTP mount is SHADOWED → 404** (§2.3) | ⛔ **Blocker** |
| 8 | PA takes its fee; landlord receives rent | new Stripe Connect path | **does not exist** — `application_fee_amount`/`transfer_data` grep: 0 | Must be built |
| 9 | Rent receipted as a `Transaction` | `POST /api/transactions` | `transactionController.ts` ✅ | `Transaction.leaseId` is a **required** `String` (§2.4) |
| 10 | Maintenance request filed | `POST /api/maintenance` | `maintenanceController.ts` ✅ | ⚠️ `createMaintenanceRequest` writes and returns — **it does not call `triageService`.** Triage only fires on *re*-triage from `contractor.service.ts:80` (vendor unassign). "AI triage" is **not** on the intake path |
| 11 | Reminders to tenant | `POST /api/reminders` | `reminderController.ts` ✅ — **verified live: `200 {"message":"Reminders sent successfully"}`** | Today this sends **email** (`rentCollection.service.ts` → `sendEmail`), not SMS |
| 12 | Upgrade prompt at the 3-lease cap | new entitlement middleware + Stripe Checkout | **does not exist** | |

### 2.3 ⛔ NEW BLOCKER — 35 route mounts are shadowed by a 404 catch-all

`backend/src/app.ts:105` mounts the central router: `app.use(routes)`.
`backend/src/routes/index.ts:148` ends the central router with a catch-all:
```js
router.use(`${API_PREFIX}/*`, (req, res) => { res.status(404).json({status:'error', message:'API endpoint not found'}); });
```
The catch-all **responds** and never calls `next()`. Therefore **every `app.use('/api/…')` registered after line 105 is unreachable** — and there are **35 of them**, at `app.ts:108–147`.

**Verified live against the running server (control pair proves the mechanism):**

| Route | Declared at | Expected | **Actual** |
|---|---|---|---|
| `POST /api/signatures/sign-document` | `app.ts:126` (after 105) | 200/401 | **404 central catch-all** |
| `POST /api/payments/payment-intents` | `app.ts:142` (after 105) | 401/400 | **404 central catch-all** |
| `POST /api/payments/customers` | `app.ts:142` | 401/400 | **404 central catch-all** |
| `POST /api/voice/transcribe` | `app.ts:110` | 400 | **404 central catch-all** |
| `GET /api/compliance/data-access/:id` | `app.ts:147` | 401 | **404 central catch-all** |
| `GET /api/translation/languages` | `app.ts:136` | 200 | **404 central catch-all** |
| **Control** `POST /api/reminders` (central, `index.ts:112`) | — | — | **200** ✅ |
| **Control** `POST /api/leases` (central, `index.ts:96`) | — | 401 | **401** ✅ |
| **Control** `GET /api/rentals/public` (central, `index.ts:79`) | — | 200 | **200** ✅ |
| **Control** `POST /api/vendor-payments/stripe-webhooks` (central, `index.ts:111`) | — | — | **200** ✅ |

**Consequences for this GTM plan, stated plainly:**
- **Published pricing + self-serve checkout cannot ship as-is.** The entire Stripe checkout surface (`paymentController.ts`, 15 methods, 163 LOC, mounted at `app.ts:142`) returns 404. **Item 2 is blocked by a routing bug, not by missing billing.**
- **E-sign leases are dead on the HTTP surface** (`app.ts:126`), despite the director's brief listing Lease e-sign as "live". The *module* is reachable on the import graph; the *endpoint* is not.
- 30 more mounts (appliances, business hours, emergency protocols, escalation policies, on-call, white-label, API keys, roles, documents, legal notices, tax documents, expense categorization, cash-flow forecasting, market data, compliance/GDPR, …) are equally invisible. `dead-set.js` reports this explicitly: `src/routes/index.ts -> ./paymentRoutes (binding "paymentRoutes" unused)`.
- **The only live Stripe webhook is `POST /api/vendor-payments/stripe-webhooks`** (central mount, returns 200). It reads `const event = req.body` and **never calls `stripe.webhooks.constructEvent`** → **no signature verification**. Our own verification POST with an empty body returned `200 {"received":true}`. `app.use(express.json())` also makes raw-body verification impossible without a route-scoped `express.raw()`. Any billing build must fix this.
- **Fix order:** move `app.use(routes)` to the **last** registration in `app.ts` (or remove/relocate the catch-all), then re-verify with the control-pair method above. This is likely a **one-line move** unlocking 35 mounts — the cheapest high-leverage change in the entire plan.

### 2.4 Schema constraints that bear directly on entitlement + meter design

| Constraint | Location | Why it matters |
|---|---|---|
| `Lease.rentalId String @unique` | `schema.prisma:280` | **One rental ⇒ at most one lease, ever.** No lease history, no renewals on the same unit. A PM product whose tenants renew **cannot model renewal** — and the free tier is **metered on leases**. |
| `Transaction.leaseId String` (**required**) | `schema.prisma` Transaction | A transaction **cannot be recorded without a lease**. Since the free tier is **monetized on transaction fees**, a fee cannot be booked against anything but a lease — including one-off fees, late fees, or a deposit-only transaction. |
| `Rental.slug String @unique` (required) | `schema.prisma:538` | Every imported/synthesized unit needs a unique slug |
| `Rental.managerId/ownerId/createdById` required `String` **backed by real relations** | `schema.prisma:566-568` | ~~"bare strings, no relation"~~ — **corrected, see §2.5.** `include: { Owner: true }` works today. Import must still set all three. There is no `Organization`/`Account`/`Team` model (**0 matches**) to hang multi-tenancy on |
| No `Property` / `Unit` / `Tenant` model | MEMORY.md + migration `20250804155618_rental` dropped the tables | A "unit" **is** a `Rental` row (`unitNumber`, `totalUnits`, address). A "tenant" **is** a `User` via `Lease.tenantId` |
| `Consent` model exists (`userId`, `type String`, `@@unique([userId,type])`) | `schema.prisma:128` | **Reusable as the SMS consent ledger** — the one piece of §5 that already fits |
| `TransactionType` has **no** platform-fee member | `schema.prisma:1134-1140` (`RENT_PAYMENT`, `SECURITY_DEPOSIT`, `MAINTENANCE_FEE`, `REFUND`, `OTHER`) | A platform fee has **no valid `type`**. Reinforces §2.5 D2: don't book fees as `Transaction` |

**Open questions — RESOLVED by the architect (高见远), with measured evidence, 2026-09-17. See §2.5.**
1. ~~Does `Lease.rentalId @unique` get relaxed?~~ **RESOLVED: yes — `@@index([rentalId, status])` + partial unique `WHERE status='ACTIVE'`. Meter counts `status='ACTIVE'`. Blast radius measured: ZERO breaking call sites.**
2. ~~Does `Transaction.leaseId` become nullable?~~ **RESOLVED: NO — do not touch `Transaction`.** Book platform fees on a **new dedicated `FirmFee` model** (architect's `TrustLedgerEntry` with `accountType=FIRM_FEE` is the alternative if the fee goes in the ledger). **Explicit decision, recorded so it is not re-opened:** the fee is **not** a `Transaction`, and `Transaction.leaseId` stays required. Rationale: `TransactionType` (`schema.prisma:1134-1140`) has **no platform-fee member**, `Transaction` has no debit/credit concept, and nullable `leaseId` would introduce null derefs into the payments path with `transpileOnly: true` and no CI to catch them.
3. ~~Is tenancy single-user or multi-user?~~ **RESOLVED (recommendation): single-user for v1 — meter by `User` via `managerId`/`createdById` relations, which exist today. Multi-user needs an `Account` model and is a separate workstream.** ⚠️ **Escalated to team-lead as a scope call — see §2.5 D3 and §6.**

### 2.5 Architect responses (measured) — and one correction to this spec

高见远 (Gao) answered all three, and **corrected an error in my §2.4.** Recording both, because the correction changes the scope.

**D3 CORRECTION — I was wrong; the relations exist.**
I wrote that `Rental.managerId/ownerId/createdById` are "bare `String`s with no relation". **False.** `schema.prisma:566-568`:

```prisma
Manager   User @relation("RentalManager",   fields: [managerId],   references: [id])
Owner     User @relation("RentalOwner",     fields: [ownerId],     references: [id])
CreatedBy User @relation("RentalCreatedBy", fields: [createdById], references: [id])
```
Backed by `User.rentalsManaged` / `rentalsOwned` / `rentalsCreated` (`schema.prisma:859-861`). The scalars are `String` because that is how Prisma writes a FK — **not** evidence of a missing relation. **Consequence: metering the free tier by `Rental`/`Lease` scoped to the owning `User` needs NO schema change and works today.** This makes the v1 free tier cheaper than my §2.4 implied.

**What remains true:** there is genuinely **no `Account`/`Organization`/`Team` model** (0 matches in 94). So the *account boundary* is still net-new.

**🔴 D3 is a scope decision for team-lead, and it is the largest hidden dependency in this plan.** If the free tier requires an `Account` boundary to enforce "2 units / 3 leases **per account**", then **billing is gated on a multi-tenancy retrofit** (`Account` + `AccountMember` + every authorization check + `slug` synthesis). That is not a free-tier feature.

| Option | Cost | Trade-off |
|---|---|---|
| **v1: scope "account" to `User`** (single-user tenancy) | **No schema change; shippable now** | Meter `Rental`/`Lease` by `managerId`/`createdById` via the relations above. Cannot support staff or a separate owner-portal login on the free tier. **Architect and I both recommend this for v1.** |
| **Multi-tenant `Account` model** | **Large — separate workstream** | Required for staff/owner-portal logins; **gates all billing work behind it**. Must not be smuggled in as part of the free tier. |

**D1 — RESOLVED: relax `Lease.rentalId`.** Decision: `@@index([rentalId, status])` with a **partial unique index `WHERE status='ACTIVE'`** — gives history *and* enforces one-active-lease in the DB. **Meter on `Lease WHERE status='ACTIVE'`, not raw `Lease` rows** — counting rows would meter *churn* (a renewal consuming entitlement) instead of *usage*.
**Blast radius: measured ZERO breaking sites.** My §2.4 called this a blocking design question; the architect swept it and found:
- `leaseController.ts:27` → `findUnique({ where: { id } })` — by `id`, unaffected.
- `rentalService.ts:637` → `lease.deleteMany({ where: { rentalId } })` — `deleteMany` is fine on a non-unique column.
- `tenantController.ts:54` → `include: { Lease: { where: { status: 'ACTIVE' } } }` — **already filters on `ACTIVE`**, i.e. the codebase already assumes the proposed model.
- No `findUnique`-by-`rentalId` exists anywhere (I re-verified independently: **0 hits**).

⚠️ **This softens §4.4's conflict, but does not remove it.** The `@unique` constraint only breaks trial-data conversion **until D1 lands**. Once `@@index` + partial unique is in, §4.4's trial-preservation is unblocked. **D1 is a hard prerequisite for §4.4 — not for the CSV import itself.**
Caveats accepted: `rentalService.ts:637` still correctly deletes all leases on rental-delete; and re-adding `@unique` later fails if duplicates exist, so the change is **one-way in practice**.

**D2 — RESOLVED, and it overrides my recommendation.** I recommended making `Transaction.leaseId` nullable. **The architect pushed back and he is right** — I verified his measurements independently:
- `prisma.transaction.` = **4 files / 12 live call sites** (`transactionController.ts` ×5, `payment.service.ts` ×5, `expenseCategorization.service.ts` ×1, `cashFlowForecasting.service.ts` ×1).
- Nullable `leaseId` makes the traversals **possible null derefs**: `payment.service.ts:102-118` (`Transaction → Lease → Rental`, incl. an `include: { Lease: {...} }`), and `tenantIssuePrediction.service.ts:64` (`tenant.Lease.flatMap(l => l.Transaction)`).
- **`tsconfig` sets `"ts-node": { "transpileOnly": true }` and there is no CI** ⇒ the compiler would **not** catch those null derefs. Introducing them into the *payments* path with no static safety net is exactly the wrong trade.
- **And it is a category error:** `Transaction` is a lease-scoped, approval-workflow record (`approvedById`), and `TransactionType = {RENT_PAYMENT, SECURITY_DEPOSIT, MAINTENANCE_FEE, REFUND, OTHER}` has **no platform-fee member** (verified, `schema.prisma:1134`). A firm fee is not a lease payment.

**Revised recommendation — FINAL, per §2.5 D2: book the fee on a NEW dedicated `FirmFee` model** (architect's alternative: a `TrustLedgerEntry` row with `accountType=FIRM_FEE`). The model carries its own `feeType`, `basis` (e.g. 1.25% of rent), `amount`, and a `leaseId` that is nullable **by design** rather than by weakening an existing constraint. ⇒ **Zero change to `Transaction`. `Transaction.leaseId` stays required — this is a recorded decision, not an open question. Do not re-open it.** Zero null-deref risk in the payments path. This changes §1.2's build scope: the fee ledger is a **new model**, not a field change.
**Rejected:** a synthetic "account-level" lease — it would pollute the lease meter, i.e. charge users for our own records.

**D1+D2 combined effect on §1.2 and §6.** The fee rail is now **one new model + Stripe Connect**, not "relax `Transaction`". Item 2 in §6 stays **L** but is *lower-risk* than I scoped it.

**Also confirmed by the architect (independently reproduced, and I re-verified):** `/api/payments` is dead on **both** surfaces, by **two different mechanisms** — worth stating precisely, because the fix differs:
- `paymentRoutes.ts` (no dot) is imported at `routes/index.ts:31` and **never `router.use`'d** → TypeScript **elides the import entirely** (verified: the emitted `routes/index.ts` contains **no** `require('./paymentRoutes')`). Dead by **never-mounting + elision**.
- `payment.routes.ts` (with dot) **is** `require`d (verified: emitted `app.ts` **does** contain `require('./routes/payment.routes')`) and mounted at `app.ts:142` — but that line sits **after** `app.use(routes)` at line 105 ⇒ **shadowed by the catch-all**. Dead by **ordering**.

### 2.6 ⚠️ The two payment files are indistinguishable — and mounting them is a revival task, not a one-liner

The architect found this and **it is worse than either of us first stated.** Both files are imported under the **identical binding name** `paymentRoutes` (`routes/index.ts:31` ← `./paymentRoutes`; `app.ts:43` ← `./routes/payment.routes`). Verified — same name, different file.

| | `paymentRoutes.ts` (**no dot**) | `payment.routes.ts` (**with dot**) |
|---|---|---|
| Imported at | `routes/index.ts:31` | `app.ts:43` |
| Binding name | `paymentRoutes` | `paymentRoutes` ← **identical** |
| Serves | **Stripe billing** — 14 routes: `/payment-intents`, `/subscriptions`, `/webhooks`, `/customers`, `/invoices`, `/refunds`, `/calculate-fees`, `/setup-intents`, `/customer-portal-session`, … | **Approvals** — 6 routes: `/transactions/pending`, `/transactions/:id/approve\|reject`, `/vendor-payments/pending`, `/vendor-payments/:id/approve\|reject` |
| Dead by | never-mounted **+ elision** | **ordering only** |

**Path sets are provably disjoint** (I extracted both lists and compared: 14 vs 6, **zero overlap**). ⇒ Mounting both is additive; no handler collision.

**🔴 Consequence 1 — the one-line reorder fixes only the with-dot file.** The no-dot file needs an actual `router.use` in `routes/index.ts`, *and* the import must be made **live**, not merely annotated — it is currently **elided**, so no `require` is emitted at all.

**🔴 Consequence 2 — my own earlier probes systematically missed half the module.** *(Self-correction.)* I probed `POST /api/payments/payment-intents` and `POST /api/payments/customers` — **both no-dot paths.** I never probed the with-dot family. Re-probed systematically; **both families are 404, for the two different reasons above:**

| Probe | Family | Result |
|---|---|---|
| `GET /api/payments/transactions/pending` | with-dot (approvals) | **404** (ordering) |
| `GET /api/payments/vendor-payments/pending` | with-dot (approvals) | **404** (ordering) |
| `POST /api/payments/payment-intents` | no-dot (Stripe) | **404** (never-mounted) |
| `POST /api/payments/customers` | no-dot (Stripe) | **404** (never-mounted) |
| `POST /api/payments/subscriptions` | no-dot (Stripe) | **404** (never-mounted) |

⇒ **Post-fix verification must cover both path families**, or it passes while missing half the module.

**🔴 Consequence 3 — mounting `paymentRoutes.ts` exposes latent runtime bugs. Expect 500s, not 200s.** Verified: the service defines **all 15** methods the controller calls (**zero missing** — so it loads), but the **call shapes do not line up**:

| Call site | Controller passes | Service expects | Result |
|---|---|---|---|
| `paymentController.ts:63` | `createRefund(req.body)` | `createRefund(paymentIntentId: string)` | object where a string is required |
| `paymentController.ts:31-33` | `createSubscription(customerId, priceId)` | `createSubscription(customerId, items: Stripe.SubscriptionCreateParams.Item[])` | string where an array is required |
| `paymentController.ts:44` | `processPaymentWebhook(req.body, signature)` | `processPaymentWebhook(requestBody: Buffer, sigHeader)` | needs a **raw** body — **`app.use(express.json())` at `app.ts:81` has already consumed it** |

⇒ **The transaction-fee rail in §1.2/§6 item 2 is a REVIVAL task, not "one line away."** Scope it as such. It is still **L** — my §6 estimate holds — but the *reason* changes: not just "Connect doesn't exist" but "the module that would carry it has three broken call shapes and no raw-body handler."

**⚠️ The trap, worth a code comment:** both files are imported as the identically-named binding `paymentRoutes`. **An editor can fix the wrong file and the shadowing bug masks the mistake** — the route stays 404 either way, so the change looks like it did nothing. Any fix PR must name the file by path, not binding.

**Decision taken by the architect, and I agree:** scope the mount-order fix to that **alone** (minimal, reviewable); split the `paymentRoutes.ts` wiring + Stripe signature repair into a **separate P1 task**. Bundling them would hide a Stripe-billing revival inside a one-line "fix."

⇒ Two files, near-identical names, both dead, **different causes**, and **one is a trap**. `payment.service.ts` — the module a 1.25% rent-payment fee would ride — is orphaned on the HTTP surface. **The one-line mount fix resolves the with-dot file only; the no-dot file needs a real `router.use` plus three call-shape repairs.**

---

## 3. Published pricing table

### 3.1 ⚠️ The benchmark moved — reconcile before copying

The director's brief cites Rentec at **"$2.00/unit, $50 min"** and the carried-over doc cites a **live slider showing Pro $55 / PM $65**. **Fetched live 2026-09-17, Rentec's pricing page now reads:**

| Rentec edition (live 2026-09-17) | Price | Scope |
|---|---|---|
| **Rentec Starter** | **$25/mo flat** | up to **10 properties & tenants** |
| Rentec Pro | $50/mo | landlords/investors |
| Rentec PM | $50/mo | trust accounting + owner portal |
| Slider range | **1 → 2,500+ units**, "no sales call required" | contact sales above 2,500 |
| Trial | **two weeks free**, free setup & onboarding | |
| Incoming ACH | **1 free per active property/month** (Pro & PM); excess **$0.50** ea; **$2.00** on Starter | |
| Outgoing ACH | **$2.00** Starter / **$0.50** Pro & PM | |
| Cards | **3.50%** Starter / **2.95%** Pro & PM — tenant- **or** manager-paid | |
| Screening | $14.95–29.45 Starter / **$10–18** Pro & PM | |

**Carried-over vs current:** the "$2.00/unit + $50 minimum" and "$55/$65" figures are **stale**. Current list is **flat $25 up to 10 properties / $50 entry**. Mark the old numbers as superseded. This matters because we are being asked to *match* this benchmark — matching a stale number means overpricing.

### 3.2 Competitive benchmark (all verified 2026-09-17 unless marked carried-over)

| Competitor | Entry | Model | Free tier | Trial | ACH fee | Card |
|---|---|---|---|---|---|---|
| **TurboTenant** ← *the real analogue* | **$12.42/mo** (annual, Essentials) | flat, unlimited rentals | **Free plan: unlimited rentals, rent collection, maintenance** | free plan permanent | **$2.00/ACH, paid by tenant** | — |
| **TenantCloud** | **$18/mo** ($15 annual) | unlimited units, **lease caps 10/30/60** | **none** (killed 2021) | 14-day, no card | **$1.95** starter, tenant-paid | ~3.5%+30¢ |
| **Hemlane** | **free forever** → **$2/unit + $28** | per-unit + platform fee | **yes — but no rent collection** | 14-day | **$0** | 3% |
| **Rentec** | **$25 flat (≤10)** / $50 | flat entry, then slider 1→2,500 | none | **2 weeks, own data** | 1 free/property/mo, then $0.50 | 3.50%/2.95% |
| **MagicDoor** | **$20/mo ≤10 leases** | **$2.50 per active lease** | free account, no card | free account | **$2.49/txn** | — |
| **PropertyAI (proposed)** | **$0 free** → **$25 flat (≤10)** | per-active-lease + floor | **yes, 3-lease cap** | n/a (free tier replaces trial) ***inference*** | **1.25% min $2.50, tenant-paid** | 3.50% |

**🔴 Critical competitive finding.** The user's item-1 model — *"free tier, no card, monetized via transaction fees rather than subscription"* — is **exactly TurboTenant's model, already at scale, at a documented $2.00/ACH tenant-paid fee on a free-unlimited-rentals plan.** TurboTenant is not on the director's four-competitor list. **The free tier is not an uncontested space; it is an occupied one, and the incumbent has a *looser* free plan (unlimited rentals vs our 3 leases).** Two implications:
1. Our free tier **cannot win on generosity**. It must win on capability: TurboTenant's free plan has **no e-sign, no accounting, no SMS, and no bulk comms** (lease agreements are "a la carte"; full accounting needs a separate REI Hub subscription).
2. **Do not copy TurboTenant's $2.00 flat ACH fee** — §1.2 shows it is loss-making above $625 rent. Copy the *model* (free + tenant-paid), price the *mechanism* as a percentage.

### 3.3 Recommended published price list

| Tier | Units / leases | **Monthly** | Annual (2 months free) | Anchored against |
|---|---|---|---|---|
| **PropertyAI Free** | 1–2 units, **≤3 leases** | **$0** + tenant-paid tx fee (1.25%, min $2.50) | — | Hemlane free, MagicDoor free, TurboTenant free |
| **Starter** | **≤10 leases** | **$25 flat** | $250 | **Exact match to Rentec Starter** — removes the floor trap at the funnel mouth |
| **Growth** | 11–75 leases | **$2.00 / active lease / mo, $45 floor** | $450 | Beats TenantCloud Growth $35 only above ~18 leases; below that TC wins on price → *don't fight there* |
| **Pro (PM)** | 76–300 leases | **$2.25 / active lease / mo, $149 floor** | $1,490 | **Head-to-head with Rentec PM $50 + trust accounting**; must ship trust accounting + owner statements to justify (not yet built — `trustAccount` = 0 matches) |
| **Scale** | 300–2,500 leases | **$1.75 / active lease / mo, $399 floor** | $3,990 | Above 2,500 → contact sales, mirroring Rentec |
| **Enterprise** | 2,500+ | custom | custom | |

**Rules attached to the table:**
- **Per *active lease*, not per unit.** Bills occupancy, not doors — vacancy months are free. This is MagicDoor's structural advantage and it also removes the "I'm paying for units I can't rent" objection a per-unit floor creates. It also aligns with the free-tier meter (leases), so one metering implementation serves both.
- **No unit minimums, no setup fee, no contract, cancel anytime.** All four competitors advertise this; not matching it is a silent disqualifier.
- **The monthly floor is real and published.** A $45 floor at 11 leases is $4.09/lease — visible, not hidden.
- **No downgrade from Pro→Starter** (mirrors Rentec, protects expansion).

### 3.4 Recommendation on the live unit-count slider: **YES — copy it, and beat it**

**Verdict: adopt.** Justification is in the user's own framing — *"你不可能一边讲'AppFolio 的透明替代品'，一边比 TenantCloud 还不透明."* But note the benchmark is now **stronger than the brief assumed**: Rentec's current page carries a slider spanning **1 → 2,500+ units** with the copy *"See your exact price in seconds — no sales call required"* and *"we really dislike the practice that most software providers require of requiring a lengthy sales call just to get to their pricing."* Rentec has **productised price transparency as a positioning weapon**. Matching it means:

**Build spec for the slider (this is a front-end + pricing-rules task, not a billing task):**
1. **Range 1 → 2,500 units** on a draggable control, defaulting to 1. Above 2,500 → "contact us".
2. **Instant quote**, client-side computed from a single published rate card (no email gate, no form, no phone capture) — the quote must render **before** any input field is focused.
3. **Show the floor explicitly.** At 1 unit the page must read `$25/mo — Starter floor applies`, not `$2.00`. Hiding the floor is the exact opacity we are attacking.
4. **Show the transaction fees on the same screen** (ACH %, card %, minimums, who pays) — this is what Rentec does on its `/pricing-transparency` page and it is the strongest single trust signal in the set.
5. **Show the tier boundary live** ("at 11 leases you move to Growth — +$1.90/mo") so the upsell is never a surprise. TenantCloud's "price increases that don't add value" and "trial→paid upsell surprises" are the #1 complaint themes; pre-empting that is cheap differentiation.
6. **Persist the quote into checkout** — the number on the slider is the number charged. Requires the entitlement/plan model (§1.3) to exist.

**What the slider does *not* fix:** it publishes a price for a product that, today, has **no metering to enforce it and no checkout to bill it**. §3.4 is only shippable after §6 items 1–3.

---

## 4. Import / migration spec

**Current state: zero.** `csvImport`, `csv_import`, `importData`, `dataImport`, `migrationService` → **0 matches** across `backend/src`, `dashboard/src`, `propertyapp/src`. No CSV/xlsx parsing library in `backend/package.json` or `dashboard/package.json` (`multer` is present for uploads — file intake exists, parsing does not). Competitor gap: Rentec ✅, MagicDoor ✅ (3–7 days DIFM), TenantCloud ◐, **PropertyAI ○**.

### 4.1 Onboarding modes

| Mode | Trigger | Behaviour |
|---|---|---|
| **A. Empty start** | new account, no file | Standard onboarding |
| **B. CSV import** | user uploads CSV/template | Column mapper, dry-run preview, commit |
| **C. Guided incumbent switch** | user picks Buildium / AppFolio / TenantCloud | Pre-seeded field map (§4.2), auto-detect headers, dry-run, commit |
| **D. "Trial with your own data"** | see §4.4 | **The Rentec move.** Does not exist and is the highest-value item here |

### 4.2 Canonical CSV schema

Because there is **no `Property`, `Unit`, or `Tenant` model**, the target entities are `Rental`, `Lease`, `User`, `Transaction`, `MaintenanceRequest`. Ship **four** separate files — one entity each — rather than one denormalized sheet, because the repo's relations are strict (`Lease.rentalId` unique, `Transaction.leaseId` required). Reject rows with clear errors rather than silently coercing.

**File 1 — `rentals.csv` → `Rental`**

| Column | Type | Required | Maps to | Notes |
|---|---|---|---|---|
| `external_id` | string | ✅ | *(kept in a mapping table)* | Idempotency key for re-imports |
| `address` | string | ✅ | `Rental.address` | |
| `city` / `state` / `zip_code` | string | ✅ / ✅ / ✅ | `Rental.city/state/zipCode` | |
| `unit_number` | string | — | `Rental.unitNumber` | One row **per unit** — a 4-plex is 4 rows |
| `property_type` | enum | ✅ | `Rental.propertyType` | Map to `APARTMENT\|HOUSE\|CONDO\|TOWNHOUSE\|COMMERCIAL\|INDUSTRIAL\|OTHER` |
| `bedrooms` / `bathrooms` | int / float | — | `Rental.bedrooms/bathrooms` | |
| `rent` | float | ✅ | `Rental.rent` | |
| `deposit` | float | — | `Rental.deposit` | |
| `size` | float | — | `Rental.size` | |
| `year_built` | int | — | `Rental.yearBuilt` | |
| `title` | string | ✅ | `Rental.title` | Default to `address` if absent |
| `slug` | *(not accepted)* | — | **generated** | `@unique` — server generates from address + unit |
| `manager_id`/`owner_id`/`created_by_id` | *(not accepted)* | — | **set to importing user** | All three required |

**File 2 — `leases.csv` → `Lease`**

| Column | Required | Maps to | Notes |
|---|---|---|---|
| `external_id` | ✅ | mapping table | |
| `rental_external_id` | ✅ | resolves to `Lease.rentalId` | **`@unique` — a second lease on the same rental CANNOT import.** See §4.3 |
| `tenant_email` | ✅ | resolves/creates `User`, then `Lease.tenantId` | Tenants are `User` rows |
| `start_date` / `end_date` | ✅ / ✅ | `Lease.startDate/endDate` | |
| `rent_amount` | ✅ | `Lease.rentAmount` | |
| `security_deposit` | ✅ | `Lease.securityDeposit` | |
| `status` | — | `Lease.status` | Map to `PENDING\|ACTIVE\|EXPIRED\|TERMINATED`; default `ACTIVE` |
| `renewal_date` | — | `Lease.renewalDate` | Drives `rentCollection.service.ts` |
| `signed_date` | — | `Lease.signedDate` | |

**File 3 — `tenants.csv` → `User`** — `email` ✅ (`@unique`), `first_name` ✅, `last_name` ✅, `phone`, `role` **forced to `TENANT`** (never trusted from file — same class of bug as P0-A).

**File 4 — `transactions.csv` → `Transaction`** — `lease_external_id` ✅ *(resolves to the **required** `Transaction.leaseId`)*, `amount` ✅, `type` ✅ (`RENT_PAYMENT|SECURITY_DEPOSIT|MAINTENANCE_FEE|REFUND|OTHER`), `status`, `transaction_date`, `description`.

**File 5 (optional) — `maintenance_requests.csv` → `MaintenanceRequest`** — `rental_external_id` ✅, `requested_by_email` ✅, `title` ✅, `description` ✅, `status`, `priority` (`LOW|MEDIUM|HIGH|EMERGENCY`), `created_at`.

### 4.3 Field mapping from incumbents

Incumbents use different entity names. The trap is that **their `Unit` is our `Rental`**, and **their `Property` does not exist here** — a Buildium export's Property+Unit hierarchy must be **flattened into one `Rental` row per unit**, inheriting the property's address fields.

| Incumbent field | Incumbent entity | → PropertyAI | Trap |
|---|---|---|---|
| Buildium `Property.Address` + `Unit.UnitNumber` | Property+Unit | one `Rental` per **Unit**, address inherited | **Flattening is mandatory**; `totalUnits` is a `Rental` *field*, not a parent |
| Buildium `Tenant.Id` | Tenant | `User.id` via `Lease.tenantId` | No `Tenant` model |
| AppFolio `Property` / `Unit` | Property / Unit | same flattening | AppFolio keys on `Property ID` — carry as `external_id` |
| AppFolio `Tenant` | Tenant | `User` | |
| TenantCloud `Rental` | Rental | `Rental` | Closest match of the three; expect near-1:1 |
| TenantCloud `Lease` | Lease | `Lease` | **TC caps leases 10/30/60** — imports may exceed our tier; must prompt for tier, not silently truncate |
| Any `Payment` / `Transaction` | Payment | `Transaction` | **`leaseId` is required** — orphan payments must be rejected or force-attached |
| Any `Property` row | Property | **dropped** (address copied down) | Do not create a `Property` model in response. MEMORY.md: *"Never 'fix' this by growing the schema."* |
| `Owner` / `Manager` | Owner | `Rental.ownerId` / `managerId` (bare strings) | Create `User` rows (`OWNER` / `PROPERTY_MANAGER`) first |

### 4.4 "Trial-period data must survive conversion" — the mechanics

This is the user's *"Rentec 最被低估的一招"* and it is correct to prioritise it. **But it is a data-architecture requirement, not a UX toggle**, and it is incompatible with a common shortcut:

| ❌ The shortcut | ✅ The correct design | Why |
|---|---|---|
| Separate "trial sandbox" DB/schema; wipe + re-provision on conversion | **One tenancy. Real rows from minute one.** Conversion flips `plan: FREE→STARTER` and `trialEndsAt: NULL` | A sandbox needs a full export/import and a re-key of every FK (`Lease.rentalId`, `Transaction.leaseId`) — brittle, and any re-key bug is a *data-loss* bug on the user's own rent ledger |
| Trial rows tagged `isTrial: true`, filtered out on conversion | **No trial-specific rows or flags anywhere.** Paid and trial rows are identical rows | A flag means every query, report, and export must know about it — 94 models' worth of leak surface |
| Re-ask the user to re-enter data | **Zero re-entry.** Same `User`, same `Rental` ids, same `Lease` ids | This *is* the feature. Rentec's advantage is not the trial, it is that **the work survives** |
| Hard delete on trial expiry | **Freeze, never delete.** Exceed-cap → read-only + upgrade prompt | Deleting a landlord's rent records destroys the asset the trial existed to create |

**Prerequisites (currently missing):** an entitlement model with `plan` + `trialEndsAt` + `unitLimit`/`leaseLimit` (§1.3); an override-free metering read (`COUNT(*) WHERE status='ACTIVE'`); and the FK stability that the **`Lease.rentalId @unique` constraint threatens** — if import creates a lease and conversion creates a second one on the same unit, the unique constraint **will reject the conversion**. **§2.5 D1 resolves this:** land the `@@index([rentalId, status])` + partial unique `WHERE status='ACTIVE'` migration **before** building §4.4. Blast radius measured at **zero breaking call sites**, so this is a cheap unblock — but it is a **hard prerequisite**, and the change is **one-way** (re-adding `@unique` later fails if duplicates exist).

### 4.5 Import build scope

| Component | Effort | Notes |
|---|---|---|
| Upload endpoint + storage | **Low** | `multer` already a dependency |
| CSV parser | **Low** | Add `csv-parse`; none present |
| Header auto-detect + mapper UI | **Medium** | The actual product |
| Dry-run preview + per-row error report | **Medium** | Non-negotiable. Silent coercion in a rent ledger is unacceptable |
| Idempotent commit + re-import | **Medium** | `external_id` mapping table; re-import must update, not duplicate |
| Trial-data-preservation | **High — depends on §1.3 + §2.4** | See §4.4 |
| Three incumbent profiles | **Low each** | Mostly field-name tables |

---

## 5. Bulk SMS — scope, tier placement, compliance

### 5.1 What exists today: one 13-line send-only shim

```ts
// backend/src/services/smsService.ts — 13 lines, entire file
import twilio from 'twilio';
const client = twilio(accountSid, authToken);
export const sendSms = async (to: string, body: string) => {
  await client.messages.create({ body, from: process.env.TWILIO_PHONE_NUMBER, to });
};
```
Callers (all **one-to-one, event-triggered**, none bulk): `notificationService.ts`, `legalNotice.service.ts`, `routingService.ts`, `reminderService.ts`, `triage.service.ts:78` (vendor work-order alert). `communication.service.ts` holds a second Twilio client.

**Missing entirely (verified 0 matches):** `bulkSms`, `massText`, `bulkMessage`. **No opt-out handling. No consent check. No template system. No scheduling. No delivery-status handling. No per-tenant SMS preference. No quiet-hours logic.**

### 5.2 ⚠️ The day-one compliance trap

**The existing one-to-one SMS path is already non-compliant.** `reminderService` / `notificationService` send to `tenant.phone` with **no consent record checked and no opt-out mechanism**. Under the TCPA, **statutory damages are $500–$1,500 per message**. At bulk volume this is the single largest liability in the entire plan — larger than any build cost, because it is uncapped per-message and supports class actions.

**Regulatory state, verified 2026-09-17:**
- **The FCC's "one-to-one consent" rule was VACATED** by the Eleventh Circuit (*Insurance Marketing Coalition v. FCC*, 24 Jan 2025). The rule (and its 27 Jan 2025 compliance deadline) is dead. **Do not build for 1:1 consent** — but **do not read this as a relaxation of consent itself**: prior express consent is still required, and the rest of the Dec-2023 order (revocation honoured "in any reasonable manner", within 10 business days) stands.
- **A2P 10DLC registration is mandatory** for long-code SMS to US numbers. Registration is **per brand + per campaign**, and **one campaign per use case** — so rent reminders, maintenance updates, and marketing each need their own campaign.
- **Canada (CASL/CRTC)** requires **express or implied consent** for commercial electronic messages to Canadian recipients, plus a working unsubscribe. Different regime, same build (consent ledger + opt-out), different disclosure text.

### 5.3 What to build

| Component | Detail | Priority |
|---|---|---|
| **Consent ledger** | **Reuse the existing `Consent` model** (`userId`, `type String`, `@@unique([userId,type])`) — store `type='sms_transactional'` / `'sms_marketing'` with a timestamp. The one piece of §5 that already fits the schema | **P0** |
| **Consent capture at lease signing** | Lease e-sign flow collects express consent + phone number, with the disclosure text stored and versioned | **P0** |
| **Opt-out engine** | Inbound webhook on STOP/UNSUBSCRIBE/CANCEL/END/QUIT → permanent suppression per number; START → resubscribe. Honour "in any reasonable manner", target **immediate** | **P0** |
| **Quiet hours** | Block sends 21:00–08:00 recipient-local. TCPA exposure is concentrated in early/late sends | **P0** |
| **Bulk send API + queue** | `POST /api/sms/bulk` taking `{segment, recipientSelector, templateId}` → queue → throttled dispatch. **Must be mounted inside the central router** or it inherits §2.3 | **P1** |
| **Templates + merge fields** | `{{tenant.firstName}}`, `{{lease.rentAmount}}`, `{{rental.address}}`, `{{dueDate}}`. Pre-approved per campaign use case | **P1** |
| **Delivery-status handling** | Twilio status callbacks → `Message`/`Notification` rows; surface failures | **P1** |
| **A2P 10DLC registration workflow** | In-product prompts to collect EIN/brand data; we register on the customer's behalf, or each customer registers as its own brand | **P1** |
| **Scheduled + sequence sends** | "3 days before due", "day of", "day+3 late" — wires into `rentCollection.service.ts` | **P2** |
| **Segment targeting UI** | Send to "all tenants", "this property", "overdue only" | **P2** |

### 5.4 Tier placement

**Every tier, standard — T1 and T2 both. Do not gate it.** This is a deliberate call against the usual upsell instinct, for four reasons:
1. The user's own rationale is decisive: *it is the channel tenants actually answer.* A gated SMS channel means the free tier's rent reminders **do not arrive**, and a free tier whose core loop is broken converts nothing.
2. It is a documented competitor weakness: Rentec has **"Tenant Email & SMS Notifications"** listed across all editions; **TenantCloud has no tenant SMS reminders at all** (a recurring Capterra complaint); MagicDoor is SMS-first. Gating SMS hands MagicDoor the free tier.
3. It is a **cost**, not a feature — the true unit cost is the A2P campaign and per-segment fees, both covered by §1.2's fee arithmetic ($420 gross margin vs ~$2.50/mo SMS cost). Gating a ~$2.50 cost line to protect a feature competitors give away is bad economics.
4. Free-tier limits already cap abuse: 3 leases = at most ~3 tenants = bounded volume.

**Fair-use guard (needed, because it is not free):** cap free-tier outbound SMS at **200 segments/tenant/month**, and **pass through per-segment carrier cost above the cap**. Publish the cap. This preserves "SMS on every tier" while keeping the free tier contribution-positive.

---

## 6. Sequenced implementation list

**Honest scope. Item 1 is not cheap.**

| # | Item | Size | Blocks | Notes |
|---|---|---|---|---|
| **0a** | **Fix `POST /api/auth/register` role escalation + add rate limiter** | **S** | **Everything public** | §2.1 P0-A. **Partially landed** (uncommitted, 2026-09-17): `ADMIN` escalation closed via allowlist. **Two residual gaps: `PROPERTY_MANAGER`/`VENDOR` still self-assignable (narrow to `OWNER`), and `/register` still has no rate limiter.** Close both. **Hard precondition.** |
| **0b** | **Fix unauthenticated `GET /api/tenants/search`** | **S** | **Everything public** | §2.1 P0-B. Restore `authMiddleware.protect`. Verified leaking live. |
| **0c** | **Fix the route-shadowing bug** — move `app.use(routes)` after all `/api/*` mounts, or relocate the `router.use('/api/*')` catch-all | **S (likely one-line move)** | Checkout, e-sign, 35 mounts | §2.3. **Highest leverage-to-effort ratio in the plan.** Unlocks Stripe checkout + e-sign + 30 other mounts. Re-verify with the control-pair method. |
| **0d** | **Verify Stripe webhook signature** + add `express.raw()` to the webhook route | **S** | Billing integrity | §2.3. Currently accepts any body → `200`. |
| **1** | **Billing & entitlement foundation** — `Plan`/`Subscription` models; `plan`/`trialEndsAt`/`leaseLimit` on `User`; entitlement-check middleware; usage metering (`COUNT Lease WHERE status='ACTIVE'`); **plus the new dedicated `FirmFee` model (§2.5 D2)** | **L** | Items 2, 3, 4; §1.3 | **Zero of this exists.** Schema + migration + middleware + tests. ⚠️ **Two sub-decisions are now resolved and de-risk this item:** D1 (`Lease.rentalId` → `@@index` + partial unique; **measured ZERO breaking call sites**) and D2 (**do NOT touch `Transaction`** — the fee is a new **`FirmFee`** model, and `Transaction.leaseId` stays required; this protects the payments path from null derefs the compiler cannot catch). ⚠️ **D3 is an open scope call for team-lead:** single-user metering (no schema change, **recommended**) vs multi-tenant `Account` (**gates this item behind a separate retrofit**). |
| **2** | **Stripe Connect + transaction-fee rail** — connected accounts, `application_fee_amount`, ACH (0.8% cap $5) + card (2.9%+30¢), tenant-paid fee at 1.25%/min $2.50, **fee written to `FirmFee`** | **L** | Free-tier revenue | **`application_fee_amount`/`transfer_data` currently 0 matches.** Plus live Stripe credentials (`.env` holds placeholders — §1.2). Reduced risk by D2 (§2.5): no `Transaction` migration needed. ⚠️ **Its HTTP surface is item 8** — `payment.service.ts` is orphaned today. |
| **3** | **Self-serve signup → checkout → first rent payment** | **M** | Funnel | §2.2. Depends on 0a, 0c, 1, 2. Stripe Checkout for new plans; Billing Portal for changes (`getCustomerPortalSession` already written, currently 404). |
| **4** | **Published pricing page + live unit slider + fee-transparency page** | **M** | Item 2 of the brief | §3.4. Front-end + a published rate card. No marketing site exists in the repo — this is greenfield. Slider must render the quote before any input is focused. |
| **5** | **Import / migration — CSV + 3 incumbent profiles + trial-data preservation** | **M → L** | Switching | §4. CSV + mapper alone is **M**. Trial-data preservation (§4.4) is **L** and now depends **only** on **D1 landing** (§2.5) + item 1 — the `Lease.rentalId @unique` conflict resolves once `@@index` + partial unique is in. |
| **6** | **Bulk SMS** — consent ledger, opt-out, quiet hours, bulk API, templates, A2P 10DLC registration | **L** | Retention + compliance | §5. Every tier. **The P0 compliance items (consent ledger, opt-out, quiet hours) must ship *before* any bulk send is enabled** — the existing one-to-one path is already non-compliant. |
| **7** | **"PropertyAI Free" packaging & caps** — wire the 2-unit / 3-lease cap to the §1 meter; upgrade prompts; freeze-not-delete on expiry | **S** | — | **Cheap only *after* item 1.** On its own it has nothing to enforce against. |
| **8** | **Revive `paymentRoutes.ts` (Stripe billing surface)** — add a live `router.use` in `routes/index.ts` (the import is currently **elided**, so it must be made live, not annotated); repair 3 call-shape mismatches (`createRefund(req.body)` vs `createRefund(paymentIntentId: string)`; `createSubscription(customerId, priceId)` vs `(customerId, items[])`; `processPaymentWebhook` needs a **raw** body the global JSON parser has already consumed) | **M** | Item 2's HTTP surface | **§2.6.** Separate task from the mount-order fix — bundling would hide a billing revival inside a one-liner. ⚠️ **This is where the §1.2 fee path actually lives.** Until it is done, "expect 404s to become 500s, not 200s." |

### 6.1 Cost ranking, corrected

| User's claim | Verdict |
|---|---|
| Item 1 (free tier) is *"纯打包，模块都已存在，杠杆最高"* — the cheapest thing | ❌ **False.** No `Plan`/`Subscription`/`Price`/`Tier` model (0 of 94), no entitlement field on `User`, no enforcement middleware, no Connect marketplace rail, no live Stripe credentials. **This is the single largest item in the plan (S+S+L+L).** The *packaging* is cheap; the *billing substrate* it requires does not exist. |
| Item 2 is *"literally a pricing-page and billing-integration change, not a product change"* | ⚠️ **Half true.** The pricing page is genuinely a front-end task (item 4). But checkout is blocked by a **routing bug** (0c) *and* needs the entitlement model (1) *and* a Connect rail (2). |
| Item 3 (import) is *"the cheapest way to make switching easier than staying"* | ⚠️ **CSV + mapping: yes, cheap (M).** But "trial data survives conversion" is **L** — it needs the entitlement model (item 1). **Good news from §2.5 D1:** the `Lease.rentalId @unique` blocker I originally flagged resolves with a **measured zero-blast-radius index swap**, so trial-preservation is **less** blocked than first assessed. Rentec's move is cheap *for Rentec* because it has one tenancy; here it still needs the billing/entitlement substrate. |
| Item 5 (bulk SMS) is *"the only expensive one"* | ❌ **False — and it is not the most expensive.** It is L, but item 1 is L×2, and item 5's *compliance* prerequisites (consent ledger, opt-out, quiet hours) are P0 blockers that also apply retroactively to the existing non-compliant one-to-one SMS path. |

**Net: three of the five scope claims are wrong, and all three err in the same direction — assuming infrastructure that is not there. The genuinely cheap wins are 0c (one-line route fix unlocking 35 mounts), 0a/0b (security), and item 4's pricing page.**

---

## 7. Where the user's premise could not be reconciled with the code

| # | User's premise | Code says | Reconciliation |
|---|---|---|---|
| 1 | *"Item 1 is 纯打包，模块都已存在，杠杆最高"* | 0 billing models / 0 entitlement fields / 0 enforcement / 0 Connect / placeholder Stripe keys | **Irreconcilable.** Surfaced, not smoothed. §1.3, §6.1 |
| 2 | *"Monetise transaction fees (exactly Hemlane/TurboTenant's model)"* | No `application_fee_amount`/`transfer_data`/`on_behalf_of` (0 matches) | Model is right; **the rail to take a fee does not exist.** Requires Stripe Connect. §1.2 |
| 3 | *"Publish prices; Rentec's slider is the bar"* | Slider is right; Rentec's **cited figures are stale** ($2.00/unit + $50 min → now $25 flat ≤10 / $50 entry) | **Benchmark moved.** Copying the stale number means overpricing. §3.1 |
| 4 | *"Item 2 is literally a pricing-page and billing-integration change"* | 35 route mounts are shadowed by a 404 catch-all; **every Stripe checkout endpoint returns 404** | **Irreconcilable as stated.** Blocked by a routing bug first. §2.3 |
| 5 | *"Item 3 — trial data must survive conversion"* | `Lease.rentalId @unique` ⇒ one lease per rental ever | **Direct conflict — RESOLVED by §2.5 D1.** Relaxing to `@@index([rentalId, status])` + partial unique `WHERE status='ACTIVE'` has a **measured zero breaking call sites**. Until that migration lands, a conversion adding a lease to an already-imported unit **will be rejected by the unique constraint.** **D1 is a hard prerequisite for §4.4, not for the CSV import.** |
| 6 | *"AI maintenance triage is the wedge"* (positioning doc, row #4 "the only honest moat") | `cv/photoAnalysis.ts` was a **7-line placeholder** (`return {labels:['property','interior']}`) — **now deleted**; `photoAnalysis.service.ts` (626 LOC, real AWS Rekognition) is **DEAD**; the photo-analysis mount is **commented out**; `urgency.service.ts` **deleted**. Live path: `triage.service.ts` (92 LOC) = **Gemini text/NLP**, reached only via `contractor.service.ts:80` (vendor *unassign* re-triage) — **and `createMaintenanceRequest` does not call it at all** | **Not CV. Not on the intake path.** Restate as: *text/NLP triage, needs wiring to the intake path + validation.* Do not sell "CV is our moat." §2.2 step 10 |
| 7 | Accounting cited as a strength area | `accounting.service.ts` was 33 LOC posting to the QuickBooks **sandbox** with a hardcoded company id — **and was deleted in `6bd66e54`** | Was never a strength. Now gone entirely. |
| 8 | *"If you reuse figures from the positioning doc, mark them as carried-over"* | Rentec's public pricing changed **and** the repo advanced one commit (81 dead files deleted) mid-analysis | Every carried-over number in this doc is marked; Rentec's is marked **superseded**. §3.1 |
| 9 | *(not in the brief)* Free tier is an open space | **TurboTenant already runs this exact model at scale**: free plan, unlimited rentals, rent collection, **$2.00/ACH tenant-paid** | The free tier is **occupied**. Must differentiate on capability (e-sign, accounting, SMS), not generosity. §3.2 |
| 10 | *(not in the brief)* Bulk SMS is a feature gap | The **existing** one-to-one SMS path sends with **no consent check and no opt-out** | Not just a gap — a **live TCPA liability** ($500–$1,500/message). Compliance is a P0 prerequisite, not a follow-up. §5.2 |

---

## 8. Appendix — verification method

- **Reachability:** `node ~/.workbuddy-ai/skills/ts-dead-code-triage/scripts/dead-set.js` from `backend/`. At `6bd66e54`: app entry `src/index.ts`, 41 test entries, 533 → **346 total src files** (after the 81-file deletion), **287 reachable from the app**, 336 reachable including tests. The script now explicitly reports the shadowed binding: `src/routes/index.ts -> ./paymentRoutes (binding "paymentRoutes" unused)`.
- **Route reachability (the decisive method):** boot with `node --require ts-node/register src/index.ts` (Redis `ECONNREFUSED :6379` is expected and non-fatal — verified the app reaches `Server successfully started on port 3001`), then probe. **Mounted central routes return 401 (auth) / 400 (bad payload) / 200; shadowed routes return `404 {"status":"error","message":"API endpoint not found"}`.** Always include a known-good control — §2.3 lists four.
- **Express mount-shadowing mechanism** was reproduced in isolation: a router ending in a `use('/api/*')` handler that responds without calling `next()` prevents every later `app.use('/api/…')` from ever matching. Confirmed by test before the live probe, so the 404s are explained, not merely observed.
- **Env credential check:** values inspected for **length, prefix, and placeholder pattern only**; no secret content is reproduced in this document. Findings are the verdicts ("placeholder" / length), not the values.
- **Source files were read, never modified.** The only writes are inside `/tmp` (throwaway probe scripts, since removed) and this deliverable.
- **The repo advanced one commit during analysis** (`6bd66e54`, 81 dead files deleted — including `cv/photoAnalysis.ts`, `services/urgency.service.ts`, `services/accounting.service.ts`, `config/stripe.config.js`, `services/signatureService.ts`, `services/stripeService.js`, `nlp/*`). All citations in this document were **re-verified against `6bd66e54`**, not against the earlier snapshot. Where the director's brief cites a now-deleted file, it is marked as such (§1.2, §7 #7).
- **Peer review / corrections.** §2.5 records 高见远 (software-architect)'s measured answers to the three open schema questions this spec raised. **One of my own claims was wrong and is corrected there:** `Rental.managerId/ownerId/createdById` are **backed by real relations** (`schema.prisma:566-568`), not "bare strings with no relation" — verified independently and corrected in §2.4/§2.5. His D1/D2 measurements were also **independently re-verified** here: `prisma.lease.*` sweep (0 `findUnique`-by-`rentalId`), `prisma.transaction.*` sweep (**4 files / 12 live call sites**, matching his count), `TransactionType` has no platform-fee member (`schema.prisma:1134-1140`), and the null-deref traversals at `payment.service.ts:102-118` and `tenantIssuePrediction.service.ts:64`. His D2 conclusion **overrides my D2 recommendation** and this spec now carries his (safer) design.
- **Two payment route files, distinguished by elision check.** `paymentRoutes.ts` (no dot): emitted `routes/index.ts` contains **no** `require('./paymentRoutes')` — TypeScript elides the unused import. `payment.routes.ts` (with dot): emitted `app.ts` **does** contain the require, confirming it loads and is killed only by mount ordering. Verified with `ts.transpileModule(..., {removeComments:true})`, since a naive regex matches commented-out requires.
