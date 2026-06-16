import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ResourceLibraryClient } from '@/components/storefront/resource-library-client';
import { JsonLdScript } from '@/components/seo/json-ld';
import { getResourceItemsBySection, getResourceSectionMeta, resourceSections, type ResourceSection } from '@/lib/resources';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';

type ResourceSectionPageProps = {
  params: Promise<{ section: string }>;
};

export async function generateStaticParams() {
  return resourceSections.map((section) => ({ section: section.slug }));
}

export async function generateMetadata({ params }: ResourceSectionPageProps) {
  const { locale } = await getServerSitePreferences();
  const { section: rawSection } = await params;
  const section = getResourceSectionMeta(rawSection as ResourceSection);

  if (!section) {
    return buildMetadata({
      locale,
      title: 'Resources — STEPMOTECH',
      description: 'Engineering resources library.',
      path: '/resources',
    });
  }

  return buildMetadata({
    title: `${section.label} — STEPMOTECH`,
    description: section.description,
    path: `/resources/${section.slug}`,
    locale,
  });
}

export default async function ResourceSectionPage({ params }: ResourceSectionPageProps) {
  const [{ locale }, { section: rawSection }] = await Promise.all([getServerSitePreferences(), params]);
  const section = getResourceSectionMeta(rawSection as ResourceSection);

  if (!section) {
    notFound();
  }

  const resources = getResourceItemsBySection(section.slug);
  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: section.label,
    description: section.description,
    url: `https://www.vexmotor.com${withLocalePath(`/resources/${section.slug}`, locale)}`,
  };
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Resources', path: '/resources' },
    { name: section.label, path: `/resources/${section.slug}` },
  ]);

  return (
    <>
      <JsonLdScript id={`resources-${section.slug}-collection-jsonld`} data={collectionPageJsonLd} />
      <JsonLdScript id={`resources-${section.slug}-breadcrumb-jsonld`} data={breadcrumbJsonLd} />

      <section className="hero-section content-hero">
        <div className="hero-copy">
          <span className="eyebrow">{section.eyebrow}</span>
          <h1>{section.label}</h1>
          <p>{section.description}</p>
          <div className="button-row">
            <Link href={withLocalePath('/resources', locale)} className="button-secondary">All resources</Link>
            <Link href={withLocalePath('/contact', locale)} className="button-primary">Request support</Link>
          </div>
        </div>
        <div className="content-card resource-hero-note">
          <div className="card-kicker">Workflow note</div>
          <p>
            {section.slug === 'webinars'
              ? 'Upcoming webinars route into the existing contact workflow while HubSpot registration is migrated.'
              : section.slug === 'cad'
                ? 'Search by SKU to jump straight into the package most often requested during 3D integration reviews.'
                : section.slug === 'datasheet'
                  ? 'Language and SKU filters help teams reach the right export without bouncing through product detail pages.'
                  : 'Use the shared filters below to narrow the library to the exact file family your project team needs.'}
          </p>
        </div>
      </section>

      <section className="section-shell">
        <div className="resource-tab-row" role="tablist" aria-label="Resource sections">
          {resourceSections.map((entry) => (
            <Link
              key={entry.slug}
              href={withLocalePath(`/resources/${entry.slug}`, locale)}
              className={`resource-tab-link${entry.slug === section.slug ? ' is-active' : ''}`}
              aria-current={entry.slug === section.slug ? 'page' : undefined}
            >
              {entry.label}
            </Link>
          ))}
        </div>

        <ResourceLibraryClient locale={locale} resources={resources} />
      </section>
    </>
  );
}