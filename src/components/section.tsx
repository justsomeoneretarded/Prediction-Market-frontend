'use client';
import Link from 'next/link';
import type { Market } from '@/lib/types';
import { MarketCard, MarketCardSkeleton } from './market-card';
import { ArrowRight } from 'lucide-react';

export function Section({ title, markets, href, loading, icon }: { title: string; markets?: Market[]; href?: string; loading?: boolean; icon?: React.ReactNode }) {
  if (!loading && !markets?.length) return null;
  return (
    <section className="mt-10">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">{icon}{title}</h2>
        {href && <Link href={href} className="flex items-center gap-1 text-sm text-muted hover:text-text">See all <ArrowRight className="size-3.5" /></Link>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? Array.from({ length: 3 }, (_, i) => <MarketCardSkeleton key={i} />) : markets!.slice(0, 6).map((m) => <MarketCard key={m.id} m={m} />)}
      </div>
    </section>
  );
}
