import Link from 'next/link';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { JsonLdScript } from '@/components/seo/json-ld';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import { footerContactBlocks } from '@/lib/site-shell';

const workingHours = [
  'Mon - Fri: 09:00 - 18:00 Hong Kong Time (HKT)',
  'EU and US overlap windows are used for urgent logistics and engineering coordination.',
  'Emergency line-down issues should go to the global support line or WhatsApp intake first.',
] as const;

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
  title: 'Global Offices & Warehouses — STEPMOTECH',
  description: 'Office, warehouse, phone, email, and operating-center details for global support, engineering coordination, and sales routing.',
  path: '/company/offices',
    locale,
  });
}

export default async function CompanyOfficesPage() {
  const { locale } = await getServerSitePreferences();
  const officeBlocks = footerContactBlocks.filter((block) => block.title.includes('Center'));
  const phoneBlock = footerContactBlocks.find((block) => block.title === 'Phone');
  const emailBlock = footerContactBlocks.find((block) => block.title === 'Email');
  const emergencySupport = phoneBlock?.lines[1] ?? 'Global Support: +1-518-722-7315';
  const whatsappSupport = phoneBlock?.lines[0] ?? 'WhatsApp: +86-19952400441';
  const supportEmail = emailBlock?.lines[0] ?? 'support@stepmotech.online';

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { name: 'Home', path: '/' },
      { name: 'About', path: '/company/about' },
      { name: 'Offices', path: '/company/offices' },
    ],
    locale,
  );
  const localBusinessJsonLd = officeBlocks.map((block) => ({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `STEPMOTECH ${block.title}`,
    address: block.lines[0],
    telephone: emergencySupport.replace('Global Support: ', ''),
    email: supportEmail,
  }));

  return (
    <StorefrontFrame
      eyebrow="Company"
      title="Global offices and warehouse contact points behind the storefront support flow."
      description="Use this page when you need the operating centers, warehouse addresses, direct lines, and support routing context that sit behind the public commerce site."
      actions={
        <>
          <Link href={withLocalePath('/support/contact', locale)} className="button-primary">
            Contact Support
          </Link>
          <Link href={withLocalePath('/company/about', locale)} className="button-secondary page-button-secondary-dark">
            About STEPMOTECH
          </Link>
        </>
      }
    >
      <JsonLdScript id="company-offices-breadcrumb-jsonld" data={breadcrumbJsonLd} />
      {localBusinessJsonLd.map((item, index) => (
        <JsonLdScript key={index} id={`company-offices-localbusiness-${index}`} data={item} />
      ))}

      <section className="section">
        <div className="section-inner shipping-overview-grid">
          <article className="summary-stat">
            <span className="summary-label">Emergency engineering support</span>
            <strong>{emergencySupport}</strong>
            <span className="section-description compact-copy">Use the global support line first when a line-down issue needs immediate routing.</span>
          </article>
          <article className="summary-stat">
            <span className="summary-label">WhatsApp intake</span>
            <strong>{whatsappSupport}</strong>
            <span className="section-description compact-copy">Best for photo, video, and fast engineering context exchange during installation or service review.</span>
          </article>
          <article className="summary-stat">
            <span className="summary-label">Support email</span>
            <strong>{supportEmail}</strong>
            <span className="section-description compact-copy">Use email for structured files, RMA evidence, and support records that need a threaded handoff.</span>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="section-inner offices-grid">
          {officeBlocks.map((block) => (
            <article key={block.title} className="info-card office-card">
              <div>
                <div className="card-kicker">Office / Warehouse</div>
                <h2 className="cart-section-title">{block.title}</h2>
              </div>

              <div className="support-list">
                <div className="support-item">
                  <span className="support-bullet" />
                  <span>{block.lines[0]}</span>
                </div>
                <div className="support-item">
                  <span className="support-bullet" />
                  <span>{emergencySupport}</span>
                </div>
                <div className="support-item">
                  <span className="support-bullet" />
                  <span>{supportEmail}</span>
                </div>
              </div>

              <div className="support-list">
                {workingHours.map((item) => (
                  <div key={item} className="support-item">
                    <span className="support-bullet" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="office-map-placeholder">
                <span className="summary-label">Map placeholder</span>
                <strong>{block.title}</strong>
                <span className="section-description compact-copy">Static map slot for office wayfinding. This can be replaced later with a real embed without changing the page layout.</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-inner trade-flow-grid">
          <article className="info-card office-card">
            <div className="card-kicker">What each office supports</div>
            <h2 className="cart-section-title">Operational routing</h2>
            <div className="support-list">
              <div className="support-item">
                <span className="support-bullet" />
                <span>Operate Center handles sales coordination, partner communication, and commercial routing.</span>
              </div>
              <div className="support-item">
                <span className="support-bullet" />
                <span>Technical Support Center & Warehouse handles stock support, engineering triage, and after-sales warehouse coordination.</span>
              </div>
              <div className="support-item">
                <span className="support-bullet" />
                <span>Support, logistics, and RMA cases can still start on the public support pages even when they eventually land at one of these locations.</span>
              </div>
            </div>
          </article>

          <aside className="trade-side-stack">
            <article className="info-card office-card">
              <div className="card-kicker">Quick paths</div>
              <h2 className="cart-section-title">Related pages</h2>
              <div className="inline-link-list">
                <Link href={withLocalePath('/support/contact', locale)} className="section-link">
                  Support Contact Desk
                </Link>
                <Link href={withLocalePath('/support/after-sales', locale)} className="section-link">
                  After-sales Support
                </Link>
                <Link href={withLocalePath('/support/shipping', locale)} className="section-link">
                  Shipping & Customs
                </Link>
              </div>
            </article>
          </aside>
        </div>
      </section>
    </StorefrontFrame>
  );
}