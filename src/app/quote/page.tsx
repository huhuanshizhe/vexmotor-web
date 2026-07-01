import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildMetadata } from '@/lib/seo';

import { QuoteClient } from './quote-client';

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
    title: 'Request a Quote — STEPMOTECH',
    description: 'Submit RFQ lines with quantity, target market, and engineering notes.',
    path: '/quote',
    noIndex: true,
    locale,
  });
}

export default async function QuotePage() {
  const { locale } = await getServerSitePreferences();

  return (
    <StorefrontFrame>
      <div className="quote-rfq-shell">
        <QuoteClient locale={locale} />
      </div>
    </StorefrontFrame>
  );
}
