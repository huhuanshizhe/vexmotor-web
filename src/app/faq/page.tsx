import Link from 'next/link';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { JsonLdScript } from '@/components/seo/json-ld';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import { SITE_NAME, SITE_URL } from '@/lib/site-config';
import { getBoardFaqs, type BoardFaqItem } from '@/lib/storefront-api';

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
    title: 'FAQ — STEPMOTECH',
    description: 'Frequently asked questions about products, ordering, technical specifications, and industrial motion control sourcing.',
    path: '/faq',
    locale,
  });
}

type FaqListItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
};

function mapBoardItems(items: BoardFaqItem[]): FaqListItem[] {
  return items.map((item) => ({
    id: item.id,
    question: item.title,
    answer: item.body,
    category: 'General',
  }));
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function buildFaqJsonLdEntity(items: BoardFaqItem[]) {
  return items.map((item) => ({
    '@type': 'Question',
    name: item.title,
    acceptedAnswer: { '@type': 'Answer', text: htmlToPlainText(item.body) },
  }));
}

export default async function FaqPage() {
  const { locale } = await getServerSitePreferences();
  const [faqBoard, glossaryBoard] = await Promise.all([
    getBoardFaqs('faq', locale),
    getBoardFaqs('glossary', locale),
  ]);

  const faqItems = mapBoardItems(faqBoard.items);
  const glossaryItems = mapBoardItems(glossaryBoard.items);

  const pageUrl = `${SITE_URL}${withLocalePath('/faq', locale)}`;
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'FAQ', path: '/faq' }], locale);

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    name: `${SITE_NAME} FAQ`,
    url: pageUrl,
    inLanguage: locale,
    mainEntity: [
      ...buildFaqJsonLdEntity(faqBoard.items),
      ...buildFaqJsonLdEntity(glossaryBoard.items),
    ],
  };

  return (
    <StorefrontFrame
      eyebrow="Support"
      title="Frequently Asked Questions"
      description="Find answers about ordering, technical specs, lead times, and industrial motion control sourcing."
    >
      <JsonLdScript id="faq-breadcrumb-jsonld" data={breadcrumbJsonLd} />
      <JsonLdScript id="faq-jsonld" data={faqJsonLd} />

      <section className="section">
        <div className="section-inner">
          <FaqList faqs={faqItems} />
        </div>
      </section>

      {glossaryItems.length ? (
        <section className="section">
          <div className="section-inner">
            <div className="section-header">
              <div>
                <h2 className="section-title">Technical Terms Explained</h2>
                <p className="section-description">Motion control terminology referenced across the catalog and support content.</p>
              </div>
            </div>
            <FaqList faqs={glossaryItems} showTabs={false} />
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="section-inner story-grid">
          <article className="story-card story-card-accent">
            <div className="card-kicker">Still have questions?</div>
            <h2 className="section-title">Our engineering team is ready to help.</h2>
            <p className="section-description">Can&apos;t find what you&apos;re looking for? Contact us directly for personalized support.</p>
            <div className="trade-empty-actions">
              <Link href={withLocalePath('/contact', locale)} className="button-primary">Contact Support</Link>
              <Link href={withLocalePath('/faq', locale)} className="button-secondary page-button-secondary-dark">Browse FAQ</Link>
            </div>
          </article>
        </div>
      </section>
    </StorefrontFrame>
  );
}

function FaqList({
  faqs,
  showTabs = true,
}: {
  faqs: FaqListItem[];
  showTabs?: boolean;
}) {
  const categories = ['General', 'Stepper', 'BLDC', 'Servo', 'Drivers', 'Wiring', 'Sizing', 'Compliance', 'Shipping'];
  const tabs = categories.filter((cat) => faqs.some((f) => f.category === cat));
  const shouldShowTabs = showTabs && tabs.length > 1;

  return (
    <div className="faq-tabs-wrapper">
      {shouldShowTabs ? (
        <div className="detail-tab-nav" role="tablist" style={{ position: 'static', marginBottom: 24 }}>
          {tabs.map((cat) => (
            <button
              key={cat}
              type="button"
              className="tab-button active"
              role="tab"
              aria-selected={cat === 'General'}
              style={{ cursor: 'default' }}
            >
              {cat === 'General' ? 'General FAQ' : cat}
            </button>
          ))}
        </div>
      ) : null}
      {(shouldShowTabs ? tabs : ['General']).map((cat) => {
        const catFaqs = shouldShowTabs ? faqs.filter((f) => f.category === cat) : faqs;
        if (!catFaqs.length) return null;

        return (
          <div key={cat} className="info-grid" style={{ marginBottom: shouldShowTabs ? 32 : 0 }}>
            {catFaqs.map((item) => (
              <article key={item.id} id={`q-${item.id}`} className="info-card">
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>{item.question}</h3>
                <div
                  className="section-description faq-body"
                  style={{ margin: 0 }}
                  dangerouslySetInnerHTML={{ __html: item.answer }}
                />
              </article>
            ))}
          </div>
        );
      })}
    </div>
  );
}
