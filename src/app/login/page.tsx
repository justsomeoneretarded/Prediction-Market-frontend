'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useMe } from '@/lib/session';
import { useI18n } from '@/lib/i18n';
import { Button, ErrorText, Input, Label } from '@/components/ui/primitives';
import { AuthShell } from '@/components/auth-shell';

function LoginForm() {
  const { t } = useI18n();
  const { refresh } = useMe();
  const router = useRouter();
  const next = useSearchParams().get('next') ?? '/';
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await api('/auth/login', { body: { login, password } });
      await refresh();
      router.push(next.startsWith('/') ? next : '/');
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthShell title={t('auth.welcome')}>
      <form onSubmit={submit} className="space-y-4">
        <div><Label>{t('auth.loginOrEmail')}</Label><Input name="login" autoComplete="username" value={login} onChange={(e) => setLogin(e.target.value)} required /></div>
        <div><Label>{t('auth.password')}</Label><Input name="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        <ErrorText>{err}</ErrorText>
        <Button type="submit" size="lg" className="w-full" loading={busy}>{t('auth.login')}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">{t('auth.noAccount')} <Link href="/register" className="font-medium text-text underline-offset-4 hover:underline">{t('nav.signup')}</Link></p>
    </AuthShell>
  );
}


export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
