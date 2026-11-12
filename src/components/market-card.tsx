'use client';
import Link from 'next/link';
import type { Market } from '@/lib/types';
import { birr, timeLeft, CATEGORY_LABEL } from '@/lib/format';
import { useI18n, useLocalized } from '@/lib/i18n';
import { useLivePrice } from '@/lib/realtime';
import { Badge } from './ui/primitives';
import { cn } from '@/lib/utils';

export function MarketCard({ m, className, hero }: { m: Market; className?: string; hero?: boolean }) {
  const { t, locale } = useI18n();
  const L = useLocalized();
  const { price, dir } = useLivePrice(m.id, m.yesPrice);
  const p = Number(price);
  const finished = m.status === 'RESOLVED' || m.status === 'CANCELLED';
  return (
    <Link
      href={`/markets/${m.slug}`}
      className={cn('group flex flex-col justify-between gap-4 rounded-2xl border border-border bg-surface p-4 transition hover:-translate-y-0.5 hover:shadow-soft', className)}
      data-testid="market-card"
    >
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-lg">{m.imageEmoji ?? '•'}</div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] text-muted">
            <span>{CATEGORY_LABEL[m.category]?.[locale] ?? m.category}</span>
            {m.isDemo && <Badge className="px-1.5 py-0 text-[9px]">{t('market.demo')}</Badge>}
          </div>
          <h3 className={cn('line-clamp-2 text-[15px] font-medium leading-snug', locale === 'am' && m.questionAm && 'font-ethiopic')}>{L(m.question, m.questionAm)}</h3>
        </div>
        <div className="shrink-0 text-right">
          <div className={cn('tabular text-xl font-semibold tracking-tight', dir === 'up' && 'flash-up', dir === 'down' && 'flash-down')} key={price}>
            {finished && m.resolvedOutcome !== 'CANCELLED' ? (m.resolvedOutcome === 'YES' ? '✓' : '✗') : `${Math.round(p * 100)}%`}
          </div>
          <div className="text-[11px] text-muted">{finished ? m.resolvedOutcome?.toLowerCase() : t('market.chance')}</div>
        </div>
      </div>
      {hero && (
        <div className="hidden flex-1 flex-col justify-end gap-4 lg:flex">
          <p className="line-clamp-3 max-w-xl text-sm leading-relaxed text-muted">{m.description}</p>
          <div className="grid max-w-md grid-cols-2 gap-2">
            <span className="tabular flex h-11 items-center justify-between rounded-xl bg-yes-soft px-3.5 text-sm font-semibold text-yes"><span className="truncate">{m.yesLabel}</span>{(p * 100).toFixed(1)}¢</span>
            <span className="tabular flex h-11 items-center justify-between rounded-xl bg-no-soft px-3.5 text-sm font-semibold text-no"><span className="truncate">{m.noLabel}</span>{((1 - p) * 100).toFixed(1)}¢</span>
          </div>
        </div>
      )}
      <div>
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-no-soft">
          <div className="h-full rounded-full bg-yes transition-all duration-700" style={{ width: `${p * 100}%` }} />
        </div>
        <div className="flex items-center justify-between text-xs text-muted">
          <span className="tabular">{birr(m.volume, true)} {t('market.volume')}</span>
          <span>{m.status === 'OPEN' ? timeLeft(m.closesAt) : m.status.replace('_', ' ').toLowerCase()}</span>
        </div>
      </div>
    </Link>
  );
}

export function MarketCardSkeleton() {
  return (
    <div className="flex h-[150px] flex-col justify-between rounded-2xl border border-border bg-surface p-4">
      <div className="flex gap-3"><div className="skeleton size-10" /><div className="flex-1 space-y-2"><div className="skeleton h-3 w-20" /><div className="skeleton h-4 w-full" /></div></div>
      <div className="skeleton h-1.5 w-full" />
    </div>
  );
}
