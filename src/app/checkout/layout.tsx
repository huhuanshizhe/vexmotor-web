import type { ReactNode } from 'react';

import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
  title: 'Checkout — STEPMOTECH',
  description: 'Secure checkout and order confirmation.',
  path: '/checkout',
  noIndex: true,
    locale,
  });
}

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return children;
}