# dashboard — Type-Error Sweep (Phase 1: Systemic Causes)

**Date:** 2026-09-19
**Commit:** `2e51b4bc`
**Scope:** `dashboard/` (React 19 + Vite + MUI 7) — the second half of the requested
"Both, propertyapp first" type sweep
**Result:** **1341 → 731 errors (−45%)** from three targeted fixes. No component logic changed.

---

## 1. Headline

| | Before | After |
|---|---|---|
| Total errors | 1341 | **731** |
| `TS2769` (no overload matches) | **584 (44%)** | **27** |
| `TS2304` (cannot find name) | 63 | 15 |

The decisive move was **not** fixing errors — it was noticing that **one diagnostic was 44% of
the backlog**, then reading a full error *block* instead of the summary line. That turned
"1341 problems" into **three** problems.

---

## 2. First: the tooling lied again — a different way

My reachability BFS initially reported:

```
reachable modules: 53   →   49 live / 1292 dead  ("96% of errors are dead code")
```

That is wrong, and the skill already warns about exactly this failure mode. `App.tsx` is a
code-split SPA:

```tsx
const RentalForm = lazy(() => import('./pages/RentalForm'));
```

The BFS matched only `import … from`, `export … from` and `require()`. **Dynamic `import()` is
a real load edge** in any bundler-based app, and here it is how ~100 pages load. One regex
changed the verdict completely:

```
reachable modules: 53  →  224
49 live / 1292 dead    →  340 live / 391 dead      (4% live  →  54% live)
```

Had I acted on the first number, I would have written off 1292 errors — including the entire
MUI Grid problem — as "dead code, delete it."

**Fixed in the skill:** both `reachability.js` and `dead-set.js` now follow `import()`.
A second class of missing-edge bug, same root cause as the alias bug from the propertyapp
sweep: *the BFS was missing an edge type, and a missing edge silently inverts the conclusion.*

**Also worth recording:** the entry is **`src/index.tsx`**, per `index.html`'s
`<script type="module" src="/src/index.tsx">` — not `src/main.tsx` as one might assume.
And `dashboard` declares `'@' → src` in `vite.config.ts` but **not** in `tsconfig.json` —
a latent hazard, but **0 files actually use it** (verified). Not a live cause; do not report
it as one.

---

## 3. The systemic fix — MUI Grid API migration (584 errors)

**The error block** (this is the whole story):

```
Property 'item' does not exist on type 'IntrinsicAttributes & GridBaseProps & ...'
  Overload 1 of 2 … Property 'component' is missing …
  Overload 2 of 2 … Property 'item' does not exist …
```

**Diagnosis.** The code uses **MUI v5's Grid API** — `<Grid item xs={12}>`. But
`@mui/material` is installed at **7.3.2**, where `Grid` is the *new* API (`size={{ xs: 12 }}`).
`item`, `xs`, `sm`, `md` do not exist on it. Every one of those 584 errors is that single
mismatch.

**The fix — an import alias, not a migration.** MUI ships `GridLegacy` for precisely this
transition, and `GridLegacy.d.ts` declares `item?: boolean` and
`xs?: boolean | GridLegacySize` — the API this code was written against:

```ts
import { Grid } from '@mui/material'
// →
import { GridLegacy as Grid } from '@mui/material'
```

**93 files, one line each.** Chosen deliberately over migrating hundreds of `<Grid>` call
sites to `size={{ xs: 12 }}`: same rendered output, a fraction of the risk, and the code keeps
working while a real migration is planned properly.

**Four files were excluded** because they already use the *new* API (`size={{...}}`, zero
`item` usage) — aliasing them would have broken working code:

```
src/screens/MarketIntelligenceScreen.tsx
src/pages/MarketIntelligenceScreen.tsx
src/components/market-intelligence/DemandForecastCharts.tsx
src/components/market-intelligence/MarketTrendsCharts.tsx
```

Result: **1341 → 784**, `TS2769` **584 → 27**.

> Note: `src/screens/MarketIntelligenceScreen.tsx` uses `<Grid>` with **no Grid import at
> all** — a separate defect in that file, left for the per-file phase.

---

## 4. Two more single-cause clusters (−53)

**a) `CommunityEngagementPortal.tsx` — 36 × `Cannot find name 'Table…'`.**
It renders 18 `<Table*>` elements but imports **none** of them (`Table`, `TableBody`,
`TableCell`, `TableContainer`, `TableHead`, `TableRow`). One import line. *Grouping a
"cannot find name" cluster by **file** rather than by name is what made this a one-file fix
instead of a global investigation.*

**b) `design-system/forms` — 12 × `Cannot find name 'ValidationMode'`, and a lying type.**
`index.ts` did `export type { ValidationMode } from './FormProvider'` and then **used**
`ValidationMode` as a type in the same file. A re-export does **not** put a name in local
scope — that is the 12 errors.

But fixing the import alone would have left something worse hidden. The declared union was:

```ts
export type ValidationMode = 'all' | 'touched' | 'dirty';
```

…while the implementation compares `config.mode === 'onChange'` (`FormProvider.tsx:213`) and
`=== 'onBlur'` (`:233`), and defaults to `'onSubmit'` / `'onChange'`. **The union contained
none of the values actually used.** That is why all 12 call sites carried
`'onChange' as ValidationMode` casts — the casts were not sloppiness, they were the symptom.

So I corrected the union to the values the code really uses and **deleted the 12 casts**.
A cast is evidence the type is wrong, not that the value is.

**Result: 784 → 731.**

---

## 5. Verification (not just a typecheck)

1. **The build succeeds.** `npx vite build` → **14516 modules transformed, built in 31.5s.**
   (The first attempt appeared to fail — but it had already transformed every module and died
   only when Vite tried to `emptyDir` the output, which the sandbox's safe-delete shim blocks.
   Re-running into a fresh `--outDir` gave a clean pass. **Do not read that shim error as a
   build failure.**)
2. **No test regressions — proven by A/B.** Three Grid-using suites were run with and without
   the change:

   | | Suites | Tests |
   |---|---|---|
   | With the change | 2 failed, 1 passed | 11 failed, 12 passed |
   | Baseline (`git stash`) | 2 failed, 1 passed | 11 failed, 12 passed |

   **Identical.** The change caused zero regressions.
3. **The suite is largely broken already, for an unrelated reason.** `jest.config.js` uses
   `ts-jest` (CommonJS), and **15 source files use `import.meta.env`**, which cannot be parsed
   outside a module → `SyntaxError: Cannot use 'import.meta' outside a module`. Full run:
   **79 of 90 suites fail.** This is a **pre-existing Vite/jest configuration gap**, not
   caused by this work — and it means the dashboard suite cannot be cited as evidence until
   it is fixed. *(The skill's own rule: check that a suite can run before citing it.)*

---

## 6. Reachability — the numbers that matter for any deletion

```
entry: src/index.tsx · 526 src files · 224 reachable modules
340 live errors / 391 dead errors
```

| Bucket | Files |
|---|---|
| Reachable from the app | 224 |
| Reachable from **tests** (unreachable from app) — **DO NOT DELETE** | **157** |
| Reachable from **neither** — the deletion set | **151** (50 carry errors) |

Unlike `propertyapp` (which has 2 test files), dashboard has **90 test files**, so the
"unreachable but tested" safety net is real here — 157 files are intended code that simply
isn't wired into the app. Elision suspects: **0**.

---

## 7. Why I stopped, and what remains

The remaining **731** errors are **flat per-file drift**:

```
TS2322 158 · TS2339 156 · TS7006 95 · TS2345 61 · TS2353 38 · TS2769 27 · TS2305 24 · TS2554 21
```

No diagnostic exceeds **158** (12% of the total, versus 44% before), and the worst single file
is `InsightCard.tsx` at 29. **The systemic phase is over.** What is left is a genuine grind
across ~470 files — real work, but no longer leverage. Continuing would be polishing, not
diagnosing, so this is the right place to hand back.

Highest-value live targets for a continuation, if you want one:
`ai-insights/InsightCard.tsx` (29) · `services/aiService.ts` (23) ·
`components/forms/PropertyForm.tsx` (14) · `services/rentalService.ts` (13) ·
`services/buildingHealthService.ts` (13).

---

## 8. Two things I did NOT do

- **I did not migrate to the new Grid API.** The alias is the correct interim fix; a real
  migration (`size={{ xs: 12 }}`) should be a deliberate, separately-tested change.
- **I did not touch the 151 safe-to-delete files.** That is a product decision — and the
  157 test-protected files must be reported separately from it, never lumped in.

---

## Appendix — reproducible commands

```bash
cd dashboard
npx tsc --noEmit -p tsconfig.json > /tmp/db-errors.txt 2>&1

# Reachability. NOTE: entry is src/index.tsx (per index.html), and the BFS must
# follow dynamic import() or every lazy route looks dead.
cp ~/.workbuddy-ai/skills/ts-dead-code-triage/scripts/reachability.js ./tmp-reach.js
node ./tmp-reach.js --entry src/index.tsx --tsc /tmp/db-errors.txt --root . ; rm ./tmp-reach.js

# Safe-to-delete (app + tests). 90 test files here, so the tested bucket matters.
cp ~/.workbuddy-ai/skills/ts-dead-code-triage/scripts/dead-set.js ./tmp-ds.js
node ./tmp-ds.js --root . --entry src/index.tsx --tsc /tmp/db-errors.txt ; rm ./tmp-ds.js

# Find the systemic cause BEFORE fixing anything: is one code concentrated?
grep -oE "error TS[0-9]+" /tmp/db-errors.txt | sort | uniq -c | sort -rn | head
grep -A6 "error TS2769" /tmp/db-errors.txt | head -20      # read a whole block

# Group "cannot find name" by FILE, not by name — it is usually one file.
grep -E "Cannot find name" /tmp/db-errors.txt | sed 's/(.*//' | sort | uniq -c | sort -rn

# Verify a build despite the sandbox safe-delete shim blocking emptyOutDir:
npx vite build --outDir /tmp/db-build-verify --emptyOutDir
```
