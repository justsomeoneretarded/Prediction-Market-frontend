'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import useSWR, { useSWRConfig } from 'swr';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Portfolio, PositionView } from '@/lib/types';
import { useMe } from '@/lib/session';
import { useI18n, useLocalized } from '@/lib/i18n';
import { birr, cents, date, num } from '@/lib/format';
import { api } from '@/lib/api';
import { uid } from '@/lib/utils';
import { LineChart } from '@/components/chart';
import { Badge, Button, Card, Empty, ErrorText, Input, Pnl, Skeleton, Stat, Tabs } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { StatusBadge } from '@/components/status-badge';

type Tab = 'positions' | 'trades' | 'wallet';

function PortfolioInner() {
  const { me, loading } = useMe();
  const { t } = useI18n();
  const router = useRouter();
  const sp = useSearchParams();
  const [tab, setTab] = useState<Tab>((sp.get('tab') as Tab) ?? 'positions');
  const { data: p } = useSWR<Portfolio>(me ? '/portfolio' : null);
  const { data: perf } = useSWR<{ t: number; v: number }[]>(me ? '/portfolio/performance' : null);
  if (!loading && !me) {
    router.replace('/login?next=/portfolio');
    return null;
  }
  return (
    <div className="fade-in">
      <h1 className="text-2xl font-semibold tracking-tight">{t('pf.title')}</h1>
      <Card className="mt-4 p-5">
        {!p ? <Skeleton className="h-16 w-full" /> : (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-5">
            <Stat label={t('pf.value')} value={<span data-testid="pf-value">{birr(p.portfolioValue)}</span>} className="col-span-2 md:col-span-1 [&>div:nth-child(2)]:text-2xl" />
            <Stat label={t('pf.cash')} value={<span data-testid="pf-cash">{birr(p.cash.available)}</span>} sub={Number(p.cash.reserved) > 0 ? `${birr(p.cash.reserved)} on hold` : undefined} />
            <Stat label={t('pf.positions')} value={birr(p.positionsValue)} />
            <Stat label={t('pf.unrealized')} value={<Pnl value={p.unrealizedPnl} />} />
            <Stat label={t('pf.realized')} value={<Pnl value={p.realizedPnl} />} />
          </div>
        )}
        {perf && perf.length > 1 && <div className="mt-5"><LineChart data={perf} height={140} format={(v) => birr(v, true)} /></div>}
      </Card>
      <Tabs className="mt-6 w-fit" value={tab} onChange={setTab} items={[{ value: 'positions', label: t('pf.positions') }, { value: 'trades', label: t('pf.trades') }, { value: 'wallet', label: t('pf.wallet') }]} />
      <div className="mt-4">
        {tab === 'positions' && <Positions p={p} />}
        {tab === 'trades' && <Trades />}
        {tab === 'wallet' && <WalletTab />}
      </div>
    </div>
  );
}

function Positions({ p }: { p?: Portfolio }) {
  const { t } = useI18n();
  if (!p) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="space-y-6">
      {p.openPositions.length === 0 ? <Empty>{t('pf.empty')} <Link href="/markets" className="underline">Browse markets</Link></Empty> : (
        <div className="space-y-2" data-testid="open-positions">{p.openPositions.map((x) => <PositionRow key={x.marketId} x={x} />)}</div>
      )}
      {p.closedPositions.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-muted">{t('pf.closed')}</h3>
          <div className="space-y-2" data-testid="closed-positions">{p.closedPositions.map((x) => <PositionRow key={x.marketId} x={x} closed />)}</div>
        </div>
      )}
    </div>
  );
}

function PositionRow({ x, closed }: { x: PositionView; closed?: boolean }) {
  const L = useLocalized();
  const holdings = [
    Number(x.yesShares) > 0 && { o: 'YES', sh: x.yesShares, avg: x.yesAvgPrice },
    Number(x.noShares) > 0 && { o: 'NO', sh: x.noShares, avg: x.noAvgPrice },
  ].filter(Boolean) as { o: string; sh: string; avg: string | null }[];
  return (
    <Link href={`/markets/${x.slug}`} className="block rounded-2xl border border-border bg-surface p-4 transition hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="line-clamp-2 text-[15px] font-medium">{L(x.question, x.questionAm)}</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <StatusBadge status={x.status} />
            {holdings.map((h) => <Badge key={h.o} tone={h.o === 'YES' ? 'yes' : 'no'}>{num(h.sh)} {h.o}{h.avg && !closed ? ` @ ${cents(h.avg)}` : ''}</Badge>)}
          </div>
        </div>
        <div className="shrink-0 text-right">
          {closed ? (
            <>
              <div className="tabular font-semibold">{x.settledPayout ? birr(x.settledPayout) : '—'}</div>
              <div className="text-xs"><Pnl value={x.realizedPnl} /></div>
            </>
          ) : (
            <>
              <div className="tabular font-semibold">{birr(x.value)}</div>
              <div className="text-xs"><Pnl value={x.unrealizedPnl} /></div>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

function Trades() {
  const { data } = useSWR<{ id: string; slug: string; question: string; side: string; outcome: string; shares: string; total: string; avgPrice: string; fee: string; createdAt: string }[]>('/portfolio/trades');
  if (!data) return <Skeleton className="h-40 w-full" />;
  if (!data.length) return <Empty>No trades yet.</Empty>;
  return (
    <Card className="divide-y divide-border" data-testid="trade-history">
      {data.map((r) => (
        <Link key={r.id} href={`/markets/${r.slug}`} className="flex items-center justify-between gap-3 p-3.5 text-sm hover:bg-surface-2/50">
          <div className="min-w-0">
            <div className="truncate font-medium">{r.question}</div>
            <div className="text-xs text-muted">
              <span className={r.side === 'BUY' ? 'text-yes' : 'text-no'}>{r.side}</span> {num(r.shares)} {r.outcome} @ {cents(r.avgPrice)} · fee {birr(r.fee)} · {date(r.createdAt)}
            </div>
          </div>
          <div className="tabular shrink-0 font-medium">{r.side === 'BUY' ? '−' : '+'}{birr(r.total)}</div>
        </Link>
      ))}
    </Card>
  );
}

const KIND: Record<string, string> = {
  SIGNUP_BONUS: 'Welcome bonus', TRADE_BUY: 'Buy', TRADE_SELL: 'Sell', SETTLEMENT_PAYOUT: 'Settlement payout', CANCELLATION_REFUND: 'Cancellation refund',
  DEPOSIT: 'Deposit (simulated)', WITHDRAWAL_HOLD: 'Withdrawal hold', WITHDRAWAL_RELEASE: 'Withdrawal released', WITHDRAWAL_PAYOUT: 'Withdrawal paid', ADMIN_ADJUSTMENT: 'Adjustment',
};

function WalletTab() {
  const { t } = useI18n();
  const toast = useToast();
  const { mutate } = useSWRConfig();
  const { refresh } = useMe();
  const { data: tx } = useSWR<{ id: string; kind: string; memo: string; account: string; amount: string; balanceAfter: string; createdAt: string }[]>('/wallet/transactions');
  const { data: w } = useSWR<{ payments: { id: string; kind: string; amount: string; status: string; createdAt: string }[] }>('/wallet');
  const [amount, setAmount] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const go = async (kind: 'deposit' | 'withdraw') => {
    setErr(null);
    try {
      const r = await api<{ status: string }>(`/wallet/${kind}`, { body: { amount, idempotencyKey: uid() } });
      toast(kind === 'deposit' ? 'Simulated deposit completed' : r.status === 'COMPLETED' ? 'Withdrawal completed' : 'Withdrawal requested — awaiting review');
      setAmount('');
      await Promise.all([mutate('/wallet/transactions'), mutate('/wallet'), mutate('/portfolio'), refresh()]);
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Card className="h-fit p-4">
        <div className="text-sm font-medium">Simulated deposits & withdrawals</div>
        <p className="mt-1 text-xs text-muted">For testing only. No real money moves. Withdrawals are held until an admin approves them.</p>
        <Input className="mt-3" inputMode="decimal" placeholder="Amount (Br)" value={amount} onChange={(e) => /^\d*\.?\d{0,2}$/.test(e.target.value) && setAmount(e.target.value)} />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => go('deposit')} disabled={!amount}>{t('pf.deposit')}</Button>
          <Button variant="secondary" onClick={() => go('withdraw')} disabled={!amount}>{t('pf.withdraw')}</Button>
        </div>
        <div className="mt-2"><ErrorText>{err}</ErrorText></div>
        {!!w?.payments.length && (
          <ul className="mt-4 space-y-1.5 text-xs">
            {w.payments.slice(0, 5).map((p) => <li key={p.id} className="flex justify-between"><span>{p.kind.toLowerCase()} {birr(p.amount)}</span><Badge>{p.status.toLowerCase().replace('_', ' ')}</Badge></li>)}
          </ul>
        )}
      </Card>
      <Card className="divide-y divide-border" data-testid="tx-history">
        <div className="p-3.5 text-sm font-medium">{t('pf.history')}</div>
        {!tx ? <Skeleton className="m-4 h-20" /> : tx.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-3 p-3.5 text-sm">
            <div className="min-w-0">
              <div className="font-medium">{KIND[r.kind] ?? r.kind}{r.account === 'USER_RESERVED' && <span className="text-muted"> (held)</span>}</div>
              <div className="truncate text-xs text-muted">{r.memo} · {date(r.createdAt)}</div>
            </div>
            <div className="shrink-0 text-right">
              <Pnl value={r.amount} className="font-medium" />
              <div className="tabular text-xs text-muted">{birr(r.balanceAfter)}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

export default function PortfolioPage() {
  return <Suspense><PortfolioInner /></Suspense>;
}
