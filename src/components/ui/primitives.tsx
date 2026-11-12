'use client';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'yes' | 'no' | 'danger';
const btn: Record<BtnVariant, string> = {
  primary: 'bg-text text-bg hover:opacity-90',
  secondary: 'bg-surface-2 text-text hover:bg-border',
  ghost: 'text-muted hover:text-text hover:bg-surface-2',
  yes: 'bg-yes text-white hover:opacity-90',
  no: 'bg-no text-white hover:opacity-90',
  danger: 'bg-no-soft text-no hover:bg-no hover:text-white',
};

export const Button = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' | 'lg'; loading?: boolean }>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...p }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex select-none items-center justify-center gap-2 rounded-xl font-medium transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
        size === 'sm' && 'h-8 px-3 text-sm',
        size === 'md' && 'h-10 px-4 text-sm',
        size === 'lg' && 'h-12 px-5 text-base',
        btn[variant],
        className,
      )}
      {...p}
    >
      {loading && <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input
    ref={ref}
    className={cn(
      'h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-[15px] outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-4 focus:ring-[var(--ring)]',
      className,
    )}
    {...p}
  />
));
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...p }, ref) => (
  <textarea
    ref={ref}
    className={cn('min-h-24 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-[15px] outline-none transition focus:border-brand focus:ring-4 focus:ring-[var(--ring)]', className)}
    {...p}
  />
));
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...p }, ref) => (
  <select ref={ref} className={cn('h-11 w-full rounded-xl border border-border bg-surface px-3 text-[15px] outline-none focus:border-brand', className)} {...p} />
));
Select.displayName = 'Select';

export function Label({ children, hint, className }: { children: React.ReactNode; hint?: React.ReactNode; className?: string }) {
  return (
    <label className={cn('mb-1.5 flex items-baseline justify-between text-sm font-medium', className)}>
      <span>{children}</span>
      {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
    </label>
  );
}

export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-2xl border border-border bg-surface', className)} {...p} />;
}

export function Badge({ tone = 'neutral', className, children }: { tone?: 'neutral' | 'yes' | 'no' | 'brand' | 'gold'; className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide',
        tone === 'neutral' && 'bg-surface-2 text-muted',
        tone === 'yes' && 'bg-yes-soft text-yes',
        tone === 'no' && 'bg-no-soft text-no',
        tone === 'brand' && 'bg-yes-soft text-brand',
        tone === 'gold' && 'bg-[color-mix(in_oklab,var(--gold)_15%,transparent)] text-gold',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Tabs<T extends string>({ value, onChange, items, className }: { value: T; onChange: (v: T) => void; items: { value: T; label: React.ReactNode }[]; className?: string }) {
  return (
    <div className={cn('no-scrollbar flex gap-1 overflow-x-auto rounded-xl bg-surface-2 p-1', className)} role="tablist">
      {items.map((it) => (
        <button
          key={it.value}
          role="tab"
          aria-selected={value === it.value}
          onClick={() => onChange(it.value)}
          className={cn('h-8 shrink-0 rounded-lg px-3 text-sm font-medium transition', value === it.value ? 'bg-surface text-text shadow-soft' : 'text-muted hover:text-text')}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

export function Stat({ label, value, sub, className }: { label: React.ReactNode; value: React.ReactNode; sub?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="text-xs text-muted">{label}</div>
      <div className="tabular mt-0.5 truncate text-lg font-semibold tracking-tight">{value}</div>
      {sub && <div className="tabular text-xs text-muted">{sub}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted">{children}</div>;
}

export function ErrorText({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="rounded-lg bg-no-soft px-3 py-2 text-sm text-no" role="alert">{children}</p>;
}

export function Pnl({ value, className }: { value: string | number; className?: string }) {
  const n = Number(value);
  return <span className={cn('tabular', n > 0 ? 'text-yes' : n < 0 ? 'text-no' : 'text-muted', className)}>{n > 0 ? '+' : ''}{n.toFixed(2)}</span>;
}
