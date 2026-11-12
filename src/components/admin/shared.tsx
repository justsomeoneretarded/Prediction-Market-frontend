'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '../ui/toast';
import { cn } from '@/lib/utils';

export function useAction() {
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const run = async <T,>(id: string, fn: () => Promise<T>, ok?: string) => {
    setBusy(id);
    try {
      const r = await fn();
      if (ok) toast(ok);
      return r;
    } catch (e) {
      toast((e as Error).message, 'err');
      return undefined;
    } finally {
      setBusy(null);
    }
  };
  return { busy, run, post: (path: string, body?: unknown) => api(path, { body: body ?? {} }) };
}

export function Table({ head, children, className }: { head: React.ReactNode[]; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-x-auto rounded-2xl border border-border bg-surface', className)}>
      <table className="w-full min-w-[640px] text-sm">
        <thead><tr className="border-b border-border text-left text-xs text-muted">{head.map((h, i) => <th key={i} className="px-3 py-2.5 font-medium">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}
export const Td = ({ children, className }: { children?: React.ReactNode; className?: string }) => <td className={cn('tabular px-3 py-2.5 align-top', className)}>{children}</td>;

export function KPI({ label, value, tone }: { label: string; value: React.ReactNode; tone?: 'yes' | 'no' | 'gold' }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className={cn('tabular mt-1 text-xl font-semibold tracking-tight', tone === 'yes' && 'text-yes', tone === 'no' && 'text-no', tone === 'gold' && 'text-gold')}>{value}</div>
    </div>
  );
}
