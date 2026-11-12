import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_Ethiopic } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const ethiopic = Noto_Sans_Ethiopic({ subsets: ['ethiopic'], weight: ['400', '500', '600'], variable: '--font-ethiopic', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Tinbit — prediction markets', template: '%s · Tinbit' },
  description: 'Predict Ethiopian football, music, TV and world events with virtual birr.',
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#fbfbfa' }, { media: '(prefers-color-scheme: dark)', color: '#0c0c0b' }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${ethiopic.variable}`}>
      <body className="font-sans">
        <Providers>
          <Nav />
          <main className="mx-auto min-h-[70dvh] max-w-6xl px-4 pb-28 pt-6 md:pb-16">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
