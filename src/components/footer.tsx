import Link from 'next/link';
import { Logo } from './logo';

export function Footer() {
  return (
    <footer className="mb-16 border-t border-border md:mb-0">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted md:flex-row md:items-center md:justify-between">
        <Logo className="text-text" />
        <p className="max-w-xl text-xs leading-relaxed">
          Tinbit is a demonstration platform using <b>virtual birr with no cash value</b>. Markets marked “Demo” describe invented events. 18+ only.
        </p>
        <div className="flex gap-4 text-xs">
          <Link href="/how-it-works" className="hover:text-text">How it works</Link>
          <Link href="/markets" className="hover:text-text">Markets</Link>
        </div>
      </div>
    </footer>
  );
}
