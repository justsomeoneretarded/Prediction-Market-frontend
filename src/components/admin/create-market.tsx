'use client';
import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { api } from '@/lib/api';
import { CATEGORY_LABEL } from '@/lib/format';
import { Button, Card, ErrorText, Input, Label, Select, Textarea } from '../ui/primitives';
import { useToast } from '../ui/toast';

const iso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export function CreateMarket({ onDone }: { onDone?: () => void }) {
  const toast = useToast();
  const { mutate } = useSWRConfig();
  const now = new Date();
  const [f, setF] = useState({
    question: '', questionAm: '', description: '', category: 'OTHER', yesLabel: 'Yes', noLabel: 'No', imageEmoji: '🔮',
    opensAt: iso(now), closesAt: iso(new Date(now.getTime() + 7 * 864e5)), resolvesAt: iso(new Date(now.getTime() + 8 * 864e5)),
    resolutionRules: '', sourcePrimary: '', sourceBackup: '', cancellationRules: 'If the event does not take place or no official result is published within 30 days, the market is cancelled and traders are refunded their net cost.',
    cancellationPolicy: 'REFUND_NET_COST', disputeHours: '24', initialProbability: '50', liquidityB: '1000', feeBps: '100', maxTradeAmount: '50000', featured: false, isDemo: false, publish: true,
  });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));
  const p = Number(f.initialProbability) / 100;
  const maxLoss = Number(f.liquidityB) * Math.log(1 / Math.min(p, 1 - p));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await api('/admin/markets', {
        body: {
          ...f, questionAm: f.questionAm || null, sourceBackup: f.sourceBackup || null,
          opensAt: new Date(f.opensAt).toISOString(), closesAt: new Date(f.closesAt).toISOString(), resolvesAt: new Date(f.resolvesAt).toISOString(),
          initialProbability: p, liquidityB: Number(f.liquidityB), feeBps: Number(f.feeBps), maxTradeAmount: Number(f.maxTradeAmount), disputeHours: Number(f.disputeHours),
        },
      });
      toast(f.publish ? 'Market created and funded' : 'Draft saved');
      mutate((k) => typeof k === 'string' && k.startsWith('/admin'));
      onDone?.();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card className="p-5">
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2" data-testid="create-market-form">
        <div className="md:col-span-2"><Label>Question</Label><Input name="question" value={f.question} onChange={set('question')} required minLength={10} /></div>
        <div className="md:col-span-2"><Label hint="optional">Question (Amharic)</Label><Input value={f.questionAm} onChange={set('questionAm')} className="font-ethiopic" /></div>
        <div className="md:col-span-2"><Label>Description</Label><Textarea name="description" value={f.description} onChange={set('description')} required minLength={10} /></div>
        <div><Label>Category</Label><Select value={f.category} onChange={set('category')}>{Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v.en}</option>)}</Select></div>
        <div className="grid grid-cols-3 gap-2"><div><Label>Emoji</Label><Input value={f.imageEmoji} onChange={set('imageEmoji')} /></div><div><Label>Yes label</Label><Input value={f.yesLabel} onChange={set('yesLabel')} /></div><div><Label>No label</Label><Input value={f.noLabel} onChange={set('noLabel')} /></div></div>
        <div><Label>Opens</Label><Input type="datetime-local" value={f.opensAt} onChange={set('opensAt')} /></div>
        <div><Label>Closes</Label><Input type="datetime-local" value={f.closesAt} onChange={set('closesAt')} /></div>
        <div><Label>Expected resolution</Label><Input type="datetime-local" value={f.resolvesAt} onChange={set('resolvesAt')} /></div>
        <div><Label>Dispute window (hours)</Label><Input type="number" min={0} value={f.disputeHours} onChange={set('disputeHours')} /></div>
        <div className="md:col-span-2"><Label>Resolution rules</Label><Textarea name="resolutionRules" value={f.resolutionRules} onChange={set('resolutionRules')} required minLength={10} /></div>
        <div><Label>Official source</Label><Input name="sourcePrimary" value={f.sourcePrimary} onChange={set('sourcePrimary')} required /></div>
        <div><Label hint="optional">Backup source</Label><Input value={f.sourceBackup} onChange={set('sourceBackup')} /></div>
        <div className="md:col-span-2"><Label>Cancellation rules</Label><Textarea value={f.cancellationRules} onChange={set('cancellationRules')} /></div>
        <div><Label>Cancellation payout</Label><Select value={f.cancellationPolicy} onChange={set('cancellationPolicy')}><option value="REFUND_NET_COST">Refund net cost</option><option value="LAST_PRICE">Pay at last price</option></Select></div>
        <div className="rounded-xl bg-surface-2 p-3 md:col-span-2">
          <div className="text-sm font-medium">Liquidity (locked after publishing)</div>
          <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div><Label>Start YES %</Label><Input type="number" min={1} max={99} value={f.initialProbability} onChange={set('initialProbability')} /></div>
            <div><Label>b</Label><Input name="liquidityB" type="number" min={10} value={f.liquidityB} onChange={set('liquidityB')} /></div>
            <div><Label>Fee (bps)</Label><Input name="feeBps" type="number" min={0} max={1000} value={f.feeBps} onChange={set('feeBps')} /></div>
            <div><Label>Max trade</Label><Input type="number" min={1} value={f.maxTradeAmount} onChange={set('maxTradeAmount')} /></div>
          </div>
          <p className="tabular mt-2 text-xs text-muted">Collateral from reserve (worst-case loss): <b className="text-text">{isFinite(maxLoss) ? maxLoss.toFixed(2) : '—'} Br</b></p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm md:col-span-2">
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.publish} onChange={set('publish')} /> Publish & fund now</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.featured} onChange={set('featured')} /> Featured</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.isDemo} onChange={set('isDemo')} /> Demo data</label>
        </div>
        <div className="md:col-span-2"><ErrorText>{err}</ErrorText></div>
        <div className="md:col-span-2"><Button type="submit" loading={busy}>Create market</Button></div>
      </form>
    </Card>
  );
}
