'use client';
import useSWR from 'swr';
import { api, fetcher } from './api';
import type { Me } from './types';

export function useMe() {
  const { data, mutate, isLoading } = useSWR<Me>('/auth/me', fetcher, { revalidateOnFocus: true });
  return {
    me: data?.user ?? null,
    balances: data?.balances,
    unread: data?.unreadNotifications ?? 0,
    requires2fa: data?.requires2fa ?? false,
    loading: isLoading,
    refresh: mutate,
    isStaff: !!data?.user?.roles.some((r) => r !== 'USER'),
    isAdmin: !!data?.user?.roles.includes('ADMIN'),
    logout: async () => {
      await api('/auth/logout', { method: 'POST', body: {} });
      await mutate({ user: null }, { revalidate: true });
    },
  };
}
