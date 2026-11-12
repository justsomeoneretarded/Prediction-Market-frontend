'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { ArrowLeft, ExternalLink, ShieldCheck, Scale, Droplets, AlertTriangle } from 'lucide-react';
import type { MarketDetail, TradeRow } from '@/lib/types';
import { useSocketEvent } from '@/lib/realtime';
import { useI18n, useLocalized } from '@/lib/i18n';
import { ago, birr, CATEGORY_LABEL, date, num, pct, timeLeft } from '@/lib/format';
import { LineChart } from '@/components/chart';
import { TradePanel } from '@/components/trade-panel';
import { MarketCard } from '@/components/market-card';
import { Badge, Button, Card, Skeleton, Tabs, Textarea, ErrorText } from '@/components/ui/primitives';
import { useMe } from '@/lib/session';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/status-badge';

const RANGES = [{ value: '1d', label: '1D' }, { value: '1w', label: '1W' }, { value: '1m', label: '1M' }, { value: 'all', label: 'All' }] as const;

export default function MarketPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { t, locale } = useI18n();
  const L = useLocalized();
  const [range, setRange] = useState<string>('all');
  const [outcome, setOutcome] = useState<'YES' | 'NO'>('YES');
  const [tab, setTab] = useState<'rules' | 'activity' | 'liquidity'>('rules');
  const { data: m, mutate, error } = useSWR<MarketDetail>(`/markets/${slug}`);
  const { data: hist, mutate: mutateHist } = useSWR<{ t: number; p: number }[]>(`/markets/${slug}/history?range=${range}`);

  // live: any trade/status change on this market → refetch authoritative state
  useSocketEvent<{ id?: string; marketId?: string }>('market:update', (p) => p.id === m?.id && (mutate(), mutateHist()));
  useSocketEvent<TradeRow & { marketId: string }>('trade', (p) => p.marketId === m?.id && (mutate(), mutateHist()));

  if (error) return <div className="py-20 text-center text-muted">Market not found. <Link href="/markets" className="underline">Browse markets</Link></div>;
  if (!m) return <div className="space-y-4"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-64 w-full" /><Skeleton className="h-40 w-full" /></div>;

  const yes = Number(m.yesPrice);
  const finished = m.status === 'RESOLVED' || m.status === 'CANCELLED';
  return (
    <div className="fade-in">
      <Link href="/markets" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-text"><ArrowLeft className="size-4" />{t('nav.markets')}</Link>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-surface-2 text-2xl">{m.imageEmoji ?? '•'}</div>
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                <span>{CATEGORY_LABEL[m.category]?.[locale]}</span>
                <StatusBadge status={m.status} halted={m.tradingHalted} />
                {m.isDemo && <Badge tone="gold">{t('market.demo')}</Badge>}
              </div>
              <h1 className={cn('text-xl font-semibold leading-snug tracking-tight md:text-2xl', locale === 'am' && m.questionAm && 'font-ethiopic')} data-testid="market-question">{L(m.question, m.questionAm)}</h1>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-3">
            <div>
              <div className="tabular text-4xl font-semibold tracking-tight" data-testid="yes-price">{finished && m.resolvedOutcome !== 'CANCELLED' ? m.resolvedOutcome : pct(yes)}</div>
              <div className="text-sm text-muted">{finished ? (m.resolvedOutcome === 'CANCELLED' ? 'Cancelled — refunds paid' : 'Final outcome') : `${m.yesLabel} · ${t('market.chance')}`}</div>
            </div>
            <Mini label={t('market.volume')} value={birr(m.volume, true)} />
            <Mini label="Trades" value={num(m.tradesCount, 0)} />
            <Mini label={t('market.closes')} value={m.status === 'OPEN' ? timeLeft(m.closesAt, new Date(m.now).getTime()) : date(m.closesAt)} />
          </div>

          <Card className="mt-5 p-4">
            <div className="mb-2 flex justify-end"><Tabs value={range} onChange={setRange} items={RANGES.map((r) => ({ ...r }))} /></div>
            <LineChart data={(hist ?? []).map((p) => ({ t: p.t, v: p.p }))} domain={[0, 1]} format={(v) => `${Math.round(v * 100)}%`} testId="price-chart" />
          </Card>

          <div className="mt-5 lg:hidden"><TradePanel m={m} outcome={outcome} setOutcome={setOutcome} /></div>

          {m.proposal && <ResolutionBox m={m} />}

          <div className="mt-6">
            <Tabs value={tab} onChange={setTab} items={[{ value: 'rules', label: t('market.rules') }, { value: 'activity', label: t('market.activity') }, { value: 'liquidity', label: t('market.liquidity') }]} />
            <div className="mt-4">
              {tab === 'rules' && (
                <div className="space-y-5 text-[15px] leading-relaxed">
                  <p className="text-muted">{m.description}</p>
                  <Block icon={<Scale className="size-4" />} title={t('market.rules')}>{m.resolutionRules}</Block>
                  <Block icon={<ShieldCheck className="size-4" />} title={t('market.source')}>
                    {m.sourcePrimary}{m.sourceBackup && <span className="block text-sm text-muted">{t('market.backup')}: {m.sourceBackup}</span>}
                  </Block>
                  <Block icon={<AlertTriangle className="size-4" />} title={t('market.cancellation')}>
                    {m.cancellationRules}
                    <span className="block text-sm text-muted">Policy: {m.cancellationPolicy === 'REFUND_NET_COST' ? 'refund each trader’s net cost (fees excluded)' : 'shares paid at the last pre-close price'} · Dispute window {m.disputeHours}h</span>
                  </Block>
                  <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                    <Mini label="Opens" value={date(m.opensAt)} />
                    <Mini label={t('market.closes')} value={date(m.closesAt)} />
                    <Mini label="Expected resolution" value={date(m.resolvesAt)} />
                  </div>
                </div>
              )}
              {tab === 'activity' && <Activity trades={m.recentTrades} yesLabel={m.yesLabel} noLabel={m.noLabel} />}
              {tab === 'liquidity' && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <Mini label="Liquidity (b)" value={num(m.liquidity.liquidityB, 0)} />
                  <Mini label="Market-maker collateral" value={birr(m.liquidity.subsidy)} />
                  <Mini label="Max operator loss" value={birr(m.liquidity.maxLossBound)} />
                  <Mini label={`Pays if ${m.yesLabel}`} value={birr(m.liquidity.payoutIfYes)} />
                  <Mini label={`Pays if ${m.noLabel}`} value={birr(m.liquidity.payoutIfNo)} />
                  <Mini label="Starting probability" value={pct(m.initialProbability)} />
                  <p className="col-span-full flex gap-2 text-sm text-muted"><Droplets className="mt-0.5 size-4 shrink-0" />Tinbit’s automated market maker always quotes a price, so you can trade even when nobody else is on the other side. Its maximum possible loss is capped and fully funded before the market opens.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24"><TradePanel m={m} outcome={outcome} setOutcome={setOutcome} /></div>
        </aside>
      </div>

      {m.related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 text-lg font-semibold">{t('market.related')}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{m.related.map((r) => <MarketCard key={r.id} m={r} />)}</div>
        </section>
      )}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><div className="text-xs text-muted">{label}</div><div className="tabular mt-0.5 text-sm font-medium">{value}</div></div>;
}
function Block({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted">{icon}</div>
      <div><div className="text-sm font-medium">{title}</div><div className="mt-0.5">{children}</div></div>
    </div>
  );
}

function Activity({ trades, yesLabel, noLabel }: { trades: TradeRow[]; yesLabel: string; noLabel: string }) {
  if (!trades.length) return <p className="text-sm text-muted">No trades yet — be the first.</p>;
  return (
    <ul className="divide-y divide-border" data-testid="recent-trades">
      {trades.map((tr) => (
        <li key={tr.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
          <span className="min-w-0 truncate">
            <span className="font-medium">@{tr.username}</span>{' '}
            <span className="text-muted">{tr.side === 'BUY' ? 'bought' : 'sold'}</span>{' '}
            <span className={tr.outcome === 'YES' ? 'text-yes' : 'text-no'}>{num(tr.shares)} {tr.outcome === 'YES' ? yesLabel : noLabel}</span>
          </span>
          <span className="tabular shrink-0 text-muted">{birr(tr.amount)} · {ago(tr.createdAt)}</span>
        </li>
      ))}
    </ul>
  );
}

function ResolutionBox({ m }: { m: MarketDetail }) {
  const p = m.proposal!;
  const { me } = useMe();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const canDispute = me && p.status === 'CONFIRMED' && p.disputeEndsAt && new Date(p.disputeEndsAt) > new Date(m.now);
  const submit = async () => {
    try {
      await api(`/proposals/${p.id}/dispute`, { body: { reason } });
      toast('Dispute submitted');
      setOpen(false);
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  return (
    <Card className="mt-5 border-gold/40 p-4" data-testid="resolution-box">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm">
          <span className="font-medium">Proposed result: </span>
          <Badge tone={p.outcome === 'YES' ? 'yes' : p.outcome === 'NO' ? 'no' : 'neutral'}>{p.outcome}</Badge>
          <span className="ml-2 text-muted">{p.status.replace('_', ' ').toLowerCase()} · {p.source.toLowerCase()}</span>
        </div>
        {p.disputeEndsAt && p.status !== 'FINALIZED' && <span className="text-xs text-muted">Dispute window ends {date(p.disputeEndsAt)}</span>}
      </div>
      <p className="mt-2 text-sm text-muted">{p.evidenceNotes}</p>
      {/^https?:/.test(p.evidenceUrl) && <a href={p.evidenceUrl} target="_blank" rel="noreferrer noopener" className="mt-1 inline-flex items-center gap-1 text-sm text-brand">Evidence <ExternalLink className="size-3" /></a>}
      {canDispute && !open && <Button variant="ghost" size="sm" className="mt-2" onClick={() => setOpen(true)}>Dispute this result</Button>}
      {open && (
        <div className="mt-3 space-y-2">
          <Textarea placeholder="Why is this result wrong? Link to the official source if you can." value={reason} onChange={(e) => setReason(e.target.value)} />
          <ErrorText>{err}</ErrorText>
          <div className="flex gap-2"><Button size="sm" onClick={submit} disabled={reason.length < 10}>Submit dispute</Button><Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button></div>
        </div>
      )}
    </Card>
  );
}
