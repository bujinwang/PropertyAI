# PropertyAI — P0 Security Fix Verification

**Commit under test:** `6e324fb8` — `fix(P0): verify Stripe webhook signatures + authorize vendor payouts`
**Verified by:** Delivery Director (independent of the implementing engineer)
**Date:** 2026-09-18
**Method:** live server on the committed code, HTTP probes against real DB fixtures, plus a
TypeScript-API elision audit. Not a code review — every claim below is an observed response.

---

## Verdict

**Both P0s are genuinely fixed.** 11/11 independent probes pass, including the *positive*
direction of each fix (a fix that rejects everything is not a fix).

| # | Probe | Result | Expected | |
|---|---|---|---|---|
| **P0-A — unsigned Stripe webhook** | | | | |
| 1 | forged `payout.paid`, **no** signature | `400` | 400 | PASS |
| 2 | forged `payout.paid`, **bogus** signature | `400` | 400 | PASS |
| 3 | **valid** signature, unhandled event | `200` | 200 | PASS |
| 4 | **valid** signature, `payout.paid` unknown id | `500` | 500 | PASS |
| **P0-B — unowned vendor payout** | | | | |
| 5 | unrelated PM pays another manager's work order | `403` | 403 | PASS |
| 6 | rental's own manager pays it | `500` | ≠403 | PASS |
| 7 | nonexistent work order | `404` | 404 | PASS |
| 8 | no token | `401` | 401 | PASS |
| **P0-B — history IDOR** | | | | |
| 9 | manager reads vendor history | `200` | 200 | PASS |
| 10 | unrelated manager reads same history | `200` (scoped, empty) | 200 | PASS |
| **Regression** | | | | |
| 11 | backend `tsc --noEmit` error count | `18` | 18 (unchanged) | PASS |

### Why probes 3, 4 and 6 are the ones that matter

- **Probe 3** proves the webhook is not blanket-denying: a correctly-signed request is accepted.
- **Probe 4** proves the signature check is *passed through* to the money handler — the request
  reaches the `prisma.vendorPayment.update`, which is the state write that used to be forgeable.
- **Probe 6** is the authorization discriminator. The owner gets `500`, the unrelated manager
  gets `403`. The `500` is a downstream business error —
  `Error: Work order is not assigned to a vendor` (the fixture work order has no
  `WorkOrderAssignment`) — **and it appears exactly once in the server log**, proving the
  unrelated manager's request never reached the payment service at all. A fix that `403`'d
  everyone would also have "blocked the attacker"; this one demonstrably distinguishes.

---

## Two findings from this verification

### 1. The duplicate-name trap, again — a P0 "fix" landed on dead code

The repo contains **two** payment route/controller pairs, and the undotted twins are unreachable:

| Dotted (LIVE) | Undotted (DEAD) |
|---|---|
| `routes/payment.routes.ts` — mounted `app.ts:179` | `routes/paymentRoutes.ts` — imported at `routes/index.ts:31`, **never used** |
| `controllers/payment.controller.ts` | `controllers/paymentController.ts` |

`paymentRoutes.ts` is imported but never referenced in value position, so **TypeScript elides the
import**. Proven two independent ways:

1. **Emit audit** — compiling `routes/index.ts` with `removeComments: true` via the TypeScript API
   produces output containing **no** `require('./paymentRoutes')` at all.
2. **Runtime probe** — `POST /api/payments/webhooks` returns **`404`**, not `400`/`401`.

**Consequence:** `6e324fb8`'s change to `controllers/paymentController.ts` (passing `req.rawBody`
instead of the parsed body) is *correct but inert* — that controller never loads. This is not a
defect (dead code is not exposed), but **do not read it as `/api/payments/webhooks` being
protected. That endpoint does not exist.** The live P0-A surface was only ever
`vendorPayment.controller.handleStripeWebhook`, which *is* fixed.

Note also that `requireAuth.ts`'s `PUBLIC_API_PATHS` still lists `/payments/webhooks` — the
allowlist entry that the (now-corrected) false comment was based on.

### 2. Unbound `this` in controllers — a clean-typechecking runtime failure

Controllers are exported as **instances** (`export const vendorPaymentController = new
VendorPaymentController()`) but passed **unbound** to Express (`vendorPaymentController
.initiatePayment`), so `this` is `undefined` inside the method.

The first revision of the P0-B fix used `this.authorizeWorkOrder(...)`. Every payout returned
`500` — `TypeError: Cannot read properties of undefined (reading 'authorizeWorkOrder')` — and the
authorization check **never executed**. The implementing engineer caught and corrected this to a
module-level function before committing; the verification above is against the corrected commit.

**Standing rule for this repo: use module-level functions or closures in controllers. Never
`this.`** Typechecking does not catch it.

*(Process note: my first differential run returned `500` for all three actors because I measured a
server booted before that correction. The commit had already fixed it. Always confirm the server
is running the current code before trusting a probe.)*

---

## Regression check: the ADMIN registration hole is closed

Memory previously recorded `POST /api/auth/register` as allowing **anyone to self-register as
`ADMIN`**. That is now **stale — the hole is fixed**, verified empirically:

| Payload role | Result |
|---|---|
| `ADMIN` | `400` — "Invalid role. Self-service registration permits only: …" |
| `admin` (lowercase) | `400` — normalised to `ADMIN`, then rejected |
| `OWNER` | `201` created |
| `PROPERTY_MANAGER` | `201` created |

`validation.ts:13` omits `ADMIN` from `PUBLIC_SIGNUP_ROLES`; `validateRegistration:95-108` is
fail-closed (normalise, then allowlist); `authRoutes.ts:13` adds `registerRateLimiter`. The `201`s
prove the endpoint is not blanket-rejecting.

**However: `PROPERTY_MANAGER` is still self-assignable** and is trusted by ~7 `checkRole` sites.
Self-registration is not escalation *today* only because the money paths now carry ownership
checks. **Any new route gated solely on `checkRole(['PROPERTY_MANAGER'])` re-opens the hole.**
Gate on ownership, not role.

*(Test users created during this probe were deleted; no residue in the DB.)*

---

## CORRECTED: `paymentRoutes.ts` is unwired monetization infrastructure, not deletable

**An earlier revision of this report recommended "do not mount it — delete it in the next
dead-code sweep." That recommendation was wrong in its reasoning and premature in its
conclusion. Corrected here.**

The cross-app check (which memory requires before *any* deletion, because the reachability BFS is
backend-only) surfaced consumers the backend-only analysis could not see:

- `dashboard/src/components/ProcessPaymentForm.tsx:28` imports `paymentUtils`
- `dashboard/src/components/PaymentMethodsList.tsx:28` imports `paymentService`
- `propertyapp/src/screens/SettingsScreen.tsx:132` navigates to `'PaymentMethods'`
- `dashboard/src/services/paymentService.ts:140,152,164` calls `/api/payments/payment-methods…`
- `tests/paymentsRoutes.test.js` exercises `/api/payments/payment-methods` (GET/DELETE/PUT)

Prior team analysis (hard-gaps plan, Appendix C.3 / **T-0.2, P1**) had already established that
this module is the **Stripe billing surface**, and that the free-tier monetization — the 1.25%
rent-payment fee — would ride on `payment.service.ts`. So it is not vestigial code; it is a
half-built feature. **Deleting it would destroy the scaffolding for the product's core revenue
mechanism.**

### The substantive new finding: it is not just unwired, it is unimplemented

Every layer of the fee path is disconnected, and the one piece that would compute revenue is a
placeholder:

```ts
// payment.service.ts:270
async calculateFees(amount: number) {
  // Simplified fee calculation example, replace with actual calculation
  return amount * 0.029 + 30;   // Stripe's PROCESSING cost, not a platform fee
}
```

`0.029 + 30¢` is Stripe's cost of *taking* the money. It is not a 1.25% platform fee. **Even if
the router were mounted today, this method would not capture the free tier's revenue.** The
layers stack up as follows:

| Layer | State |
|---|---|
| `routes/paymentRoutes.ts` | never mounted; import **elided** by TS |
| `controllers/paymentController.ts` | never loads (only the dead router imports it) |
| `services/payment.service.ts` | loads nowhere on the HTTP surface; `calculateFees` is a placeholder computing the wrong quantity |
| `dashboard` consumers | `ProcessPaymentForm` / `PaymentMethodsList` are **imported by no screen** — unrendered |
| `propertyapp` consumer | `SettingsScreen` navigates to a `PaymentMethods` route; the endpoint 404s |

### This is a product decision, not a cleanup call

**Recommendation: hold, and let the user choose.** Mounting the router is **T-0.2**, which prior
analysis scoped as a task in its own right (it exposes latent controller↔service signature
mismatches — `createRefund(req.body)` vs `createRefund(paymentIntentId: string)`,
`createSubscription(customerId, priceId)` vs `items: Item[]` — so expect 404s to become 500s, not
200s). It also exposes fourteen money-adjacent endpoints, including `refunds`, `invoices` and
`subscriptions`.

**That should not happen before the outstanding `Account`-model decision.** Which entity a
subscription or a fee is billed to is exactly the question that decision answers. Mounting first
would wire money endpoints to an undefined billing subject.

*(One piece of the P0 commit is therefore **not** wasted: the `req.rawBody` change in
`paymentController.handleWebhook` is precisely the raw-body handling that T-0.2's acceptance
criteria require for `POST /api/payments/webhooks`. It is inert today and correct for the day the
router is wired.)*


---

### Bonus finding: the routed dashboard Payments page is 404 end-to-end

While tracing the client consumers I found a **user-visible** break, separate from the P0s. The
dashboard routes a Payments page — `App.tsx:70` lazily imports `pages/PaymentList`, rendered at
`App.tsx:224` — and that page calls `dashboardService.getPaymentRecords` /
`deletePaymentRecord` / `createPaymentRecord`, which hit `GET/POST/PUT/DELETE /payments`
(`dashboardService.ts:1138-1153`). With `baseURL = '/api'` (`services/api.ts:5`) that resolves to
`/api/payments`. Probed with a **valid token**:

| Request | Result | Meaning |
|---|---|---|
| `GET /api/payments` | **404** | the page's endpoint does not exist |
| `POST /api/payments` | **404** | — |
| `GET /api/payments/transactions/pending` | **403** | **control** — dotted family is live (reached `isOwner`) |
| `GET /api/payments/vendor-payments/pending` | **403** | **control** — same |
| `POST /api/payments/payment-intents` | **404** | **control** — undotted family is dead |
| `GET /api/payments/payment-methods` | **404** | **control** — same |
| `GET /api/vendor-payments/history/<id>` | **200** | **control** — a hardened route still works |

The 403-vs-404 split is the clean discriminator the earlier plan called for, and it independently
confirms the liveness conclusion: **dotted = live, undotted = dead.** It also shows the break is
not the router's fault — there is **no `Payment` model** in the schema, so `/payments` CRUD has
nothing to serve. The page is routed and reachable in the UI; it cannot work.

*(This is the same shape as the propertyapp finding already in memory: a registered screen calling
an endpoint that 404s. It is a product-surface gap, not a security defect — logged, not fixed
here, because the fix depends on the same `Account`/billing decision.)*

---

## Open follow-ups (none blocking)

1. **`express.json({ verify })` is global.** Every JSON request now retains a second copy of its
   raw bytes on `req.rawBody` alongside the parsed `req.body` — roughly doubling per-request
   memory, against a `100mb` limit. Standard remedy: scope the raw parser to the two webhook
   routes instead of applying it globally. Low priority, but it is a real amplification surface.
2. `paymentRoutes.ts` + `paymentController.ts` + the `calculateFees` placeholder — **held, not
   deleted.** This is T-0.2, a product decision (see the corrected section above). Do not delete
   and do not mount until the `Account`-model question is answered.
3. Three standing product/risk decisions still with the user: the `.git` shrink (244 MB,
   force-push rewrites every hash), `@types/axios` removal + propertyapp TS bump to `^5.8.3`
   (surfaces the true ~270-error backlog), and whether to ship checkout without an `Account` model.
