# PropertyAI — T-0.2: Stripe Billing Router Wiring & Verification

**Commit:** `6483f81c` — `fix(payments): mount Stripe billing router with authz + reconcile call shapes`
**Implemented by:** engineer-t02 · **Independently verified by:** Delivery Director
**Date:** 2026-09-18 · **Method:** live server on the committed code + real DB fixtures
**Unblocked by:** acceptance of the PM's §2.7 metering decision (`userId` + active leases; no `Account` model for v1)

---

## Verdict

**Wired, authorized, and independently verified — 16/16 probes pass.** Backend typecheck held at
**18** (baseline 18, no regression). Pushed to `main`.

But **the free tier still cannot collect revenue**: `calculateFees` remains a placeholder (see
"The remaining gap" below). This task made the route reachable; it did not make the fee correct.

> **UPDATE (`4434a46c`):** the fee rate *was* specified and has since been fixed — see the UPDATE
> at the end of "The remaining gap". The rate is no longer the blocker; the missing `FirmFee`
> ledger and Stripe Connect rail are.

---

## The blocker that was not in the original plan

T-0.2's prior acceptance criteria checked exactly two things: that the route stops returning 404,
and that the controller↔service signatures line up. Both were necessary. **Neither was
sufficient**, and the gap would have shipped a regression:

| Fact | Evidence |
|---|---|
| The undotted router declared **zero** auth middleware | `grep -c "isAuthenticated\|checkRole\|protect" src/routes/paymentRoutes.ts` → `0` |
| The global guard only **authenticates**, never authorizes | `app.use('/api', requireAuth)` at `app.ts:139` |
| Only the webhook is allowlisted | `PUBLIC_API_PATHS` — `requireAuth.ts:121` |
| `TENANT` is self-registerable | `PUBLIC_SIGNUP_ROLES`, `validation.ts:13` |

Mounted bare, **any logged-in user — including a self-registered `TENANT` — could call
`POST /api/payments/refunds`, `/invoices`, `/subscriptions` against arbitrary IDs.** That is
strictly worse than the 404 it replaced, and it is the same shape as the P0 closed in `6e324fb8`
(self-assignable role + role-only authorization). **Mounting without authorization would have been
a regression, not a feature.**

**Fix:** all 13 non-webhook routes now carry `isAuthenticated` + `checkRole([UserRole.OWNER,
UserRole.ADMIN])` (both from `middleware/auth.ts`). `/webhooks` is deliberately left **anonymous** —
Stripe cannot present a JWT, and adding JWT auth there would break Stripe.

## A fixture fact that decided the guard

**There are zero `OWNER` users in the database.** The only privileged account is
`admin@propertyai.com` (role `ADMIN`) — and that same id is the `ownerId` on the rentals.

The sibling dotted router uses `isOwner` (`auth.ts:67-72`), which requires the role be **exactly**
`OWNER`. Had T-0.2 mirrored it, the entire billing surface would have been **permanently 403 for
everyone**, including the account that actually owns the rentals. Hence `checkRole([OWNER, ADMIN])`.

This is the "a fix that 403s everything is not a fix" trap, caught before it shipped rather than
after.

---

## Evidence

Method: real server on `6483f81c` (`npm run dev:node`, `Server successfully started on port 3001`;
Redis `ECONNREFUSED :6379` is expected noise), tokens self-signed with `JWT_SECRET` (payload
`{ id, email, role }`, per `tokenService.ts:11`), real DB fixtures.

### Mount proof — the 404-vs-500 differential

| Request (valid token) | Result | Meaning |
|---|---|---|
| `POST /api/payments/payment-intents` | **500** `{"error":"Invalid API Key provided: your_str**********_key"}` | **reached the handler and reached Stripe** |
| `POST /api/payments/does-not-exist` | **404** | **control** — unmounted path |
| `POST /api/payments/nope/deeper` | **404** | **control** — unmounted path |

The two 404 controls are the linchpin: without them "not 404" would prove nothing. The 500 carries
**Stripe's own error**, which is what makes it evidence rather than just a non-404.

### Authorization

| Actor | Result |
|---|---|
| no token | **401** |
| `TENANT` (self-registerable) | **403** |
| `PROPERTY_MANAGER` | **403** |
| `OWNER` token | **500** — passed the guard |
| `ADMIN` | **500** — passed the guard |

`OWNER` → 500 vs `TENANT` → 403 is the discriminator: authorization genuinely distinguishes, rather
than denying everything.

> **On the `OWNER` branch.** The implementing engineer reported it could not test this, because no
> `OWNER` row exists. It *is* testable: `isAuthenticated` (`auth.ts:16-17`) verifies the JWT and
> trusts its `role` claim with **no DB lookup**, and `checkRole` (`auth.ts:57-65`) reads that same
> claim — so a minted `OWNER` token legitimately exercises the branch. It returned 500 (guard
> passed). Closed here.

### Regression control & webhook anonymity

| Request | Result |
|---|---|
| `GET /api/payments/transactions/pending` + ADMIN | **403** — dotted family untouched |
| `POST /api/payments/webhooks`, no signature | **400** — not 401, so it stayed anonymous |
| `POST /api/payments/webhooks`, bogus signature | **400** |
| `POST /api/payments/webhooks`, valid HMAC | **200** — raw body arrives |

### Call-shape repairs (T-0.2b)

| Request | Before | After |
|---|---|---|
| `POST /refunds` with `{paymentIntentId}` | object passed as `payment_intent` → 500 | reaches Stripe, no shape TypeError |
| `POST /refunds` with `{}` | 500 | **400** "paymentIntentId is required" |
| `POST /subscriptions` with `{customerId, priceId}` | string passed where `Item[]` expected → 500 | reaches Stripe |
| `POST /subscriptions` with `{customerId}` | 500 | **400** "customerId and priceId are required" |

---

## The remaining gap — the free tier still cannot collect revenue

```ts
// payment.service.ts:270
async calculateFees(amount: number) {
  // Simplified fee calculation example, replace with actual calculation
  return amount * 0.029 + 30;   // Stripe's PROCESSING cost, not a 1.25% platform fee
}
```

The route is now reachable and returns `200` with a value — but that value is Stripe's cost of
*taking* the money, not the **1.25% platform fee** the free tier is meant to charge. **The
monetization path is now wired but still not monetizing.**

This is the last gap in the chain, and it is a **product/pricing decision, not a wiring one** — it
needs the fee model (rate, who bears it, whether Stripe's cost is passed through or absorbed,
rounding, refund handling) settled before implementation.

### UPDATE — the rate was already specified, and is now fixed (`4434a46c`)

The paragraph above said this needed a pricing decision. **It did not** — the decision was already
recorded at `gtm-free-tier-spec:57`: *"Tenant-paid ACH convenience fee: **1.25%, min $2.50, max
$12.00**."* The code simply contradicted the spec. Fixed in `4434a46c`.

The units were the trap. The probe `{amount:1000}` → `59` is Stripe's fee for a **$10** charge
(2.9% × $10 + 30¢), which is what proves the field is **cents, not dollars** — reading `1000` as
$1,000 would put the rate off by 100×.

The old values were wrong in **both** directions, and materially:

| Rent | Old (wrong) | Correct |
|---|---|---|
| $10 | 59¢ | **250¢** (floor) |
| $200 | $6.10 | **$2.50** |
| $500 | $14.80 | **$6.25** |
| $1,000 | $29.30 | **$12.00** (cap) |
| $2,000 | $58.30 | **$12.00** (cap) |

Up to a **4.9× overcharge** on larger rents — the cap exists precisely so a free-tier fee does not
become a churn event. Verified live: 11/11 probes (7 boundaries including both clamp edges, 3 input
validation, 1 auth); typecheck unchanged at 18.

**But the rate was never the binding constraint.** The chain now reads:

| Link | State |
|---|---|
| Route reachable | ✅ `6483f81c` |
| Route authorized | ✅ `6483f81c` |
| **Fee rate correct** | ✅ `4434a46c` |
| `FirmFee` ledger model | ❌ **does not exist** (§2.5 D2: a new model, not a `Transaction` change) |
| Stripe Connect rail (`application_fee_amount`) | ❌ not implemented (item 2, size L) — needs **real** Stripe keys to verify |
| Any consumer of `calculate-fees` | ❌ none exists |

**Revenue still does not flow**, and the remaining work is infrastructure, not pricing.

## Deployment prerequisites

1. **`.env` Stripe secrets are placeholders** (`STRIPE_SECRET_KEY` 22 chars, `STRIPE_WEBHOOK_SECRET`
   26; real ones are 100+/60+). Every Stripe call therefore fails auth — which is why the probes
   above return Stripe's "Invalid API Key". **Webhooks are code-verified, not integration-tested.**
   Real keys are required before this is live.
2. **Client side remains disconnected** (unchanged by this task): `dashboard`'s
   `ProcessPaymentForm`/`PaymentMethodsList` are imported by **no screen**; the routed dashboard
   Payments page (`App.tsx:224`) calls `GET /api/payments`, which 404s — there is no `Payment`
   model. Wiring the backend did not give those surfaces anything to talk to.

## Process note

Two parallel edits to the same file (`paymentController.ts`) raced and one clobbered the other. It
was caught only because a probe still returned the old result on the first run. **Serialise edits
per file; parallelise only across different files.**
