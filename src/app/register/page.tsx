'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useMe } from '@/lib/session';
import { useI18n } from '@/lib/i18n';
import { Button, ErrorText, Input, Label, Select } from '@/components/ui/primitives';
import { AuthShell } from '@/components/auth-shell';

const COUNTRIES = [['ET', 'Ethiopia'], ['US', 'United States'], ['GB', 'United Kingdom'], ['CA', 'Canada'], ['DE', 'Germany'], ['SE', 'Sweden'], ['IL', 'Israel'], ['SA', 'Saudi Arabia'], ['AE', 'UAE'], ['KE', 'Kenya'], ['ZA', 'South Africa'], ['AU', 'Australia'], ['NO', 'Norway'], ['NL', 'Netherlands'], ['IT', 'Italy']];

export default function RegisterPage() {
  const { t, locale } = useI18n();
  const { refresh } = useMe();
  const router = useRouter();
  const [f, setF] = useState({ email: '', username: '', password: '', dateOfBirth: '', country: 'ET', acceptTerms: false });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await api('/auth/register', { body: { ...f, locale } });
      await refresh();
      router.push('/');
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthShell title={t('auth.join')} sub={t('auth.joinSub')}>
      <form onSubmit={submit} className="space-y-4">
        <div><Label>{t('auth.email')}</Label><Input name="email" type="email" autoComplete="email" value={f.email} onChange={set('email')} required /></div>
        <div><Label hint="3–24, a–z 0–9 _">{t('auth.username')}</Label><Input name="username" autoComplete="username" value={f.username} onChange={set('username')} required minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" /></div>
        <div><Label hint="8+">{t('auth.password')}</Label><Input name="password" type="password" autoComplete="new-password" value={f.password} onChange={set('password')} required minLength={8} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>{t('auth.dob')}</Label><Input name="dateOfBirth" type="date" value={f.dateOfBirth} onChange={set('dateOfBirth')} required /></div>
          <div><Label>{t('auth.country')}</Label><Select name="country" value={f.country} onChange={set('country')}>{COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}</Select></div>
        </div>
        <label className="flex items-start gap-2.5 text-sm text-muted">
          <input type="checkbox" name="acceptTerms" checked={f.acceptTerms} onChange={set('acceptTerms')} className="mt-0.5 size-4 accent-[var(--brand)]" required />
          {t('auth.terms')}
        </label>
        <ErrorText>{err}</ErrorText>
        <Button type="submit" size="lg" className="w-full" loading={busy}>{t('auth.create')}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">{t('auth.haveAccount')} <Link href="/login" className="font-medium text-text hover:underline">{t('nav.login')}</Link></p>
    </AuthShell>
  );
}
