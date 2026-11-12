const nf = (d: number) => new Intl.NumberFormat('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const n0 = nf(0), n2 = nf(2);

export const birr = (v: string | number, compact = false) => {
  const n = Number(v);
  if (compact && Math.abs(n) >= 1000) return `${new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)} Br`;
  return `${n2.format(n)} Br`;
};
export const pct = (p: string | number, digits = 0) => `${(Number(p) * 100).toFixed(digits)}%`;
export const cents = (p: string | number) => `${(Number(p) * 100).toFixed(1)}¢`;
export const num = (v: string | number, d = 2) => (d === 0 ? n0 : nf(d)).format(Number(v));
export const signed = (v: string | number) => `${Number(v) > 0 ? '+' : ''}${n2.format(Number(v))}`;

export function timeLeft(iso: string, now = Date.now()) {
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return 'Closed';
  const h = ms / 3600_000;
  if (h < 1) return `${Math.ceil(ms / 60_000)}m left`;
  if (h < 48) return `${Math.floor(h)}h left`;
  return `${Math.floor(h / 24)}d left`;
}
export function ago(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
export const date = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export const CATEGORY_LABEL: Record<string, { en: string; am: string }> = {
  ETHIOPIAN_FOOTBALL: { en: 'Ethiopian football', am: 'የኢትዮጵያ እግር ኳስ' },
  PREMIER_LEAGUE: { en: 'Premier League', am: 'ፕሪሚየር ሊግ' },
  CHAMPIONS_LEAGUE: { en: 'Champions League', am: 'ቻምፒየንስ ሊግ' },
  INTERNATIONAL_FOOTBALL: { en: 'International', am: 'ዓለም አቀፍ' },
  MUSIC: { en: 'Music', am: 'ሙዚቃ' },
  TELEVISION: { en: 'TV', am: 'ቴሌቪዥን' },
  ENTERTAINMENT: { en: 'Entertainment', am: 'መዝናኛ' },
  CULTURE: { en: 'Culture & sport', am: 'ባህልና ስፖርት' },
  OTHER: { en: 'Other', am: 'ሌሎች' },
};
