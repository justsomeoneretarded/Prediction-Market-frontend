'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Bell, Home, LayoutGrid, Moon, Search, Shield, Sun, User, Wallet, Languages, LogOut, Settings, HelpCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Logo } from './logo';
import { useMe } from '@/lib/session';
import { useI18n } from '@/lib/i18n';
import { birr } from '@/lib/format';
import { cn } from '@/lib/utils';

export function Nav() {
  const { me, balances, unread, isStaff, logout } = useMe();
  const { t, locale, setLocale } = useI18n();
  const { resolvedTheme, setTheme } = useTheme();
  const path = usePathname();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => menuRef.current && !menuRef.current.contains(e.target as Node) && setMenu(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <Link href="/" aria-label="Tinbit home"><Logo /></Link>
          <form
            className="relative ml-2 hidden flex-1 md:block md:max-w-sm"
            onSubmit={(e) => { e.preventDefault(); router.push(`/markets?q=${encodeURIComponent(q)}`); }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('home.search')} className="h-10 w-full rounded-xl bg-surface-2 pl-9 pr-3 text-sm outline-none ring-brand/30 focus:ring-2" />
          </form>
          <nav className="ml-auto hidden items-center gap-1 md:flex">
            <NavLink href="/markets" active={path.startsWith('/markets')}>{t('nav.markets')}</NavLink>
            <NavLink href="/how-it-works" active={path === '/how-it-works'}>{t('nav.how')}</NavLink>
            {me && <NavLink href="/portfolio" active={path.startsWith('/portfolio')}>{t('nav.portfolio')}</NavLink>}
            {isStaff && <NavLink href="/admin" active={path.startsWith('/admin')}>{t('nav.admin')}</NavLink>}
          </nav>
          <div className="ml-auto flex items-center gap-1 md:ml-2">
            <IconBtn label="Language" onClick={() => setLocale(locale === 'en' ? 'am' : 'en')}>
              <span className="text-xs font-semibold">{locale === 'en' ? 'አማ' : 'EN'}</span>
            </IconBtn>
            <IconBtn label="Theme" onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
              <Sun className="size-4 dark:hidden" /><Moon className="hidden size-4 dark:block" />
            </IconBtn>
            {me ? (
              <>
                <Link href="/portfolio?tab=wallet" className="tabular hidden h-9 items-center gap-1.5 rounded-xl bg-surface-2 px-3 text-sm font-medium sm:flex" data-testid="nav-balance">
                  <Wallet className="size-4 text-muted" />{birr(balances?.available ?? 0)}
                </Link>
                <Link href="/notifications" className="relative grid size-9 place-items-center rounded-xl text-muted hover:bg-surface-2 hover:text-text" aria-label={t('nav.notifications')}>
                  <Bell className="size-4" />
                  {unread > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-no" />}
                </Link>
                <div className="relative" ref={menuRef}>
                  <button onClick={() => setMenu((m) => !m)} className="grid size-9 place-items-center rounded-full bg-text text-xs font-semibold uppercase text-bg" aria-label="Account menu" data-testid="account-menu">
                    {me.displayName.slice(0, 1)}
                  </button>
                  {menu && (
                    <div className="fade-in absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-surface p-1.5 shadow-soft">
                      <div className="px-3 py-2">
                        <div className="truncate text-sm font-medium">{me.displayName}</div>
                        <div className="truncate text-xs text-muted">@{me.username}</div>
                      </div>
                      <MenuLink href="/portfolio" icon={<User className="size-4" />} onClick={() => setMenu(false)}>{t('nav.portfolio')}</MenuLink>
                      <MenuLink href="/settings" icon={<Settings className="size-4" />} onClick={() => setMenu(false)}>{t('nav.settings')}</MenuLink>
                      {isStaff && <MenuLink href="/admin" icon={<Shield className="size-4" />} onClick={() => setMenu(false)}>{t('nav.admin')}</MenuLink>}
                      <button onClick={async () => { setMenu(false); await logout(); router.push('/'); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-text">
                        <LogOut className="size-4" />{t('nav.logout')}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="h-9 rounded-xl px-3 text-sm font-medium leading-9 text-muted hover:text-text">{t('nav.login')}</Link>
                <Link href="/register" className="h-9 rounded-xl bg-text px-3.5 text-sm font-medium leading-9 text-bg">{t('nav.signup')}</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* mobile tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="grid h-16 grid-cols-4">
          <Tab href="/" icon={<Home className="size-5" />} active={path === '/'}>Home</Tab>
          <Tab href="/markets" icon={<LayoutGrid className="size-5" />} active={path.startsWith('/markets')}>{t('nav.markets')}</Tab>
          <Tab href={me ? '/portfolio' : '/login'} icon={<Wallet className="size-5" />} active={path.startsWith('/portfolio')}>{t('nav.portfolio')}</Tab>
          {isStaff
            ? <Tab href="/admin" icon={<Shield className="size-5" />} active={path.startsWith('/admin')}>{t('nav.admin')}</Tab>
            : <Tab href="/how-it-works" icon={<HelpCircle className="size-5" />} active={path === '/how-it-works'}>Help</Tab>}
        </div>
      </nav>
    </>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return <Link href={href} className={cn('h-9 rounded-xl px-3 text-sm font-medium leading-9 transition', active ? 'bg-surface-2 text-text' : 'text-muted hover:text-text')}>{children}</Link>;
}
function IconBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return <button onClick={onClick} aria-label={label} className="grid size-9 place-items-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-text">{children}</button>;
}
function MenuLink({ href, icon, children, onClick }: { href: string; icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) {
  return <Link href={href} onClick={onClick} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-text">{icon}{children}</Link>;
}
function Tab({ href, icon, active, children }: { href: string; icon: React.ReactNode; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className={cn('flex flex-col items-center justify-center gap-1 text-[11px] font-medium', active ? 'text-text' : 'text-muted')}>
      {icon}<span className="max-w-full truncate px-1">{children}</span>
    </Link>
  );
}
export { Languages };
