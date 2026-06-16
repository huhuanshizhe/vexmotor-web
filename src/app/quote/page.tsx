import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildMetadata } from '@/lib/seo';
import { getProductList } from '@/lib/storefront-api';

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
  const catalog = await getProductList({ pageSize: 24 });

  return (
    <StorefrontFrame>
      <section className="section">
        <div className="section-inner">
          <QuoteClient locale={locale} intakeProductId="" intakeProductName="" cart={null} catalogProducts={catalog.items} />
        </div>
      </section>
    </StorefrontFrame>
  );
}
