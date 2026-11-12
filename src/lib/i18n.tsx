'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const en = {
  'nav.markets': 'Markets', 'nav.portfolio': 'Portfolio', 'nav.admin': 'Admin', 'nav.how': 'How it works',
  'nav.login': 'Log in', 'nav.signup': 'Sign up', 'nav.logout': 'Log out', 'nav.settings': 'Settings', 'nav.notifications': 'Notifications',
  'home.title': 'Predict what happens next.', 'home.sub': 'Trade on Ethiopian football, music, TV and world events. Prices are live probabilities.',
  'home.search': 'Search markets', 'home.featured': 'Featured', 'home.trending': 'Trending', 'home.top': 'Most traded', 'home.new': 'New',
  'home.closing': 'Closing soon', 'home.football': 'Football', 'home.entertainment': 'Entertainment', 'home.seeAll': 'See all',
  'home.virtual': 'Virtual birr only — no real money.', 'all': 'All',
  'market.chance': 'chance', 'market.volume': 'Vol.', 'market.closes': 'Closes', 'market.rules': 'Resolution rules', 'market.source': 'Official source',
  'market.backup': 'Backup source', 'market.cancellation': 'Cancellation rules', 'market.activity': 'Activity', 'market.related': 'Related',
  'market.liquidity': 'Liquidity', 'market.about': 'About', 'market.demo': 'Demo', 'market.resolution': 'Resolution',
  'trade.buy': 'Buy', 'trade.sell': 'Sell', 'trade.amount': 'Amount', 'trade.shares': 'Shares', 'trade.yes': 'Yes', 'trade.no': 'No',
  'trade.avgPrice': 'Avg. price', 'trade.youGet': 'Shares', 'trade.fee': 'Fee', 'trade.impact': 'Price impact', 'trade.payout': 'Payout if it wins',
  'trade.youReceive': 'You receive', 'trade.confirm': 'Confirm', 'trade.loginToTrade': 'Log in to trade', 'trade.max': 'Max', 'trade.balance': 'Balance',
  'trade.owned': 'Owned', 'trade.newPrice': 'New price', 'trade.done': 'Trade executed', 'trade.closed': 'Trading closed',
  'pf.title': 'Portfolio', 'pf.value': 'Portfolio value', 'pf.cash': 'Cash', 'pf.positions': 'Positions', 'pf.trades': 'Trades', 'pf.wallet': 'Wallet',
  'pf.unrealized': 'Unrealized P&L', 'pf.realized': 'Realized P&L', 'pf.open': 'Open', 'pf.closed': 'Settled', 'pf.empty': 'No positions yet.',
  'pf.deposit': 'Deposit', 'pf.withdraw': 'Withdraw', 'pf.history': 'Transaction history', 'pf.performance': 'Performance',
  'auth.email': 'Email', 'auth.username': 'Username', 'auth.password': 'Password', 'auth.dob': 'Date of birth', 'auth.country': 'Country',
  'auth.terms': 'I am 18+ and understand Tinbit uses virtual birr with no cash value.', 'auth.create': 'Create account', 'auth.login': 'Log in',
  'auth.loginOrEmail': 'Email or username', 'auth.noAccount': 'New to Tinbit?', 'auth.haveAccount': 'Already have an account?',
  'auth.welcome': 'Welcome back', 'auth.join': 'Join Tinbit', 'auth.joinSub': 'Get 10,000 virtual birr to start predicting.',
  'set.title': 'Settings', 'set.language': 'Language', 'set.name': 'Display name', 'set.save': 'Save', 'set.theme': 'Theme', 'set.security': 'Security',
} as const;

type Key = keyof typeof en;

const am: Record<Key, string> = {
  'nav.markets': 'ገበያዎች', 'nav.portfolio': 'ፖርትፎሊዮ', 'nav.admin': 'አስተዳደር', 'nav.how': 'እንዴት ይሰራል',
  'nav.login': 'ግባ', 'nav.signup': 'ተመዝገብ', 'nav.logout': 'ውጣ', 'nav.settings': 'ቅንብሮች', 'nav.notifications': 'ማሳወቂያዎች',
  'home.title': 'ቀጥሎ የሚሆነውን ተንብይ።', 'home.sub': 'በኢትዮጵያ እግር ኳስ፣ ሙዚቃ፣ ቴሌቪዥን እና የዓለም ክስተቶች ላይ ይገበያዩ። ዋጋዎች የቀጥታ እድሎች ናቸው።',
  'home.search': 'ገበያዎችን ፈልግ', 'home.featured': 'ተለይተው የቀረቡ', 'home.trending': 'በመታየት ላይ', 'home.top': 'ብዙ የተገበያዩ', 'home.new': 'አዲስ',
  'home.closing': 'በቅርቡ የሚዘጉ', 'home.football': 'እግር ኳስ', 'home.entertainment': 'መዝናኛ', 'home.seeAll': 'ሁሉንም እይ',
  'home.virtual': 'ምናባዊ ብር ብቻ — እውነተኛ ገንዘብ አይደለም።', 'all': 'ሁሉም',
  'market.chance': 'እድል', 'market.volume': 'መጠን', 'market.closes': 'ይዘጋል', 'market.rules': 'የውሳኔ ደንቦች', 'market.source': 'ይፋዊ ምንጭ',
  'market.backup': 'ተጠባባቂ ምንጭ', 'market.cancellation': 'የስረዛ ደንቦች', 'market.activity': 'እንቅስቃሴ', 'market.related': 'ተዛማጅ',
  'market.liquidity': 'ፈሳሽነት', 'market.about': 'ስለ', 'market.demo': 'ማሳያ', 'market.resolution': 'ውሳኔ',
  'trade.buy': 'ግዛ', 'trade.sell': 'ሽጥ', 'trade.amount': 'መጠን', 'trade.shares': 'አክሲዮኖች', 'trade.yes': 'አዎ', 'trade.no': 'አይ',
  'trade.avgPrice': 'አማካይ ዋጋ', 'trade.youGet': 'አክሲዮኖች', 'trade.fee': 'ክፍያ', 'trade.impact': 'የዋጋ ተፅእኖ', 'trade.payout': 'ካሸነፈ የሚከፈል',
  'trade.youReceive': 'የሚቀበሉት', 'trade.confirm': 'አረጋግጥ', 'trade.loginToTrade': 'ለመገበያየት ይግቡ', 'trade.max': 'ከፍተኛ', 'trade.balance': 'ቀሪ ሂሳብ',
  'trade.owned': 'ያለዎት', 'trade.newPrice': 'አዲስ ዋጋ', 'trade.done': 'ግብይቱ ተፈጽሟል', 'trade.closed': 'ግብይት ተዘግቷል',
  'pf.title': 'ፖርትፎሊዮ', 'pf.value': 'የፖርትፎሊዮ ዋጋ', 'pf.cash': 'ጥሬ ገንዘብ', 'pf.positions': 'ቦታዎች', 'pf.trades': 'ግብይቶች', 'pf.wallet': 'ቦርሳ',
  'pf.unrealized': 'ያልተረጋገጠ ትርፍ/ኪሳራ', 'pf.realized': 'የተረጋገጠ ትርፍ/ኪሳራ', 'pf.open': 'ክፍት', 'pf.closed': 'የተጠናቀቁ', 'pf.empty': 'እስካሁን ምንም ቦታ የለም።',
  'pf.deposit': 'አስገባ', 'pf.withdraw': 'አውጣ', 'pf.history': 'የግብይት ታሪክ', 'pf.performance': 'አፈጻጸም',
  'auth.email': 'ኢሜይል', 'auth.username': 'የተጠቃሚ ስም', 'auth.password': 'የይለፍ ቃል', 'auth.dob': 'የትውልድ ቀን', 'auth.country': 'ሀገር',
  'auth.terms': 'እድሜዬ 18+ ነው፤ ቲንቢት ምንም የገንዘብ ዋጋ የሌለው ምናባዊ ብር እንደሚጠቀም ተረድቻለሁ።', 'auth.create': 'መለያ ፍጠር', 'auth.login': 'ግባ',
  'auth.loginOrEmail': 'ኢሜይል ወይም የተጠቃሚ ስም', 'auth.noAccount': 'ለቲንቢት አዲስ ነዎት?', 'auth.haveAccount': 'መለያ አለዎት?',
  'auth.welcome': 'እንኳን ደህና መጡ', 'auth.join': 'ቲንቢትን ይቀላቀሉ', 'auth.joinSub': 'ለመጀመር 10,000 ምናባዊ ብር ያግኙ።',
  'set.title': 'ቅንብሮች', 'set.language': 'ቋንቋ', 'set.name': 'የሚታይ ስም', 'set.save': 'አስቀምጥ', 'set.theme': 'ገጽታ', 'set.security': 'ደህንነት',
};

export type Locale = 'en' | 'am';
const dicts: Record<Locale, Record<Key, string>> = { en, am };

const Ctx = createContext<{ locale: Locale; setLocale: (l: Locale) => void; t: (k: Key) => string }>({
  locale: 'en', setLocale: () => {}, t: (k) => en[k],
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tb_locale');
      if (saved === 'am' || saved === 'en') setLocaleState(saved);
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem('tb_locale', l); } catch {}
  }, []);
  const t = useCallback((k: Key) => dicts[locale][k] ?? en[k], [locale]);
  return <Ctx.Provider value={{ locale, setLocale, t }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
/** Pick the Amharic text when available and selected. */
export const useLocalized = () => {
  const { locale } = useI18n();
  return (en: string, am?: string | null) => (locale === 'am' && am ? am : en);
};
