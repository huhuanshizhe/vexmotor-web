import type { ReactNode } from 'react';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { buildMetadata } from '@/lib/seo';
import { getServerSitePreferences } from '@/lib/i18n-server';

import { AccountLayoutShell } from './account-layout-shell';

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
    title: 'Account — STEPMOTECH',
    description: 'Manage orders, addresses, quotes, downloads, and preferences.',
    path: '/account',
    noIndex: true,
    locale,
  });
}

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <StorefrontFrame
      eyebrow="Member Center"
      title="Manage orders, quotes, downloads, lists, company data, and sourcing preferences from one account portal."
      description="The account area now combines order history with quote follow-up, document access, saved BOMs, invoices, company credentials, and buyer-level settings."
    >
      <section className="section">
        <div className="section-inner">
          <AccountLayoutShell>{children}</AccountLayoutShell>
        </div>
      </section>
    </StorefrontFrame>
  );
}
