export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
        <rect width="32" height="32" rx="9" fill="var(--text)" />
        <path d="M9 21 L14 15 L18 18 L23 10" stroke="var(--brand)" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="23" cy="10" r="2.2" fill="var(--gold)" />
      </svg>
      <span className="text-[17px]">Tinbit</span>
      <span className="font-ethiopic text-xs font-normal text-muted">ትንቢት</span>
    </span>
  );
}
