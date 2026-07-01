import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildMetadata } from '@/lib/seo';
import { CompareClient } from '@/components/storefront/compare-client';

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

  return (
    <StorefrontFrame
      eyebrow="Compare"
      title="Review products side by side before checkout or RFQ."
      description="Compare up to four SKUs with live catalog specifications. Your shortlist stays in this browser, and signed-in buyers can sync it across devices."
    >
      <section className="section">
        <div className="section-inner">
          <CompareClient locale={preferences.locale} />
        </div>
      </section>
    </StorefrontFrame>
  );
}