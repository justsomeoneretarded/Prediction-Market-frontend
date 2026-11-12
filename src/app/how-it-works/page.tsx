'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/primitives';

// Float math is fine here: this is an illustration only. Real trades are priced on the server
// with 40-digit decimals.
const priceYes = (y: number, n: number, b: number) => 1 / (1 + Math.exp((n - y) / b));
const sharesFor = (m: number, b: number, y: number, n: number) => {
  const C = b * Math.log(0.5 * Math.exp(y / b) + 0.5 * Math.exp(n / b));
  return b * Math.log(2 * Math.exp((C + m) / b) - Math.exp(n / b)) - y;
};

export default function HowItWorks() {
  const [spend, setSpend] = useState(1000);
  const [b, setB] = useState(1000);
  const sim = useMemo(() => {
    const sh = sharesFor(spend, b, 0, 0);
    return { sh, avg: spend / sh, after: priceYes(sh, 0, b), maxLoss: b * Math.log(2) };
  }, [spend, b]);

  return (
    <div className="mx-auto max-w-3xl fade-in">
      <h1 className="text-3xl font-semibold tracking-tight">How Tinbit works</h1>
      <p className="mt-3 text-muted">Three ideas: prices are probabilities, a market maker is always ready to trade, and every market is settled from a public source with a second pair of eyes.</p>

      <Step n={1} title="A price is a probability">
        Every market is a YES/NO question. A YES share pays <b>1 birr</b> if the answer is YES and 0 otherwise. If YES trades at 62¢, the crowd thinks
        there is roughly a 62% chance. Buy YES if you think the real chance is higher; buy NO if you think it is lower. You can sell any time before the market closes.
      </Step>

      <Step n={2} title="An automated market maker sets the price">
        <p>
          You never wait for another person to take the other side. Tinbit’s market maker uses the <b>Logarithmic Market Scoring Rule</b> (LMSR):
        </p>
        <pre className="my-3 overflow-x-auto rounded-xl bg-surface-2 p-3 text-sm">C(qYES, qNO) = b · ln(e^(qYES/b) + e^(qNO/b))
price(YES)  = e^(qYES/b) / (e^(qYES/b) + e^(qNO/b))
cost of a trade = C(after) − C(before)</pre>
        <p>Buying YES raises its price; bigger trades move it more; a larger <i>b</i> (more liquidity) moves it less. You pay the exact area under the price curve, so your average price is always a little worse than the price you saw before trading.</p>

        <Card className="mt-4 p-4">
          <div className="text-sm font-medium">Try it on a fresh 50/50 market</div>
          <label className="mt-3 block text-xs text-muted">Spend on YES: <b className="tabular text-text">{spend.toLocaleString()} Br</b></label>
          <input type="range" min={10} max={5000} step={10} value={spend} onChange={(e) => setSpend(+e.target.value)} className="w-full accent-[var(--brand)]" />
          <label className="mt-2 block text-xs text-muted">Liquidity b: <b className="tabular text-text">{b.toLocaleString()}</b></label>
          <input type="range" min={100} max={10000} step={100} value={b} onChange={(e) => setB(+e.target.value)} className="w-full accent-[var(--brand)]" />
          <div className="tabular mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Out label="Shares received" v={sim.sh.toFixed(2)} />
            <Out label="Average price" v={`${(sim.avg * 100).toFixed(1)}¢`} />
            <Out label="New YES price" v={`${(sim.after * 100).toFixed(1)}%`} />
            <Out label="Pays if YES" v={`${sim.sh.toFixed(0)} Br`} />
          </div>
        </Card>
      </Step>

      <Step n={3} title="The house can’t run out of money">
        Before a market opens, Tinbit moves the market maker’s <b>maximum possible loss</b> — b·ln(1/p) where p is the less likely starting probability
        ({Math.round(sim.maxLoss)} Br for b = {b} at 50/50) — from its reserve into the market’s escrow. Every birr traders pay also goes into that escrow.
        Mathematically this always covers the winning side, so payouts are guaranteed. When the market settles, whatever is left returns to the reserve.
      </Step>

      <Step n={4} title="Results are verified, reviewed and disputable">
        <ol className="mt-2 space-y-1.5 text-sm">
          <li>① Trading closes (at kickoff for football — no in-play betting).</li>
          <li>② A resolver proposes the outcome with evidence from the official source (football results can come from a data provider automatically).</li>
          <li>③ A <b>different</b> reviewer confirms it.</li>
          <li>④ A dispute window opens — anyone who traded can challenge the result.</li>
          <li>⑤ After the window, the result is final and every position is paid in one atomic step: 1 Br per winning share.</li>
        </ol>
        <p className="mt-2 text-sm text-muted">If an event is cancelled, the market’s cancellation rule applies — usually each trader gets back what they net-paid in.</p>
      </Step>

      <Step n={5} title="Virtual money only">
        Tinbit currently runs on <b>virtual birr with no cash value</b>. Real-money operation would require licensing and independent security and financial audits.
      </Step>

      <div className="mt-10 text-center"><Link href="/markets" className="inline-flex h-11 items-center rounded-xl bg-text px-5 font-medium text-bg">Explore markets</Link></div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 flex gap-4">
      <div className="grid size-8 shrink-0 place-items-center rounded-full bg-text text-sm font-semibold text-bg">{n}</div>
      <div className="min-w-0 flex-1 leading-relaxed">
        <h2 className="mb-1.5 text-lg font-semibold tracking-tight">{title}</h2>
        <div className="text-[15px]">{children}</div>
      </div>
    </section>
  );
}
function Out({ label, v }: { label: string; v: string }) {
  return <div><div className="text-xs text-muted">{label}</div><div className="font-semibold">{v}</div></div>;
}
