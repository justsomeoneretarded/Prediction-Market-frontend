'use client';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search, Flame, TrendingUp, Sparkles, Clock, Trophy, Music4 } from 'lucide-react';
import type { Market } from '@/lib/types';
import { useI18n } from '@/lib/i18n';
import { Section } from '@/components/section';
import { CategoryChips } from '@/components/categories';
import { MarketCard, MarketCardSkeleton } from '@/components/market-card';

type Home = Record<'featured' | 'trending' | 'top' | 'fresh' | 'closing' | 'football' | 'entertainment', Market[]>;

export default function HomePage() {
  const { data, isLoading } = useSWR<Home>('/markets/home');
  const { t } = useI18n();
  const router = useRouter();
  const [q, setQ] = useState('');
  const hero = data?.featured?.[0];

  return (
    <div className="fade-in">
      <section className="pt-2 md:pt-6">
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-5xl">{t('home.title')}</h1>
        <p className="mt-3 max-w-xl text-[15px] text-muted md:text-base">{t('home.sub')}</p>
        <form className="relative mt-5 md:hidden" onSubmit={(e) => { e.preventDefault(); router.push(`/markets?q=${encodeURIComponent(q)}`); }}>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('home.search')} className="h-12 w-full rounded-2xl border border-border bg-surface pl-10 pr-3 outline-none focus:border-brand" />
        </form>
        <div className="mt-5"><CategoryChips /></div>
      </section>

      <section className="mt-8 grid gap-3 lg:grid-cols-3">
        {isLoading || !hero ? (
          <><MarketCardSkeleton /><MarketCardSkeleton /><MarketCardSkeleton /></>
        ) : (
          <>
            <MarketCard m={hero} hero className="lg:col-span-2 lg:row-span-2 lg:p-6 [&_h3]:lg:text-2xl" />
            {data!.featured.slice(1, 3).map((m) => <MarketCard key={m.id} m={m} />)}
          </>
        )}
      </section>

      <Section title={t('home.trending')} icon={<Flame className="size-4 text-no" />} markets={data?.trending} loading={isLoading} href="/markets?sort=trending" />
      <Section title={t('home.football')} icon={<Trophy className="size-4 text-gold" />} markets={data?.football} loading={isLoading} href="/markets?category=FOOTBALL" />
      <Section title={t('home.entertainment')} icon={<Music4 className="size-4 text-brand" />} markets={data?.entertainment} loading={isLoading} href="/markets?category=ENTERTAINMENT_ALL" />
      <Section title={t('home.top')} icon={<TrendingUp className="size-4 text-yes" />} markets={data?.top} loading={isLoading} href="/markets?sort=volume" />
      <Section title={t('home.closing')} icon={<Clock className="size-4 text-muted" />} markets={data?.closing} loading={isLoading} href="/markets?sort=closing" />
      <Section title={t('home.new')} icon={<Sparkles className="size-4 text-gold" />} markets={data?.fresh} loading={isLoading} href="/markets?sort=new" />
      <p className="mt-12 text-center text-xs text-muted">{t('home.virtual')}</p>
    </div>
  );
}
