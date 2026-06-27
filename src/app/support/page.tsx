import Link from 'next/link';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { JsonLdScript } from '@/components/seo/json-ld';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import { SITE_NAME, SITE_URL } from '@/lib/site-config';
import { getSupportCatalog } from '@/lib/storefront-api';

const helpCenterGroups = [
  {
    id: 'ordering',
    title: 'Ordering',
    description: 'Catalog browsing, quote routing, sample requests, and the first decision on whether demand should go to checkout or RFQ.',
    links: [
      { label: 'Browse Catalog', href: '/products', note: 'Start from stocked families before narrowing into a SKU.' },
      { label: 'Request for Quote', href: '/quote', note: 'Best when the demand spans multiple parts or needs engineering review.' },
      { label: 'Request Samples', href: '/sample', note: 'Use the sample workflow when validation hardware is needed before a larger buy.' },
      { label: 'Volume Pricing', href: '/volume-pricing', note: 'Move here when demand is annual or multi-release instead of one-off.' },
    ],
  },
  {
    id: 'payment',
    title: 'Payment',
    description: 'Online payment methods, offline bank-transfer paths, and commercial questions that usually come up before PO release.',
    links: [
      { label: 'Payment Methods', href: '/support/payment-methods', note: 'Cards, wallets, and offline transfer guidance.' },
      { label: 'Contract Pricing Intake', href: '/volume-pricing', note: 'Use this when payment-term review and annual pricing belong in the same discussion.' },
      { label: 'Contact Support', href: '/contact', note: 'Use contact when the commercial question is broader than a support article.' },
    ],
  },
  {
    id: 'shipping-customs',
    title: 'Shipping & Customs',
    description: 'Delivery methods, DDP handling, customs responsibility, and the support path for routing or tracking issues.',
    links: [
      { label: 'Shipping & Customs', href: '/support/shipping', note: 'Start here for lane overview, customs handling, and the shared estimator.' },
      { label: 'Clearance & Duty', href: '/support/clearance-duty', note: 'When StepMotech covers import cost and when the customer remains responsible.' },
      { label: 'Free Shipping', href: '/support/free-shipping', note: 'Threshold-driven promotion details and qualification notes.' },
    ],
  },
  {
    id: 'returns',
    title: 'Returns',
    description: 'Return-window rules, refund timing, evidence requirements, and the practical next step when a shipment arrives wrong or damaged.',
    links: [
      { label: 'Returns & Warranty', href: '/support/returns', note: 'The main return and warranty page with timing, exclusions, and RMA handoff.' },
      { label: 'Contact Support', href: '/contact', note: 'Use direct support when the return needs immediate case handling.' },
    ],
  },
  {
    id: 'warranty',
    title: 'Warranty',
    description: 'Coverage, exclusions, repair handling, and the line between standard support and chargeable service work.',
    links: [
      { label: 'Terms of Sale & Use', href: '/legal/terms', note: 'Trading terms, payment, warranty, and liability now live in the legal section.' },
      { label: 'After-sales Support', href: '/support/after-sales', note: 'Use this when the issue is already post-purchase and needs troubleshooting or matched replacements.' },
      { label: 'Certifications', href: '/company/certifications', note: 'Useful when warranty discussions also need compliance documents.' },
      { label: 'Custom Development', href: '/custom', note: 'Use this when the replacement path has already become a redesign path.' },
    ],
  },
  {
    id: 'account',
    title: 'Account',
    description: 'Login, register, inquiry tracking, and the self-service paths that sit alongside the support content itself.',
    links: [
      { label: 'Login', href: '/login', note: 'Use account access for order and inquiry history.' },
      { label: 'Create Business Account', href: '/register', note: 'Register for business buying, saved addresses, and account workflows.' },
      { label: 'My Inquiries', href: '/account/inquiries', note: 'Track submitted inquiry and RFQ records after login.' },
    ],
  },
] as const;

const popularArticleSlugs = ['shipping-policy', 'returns', 'payment-methods', 'clearance-duty', 'terms-and-conditions', 'free-shipping'];

const faq = [
  {
    question: 'Where should I start if I do not know whether to buy direct or submit RFQ?',
    answer: 'Start with Ordering. It routes you into catalog, sample, quote, or contact depending on whether the demand is stocked, mixed, or engineering-led.',
  },
  {
    question: 'Which article should I read first for shipping cost and customs questions?',
    answer: 'Start with Shipping & Customs for the lane overview and estimator, then open Clearance & Duty if you still need to confirm who pays import cost on the chosen lane.',
  },
  {
    question: 'When should I stop reading support content and contact the team directly?',
    answer: 'Move to Contact when the issue is tied to a live order, a mixed-part RFQ, a customs exception, or a return case that needs immediate handling.',
  },
];

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();

  return buildMetadata({
    title: 'Help Center — STEPMOTECH',
    description: 'Support hub for ordering, payment, shipping, returns, warranty, and account questions, with direct routes into the most relevant support articles.',
    path: '/support',
    locale,
  });
}

export default async function HelpCenterPage() {
  const [{ locale }, supportCatalog] = await Promise.all([getServerSitePreferences(), getSupportCatalog()]);
  const popularArticles = supportCatalog.pages.filter((page) => popularArticleSlugs.includes(page.slug));
  const pageUrl = `${SITE_URL}${withLocalePath('/support', locale)}`;
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { name: 'Home', path: '/' },
      { name: 'Help Center', path: '/support' },
    ],
    locale,
  );
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${SITE_NAME} Help Center`,
    description: 'Support landing page for ordering, payment, shipping, returns, warranty, and account topics.',
    url: pageUrl,
    inLanguage: locale,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntity: popularArticles.map((article) => ({
      '@type': 'Article',
      headline: article.title,
      description: article.description,
      url: `${SITE_URL}${withLocalePath(`/support/${article.slug}`, locale)}`,
    })),
  };
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    name: `${SITE_NAME} Help Center FAQ`,
    url: pageUrl,
    inLanguage: locale,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <StorefrontFrame
      eyebrow="Support"
      title="Help Center"
      description="Search the main support paths first, then drop into the right article, RFQ workflow, or contact handoff without guessing where the question belongs."
      actions={
        <form action={withLocalePath('/search', locale)} className="search-inline-form">
          <input name="q" className="newsletter-input" placeholder="Search shipping, returns, payment, account..." aria-label="Search help articles" />
          <button type="submit" className="button-primary">
            Search Help
          </button>
        </form>
      }
    >
      <JsonLdScript id="help-center-breadcrumb-jsonld" data={breadcrumbJsonLd} />
      <JsonLdScript id="help-center-collection-jsonld" data={collectionJsonLd} />
      <JsonLdScript id="help-center-faq-jsonld" data={faqJsonLd} />

      <section className="section">
        <div className="section-inner help-center-card-grid">
          {helpCenterGroups.map((group) => (
            <a key={group.id} href={`#${group.id}`} className="info-card help-center-card">
              <div className="card-kicker">Category</div>
              <h2 className="cart-section-title">{group.title}</h2>
              <p className="section-description compact-copy">{group.description}</p>
              <span className="filter-chip">{group.links.length} linked paths</span>
            </a>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-inner help-center-layout">
          <div className="help-center-main">
            {helpCenterGroups.map((group) => (
              <article key={group.id} id={group.id} className="info-card help-center-group-card">
                <div className="section-header trade-card-header">
                  <div>
                    <div className="card-kicker">Grouped links</div>
                    <h2 className="cart-section-title">{group.title}</h2>
                    <p className="section-description">{group.description}</p>
                  </div>
                </div>

                <div className="help-center-link-grid">
                  {group.links.map((item) => (
                    <Link key={`${group.id}-${item.label}`} href={withLocalePath(item.href, locale)} className="summary-stat">
                      <span className="summary-label">Path</span>
                      <strong>{item.label}</strong>
                      <span className="section-description compact-copy">{item.note}</span>
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <aside className="trade-side-stack">
            <article className="info-card">
              <div className="card-kicker">Popular articles</div>
              <h2 className="cart-section-title">Frequently opened support pages</h2>
              <div className="inline-link-list">
                {popularArticles.map((article) => (
                  <Link key={article.slug} href={withLocalePath(`/support/${article.slug}`, locale)} className="section-link">
                    {article.title}
                  </Link>
                ))}
              </div>
            </article>

            <article className="info-card">
              <div className="card-kicker">Still need help?</div>
              <h2 className="cart-section-title">Move to direct support</h2>
              <p className="section-description">Use contact support for live order issues, mixed-part RFQs, return cases, or any question that needs a human handoff instead of another article.</p>
              <div className="trade-empty-actions">
                <Link href={withLocalePath('/support/contact', locale)} className="button-primary">
                  Contact Support
                </Link>
                <Link href={withLocalePath('/quote', locale)} className="button-secondary">
                  Open RFQ
                </Link>
              </div>
            </article>

            <article className="info-card">
              <div className="card-kicker">FAQ</div>
              <h2 className="cart-section-title">Start here</h2>
              <div className="custom-faq-grid">
                {faq.map((item) => (
                  <article key={item.question} className="custom-faq-card">
                    <strong>{item.question}</strong>
                    <p className="section-description compact-copy">{item.answer}</p>
                  </article>
                ))}
              </div>
            </article>
          </aside>
        </div>
      </section>
    </StorefrontFrame>
  );
}