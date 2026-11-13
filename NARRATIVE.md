# Why SpendCredit? The one-page version

*A short note to go with the PRD and prototype.*

---

At Snappi I worked on credit decisioning. The thing that stuck with me wasn't the model, it was how late in the story we usually showed up. A customer applies when they're already short. They pick a number in a panic, we decide with whatever they've told us, and everyone is guessing.

Revolut Business is in a different position. It can see the shortfall coming *before* the owner does: payroll due on the 25th, a balance that won't cover it, a supplier invoice landing before the customer pays. That's not a lending product. It's a warning, and credit is one thing you can do about it.

**That's the idea behind SpendCredit: don't wait for the application.** If the forecast says payroll won't be covered, tell the owner a week early, show them exactly what a fix would cost, and let them fix it in one tap.

## What I'd get right

**1. Need-based, not marketing-based.** The offer only shows up when the forecast says there's a real gap. That keeps it relevant, and it keeps us from becoming the company that pushes debt on people. If a business doesn't need money, we say nothing.

**2. Honest pricing.** One monthly rate, shown as an APR, with a schedule and no early-repayment penalty. It's not the cheapest credit in the market and I don't pretend it is. A bank with deposits can beat us on price. We win on *speed and fit*, and we should target the owner who values that, not one who would have qualified for a cheap bank loan.

**3. Explainability.** Every offer has a "Why am I seeing this?" screen with the factors and weights. Every decline has plain reasons and one next step. It costs us little and it's the difference between a customer who trusts us and one who complains.

**4. Guardrails that matter more than targets.** I'd track how often someone draws again within a week of repaying. If that rises, we're not helping people, we're trapping them. It's the first metric I'd put on the dashboard.

## What I'm not sure about (and how I'd find out)

- **Is the 30-day forecast accurate enough to trigger an offer?** If not, the whole trigger idea weakens. That's why I'd start with shadow mode: score the base, show nothing, check what actually happened.
- **Repayment control.** A Square-style split of daily sales is a stronger protection than what I'm proposing. We rely on the operating account and on watching for revenue moving elsewhere. I think that works for a Revolut-primary customer, and the pilot has to prove it.
- **Regulation.** Sole traders can be treated differently from limited companies, and automated credit scoring is a regulated area in the EU. I've flagged where I think the issues are, but I'd want Legal to confirm.

My numbers (loss targets, cost of funds, conversion) are assumptions I've made explicit. In a real job, my first week would be replacing each with Revolut's actual data.

## Why me

I've worked on the credit side (Snappi), the markets side (Piraeus Bank), the advisory side (EY), and the founder side (Hire Greece, where I learned that a product nobody feels they need is a product nobody buys). I study Finance & Technology at Bentley and spent a year at the London School of Economics. This project is the intersection: a credit product built around a real customer moment, with the risk and regulatory questions asked up front.

I built the prototype myself, because the flow matters. The amount slider, the cost shown before the tap and the "Why this offer?" sheet are the product. The PRD is the argument for them.

**What's in the folder**

- `PRD.md`: the full document
- `index.html`: the interactive prototype (double-click to open)
- `SpendCredit.jsx`: the React component behind it
