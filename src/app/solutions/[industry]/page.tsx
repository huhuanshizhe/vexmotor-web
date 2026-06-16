import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { JsonLdScript } from '@/components/seo/json-ld';
import { getSolutionIndustry, solutionIndustries } from '@/lib/solutions';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import { getCategories, getProductList } from '@/lib/storefront-api';

type SolutionDetailPageProps = {
  params: Promise<{ industry: string }>;
};

export function generateStaticParams() {
  return solutionIndustries.map((industry) => ({ industry: industry.slug }));
}

export async function generateMetadata({ params }: SolutionDetailPageProps) {
  const { locale } = await getServerSitePreferences();
  const { industry } = await params;
  const solution = getSolutionIndustry(industry);

  if (!solution) {
    return buildMetadata({
      title: 'Solutions — STEPMOTECH',
      path: '/solutions',
      locale,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: `${solution.title} Motion Solutions — STEPMOTECH`,
    description: solution.painSummary,
    path: `/solutions/${solution.slug}`,
    locale,
  });
}

export default async function SolutionDetailPage({ params }: SolutionDetailPageProps) {
  const [{ locale }, { industry }, categories, productsResult] = await Promise.all([
    getServerSitePreferences(),
    params,
    getCategories(),
    getProductList({ pageSize: 96, sort: 'featured' }),
  ]);
  const solution = getSolutionIndustry(industry);

  if (!solution) {
    notFound();
  }

  const categoryMap = new Map(categories.map((category) => [category.slug, category]));
  const productMap = new Map(productsResult.items.map((product) => [product.id, product]));
  const recommendedCategories = solution.recommendedCategorySlugs
    .map((slug) => categoryMap.get(slug))
    .filter((category): category is NonNullable<typeof category> => Boolean(category));
  const featuredProducts = solution.featuredProductIds
    .map((id) => productMap.get(id))
    .filter((product): product is NonNullable<typeof product> => Boolean(product));
  const browsePath = recommendedCategories[0] ? withLocalePath(`/c/${recommendedCategories[0].slug}`, locale) : withLocalePath('/products', locale);
  const selectorHref = `${withLocalePath('/selector', locale)}?category=${encodeURIComponent(solution.selectorCategory)}&industry=${encodeURIComponent(solution.selectorIndustry)}`;
  const rfqHref = withLocalePath('/quote', locale);
  const contactHref = `${withLocalePath('/contact', locale)}?topic=engineering-call`;
  const customHref = `${withLocalePath('/custom', locale)}?sourceProduct=${encodeURIComponent(solution.title)}%20program`;
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { name: 'Home', path: '/' },
      { name: 'Solutions', path: '/solutions' },
      { name: solution.title, path: `/solutions/${solution.slug}` },
    ],
    locale,
  );
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${solution.title} motion solutions`,
    description: solution.painSummary,
  };
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: solution.faq.map((item) => ({
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
      eyebrow="Solutions"
      title={`${solution.title} motion solutions`}
      description={solution.painSummary}
      actions={
        <>
          <Link href={browsePath} className="button-primary">
            Browse recommended motors
          </Link>
          <Link href={contactHref} className="button-secondary page-button-secondary-dark">
            Talk to engineer
          </Link>
        </>
      }
    >
      <JsonLdScript id="solution-detail-breadcrumb-jsonld" data={breadcrumbJsonLd} />
      <JsonLdScript id="solution-detail-collection-jsonld" data={collectionJsonLd} />
      <JsonLdScript id="solution-detail-faq-jsonld" data={faqJsonLd} />

      <section className="section">
        <div className="section-inner solution-hero-grid">
          <article className="info-card solution-hero-card">
            <div className="solution-hero-copy">
              <div className="card-kicker">Pain-point summary</div>
              <h2 className="cart-section-title">What this industry usually needs</h2>
              <p className="section-description">{solution.painSummary}</p>
            </div>

            <div className="solution-meta-grid">
              <article className="summary-stat">
                <span className="summary-label">Recommended families</span>
                <strong>{recommendedCategories.length}</strong>
              </article>
              <article className="summary-stat">
                <span className="summary-label">Reference SKUs</span>
                <strong>{featuredProducts.length}</strong>
              </article>
              <article className="summary-stat">
                <span className="summary-label">Case studies</span>
                <strong>{solution.caseStudies.length}</strong>
              </article>
            </div>
          </article>

          <article className="info-card solution-hero-visual">
            <div className="solution-hero-image-wrap">
              <Image src={solution.imageSrc} alt={`${solution.title} application`} fill sizes="(max-width: 820px) 100vw, 420px" unoptimized className="solution-hero-image" />
            </div>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <div className="section-header">
            <div>
              <h2 className="section-title">Recommended categories</h2>
              <p className="section-description">Use these product families as the first browse step before narrowing into a specific SKU or RFQ path.</p>
            </div>
          </div>

          <div className="solution-category-grid">
            {recommendedCategories.map((category) => (
              <Link key={category.id} href={withLocalePath(`/c/${category.slug}`, locale)} className="category-card solution-category-card">
                <span className="card-kicker">Category</span>
                <strong>{category.name}</strong>
                <p className="section-description compact-copy">{category.description}</p>
                <span className="filter-chip">{category.productCount ?? 0} products</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <div className="section-header">
            <div>
              <h2 className="section-title">Featured SKUs</h2>
              <p className="section-description">Stocked reference parts and inquiry-led assemblies that commonly anchor this industry conversation.</p>
            </div>
          </div>

          <div className="solution-sku-grid">
            {featuredProducts.map((product) => (
              <article key={product.id} className="product-card solution-sku-card">
                {product.coverImage ? (
                  <Link href={withLocalePath(`/products/${product.slug}`, locale)} className="product-card-media">
                    <Image src={product.coverImage.url} alt={product.coverImage.alt || product.name} fill sizes="(max-width: 820px) 100vw, 320px" unoptimized className="product-card-image" />
                  </Link>
                ) : null}
                <span className="product-badge">{product.purchaseMode === 'buy' ? 'Direct buy' : 'RFQ project'}</span>
                <strong>{product.name}</strong>
                <p className="section-description compact-copy">{product.shortDescription}</p>
                <div className="solution-sku-footer">
                  <span className="card-kicker">{product.purchaseMode === 'buy' ? product.price.formatted : 'Request Quote'}</span>
                  <Link href={withLocalePath(`/products/${product.slug}`, locale)} className="section-link">
                    View product
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner solution-secondary-grid">
          <article className="info-card">
            <div className="section-header trade-card-header">
              <div>
                <div className="card-kicker">Application requirements</div>
                <h2 className="cart-section-title">Typical motion envelope</h2>
              </div>
            </div>
            <div className="solution-requirements-table">
              {solution.requirements.map((requirement) => (
                <div key={requirement.label} className="solution-requirement-row">
                  <div>
                    <strong>{requirement.label}</strong>
                    <p className="section-description compact-copy">{requirement.note}</p>
                  </div>
                  <strong>{requirement.value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="info-card">
            <div className="section-header trade-card-header">
              <div>
                <div className="card-kicker">Resources</div>
                <h2 className="cart-section-title">Read next</h2>
              </div>
            </div>
            <div className="solution-resource-grid">
              {solution.resources.map((resource) => (
                <Link key={resource.title} href={withLocalePath(resource.href, locale)} className="summary-stat">
                  <span className="summary-label">{resource.meta}</span>
                  <strong>{resource.title}</strong>
                  <span className="section-description compact-copy">{resource.description}</span>
                </Link>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <article className="info-card">
            <div className="section-header trade-card-header">
              <div>
                <div className="card-kicker">Case studies</div>
                <h2 className="cart-section-title">Reference programs</h2>
              </div>
            </div>
            <div className="solution-case-grid">
              {solution.caseStudies.map((caseStudy) => (
                <article key={caseStudy.title} className="summary-stat solution-case-card">
                  <span className="summary-label">Program</span>
                  <strong>{caseStudy.title}</strong>
                  <p className="section-description compact-copy">{caseStudy.summary}</p>
                  <strong>{caseStudy.outcome}</strong>
                </article>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="section-inner solution-secondary-grid">
          <article className="info-card">
            <div className="section-header trade-card-header">
              <div>
                <div className="card-kicker">FAQ</div>
                <h2 className="cart-section-title">Industry questions</h2>
              </div>
            </div>
            <div className="custom-faq-grid">
              {solution.faq.map((item) => (
                <article key={item.question} className="custom-faq-card">
                  <strong>{item.question}</strong>
                  <p className="section-description">{item.answer}</p>
                </article>
              ))}
            </div>
          </article>

          <article className="info-card solution-cta-card">
            <div className="section-header trade-card-header">
              <div>
                <div className="card-kicker">Next step</div>
                <h2 className="cart-section-title">Move into selector or RFQ</h2>
              </div>
            </div>
            <p className="section-description">Use the selector when the application is still narrowing, move into RFQ when the BOM is broader, or open custom development if this industry needs packaging, control, or environmental changes beyond the stocked line.</p>
            <div className="trade-empty-actions">
              <Link href={selectorHref} className="button-primary">
                Open selector preset
              </Link>
              <Link href={rfqHref} className="button-secondary">
                Open RFQ workspace
              </Link>
              <Link href={customHref} className="button-secondary">
                Start custom development
              </Link>
            </div>
          </article>
        </div>
      </section>
    </StorefrontFrame>
  );
}