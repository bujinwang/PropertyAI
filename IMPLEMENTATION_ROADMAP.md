# PropertyFlow AI — Implementation Roadmap

**Last verified:** 2026-09-17 · **Verified at commit:** `f7b76e47`
**Phase 0 status:** toolchain repaired, ML API consolidated, three of six defects fixed
**Previous version of this file:** dated 2024-01-06, substantially inaccurate (see §2)

> This document is verified against the actual repository — git history, file
> contents, and dependency state — not against prior planning documents. Every
> claim in §2 was checked by reading the code. Where something could not be
> verified, it is marked as such.

---

## 1. Repository state snapshot

| Fact | Value |
|---|---|
| Last commit before this session | `b70fa2d8`, **2025-10-05** (≈11 months idle) |
| Branch state at session start | `main`, exactly in sync with `origin` (0 ahead, 0 behind) |
| Remote | `https://github.com/bujinwang/PropertyAI.git` |
| Uncommitted work found | ~2,500 lines of ML integration, untracked since 2025-10-06 |
| Tracked junk found | `backend/src/predictive-analytics/venv/` — **12,701 files, 313 MB on disk** |
| `.git` size | ~244 MB (history not yet rewritten) |
| Installed dependencies | **none** — a fresh clone had no `node_modules` anywhere |
| CI | none — `.github/workflows/` is gitignored and no workflow files are tracked |

### Components

This is an **npm workspaces monorepo**. The root `package.json` declares exactly
four workspaces: `backend`, `dashboard`, `ContractorApp`, `propertyapp`.

| Path | What it is | Source files | Status |
|---|---|---|---|
| `backend/` | Express + Prisma + PostgreSQL/MongoDB/Redis API | ~1,043 | Active |
| `dashboard/` | React 19 + Vite + MUI web app for managers/admins | 524 | Active |
| `propertyapp/` | Expo React Native app (SDK 53 / RN 0.74.5) | 147 | **Active mobile app** |
| `ContractorApp/` | Expo React Native app for contractors | 9 | Active, minimal |
| `mobile/` | Expo React Native app (SDK 53 / RN 0.79.5) | 39 | **Orphaned — not a workspace** |

### The `mobile/` vs `propertyapp/` question

These are the **same product built twice**, not two different apps.

- `propertyapp/` came first (first commit 2025-07-14) and is the canonical app:
  it is a declared workspace, it has 47 screens to `mobile/`'s 13, and every
  screen in `mobile/` has a superset counterpart in `propertyapp/`.
- `mobile/` was a later rewrite attempt (first commit 2025-09-14) that stalled
  (last touched 2025-09-30) — work then resumed in `propertyapp/` on 2025-10-06.
- Decisive: **`mobile/` is not in the root `workspaces` array**, so
  `npm install` never touches it and no root script can build or test it.

**Recommendation:** treat `propertyapp/` as canonical. `mobile/` is dead weight
carrying a second copy of the auth flow, API layer, and offline storage. Archive
it (e.g. `git mv mobile/ archive/mobile-2025-09/`) rather than deleting, then
remove it from the tree. **Not yet actioned — awaiting a decision.**

---

## 2. Verification of the previous roadmap's claims

The previous version listed 18+ "remaining TODOs". **Most were already done.**
Re-verified by reading each file:

| Previous claim | Verified status | Evidence |
|---|---|---|
| `MarketingCampaigns.tsx:120` — implement save campaign API call | ✅ **DONE** | Calls the API and reloads; no TODO remains |
| `MarketingPromotions.tsx:167` — implement save promotion | ✅ **DONE** | No TODO remains; `marketingService.ts` exists |
| `MarketingSyndication.tsx:208` — manual sync | ✅ **DONE** | No TODO remains |
| `audit.ts:29,58,87,116,158` — implement audit API calls | ✅ **DONE** | Full `auditAPI.createLog` → `POST /audit/log` with bearer auth |
| `TenantRatingPage.tsx:62` — edit modal | ✅ **DONE** | Shipped in `3e748d59` |
| `ReportGenerator.tsx:128` — report scheduling | ✅ **DONE** | Shipped in `33841308` |
| `UnitsList.tsx:47` — invalidate queries / parent callback | ◐ **PARTIAL** | Callback fires, but `handleAssignSubmit` only `console.log`s — assignment is never persisted |
| `ThemeSwitcher.tsx:40` — theme switching | ✅ **DONE** | No TODO remains |
| `alertGroups.routes.ts:322` — admin role check | ✅ **DONE** | `authMiddleware.checkRole([UserRole.ADMIN])` is present |
| `NetworkContext.tsx:18` — NetInfo detection | ✅ **DONE** | Real `NetInfo.fetch()` + `addEventListener` |
| `notificationService.ts:200` — send token to backend | ✅ **DONE** | Posts to `/api/notifications/register-device` |
| `ForgotPasswordScreen.tsx:26` — password reset API | ✅ **DONE** | Uses `useAuth().forgotPassword` |
| Mobile offline sync queue (`MaintenanceScreen:117`, `PaymentsScreen:126,150`) | ✅ **DONE** | Writes locally via `offlineStorageService`, syncs when connected |
| Mobile token refresh (`paymentService`/`maintenanceService`/`propertyService:40`) | ✅ **DONE** | Implemented in `authService.ts`, `api.ts`, `apiService.ts`, `secureStorage.ts` |
| `predictiveModels.ts:9` — integrate real ML model API | ◐ **PARTIAL** | Calls an ML API, but targets the wrong port and hardcodes inputs (§3.2) |
| `ContractorApp/src/screens/ProfileScreen.tsx:212,220` — navigate to settings | ❌ **STILL OPEN** | Two literal `{/* TODO: Navigate to ... */}` stubs |

**Conclusion:** the old roadmap would have sent a developer to rebuild roughly
14 already-shipped features. It has been replaced by this document.

---

## 3. Defects — status

Three of the six defects found in the first pass were fixed in Phase 0 and are
marked **✅ RESOLVED** below; each records the commit and the evidence. The
remaining three are still open.

| # | Defect | Status |
|---|---|---|
| 3.1 | ML API split across two apps on two ports | ✅ Resolved (`f7b76e47`) |
| 3.2 | Backend predictions run on hardcoded placeholder inputs | ❌ Open |
| 3.3 | Four service methods call non-existent `/api/ml/*` routes | ✅ Resolved (`f7b76e47`) |
| 3.4 | Occupancy and rent predictions are not ML | ❌ Open |
| 3.5 | ML test suite cannot run; assertions stale | ✅ Resolved (`bf0cdc64`, `f7b76e47`) |
| 3.6 | Unit assignment in the dashboard is not persisted | ❌ Open |

### 3.1 The ML API is split across two apps on two ports — ✅ RESOLVED (`f7b76e47`)

**Resolution.** Port **5000 is occupied by macOS ControlCenter (AirPlay
Receiver)** — confirmed with `lsof -nP -iTCP:5000 -sTCP:LISTEN`, which shows
`ControlCe` listening on `*:5000`. `api.py`'s default port therefore can never
bind on this machine, which means the backend's production prediction path had
never worked. That settled the choice: **`api-simple.py` on 5001** (Flask-only,
no numpy/pandas/joblib) is canonical.

What changed:
- `api-simple.py` gained the `/api/predict/tenant-issue` route that only `api.py`
  had, so the backend's production path now has a real endpoint. Verified by
  running the service and curling it — `/health` returns
  `{"mode":"rule_based_only",...}`, the new route returns the expected contract
  with `risk_score: 0.9`, a missing required field returns HTTP 400, and the
  existing `/predict/churn` still returns HTTP 200.
- `predictiveModels.ts` default `ML_API_URL` → `localhost:5001`.
- `backend/.env.example` now documents `ML_API_URL` and `ML_API_PORT`.
- `api.py` carries a header comment recording that it is the model-backed
  variant, that `models/` is empty so its ML paths are dead, and that its port
  conflicts with AirPlay.

**Original finding (for reference).**

There are **two** Flask ML services and the consumers disagree about which to use:

| Flask app | Default port | Routes | Mode |
|---|---|---|---|
| `backend/src/predictive-analytics/api.py` | **5000** | `/health`, `/api/predict/tenant-issue`, `/api/predict/anomaly`, `/api/predict/financial-forecast` | numpy/pandas/joblib (needs model files) |
| `backend/src/predictive-analytics/api-simple.py` | **5001** | `/health`, `/predict/churn`, `/predict/maintenance` | rule-based, no models |

Who points where:

| Consumer | Target | Serves it? |
|---|---|---|
| `backend/src/utils/predictiveModels.ts:20` (production) | **:5000** `/api/predict/tenant-issue` | only if `api.py` runs |
| `backend/src/__tests__/integration/ml-api.test.ts:3` | **:5001** `/predict/churn` | only if `api-simple.py` runs |
| `propertyapp/src/constants/api.ts:4` | **:5001** | only if `api-simple.py` runs |
| `start-ml-api.sh` | starts **`api-simple.py` on 5001** | — |

**Impact:** the documented startup path (`start-ml-api.sh`) serves the mobile app
and the backend test, but **not** the backend's own production prediction path —
which silently degrades to rule-based output. `backend/src/predictive-analytics/models/`
is also empty, so `api.py`'s model loads would likely fail even if started.

**Fix needed:** pick one canonical service and port, route all three consumers at
it, add `ML_API_URL` to `backend/.env.example`, and document it.

### 3.2 Backend predictions run on hardcoded placeholder inputs

`backend/src/utils/predictiveModels.ts:43-44` sends:

```
credit_score: 650,   // Placeholder - could be from tenant profile
rent_amount: 1500,   // Placeholder - could be from lease data
```

Real tenant data was never wired in, so every backend prediction is computed from
the same two invented values regardless of the tenant.

### 3.3 Four mobile ML service methods call routes that do not exist — ✅ RESOLVED (`f7b76e47`)

**Resolution.** All four had zero call sites. `getModelHealth` now calls the
Flask `/health` and adapts its response; `batchPredictChurn` loops over
`predictChurnRisk`; `getChurnHistory` and `getMaintenanceHistory` were removed —
they require a persistence layer that exists nowhere in the stack. The service
no longer imports `../api` at all.

**Original finding (for reference).**

`propertyapp/src/services/mlPredictionService.ts` calls `/api/ml/health`,
`/api/ml/predict/churn/batch`, `/api/ml/predict/churn/history/:id`, and
`/api/ml/predict/maintenance/history/:id`. **No `/api/ml/*` route exists in the
backend** — `app.ts` mounts only `/api/tenant-issue-prediction`. All four will 404.
(`aiPredictions.routes.ts` and `predictiveMaintenance.routes.ts` exist as files but
are never mounted.)

### 3.4 Occupancy and rent predictions are not ML

Two of the four "ML" predictions never call a model — their HTTP calls are
commented out in `mlPredictionService.ts` (lines ~259 and ~295) and the answers
are computed client-side from heuristics.

### 3.5 The ML test suite cannot run, and its assertions are stale

Two independent problems:

1. **The runner fails to load.** propertyapp's Jest/Babel chain breaks:
   `@react-native/babel-preset` cannot resolve
   `@babel/plugin-proposal-logical-assignment-operators`, and
   `react-native-reanimated` **v4** is hoisted to the root `node_modules` from
   `ContractorApp` (which pins `~4.0.0`) while `propertyapp` declares **no**
   reanimated at all — its Expo SDK 53 expects v3. Reanimated v4's Babel plugin
   additionally requires `react-native-worklets`, which is not installed.
2. **The assertions are stale.** `mlPredictionService.test.ts` mocks `../api` and
   expects `api.post('/ml/predict/churn')`, but the service calls
   `axios.post(ML_API_URL + '/predict/churn')` directly. It cannot pass.

**Fix needed:** pin `react-native-reanimated: ~3.17.4` in `propertyapp/package.json`
(matching `mobile/`), then rewrite the test to mock axios.

### 3.6 Unit assignment in the dashboard is not persisted

`dashboard/src/components/UnitsList.tsx:45` — `handleAssignSubmit` logs to the
console and closes the modal. The assign/unassign service call was never written,
so the UI reports success while nothing is saved.

---

## 4. Repo hygiene

| Item | Status |
|---|---|
| Python venv untracked from index | ✅ **DONE** (`35f1972b`) — 12,701 files removed from the index, all files intact on disk |
| `venv/`, `__pycache__/`, `.pytest_cache/`, `.egg-info/` added to `.gitignore` | ✅ **DONE** |
| `.workbuddy/`, `.workbuddy-ai/` gitignored | ✅ **DONE** (`cfe46165`) |
| ML integration work rescued into git | ✅ **DONE** (`9c3551c0`) |
| Misleading status docs corrected | ✅ **DONE** — four root-level ML docs now carry a status-correction block |
| propertyapp Jest/Babel toolchain repaired | ✅ **DONE** (`bf0cdc64`) — suite now runs; 5/5 pass |
| ML API consolidated on one service and port | ✅ **DONE** (`f7b76e47`) |
| `.git` history shrunk (244 MB) | ⛔ **NOT DONE** — the venv still exists in history. Shrinking requires `git filter-repo`/BFG plus a force-push, which rewrites every commit hash. **Requires explicit approval; deliberately not attempted.** |
| `mobile/` orphaned app removed | ⛔ **NOT DONE** — awaiting decision (§1) |

### Phase 0 follow-ups discovered while fixing the above

1. **`package-lock.json` is internally inconsistent.** It lists
   `@babel/plugin-proposal-logical-assignment-operators` as a dependency of
   `@react-native/babel-preset` but carries no resolved entry for the package
   itself, which is why npm silently skipped it. The explicit root devDependency
   added in `bf0cdc64` works around this for the one package that surfaced, but
   the lockfile is worth regenerating properly (`rm package-lock.json && npm
   install`, then review the diff) to catch any other declared-but-unresolved
   entries.
2. **The backend does not type-check: 452 `tsc --noEmit` errors.** The dominant
   cause is that `@prisma/client` has never been generated — many errors are
   `Module '"@prisma/client"' has no exported member ...` and
   `Cannot find module '../lib/prisma'`. Running `npx prisma generate` in
   `backend/` is the likely first fix and would be worth doing before treating
   the count as a real quality signal. Note the module `../lib/prisma` is
   referenced by several controllers but has never existed in this repo
   (`config/database.ts` is the real module) — the same mistake as the one fixed
   in `api.test.ts`.

| `.git` history shrunk (244 MB) | ⛔ **NOT DONE** — the venv still exists in history. Shrinking requires `git filter-repo`/BFG plus a force-push, which rewrites every commit hash. **Requires explicit approval; deliberately not attempted.** |
| `mobile/` orphaned app removed | ⛔ **NOT DONE** — awaiting decision (§1) |

---

## 5. Recommended sequencing

Sequenced against `deliverables/software-company/propertyai-feature-plan-2026-09-10.md`,
whose central finding is that the platform already covers ~80% of market table
stakes and the real gap is **depth, autonomy, and compliance** — not feature count.

### Phase 0 — Make the repo honest and runnable *(✅ 4 of 5 complete)*

1. ✅ **Fixed the propertyapp toolchain** (§3.5) — `bf0cdc64`. Tests run; 5/5 pass.
2. ✅ **Resolved the ML API split** (§3.1) — `f7b76e47`. One service
   (`api-simple.py`), one port (5001), one env var.
3. ✅ **Rewrote the stale ML test** to mock axios (§3.5) — `f7b76e47`.
4. ✅ **Resolved the four dead `/api/ml/*` calls** (§3.3) — `f7b76e47`. Two
   repointed, two removed.
5. ⛔ **Decide `mobile/`** — archive and remove (§1). **Still open; needs a
   product decision.** The evidence says `propertyapp/` is canonical and
   `mobile/` is dead, but removal is the user's call.

Two follow-ups surfaced during the fixes and are recorded in §4 — the
inconsistent `package-lock.json`, and 452 backend `tsc` errors that are largely
down to `@prisma/client` never having been generated.

### Phase 1 — Credible baseline + trust *(months 0–3, per the feature plan)*

Ordered by (value ÷ effort) using the plan's own ranking:

1. **Compliance guardrail layer v1** (T2.4) — fair-housing/ADA scanning, AI
   disclosure, audit trail. The plan flags this as the single highest execution
   risk: SafeRent's $2.275M settlement and HUD's May 2024 guidance make intent
   irrelevant to disparate-impact liability.
2. **Grounded AI listing/content generator** (T1.2) — highest-adoption, lowest-risk
   AI use case; must be factually grounded, since unedited AI output damages
   credibility.
3. **AI CMA + market summary** (T1.4) — top "power user" use case.
4. **Bulk SMS** (T2.10) — repeatedly the top CRM complaint; small effort.
5. **Virtual staging + photo enhancement** (T1.6).
6. **Syndication + listing-performance analytics** (T1.10).
7. **e-sign / lease workflow** (T1.11).

### Phase 2 — Differentiate on outcomes *(months 3–9)*

AVM with transparent comps and confidence (T1.3) · unified CRM + long-horizon
nurture (T1.5) · tenant screening with bias-audit hooks (T1.7) · maintenance
triage (T1.8) · rent collection + accounting (T1.9) · AI Voice (T2.1) ·
predictive seller intent (T2.2) · antitrust-safe revenue optimization (T2.5) ·
marketing attribution (T2.6) · executive insights dashboard (T2.7) ·
photo→listing data extraction (T2.11) · open API / PMS integrations (T2.9).

### Phase 3 — Moat *(months 9–18)*

Agentic multi-step performers (T3.1) · CV condition assessment → valuation (T3.2) ·
AI-search visibility / AEO (T3.3) · climate & ESG overlays (T3.4) · immersive 3D
tours (T3.5) · IoT predictive maintenance (T3.6) · autonomous underwriting (T3.7) ·
governance-as-a-service (T3.8) · white-label platform (T3.9).

### Open product questions blocking the above

From the feature plan's risk register — these change what gets built:

- **Which segment?** SMB landlords (Buildium/TurboTenant territory) vs 500+ unit
  operators (EliseAI, ~$25k minimum). This decides the depth of screening and
  accounting features.
- **Build or partner** for AVM, AI voice, and computer vision? HouseCanary, Restb.ai,
  and Ylopo all prove strong third-party layers exist.
- **What is the defensible data moat** against Zillow/Redfin/CoreLogic? The likely
  answer is proprietary operations/workflow data plus the compliance layer — not
  public-record valuation.

---

## 6. Quick start (corrected)

The previous version told you to run `npm install` inside each app directory. That
is wrong for this repo — it is an npm workspaces monorepo, and installing inside a
workspace causes npm to hoist into the root and can leave the tree inconsistent.

```bash
# Install everything from the ROOT, once
cd /Users/bujin/Documents/Projects/PropertyAI
npm install

# Then use the root workspace scripts
npm run dev:backend      # backend dev server
npm run dev:dashboard    # dashboard dev server
npm run test:propertyapp # mobile tests  (currently broken — see §3.5)
npm run lint:propertyapp
```

Database setup (backend):

```bash
cd backend
npx prisma generate
npx prisma migrate dev
npm run db:seed
```

ML API (see §3.1 before relying on this — it only starts the :5001 service):

```bash
cd backend/src/predictive-analytics
./start-ml-api.sh        # api-simple.py on :5001
```

**Note:** `npm install` currently emits `ENOTEMPTY` cleanup warnings in this
environment because the sandbox blocks npm's bulk-delete step. The install still
completes, but individual packages can be left corrupted (observed: `yargs` missing
`index.cjs`). If a tool fails to resolve a module, re-run `npm install` outside the
sandbox rather than assuming the dependency is genuinely missing.

---

## 7. Where the detail lives

| Document | What it is |
|---|---|
| `deliverables/software-company/propertyai-feature-plan-2026-09-10.md` | Competitor + demand research, 30 prioritized features, 62 cited sources. The strategic reference. |
| `docs/PropertyAI-Feature-Plan.md` | Earlier variant of the above |
| `PROJECT_DOCUMENTATION.md` | Architecture and component reference |
| `CLAUDE.md` / `AGENTS.md` | Tooling and agent-configuration guidance |
| `MOBILE_ML_*.md`, `ML_API_INTEGRATION_COMPLETE.md` | Historical ML status reports — **now carry status-correction blocks; treat as history, not current state** |
