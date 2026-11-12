'use client';
import { ThemeProvider } from 'next-themes';
import { SWRConfig } from 'swr';
import { I18nProvider } from '@/lib/i18n';
import { RealtimeProvider } from '@/lib/realtime';
import { ToastProvider } from '@/components/ui/toast';
import { fetcher } from '@/lib/api';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <SWRConfig value={{ fetcher, dedupingInterval: 2000, errorRetryCount: 2 }}>
        <I18nProvider>
          <RealtimeProvider>
            <ToastProvider>{children}</ToastProvider>
          </RealtimeProvider>
        </I18nProvider>
      </SWRConfig>
    </ThemeProvider>
  );
}
