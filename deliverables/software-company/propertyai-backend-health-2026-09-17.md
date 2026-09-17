# PropertyAI — Backend Health Report

**Date:** 2026-09-17
**Scope:** Get the backend compiling, booting, and honest about what actually works.
**Team:** `software-propertyai-backend-health` — lead 齐活林 (Qi); engineer 寇豆码 (Kou).

---

## TL;DR

The backend **now boots and `npm run dev` works**. Type errors went **286 → 109**, and the app was proven to start and serve on port 3001. Along the way we found that the schema underwent a `Property`/`Unit` → `Rental` migration the code never finished, that the backend runs **two ORMs simultaneously**, that the predictive-analytics layer is **non-functional end to end**, and that **11 enum comparisons across the analytics code can never be true** — only 6 of which the compiler detects.

**The most important result is a reachability analysis (see finding 8): of the 109 remaining errors, ALL 109 are in code that is never loaded.** Zero errors remain in genuinely live code. The "fix 109 errors" framing was wrong; the right framing is "decide which of these abandoned features you want, then delete or implement them." Every remaining error is a delete-or-revive product decision, not engineering debt.

---

## Commits

| Hash | What |
|---|---|
| `da638c57` | Repair logger imports, auth middleware, prisma + validation import paths (286 → 247) |
| `285d2aec` | Add `AuditService.logEvent`, fix cleanup-scheduler import, rename Prisma models, drop 6 dead legacy files (247 → 244) |
| `ae64605b` | Enable `ts-node` transpileOnly, add `typecheck` script, remove broken SIEM proxy (244 → 242) |
| `05cea69d` | Clear the mechanical clusters — TS7006 / TS2561 / TS7017 / TS7053 / TS18046 (242 → 160) |
| `4484ee96` | Await `evaluateAutoApproval` (approval bypass), Prisma `Json` narrowing, null guards, spread (160 → 129) |
| `5c64432b` | `checkRole` wiring, compliance checksum, drop misplaced frontend file, type `compressedReadings` (129 → 114) |
| `792702eb` | Delete `schedulerService` (dead), fix the last live comparison in `predictiveModels` (114 → 109) |

---

## Verified state

| Metric | Value |
|---|---|
| `tsc --noEmit` errors | **109** (was 286) |
| …of which in **live** code | **0** (see finding 8) |
| `npm run dev:node` | ✅ starts, binds **:3001** |
| `npm run typecheck` | ✅ new script, reports the same 109 |
| Postgres | ✅ running on 5432, real `DATABASE_URL` in `.env` |
| Redis | ❌ not running — `ECONNREFUSED 127.0.0.1:6379`, degraded not fatal |
| Prisma client | ✅ generated |
| Working tree | ✅ clean |

Boot re-verified after every deletion: `Manager routes module loaded` → `Manager routes configured` → `Server successfully started on port 3001`, with **zero** `Cannot find module` / `SyntaxError` / `ReferenceError` / `TypeError` in the log.

---

## What was fixed

**Live runtime bugs, not lint noise.** These resolved to `undefined` at runtime and then had methods called on them:

- 7 files imported `logger` as a **named** export against a **default** export — every `logger.info()` would throw. Fixing this exposed **57 hidden `TS2554` errors** that the broken import had been masking, because `logger` resolved to `any`. Widening the logger signature to `(message, ...args)` cleared all 57 in one file — and fixed a real silent-data-loss bug, since the old one-argument signature was **discarding every error object** passed to `logger.error('msg:', error)`.
- `authenticateToken` was imported from `auth.middleware`, which doesn't export it — Express would receive `undefined` as middleware and throw at startup. Repointed to `auth.ts`. This was also the **secure** choice: `auth.ts`'s version actually runs `jwt.verify` and populates `req.user`, whereas `auth.middleware.ts`'s `requireAuth` verifies nothing and only checks whether `req.user` already exists. 17 route files use `auth.ts`; zero use `auth.middleware` as middleware.
- Two controllers imported `../lib/prisma`, a module that has **never existed** in this repo's history. Real module is `../config/database`.
- `iot.routes.ts` imported `validateRequest` from a non-existent `validation.middleware`.
- `cleanupSchedulerService.ts` had 5 undeclared class fields (34 errors).

**Consolidation.** `AuditService` gained a `logEvent` method accepting the two call shapes found across the codebase — positional `(action, entityId, details)` (15 sites) and object-shaped with pre-migration field names `resourceType`/`resourceId`/`riskLevel` (4 sites) — normalising the aliases and mapping `low/medium/high/critical` onto the `AuditSeverity` enum.

**Dead code removed** (1812 lines): `legacy-monitoring.ts` plus `auditService-`, `emailService-`, `notificationService-`, `schedulerService-`, `tenantService-legacy.js`. All verified zero-importer before deletion.

**Dev workflow decoupled from type checking.** `tsconfig.json` gained `"ts-node": { "transpileOnly": true }` and `package.json` gained `"typecheck": "tsc --noEmit"`. Previously ts-node type-checked on startup and died on the first error, so *any* remaining error blocked the dev server entirely.

---

## Key findings

### 1. The `Property`/`Unit` → `Rental` migration was never finished

The schema has **94 models** and contains **no `Property`, `Unit`, `Tenant`, or `Payment`**. The property entity is `Rental`. Tenants are `User` rows reached via `Lease.tenantId`.

This is not drift — it was deliberate. Migration history proves it:

- `20250608000122_initial_schema` **created** `Property` and `Unit`
- `20250804155618_rental/migration.sql` runs `DROP TABLE "Property"; DROP TABLE "Unit";`
- Supporting tooling exists: `scripts/migrate-to-rental.ts`, `check-migration-status.ts`, `middleware/legacy-mapping.ts` (rewrites `GET /api/properties` → `/api/rentals`)

**Consequence:** `prisma.property` in code means *unfinished migration*, not a missing model. The correct targets are `prisma.rental` / `prisma.user`. Never resolve this by growing the schema or adding a migration.

### 2. Two ORMs run side by side

`@prisma/client ^5.10.2` (canonical) **and** `sequelize ^6.37.7` (legacy). `src/models/*.js` are Sequelize models (`Property.js`, `Feedback.js`, `ReportAuditLog.js`, `GeneratedReport.js`, `ComplianceCheck.js`, `Notification.js`), with `src/config/database-legacy.js` and Sequelize migrations. **Treat any `src/**/*.js` service file as the legacy ORM layer.**

### 3. The field-level migration is NOT mechanical

Renaming `prisma.property` → `prisma.rental` cleared 9 errors but **exposed 28** field-level ones. Investigation found only **one family is mechanically fixable**:

| Concept the code expects | Current schema | Verdict |
|---|---|---|
| `Rental.units` relation | **No `Unit` model at all**; only scalars `unitNumber` / `totalUnits` | **Product decision** — a `Rental` *is* a leasable unit now, so "units of a property" has no direct replacement |
| `include: { amenities: true }` | `Rental.amenities` is `Json?` — a **scalar** | **Never valid** — data is already on the row |
| `User.Unit` / `.Payments` / `.MaintenanceRequests` / `.Messages` / `.moveInDate` / `.credit_score` / `.employment_status` / `.income_range` | All absent; **no `Payment` model exists** | **Product decision** — move-in lives on `Lease.startDate` |
| `Transaction.property` | Reachable **indirectly** via `Transaction.leaseId` → `Lease.Rental` | ✅ **Mechanical** — the only such family |

**Trap:** in `include: { units: true, amenities: true }`, tsc reports only the *first* excess property. Fixing `units` alone will not fix `amenities`.

**Implication:** this code was written against a data model that does not exist — one with Property 1→N Unit, tenants carrying credit/income/employment fields, and a standalone `Payment` model. AI tenant screening and predictive features are therefore blocked on a **schema design decision**, not a code cleanup.

### 4. Predictive analytics is non-functional, at both ends

**Works:** `api-simple.py` @ :5001 — pure rule-based, and notably has **zero database dependencies**. Verified live.

**Broken:** `financial_forecast.py`, `anomaly_detection.py`, `tenant_behavior.py` all query tables **dropped by the Rental migration** (`"Property"`, `"Unit"`, `"Tenant"`, `"Payment"`) and non-existent columns (`Transaction.category`, `.propertyId`, `.tenantId`). They fail on their first SQL query. Meanwhile the TypeScript side feeds them all-zero features because it filters `TransactionType` on `'INCOME'`/`'EXPENSE'`, members that do not exist.

### 5. Type errors were concealing real logic bugs — full inventory of 11 always-false comparisons

`TS2367` "no overlap" errors here mean a filter that can never match. Auditing every `===` comparison in the backend against the actual Prisma enum members turned up **11 such sites — but the compiler only flags 6 of them.**

**Compiler-flagged (6 sites):**

| Location | Expression |
|---|---|
| `aiPredictions.routes.ts:144` | `t.type === 'INCOME'` |
| `aiPredictions.routes.ts:145` | `t.type === 'INCOME'` |
| `aiPredictions.routes.ts:147` | `t.type === 'EXPENSE'` |
| `aiPredictions.routes.ts:148` | `t.type === 'EXPENSE'` |
| `aiPredictions.routes.ts:284` | `t.type === 'INCOME' ? 1 : t.type === 'EXPENSE' ? -1 : 0` |
| `predictiveModels.ts:34` | `p.status === 'MISSED'` |

**Compiler-invisible (5 sites — verified to produce no TS2367):**

| Location | Expression | Why it's hidden |
|---|---|---|
| `aiPredictions.routes.ts:213` | `p.status === 'LATE'` | receiver `tenant.Payments` already errors (TS2339); callback param annotated `{ status: string }` |
| `aiPredictions.routes.ts:214` | `p.status === 'MISSED'` | same |
| `aiPredictions.routes.ts:218` | `m.type === 'COMPLAINT'` | same |
| `aiPredictions.routes.ts:75` | `mr.priority === 'CRITICAL'` | receiver already `any` |
| `tenantAnalyticsController.ts:533` | `s.priority === 'CRITICAL'` | receiver already `any` |

**Relevant enum facts (read from `prisma/schema.prisma`):**

- `Priority` = `LOW / MEDIUM / HIGH / **EMERGENCY**` — **no `CRITICAL`.** `CRITICAL` *does* exist in `AuditSeverity`, `SecurityIncidentSeverity`, `SensorAlertSeverity` and others, which is exactly why the mistake is easy to make and easy to miss.
- `TransactionStatus` = `PENDING / COMPLETED / FAILED / REFUNDED` — **no `LATE`, no `MISSED`.**
- `TransactionType` = `RENT_PAYMENT / SECURITY_DEPOSIT / MAINTENANCE_FEE / REFUND / OTHER` — **no `INCOME`, no `EXPENSE`.**

**Consequence:** `avg_income`, `avg_expense`, `type_encoded`, `late_payments`, `missed_payments`, `complaint_messages` and the critical-priority counts are **all always 0**. The financial forecast and anomaly-detection endpoints receive all-zero features.

**Not part of this bug class:** `enhancedAuditService.ts:321-322` compares `e.entityType === 'TRANSACTION'` / `'FINANCIAL'`, but `AuditEntry.entityType` is a free-text `String`, not an enum — those are legitimate.

**Caution for future edits:** when a receiver collapses to `any` (from an upstream missing-relation error) or a callback parameter is annotated structurally, **the compiler loses the ability to detect these**. This is why the 5 invisible sites must be tracked manually. Replacing the structural types with real model types will *restore* the errors — that is expected and desirable, not a regression.

### 6. Two more latent crashes, one now fixed

- `siem.service.ts` built a `Proxy` over `auditService.logAction`, which exists on neither audit service — it threw `TypeError: Cannot create proxy with a non-object as target or handler` **at module load**. Removed in `ae64605b`. It was unreachable in practice (its only importer, `threatDetection.service.ts`, is imported by nobody and not registered in `app.ts`).
- `dataRetentionService.js:253` calls `auditService.logEvent` on the **stale stub** — same class of crash, invisible to the type checker because it is a `.js` file. Still open.

### 7. A measurement error worth not repeating

`grep "does not exist on type 'PrismaClient'"` **never matches** — the emitted type is the generic `PrismaClient<{ log: any[]; ... }, any, DefaultArgs>`. Use the un-quoted form `"does not exist on type 'PrismaClient"`.

### 8. ALL remaining errors are in code that is never loaded

This is the finding that reframes the whole effort. Method: BFS over the import graph from `src/index.ts` (resolving relative `.ts`/`.js`/`index.*` edges, ignoring bare specifiers), yielding **287 reachable modules**; then partition every `tsc` error by whether its file is in that set.

| | Errors |
|---|---|
| Reachable *by import graph* | 2 |
| Unreachable | 107 |

And both of those 2 are themselves artifacts: they are in `cleanupSchedulerService.ts`, whose every reference is **commented out** in `index.ts` (lines 12, 52, 118, 131). Correcting for that leaves **zero errors in genuinely live code.**

Concentration of the unreachable errors:

| File | Errors | Status |
|---|---|---|
| `src/routes/aiPredictions.routes.ts` | 37 | **zero references anywhere in the repo** |
| `src/nlp/smartSearch.ts` | 23 | reachable only via `smartSearch.routes.ts`, itself unreferenced |
| `src/controllers/cacheExampleController.ts` | 8 | no importers |
| `src/routes/uxReview.bulk.routes.ts` | 5 | not mounted |
| `src/services/approvalWorkflow.service.ts` | 4 | route import **commented out** at `routes/index.ts:58` |
| `src/routes/smartSearch.routes.ts` | 3 | not mounted |
| `src/services/cleanupSchedulerService.ts` | 2 | commented out in `index.ts` |
| 18 further files | 1–2 each | no importers |

**Consequence:** the "schema decision" gating ~83 drift errors was mis-framed. It is not "should `units` exist across the schema" — it is "do you want the AI-predictions and NLP smart-search features?" If not, deleting them removes **~68 errors with no schema change at all**.

**Mount topology (needed to reason about reachability):** routes are registered in **two** places — `src/app.ts` (38 modules) and `src/routes/index.ts`, reached via `app.use(routes)` at `app.ts:105` (52 active imports, 3 commented out). Both must be checked before calling a route file dead.

**Reusable tooling:** this analysis is now packaged as the `ts-dead-code-triage` skill (`~/.workbuddy-ai/skills/ts-dead-code-triage/`) — `scripts/reachability.js` and `scripts/elision-check.js`. Run it before any future type-error sweep in this repo.

### 9. A source `import` that emits no `require()` — the elision trap

`src/index.ts:12` reads `import schedulerService from './services/schedulerService';`. It looks live. It is **not**: every *usage* of `schedulerService` is commented out (`index.ts:50`), so TypeScript emits **no `require` for it at all** — the import is elided.

Verified by transpiling `index.ts` with `removeComments: true` and inspecting the emitted requires:

```
absent (elided / commented) : schedulerService, cleanupSchedulerService
present (genuinely loaded)  : webSocket.service, emergencyWebSocket.service,
                              voicemailService, rentCollection.service,
                              documentExpiration.service, pubSub.service
```

**Never infer module loading from an `import` statement in the source.** Transpile and check. Corollary: a naive comment-stripping regex over the emitted output is not enough — `transpileModule` preserves comments by default, so a commented-out `require` still matches and produces a false "LOADED".

### 10. Real defects found — all in unwired code

The type checker is finding genuine bugs, not noise. Reachability checked on each; **none is currently reachable**, so these are latent — they matter only if the feature is switched back on.

- **`iotSecurity.service.ts:149,173` — the AES-GCM encryption never worked.** Calls `crypto.createCipher`/`createDecipher`, **removed in Node 17** (verified `undefined` at runtime). Beyond that: a random `iv` is generated and returned in the payload but **never passed to the cipher**; `setAAD`/`getAuthTag` exist only on the `iv`-based API; and `decipher.setIV` is not a real method. A non-functional cipher in a *security* service. Note the compiler's suggested `createCipheriv` is **not** a drop-in fix.
- **`approvalWorkflow.service.ts:470,503` — the `TS2551` trap, concretely.** `instance.workflow.steps.find(...)` where no `workflow` relation is loaded. Runtime `TypeError`, so **approvers are never notified and escalations never fire**. The compiler's suggested rename to `workflowId` compiles cleanly and *still crashes* (it is a string). Correct fix: `include: { workflow: { include: { steps: true } } }`.
- **`enhancedAuthService.ts:360,367` — a capital letter silently disables per-user security policy.** Reads `user.SecuritySettings`; the real field is `securitySettings`. The optional chain always short-circuits, so **every user silently gets the global default lockout threshold** instead of their configured one.
- **`healthController.ts:219` — `prisma.$metrics.json()` does not exist.** A health check that throws on every call, inside a `try`, so it reports the database unhealthy regardless of actual state.
- **`predictiveModels.ts:34` — was the only live error; now fixed** (`792702eb`). `payments.filter(p => p.status === 'MISSED')` against `TransactionStatus = { PENDING, COMPLETED, FAILED, REFUNDED }`. Always false, so `missedPayments` was **always 0** and sent to the ML model as a feature. Replaced with an explicit `0` plus a `TODO` — deliberately behaviour-preserving, because the value was already always 0 and silently changing what the model receives would have been worse. Same file still hardcodes `credit_score: 650` and `rent_amount: 1500` (lines 43–44) — see open decision 4.

**Also:** `schedulerService.ts` was deleted in `792702eb` — its `index.ts` import was elided (never loaded), its whole dependency chain was stubs, and its own header comment called it a stub to be replaced. `reports.js` still cannot load at all (`Cannot find module '../models'` — no `src/models/index.js` barrel) while also destructuring `{ authenticate, authorize }` from `middleware/auth`, neither of which that module exports; it is unmounted, so left alone.

### 11. `tsc` does not check any `.js` file

`tsconfig.json` has `include: ["src/**/*"]` but **no `allowJs`**. In `backend/src` there are 476 `.ts` files (56,757 LOC) and **56 `.js` files (13,681 LOC)** — roughly **19% of the backend has zero static verification**. This is how `analyticsService.ts` was gutted to a 4-line orphan and `dataRetentionService.js` kept calling a method that doesn't exist, unnoticed. Treat the error count as a *`.ts`-only* metric.

---

## Gotchas for the next session

- **Measure reachability before fixing anything.** Of 109 errors, 107 are in files that never load, and the other 2 are in a module that is commented out (finding 8). Run the BFS first; fixing dead code is the default trap here.
- **An `import` statement does not mean the module loads.** TypeScript elides imports whose binding is never used in a value position — `index.ts:12` imports `schedulerService` and emits no `require` at all (finding 9). Transpile and inspect the emitted requires; don't infer from source.
- **Don't measure the error count while an agent is mid-write.** It fluctuates in both directions and will mislead you. Wait for the commit, then measure.
- **Fixing a broken import reliably *raises* the error count.** A named-import-of-a-default made `logger` resolve to `any` (hiding 57 errors); `prisma.property` typed as `any` (hiding 28). A rising count after a fix means *more code is now being checked* — not a regression.
- **`tsc` and `ts-node` disagree.** `tsconfig.typeRoots` includes `./src/types`, where `src/types/express/index.d.ts` augments `Express.Request.user`. `tsc` loads those ambient declarations; **ts-node does not unless `TS_NODE_FILES=true`** — symptom is ts-node reporting `Property 'id' does not exist on type 'User'` on files `tsc` considers clean.
- **No `noEmitOnError`** — `tsc` exits non-zero but still emits `dist/`, so `npm start` can work even when `npm run build` "fails".
- **No `allowJs`** — `.js` files are never type-checked (finding 11). 56 files / 13,681 LOC are invisible to `tsc`.
- **Two audit services differ by one dot**: `audit.service.ts` (WITH — the real one) and `auditService.ts` (NO — stale stub). The stub still has **4 importers** (`auditController.ts`, `reports.js`, `reportingService.js`, `dataRetentionService.js`). Never delete it without re-grepping.
- **Routes are mounted in two places** — `src/app.ts` (38) *and* `src/routes/index.ts` via `app.use(routes)` at `app.ts:105` (52 active, 3 commented out). Check both before declaring a route file dead.
- **`req.user` is the raw JWT payload** (`{ id, email, role }`), not a `User` row — `req.user.userId` is `undefined`, and in Prisma `where: { userId: undefined }` **silently drops the filter** and matches every row. That was a real cross-tenant data leak in `uxReview.notifications.ts`, now fixed.
- **Do not trust the repo's status docs.** Several `.md` files claim "COMPLETE ✅ / FULLY TESTED" for work that is partial and whose tests cannot run.

---

## Open decisions

**Live code is now clean — zero type errors in anything that executes.** Every remaining error is inside an unreachable file, so every remaining decision is "delete this feature, or revive and finish it." None of them is blocked on engineering effort.

Ordered by leverage:

| # | Decision | Notes |
|---|---|---|
| 1 | **Delete the unwired AI-prediction + NLP smart-search features?** | `aiPredictions.routes.ts` (37 errors) has **zero references in the entire repo**; `nlp/smartSearch.ts` (23) is reachable only via `smartSearch.routes.ts`, itself unreferenced. Deleting both removes **~68 errors with no schema change**. Highest-leverage call available. If wanted, they need a schema design pass first. |
| 2 | **Delete `cacheExampleController.ts`?** | 8 errors, no importers, named "example". Looks like scaffolding. |
| 3 | **Delete the other unreachable modules?** | `uxReview.bulk.routes.ts` (5), `approvalWorkflow.service.ts` (4, route commented out at `routes/index.ts:58`), `iotSecurity.service.ts` (2), `visitorManagement.routes.ts` (1), `jobMonitorService.ts` (1), plus the `iotSecurity` crypto bug — real defects but in code that never loads. Delete, or fix-and-wire? |
| 4 | **Predictive/ML layer — repair or shelve?** | Repair = rewrite 3 Python scripts against `Rental`/`Lease`/`Transaction` + decide the income/expense mapping. Shelve = remove routes and scripts, keep the working rule-based `api-simple.py`. Note the **live** tenant-prediction endpoint is non-functional regardless: it feeds the model three effectively-constant features (`missed_payments` always 0, `credit_score` 650, `rent_amount` 1500) and calls a Flask service that **is not running** on :5001 (verified — no response). |
| 5 | **`mobile/` removal** | Evidence complete — it is not in the `workspaces` array and `propertyapp/` is a superset. |
| 6 | **`.git` history shrink** | Still ~244 MB. Requires `git filter-repo`/BFG + force-push, rewriting every commit hash. **Needs explicit approval.** |

---

## Remaining error distribution (109)

| Cluster | Count | Nature |
|---|---|---|
| `TS2339` missing properties | 47 | Model drift — needs the schema decision |
| `TS2353` object-literal excess property | 27 | Model drift — needs the schema decision |
| `TS2322` type not assignable | 14 | Mixed |
| `TS2551` property does not exist | 9 | **Judgement** — see the trap note below |
| `TS2367` no overlap | 6 | Real logic bugs — see finding 5 |
| `TS2345` argument not assignable | 5 | Mixed |
| `TS2304` cannot find name | 1 | `UpdateUnitDto` in `unitService.ts:366` (unreachable) |

Seven clusters, down from nineteen. `TS2339 + TS2353 + TS2551 = 83` is the model-drift family — `units`, `Payment`, `moveInDate`, `credit_score`, `income_range`, `employment_status`, etc. **But per finding 8, all of it is in code that never loads**, so the family is far less daunting than it looks: most of it disappears by deleting two unwired features rather than by changing the schema.

Largest single offenders: `aiPredictions.routes.ts` (37), `nlp/smartSearch.ts` (23), `cacheExampleController.ts` (8), `uxReview.bulk.routes.ts` (5), `approvalWorkflow.service.ts` (4). **All five are unreachable.**

### The `TS2551` trap — do not fix these by renaming

The pattern is code reaching for a relation (`maintenanceRequest.rental`, `approvalInstance.workflow`, `user.SecuritySettings`) where only the FK scalar exists (`rentalId`, `workflowId`, `securitySettings`). TypeScript helpfully suggests renaming to the `...Id` scalar — **which compiles cleanly and silently turns an object into a string.** The real fix is usually adding `include: { Rental: true }`, so these need per-site judgement, not a sweep.

### Mechanical work is exhausted — and so is the useful work in dead code

`TS7006`, `TS2561`, `TS7017`, `TS7053`, `TS18046`, `TS2341`, `TS2698`, `TS2741`, `TS2801`, `TS18047`, `TS18048`, `TS2306`, `TS1192`, `TS7016` are **all at zero**, and no further mechanical cluster of comparable size exists. Every cluster still open is either model drift in unreachable files or per-site judgement.

**Do not keep sweeping the remaining 109.** Per finding 8, none of them is in live code. The productive next moves are the deletion decisions below — each one removes errors in bulk and reduces the amount of unverifiable code in the repo. Further type work here is polishing code that cannot execute.

### The subsystem that was quietly deleted

`schedulerService.ts` was removed in `792702eb` after it emerged that **fixing its 4 errors would have required building a whole feature**: `reportingService.js` is a 10-line require-only stub with **zero exports**; `analyticsService.ts` is a 4-line orphan fragment; `notificationService.sendScheduledExportEmail` and `.sendFailureNotification` are **called but defined nowhere in the repo**; and there is **no `ScheduledReport` model in `prisma/schema.prisma`** (the `ScheduledReport.js` file is a Sequelize model, called via the Prisma API, and throws on load). The service was also never loaded, thanks to the elision in finding 9.

`reportingService.js` and `analyticsService.ts` were **deliberately left in place** — each still has a consumer (`routes/reports.js:10`, and `routes/analytics.js:3` + `reportingService.js:6` respectively), so deleting them would have traded one broken import for another. They are unreachable in practice but not orphaned. **Revisit only if the scheduled-export feature is wanted.**

---

## How to run

```bash
cd /Users/bujin/Documents/Projects/PropertyAI
npm install                    # always from the REPO ROOT — never inside a workspace

cd backend
npm run dev:node               # dev server, binds :3001 (Redis errors are expected)
npm run typecheck              # tsc --noEmit — the deliberate type gate
npm run build && npm start     # emits dist/ despite errors, then runs it
```

Redis is not running; start it to silence the `ECONNREFUSED` noise. Postgres is already up.
