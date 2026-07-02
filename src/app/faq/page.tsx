import Link from 'next/link';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { JsonLdScript } from '@/components/seo/json-ld';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences, getServerTranslations } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import { SITE_NAME, SITE_URL } from '@/lib/site-config';
import { getBoardFaqs, type BoardFaqItem } from '@/lib/storefront-api';

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  const { t } = getServerTranslations(locale);
  return buildMetadata({
    title: t('faqPage.metaTitle'),
    description: t('faqPage.metaDescription'),
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
  const { t } = getServerTranslations(locale);
  const [faqBoard, glossaryBoard] = await Promise.all([
    getBoardFaqs('faq', locale),
    getBoardFaqs('glossary', locale),
  ]);

  const faqItems = mapBoardItems(faqBoard.items);
  const glossaryItems = mapBoardItems(glossaryBoard.items);

  const pageUrl = `${SITE_URL}${withLocalePath('/faq', locale)}`;
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [{ name: t('navigation.home'), path: '/' }, { name: t('faqPage.eyebrow'), path: '/faq' }],
    locale,
  );

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
      eyebrow={t('faqPage.eyebrow')}
      title={t('faqPage.title')}
      description={t('faqPage.description')}
    >
      <JsonLdScript id="faq-breadcrumb-jsonld" data={breadcrumbJsonLd} />
      <JsonLdScript id="faq-jsonld" data={faqJsonLd} />

      <section className="section">
        <div className="section-inner">
          <FaqList faqs={faqItems} generalFaqLabel={t('faqPage.generalFaq')} />
        </div>
      </section>

      {glossaryItems.length ? (
        <section className="section">
          <div className="section-inner">
            <div className="section-header">
              <div>
                <h2 className="section-title">{t('faqPage.glossaryTitle')}</h2>
                <p className="section-description">{t('faqPage.glossaryDesc')}</p>
              </div>
            </div>
            <FaqList faqs={glossaryItems} showTabs={false} generalFaqLabel={t('faqPage.generalFaq')} />
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="section-inner story-grid">
          <article className="story-card story-card-accent">
            <div className="card-kicker">{t('faqPage.stillHaveQuestions')}</div>
            <h2 className="section-title">{t('faqPage.ctaTitle')}</h2>
            <p className="section-description">{t('faqPage.ctaDesc')}</p>
            <div className="trade-empty-actions">
              <Link href={withLocalePath('/contact', locale)} className="button-primary">{t('faqPage.contactSupport')}</Link>
              <Link href={withLocalePath('/faq', locale)} className="button-secondary page-button-secondary-dark">{t('faqPage.browseFaq')}</Link>
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
  generalFaqLabel,
}: {
  faqs: FaqListItem[];
  showTabs?: boolean;
  generalFaqLabel: string;
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
              {cat === 'General' ? generalFaqLabel : cat}
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
