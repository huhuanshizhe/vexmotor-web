'use client';

import type { ReactNode } from 'react';

import { AuthProvider } from '@/components/providers/auth-provider';
import { WishlistProvider } from '@/components/providers/wishlist-provider';
import type { Locale } from '@/lib/i18n';
import { I18nProvider } from '@/lib/i18n-context';

/** Bundled client providers so Fast Refresh reloads i18n + auth + wishlist together. */
export function StorefrontProviders({
  children,
  initialLocale,
  initialUiStrings = {},
}: {
  children: ReactNode;
  initialLocale: Locale;
  initialUiStrings?: Record<string, string>;
}) {
  return (
    <I18nProvider initialLocale={initialLocale} initialUiStrings={initialUiStrings}>
      <AuthProvider>
        <WishlistProvider>{children}</WishlistProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
