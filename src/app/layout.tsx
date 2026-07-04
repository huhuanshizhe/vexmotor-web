import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import 'antd/dist/reset.css';

import { StorefrontProviders } from '@/components/providers/storefront-providers';
import { AntdProvider } from '@/components/providers/antd-provider';
import { UiStringsProvider } from '@/components/providers/ui-strings-provider';
import { GoogleAnalytics } from '@/components/seo/google-analytics';
import { JsonLdScript } from '@/components/seo/json-ld';
import { ToastProvider } from '@C/toast';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { fetchUiStringGroups } from '@/lib/ui-strings-client';
import { buildMetadata, buildOrganizationJsonLd } from '@/lib/seo';
import { UI_STRING_PREFETCH_GROUPS } from '@/ui-strings/registry';

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
  const uiStrings = await fetchUiStringGroups(preferences.locale, [...UI_STRING_PREFETCH_GROUPS]).catch(() => ({}));

  return (
    <html lang={preferences.locale} className={`${inter.variable}`}>
      <body data-currency={preferences.currency} data-unit-system={preferences.unitSystem}>
        <JsonLdScript id="organization-jsonld" data={buildOrganizationJsonLd()} />
        <UiStringsProvider initialStrings={uiStrings}>
          <StorefrontProviders initialLocale={preferences.locale} initialUiStrings={uiStrings}>
            <AntdProvider>
              <ToastProvider>{children}</ToastProvider>
            </AntdProvider>
          </StorefrontProviders>
        </UiStringsProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
