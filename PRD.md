# SpendCredit: PRD

**Product:** Proactive, cash-flow-underwritten working capital for Revolut Business
**Author:** Antonis Moraitis · **Status:** Concept v1 (application project)
**Scope note:** Every number below is an *assumption to be validated* against Revolut's real data, not a fact about Revolut. I've marked them so nobody mistakes them for reported figures.

---

## 1. Problem: why Revolut should care

**For the SME.** Small businesses don't run out of *profit*, they run out of *cash on a specific date*: payroll on the 25th, a supplier invoice before the customer pays, a slow January. Today they have three bad options:

1. **Bank loan or overdraft.** Weeks of paperwork, collateral or personal guarantees, and a decision based on last year's accounts, which describes a business that no longer exists.
2. **Merchant cash advance or invoice factoring.** Fast, but expensive and opaque.
3. **Do nothing.** Delay suppliers, skip a payroll cycle, or dip into personal money.

The deeper problem is *timing awareness*. Most owners don't know they'll be short until they're short. By then they're borrowing under stress, which is the worst time to pick an amount or read terms.

**For Revolut.** Revolut Business already sees what the bank can't: daily inflows, payroll runs, supplier payments, FX flows, failed payments. That's a better underwriting dataset than a year-old filing. Three business reasons to act:

- **Revenue mix.** Payments and FX are commoditising. Net interest income on a *well-underwritten* SME book is a durable, high-margin line.
- **Primary-account gravity.** Credit is the strongest reason for an SME to route *all* its money through one provider. A borrower who repays from Revolut is a borrower who keeps their inflows on Revolut, which improves the score, which raises the limit. That's a flywheel.
- **Data moat.** Competitors who don't hold the operating account cannot see the 30-day forecast. This is the one advantage that's hard to copy.

---

## 2. Solution overview

SpendCredit is a **pre-approved, revolving credit line** for Revolut Business customers, with three parts:

| Layer | What it does |
|---|---|
| **Detect** | A 30-day cash-flow forecast per business. When the forecast shows an uncovered obligation, it triggers an offer. |
| **Decide** | A cash-flow-based score sets eligibility, limit and price in seconds. No forms. |
| **Deliver** | Funds land in the customer's Revolut account instantly. Repayment is automatic, from the same account, on a schedule shown up front. |

**Key design choices (and why):**

- **The offer is triggered by need, not by marketing.** No forecast gap, no offer. This keeps us on the right side of responsible-lending expectations and makes the offer *relevant*, which should lift conversion.
- **Revolving line, not one-off loans.** Approve once, draw many times. The first draw carries the acquisition and risk cost, and later draws are near-zero cost.
- **Transparent pricing.** One monthly rate on the outstanding balance, shown with APR, so there are no hidden fees and no early-repayment penalty.
- **The customer picks the amount and term** (1, 3 or 6 months) after we suggest one. Owners know their business, and the slider is where they feel in control.

**On the "4 hours" target.** Decision plus disbursal to the customer's own Revolut account should be *instant*. I'd position 4 hours as the SLA *ceiling* for Tier B cases that need a manual look, and for any external payout. "Within 4 hours" as a headline undersells what Revolut can do.

**User flow:** Trigger → Offer (amount, term, cost) → "Why this offer?" (explainability) → Confirm (full terms, consent) → Instant funds → Dashboard (available, next repayment, draw again).

---

## 3. Credit scoring model

### 3.1 Eligibility gates (binary, before scoring)

- Active Revolut Business account ≥ **6 months** (need enough history to see seasonality)
- Average monthly inflows ≥ **€3,000** in at least 4 of the last 6 months
- KYB complete, no sanctions or adverse flags, directors pass bureau check
- No unresolved fraud/dispute flags; no payment arrears with Revolut
- Legal entity types and markets where lending is licensed (see §8)

### 3.2 Scorecard (0–100)

| Factor | Weight | What we measure |
|---|---|---|
| **Inflow stability** | 25 | Coefficient of variation of weekly inflows over 12 months, seasonality-adjusted |
| **Cash runway** | 20 | Median daily balance ÷ average daily fixed outflows (payroll, rent, recurring suppliers) |
| **Payment behaviour** | 15 | Failed payments, overdraft/negative-balance days, reversals, chargebacks |
| **Revenue trend** | 15 | Inflows last 90 days vs prior 90 (with same-period-last-year as a check) |
| **Customer spread** | 10 | Share of inflows from top 3 payers |
| **Relationship depth** | 10 | Account age, share of business flows through Revolut, salary payments made |
| **Business checks** | 5 | Registry data, director bureau score, sector risk |

The prototype's example customer scores **84/100** (Tier A). The demo weights and factor scores live in `SpendCredit.jsx`.

**Why these and not others.** The score is deliberately about *ability to repay from cash flow*. Stability and runway together carry 45%, because volatility and thin buffers are what actually drive SME default. Concentration is weighted lower because it's noisy for very small businesses, but still surfaced, since a customer with one payer is one lost contract from trouble.

**Model approach.** Launch with a transparent scorecard (logistic regression / monotonic gradient boosting), so we can explain every decline. Move to a more complex model only when it demonstrably beats the scorecard on out-of-time data *and* we can still generate reason codes.

### 3.3 Limit and price

- **Limit** = the lowest of: (a) **~0.5× average monthly inflows** over the last 6 months (the demo customer, at roughly €30k+ a month, hits the €15k cap), (b) debt service ≤ **20% of forecast monthly free cash flow**, (c) tier cap.
- **Price** by tier (monthly on outstanding): A **1.4%** (≈18% APR), B **1.8%** (≈24% APR). Prices are placeholders to be set from pilot loss data.
- **Limit growth:** after 3 on-time draws, automatic review for up to ~1.7× (the prototype shows €15k → €25k).

### 3.4 The demand trigger (the "when do they need it" model)

A quantile forecast (P10 of balance, 30 days ahead) built from recurring patterns (payroll, rent, supplier cycles) plus seasonality. An offer fires when **P10 projected balance < scheduled obligations within the next 14 days**, or on a ≥30% supplier-spend spike above the 90-day norm (growth signal). Suppression rules: no offer if the customer has arrears, an offer was dismissed in the last 14 days, or the shortfall is larger than what we'd responsibly lend.

---

## 4. Risk management

### 4.1 Approval tiers

| Tier | Score | Decision | Initial limit | Turnaround |
|---|---|---|---|---|
| **A** | ≥ 75 | Auto-approve | €5k–15k | Instant |
| **B** | 60–74 | Auto-approve smaller / light review | €2k–5k | Instant to 4h (manual ceiling) |
| **C** | 50–59 | Refer: request extra data (accounting/VAT link) | Case by case | ≤ 48h |
| **D** | < 50 or gate fail | Decline with reason and path to eligibility | n/a | Instant |

Every decline gets plain-language reasons and the single change most likely to help. That's good practice and a regulatory expectation.

### 4.2 Default targets (assumptions)

| Metric | Tier A | Tier B | Blended |
|---|---|---|---|
| Annualised net loss | ≤ 2.5% | ≤ 6% | **≤ 3.5–4%** |
| 30+ dpd | ≤ 4% | ≤ 8% | ≤ 5% |

**Kill switches:** if any origination cohort's 30-dpd exceeds 6% at month 3, freeze new limit increases for that cohort and tighten the cut-off. If blended 90-dpd goes past target for 2 consecutive months, pause Tier B.

### 4.3 Structural controls

- **Stacking/bust-out:** small first-draw cap (≤ 50% of the limit for the first 30 days), and a velocity check on how fast the draw is spent.
- **Fraud:** disbursal only to the customer's own Revolut account for the first 30 days (no external payout), device and behavioural checks at draw.
- **Repayment source:** automatic sweep from the Revolut account (with pre-debit reminders), so repayment risk is largely about the business's inflows staying on Revolut. We monitor for **inflow diversion** (revenue re-routed elsewhere) as an early-warning signal.
- **Collections:** a 5-day grace period, one free reschedule, and early outreach at the first missed payment. It's cheaper and kinder than late fees.
- **Monitoring:** a weekly behavioural re-score, so limits can shrink automatically when the business deteriorates.
- **Model risk:** shadow mode before launch (§7), monthly Gini/KS and population-stability monitoring, and human review of declines by segment for bias.

### 4.4 Illustrative unit economics (per average outstanding €1)

| Line | % of avg balance |
|---|---|
| Revenue (1.4%/mo × 12) | 16.8% |
| Cost of funds | (4.0%) |
| Expected loss | (3.5%) |
| Servicing, fraud, ops | (2.0%) |
| **Contribution** | **≈ 7.3%** |

At €6k average balance per active borrower, **1,000 borrowers ≈ €6M book ≈ €440k annual contribution**, before the value of deeper primary-account usage. All inputs are assumptions. The real exercise is stress-testing loss at 2× target.

---

## 5. Success metrics

**North-star:** *Loss-adjusted contribution from SpendCredit + incremental balances retained on Revolut* (credit that pays for itself and deepens the relationship).

| Category | Metric | Launch target (assumption) |
|---|---|---|
| **Funnel** | Offer view → draw conversion | ≥ 20% |
| | Median time: tap → funds | < 60 seconds |
| | Auto-approve rate among eligible | ≥ 70% |
| **Portfolio** | Blended annualised net loss | ≤ 4% |
| | On-time repayment | ≥ 95% |
| **Value** | Contribution / avg balance | ≥ 6% |
| | Inflow share through Revolut, borrowers vs matched non-borrowers | +15% |
| | 12-month retention, borrowers vs matched | +10 pts |
| **Trust** | Post-draw NPS | ≥ 50 |
| | Complaints per 1,000 draws | tracked, trending down |
| **Guardrails (counter-metrics)** | Share of draws taken within 7 days of repaying the previous one (debt-spiral signal) | < 15% |
| | Dismiss-then-decline rate (offers that annoy) | < 30% |

The counter-metrics matter more than the targets. A lending product that hits conversion by pushing people who can't afford it isn't succeeding.

---

## 6. Competitive analysis

| | **SpendCredit** | **Traditional bank** | **Square Capital-style** | **Klarna** | **Marketplace / fintech lenders** (e.g. iwoca, Funding Circle) |
|---|---|---|---|---|---|
| Decision basis | Live cash flow across the operating account | Annual accounts, collateral | Card sales through the processor | Consumer purchase data | Bank-feed or accounts, application-led |
| Speed | Seconds | Weeks | Minutes–days | Seconds (consumer) | Hours–days |
| Proactive? | **Yes, forecast-triggered** | No | Partially (pre-approved offers) | At checkout | No |
| Repayment | Auto from operating account | Direct debit | % of daily sales | Instalments | Direct debit |
| Coverage | Any Revolut Business customer, all revenue types | Existing customers | Only Square merchants | Consumers and merchants | Anyone applying |

**Where I think SpendCredit genuinely wins:** the *only* proactive offer that understands **all** of a business's flows (card, transfers, FX, payroll), not just one channel.

**Where it doesn't (be honest):**

- **Bank funding costs.** A bank with deposits can price below us. We compete on speed, convenience and fit, not lowest APR, so we should not target businesses who'd qualify for a cheap bank loan and merely lack the time.
- **Repayment control.** Square-style split-of-sales repayment is the strongest loss protection there is. We don't own the sales stream, so we rely on primary-account behaviour, and we mitigate with inflow-diversion monitoring and by nudging inflows to Revolut.
- **Klarna** is mainly consumer BNPL, so it's less a competitor than a benchmark for *UX*: a fast, transparent, one-tap credit flow. Their consumer-credit brand risk is also a reminder of what to avoid: frictionless credit needs proper affordability guardrails.

---

## 7. Go-to-market plan

**Phase 0: Shadow mode (8–12 weeks).** Score the existing base *without* showing anything. Backtest the trigger and scorecard against what actually happened to those businesses' cash. Output: calibrated cut-offs, a defensible loss forecast, and a regulator-ready model document.

**Phase 1: Closed pilot (≈ 2,000 customers, one market, ≈ 3 months).** Tier A only, capped at €5k. Measure: conversion, time-to-cash, early delinquency, and NPS. Qualitative interviews with 20 borrowers *and* 20 who declined the offer. Exit criteria: 30-dpd within target, NPS ≥ 40, no material complaints pattern.

**Phase 2: Scale in-market (months 4–9).** Raise limits to €15k, add Tier B, open the forecast trigger to all eligible customers, and introduce limit growth. A/B test offer copy and default amount.

**Phase 3: Embed and expand (months 9–18).** Surface credit inside payroll, supplier payments and invoicing flows (e.g. "you're about to send payroll that isn't covered"). Add markets where lending permissions exist. Introduce third-party funding (forward-flow or securitisation) to move growth off the balance sheet.

**Market choice.** Launch where Revolut has the lending permission and SME data density. Greece is my personal edge from Snappi, but I'd choose on data and licence first, and treat local knowledge as a bonus.

**Positioning.** *"Know before you're short."* Lead with the forecast, not the loan. The forecast is free and useful on its own, and credit is what you can do about it.

---

## 8. Risks and mitigations

| Risk | Why it matters | Mitigation |
|---|---|---|
| **Adverse selection** | People who *feel* they'll fail are likelier to accept | Gate on forecast + behaviour, not intent; small starting limits; cohort monitoring |
| **Predatory-lending perception** | Proactive credit offers can look like pushing debt | Need-based trigger, no-offer rules, transparent pricing, easy dismiss, no repeat nagging |
| **Regulation** | Lending licences differ by market. Sole traders/small partnerships may fall under consumer-credit rules in some regimes (e.g. UK CCA thresholds); EU AI Act treats creditworthiness scoring of natural persons as high-risk; GDPR Art. 22 limits solely automated decisions | Engage Compliance/Legal from Phase 0; reason codes and human-review path; scope by legal entity type. *I'd validate the specifics with Legal, not rely on my read.* |
| **Model drift / macro shock** | SME cash flows shift fast in downturns | Weekly re-score, stress tests, automatic limit shrinkage, kill switches |
| **Data limits** | We see Revolut flows only, not revenue held at other banks | Relationship-depth factor; optional accounting/open-banking link for Tier C; conservative limits when the Revolut share of flows is low |
| **Debt spiral** | Repeated draws to repay previous ones | Counter-metric, repeat-draw cooldowns, and affordability cap |
| **Funding cost / liquidity** | Book growth needs capital | Phase 3 third-party funding; growth gated by loss performance |
| **Fraud / bust-out** | Fast credit attracts abuse | Own-account-only disbursal early, device and velocity checks, KYB depth |
| **Explainability** | A decline with no reason erodes trust and breaks rules | Scorecard first, reason codes at decline, "Why this offer?" surface |

---

## 9. Open questions I'd want answered in week one

1. What % of Revolut Business customers pass the eligibility gates today? (Sizes the addressable base.)
2. What's the observed 30-day forecast error on real accounts, and how does it vary by sector? (Decides whether the trigger is trustworthy.)
3. Which markets have the lending permission *and* enough tenure data?
4. What's Revolut's actual cost of funds for SME lending vs. my 4% placeholder?
5. Do customers respond better to "a forecast alert with an offer" or "an offer on request"? (A/B test in the pilot.)
