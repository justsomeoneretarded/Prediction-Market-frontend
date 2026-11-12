'use client';
import { Suspense } from 'react';
import useSWR from 'swr';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Market } from '@/lib/types';
import { MarketCard, MarketCardSkeleton } from '@/components/market-card';
import { CategoryChips } from '@/components/categories';
import { Empty, Input, Tabs } from '@/components/ui/primitives';
import { useI18n } from '@/lib/i18n';

function Browse() {
  const sp = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();
  const category = sp.get('category') ?? undefined;
  const sort = sp.get('sort') ?? 'volume';
  const status = sp.get('status') ?? 'open';
  const q = sp.get('q') ?? '';
  const qs = new URLSearchParams({ sort, status, limit: '60', ...(category ? { category } : {}), ...(q ? { q } : {}) });
  const { data, isLoading } = useSWR<Market[]>(`/markets?${qs}`);
  const set = (k: string, v: string) => {
    const n = new URLSearchParams(sp.toString());
    n.set(k, v);
    router.replace(`/markets?${n}`);
  };
  return (
    <div className="fade-in">
      <h1 className="text-2xl font-semibold tracking-tight">{t('nav.markets')}</h1>
      <div className="mt-4"><Input placeholder={t('home.search')} defaultValue={q} onKeyDown={(e) => e.key === 'Enter' && set('q', (e.target as HTMLInputElement).value)} /></div>
      <div className="mt-4"><CategoryChips active={category} /></div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Tabs value={sort} onChange={(v) => set('sort', v)} items={[{ value: 'volume', label: t('home.top') }, { value: 'trending', label: t('home.trending') }, { value: 'new', label: t('home.new') }, { value: 'closing', label: t('home.closing') }]} />
        <Tabs value={status} onChange={(v) => set('status', v)} items={[{ value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }, { value: 'resolved', label: 'Resolved' }]} />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? Array.from({ length: 6 }, (_, i) => <MarketCardSkeleton key={i} />) : data?.map((m) => <MarketCard key={m.id} m={m} />)}
      </div>
      {!isLoading && !data?.length && <Empty>No markets match.</Empty>}
    </div>
  );
}

export default function MarketsPage() {
  return <Suspense><Browse /></Suspense>;
}
