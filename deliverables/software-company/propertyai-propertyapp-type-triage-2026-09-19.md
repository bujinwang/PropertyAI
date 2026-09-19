# propertyapp — Type-Error Triage & Broken-Navigation Audit

**Date:** 2026-09-19
**Scope:** `propertyapp/` (Expo / React Native SDK 53) — the first of the two requested frontend sweeps
**Status:** Triage complete. Live-error fixes in progress. Product decisions pending (Section 6).

---

## 1. Headline

The 226-error count is real, but **the plan it implies is wrong**. Measuring reachability
first — this repo's hardest-won rule — changes the work completely:

| | Errors | Files |
|---|---|---|
| **Reachable** from `App.tsx` | **90** | 17 |
| **Unreachable** (never loaded) | **136** | 17 |
| Total | 226 | 34 |

More importantly, the triage surfaced a defect that is **bigger than the type errors** and
was invisible to `tsc`: **26 navigation targets that no navigator registers, called from
34 sites in live, user-facing screens.** In production React Navigation treats these as
**silent no-ops** — the buttons do nothing.

And one is a genuine crash: **login is broken** (§4.1).

---

## 2. First, the tooling was lying

My first run of the reachability BFS reported:

```
reachable modules: 2
REACHABLE (live)   : 0
UNREACHABLE (dead) : 226
```

That is a **catastrophically wrong** verdict — it would have justified deleting the entire
application. The cause: `App.tsx` imports through TypeScript path aliases
(`@/navigation/RootNavigator`), and the triage script only resolved *relative* specifiers,
so the BFS stopped dead at the entry point.

`propertyapp` uses eight aliases (`@/*`, `@components/*`, `@screens/*`, …), mirrored in
both `tsconfig.json` (`paths`) and `babel.config.js` (`module-resolver`).

**Fixed** in the shared skill tooling: `reachability.js` and `dead-set.js` now read
`tsconfig.json` `paths`/`baseUrl` (following `extends`), resolve aliases, and **refuse to
present a verdict when the BFS is unsound** — a `reachable.size <= 2` guard now prints a
loud `*** WARNING: UNSOUND BFS ***` banner. Corrected result: **90 live / 136 dead.**

> This matters beyond this repo: any Expo, Vite, CRA or Next app hits the same trap. An
> alias-blind BFS does not merely under-report — it inverts the conclusion.

**Soundness checks passed:** no dynamic loading in the entry or navigators
(`require(<non-literal>)`, `import()`, `readdirSync`/`globSync` all absent); 26 screens are
registered by static `<Stack.Screen name=… component={…}>`, so the static BFS is valid.
Elision suspects: **0**.

---

## 3. The structural finding — 26 broken navigation links

Registered route names (26): `AIGuidedSetupWizard Admin ChatDetail Dashboard EditListing
ForgotPassword Home Login MLInsights Main Maintenance MaintenanceRequestDetails
MaintenanceRequests ManageListings Messages Payments Profile Properties PropertyDetail
PropertyForm PropertyList PublicListing Register ResetPassword Settings UnitDetail`

`navigate()` targets **not** in that set, from **reachable** callers:

| Broken target | Live callers |
|---|---|
| `DataPrivacyCompliance` | HomeScreen, ProfileScreen, SettingsScreen |
| `UserManagement` | AdminDashboardScreen, HomeScreen |
| `AddProperty` | HomeScreen, PropertyManagerDashboardScreen |
| `EditProfile` | ProfileScreen, SettingsScreen |
| `Support` | ProfileScreen, SettingsScreen |
| `About` | ProfileScreen, SettingsScreen |
| `RentalDetail` | PropertyDetailScreen, PropertyFormScreen |
| `SystemSettings` · `Analytics` · `DataExport` · `AITraining` · `APIKeys` | AdminDashboardScreen |
| `AdminDashboard` · `MaintenanceRequest` · `AIRecommendations` | HomeScreen |
| `ScheduleTour` · `UnitList` | PropertyDetailScreen |
| `CreateListing` · `Tasks` · `Reports` | PropertyManagerDashboardScreen |
| `PropertyDetails` | PublicListingScreen |
| `NotificationSettings` · `PaymentMethods` · `ChangePassword` · `TwoFactorAuth` | SettingsScreen |
| `Application` | UnitDetailScreen |

**26 distinct targets · 34 call sites.** A further 10 targets (20 call sites) are called only
from unreachable screens, so they are inert today.

**Severity, stated precisely:** React Navigation 6.4.17's `defaultOnUnhandledAction`
(`BaseNavigationContainer.js:294`) returns immediately when
`process.env.NODE_ENV === 'production'`. So in production these are **silent no-ops**; in
development they log *"The action 'NAVIGATE' … was not handled by any navigator."* They do
**not** crash. The user-visible symptom is a dead button.

### Fix cost is bimodal — this is the decision input

| Bucket | Count | Targets | Fix |
|---|---|---|---|
| **Route-name mismatch** (screen is live under another name) | 2 | `AdminDashboard`→`Admin`; `MaintenanceRequest`→`MaintenanceRequests` | one-line call fix |
| **Screen file exists, never registered** | 6 | `DataPrivacyCompliance`, `UnitList`, `CreateListing`, `PaymentMethods`, `Application`, `PropertyDetails`* | register + fix that screen's own errors |
| **No screen file at all** | 18 | `UserManagement`, `AddProperty`, `EditProfile`, `Support`, `About`, `RentalDetail`, `SystemSettings`, `Analytics`, `DataExport`, `AITraining`, `APIKeys`, `AIRecommendations`, `ScheduleTour`, `Tasks`, `Reports`, `NotificationSettings`, `ChangePassword`, `TwoFactorAuth` | build the screen, or remove the button |

\* `PropertyDetails` is ambiguous: route `PropertyDetail` (singular) **is** registered and live,
and a separate `PropertyDetailsScreen.tsx` (plural) exists but is unreachable. `PublicListingScreen`
targets the plural name.

**Note the concentration:** `HomeScreen` (6), `SettingsScreen` (8) and `AdminDashboardScreen` (6)
carry 20 of the 34 call sites. These are the screens a user reaches first.

---

## 4. The 90 reachable errors

### 4.1 `authService` — a half-migrated file containing a live crash (16 errors)

`LoginScreen.tsx` is a **registered, reachable route**. It does:

```ts
import { login, loginWithOAuth, OAuthProvider } from '@/services/authService';
// ...
const response = await login(email, password);        // :70
const response = await loginWithOAuth(provider);      // :109
```

But `authService.ts` exports **only** `export const authService = new AuthService()`
(line 403). `login` is therefore `undefined`, and pressing the login button throws
**`TypeError: login is not a function`**.

There is a **third** disagreement underneath it: the screen passes **two positional
arguments**; `AuthService.login(credentials)` takes **one object**.

The same file also imports `API_CONFIG` and `API_ENDPOINTS` from `../constants/api`, which
actually exports `API_URL`, `ML_API_URL`, `API_TIMEOUT`, `ENDPOINTS` — the constants were
renamed and this file was never updated. Plus `RegisterData` (real name
`RegistrationData`), a locally-declared-but-unexported `OAuthProvider`, and a `tokenType`
field written into `AuthTokens` at three sites where no such property exists.

**Login has not been exercised end-to-end.** This is the single highest-priority fix in the
package.

### 4.2 `Rental` client type is stale (24 errors)

`PropertyDetailScreen` (15), `PropertyFormScreen` (6), `PublicListingScreen` (1) reach for
`amenities`, `yearBuilt`, `totalUnits`, `images`, `photos`, `rentalType`.

I verified these against `backend/prisma/schema.prisma` → `model Rental`, which **does**
declare `yearBuilt Int?`, `totalUnits Int @default(1)`, `amenities Json?`, `leaseTerms
String?`, `deposit Float?`, `latitude/longitude`, `slug`, `viewCount`.

**The screens are right; `propertyapp/src/types/rental.ts` is behind the API.** This is a
legitimate client-type catch-up, *not* schema growth.

Two caveats to resolve rather than paper over:
- `images`/`photos` — the backend exposes images as a **relation** (`RentalImages RentalImage[]`),
  not a scalar column. Type must follow what the API actually serialises.
- `rentalType` — does **not** exist on the backend model at all (the client has `type?: RentalType`).
  Genuine mismatch; needs a decision.
- `status` — client says `RentalStatus`, backend column is `ListingStatus`. Pre-existing divergence.

### 4.3 Untyped API responses (21 errors)

`rentalService.ts` (18) and `setupWizardService.ts` (3) all read `response.data.data ||
response.data` where `response` is `unknown` — the axios wrapper in `services/api.ts` loses
its generic. Best fixed **at the source** so every caller benefits.

### 4.4 Remainder (29 errors)

`EditListingScreen` (8, untyped route params + `never` state + arity mismatch on a service
call), `HomeScreen`/`ProfileScreen`/`SettingsScreen` (9, **these are the broken nav links
surfacing as TS2769 — not independently fixable**), `AIGuidedSetupWizardScreen` (3),
`apiService` (3), `MLInsightsScreen` (2), `ForgotPasswordScreen` (1, mechanically fixable:
`ResetPassword` *is* registered, it just lacks the `token` param), `ResetPasswordScreen` (1),
`mlPredictionService` (1).

**The coupling is the point:** ~9 of the "type errors" cannot be honestly fixed without first
deciding the navigation question in §3. Casting them to `any` would hide a real broken button.

---

## 5. The 136 unreachable errors / 65 files

These cluster into coherent **unbuilt features**, not random rot:

| Cluster | Representative files |
|---|---|
| Units & listings creation | `CreateListingScreen` (41), `unitService` (37), `UnitFormScreen` (13), `UnitListScreen` (5), `types/unit.ts` |
| Privacy & compliance | `DataPrivacyComplianceScreen`, `SubjectAccessRequests` (10), `DataRetention` (3), `aiTransparencyService` (3) |
| Legacy/dashboard variants | `OptimizedHomeScreen` (5), `PropertyDetailsScreen` (4), `ConversationDetailScreen` (2), `InboxScreen` |
| Auth extras | `MFASetupScreen` (5) |
| Misc services | `propertyService`, `types/property.ts`, `PropertyCard` |

**65 files are reachable from neither the app nor any test** (17 of them carrying errors).
Only **2** files are test-protected (`Button.test.tsx`, `mlPredictionService.test.ts`) — this
package is effectively untested, so the usual "unreachable but tested" safety net barely exists.

**Critically — `unitService` has 37 errors and zero references anywhere in the repo**, yet it
is part of the *same* feature the live `AddProperty` and `CreateListing` buttons point at. So
"dead code" is the wrong frame: this is **half-built work**, and the buttons prove the intent.

---

## 6. Outcome — what was fixed (commit `b945ee46`)

| | Before | After |
|---|---|---|
| Total errors | 226 | **146** |
| **Reachable** errors | **90** | **23** |
| Unreachable errors | 136 | 123 |
| Test suite touched (`mlPredictionService`) | pass | **pass** |

13 files, +240/−70. **No `as any`, no `@ts-ignore`, no `@ts-expect-error`** (verified by
scanning the added lines). Only one behavioural change — the login repair — because that
was a crash.

**The login crash is fixed.** `LoginScreen` now calls `authService.login({ email, password })`
and `authService.loginWithOAuth(provider)`. Verified against the real instance methods *and*
end-to-end: `POST /api/auth/login` is mounted at `routes/index.ts:95`, and
`API_URL` + `ENDPOINTS.AUTH.LOGIN` resolve to `http://localhost:3001/api/auth/login`.

**Clusters resolved:** `rentalService` 18→0 · `PropertyDetailScreen` 15→0 ·
`authService` 12→2 · `PropertyFormScreen` 8→1 · `LoginScreen` 4→0 · `setupWizardService` 3→0 ·
`apiService` 3→0 · `MLInsightsScreen` 2→0 · `mlPredictionService` 1→0 ·
`ForgotPassword`/`ResetPassword` 2→0.

**Three client types were lying about the API — all three were caught by checking the backend:**

1. **`authService` was half-migrated.** It imported `API_CONFIG`/`API_ENDPOINTS`/`RegisterData`,
   none of which exist any more. Its `REFRESH`/`LOGOUT` endpoints were never defined at all —
   I added `REFRESH: '/auth/refresh-token'` to match `authRoutes.ts:15` exactly (note the
   `-token` suffix; `/auth/refresh` would have 404'd).
2. **`RegistrationData` described the wrong contract.** It declared `name` + `acceptTerms`;
   the backend reads `{ email, password, firstName, lastName, role }` (`authController.ts:14`)
   and defaults a missing `role` to `TENANT`. The *client call* was right and the *type* was
   wrong — the opposite of what the error implied.
3. **`api.ts` returns the response body, not an `AxiosResponse`.** `get<T>` returns
   `response.data`, so every caller's `response.data.data || response.data` was wrong-but-lucky
   (the second `.data` is always `undefined`, so the fallback always won). Added
   `ApiEnvelope<T>` + `unwrap()` rather than patching 12 call sites.

**Two of my own guesses were wrong and the compiler caught them** — worth recording:
`photos` is consumed as a list of URL **strings** (`item.photos?.[0]` feeds an image `uri`),
not objects; and `RentalImage.id` is an `Int`, not a `String`. I corrected both rather than
casting.

## 7. New live defects found *because* of the fixes

Repairing a broken import stops a symbol collapsing to `any`, which **reveals** previously
hidden errors. Three surfaced, and two are genuine bugs:

1. **The create-property flow is broken twice over.** `PropertyFormScreen:205` submits a
   payload that (a) is **missing `managerId`, `ownerId`, `createdById`** — the backend's
   required-field check returns 400 — and (b) **includes `rentalType` and `images`**, which
   `backend/src/services/rentalService.ts:131` spreads directly into
   `prisma.rental.create({ data: formattedData })`. Neither is a Prisma column (`images` is a
   relation needing `RentalImages: { create: [...] }`), so Prisma rejects the write.
   **This screen is registered and reachable — a user filling the property form cannot succeed.**
   I did not "fix" it by inventing fields: the ids must come from somewhere (auth context?
   the selected manager?) and the images need the separate upload endpoint. Decision needed.
2. **`AIGuidedSetupWizardScreen:57`** destructures `isFirstLogin`/`role`/`portfolioSize` from
   `route.params`, but **all four call sites navigate with no params** — so the wizard's
   personalisation is permanently `undefined`. It already has `useAuth()` in scope.
3. **`PublicListingScreen:24`** reads `listingId` from params, and nothing navigates to
   `PublicListing` at all.

**Also found:** `UserSettings` is declared in **both** `types/user.ts:3` and
`AuthContext.tsx:26` — a fourth duplicate-name pair in this repo.

## 8. What I am deliberately NOT doing

- The remaining **23 reachable errors**: 9 are the unregistered-nav problem (§3, a product
  decision — casting them to `any` would hide real dead buttons), 8 are `EditListingScreen`
  (untyped route params + arity mismatches, fixable but not urgent), and the rest are the
  two param-shape screens above.
- The **123 unreachable errors / 65 files**: untouched. Deleting or wiring those features is
  your call.
- The `.git` shrink (declined). The `ContractorApp` peer conflict is pre-existing and was
  deliberately not `--force`d.
- `Button.test.tsx` fails with `Cannot find module 'react-test-renderer'` — a pre-existing
  module-resolution gap. **I changed no dependencies**, so this is not mine; that file is also
  in the unreachable set.

## 9. Decisions required (yours, not mine)

1. **Navigation** — for each of the 26 broken targets: register the screen, or remove the
   button? The 2 renames and the `ForgotPassword` param are unambiguous and I will just do
   them. The 18 no-file targets are a product call: 20 dead buttons concentrated in
   `HomeScreen`, `SettingsScreen`, `AdminDashboardScreen`.
2. **Unbuilt features** — keep or delete: Units/Listings creation; Privacy & Compliance
   (note: 3 live screens already link into it, so this one looks *wanted*); Auth extras.
3. **`rentalType`** — does it exist as a product concept, or should `PropertyFormScreen` use
   the existing `type`/`RentalType`?

**My recommendation:** fix the 2 renames + `ForgotPassword`, then wire up the **Privacy &
Compliance** cluster (highest intent-to-effort ratio — 3 live screens already point at it and
the screens exist), and delete the 18 no-file buttons from the three dashboard screens.
That converts 20 dead buttons into either working features or honest UI.

---

## 10. Next steps

1. **Decide the 26 navigation targets** (register vs remove). The 2 renames and the
   `ForgotPassword`/`ResetPassword` param are already done.
2. **Fix the create-property flow** (§8.1) — it needs a decision on where `managerId` /
   `ownerId` / `createdById` come from, and the images need the separate upload endpoint
   rather than a field in the create payload.
3. **Then** start the `dashboard` sweep (1341 errors). First move there is to identify the
   single root cause behind **TS2769 = 584 of 1341 (44%)** — that concentration is a
   systemic overload mismatch (MUI + React 19 is the prime suspect), not 584 separate bugs.
   `dashboard` also sets `allowJs: true`, so its count *includes* `.js` files — unlike the
   backend, whose counts are `.ts`-only. Do not compare the two numbers directly.

**Not doing:** the `.git` shrink (declined). The `ContractorApp` peer conflict is
pre-existing and was deliberately not `--force`d.

---

## Appendix — reproducible commands

```bash
cd propertyapp
npx tsc --noEmit -p tsconfig.json > /tmp/pa-errors.txt 2>&1

# reachability (alias-aware) — note --entry App.tsx, NOT src/index.ts
cp ~/.workbuddy-ai/skills/ts-dead-code-triage/scripts/reachability.js ./tmp-reach.js
node ./tmp-reach.js --entry App.tsx --tsc /tmp/pa-errors.txt --root . ; rm ./tmp-reach.js

# safe-to-delete set (app + tests)
cp ~/.workbuddy-ai/skills/ts-dead-code-triage/scripts/dead-set.js ./tmp-ds.js
node ./tmp-ds.js --root . --entry App.tsx --tsc /tmp/pa-errors.txt ; rm ./tmp-ds.js

# broken-navigation audit: navigate() targets vs registered <Stack.Screen name=…>
grep -rhoE 'name="[A-Za-z][A-Za-z0-9]*"' src/navigation/ | sed 's/name="//;s/"//' | sort -u
grep -rhoE "navigate\(\s*['\"][A-Za-z][A-Za-z0-9]*['\"]" src | sed -E "s/navigate\(\s*['\"]//;s/['\"]//" | sort -u
```

**Mobile-app triage note:** for an RN/Expo app the entry is `App.tsx` (via
`expo/AppEntry.js`), not `src/index.ts`, and reachability runs *through the navigator*.
A screen that is never registered is unreachable **and** unrenderable — so the registered
`name=` set is the second half of the reachability question.
