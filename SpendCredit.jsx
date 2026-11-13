import React, { useState, useEffect } from "react";

/* ---------- Economics (mirrors the PRD) ---------- */
const LIMIT = 15000;
const MONTHLY_RATE = 0.014; // Tier A: 1.4% / month on the outstanding balance
const TODAY = new Date(2026, 8, 18);

const fmt = (n) => "€" + Math.round(n).toLocaleString("en-IE");
const fmt2 = (n) =>
  "€" + n.toLocaleString("en-IE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const addMonths = (d, m) => new Date(d.getFullYear(), d.getMonth() + m, d.getDate());
const fmtDate = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

const pmt = (P, n, r = MONTHLY_RATE) => (n === 1 ? P * (1 + r) : (P * r) / (1 - Math.pow(1 + r, -n)));
const quote = (P, n) => {
  const pay = pmt(P, n);
  return { pay, total: pay * n, fee: pay * n - P, apr: Math.pow(1 + MONTHLY_RATE, 12) - 1 };
};
const balance = (d) => {
  const r = MONTHLY_RATE;
  const b = d.principal * Math.pow(1 + r, d.paid) - d.pay * ((Math.pow(1 + r, d.paid) - 1) / r);
  return d.paid >= d.term ? 0 : Math.max(b, 0);
};
const makeDraw = (principal, term, start, paid = 0) => ({
  id: Math.random().toString(36).slice(2),
  principal, term, start, paid, pay: pmt(principal, term),
});

const FACTORS = [
  { k: "Inflow stability", w: 25, s: 88, d: "How steady weekly revenue has been over 12 months" },
  { k: "Cash runway", w: 20, s: 74, d: "How many days your balance covers fixed costs" },
  { k: "Payment behaviour", w: 15, s: 95, d: "Failed payments, overdraft days, reversals" },
  { k: "Revenue trend", w: 15, s: 81, d: "Last 90 days vs the 90 before" },
  { k: "Customer spread", w: 10, s: 69, d: "Share of revenue from your top 3 payers" },
  { k: "Relationship depth", w: 10, s: 90, d: "Account age, and how much of your business runs through Revolut" },
  { k: "Business checks", w: 5, s: 100, d: "Company registry, directors, sanctions" },
];
const SCORE = Math.round(FACTORS.reduce((a, f) => a + (f.w * f.s) / 100, 0));

const NOTES = {
  offer: ["The trigger, not the product.", "The offer only appears because the forecast says payroll (€14.2k) exceeds the projected balance (€9.8k). No gap, no offer. That's the anti-predatory guardrail and the core differentiator vs. a static loan page."],
  learn: ["Trust is the conversion lever.", "SMEs have been burned by opaque fees. This screen shows the real APR, what we look at, and what happens if you can't pay. Honesty here is cheaper than a support ticket later."],
  draw: ["The revolving line is the retention play.", "First draw is the acquisition moment. Every later draw costs ~zero to serve and needs no new decision, only a live limit check."],
  confirm: ["One screen, all the terms.", "Fee, APR, schedule, and auto-repay source are all visible before the tap. Regulators want it, and it lowers early-payment defaults from 'I didn't realise'."],
  funded: ["Speed is the product.", "Decision + disbursal to a Revolut account is instant. The '4 hours' SLA is only the ceiling for Tier B manual review or external payouts."],
  dashboard: ["Repayment clarity reduces losses.", "Next payment, source account and date are the top card. The limit-growth nudge rewards on-time repayment and lifts LTV without extra risk."],
};

/* ---------- Styles ---------- */
const CSS = `
.sc-root{--ink:#0b0d12;--muted:#6b7280;--line:#e6e8ee;--bg:#f4f5f8;--blue:#0666eb;--blue-soft:#e8f0fe;--green:#00a86b;--red:#e5484d;--card:#fff;
 font-family:-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",Roboto,sans-serif;color:var(--ink);min-height:100vh;background:#e9ebf1;display:flex;gap:40px;justify-content:center;align-items:flex-start;padding:32px 20px;box-sizing:border-box}
.sc-root *{box-sizing:border-box}
.sc-side{width:270px;position:sticky;top:32px;display:flex;flex-direction:column;gap:14px}
.sc-side h1{font-size:20px;margin:0;letter-spacing:-.02em}
.sc-side p{margin:0;font-size:13px;color:#4b5160;line-height:1.5}
.sc-jump{display:flex;flex-direction:column;gap:6px}
.sc-jump button{all:unset;cursor:pointer;font-size:13px;padding:9px 12px;border-radius:10px;background:#fff;color:var(--ink);border:1px solid var(--line)}
.sc-jump button.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.sc-note{background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px}
.sc-note b{display:block;font-size:13px;margin-bottom:6px}
.sc-note span{font-size:12.5px;color:#4b5160;line-height:1.5}
.sc-reset{all:unset;cursor:pointer;font-size:12px;color:var(--muted);text-decoration:underline}
.sc-phone{width:390px;height:812px;background:var(--bg);border-radius:46px;border:10px solid #0b0d12;overflow:hidden;position:relative;display:flex;flex-direction:column;box-shadow:0 30px 70px rgba(10,15,30,.28);flex:none}
.sc-status{height:44px;display:flex;justify-content:space-between;align-items:flex-end;padding:0 28px 6px;font-size:14px;font-weight:600;flex:none}
.sc-body{flex:1;overflow-y:auto;padding:4px 16px 24px;scrollbar-width:none}
.sc-body::-webkit-scrollbar{display:none}
.sc-top{display:flex;align-items:center;justify-content:space-between;height:40px;margin-bottom:6px}
.sc-back{all:unset;cursor:pointer;width:34px;height:34px;border-radius:50%;background:#fff;display:grid;place-items:center}
.sc-brand{font-size:13px;font-weight:600;color:var(--muted)}
.sc-chip{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;padding:5px 10px;border-radius:99px;background:var(--blue-soft);color:var(--blue)}
.sc-chip.g{background:#e3f6ee;color:#087a4d}
.sc-h1{font-size:26px;line-height:1.15;letter-spacing:-.03em;margin:12px 0 8px;font-weight:700}
.sc-sub{font-size:14.5px;line-height:1.45;color:#4b5160;margin:0 0 14px}
.sc-card{background:var(--card);border-radius:20px;padding:16px;margin-bottom:12px}
.sc-card h3{margin:0 0 4px;font-size:15px}
.sc-dark{background:var(--ink);color:#fff}
.sc-dark .sc-muted{color:#9aa1b1}
.sc-muted{color:var(--muted);font-size:13px}
.sc-big{font-size:44px;font-weight:700;letter-spacing:-.04em;line-height:1}
.sc-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:9px 0;font-size:14px}
.sc-row+.sc-row{border-top:1px solid var(--line)}
.sc-row b{font-weight:600}
.sc-btn{all:unset;cursor:pointer;display:block;width:100%;text-align:center;padding:15px;border-radius:16px;font-weight:600;font-size:15.5px;background:var(--blue);color:#fff;margin-top:10px}
.sc-btn.sec{background:#fff;color:var(--ink)}
.sc-btn.dark{background:var(--ink)}
.sc-btn.ghost{background:transparent;color:var(--muted);font-size:14px;padding:10px}
.sc-btn[aria-disabled=true]{opacity:.4;pointer-events:none}
.sc-btnrow{display:flex;gap:10px}
.sc-btnrow .sc-btn{margin-top:14px}
.sc-amt{text-align:center;padding:6px 0 2px}
.sc-amt .sc-big{font-size:48px}
.sc-slider{width:100%;-webkit-appearance:none;appearance:none;height:6px;border-radius:9px;outline:none;margin:14px 0 4px}
.sc-slider::-webkit-slider-thumb{-webkit-appearance:none;width:28px;height:28px;border-radius:50%;background:#fff;border:2px solid var(--blue);box-shadow:0 2px 8px rgba(6,102,235,.35);cursor:pointer}
.sc-slider::-moz-range-thumb{width:26px;height:26px;border-radius:50%;background:#fff;border:2px solid var(--blue);cursor:pointer}
.sc-scale{display:flex;justify-content:space-between;font-size:11.5px;color:var(--muted)}
.sc-seg{display:flex;background:var(--bg);border-radius:12px;padding:3px;margin:14px 0 6px}
.sc-seg button{all:unset;cursor:pointer;flex:1;text-align:center;padding:9px 0;border-radius:10px;font-size:13.5px;font-weight:600;color:var(--muted)}
.sc-seg button.on{background:#fff;color:var(--ink);box-shadow:0 1px 4px rgba(0,0,0,.1)}
.sc-bar{height:8px;border-radius:9px;background:rgba(255,255,255,.16);overflow:hidden;margin:14px 0 8px}
.sc-bar i{display:block;height:100%;background:#4d9bff;border-radius:9px;transition:width .5s}
.sc-bar.l{background:var(--bg)}
.sc-bar.l i{background:var(--blue)}
.sc-link{all:unset;cursor:pointer;color:var(--blue);font-size:13.5px;font-weight:600}
.sc-overlay{position:absolute;inset:0;background:rgba(10,13,18,.5);z-index:10;display:flex;align-items:flex-end}
.sc-sheet{background:#fff;border-radius:28px 28px 0 0;padding:20px 18px 26px;width:100%;max-height:82%;overflow-y:auto;animation:sc-up .25s ease}
@keyframes sc-up{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}
.sc-fac{margin:12px 0}
.sc-fac .t{display:flex;justify-content:space-between;font-size:13.5px;font-weight:600}
.sc-fac .d{font-size:12px;color:var(--muted);margin-top:2px}
.sc-fac .b{height:5px;background:var(--bg);border-radius:9px;margin-top:6px;overflow:hidden}
.sc-fac .b i{display:block;height:100%;background:var(--green);border-radius:9px}
.sc-step{display:flex;gap:12px;margin:12px 0}
.sc-step .n{flex:none;width:28px;height:28px;border-radius:50%;background:var(--blue-soft);color:var(--blue);font-weight:700;display:grid;place-items:center;font-size:13px}
.sc-step p{margin:0;font-size:13.5px;line-height:1.45;color:#4b5160}
.sc-step b{display:block;color:var(--ink);font-size:14.5px;margin-bottom:2px}
.sc-faq{border-top:1px solid var(--line)}
.sc-faq button{all:unset;cursor:pointer;display:flex;justify-content:space-between;width:100%;padding:13px 0;font-size:14px;font-weight:600}
.sc-faq p{margin:0 0 13px;font-size:13.5px;line-height:1.5;color:#4b5160}
.sc-check{width:84px;height:84px;border-radius:50%;background:var(--green);display:grid;place-items:center;margin:26px auto 18px;animation:sc-pop .5s cubic-bezier(.2,1.6,.4,1)}
@keyframes sc-pop{from{transform:scale(0)}to{transform:scale(1)}}
.sc-spin{width:46px;height:46px;border-radius:50%;border:4px solid var(--line);border-top-color:var(--blue);animation:sc-rot .8s linear infinite;margin:0 auto 16px}
@keyframes sc-rot{to{transform:rotate(360deg)}}
.sc-center{text-align:center}
.sc-toggle{width:44px;height:26px;border-radius:99px;background:var(--green);position:relative;flex:none}
.sc-toggle:after{content:"";position:absolute;right:3px;top:3px;width:20px;height:20px;border-radius:50%;background:#fff}
.sc-legend{display:flex;gap:14px;font-size:11.5px;color:var(--muted);margin-top:6px}
.sc-legend i{display:inline-block;width:10px;height:3px;border-radius:2px;margin-right:5px;vertical-align:middle}
.sc-check-row{display:flex;gap:10px;align-items:flex-start;font-size:12.5px;color:#4b5160;line-height:1.45;margin:12px 0 2px}
.sc-check-row input{margin-top:2px;width:18px;height:18px;accent-color:var(--blue)}
@media(max-width:900px){.sc-side{display:none}}
`;

/* ---------- Small pieces ---------- */
const Back = ({ onClick }) => (
  <button className="sc-back" onClick={onClick} aria-label="Back">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0b0d12" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
  </button>
);
const Top = ({ onBack, label = "Revolut Business" }) => (
  <div className="sc-top">
    {onBack ? <Back onClick={onBack} /> : <span style={{ width: 34 }} />}
    <span className="sc-brand">{label}</span>
    <span style={{ width: 34 }} />
  </div>
);

function Chart() {
  const raw = [[0,16900],[1,15800],[2,14100],[3,13200],[4,11500],[5,10800],[6,9840],[6,-4360],[7,-3900],[8,-2600],[9,-1200],[10,2100],[11,3400],[12,2800],[13,4900],[14,6200]];
  const W = 340, H = 130, pad = 6, lo = -7000, hi = 27000;
  const x = (d) => pad + (d / 14) * (W - pad * 2);
  const y = (v) => H - pad - ((v - lo) / (hi - lo)) * (H - pad * 2);
  const path = (off) => raw.map(([d, v], i) => `${i ? "L" : "M"}${x(d).toFixed(1)},${y(v + off).toFixed(1)}`).join(" ");
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Forecast balance over 14 days, dipping below zero on payroll day">
        <rect x={pad} y={y(0)} width={W - pad * 2} height={H - pad - y(0)} fill="#e5484d" opacity=".07" />
        <line x1={pad} x2={W - pad} y1={y(0)} y2={y(0)} stroke="#c9ccd6" strokeDasharray="3 3" />
        <line x1={x(6)} x2={x(6)} y1={pad} y2={H - pad} stroke="#c9ccd6" />
        <text x={x(6) + 5} y={16} fontSize="10" fill="#6b7280">Payroll 25 Sep</text>
        <path d={path(0)} fill="none" stroke="#e5484d" strokeWidth="2.2" strokeLinejoin="round" />
        <path d={path(8000)} fill="none" stroke="#0666eb" strokeWidth="2.2" strokeLinejoin="round" strokeDasharray="5 4" />
      </svg>
      <div className="sc-legend">
        <span><i style={{ background: "#e5484d" }} />Forecast today</span>
        <span><i style={{ background: "#0666eb" }} />With €8,000</span>
      </div>
    </div>
  );
}

function Picker({ amount, setAmount, term, setTerm, max }) {
  const min = 1000, top = Math.max(min, Math.floor(max / 500) * 500);
  const a = Math.min(amount, top);
  const q = quote(a, term);
  const pct = ((a - min) / (top - min || 1)) * 100;
  return (
    <div>
      <div className="sc-amt">
        <div className="sc-muted">You'll receive</div>
        <div className="sc-big">{fmt(a)}</div>
      </div>
      <input
        className="sc-slider" type="range" min={min} max={top} step={500} value={a}
        onChange={(e) => setAmount(+e.target.value)} aria-label="Amount"
        style={{ background: `linear-gradient(to right,#0666eb ${pct}%,#e6e8ee ${pct}%)` }}
      />
      <div className="sc-scale"><span>{fmt(min)}</span><span>{fmt(top)}</span></div>
      <div className="sc-seg" role="tablist">
        {[1, 3, 6].map((m) => (
          <button key={m} className={term === m ? "on" : ""} onClick={() => setTerm(m)}>{m} {m === 1 ? "month" : "months"}</button>
        ))}
      </div>
      <div className="sc-row"><span>{term === 1 ? "Repay in one payment" : `${term} monthly payments of`}</span><b>{fmt2(q.pay)}</b></div>
      <div className="sc-row"><span>Total cost of credit</span><b>{fmt2(q.fee)}</b></div>
      <div className="sc-row"><span>Rate</span><b>1.4% / month · {(q.apr * 100).toFixed(1)}% APR</b></div>
      <div className="sc-row"><span>Arrives</span><b style={{ color: "#087a4d" }}>Instantly, in your EUR account</b></div>
    </div>
  );
}

/* ---------- Screens ---------- */
function Offer({ amount, setAmount, term, setTerm, onTake, onLearn, onWhy }) {
  return (
    <>
      <Top label="Revolut Business" />
      <span className="sc-chip">● Pre-approved up to {fmt(LIMIT)}</span>
      <h1 className="sc-h1">Payroll is in 7 days. Your balance may fall short.</h1>
      <p className="sc-sub">We forecast <b>€9,840</b> on 25 Sep. Your payroll is <b>€14,200</b>. Here's a way to cover it without a bank visit.</p>
      <div className="sc-card">
        <Chart />
        <button className="sc-link" style={{ marginTop: 8 }} onClick={onWhy}>Why am I seeing this?</button>
      </div>
      <div className="sc-card">
        <h3>Suggested: €8,000</h3>
        <div className="sc-muted" style={{ marginBottom: 6 }}>Covers the €4,360 gap plus about two weeks of supplier payments. Adjust to fit.</div>
        <Picker amount={amount} setAmount={setAmount} term={term} setTerm={setTerm} max={LIMIT} />
      </div>
      <button className="sc-btn" onClick={onTake}>Get {fmt(amount)}</button>
      <button className="sc-btn sec" onClick={onLearn}>How SpendCredit works</button>
      <div className="sc-muted sc-center" style={{ fontSize: 12, marginTop: 10 }}>Viewing this offer doesn't affect your credit file. Not right now? You can ignore it, and we won't nag.</div>
    </>
  );
}

function Learn({ onBack, onSee }) {
  const [open, setOpen] = useState(0);
  const ex = quote(8000, 3);
  const faqs = [
    ["Do I need to give collateral or a business plan?", "No. Your decision is based on how money moves through your business account. No collateral, no personal guarantee on Tier A limits."],
    ["What if I can't repay on time?", "You get a 5-day grace period with no fee. After that, you can reschedule once for free. We'll contact you before anything is reported anywhere, and late fees are capped."],
    ["Why did I get this limit?", "Tap 'Why am I seeing this?' any time. We show the factors and their weights. If your limit is lower than you hoped, we tell you what would raise it."],
    ["Can I repay early?", "Yes, any time, with no penalty. You only pay the monthly fee on what's outstanding."],
  ];
  return (
    <>
      <Top onBack={onBack} label="SpendCredit" />
      <h1 className="sc-h1">Credit that sees your business the way you do.</h1>
      <p className="sc-sub">No forms. No branch. We use how your money already moves to decide in seconds.</p>
      <div className="sc-card">
        {[
          ["We spot the gap", "We forecast your balance 30 days ahead. If payroll or a supplier bill looks uncovered, we tell you early."],
          ["You pick the amount", "Move the slider. You see the exact cost and APR before you commit."],
          ["Money lands instantly", "Funds go straight to your Revolut Business account. Repayments come out automatically, on the dates you saw."],
        ].map(([t, d], i) => (
          <div className="sc-step" key={t}><div className="n">{i + 1}</div><p><b>{t}</b>{d}</p></div>
        ))}
      </div>
      <div className="sc-card">
        <h3>What we look at</h3>
        <div className="sc-muted">Seven things, weighted. Nothing hidden.</div>
        {FACTORS.map((f) => (
          <div className="sc-fac" key={f.k}>
            <div className="t"><span>{f.k}</span><span className="sc-muted">{f.w}%</span></div>
            <div className="d">{f.d}</div>
          </div>
        ))}
      </div>
      <div className="sc-card sc-dark">
        <div className="sc-muted">Example: {fmt(8000)} over 3 months</div>
        <div className="sc-row" style={{ borderColor: "#2a2f3a" }}><span>Total fee</span><b>{fmt2(ex.fee)}</b></div>
        <div className="sc-row" style={{ borderColor: "#2a2f3a" }}><span>Monthly payment</span><b>{fmt2(ex.pay)}</b></div>
        <div className="sc-row" style={{ borderColor: "#2a2f3a" }}><span>APR</span><b>{(ex.apr * 100).toFixed(1)}%</b></div>
      </div>
      <div className="sc-card">
        <h3>Straight answers</h3>
        {faqs.map(([q, a], i) => (
          <div className="sc-faq" key={q} style={i === 0 ? { borderTop: 0 } : null}>
            <button onClick={() => setOpen(open === i ? -1 : i)}><span>{q}</span><span>{open === i ? "–" : "+"}</span></button>
            {open === i && <p>{a}</p>}
          </div>
        ))}
      </div>
      <button className="sc-btn" onClick={onSee}>See my offer</button>
    </>
  );
}

function Confirm({ amount, term, phase, onApprove, onBack }) {
  const [ok, setOk] = useState(false);
  const q = quote(amount, term);
  const dates = Array.from({ length: term }, (_, i) => addMonths(TODAY, i + 1));
  if (phase === "verifying")
    return (
      <div className="sc-center" style={{ paddingTop: 150 }}>
        <div className="sc-spin" />
        <h3 style={{ margin: 0 }}>Confirming and sending funds…</h3>
        <div className="sc-muted" style={{ marginTop: 6 }}>Final check on your limit</div>
      </div>
    );
  return (
    <>
      <Top onBack={onBack} label="Review" />
      <h1 className="sc-h1">Confirm {fmt(amount)}</h1>
      <div className="sc-card">
        <div className="sc-row"><span>Amount</span><b>{fmt2(amount)}</b></div>
        <div className="sc-row"><span>Sent to</span><b>EUR Main · ••4821</b></div>
        <div className="sc-row"><span>Total fee</span><b>{fmt2(q.fee)}</b></div>
        <div className="sc-row"><span>Total to repay</span><b>{fmt2(q.total)}</b></div>
        <div className="sc-row"><span>APR</span><b>{(q.apr * 100).toFixed(1)}%</b></div>
      </div>
      <div className="sc-card">
        <h3>Repayment schedule</h3>
        {dates.map((d, i) => (
          <div className="sc-row" key={i}><span>{fmtDate(d)} · auto-debit</span><b>{fmt2(q.pay)}</b></div>
        ))}
        <div className="sc-muted" style={{ marginTop: 6 }}>Repay early any time. No penalty.</div>
      </div>
      <label className="sc-check-row">
        <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />
        <span>I understand the fee, the schedule, and that repayments come out of my EUR Main account automatically.</span>
      </label>
      <button className="sc-btn" aria-disabled={!ok} onClick={onApprove}>Confirm with Face ID</button>
    </>
  );
}

function Funded({ amount, onDone }) {
  return (
    <div className="sc-center" style={{ paddingTop: 30 }}>
      <div className="sc-check">
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
      </div>
      <h1 className="sc-h1" style={{ marginTop: 0 }}>{fmt(amount)} is in your account</h1>
      <p className="sc-sub">Decided in 2 seconds. Sent in 3. Payroll is covered.</p>
      <div className="sc-card" style={{ textAlign: "left" }}>
        <div className="sc-row"><span>Balance now</span><b>{fmt2(16900 + amount)}</b></div>
        <div className="sc-row"><span>First repayment</span><b>{fmtDate(addMonths(TODAY, 1))}</b></div>
        <div className="sc-row"><span>Autopay</span><b style={{ color: "#087a4d" }}>On</b></div>
      </div>
      <button className="sc-btn dark" onClick={onDone}>Go to SpendCredit</button>
    </div>
  );
}

function Dashboard({ draws, onDraw, onLearn, onWhy, onRepay }) {
  const outstanding = draws.reduce((a, d) => a + balance(d), 0);
  const available = LIMIT - outstanding;
  const sched = draws
    .flatMap((d) => Array.from({ length: d.term - d.paid }, (_, i) => ({ date: addMonths(d.start, d.paid + i + 1), amt: d.pay })))
    .sort((a, b) => a.date - b.date);
  const next = sched[0];
  const active = draws.filter((d) => d.paid < d.term);
  return (
    <>
      <Top label="SpendCredit" />
      <div className="sc-card sc-dark">
        <div className="sc-muted">Available to draw</div>
        <div className="sc-big" style={{ marginTop: 6 }}>{fmt2(available)}</div>
        <div className="sc-bar"><i style={{ width: `${(available / LIMIT) * 100}%` }} /></div>
        <div className="sc-muted" style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{fmt(outstanding)} in use</span><span>{fmt(LIMIT)} limit</span>
        </div>
        <div className="sc-btnrow">
          <button className="sc-btn" aria-disabled={available < 1000} onClick={onDraw}>Draw funds</button>
          <button className="sc-btn sec" aria-disabled={!next} onClick={onRepay}>Pay next early</button>
        </div>
      </div>
      {next && (
        <div className="sc-card">
          <div className="sc-muted">Next repayment</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 4 }}>
            <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-.03em" }}>{fmt2(next.amt)}</span>
            <span style={{ fontWeight: 600 }}>{fmtDate(next.date)}</span>
          </div>
          <div className="sc-row" style={{ marginTop: 6 }}>
            <span>Autopay from EUR Main ••4821</span><span className="sc-toggle" />
          </div>
        </div>
      )}
      {active.length > 0 && (
        <div className="sc-card">
          <h3>Active draws</h3>
          {active.map((d) => (
            <div key={d.id} style={{ padding: "10px 0" }}>
              <div className="sc-row" style={{ padding: 0, borderTop: 0 }}>
                <b>{fmt(d.principal)} · {d.term} {d.term === 1 ? "month" : "months"}</b>
                <span className="sc-muted">{d.paid} of {d.term} paid</span>
              </div>
              <div className="sc-bar l"><i style={{ width: `${(d.paid / d.term) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      )}
      <div className="sc-card" style={{ background: "var(--blue-soft)" }}>
        <span className="sc-chip g">Score band A · {SCORE}/100</span>
        <p style={{ margin: "10px 0 4px", fontSize: 14, lineHeight: 1.45 }}>
          <b>Repay 3 draws on time</b> and we'll review your limit for up to €25,000.
        </p>
        <button className="sc-link" onClick={onWhy}>See what drives your score</button>
      </div>
      <button className="sc-btn ghost" onClick={onLearn}>How SpendCredit works</button>
    </>
  );
}

function WhySheet({ onClose }) {
  return (
    <div className="sc-overlay" onClick={onClose}>
      <div className="sc-sheet" onClick={(e) => e.stopPropagation()}>
        <span className="sc-chip g">Score band A · {SCORE}/100</span>
        <h3 style={{ margin: "10px 0 2px", fontSize: 19 }}>Why we're offering this</h3>
        <p className="sc-muted" style={{ marginTop: 0 }}>Payroll (€14,200) is larger than the balance we expect on 25 Sep (€9,840). Your business also looks healthy enough to borrow safely.</p>
        {FACTORS.map((f) => (
          <div className="sc-fac" key={f.k}>
            <div className="t"><span>{f.k} <span className="sc-muted" style={{ fontWeight: 400 }}>· {f.w}%</span></span><span>{f.s}</span></div>
            <div className="b"><i style={{ width: `${f.s}%` }} /></div>
          </div>
        ))}
        <p className="sc-muted">Weakest area: customer spread. Your top 3 customers are 44% of revenue. Widening that would raise your limit.</p>
        <button className="sc-btn dark" onClick={onClose}>Got it</button>
      </div>
    </div>
  );
}

/* ---------- App ---------- */
export default function SpendCredit() {
  const [screen, setScreen] = useState("offer");
  const [amount, setAmount] = useState(8000);
  const [term, setTerm] = useState(3);
  const [draws, setDraws] = useState([]);
  const [phase, setPhase] = useState("review");
  const [sheet, setSheet] = useState(false);
  const [from, setFrom] = useState("offer");
  const seed = () => [makeDraw(5000, 3, new Date(2026, 7, 18), 1)];

  useEffect(() => {
    if (phase !== "verifying") return;
    const t = setTimeout(() => {
      setDraws((d) => [...d, makeDraw(amount, term, TODAY)]);
      setPhase("review");
      setScreen("funded");
    }, 1500);
    return () => clearTimeout(t);
  }, [phase]);

  const outstanding = draws.reduce((a, d) => a + balance(d), 0);
  const available = LIMIT - outstanding;
  const jump = (s) => {
    if (s === "dashboard" && !draws.length) setDraws(seed());
    if (s === "draw") setAmount((a) => Math.min(a, Math.max(1000, Math.floor(available / 500) * 500)));
    setPhase("review");
    setScreen(s);
  };
  const reset = () => { setDraws([]); setAmount(8000); setTerm(3); setPhase("review"); setScreen("offer"); };
  const repayNext = () => {
    setDraws((ds) => {
      const i = ds.findIndex((d) => d.paid < d.term);
      return i < 0 ? ds : ds.map((d, j) => (j === i ? { ...d, paid: d.paid + 1 } : d));
    });
  };

  let view;
  if (screen === "offer")
    view = <Offer amount={amount} setAmount={setAmount} term={term} setTerm={setTerm}
      onTake={() => { setFrom("offer"); jump("confirm"); }} onLearn={() => { setFrom("offer"); jump("learn"); }} onWhy={() => setSheet(true)} />;
  else if (screen === "learn")
    view = <Learn onBack={() => jump(draws.length ? "dashboard" : "offer")} onSee={() => jump(draws.length ? "dashboard" : "offer")} />;
  else if (screen === "draw")
    view = (
      <>
        <Top onBack={() => jump("dashboard")} label="Draw funds" />
        <h1 className="sc-h1">How much do you need?</h1>
        <p className="sc-sub">{fmt(available)} available. Same rate, no new application.</p>
        <div className="sc-card"><Picker amount={amount} setAmount={setAmount} term={term} setTerm={setTerm} max={available} /></div>
        <button className="sc-btn" onClick={() => { setFrom("draw"); jump("confirm"); }}>Continue</button>
      </>
    );
  else if (screen === "confirm")
    view = <Confirm amount={Math.min(amount, Math.max(1000, Math.floor((draws.length ? available : LIMIT) / 500) * 500))} term={term} phase={phase}
      onBack={() => jump(from)} onApprove={() => setPhase("verifying")} />;
  else if (screen === "funded")
    view = <Funded amount={draws.length ? draws[draws.length - 1].principal : amount} onDone={() => jump("dashboard")} />;
  else
    view = <Dashboard draws={draws} onDraw={() => jump("draw")} onLearn={() => jump("learn")} onWhy={() => setSheet(true)} onRepay={repayNext} />;

  const nav = [["offer", "1 · Proactive offer"], ["learn", "2 · Learn more"], ["confirm", "3 · Confirm"], ["funded", "4 · Funded"], ["dashboard", "5 · Dashboard (returning)"], ["draw", "6 · Draw again"]];
  const note = NOTES[screen];

  return (
    <div className="sc-root">
      <style>{CSS}</style>
      <aside className="sc-side">
        <div>
          <h1>SpendCredit</h1>
          <p>Prototype for Revolut Business. Persona: Kalamata Roasters, a 6-person café supplier. Demo date: 18 Sep 2026.</p>
        </div>
        <div className="sc-jump">
          {nav.map(([s, l]) => (
            <button key={s} className={screen === s ? "on" : ""} onClick={() => jump(s)}>{l}</button>
          ))}
        </div>
        <div className="sc-note"><b>PM note: {note[0]}</b><span>{note[1]}</span></div>
        <button className="sc-reset" onClick={reset}>Reset demo</button>
      </aside>
      <div className="sc-phone">
        <div className="sc-status"><span>9:41</span><span>●●● ▮</span></div>
        <div className="sc-body">{view}</div>
        {sheet && <WhySheet onClose={() => setSheet(false)} />}
      </div>
    </div>
  );
}
