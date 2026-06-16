import Link from 'next/link';

import { ResourceLibraryClient } from '@/components/storefront/resource-library-client';
import { JsonLdScript } from '@/components/seo/json-ld';
import { resourceItems, resourceSections } from '@/lib/resources';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
  title: 'Engineering Resources — STEPMOTECH',
  description: 'Browse whitepapers, videos, webinars, downloads, CAD files, and datasheets from one engineering resource hub.',
  path: '/resources',
    locale,
  });
}

export default async function ResourcesPage() {
  const { locale } = await getServerSitePreferences();
  const gatedCount = resourceItems.filter((resource) => resource.gated).length;
  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Engineering Resources',
    description: 'STEPMOTECH engineering resources hub for whitepapers, videos, webinars, downloads, CAD, and datasheets.',
    url: `https://www.vexmotor.com${withLocalePath('/resources', locale)}`,
  };

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Resources', path: '/resources' },
  ]);

  return (
    <>
      <JsonLdScript id="resources-collection-jsonld" data={collectionPageJsonLd} />
      <JsonLdScript id="resources-breadcrumb-jsonld" data={breadcrumbJsonLd} />

      <section className="hero-section content-hero">
        <div className="hero-copy">
          <span className="eyebrow">Engineering resources</span>
          <h1>Engineering Resources</h1>
          <p>
            Whitepapers, videos, webinars, operational downloads, CAD packages, and datasheets are now grouped into one searchable hub.
            Filter by topic, product line, language, format, or gate status before routing the right file into your project workflow.
          </p>
          <div className="button-row">
            <Link href={withLocalePath('/resources/datasheet', locale)} className="button-primary">Browse Datasheets</Link>
            <Link href={withLocalePath('/resources/cad', locale)} className="button-secondary">Open CAD Library</Link>
          </div>
        </div>
        <div className="content-card resource-stats-card">
          <div>
            <dt>Total resources</dt>
            <dd>{resourceItems.length}</dd>
          </div>
          <div>
            <dt>Gated assets</dt>
            <dd>{gatedCount}</dd>
          </div>
          <div>
            <dt>Libraries</dt>
            <dd>6 sections</dd>
          </div>
        </div>
      </section>

      <section className="section-shell">
        <div className="resource-tab-row" role="tablist" aria-label="Resource sections">
          {resourceSections.map((section) => (
            <Link key={section.slug} href={withLocalePath(`/resources/${section.slug}`, locale)} className="resource-tab-link">
              {section.label}
            </Link>
          ))}
        </div>

        <div className="content-grid three-up resource-summary-grid">
          {resourceSections.map((section) => (
            <article key={section.slug} className="content-card">
              <div className="card-kicker">{section.eyebrow}</div>
              <h2>{section.label}</h2>
              <p>{section.description}</p>
              <Link href={withLocalePath(`/resources/${section.slug}`, locale)} className="inline-link">Open section</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section-shell">
        <div className="section-heading">
          <div>
            <div className="card-kicker">Unified library</div>
            <h2 className="section-title">Filter every resource from one place</h2>
          </div>
          <p className="section-description">Gated files use an email capture flow; open files can be downloaded immediately. CAD and datasheet items also respond to SKU search.</p>
        </div>
        <ResourceLibraryClient locale={locale} resources={resourceItems} />
      </section>
    </>
  );
}