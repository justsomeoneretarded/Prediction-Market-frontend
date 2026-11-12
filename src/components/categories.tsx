'use client';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { CATEGORY_LABEL } from '@/lib/format';
import { cn } from '@/lib/utils';

export const CATS = ['FOOTBALL', 'ETHIOPIAN_FOOTBALL', 'PREMIER_LEAGUE', 'CHAMPIONS_LEAGUE', 'INTERNATIONAL_FOOTBALL', 'MUSIC', 'TELEVISION', 'ENTERTAINMENT', 'CULTURE', 'OTHER'];

export function CategoryChips({ active, base = '/markets' }: { active?: string; base?: string }) {
  const { t, locale } = useI18n();
  const label = (c: string) => (c === 'FOOTBALL' ? (locale === 'am' ? 'እግር ኳስ' : 'All football') : CATEGORY_LABEL[c]?.[locale] ?? c);
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
      <Chip href={base} active={!active}>{t('all')}</Chip>
      {CATS.map((c) => <Chip key={c} href={`${base}?category=${c}`} active={active === c}>{label(c)}</Chip>)}
    </div>
  );
}
function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className={cn('h-9 shrink-0 rounded-full border px-4 text-sm leading-[34px] transition', active ? 'border-text bg-text text-bg' : 'border-border text-muted hover:border-text/30 hover:text-text')}>
      {children}
    </Link>
  );
}
