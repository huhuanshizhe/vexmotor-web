import Link from 'next/link';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { JsonLdScript } from '@/components/seo/json-ld';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import { SITE_NAME, SITE_URL } from '@/lib/site-config';
import { getPressCatalog } from '@/lib/storefront-api';
import { footerContactBlocks } from '@/lib/site-shell';

function normalizePressReleaseDate(dateLabel: string) {
  const parsed = new Date(`${dateLabel} 01`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();

  return buildMetadata({
    title: 'Press — STEPMOTECH',
    description: 'Press releases, media kit download, and media contact routes for company background and publication requests.',
    path: '/company/press',
    locale,
  });
}

export default async function CompanyPressPage() {
  const [{ locale }, pressCatalog] = await Promise.all([getServerSitePreferences(), getPressCatalog()]);
  const pressContactPath = withLocalePath('/support/contact?topic=press', locale);
  const pageUrl = `${SITE_URL}${withLocalePath('/company/press', locale)}`;
  const emailBlock = footerContactBlocks.find((block) => block.title === 'Email');
  const phoneBlock = footerContactBlocks.find((block) => block.title === 'Phone');
  const groupedReleases = Object.entries(
    pressCatalog.releases.reduce<Record<string, typeof pressCatalog.releases>>((groups, release) => {
      const key = String(release.year);
      groups[key] = [...(groups[key] ?? []), release];
      return groups;
    }, {}),
  ).sort((left, right) => Number(right[0]) - Number(left[0]));

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { name: 'Home', path: '/' },
      { name: 'About', path: '/company/about' },
      { name: 'Press', path: '/company/press' },
    ],
    locale,
  );
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${SITE_NAME} Press`,
    description: 'Company press releases, media kit, and media contact information.',
    url: pageUrl,
    inLanguage: locale,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntity: pressCatalog.releases.map((release) => ({
      '@type': 'NewsArticle',
      headline: release.title,
      description: release.summary,
      datePublished: normalizePressReleaseDate(release.dateLabel),
      articleSection: release.category,
    })),
  };

  return (
    <StorefrontFrame
      eyebrow="Company"
      title="Press releases, media kit assets, and contact routes for publication requests."
      description="Use this page to review recent company updates, download the current media kit, and route interviews or feature requests into the press contact path."
      actions={
        <>
          <a href="/company/press/media-kit" className="button-primary">
            Download Media Kit
          </a>
          <Link href={pressContactPath} className="button-secondary page-button-secondary-dark">
            Contact Press Desk
          </Link>
        </>
      }
    >
      <JsonLdScript id="company-press-breadcrumb-jsonld" data={breadcrumbJsonLd} />
      <JsonLdScript id="company-press-collection-jsonld" data={collectionJsonLd} />

      <section className="section">
        <div className="section-inner story-grid">
          <article className="story-card story-card-accent">
            <div className="card-kicker">Media boilerplate</div>
            <h2 className="section-title">Short company summary for editors and partner publications.</h2>
            <p className="section-description">{pressCatalog.boilerplate}</p>
          </article>

          <article className="story-card">
            <div className="card-kicker">Media contacts</div>
            <div className="support-list">
              {emailBlock?.lines.map((line) => (
                <div key={line} className="support-item">
                  <span className="support-bullet" />
                  <span>{line}</span>
                </div>
              ))}
              {phoneBlock?.lines.map((line) => (
                <div key={line} className="support-item">
                  <span className="support-bullet" />
                  <span>{line}</span>
                </div>
              ))}
              <div className="support-item">
                <span className="support-bullet" />
                <span>Press and publication requests can also be routed through the structured press desk ticket flow.</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="section-inner info-grid">
          {groupedReleases.map(([year, releases]) => (
            <article key={year} className="info-card">
              <div className="card-kicker">{year}</div>
              <h2 className="cart-section-title">Press releases</h2>
              <div className="support-list">
                {releases.map((release) => (
                  <div key={`${release.year}-${release.title}`} className="support-item">
                    <span className="support-bullet" />
                    <span>
                      <strong>{release.dateLabel} · {release.category}</strong>
                      <br />
                      {release.title}
                      <br />
                      <span className="section-description compact-copy">{release.summary}</span>
                    </span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-inner info-grid">
          <article className="info-card">
            <div className="card-kicker">Media kit</div>
            <h2 className="cart-section-title">ZIP download</h2>
            <p className="section-description">The media kit ZIP includes boilerplate, logo guidance, executive summary copy, and the current press-contact reference file.</p>
            <div className="trade-empty-actions">
              <a href="/company/press/media-kit" className="button-secondary">
                Download ZIP
              </a>
            </div>
          </article>

          <article className="info-card">
            <div className="card-kicker">Press contact path</div>
            <h2 className="cart-section-title">Interviews and publication requests</h2>
            <p className="section-description">Use the structured press topic when you need background, quotes, product-feature context, or publication coordination.</p>
            <div className="trade-empty-actions">
              <Link href={pressContactPath} className="button-secondary">
                Open Press Contact
              </Link>
            </div>
          </article>
        </div>
      </section>
    </StorefrontFrame>
  );
}