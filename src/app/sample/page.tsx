import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildMetadata } from '@/lib/seo';
import { getProductList } from '@/lib/storefront-api';

import { SampleClient } from './sample-client';

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
    title: 'Request Samples — STEPMOTECH',
    description: 'Request engineering samples with per-SKU limits, shipping selection, and buyer contact details.',
    path: '/sample',
    noIndex: true,
    locale,
  });
}

export default async function SamplePage() {
  const { locale } = await getServerSitePreferences();
  const catalog = await getProductList({ purchaseMode: 'buy', pageSize: 24 });

  return (
    <StorefrontFrame>
      <section className="section">
        <div className="section-inner">
          <SampleClient locale={locale} intakeProductId="" intakeProductName="" cart={null} catalogProducts={catalog.items} />
        </div>
      </section>
    </StorefrontFrame>
  );
}
