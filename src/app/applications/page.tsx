import Link from 'next/link';

import { JsonLdScript } from '@/components/seo/json-ld';
import { applicationCaseStudies, applicationIndustries, applicationProductLines, applicationRegions, filterApplicationCaseStudies } from '@/lib/applications';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';

type ApplicationsPageProps = {
  searchParams: Promise<{
    industry?: string;
    productLine?: string;
    region?: string;
  }>;
};

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
  title: 'Motion Solutions by Industry — STEPMOTECH',
  description: 'Browse application case studies by industry, product line, and region to find the right motion solution pattern.',
  path: '/applications',
    locale,
  });
}

export default async function ApplicationsPage({ searchParams }: ApplicationsPageProps) {
  const [{ locale }, params] = await Promise.all([getServerSitePreferences(), searchParams]);
  const filteredCases = filterApplicationCaseStudies({
    industry: params.industry?.trim() || undefined,
    productLine: params.productLine?.trim() || undefined,
    region: params.region?.trim() || undefined,
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Applications', path: '/applications' },
  ], locale);
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Motion solutions by industry',
    description: 'Application case studies for motion-control programs by industry, region, and product line.',
  };
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: filteredCases.map((caseStudy, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `https://www.vexmotor.com${withLocalePath(`/applications/${caseStudy.slug}`, locale)}`,
      name: caseStudy.title,
    })),
  };

  function buildApplicationsHref(overrides: { industry?: string | null; productLine?: string | null; region?: string | null }) {
    const query = new URLSearchParams();
    const values = {
      industry: overrides.industry !== undefined ? overrides.industry : params.industry,
      productLine: overrides.productLine !== undefined ? overrides.productLine : params.productLine,
      region: overrides.region !== undefined ? overrides.region : params.region,
    };

    if (values.industry) query.set('industry', values.industry);
    if (values.productLine) query.set('productLine', values.productLine);
    if (values.region) query.set('region', values.region);

    const href = withLocalePath('/applications', locale);
    const search = query.toString();
    return search ? `${href}?${search}` : href;
  }

  return (
    <>
      <JsonLdScript id="applications-breadcrumb-jsonld" data={breadcrumbJsonLd} />
      <JsonLdScript id="applications-collection-jsonld" data={collectionJsonLd} />
      <JsonLdScript id="applications-itemlist-jsonld" data={itemListJsonLd} />

      <section className="hero-section applications-hero-section">
        <div className="hero-copy">
          <span className="eyebrow">Applications</span>
          <h1>Motion solutions by industry</h1>
          <p>Browse case-study style application references by industry, product line, and region, then move into selector, RFQ, or engineering contact with the right context already framed.</p>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <div className="applications-industry-grid">
            {applicationIndustries.map((industry) => (
              <Link key={industry.slug} href={buildApplicationsHref({ industry: industry.slug, productLine: null, region: null })} className={`applications-industry-tile${params.industry === industry.slug ? ' is-active' : ''}`}>
                <div className="card-kicker">Industry</div>
                <h2 className="cart-section-title">{industry.title}</h2>
                <p className="section-description compact-copy">{industry.summary}</p>
                <div className="application-chip-row">
                  <span className="filter-chip">{industry.tileCount} case studies</span>
                  <span className="filter-chip">{industry.productLine}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner applications-shell">
          <article className="info-card applications-filter-card">
            <div className="section-header trade-card-header">
              <div>
                <div className="card-kicker">Filters</div>
                <h2 className="cart-section-title">Filter case studies</h2>
              </div>
              <Link href={withLocalePath('/applications', locale)} className="section-link">Clear filters</Link>
            </div>

            <form action={withLocalePath('/applications', locale)} method="get" className="applications-filter-form">
              <label>
                Industry
                <select name="industry" defaultValue={params.industry ?? ''}>
                  <option value="">All industries</option>
                  {applicationIndustries.map((industry) => (
                    <option key={industry.slug} value={industry.slug}>{industry.title}</option>
                  ))}
                </select>
              </label>
              <label>
                Product line
                <select name="productLine" defaultValue={params.productLine ?? ''}>
                  <option value="">All product lines</option>
                  {applicationProductLines.map((productLine) => (
                    <option key={productLine} value={productLine}>{productLine}</option>
                  ))}
                </select>
              </label>
              <label>
                Region
                <select name="region" defaultValue={params.region ?? ''}>
                  <option value="">All regions</option>
                  {applicationRegions.map((region) => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </label>
              <button type="submit" className="button-secondary">Apply filters</button>
            </form>
          </article>

          <div className="applications-case-grid">
            {filteredCases.map((caseStudy) => (
              <article key={caseStudy.slug} className="applications-case-card">
                <a href={withLocalePath(`/applications/${caseStudy.slug}`, locale)} className="applications-case-cover-link">
                  <img src={withLocalePath(`/applications/cover/${caseStudy.slug}`, locale)} alt={`${caseStudy.title} cover`} className="applications-case-cover" />
                </a>
                <div className="applications-case-body">
                  <div className="application-chip-row">
                    <span className="resource-chip">{caseStudy.industryTitle}</span>
                    <span className="product-meta">{caseStudy.region}</span>
                  </div>
                  <h2>
                    <Link href={withLocalePath(`/applications/${caseStudy.slug}`, locale)}>{caseStudy.title}</Link>
                  </h2>
                  <p className="section-description">{caseStudy.summary}</p>
                  <div className="application-chip-row">
                    {caseStudy.kpis.slice(0, 2).map((kpi) => (
                      <span key={kpi.label} className="filter-chip">{kpi.value} {kpi.label}</span>
                    ))}
                  </div>
                  <div className="blog-card-footer">
                    <div>
                      <strong>{caseStudy.clientLabel}</strong>
                      <div className="product-meta">{caseStudy.productLine}</div>
                    </div>
                    <Link href={withLocalePath(`/applications/${caseStudy.slug}`, locale)} className="section-link">Open case study</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}