import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildMetadata } from '@/lib/seo';
import { CompareClient } from '@/components/storefront/compare-client';
import { getProductList } from '@/lib/storefront-api';

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
  title: 'Compare products — STEPMOTECH',
  description: 'Evaluate catalog items side by side before direct buy or RFQ.',
  path: '/compare',
  noIndex: true,
    locale,
  });
}

export default async function ComparePage() {
  const preferences = await getServerSitePreferences();
  const catalog = await getProductList({ pageSize: 96, sort: 'featured' });

  return (
    <StorefrontFrame
      eyebrow="Compare"
      title="Review products side by side before checkout or RFQ."
      description="This compare list keeps a lightweight shortlist in your browser so you can move between catalog browsing and product evaluation without losing context."
    >
      <section className="section">
        <div className="section-inner">
          <CompareClient locale={preferences.locale} catalogProducts={catalog.items} />
        </div>
      </section>
    </StorefrontFrame>
  );
}