'use client';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { api } from '@/lib/api';
import { useMe } from '@/lib/session';
import { useI18n } from '@/lib/i18n';
import { Button, Card, ErrorText, Input, Label, Tabs } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';

export default function SettingsPage() {
  const { me, refresh, isStaff } = useMe();
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const [name, setName] = useState('');
  const [totp, setTotp] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [code, setCode] = useState('');
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { if (me) setName(me.displayName); }, [me]);
  if (!me) return null;
  const save = async () => {
    await api('/auth/me', { method: 'PATCH', body: { displayName: name, locale } });
    await refresh();
    toast('Saved');
  };
  return (
    <div className="mx-auto max-w-xl space-y-4 fade-in">
      <h1 className="text-2xl font-semibold tracking-tight">{t('set.title')}</h1>
      <Card className="space-y-4 p-5">
        <div><Label>{t('set.name')}</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><Label>{t('set.language')}</Label><Tabs value={locale} onChange={setLocale} items={[{ value: 'en', label: 'English' }, { value: 'am', label: 'አማርኛ' }]} /></div>
        <div><Label>{t('set.theme')}</Label><Tabs value={theme ?? 'system'} onChange={setTheme} items={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} /></div>
        <Button onClick={save}>{t('set.save')}</Button>
      </Card>
      <Card className="space-y-3 p-5">
        <div className="text-sm font-medium">{t('set.security')}</div>
        <p className="text-sm text-muted">
          Two-factor authentication (TOTP) {me.totpEnabled ? 'is enabled' : 'is off'}.{isStaff && ' Staff accounts need it for admin actions when ADMIN_REQUIRE_2FA is on.'}
          {me.twoFactorVerified && ' This session is verified.'}
        </p>
        {!totp ? (
          <Button variant="secondary" onClick={async () => setTotp(await api('/auth/2fa/setup', { body: {} }))}>{me.totpEnabled ? 'Re-enrol / verify 2FA' : 'Set up 2FA'}</Button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm">Add this secret to your authenticator app, then enter the 6-digit code:</p>
            <code className="block break-all rounded-lg bg-surface-2 p-2 text-xs">{totp.secret}</code>
            <div className="flex gap-2"><Input inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" /><Button onClick={async () => { try { await api('/auth/2fa/verify', { body: { code } }); setTotp(null); await refresh(); toast('2FA verified'); } catch (e) { setErr((e as Error).message); } }}>Verify</Button></div>
            <ErrorText>{err}</ErrorText>
          </div>
        )}
      </Card>
    </div>
  );
}
