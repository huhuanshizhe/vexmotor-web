import Link from 'next/link';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { JsonLdScript } from '@/components/seo/json-ld';
import { SupportContactClient } from '@/components/storefront/support-contact-client';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import { footerContactBlocks } from '@/lib/site-shell';
import { getProductList } from '@/lib/storefront-api';

const workingHours = [
  'Mon - Fri: 09:00 - 18:00 Hong Kong Time (HKT)',
  'Urgent engineering and logistics issues are triaged during overlapping EU and US business hours.',
  'First reply target: <= 4 business hours for routed support topics.',
];

const supportEscalationPaths = [
  { label: 'Help Center', href: '/support', note: 'Use when the case may still belong to an existing article or grouped support page.' },
  { label: 'After-sales Support', href: '/support/after-sales', note: 'Use after-sales when the issue is already tied to troubleshooting, replacement, or service follow-up.' },
  { label: 'Selector Tool', href: '/selector', note: 'Use selector before opening a technical ticket if the root issue is sizing or product mismatch.' },
] as const;

function topicFromSearchParam(value?: string) {
  if (value === 'technical' || value === 'sales' || value === 'order-issue' || value === 'logistics' || value === 'press' || value === 'partnership') {
    return value;
  }

  return undefined;
}

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
  title: 'Contact Support — STEPMOTECH',
  description: 'Support contact desk for sales, technical issues, order exceptions, logistics, press, and partnership requests with immediate ticket creation.',
  path: '/support/contact',
    locale,
  });
}

export default async function SupportContactPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const [{ topic }, { locale }, listing] = await Promise.all([searchParams, getServerSitePreferences(), getProductList({ purchaseMode: 'buy', pageSize: 1, sort: 'featured' })]);
  const intakeProduct = listing.items[0] ?? null;

  if (!intakeProduct) {
    return null;
  }

  const officeBlocks = footerContactBlocks.filter((block) => block.title.includes('Center'));
  const phoneBlock = footerContactBlocks.find((block) => block.title === 'Phone');
  const emailBlock = footerContactBlocks.find((block) => block.title === 'Email');
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { name: 'Home', path: '/' },
      { name: 'Support', path: '/support' },
      { name: 'Contact Support', path: '/support/contact' },
    ],
    locale,
  );
  const localBusinessJsonLd = officeBlocks.map((block) => ({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `STEPMOTECH ${block.title}`,
    address: block.lines[0],
    telephone: phoneBlock?.lines[1]?.replace('Global Support: ', '') ?? '+1-518-722-7315',
    email: emailBlock?.lines[0] ?? 'support@stepmotech.online',
  }));

  return (
    <StorefrontFrame
      eyebrow="Support"
      title="Contact the right support desk without guessing which queue should own the case."
      description="Open a structured support ticket for sales, technical, order, logistics, press, or partnership topics and get a case reference immediately."
      actions={
        <>
          <a href="tel:+15187227315" className="button-primary">
            Call Global Support
          </a>
          <Link href={withLocalePath('/support', locale)} className="button-secondary page-button-secondary-dark">
            Help Center
          </Link>
        </>
      }
    >
      <JsonLdScript id="support-contact-breadcrumb-jsonld" data={breadcrumbJsonLd} />
      {localBusinessJsonLd.map((item, index) => (
        <JsonLdScript key={index} id={`support-contact-localbusiness-${index}`} data={item} />
      ))}

      <section className="section">
        <div className="section-inner support-contact-layout">
          <SupportContactClient locale={locale} intakeProductId={intakeProduct.id} initialTopic={topicFromSearchParam(topic)} />

          <div className="trade-side-stack">
            <article className="info-card">
              <div className="card-kicker">Direct info</div>
              <h2 className="cart-section-title">Phone, email, and working window</h2>
              <div className="support-list">
                {phoneBlock?.lines.map((line) => (
                  <div key={line} className="support-item">
                    <span className="support-bullet" />
                    <span>{line}</span>
                  </div>
                ))}
                {emailBlock?.lines.map((line) => (
                  <div key={line} className="support-item">
                    <span className="support-bullet" />
                    <span>{line}</span>
                  </div>
                ))}
                {workingHours.map((line) => (
                  <div key={line} className="support-item">
                    <span className="support-bullet" />
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="info-card">
              <div className="card-kicker">Offices</div>
              <h2 className="cart-section-title">Support footprint</h2>
              <div className="support-contact-info-grid">
                {officeBlocks.map((block) => (
                  <article key={block.title} className="summary-stat">
                    <span className="summary-label">{block.title}</span>
                    <strong>{block.lines[0]}</strong>
                  </article>
                ))}
              </div>
            </article>

            <article className="info-card">
              <div className="card-kicker">Escalation paths</div>
              <h2 className="cart-section-title">Use a more specific path when possible</h2>
              <div className="support-contact-info-grid">
                {supportEscalationPaths.map((item) => (
                  <Link key={item.label} href={withLocalePath(item.href, locale)} className="summary-stat">
                    <span className="summary-label">Recommended</span>
                    <strong>{item.label}</strong>
                    <span className="section-description compact-copy">{item.note}</span>
                  </Link>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>
    </StorefrontFrame>
  );
}