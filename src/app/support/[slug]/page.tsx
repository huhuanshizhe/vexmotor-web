import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { JsonLdScript } from '@/components/seo/json-ld';
import { SupportArticleFeedback } from '@/components/storefront/support-article-feedback';
import type { Locale } from '@/lib/i18n';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import { getSupportCatalog, getSupportPageBySlug } from '@/lib/storefront-api';

function sectionAnchor(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function renderAction(href: string, label: string, className: string, locale: Locale, external?: boolean) {
  if (external) {
    return (
      <a href={href} className={className} target="_blank" rel="noreferrer">
        {label}
      </a>
    );
  }

  return (
    <Link href={withLocalePath(href, locale)} className={className}>
      {label}
    </Link>
  );
}

export async function generateStaticParams() {
  try {
    const supportCatalog = await getSupportCatalog();
    return supportCatalog.pages.map((page) => ({ slug: page.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await getServerSitePreferences();
  const page = await getSupportPageBySlug(slug);

  if (!page) {
    return buildMetadata({
      title: 'Support — STEPMOTECH',
      path: '/support',
      locale,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: `${page.title} — STEPMOTECH`,
    description: page.description,
    path: `/support/${slug}`,
    locale,
  });
}

export default async function SupportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ feedback?: string }>;
}) {
  const [{ slug }, { feedback }] = await Promise.all([params, searchParams]);
  const { locale } = await getServerSitePreferences();
  const page = await getSupportPageBySlug(slug);
  const vote = feedback === 'yes' || feedback === 'no' ? feedback : null;

  if (!page) {
    notFound();
  }

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { name: 'Home', path: '/' },
      { name: 'Support', path: '/support' },
      { name: page.title, path: `/support/${page.slug}` },
    ],
    locale,
  );

  return (
    <StorefrontFrame
      eyebrow={page.eyebrow}
      title={page.title}
      description={page.description}
      actions={
        <>
          {page.primaryAction
            ? renderAction(page.primaryAction.href, page.primaryAction.label, 'button-primary', locale, page.primaryAction.external)
            : renderAction('/contact', 'Contact Support', 'button-primary', locale)}
          {page.secondaryAction
            ? renderAction(page.secondaryAction.href, page.secondaryAction.label, 'button-secondary page-button-secondary-dark', locale, page.secondaryAction.external)
            : renderAction('/products', 'Browse Products', 'button-secondary page-button-secondary-dark', locale)}
        </>
      }
    >
      <JsonLdScript id="support-breadcrumb-jsonld" data={breadcrumbJsonLd} />

      <section className="section">
        <div className="section-inner support-article-layout">
          <aside className="trade-side-stack">
            <article className="info-card detail-subnav support-article-toc">
              <div className="card-kicker">On this page</div>
              <div className="inline-link-list">
                {page.sections.map((section) => (
                  <a key={section.title} href={`#${sectionAnchor(section.title)}`} className="section-link">
                    {section.title}
                  </a>
                ))}
              </div>
            </article>

            <article className="info-card">
              <div className="card-kicker">Need more help?</div>
              <div className="trade-empty-actions">
                {renderAction('/support', 'Help Center', 'button-secondary', locale)}
                {renderAction('/support/contact', 'Contact Support', 'button-primary', locale)}
              </div>
            </article>
          </aside>

          <div className="support-article-stack">
            {page.sections.map((section) => (
              <article key={section.title} id={sectionAnchor(section.title)} className="info-card support-article-card">
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
              </article>
            ))}

            <SupportArticleFeedback articleTitle={page.title} articlePath={withLocalePath(`/support/${page.slug}`, locale)} vote={vote} />
          </div>
        </div>
      </section>
    </StorefrontFrame>
  );
}