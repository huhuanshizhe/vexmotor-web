import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { JsonLdScript } from '@/components/seo/json-ld';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import { SITE_NAME, SITE_URL } from '@/lib/site-config';
import { getCmsPageByLegacySlug } from '@/lib/storefront-api';

function decodeHtmlEntities(input: string) {
  return input
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function sanitizeLegacyBody(content: string | null | undefined) {
  if (!content) {
    return '';
  }

  const withoutExecutableBlocks = content
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--([\s\S]*?)-->/g, ' ');

  const asPlainText = decodeHtmlEntities(withoutExecutableBlocks)
    .replace(/<[^>]+>/g, ' ')
    .replace(/[\t\r\n]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const looksLikeTrackingPayload = /window\.datalayer|gtag\(|document\.addeventlistener|wpcf7-response-output|send_to\s*:/i.test(asPlainText);
  if (looksLikeTrackingPayload) {
    return '';
  }

  return asPlainText;
}

function pickReadableLegacyContent(content: string | null | undefined, summary: string | null | undefined) {
  const cleanContent = sanitizeLegacyBody(content);
  if (cleanContent.length >= 80) {
    return cleanContent;
  }

  const cleanSummary = sanitizeLegacyBody(summary);
  if (cleanSummary.length) {
    return cleanSummary;
  }

  return cleanContent;
}

export async function generateMetadata({ params }: { params: Promise<{ legacySlug: string }> }): Promise<Metadata> {
  const { legacySlug } = await params;
  const { locale } = await getServerSitePreferences();
  const page = await getCmsPageByLegacySlug(legacySlug, locale);

  if (!page) {
    return buildMetadata({
      title: 'Content page not found — STEPMOTECH',
      path: '/content',
      locale,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? page.summary ?? `Imported legacy content page: ${page.title}`,
    path: `/content/${legacySlug}`,
    locale,
    type: 'website',
  });
}

export default async function LegacyContentPage({ params }: { params: Promise<{ legacySlug: string }> }) {
  const { legacySlug } = await params;
  const { locale } = await getServerSitePreferences();
  const page = await getCmsPageByLegacySlug(legacySlug, locale);

  if (!page) {
    notFound();
  }

  const pagePath = withLocalePath(`/content/${legacySlug}`, locale);
  const pageUrl = `${SITE_URL}${pagePath}`;
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { name: 'Home', path: '/' },
      { name: 'Content', path: '/resources' },
      { name: page.title, path: `/content/${legacySlug}` },
    ],
    locale,
  );
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: page.title,
    description: page.seoDescription ?? page.summary ?? page.title,
    url: pageUrl,
    inLanguage: locale,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    datePublished: page.publishedAt ?? undefined,
  };

  const contentText = pickReadableLegacyContent(page.content, page.summary);

  return (
    <StorefrontFrame
      eyebrow="Imported Content"
      title={page.title}
      description={page.summary ?? 'Legacy content migrated from the previous storefront and available for continuous SEO routing.'}
      actions={
        <>
          <Link href={withLocalePath('/products', locale)} className="button-primary">
            Browse Catalog
          </Link>
          <Link href={withLocalePath('/contact', locale)} className="button-secondary page-button-secondary-dark">
            Contact Support
          </Link>
        </>
      }
    >
      <JsonLdScript id="legacy-content-breadcrumb-jsonld" data={breadcrumbJsonLd} />
      <JsonLdScript id="legacy-content-article-jsonld" data={articleJsonLd} />

      <section className="section">
        <div className="section-inner">
          <article className="info-card" style={{ display: 'grid', gap: 14 }}>
            <div className="card-kicker">Legacy URL</div>
            <p className="section-description" style={{ margin: 0 }}>{pagePath}</p>
            <div className="card-kicker">Migrated body</div>
            <p className="section-description" style={{ margin: 0, whiteSpace: 'pre-line' }}>
              {contentText || 'No body content was available in the source page. Summary and SEO metadata were preserved.'}
            </p>
          </article>
        </div>
      </section>
    </StorefrontFrame>
  );
}
