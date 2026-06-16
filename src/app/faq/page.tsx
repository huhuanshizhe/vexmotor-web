import Link from 'next/link';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { JsonLdScript } from '@/components/seo/json-ld';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import { SITE_NAME, SITE_URL } from '@/lib/site-config';
import { getKnowledgeCatalog } from '@/lib/storefront-api';

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
    title: 'FAQ — STEPMOTECH',
    description: 'Frequently asked questions about products, ordering, technical specifications, and industrial motion control sourcing.',
    path: '/faq',
    locale,
  });
}

export default async function FaqPage() {
  const [{ locale }, knowledgeCatalog] = await Promise.all([
    getServerSitePreferences(),
    getKnowledgeCatalog(),
  ]);

  const allFaqs = [
    ...knowledgeCatalog.storefrontFaqs.map((f) => ({ ...f, category: 'General' as const })),
    ...knowledgeCatalog.techFaqEntries.map((f) => ({ id: f.id, question: f.question, answer: f.answer.paragraphs.join(' '), category: f.category })),
  ];

  const pageUrl = `${SITE_URL}${withLocalePath('/faq', locale)}`;
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'FAQ', path: '/faq' }], locale);

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    name: `${SITE_NAME} FAQ`,
    url: pageUrl,
    inLanguage: locale,
    mainEntity: knowledgeCatalog.storefrontFaqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
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
          <FaqTabs faqs={allFaqs} />
        </div>
      </section>

      {knowledgeCatalog.glossaryTerms.length ? (
        <section className="section">
          <div className="section-inner">
            <div className="section-header">
              <div>
                <h2 className="section-title">Related Technical Terms</h2>
                <p className="section-description">Key motion control terminology referenced in the FAQs above.</p>
              </div>
            </div>
            <div className="trust-grid">
              {knowledgeCatalog.glossaryTerms.slice(0, 8).map((term) => (
                <article key={term.id} className="trust-card">
                  <strong>{term.term}</strong>
                  <p className="section-description compact-copy">{term.searchSummary}</p>
                  <Link href={withLocalePath('/glossary', locale)} className="section-link">View in Glossary</Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="section-inner story-grid">
          <article className="story-card story-card-accent">
            <div className="card-kicker">Still have questions?</div>
            <h2 className="section-title">Our engineering team is ready to help.</h2>
            <p className="section-description">Can't find what you're looking for? Contact us directly for personalized support.</p>
            <div className="trade-empty-actions">
              <Link href={withLocalePath('/contact', locale)} className="button-primary">Contact Support</Link>
              <Link href={withLocalePath('/glossary', locale)} className="button-secondary page-button-secondary-dark">View Glossary</Link>
            </div>
          </article>
        </div>
      </section>
    </StorefrontFrame>
  );
}

function FaqTabs({ faqs }: { faqs: Array<{ id: string; question: string; answer: string; category: string }> }) {
  const categories = ['General', 'Stepper', 'BLDC', 'Servo', 'Drivers', 'Wiring', 'Sizing', 'Compliance', 'Shipping'];
  const tabs = categories.filter((cat) => faqs.some((f) => f.category === cat));

  return (
    <div className="faq-tabs-wrapper">
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
      {tabs.map((cat) => {
        const catFaqs = faqs.filter((f) => f.category === cat);
        return (
          <div key={cat} className="info-grid" style={{ marginBottom: 32 }}>
            {catFaqs.map((item) => (
              <article key={item.id} id={`q-${item.id}`} className="info-card">
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>{item.question}</h3>
                <p className="section-description" style={{ margin: 0 }}>{item.answer}</p>
              </article>
            ))}
          </div>
        );
      })}
    </div>
  );
}
