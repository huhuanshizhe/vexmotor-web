import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AddToCartButton } from '@/components/storefront/add-to-cart-button';
import { JsonLdScript } from '@/components/seo/json-ld';
import { applicationCaseStudies, getApplicationCaseStudyBySlug, getRelatedApplicationCaseStudies } from '@/lib/applications';
import { type Locale, withLocalePath } from '@/lib/i18n';
import { getSolutionIndustry } from '@/lib/solutions';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import { SITE_URL } from '@/lib/site-config';
import { getProductList, type StorefrontProductCard } from '@/lib/storefront-api';

type ApplicationDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return applicationCaseStudies.map((caseStudy) => ({ slug: caseStudy.slug }));
}

export async function generateMetadata({ params }: ApplicationDetailPageProps) {
  const { locale } = await getServerSitePreferences();
  const { slug } = await params;
  const caseStudy = getApplicationCaseStudyBySlug(slug);

  if (!caseStudy) {
    return buildMetadata({
      title: 'Applications — STEPMOTECH',
      description: 'Motion application case studies.',
      path: '/applications',
      locale,
    });
  }

  return buildMetadata({
    title: `${caseStudy.title} — STEPMOTECH`,
    description: caseStudy.resultHeadline,
    path: `/applications/${caseStudy.slug}`,
    type: 'article',
    images: [{ url: `/applications/cover/${caseStudy.slug}`, alt: `${caseStudy.title} cover` }],
    locale,
  });
}

function ApplicationProductCard({ product, locale }: { product: StorefrontProductCard; locale: Locale }) {
  return (
    <article className="blog-product-card">
      <div className="blog-product-copy">
        <div className="card-kicker">Product used</div>
        <h3>
          <Link href={withLocalePath(`/products/${product.slug}`, locale)}>{product.name}</Link>
        </h3>
        <p className="product-meta">{product.spu}</p>
        <p className="section-description compact-copy">{product.shortDescription ?? 'Catalog hardware used in the reference program.'}</p>
      </div>
      <div className="blog-product-actions">
        <p className="product-price">{product.purchaseMode === 'buy' ? product.price.formatted : 'Request Quote'}</p>
        {product.purchaseMode === 'buy' ? (
          <AddToCartButton productId={product.id} redirectToCart={false} />
        ) : (
          <Link href={withLocalePath(`/products/${product.slug}`, locale)} className="button-secondary">Open RFQ</Link>
        )}
      </div>
    </article>
  );
}

export default async function ApplicationDetailPage({ params }: ApplicationDetailPageProps) {
  const [{ locale }, { slug }, catalog] = await Promise.all([
    getServerSitePreferences(),
    params,
    getProductList({ pageSize: 96, sort: 'featured' }),
  ]);
  const caseStudy = getApplicationCaseStudyBySlug(slug);

  if (!caseStudy) {
    notFound();
  }

  const industry = getSolutionIndustry(caseStudy.industrySlug);
  const productMap = new Map(catalog.items.map((product) => [product.id, product]));
  const products = caseStudy.featuredProductIds.map((id) => productMap.get(id)).filter((product): product is StorefrontProductCard => Boolean(product));
  const relatedCases = getRelatedApplicationCaseStudies(caseStudy);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Applications', path: '/applications' },
    { name: caseStudy.title, path: `/applications/${caseStudy.slug}` },
  ], locale);
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: caseStudy.title,
    description: caseStudy.resultHeadline,
    image: [`${SITE_URL}/applications/cover/${caseStudy.slug}`],
    author: { '@type': 'Organization', name: 'STEPMOTECH' },
    about: caseStudy.industryTitle,
    mainEntityOfPage: `${SITE_URL}${withLocalePath(`/applications/${caseStudy.slug}`, locale)}`,
  };
  const discussHref = `${withLocalePath('/contact', locale)}?topic=engineering-call&context=${encodeURIComponent(caseStudy.slug)}`;

  return (
    <>
      <JsonLdScript id={`application-${caseStudy.slug}-breadcrumb-jsonld`} data={breadcrumbJsonLd} />
      <JsonLdScript id={`application-${caseStudy.slug}-article-jsonld`} data={articleJsonLd} />

      <section className="hero-section applications-detail-hero">
        <div className="applications-detail-hero-media">
          <img src={withLocalePath(`/applications/cover/${caseStudy.slug}`, locale)} alt={`${caseStudy.title} cover`} className="applications-detail-cover" />
        </div>
        <div className="hero-copy">
          <div className="application-chip-row">
            <span className="resource-chip">{caseStudy.clientLabel}</span>
            <span className="product-meta">{caseStudy.industryTitle}</span>
            <span className="product-meta">{caseStudy.region}</span>
          </div>
          <h1>{caseStudy.title}</h1>
          <p>{caseStudy.resultHeadline}</p>
          <div className="applications-kpi-grid">
            {caseStudy.kpis.map((kpi) => (
              <article key={kpi.label} className="summary-stat">
                <span className="summary-label">{kpi.label}</span>
                <strong>{kpi.value}</strong>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner applications-detail-stack">
          <div className="applications-prose-grid">
            <article className="story-card story-card-accent">
              <div className="card-kicker">Problem</div>
              <h2 className="section-title">The program pressure</h2>
              {caseStudy.problem.map((paragraph) => <p key={paragraph} className="section-description">{paragraph}</p>)}
            </article>
            <article className="story-card">
              <div className="card-kicker">Solution</div>
              <h2 className="section-title">What the team standardized</h2>
              {caseStudy.solution.map((paragraph) => <p key={paragraph} className="section-description">{paragraph}</p>)}
            </article>
            <article className="story-card">
              <div className="card-kicker">Results</div>
              <h2 className="section-title">What improved after rollout</h2>
              {caseStudy.results.map((paragraph) => <p key={paragraph} className="section-description">{paragraph}</p>)}
            </article>
          </div>

          {products.length ? (
            <section>
              <div className="section-header trade-card-header">
                <div>
                  <div className="card-kicker">Products used</div>
                  <h2 className="cart-section-title">Catalog hardware in the stack</h2>
                </div>
              </div>
              <div className="blog-related-product-grid">
                {products.map((product) => <ApplicationProductCard key={product.id} product={product} locale={locale} />)}
              </div>
            </section>
          ) : null}

          <article className="info-card applications-quote-card">
            <div className="card-kicker">Engineer quote</div>
            <blockquote>{caseStudy.engineerQuote}</blockquote>
          </article>

          <div className="applications-download-grid">
            <article className="info-card">
              <div className="card-kicker">Downloads</div>
              <h2 className="cart-section-title">PDF case study</h2>
              <p className="section-description">A generated PDF summary is available for procurement handoff, distributor enablement, and program review packs.</p>
              <div className="trade-empty-actions">
                <a href={withLocalePath(`/applications/download/${caseStudy.slug}`, locale)} className="button-secondary">Download PDF</a>
              </div>
            </article>
            <article className="info-card">
              <div className="card-kicker">Related solution</div>
              <h2 className="cart-section-title">Industry context</h2>
              <p className="section-description">The broader solution page keeps the same industry framing, recommended product families, and selector preset.</p>
              <div className="trade-empty-actions">
                <Link href={withLocalePath(`/solutions/${caseStudy.industrySlug}`, locale)} className="button-secondary">Open {caseStudy.industryTitle} solution</Link>
              </div>
            </article>
          </div>

          {relatedCases.length ? (
            <section>
              <div className="section-header trade-card-header">
                <div>
                  <div className="card-kicker">Related solutions</div>
                  <h2 className="cart-section-title">Similar programs</h2>
                </div>
              </div>
              <div className="applications-case-grid">
                {relatedCases.map((relatedCase) => (
                  <article key={relatedCase.slug} className="applications-case-card">
                    <a href={withLocalePath(`/applications/${relatedCase.slug}`, locale)} className="applications-case-cover-link">
                      <img src={withLocalePath(`/applications/cover/${relatedCase.slug}`, locale)} alt={`${relatedCase.title} cover`} className="applications-case-cover" />
                    </a>
                    <div className="applications-case-body">
                      <div className="application-chip-row">
                        <span className="resource-chip">{relatedCase.industryTitle}</span>
                        <span className="product-meta">{relatedCase.region}</span>
                      </div>
                      <h3>
                        <Link href={withLocalePath(`/applications/${relatedCase.slug}`, locale)}>{relatedCase.title}</Link>
                      </h3>
                      <p className="section-description compact-copy">{relatedCase.summary}</p>
                      <Link href={withLocalePath(`/applications/${relatedCase.slug}`, locale)} className="section-link">Open case study</Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <article className="info-card blog-cta-card">
            <div>
              <div className="card-kicker">Discuss similar project</div>
              <h2 className="cart-section-title">Route the next application review</h2>
              <p className="section-description">Use the engineering contact path when your project needs a similar motion stack, custom mechanical packaging, or a faster RFQ review.</p>
            </div>
            <div className="trade-empty-actions">
              <Link href={discussHref} className="button-primary">Discuss similar project</Link>
              {industry ? <Link href={withLocalePath(`/solutions/${industry.slug}`, locale)} className="button-secondary">Review solution page</Link> : null}
            </div>
          </article>
        </div>
      </section>
    </>
  );
}