import Link from 'next/link';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { JsonLdScript } from '@/components/seo/json-ld';
import { solutionIndustries } from '@/lib/solutions';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import { getCategories } from '@/lib/storefront-api';

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
  title: 'Industry Motion Solutions — STEPMOTECH',
  description: 'Browse motion solutions by industry, then move into selector, catalog, custom development, or RFQ with the right application context already framed.',
  path: '/solutions',
    locale,
  });
}

export default async function SolutionsPage() {
  const [{ locale }, categories] = await Promise.all([getServerSitePreferences(), getCategories()]);
  const categoryMap = new Map(categories.map((category) => [category.slug, category]));
  const selectorPath = withLocalePath('/selector', locale);
  const customPath = withLocalePath('/custom', locale);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { name: 'Home', path: '/' },
      { name: 'Solutions', path: '/solutions' },
    ],
    locale,
  );
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Industry Motion Solutions',
    description: 'Industry landing pages for motion-control product families, applications, and guided solution entry points.',
  };

  return (
    <StorefrontFrame
      eyebrow="Solutions"
      title="Motion solutions by industry"
      description="Start from the machine context instead of a part number. Each solution page narrows the likely motion families, shows the right stocked reference SKUs, and hands off into selector, RFQ, or custom engineering review."
      actions={
        <>
          <Link href={selectorPath} className="button-primary">
            Open selector
          </Link>
          <Link href={customPath} className="button-secondary page-button-secondary-dark">
            Start custom intake
          </Link>
        </>
      }
    >
      <JsonLdScript id="solutions-breadcrumb-jsonld" data={breadcrumbJsonLd} />
      <JsonLdScript id="solutions-collection-jsonld" data={collectionJsonLd} />

      <section className="section">
        <div className="section-inner solutions-overview-grid">
          <article className="summary-stat">
            <span className="summary-label">Industries</span>
            <strong>{solutionIndustries.length} solution tracks mapped to selector, catalog, and RFQ handoff.</strong>
          </article>
          <article className="summary-stat">
            <span className="summary-label">Catalog families</span>
            <strong>{categories.length} stocked families reused as solution building blocks before custom review is needed.</strong>
          </article>
          <article className="summary-stat">
            <span className="summary-label">Best next step</span>
            <strong>Open the industry page that matches the machine, then use its preset to jump into selector or RFQ with context already applied.</strong>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <div className="section-header">
            <div>
              <h2 className="section-title">Industry tiles</h2>
              <p className="section-description">Each tile packages the application summary, likely product-family count, and the number of reference case studies already framed for the next page.</p>
            </div>
          </div>

          <div className="solutions-index-grid">
            {solutionIndustries.map((industry) => {
              const recommendedCategories = industry.recommendedCategorySlugs
                .map((slug) => categoryMap.get(slug))
                .filter((category): category is NonNullable<typeof category> => Boolean(category));

              return (
                <Link key={industry.slug} href={withLocalePath(`/solutions/${industry.slug}`, locale)} className="solution-index-tile">
                  <div className="solution-index-media" style={{ backgroundImage: `linear-gradient(180deg, rgba(10, 25, 43, 0.18), rgba(10, 25, 43, 0.66)), url(${industry.imageSrc})` }} />
                  <div className="solution-index-body">
                    <span className="card-kicker">Industry</span>
                    <h2 className="cart-section-title">{industry.title}</h2>
                    <p className="section-description compact-copy">{industry.summary}</p>

                    <div className="solution-stat-row">
                      <span className="filter-chip">{recommendedCategories.length} recommended families</span>
                      <span className="filter-chip">{industry.caseStudies.length} case studies</span>
                    </div>

                    <div className="inline-link-list">
                      {recommendedCategories.slice(0, 2).map((category) => (
                        <span key={category.id} className="section-link solution-inline-link">
                          {category.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </StorefrontFrame>
  );
}