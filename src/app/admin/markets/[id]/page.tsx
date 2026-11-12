'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import type { Liquidity, MarketDetail } from '@/lib/types';
import { birr, date, num, pct } from '@/lib/format';
import { Badge, Button, Card, Input, Label, Select, Skeleton, Textarea } from '@/components/ui/primitives';
import { KPI, useAction } from '@/components/admin/shared';
import { StatusBadge } from '@/components/status-badge';

export default function AdminMarket({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: m, mutate } = useSWR<MarketDetail>(`/admin/markets/${id}`);
  const { data: risk, mutate: mutateRisk } = useSWR<Liquidity>(`/admin/markets/${id}/risk`);
  const { busy, run, post } = useAction();
  const [outcome, setOutcome] = useState('YES');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [notes, setNotes] = useState('');
  const refresh = () => Promise.all([mutate(), mutateRisk()]);
  if (!m) return <Skeleton className="h-64" />;
  const act = (key: string, path: string, body: unknown, ok: string) => run(key, () => post(path, body), ok).then(refresh);

  return (
    <div className="space-y-5 fade-in">
      <Link href="/admin?s=markets" className="text-sm text-muted hover:text-text">← Markets</Link>
      <div>
        <div className="flex flex-wrap items-center gap-2"><StatusBadge status={m.status} halted={m.tradingHalted} />{m.isDemo && <Badge tone="gold">demo</Badge>}<span className="text-xs text-muted">{m.type}</span></div>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">{m.question}</h1>
        {m.status !== 'DRAFT' && <Link href={`/markets/${m.slug}`} className="text-sm text-brand">View public page →</Link>}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4" data-testid="market-risk">
        <KPI label="YES price" value={pct(m.yesPrice, 1)} />
        <KPI label="Volume" value={birr(m.volume, true)} />
        <KPI label="Escrow" value={risk?.escrow ? birr(risk.escrow) : '—'} />
        <KPI label="Collateral (b·ln(1/p))" value={birr(m.subsidy)} />
        <KPI label="Pays if YES" value={birr(risk?.payoutIfYes ?? 0)} />
        <KPI label="Pays if NO" value={birr(risk?.payoutIfNo ?? 0)} />
        <KPI label="Current exposure" value={risk?.currentExposure ? birr(risk.currentExposure) : '—'} tone="no" />
        <KPI label="Max loss bound" value={birr(risk?.maxLossBound ?? 0)} tone="gold" />
      </div>
      {risk?.operatorPnlIfYes && (
        <p className="tabular text-sm text-muted">Operator P&L if YES: <b className={Number(risk.operatorPnlIfYes) < 0 ? 'text-no' : 'text-yes'}>{num(risk.operatorPnlIfYes)}</b> · if NO: <b className={Number(risk.operatorPnlIfNo) < 0 ? 'text-no' : 'text-yes'}>{num(risk.operatorPnlIfNo!)}</b> · liquidity b = {num(m.liquidityB, 0)} · fee {m.feeBps / 100}% · max trade {birr(m.maxTradeAmount)} · reserve left after worst case {birr(risk.reserveCoverage ?? 0)}</p>
      )}

      <Card className="flex flex-wrap gap-2 p-4">
        {m.status === 'DRAFT' && <Button loading={busy === 'pub'} onClick={() => act('pub', `/admin/markets/${m.id}/publish`, {}, 'Published & funded')}>Publish & fund</Button>}
        {m.status === 'OPEN' && (
          <>
            <Button variant="secondary" loading={busy === 'halt'} onClick={() => { const reason = prompt(m.tradingHalted ? 'Reason to resume' : 'Reason to suspend trading'); if (reason) act('halt', `/admin/markets/${m.id}/halt`, { halted: !m.tradingHalted, reason }, m.tradingHalted ? 'Resumed' : 'Suspended'); }}>{m.tradingHalted ? 'Resume trading' : 'Suspend trading'}</Button>
            <Button variant="secondary" data-testid="close-market" loading={busy === 'close'} onClick={() => act('close', `/admin/markets/${m.id}/close`, { reason: 'Closed by administrator' }, 'Trading closed')}>Close trading now</Button>
          </>
        )}
        {['DRAFT', 'SCHEDULED', 'OPEN'].includes(m.status) && m.tradesCount === 0 && (
          <Button variant="danger" onClick={() => { const reason = prompt('Reason for cancelling'); if (reason) act('cxl', `/admin/markets/${m.id}/cancel`, { reason }, 'Cancelled'); }}>Cancel market</Button>
        )}
        <span className="self-center text-xs text-muted">Closes {date(m.closesAt)}</span>
      </Card>

      {['CLOSED', 'AWAITING_RESOLUTION'].includes(m.status) && (!m.proposal || ['REJECTED', 'OVERTURNED'].includes(m.proposal.status)) && (
        <Card className="space-y-3 p-4" data-testid="propose-form">
          <div className="text-sm font-medium">Propose outcome</div>
          <p className="text-xs text-muted">Check the official source: <b>{m.sourcePrimary}</b>{m.sourceBackup && <> (backup: {m.sourceBackup})</>}. A different reviewer must approve before the dispute window starts.</p>
          <div className="grid gap-3 md:grid-cols-[160px_1fr]">
            <div><Label>Outcome</Label><Select value={outcome} onChange={(e) => setOutcome(e.target.value)} name="outcome"><option value="YES">YES — {m.yesLabel}</option><option value="NO">NO — {m.noLabel}</option><option value="CANCELLED">CANCELLED</option></Select></div>
            <div><Label>Evidence link / reference</Label><Input name="evidenceUrl" value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)} placeholder="https://… or archive reference" /></div>
          </div>
          <div><Label>Evidence notes</Label><Textarea name="evidenceNotes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What the source says, when it was checked, screenshots stored at…" /></div>
          <Button data-testid="submit-proposal" loading={busy === 'prop'} disabled={evidenceUrl.length < 3 || notes.length < 5} onClick={() => act('prop', `/admin/markets/${m.id}/propose`, { outcome, evidenceUrl, evidenceNotes: notes }, 'Proposal submitted for review')}>Submit proposal</Button>
        </Card>
      )}

      {m.proposal && (
        <Card className="p-4 text-sm">
          <div className="font-medium">Latest proposal: <Badge tone={m.proposal.outcome === 'YES' ? 'yes' : m.proposal.outcome === 'NO' ? 'no' : 'neutral'}>{m.proposal.outcome}</Badge> <Badge>{m.proposal.status.toLowerCase().replace('_', ' ')}</Badge></div>
          <p className="mt-1 text-muted">{m.proposal.evidenceNotes}</p>
          <Link href="/admin?s=resolution" className="mt-2 inline-block text-brand">Open resolution queue →</Link>
        </Card>
      )}

      <Card className="space-y-2 p-4 text-sm">
        <div className="font-medium">Rules</div>
        <p>{m.resolutionRules}</p>
        <p className="text-muted">Cancellation: {m.cancellationRules} ({m.cancellationPolicy})</p>
      </Card>
    </div>
  );
}
