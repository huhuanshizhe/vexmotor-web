import Link from 'next/link';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { JsonLdScript } from '@/components/seo/json-ld';
import { VolumePricingClient } from '@/components/storefront/volume-pricing-client';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import { getCommerceConfig } from '@/lib/storefront-api';
import { getProductList } from '@/lib/storefront-api';

const faq = [
  {
    question: 'When does contract pricing start to apply?',
    answer: 'Contract review starts after the sales team validates annual demand, target SPU family, warehouse cadence, and payment posture.',
  },
  {
    question: 'Can contract pricing stack with public promotions?',
    answer: 'Public campaigns and contract programs are reviewed separately. The team confirms the better commercial path once demand and timing are clear.',
  },
  {
    question: 'Do you support multiple currencies and Net30?',
    answer: 'Yes. Final currency, invoice structure, and payment terms are confirmed during the account review for approved annual programs.',
  },
];

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
  title: 'Volume Discount & Contract Pricing — STEPMOTECH',
  description: 'Published web tiers, annual-program benefits, and a contract-pricing intake for higher-volume motion component demand.',
  path: '/volume-pricing',
    locale,
  });
}

type VolumePricingPageProps = {
  searchParams: Promise<{ spu?: string }>;
};

export default async function VolumePricingPage({ searchParams }: VolumePricingPageProps) {
  const { locale } = await getServerSitePreferences();
  const [catalog, params, commerceConfig] = await Promise.all([
    getProductList({ pageSize: 96, sort: 'featured' }),
    searchParams,
    getCommerceConfig(locale),
  ]);

  const products = catalog.items.filter((product) => product.purchaseMode === 'buy');
  const intakeProduct = products[0] ?? null;
  if (!intakeProduct) {
    return null;
  }
  const initialSpu = params.spu?.trim() || products[0]?.spu || undefined;
  const browsePath = withLocalePath('/products', locale);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { name: 'Home', path: '/' },
      { name: 'Volume Pricing', path: '/volume-pricing' },
    ],
    locale,
  );
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <StorefrontFrame
      eyebrow="Pricing"
      title="Volume & contract pricing"
      description="Save up to 13% with published web tiers. Annual contracts add planning support, reserved stock, and commercial review for larger programs."
      actions={
        <>
          <Link href={browsePath} className="button-secondary page-button-secondary-dark">
            Browse catalog
          </Link>
          <a href="#contract-apply" className="button-primary">
            Request contract pricing
          </a>
        </>
      }
    >
      <JsonLdScript id="volume-pricing-breadcrumb-jsonld" data={breadcrumbJsonLd} />
      <JsonLdScript id="volume-pricing-faq-jsonld" data={faqJsonLd} />

      <section className="section">
        <div className="section-inner volume-hero-grid">
          <article className="summary-stat">
            <span className="summary-label">Published tiers</span>
            <strong>Shared calculator logic now matches the same price breaks shown on PDP tier summaries.</strong>
          </article>
          <article className="summary-stat">
            <span className="summary-label">Commercial lane</span>
            <strong>Annual programs can move into reserved stock, release scheduling, and payment-term review.</strong>
          </article>
          <article className="summary-stat">
            <span className="summary-label">Best fit</span>
            <strong>Use this page when repeated catalog demand is clear and you want structured commercial review instead of one-off RFQ.</strong>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <VolumePricingClient
            locale={locale}
            intakeProductId={intakeProduct.id}
            products={products}
            initialSpu={initialSpu}
            volumePricingRules={commerceConfig.volumePricingRules}
          />
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <article className="info-card">
            <div className="section-header trade-card-header">
              <div>
                <div className="card-kicker">FAQ</div>
                <h2 className="cart-section-title">Commercial questions</h2>
              </div>
            </div>
            <div className="custom-faq-grid">
              {faq.map((item) => (
                <article key={item.question} className="custom-faq-card">
                  <strong>{item.question}</strong>
                  <p className="section-description">{item.answer}</p>
                </article>
              ))}
            </div>
          </article>
        </div>
      </section>
    </StorefrontFrame>
  );
}