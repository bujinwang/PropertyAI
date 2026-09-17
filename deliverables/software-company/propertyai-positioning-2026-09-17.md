# PropertyAI — Market Positioning Decision

> **⚠️ CORRECTION (2026-09-17, later same day — added by the delivery director).**
> This document's capability table and its "one honest moat" claim were built from a **filename inventory**, not from a **reachability analysis**. That distinction turns out to be material, and three claims here do not survive it. See `propertyai-gtm-ground-truth-verification-2026-09-17.md` for the measurements.
>
> 1. **"AI maintenance triage (photo/CV)" is NOT the confirmed moat.** `src/cv/photoAnalysis.ts` — the module named in this document's Section B as evidence for the wedge — is **7 lines** and is a placeholder: `return { labels: ['property','interior'] }` under `// Placeholder for photo analysis logic`. The route that would expose it is **commented out** (`routes/index.ts:37`, `:117`). A real 626-line AWS Rekognition implementation exists at `src/services/photoAnalysis.service.ts` but is **dead code**. What is actually **live** is `src/services/triage.service.ts` (92 lines), reached via `contractor.service.ts:80` — and it is **text/NLP triage** (`sentimentService.analyze()` + `nlpService.extractDetails()`), **not computer vision**. ⇒ Read the wedge as *"maintenance triage, live, text-based"*. Wire and benchmark the CV path before leading with it.
> 2. **Accounting is not a strength.** `src/services/accounting.service.ts` is **33 lines** — two methods against the QuickBooks **sandbox** with a hardcoded company id — and it is **dead code**. Section B's "●" for accounting/expense categorization should be read as: expense categorization and cash-flow forecasting are live; **accounting/integration is not**.
> 3. **The composite capability rows are filename-based.** Section B scores rows like "Rent collection + accounting + …" as a single ●. In the code those are separate modules with mixed status. Treat every ● in Section B as **"a module with this name exists"**, and verify reachability before making a build decision on it. Methodology: `~/.workbuddy-ai/skills/ts-dead-code-triage/scripts/dead-set.js` (run from `backend/`). Measured 2026-09-17: 533 source files, 286 reachable from the app entry, 336 from tests, **246 reachable from neither.**
>
> The **segment decision (Section C — target T2, the "Buildium zone")** and the **roadmap re-prioritisation (Section D)** are unaffected and remain standing. The error is confined to the *evidence quality* of the capability claims.
>
> **Separately: this document's implied self-serve motion has a live security blocker.** `POST /api/auth/register` accepts an arbitrary `role` from an unauthenticated caller, so `{"role":"ADMIN"}` creates an administrator. Any public-signup funnel must not ship before that is fixed. Details in the ground-truth memo.

> **Deliverable owner:** 许清楚 (Xu) · Product Manager, software-company team
> **Coordinated by:** 齐活林 (Qi) · Delivery Director
> **Date:** 2026-09-17 · **Mode:** Positioning / incremental (resolves the Section F open question of `propertyai-feature-plan-2026-09-10.md`)
> **Scope:** USA/Canada residential property operations.
> **Ground truth for Section B:** codebase recon verified by the delivery director (route/model/service inventory) + PM spot-verification of `backend/src` on 2026-09-17. Pricing figures are carried over from the prior report's sources `[S20][S21][S22]` and are labelled as such; all ACV ranges and fit judgments are **inference**, explicitly marked.

---

## A. Market Segmentation (definitional)

The residential property-tech market splits into four tiers by **managed-unit count**, and the tier you choose dictates *everything* downstream: buyer motion, price, feature depth, and — critically — how much **compliance** you must ship. The four tiers below expand the user's reference table.

| Tier | Unit count / scale | Representative vendors (price points) | Buyer profile & buying motion | Core jobs-to-be-done (JTBD) | Compliance depth required | ACV range *(inference)* | Why they churn |
|---|---|---|---|---|---|---|---|
| **T1 — Self-managing landlord** | **1–75 units** (mostly 1–10) | TenantCloud, Hemlane, Rentec Direct, MagicDoor · **$18–30/mo**, self-serve sign-up, no sales call | Solo owner / accidental landlord; often a side business. **Pure self-serve**, credit-card, trial-first. Highest price sensitivity, near-zero tolerance for onboarding effort. | Collect rent, list a vacancy, basic screening, 1–2 maintenance requests/mo, deposit tracking. Spreadsheet-replacement. | **Minimal.** State security-deposit rules, basic lease notice. No FCRA-grade screening, no fair-housing audit. | **$216–360/yr** (~$18–30/mo) | Outgrows the free/basic tier, hits a paywall at ~10 units; or the unit is sold. Price is the #1 trigger. |
| **T2 — SMB landlord / small PM** ← **the "Buildium zone"** | **~50–500 units** (sweet spot 80–300); a small PM firm, 1–10 staff | **Buildium** ($55–400/mo) `[S21][S22]`, **DoorLoop**, **Rentvine** | Owner-operator or small PM firm that has **outgrown DIY but cannot afford enterprise**. Buys via **self-serve + light-touch sales** (demo + 14-day trial, not an RFP). Wants "开箱即用" / out-of-the-box, low learning curve, transparent price. | Full bookkeeping & trust accounting, rent collection + late fees, **maintenance work-order workflow**, tenant portal, screening, owner statements, e-sign leases, syndication. | **Moderate–High.** Fair-housing + FCRA on screening, security-deposit handling, state/local notice rules, ADA-reasonable website, audit trail. | **$660–4,800/yr** ($55–400/mo) | **Feature ceiling** (no owner reporting depth, no accounting integrations), **price hikes**, steep learning curve, weak support, and increasingly *compliance gaps*. |
| **T3 — Mid-market PM** | **200–1,000+ units**; multi-property/multi-owner | **AppFolio** (~$1.4–3.2/unit/mo, **50–250 unit minimum**) `[S20]`, **Yardi Breeze** | Professional PM firm with **owner clients** and staff roles. **Sales-led** motion (discovery call, guided implementation). Buys integrations, owner reporting, benchmarking. | Owner reporting & distributions, portfolio benchmarking, deep accounting/trust, integrations (banking, PMS, QuickBooks), crew/vendor ops at scale. | **High.** Above + trust-accounting rules, local rent-control/ordinance, fair-housing audit trail, role-based access. | **$6,000–40,000/yr** (scales with unit count) | Migration/consolidation (acquired, switched PMS), insufficient integration depth, per-unit cost at scale, consolidation onto Yardi/AppFolio. |
| **T4 — Large / multifamily operator** | **1,000+ units** (institutional) | **EliseAI** ($3–6/unit + **~$25k minimum**) `[S16][S17]`, **RealPage**, **Yardi Voyager** | Institutional owner/operator, procurement-driven. **Enterprise sales-led**, 6–12 mo cycle, security review, RFP. | Autonomous leasing at scale, call-center coverage, centralized leasing across buildings, deep compliance (affordable/LIHTC), multilingual, integrations with legacy PMS. | **Very High.** + HUD/LIHTC affordable-housing, multi-state, EEOC/disparate-impact on screening *and* pricing, AI disclosure, WCAG accessibility, immutable audit logging. | **$25,000–250,000+/yr** | ROI unproven at renewal, vendor consolidation, implementation failure, lock-in fatigue (EliseAI: training data doesn't transfer) `[S16]`. |

### What "SMB 房东 / Buildium 地带" *means* (the term the user asked us to define)

> **"SMB 房东 / 小型 PM" (the "Buildium zone") is the tier that manages roughly 50–500 units — most typically 80–300 — through a small property-management firm or a full-time owner-operator with a handful of staff. It is the tier *between* the self-managing landlord (who wants a $20/mo app and nothing more) and the mid-market PM (who buys AppFolio on a sales call). Its defining trait is the tension: it has real operational needs — bookkeeping, rent collection, maintenance work orders, a tenant portal, screening, owner statements — that a $20/mo tool cannot serve, but it has neither the budget nor the staff for an enterprise RFP or a 12-month implementation. It therefore buys on a self-serve-plus-light-touch motion: sign up, watch a demo, run a 14-day trial, and expect to be productive in days. Buildium ($55–400/mo) is the archetypal incumbent — hence "the Buildium zone."** `[S21][S22]`

**The decision this table forces:** the previous report's unresolved question — *SMB landlords vs. 500+ unit operators* — is really a question of **which of T2/T3/T4 becomes the beachhead**, because the feature, compliance, and go-to-market requirements are not interchangeable. Section B answers it from the code; Section C commits.

---

## B. Capability-to-Market Fit (code-grounded)

Scored against **verified code only**. Legend: **● covered / ◐ partial / ○ missing (no code evidence)**.

| PropertyAI capability (verified in code) | T1 Self-manage | T2 SMB small PM | T3 Mid PM | T4 Large operator |
|---|:--:|:--:|:--:|:--:|
| **Maintenance triage + work-order routing** (`triage.service.ts` ✅LIVE · `sentiment.service` ✅ · `nlp.service` ✅ · **`cv/photoAnalysis.ts` = 7-line placeholder, DEAD** · `photoAnalysis.service.ts` = 626-line real impl but DEAD · `urgency.service.ts` DEAD · `maintenance*.routes` ✅LIVE · `predictive-maintenance/*.py` needs trained artifacts) | ◐ | **◐ — text/NLP only** | ◐ | ◐ |
| **Tenant/prospect comms & conversational AI** (`conversation`, `voice`, `transcription`, `voicemail`, `translation`, `sentiment`, `followUp`, `knowledgeBase`) | ◐ | **●** | ◐ | ○ (needs true call-center + voice-at-scale) |
| **Rent collection + accounting + expense categorization + cash-flow forecast** (`rentCollection`, `accounting.service.ts` incl. **QuickBooks sandbox sync stub**, `expenseCategorization`, `cashFlowForecasting`, `lateFee`, `payment/invoice`) | ○ | **●** | ◐ | ○ |
| **Lease workflow + e-sign + document/lease abstraction** (`leaseRoutes`, `docusign`, `signature`, `document*`, `documentVerification`) | ◐ | **●** | ◐ | ◐ |
| **Listing syndication + listing analytics** (`zillow.service`, `trulia.service`, `apartmentsComService`, `socialMedia`, `seo`, `listing`, `publicListing`) | ◐ | **●** | ◐ | ○ |
| **Reporting / templates / versions / audit log** (`Report*` models, `reportingService`, `GeneratedReport`) | ◐ | ◐ | **●** | ◐ (enterprise reporting depth ○) |
| **Tenant screening / risk scoring** (`backgroundCheck.service.ts` = **real TransUnion/Experian API stubs**; `riskAssessment.service.ts` `assessRisk()` = **`// Mock implementation for now`**) | ○ | ◐ | ◐ | ○ |
| **Compliance depth** (`compliance.service.ts` = **GDPR-style DSAR only**; **NO `fairHousing`/`adverseAction`/`FCRA`/`disparate`/`aiDisclosure` strings anywhere in `backend/src/**/*.ts`**) | ○ | ○ | ○ | ○ |
| **IoT / predictive maintenance / predictive analytics** (`iotDevice`, `iotProtocolAdapters`, `sensor*`, `predictive-analytics/*`, `predictive-maintenance/*`) | ○ | ◐ | ◐ | **●** |
| **Portfolio / market intelligence, ROI, cost estimation** (`marketIntelligence.routes`, `roi.routes`, `costEstimation`, `cashFlowForecasting`) | ○ | ◐ | **●** | ● |
| **Tenant-portal-style mobile apps** (`mobile`, `propertyapp`, `ContractorApp`) | ◐ | **●** | ◐ | ○ |
| **White-label platform** (`whiteLabel.service`, `publishing`) | ○ | ○ | ◐ | ● |
| **Escalation / workflow automation / scheduling** (`escalationPolicy`, `workflowAutomation`, `businessHours`, `scheduling`, `approvalWorkflow`, `googleCalendar`) | ◐ | **●** | ◐ | ○ |
| **Emergency protocols / routing** (`emergencyProtocol`, `emergencyResponse`, `emergencyRouting`, `onCall`) | ◐ | ◐ | ◐ | ◐ |
| **AVM / CMA / comparable-sales engine** | ○ | ○ | ◐ | ◐ |
| **AI voice at scale / call-center / multilingual ops** | ○ | ○ | ○ | ○ (translation present, *not* a call center) |
| **Agent CRM / lead scoring / lead nurture** (`leadScore|prospect|CRM` → **no matches** in `backend/src/**/*.ts`) | ○ | ○ | ○ | ○ |
| **MLS / IDX integration / showing requests / buyer-seller leads** (`idxSync|mlsSync|showingRequest|buyerLead|sellerLead` → **no matches**) | ○ | ○ | ○ | ○ |

### What the code actually says

- **Structurally fits T2 (SMB / Buildium zone).** The verified entity set (Property, Tenant, Payment, Invoice, MaintenanceHistory, lease/document, Notification, Report*) and the service layer (rent collection, accounting, expense categorization, cash-flow forecasting, maintenance triage with CV + predictive-maintenance models, vendor management, syndication, e-sign, tenant-facing mobile apps) map almost **one-to-one** onto the T2 jobs-to-be-done. This is an operations platform for a small PM, not a listing/agent platform.
- **Partially fits T3 (mid-market)**, but the *owner-reporting depth, accounting-integration depth (QuickBooks is a stub, not a production sync), and trust-accounting rigor* that T3 buyers demand are **◐ at best**. T3 is a *later* expansion, not the beachhead.
- **Structurally does NOT fit T1.** The product is over-built for a 3-unit landlord who wants a $20/mo spreadsheet replacement; the compliance-lite, self-serve, ultra-cheap motion is not what this codebase is shaped for.
- **Structurally does NOT fit T4.** Enterprise multifamily needs (a) an **AI voice / call-center** layer, (b) **deep, auditable compliance** (affordable-housing, disparate-impact, AI disclosure), and (c) **legacy-PMS integrations** — all three are **○** in the code today. Chasing T4 means shipping three capabilities that do not exist and cannot be stubbed.
- **Structurally does NOT fit the agent/brokerage segment at all.** There is **no** CRM, **no** lead scoring/nurture, **no** IDX/MLS, **no** showing requests, **no** AVM/CMA/comps engine, and **no** buyer/seller-lead primitives. The prior report's Tier-1 agent-side items (AVM, CMA, CRM+nurture, virtual staging, listing content) describe a *different product* — evidence that the prior plan silently assumed an agent/brokerage buyer.

> **PM spot-verification (2026-09-17), beyond the recon:** confirmed `backend/src/services/accounting.service.ts` contains a QuickBooks **sandbox** sync stub (`syncToQuickBooks`), `backgroundCheck.service.ts` contains **real** TransUnion/Experian API call stubs, and `riskAssessment.service.ts` explicitly marks `assessRisk()` as `// Mock implementation for now`. `compliance.service.ts` implements GDPR DSAR (access/portability/erasure) — **not** fair-housing or screening compliance. **Inference:** the AI/screening story is *partially* real but not production-grade, and the compliance story is materially thinner than any tier above T1 requires.

---

## C. Recommended Positioning

### Primary recommendation

> **Target the SMB landlord / small-PM tier — the "Buildium zone" (~50–500 units, sweet spot 80–300) — as the single primary segment.**

One target. Not "it depends."

### Why (grounded in the recon)

1. **The code is already shaped for it.** Verified: rent collection, accounting + expense categorization + cash-flow forecasting, maintenance triage with CV/predictive-maintenance, vendor + work-order ops, tenant-portal mobile apps, lease/e-sign, syndication, reporting. These *are* the T2 JTBD. There is no cheaper market to serve with this exact codebase.
2. **The agent/brokerage market — the prior report's implicit target — has no code at all.** CRM, lead scoring, IDX/MLS, AVM/CMA are all absent. Positioning there would require building a second product from zero.
3. **T4 is unwinnable at current capability.** EliseAI ($25k min) and AppFolio/RealPage win on voice call-centers, deep compliance, and legacy-PMS integrations — none of which exist here. Enterprise sales cost would exceed any plausible ACV.
4. **T1 is a price war we lose.** At $18–30/mo against TenantCloud/MagicDoor, our feature depth is wasted and margins don't cover the AI infrastructure. T1 is a *funnel source* (land-and-expand), not a target.
5. **T2 is where incumbent dissatisfaction is highest.** T2 buyers churn off Buildium/AppFolio for the exact reasons the product addresses: feature ceiling, integration gaps, learning curve, and price. **Inference:** an AI-native ops layer at SMB price is a differentiated wedge — incumbents bolted AI onto legacy suites (Buildium "Lumina AI") `[S21]`, so AI-native is a credible "why now."

### Wedge / beachhead entry point

> **Enter on "maintenance + tenant communications" automation, sold as an AI-native ops layer with a tenant portal — land at 80–200 units, expand to the full book of business.**

**Rationale (code-grounded):** maintenance triage (CV photo diagnosis → prioritized work order → vendor dispatch via `predictive-maintenance` + `vendor*` services) and tenant-facing comms/portal are where the codebase is **deepest and most differentiated**, and they are the **#1 SMB pain** ("slow maintenance, poor communication" `[S59]`). This is a narrow, defensible entry that (a) demos instantly with the CV/triage stack, (b) has a hard ROI story (response time, after-hours coverage `[S13]`), and (c) opens the door to the accounting/rent-collection/reporting modules that carry expansion revenue.

### Pricing / packaging shape *(inference — validate with pricing tests)*

| Package | Units | Price *(inference)* | Notes |
|---|---|---|---|
| **Starter** | up to 75 | **~$1.5–2.0 / unit / mo**, floor **$79/mo** | Self-serve, rent collection + portal + maintenance triage; convert T1 landlords up. |
| **Growth (primary)** | 76–300 | **~$2.0–2.5 / unit / mo**, floor **$149/mo** | + accounting (QuickBooks sync), owner statements, screening, bulk SMS. This is the Buildium-zone killer. |
| **Portfolio** | 301–1,000 | **~$1.5–2.0 / unit / mo**, floor **$499/mo** | + full reporting, syndication, portfolio insights. Undercut AppFolio's $1.4–3.2/unit `[S20]` at the top. |
| Add-on | — | per-seat / per-module | AI voice-as-add-on, white-label (P1). |

**Shape:** per-unit/month with a monthly floor — **transparent, no training-data lock-in** (a direct counter to EliseAI's #1 complaint `[S16]`), and **self-serve-first** with optional guided onboarding. Position *below* AppFolio and *above* TenantCloud, with more capability than either at the T2 price point.

### What we will deliberately NOT build *(and why)*

| Not building | Why |
|---|---|
| **Agent/brokerage CRM, lead scoring & nurture, round-robin routing** | No code exists; wrong buyer; would be a second product. `[T1.5, T2.2 — agent-side]` |
| **MLS / IDX integration & showing-request flows** | Zero code; requires MLS vendor contracts and a brokerage go-to-market we don't have. |
| **Public-record AVM / CMA / comps engine** | Cannot beat Zillow (1.94% on-market `[S28]`) / Redfin / HouseCanary; better to **use own-portfolio comps** or **partner**. `[T1.3, T1.4]` |
| **Enterprise AI voice / call-center at scale** | T4-only; requires telephony + voice-at-scale infra; CAC far exceeds T2 ACV. `[T2.1 as enterprise]` |
| **47-language / affordable-housing (LIHTC) compliance modes** | Enterprise expectation, not SMB; premature and expensive. `[S13][S14]` |
| **Governance/bias-audit-**as-a-**service productized** (selling audits to brokerages) | Our compliance layer must be *internal* to protect us (see D), not a product line. `[T3.8]` |
| **Autonomous underwriting / deal scoring, immersive 3D/digital twins, iBuying-style engines** | Capital-heavy, off-ICP, no code, no buyer in T2. `[T3.5, T3.7]` |
| **Enterprise owner-reporting-Yardi-Voyager/RealPage-grade integration suite** | T4-only integration depth; revisit if we ever move up-market. |

### How this differs from the prior report

The prior report's **Tier 1/2/3 ordering was implicitly built for an agent/brokerage buyer** — its Tier-1 list led with AVM, CMA, CRM+nurture, virtual staging, and listing content (all agent-side), and Section D's "highest-value whitespace" was *local market analysis* (a brokerage need). This document **re-anchors the product on the SMB property-manager/owner-operator**, which is what the **actual codebase** supports. Concretely: the maintenance/rent-collection/portal/comms cluster (prior T1.8/T1.9/T1.1) moves to the **center**; the agent-side valuation/CRM cluster (prior T1.3/T1.4/T1.5) moves to **demote/drop** (Section D).

---

## D. Roadmap Re-prioritization

Actions: **PROMOTE** (raise priority) · **HOLD** (keep) · **DEMOTE** (lower, later) · **DROP** (cut for this positioning) · **NEW** (positioning forces it).

| Item (prior tier) | Action | Reason |
|---|---|---|
| **T1.8** AI maintenance triage / smart work-order routing | **PROMOTE → wedge #1** | Deepest code (CV + predictive-maintenance + vendor ops); #1 SMB pain; instant demo & ROI story. |
| **T1.1** Omnichannel conversational AI front desk | **PROMOTE** | Reframe as **tenant/prospect** ops (not agent lead-gen). Code exists (conversation/voice/translation/sentiment); T2 needs 24/7 tenant comms. |
| **T1.9** Rent collection + AI accounting/categorization + cash-flow forecast | **PROMOTE** | Core Buildium-zone JTBD; code exists; carries expansion revenue. *Finish* the QuickBooks sync (currently a stub). |
| **T1.11** Lease/document workflow + e-sign + abstraction | **HOLD (P0)** | T2 table stakes; code exists (docusign/signature/document). |
| **T1.10** Listing syndication + performance analytics | **HOLD** | T2 needs it (Zillow/Trulia/Apartments.com code exists); keep, don't over-invest. |
| **T2.10** Bulk / automated SMS | **PROMOTE** | Repeated top complaint `[S41][S43]`; cheap; T2 expectation. |
| **T2.9** Open API + two-way PMS/accounting integrations | **PROMOTE** | T2 switch-driver (off Buildium/AppFolio); QuickBooks stub is the starting point. |
| **T2.4** Compliance-aware guardrail layer (fair housing / FCRA / AI disclosure / audit log) | **PROMOTE to P0 (internal, not product)** | **Required to legally serve T2 screening.** Code today = ○. Non-negotiable risk control `[S9][S11]`. |
| **T1.7** AI tenant screening & risk scoring w/ guardrails | **HOLD (P0)** — but *only* with T2.4 | T2 needs screening; code is stubs + mock. Ship screening **with** the guardrails or not at all. |
| **T2.3** Sentiment → churn/renewal risk | **HOLD** | Cheap (sentiment code exists) and useful for T2 retention. |
| **T2.7** Portfolio/exec insights dashboard | **DEMOTE** *(but promote a lightweight **owner-statement/owner-report** version)* | Enterprise-style exec dashboards are T3/T4; **owner reporting is T2 P0** — see NEW. |
| **T1.2** AI listing description + marketing content | **DEMOTE** | Useful for T2 vacancy marketing, but not the wedge; agent-side value is off-ICP. |
| **T1.6** Virtual staging + photo enhancement | **DEMOTE** | Nice-to-have for T2; primary value is agent/listing-side. |
| **T2.1** AI Voice agent (call/qualify/warm-transfer) | **DEMOTE → P1 add-on** | Enterprise/agent value; as a T2 **tenant-callback** feature only, later. |
| **T2.5** Rent/revenue optimization (antitrust-safe) | **DEMOTE → P2** | T3/T4 value; legal overhead high for T2 benefit. |
| **T1.3** AVM / instant valuation engine | **DROP (as core)** | Can't beat Zillow/Redfin `[S28][S31]`; use own-portfolio comps or partner. |
| **T1.4** AI CMA / market-analysis summary | **DROP (as core)** | Agent-side job; off-ICP. |
| **T1.5** Unified CRM + lead routing + long-horizon nurture | **DROP** | **No code**; agent/brokerage product; wrong buyer. |
| **T2.2** Predictive seller/lead intent scoring | **DROP** | Agent-side; no code; no T2 buyer. |
| **T2.11** Listing-photo → structured listing data | **DEMOTE → P2** | Listing-side value; low T2 urgency. |
| **T2.6 / T2.8** Marketing attribution · Self-tours + scheduling | **DEMOTE** | Agent/lead-gen oriented; keep scheduling only as a T2 maintenance/tenant convenience. |
| **T3.1** Agentic multi-step "Performers" | **HOLD → reframe for T2 ops** | High value but scope to *ops* (maintenance/comms/rent), not leasing-agent autonomy. |
| **T3.2** CV condition assessment → valuation uplift | **HOLD (reframe)** | Repoint at **maintenance condition** scoring (inspection/T2), not AVM uplift. |
| **T3.3** AI-search visibility (AEO/GEO) for agents/listings | **DROP** | Brokerage distribution play; off-ICP. |
| **T3.6** Predictive maintenance (IoT) | **DEMOTE → P2/P3** | T4-flavored; keep as a differentiator for larger T2 firms later. |
| **T3.8** Governance/bias-audit-as-a-service | **DROP (as product)** | Keep as internal requirement (see T2.4), not a product line. |
| **T3.9** White-label AI ops platform for brokerages | **DROP** | Brokerage channel; off-ICP. |
| **T3.4 / T3.5 / T3.7** Climate/ESG · 3D/digital twins · autonomous underwriting | **DROP** | Capital-heavy, off-ICP, no code. |
| **NEW-1** **Fair-housing / FCRA screening compliance guardrail** (adverse-action reasons, bias-audit hooks, disclosure) | **NEW → P0** | **Mandatory to serve T2 screening legally.** Today: ○ in code. This is the positioning's single biggest forced addition. |
| **NEW-2** **Owner statements / owner reporting & distribution** | **NEW → P0** | T2 small-PM JTBD (they report to owners); prior plan over-indexed on *enterprise* exec dashboards instead. |
| **NEW-3** **Self-serve onboarding + data import** (from Buildium/AppFolio/CSV) | **NEW → P0** | The T2 buying motion is self-serve + trial; migration friction is the #1 switching blocker. |
| **NEW-4** **Production two-way QuickBooks / accounting sync** | **NEW → P0** | Finish the existing stub; T2 bookkeeping lives in QuickBooks; a native sync is a switch-driver vs AppFolio `[S20]`. |
| **NEW-5** **Tenant-portal depth** (rent pay, requests, comms, docs) | **NEW → P1** | Cements the T2 wedge and the tenant-communication story; the mobile apps are the asset to deepen. |

**Net roadmap shift:** from an *agent/brokerage AI-suite* (valuation + CRM + listing) to an **SMB property-operations platform** (maintenance + comms + rent/accounting + owner reporting), with a **compliance layer** as mandatory infrastructure and **self-serve onboarding** as the acquisition engine.

---

## E. Risks & Open Questions

### Strategic risks

| Risk | Severity | Notes / mitigation |
|---|---|---|
| **Positioning too LOW** — commoditized into a price war vs. TenantCloud/MagicDoor ($18–30/mo) | **High** | Our AI + ops depth can't be profitable at T1 prices. **Mitigation:** target T2 (80–300 units) where a $149+ floor and per-unit pricing hold; treat T1 as a funnel, not a segment; lead with ROI (response time, after-hours coverage), never with price. |
| **Positioning too HIGH** — drifting into AppFolio/EliseAI territory | **High** | Enterprise sales cost (>$25k ACV expectation `[S16]`) and compliance/integration depth we lack (`T4` = ○). **Mitigation:** hard ICP cap at ~1,000 units; explicit NOT-build list (Section C); no enterprise RFPs. |
| **Compliance liability in screening/comms** — fair-housing / FCRA / ADA | **High** | Today: **no** fair-housing/FCRA code. Serving T2 screening without NEW-1 is an existential legal risk `[S9][S11]`. **Mitigation:** ship NEW-1 *with* screening; disparity testing on real applicant data; human-in-the-loop + AI disclosure `[S8]`. |
| **"AI is stubs" gap** — screening (`assessRisk` = mock), QuickBooks (sandbox stub), background checks (API stubs) | **Med-High** | The demo may oversell production readiness. **Mitigation:** sequence REAL integrations (TransUnion/Experian, QuickBooks) as P0 before scaling GTM. |
| **Incumbent response** — Buildium/AppFolio already ship "AI agents" (Lumina, Realm-X) `[S18][S21]` | **Med-High** | We must differentiate on **AI-native + depth at SMB price + no lock-in**, not "we have AI too." |
| **Switching friction** — PM firms rarely rip out their PMS | **Med** | **Mitigation:** NEW-3 self-serve import; land on the wedge (maintenance/comms) *alongside* incumbents, then expand. |
| **Adoption→impact gap** — SMB buyers need proof, not features | **Med** | Ship measurable dashboards (maintenance response time, occupancy, rent collected) `[S1][S18]`. |

### Open questions still to validate

1. **Beachhead unit band** — is the true sweet spot 80–150 or 150–300? *(Inference: pricing tests + trial conversion by unit count will settle it.)*
2. **Wedging strategy** — do T2 firms accept an **AI ops layer alongside** Buildium/AppFolio, or do they demand full replacement? This decides whether NEW-3 is "import" or "integrate."
3. **Screening risk appetite** — do we ship screening at all in v1, or defer it (and its compliance burden) to v2 while leading purely on maintenance/comms? **Recommendation: defer screening until NEW-1 is built.**
4. **Partner vs. build for screening/background checks** — TransUnion/Experian stubs exist; partner or own the FCRA compliance surface? *(Recommendation: partner for data, own the guardrail layer.)*
5. **Owner-reporting depth** — how much bookkeeping rigor must we match before a Buildium-zone firm will switch? (Determines NEW-2/NEW-4 scope.)

---

## F. Resolution Block — for insertion into the prior report's Section F

> **Replace the prior report's `Open Q` row** — *"Will we target SMB landlords (Buildium/TurboTenant territory) or 500+ unit operators (EliseAI, ~$25k min)?"* — **with:**

```markdown
| **Resolved (2026-09-17)** | **Target segment: SMB landlords / small property managers — the "Buildium zone" (~50–500 units, sweet spot 80–300).** Decision basis: the verified codebase is a property-*operations* platform (rent collection, accounting/expense categorization, maintenance triage w/ CV + predictive-maintenance, vendor/work-order ops, tenant portal, e-sign, syndication) and structurally fits T2. The agent/brokerage segment has **no code** (no CRM, lead scoring, IDX/MLS, AVM/CMA, showing requests → verified no matches); the 1,000+ enterprise tier requires AI voice/call-center, deep fair-housing/affordable compliance, and legacy-PMS integration depth that do not exist today. **Wedge:** maintenance + tenant-communications automation, land at 80–200 units, expand across the book. **Pricing shape:** per-unit/month w/ monthly floor (~$1.5–2.5/unit/mo; $79–$499 floors) — transparent, self-serve, no lock-in. **Forced additions (P0):** fair-housing/FCRA screening guardrail (NEW-1), owner reporting (NEW-2), self-serve onboarding/import (NEW-3), production QuickBooks sync (NEW-4). **Deliberate no-build:** agent CRM/IDX, public-record AVM/CMA, enterprise voice/call-center, 47-language/affordable-housing modes, productized bias-audit-as-a-service. **Impact on T1.7/T1.9:** T1.9 (rent/accounting) is promoted to core; T1.7 (screening) is held P0 but **gated behind the compliance guardrail** — do not ship screening without it. See `propertyai-positioning-2026-09-17.md` for full analysis. |
```

---

*End of deliverable. Sections A–B are grounded in the verified codebase and cited prior-report sources; all ACV ranges, pricing points, and fit judgments explicitly labelled as inference where not directly evidenced.*
