import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import 'antd/dist/reset.css';

import { AuthProvider } from '@/components/providers/auth-provider';
import { AntdProvider } from '@/components/providers/antd-provider';
import { GoogleAnalytics } from '@/components/seo/google-analytics';
import { JsonLdScript } from '@/components/seo/json-ld';
import { ToastProvider } from '@C/toast';
import { I18nProvider } from '@/lib/i18n-context';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildMetadata, buildOrganizationJsonLd } from '@/lib/seo';

import './globals.css';
import './design-system.css';

// Optimize Inter font with next/font
// - Automatically self-hosted (no external requests)
// - Subset to latin for smaller file size
// - Preloaded for zero layout shift
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
  preload: true,
});

export const metadata: Metadata = buildMetadata();

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const preferences = await getServerSitePreferences();

  return (
    <html lang={preferences.locale} className={`${inter.variable}`}>
      <body data-currency={preferences.currency} data-unit-system={preferences.unitSystem}>
        <JsonLdScript id="organization-jsonld" data={buildOrganizationJsonLd()} />
        <I18nProvider initialLocale={preferences.locale}>
          <AuthProvider>
            <AntdProvider>
              <ToastProvider>{children}</ToastProvider>
            </AntdProvider>
          </AuthProvider>
        </I18nProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
