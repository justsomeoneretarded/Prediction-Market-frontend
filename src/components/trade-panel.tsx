'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import useSWR, { useSWRConfig } from 'swr';
import { Info } from 'lucide-react';
import { api, ApiError, fetcher } from '@/lib/api';
import type { MarketDetail, Portfolio, Quote } from '@/lib/types';
import { useMe } from '@/lib/session';
import { useI18n } from '@/lib/i18n';
import { birr, cents, num } from '@/lib/format';
import { cn, uid } from '@/lib/utils';
import { Button, Card, ErrorText } from './ui/primitives';
import { useToast } from './ui/toast';

type Side = 'BUY' | 'SELL';
type Outcome = 'YES' | 'NO';

export function TradePanel({ m, outcome, setOutcome }: { m: MarketDetail; outcome: Outcome; setOutcome: (o: Outcome) => void }) {
  const { t } = useI18n();
  const { me, balances, refresh } = useMe();
  const { mutate } = useSWRConfig();
  const toast = useToast();
  const [side, setSide] = useState<Side>('BUY');
  const [mode, setMode] = useState<'AMOUNT' | 'SHARES'>('AMOUNT');
  const [value, setValue] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteErr, setQuoteErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const keyRef = useRef(uid());

  const { data: pf } = useSWR<Portfolio>(me ? '/portfolio' : null, fetcher);
  const pos = pf?.openPositions.find((p) => p.marketId === m.id);
  const owned = Number(outcome === 'YES' ? pos?.yesShares ?? 0 : pos?.noShares ?? 0);
  const open = m.status === 'OPEN' && !m.tradingHalted && new Date(m.closesAt).getTime() > Date.now();

  // new idempotency key whenever the intended trade changes
  useEffect(() => {
    keyRef.current = uid();
  }, [side, outcome, mode, value]);

  // debounced live preview
  useEffect(() => {
    setQuote(null);
    setQuoteErr(null);
    if (!open || !value || Number(value) <= 0) return;
    const ctl = { cancelled: false };
    const id = setTimeout(async () => {
      try {
        const q = await api<Quote>(`/markets/${m.id}/quote`, { body: { side, outcome, mode, value } });
        if (!ctl.cancelled) setQuote(q);
      } catch (e) {
        if (!ctl.cancelled) setQuoteErr((e as Error).message);
      }
    }, 250);
    return () => {
      ctl.cancelled = true;
      clearTimeout(id);
    };
  }, [side, outcome, mode, value, m.id, open, m.yesPrice]);

  const submit = async () => {
    if (!quote) return;
    setBusy(true);
    try {
      await api(`/markets/${m.id}/trade`, {
        body: { side, outcome, mode, value, idempotencyKey: keyRef.current, expectedYesPrice: quote.yesPriceBefore, maxSlippage: 0.05 },
      });
      toast(`${t('trade.done')}: ${side === 'BUY' ? '+' : '−'}${num(quote.shares)} ${outcome}`);
      setValue('');
      keyRef.current = uid();
      await Promise.all([refresh(), mutate(`/markets/${m.slug}`), mutate('/portfolio'), mutate(`/markets/${m.slug}/history?range=all`)]);
    } catch (e) {
      const err = e as ApiError;
      toast(err.message, 'err');
      if (err.code === 'PRICE_MOVED') mutate(`/markets/${m.slug}`);
    } finally {
      setBusy(false);
    }
  };

  const yes = Number(m.yesPrice);
  const chips = side === 'BUY' && mode === 'AMOUNT' ? ['10', '50', '100', '500'] : [];
  const maxValue = side === 'BUY' ? (mode === 'AMOUNT' ? Math.floor(Number(balances?.available ?? 0)).toString() : '') : owned.toFixed(2);
  const ret = quote && side === 'BUY' ? Number(quote.maxPayout) - Number(quote.total) : 0;

  const warnings = useMemo(() => (quote?.warnings ?? []).map((w) => ({
    INSUFFICIENT_BALANCE: 'Not enough balance for this trade.',
    INSUFFICIENT_SHARES: `You only own ${num(owned)} ${outcome} shares.`,
    HIGH_PRICE_IMPACT: 'Large trade: this moves the price a lot. Consider a smaller amount.',
  }[w] ?? w)), [quote, owned, outcome]);

  if (!open) {
    return (
      <Card className="p-5">
        <div className="text-sm font-medium">{t('trade.closed')}</div>
        <p className="mt-1 text-sm text-muted">
          {m.tradingHalted ? `Paused: ${m.haltReason}` : m.status === 'SCHEDULED' ? `Opens ${new Date(m.opensAt).toLocaleString()}` : `This market is ${m.status.replace('_', ' ').toLowerCase()}.`}
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-5" data-testid="trade-panel">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-4 text-sm font-medium">
          {(['BUY', 'SELL'] as const).map((s) => (
            <button key={s} onClick={() => setSide(s)} className={cn('relative pb-1 transition', side === s ? 'text-text' : 'text-muted')} data-testid={`side-${s}`}>
              {s === 'BUY' ? t('trade.buy') : t('trade.sell')}
              {side === s && <span className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-text" />}
            </button>
          ))}
        </div>
        <button onClick={() => setMode(mode === 'AMOUNT' ? 'SHARES' : 'AMOUNT')} className="rounded-lg px-2 py-1 text-xs text-muted hover:bg-surface-2">
          {mode === 'AMOUNT' ? 'Br → shares' : 'shares → Br'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(['YES', 'NO'] as const).map((o) => {
          const price = o === 'YES' ? yes : 1 - yes;
          const active = outcome === o;
          return (
            <button
              key={o}
              onClick={() => setOutcome(o)}
              data-testid={`outcome-${o}`}
              className={cn(
                'flex h-12 items-center justify-between rounded-xl px-3.5 text-sm font-semibold transition',
                o === 'YES' ? (active ? 'bg-yes text-white' : 'bg-yes-soft text-yes') : active ? 'bg-no text-white' : 'bg-no-soft text-no',
              )}
            >
              <span className="truncate">{o === 'YES' ? m.yesLabel : m.noLabel}</span>
              <span className="tabular">{cents(price)}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
          <span>{mode === 'AMOUNT' ? (side === 'BUY' ? t('trade.amount') : t('trade.youReceive')) : t('trade.shares')}</span>
          {me && (
            <span className="tabular">
              {side === 'BUY' ? `${t('trade.balance')} ${birr(balances?.available ?? 0)}` : `${t('trade.owned')} ${num(owned)}`}
            </span>
          )}
        </div>
        <div className="relative">
          <input
            inputMode="decimal"
            value={value}
            onChange={(e) => /^\d*\.?\d{0,6}$/.test(e.target.value) && setValue(e.target.value)}
            placeholder="0"
            data-testid="trade-amount"
            className="tabular h-14 w-full rounded-xl border border-border bg-surface px-4 pr-16 text-2xl font-semibold outline-none focus:border-brand focus:ring-4 focus:ring-[var(--ring)]"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">{mode === 'AMOUNT' ? 'Br' : 'sh'}</span>
        </div>
        <div className="mt-2 flex gap-1.5">
          {chips.map((c) => (
            <button key={c} onClick={() => setValue(String(Number(value || 0) + Number(c)))} className="h-7 flex-1 rounded-lg bg-surface-2 text-xs font-medium text-muted hover:text-text">+{c}</button>
          ))}
          {me && maxValue && Number(maxValue) > 0 && (
            <button onClick={() => { if (side === 'SELL') setMode('SHARES'); setValue(maxValue); }} className="h-7 flex-1 rounded-lg bg-surface-2 text-xs font-medium text-muted hover:text-text">{t('trade.max')}</button>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2 rounded-xl bg-surface-2/60 p-3 text-sm" data-testid="trade-preview">
        <Row label={t('trade.avgPrice')} value={quote ? cents(quote.avgPrice) : '—'} />
        <Row label={side === 'BUY' ? t('trade.youGet') : t('trade.shares')} value={quote ? num(quote.shares) : '—'} testId="preview-shares" />
        <Row label={`${t('trade.fee')} (${(m.feeBps / 100).toFixed(1)}%)`} value={quote ? birr(quote.fee) : '—'} />
        <Row
          label={t('trade.impact')}
          value={quote ? <span className={Math.abs(Number(quote.priceImpact)) > 0.05 ? 'text-gold' : ''}>{Number(quote.priceImpact) >= 0 ? '+' : ''}{(Number(quote.priceImpact) * 100).toFixed(2)} pts</span> : '—'}
        />
        <Row label={t('trade.newPrice')} value={quote ? `${cents(quote.yesPriceAfter)} ${m.yesLabel}` : '—'} />
        <div className="my-1 border-t border-border" />
        {side === 'BUY' ? (
          <Row
            label={<span className="font-medium text-text">{t('trade.payout')}</span>}
            value={quote ? <span className="font-semibold text-yes">{birr(quote.maxPayout)} <span className="text-xs font-normal text-muted">({ret >= 0 ? '+' : ''}{((ret / Number(quote.total)) * 100).toFixed(0)}%)</span></span> : '—'}
          />
        ) : (
          <Row label={<span className="font-medium text-text">{t('trade.youReceive')}</span>} value={quote ? <span className="font-semibold">{birr(quote.total)}</span> : '—'} />
        )}
      </div>

      <div className="mt-3 space-y-2">
        <ErrorText>{quoteErr}</ErrorText>
        {warnings.map((w) => <p key={w} className="flex items-start gap-1.5 text-xs text-gold"><Info className="mt-0.5 size-3.5 shrink-0" />{w}</p>)}
      </div>

      {me ? (
        <Button
          size="lg"
          variant={outcome === 'YES' ? 'yes' : 'no'}
          className="mt-3 w-full"
          disabled={!quote || busy || quote.warnings.some((w) => w.startsWith('INSUFFICIENT'))}
          loading={busy}
          onClick={submit}
          data-testid="trade-submit"
        >
          {side === 'BUY' ? t('trade.buy') : t('trade.sell')} {outcome === 'YES' ? m.yesLabel : m.noLabel}
          {quote && ` · ${birr(quote.total)}`}
        </Button>
      ) : (
        <Link href={`/login?next=/markets/${m.slug}`} className="mt-3 flex h-12 w-full items-center justify-center rounded-xl bg-text font-medium text-bg">{t('trade.loginToTrade')}</Link>
      )}
      <p className="mt-3 text-center text-[11px] text-muted">Virtual birr · prices from an LMSR market maker · <Link href="/how-it-works" className="underline">how pricing works</Link></p>
    </Card>
  );
}

function Row({ label, value, testId }: { label: React.ReactNode; value: React.ReactNode; testId?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className="tabular text-right" data-testid={testId}>{value}</span>
    </div>
  );
}
