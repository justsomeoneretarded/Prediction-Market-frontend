'use client';
import Link from 'next/link';
import useSWR from 'swr';
import { useEffect } from 'react';
import { api } from '@/lib/api';
import { ago } from '@/lib/format';
import { useMe } from '@/lib/session';
import { Card, Empty, Skeleton } from '@/components/ui/primitives';
import { useI18n } from '@/lib/i18n';

export default function NotificationsPage() {
  const { t } = useI18n();
  const { me, refresh } = useMe();
  const { data, mutate } = useSWR<{ id: string; title: string; body: string; link: string | null; readAt: string | null; createdAt: string }[]>(me ? '/notifications' : null);
  useEffect(() => {
    if (data?.some((n) => !n.readAt)) api('/notifications/read', { body: {} }).then(() => { refresh(); setTimeout(() => mutate(), 2000); });
  }, [data, refresh, mutate]);
  return (
    <div className="mx-auto max-w-2xl fade-in">
      <h1 className="text-2xl font-semibold tracking-tight">{t('nav.notifications')}</h1>
      <div className="mt-4">
        {!data ? <Skeleton className="h-40" /> : !data.length ? <Empty>Nothing yet.</Empty> : (
          <Card className="divide-y divide-border">
            {data.map((n) => {
              const body = (
                <div className="flex gap-3 p-4">
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.readAt ? 'bg-transparent' : 'bg-brand'}`} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{n.title}</div>
                    <div className="text-sm text-muted">{n.body}</div>
                    <div className="mt-1 text-xs text-muted">{ago(n.createdAt)}</div>
                  </div>
                </div>
              );
              return n.link ? <Link key={n.id} href={n.link} className="block hover:bg-surface-2/50">{body}</Link> : <div key={n.id}>{body}</div>;
            })}
          </Card>
        )}
      </div>
    </div>
  );
}
