import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { JsonLdScript } from '@/components/seo/json-ld';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { getLegalPageBySlug, legalContact, legalPages } from '@/lib/legal-content';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';

const dateFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

function formatDate(iso: string) {
  return dateFormatter.format(new Date(`${iso}T00:00:00Z`));
}

export function generateStaticParams() {
  return legalPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await getServerSitePreferences();
  const page = getLegalPageBySlug(slug);

  if (!page) {
    return buildMetadata({ title: 'Legal — STEPMOTECH', path: '/legal/terms', locale, noIndex: true });
  }

  return buildMetadata({
    title: `${page.title} — STEPMOTECH`,
    description: page.description,
    path: `/legal/${slug}`,
    locale,
  });
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { locale } = await getServerSitePreferences();
  const page = getLegalPageBySlug(slug);

  if (!page) {
    notFound();
  }

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { name: 'Home', path: '/' },
      { name: 'Legal', path: '/legal/terms' },
      { name: page.title, path: `/legal/${page.slug}` },
    ],
    locale,
  );

  const webPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${page.title} — STEPMOTECH`,
    description: page.description,
    dateModified: page.lastUpdated,
  };

  return (
    <StorefrontFrame
      eyebrow={page.eyebrow}
      title={page.title}
      description={page.description}
      actions={
        <>
          <a href={`/legal/${page.slug}/history`} className="button-primary">
            Download Version History
          </a>
          <Link href={withLocalePath('/support/contact?topic=legal', locale)} className="button-secondary page-button-secondary-dark">
            Contact Legal
          </Link>
        </>
      }
    >
      <JsonLdScript id="legal-breadcrumb-jsonld" data={breadcrumbJsonLd} />
      <JsonLdScript id="legal-webpage-jsonld" data={webPageJsonLd} />

      <section className="section">
        <div className="section-inner support-article-layout legal-article-layout">
          <aside className="trade-side-stack">
            <article className="info-card detail-subnav support-article-toc">
              <div className="card-kicker">On this page</div>
              <div className="inline-link-list">
                {page.sections.map((section) => (
                  <a key={section.id} href={`#${section.id}`} className="section-link">
                    {section.title}
                  </a>
                ))}
              </div>
            </article>

            <article className="info-card">
              <div className="card-kicker">Other legal pages</div>
              <div className="inline-link-list">
                {legalPages
                  .filter((entry) => entry.slug !== page.slug)
                  .map((entry) => (
                    <Link key={entry.slug} href={withLocalePath(`/legal/${entry.slug}`, locale)} className="section-link">
                      {entry.navLabel}
                    </Link>
                  ))}
              </div>
            </article>
          </aside>

          <div className="support-article-stack legal-article-stack">
            <article className="info-card legal-meta-card">
              <div className="legal-meta-row">
                <div>
                  <span className="card-kicker">Last updated</span>
                  <strong>{formatDate(page.lastUpdated)}</strong>
                </div>
                <div>
                  <span className="card-kicker">Effective date</span>
                  <strong>{formatDate(page.effectiveDate)}</strong>
                </div>
              </div>
            </article>

            {page.sections.map((section) => (
              <article key={section.id} id={section.id} className="info-card support-article-card">
                <h2 style={{ marginTop: 0, marginBottom: 12 }}>{section.title}</h2>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="section-description">
                    {paragraph}
                  </p>
                ))}
                {section.bullets?.length ? (
                  <div className="support-list">
                    {section.bullets.map((bullet) => (
                      <div key={bullet} className="support-item">
                        <span className="support-bullet" />
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
                {section.glossaryTerms?.length ? (
                  <div className="legal-term-links">
                    <span className="card-kicker">Defined terms</span>
                    <div className="inline-link-list">
                      {section.glossaryTerms.map((term) => (
                        <Link key={term.termId} href={withLocalePath(`/glossary#term-${term.termId}`, locale)} className="section-link">
                          {term.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            ))}

            <article className="info-card legal-footer-card">
              <div className="card-kicker">Contact</div>
              <p className="section-description" style={{ marginBottom: 8 }}>
                Legal: <a href={`mailto:${legalContact.legalEmail}`}>{legalContact.legalEmail}</a>
              </p>
              <p className="section-description" style={{ marginBottom: 8 }}>
                {legalContact.dpoName}: <a href={`mailto:${legalContact.dpoEmail}`}>{legalContact.dpoEmail}</a>
              </p>
              <p className="section-description" style={{ marginBottom: 16 }}>{legalContact.postal}</p>

              <div className="card-kicker">Version history</div>
              <div className="support-list" style={{ marginBottom: 16 }}>
                {page.versionHistory.map((entry) => (
                  <div key={entry.version} className="support-item">
                    <span className="support-bullet" />
                    <span>
                      <strong>{entry.version}</strong> · {formatDate(entry.date)} — {entry.summary}
                    </span>
                  </div>
                ))}
              </div>
              <a href={`/legal/${page.slug}/history`} className="button-secondary">
                Download version history (PDF)
              </a>
            </article>
          </div>
        </div>
      </section>
    </StorefrontFrame>
  );
}
