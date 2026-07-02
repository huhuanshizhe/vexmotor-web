import Link from 'next/link';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { JsonLdScript } from '@/components/seo/json-ld';
import { type Locale, withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import { footerContactBlocks } from '@/lib/site-shell';
import { getProductList } from '@/lib/storefront-api';

const repairPolicy = [
  'Open after-sales support when the issue involves troubleshooting, replacement parts, tuning, or a field failure that cannot be resolved from the product page alone.',
  'Include the SKU, order number, wiring conditions, controller or driver settings, and photo or video evidence so support can triage the case in one pass.',
  'Use the same intake path for repair guidance, replacement-part confirmation, and advice on whether a problem should move into return, warranty, or redesign review.',
];

const sla = [
  { title: 'First reply', value: '<= 4h', note: 'Business hours target for technical and order-linked after-sales requests.' },
  { title: 'Initial diagnosis', value: '1 business day', note: 'Target for confirming whether the issue is setup, compatibility, logistics, or hardware-related.' },
  { title: 'Replacement plan', value: '48h', note: 'Target to confirm spare-part path, substitute SKU, or RMA direction once the evidence set is complete.' },
];

const knowledgeBaseLinks = [
  { label: 'Help Center', href: '/support', note: 'Start from the broader support hub when the issue category is still unclear.' },
  { label: 'Shipping & Customs', href: '/support/shipping', note: 'Use when the question is really transit timing, DDP handling, or delivery routing.' },
  { label: 'Returns & Warranty', href: '/support/returns', note: 'Use this when the case is moving toward an approved return instead of troubleshooting.' },
  { label: 'Selector Tool', href: '/selector', note: 'Use selector when the root problem is sizing or product mismatch rather than a field failure.' },
];

const faq = [
  {
    question: 'What should I send with an after-sales request?',
    answer: 'Send the SKU, order reference, issue summary, current setup details, and clear photo or video evidence so the support team can separate setup issues from hardware faults quickly.',
  },
  {
    question: 'How do I order a replacement driver, gearbox, or power supply?',
    answer: 'Use the spare-parts cards on this page for direct product routing, or move to contact support when you need confirmation on compatibility before ordering.',
  },
  {
    question: 'When should I use after-sales instead of returns?',
    answer: 'Use after-sales first when the issue still needs diagnosis or matched-part confirmation. Move to returns once the case has clearly become an approved return or refund workflow.',
  },
];

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
  title: 'After-sales Support — STEPMOTECH',
  description: 'Engineering support, repair guidance, spare-part ordering, software access routes, and response targets for post-purchase motion-control support.',
  path: '/support/after-sales',
    locale,
  });
}

function supportLink(href: string, locale: Locale, className: string, label: string) {
  if (href.startsWith('mailto:') || href.startsWith('tel:')) {
    return (
      <a href={href} className={className}>
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

export default async function AfterSalesPage() {
  const { locale } = await getServerSitePreferences();
  const listing = await getProductList({ pageSize: 24, sort: 'featured' });
  const phoneBlock = footerContactBlocks.find((block) => block.title === 'Phone');
  const emailBlock = footerContactBlocks.find((block) => block.title === 'Email');

  const engineeringChannels = [
    {
      title: 'Global support line',
      value: phoneBlock?.lines[1] ?? 'Global Support: +1-518-722-7315',
      note: 'Best for urgent order-linked troubleshooting during business hours.',
      href: 'tel:+15187227315',
    },
    {
      title: 'WhatsApp engineering',
      value: phoneBlock?.lines[0] ?? 'WhatsApp: +86-19952400441',
      note: 'Use this channel when photos, videos, and live setup checks matter more than a long email thread.',
      href: 'tel:+8619952400441',
    },
    {
      title: 'Service email',
      value: emailBlock?.lines[0] ?? 'support@stepmotech.online',
      note: 'Best for RMA evidence, spare-part lists, and documents that should stay attached to the case.',
      href: 'mailto:support@stepmotech.online?subject=After-sales%20support',
    },
    {
      title: 'Engineering review request',
      value: 'Request a guided troubleshooting slot',
      note: 'Use the contact desk when the case needs a structured handoff instead of one-off article reading.',
      href: '/support/contact?topic=technical',
    },
  ];

  const spareParts = listing.items.slice(0, 3);
  const softwarePacks = listing.items.slice(3, 6);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { name: 'Home', path: '/' },
      { name: 'Support', path: '/support' },
      { name: 'After-sales Support', path: '/support/after-sales' },
    ],
    locale,
  );
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
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
      title="After-sales support for troubleshooting, spare parts, and replacement-path decisions."
      description="Use this desk when the order is already placed and the next step is diagnosis, matched replacement, tuning guidance, or a repair-versus-return decision."
      actions={
        <>
          <Link href={withLocalePath('/support/contact?topic=technical', locale)} className="button-primary">
            Contact Support
          </Link>
          <Link href={withLocalePath('/support', locale)} className="button-secondary page-button-secondary-dark">
            Help Center
          </Link>
        </>
      }
    >
      <JsonLdScript id="after-sales-breadcrumb-jsonld" data={breadcrumbJsonLd} />
      <JsonLdScript id="after-sales-faq-jsonld" data={faqJsonLd} />

      <section className="section">
        <div className="section-inner after-sales-channel-grid">
          {engineeringChannels.map((channel) => (
            <article key={channel.title} className="info-card after-sales-card">
              <div className="card-kicker">Support channel</div>
              <h2 className="cart-section-title">{channel.title}</h2>
              <strong>{channel.value}</strong>
              <p className="section-description compact-copy">{channel.note}</p>
              {supportLink(channel.href, locale, 'section-link', channel.href.startsWith('/contact') ? 'Open support desk' : 'Use this channel')}
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-inner after-sales-grid">
          <article className="info-card after-sales-card">
            <div className="card-kicker">Repair and replacement policy</div>
            <h2 className="cart-section-title">What belongs in after-sales</h2>
            <div className="support-list">
              {repairPolicy.map((item) => (
                <div key={item} className="support-item">
                  <span className="support-bullet" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="info-card after-sales-card">
            <div className="card-kicker">SLA</div>
            <h2 className="cart-section-title">Response targets</h2>
            <div className="after-sales-sla-grid">
              {sla.map((item) => (
                <div key={item.title} className="summary-stat">
                  <span className="summary-label">{item.title}</span>
                  <strong>{item.value}</strong>
                  <span className="section-description compact-copy">{item.note}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="section-inner after-sales-grid">
          <article className="info-card after-sales-card">
            <div className="section-header trade-card-header">
              <div>
                <div className="card-kicker">Spare parts</div>
                <h2 className="cart-section-title">Direct product routes for common replacement items</h2>
                <p className="section-description">Use product pages when you already know the replacement family. Use contact support when compatibility still needs confirmation.</p>
              </div>
            </div>

            <div className="after-sales-resource-grid">
              {spareParts.map((product) => (
                <Link key={product.id} href={withLocalePath(`/products/${product.slug}`, locale)} className="summary-stat">
                  <span className="summary-label">{product.spu}</span>
                  <strong>{product.name}</strong>
                  <span className="section-description compact-copy">{product.shortDescription}</span>
                </Link>
              ))}
            </div>
          </article>

          <article className="info-card after-sales-card">
            <div className="section-header trade-card-header">
              <div>
                <div className="card-kicker">Software and firmware</div>
                <h2 className="cart-section-title">Driver setup and commissioning paths</h2>
                <p className="section-description">Open the matched product route first for specifications and documentation, then escalate to support if the issue depends on a live installation or field symptom.</p>
              </div>
            </div>

            <div className="after-sales-resource-grid">
              {softwarePacks.map((product) => (
                <Link key={product.id} href={withLocalePath(`/products/${product.slug}`, locale)} className="summary-stat">
                  <span className="summary-label">Download path</span>
                  <strong>{product.spu}</strong>
                  <span className="section-description compact-copy">{product.name}</span>
                </Link>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="section-inner after-sales-grid">
          <article className="info-card after-sales-card">
            <div className="card-kicker">Knowledge base</div>
            <h2 className="cart-section-title">Use the right support surface</h2>
            <div className="after-sales-resource-grid">
              {knowledgeBaseLinks.map((item) => (
                <Link key={item.label} href={withLocalePath(item.href, locale)} className="summary-stat">
                  <span className="summary-label">Reference</span>
                  <strong>{item.label}</strong>
                  <span className="section-description compact-copy">{item.note}</span>
                </Link>
              ))}
            </div>
          </article>

          <article className="info-card after-sales-card">
            <div className="card-kicker">FAQ</div>
            <h2 className="cart-section-title">Common after-sales questions</h2>
            <div className="custom-faq-grid">
              {faq.map((item) => (
                <article key={item.question} className="custom-faq-card">
                  <strong>{item.question}</strong>
                  <p className="section-description compact-copy">{item.answer}</p>
                </article>
              ))}
            </div>
          </article>
        </div>
      </section>
    </StorefrontFrame>
  );
}