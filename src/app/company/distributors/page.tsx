import Link from 'next/link';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { JsonLdScript } from '@/components/seo/json-ld';
import { DistributorFinderClient } from '@/components/storefront/distributor-finder-client';
import { SupportContactClient } from '@/components/storefront/support-contact-client';
import { distributorApplicationChecklist, distributorPortalHighlights, distributorProgramHighlights, distributorProgramSupport } from '@/lib/distributors';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import { footerContactBlocks } from '@/lib/site-shell';
import { getProductList } from '@/lib/storefront-api';

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
  title: 'Distributors — STEPMOTECH',
  description: 'Distributor program overview, regional channel finder, partnership application form, and current distributor portal entry path.',
  path: '/company/distributors',
    locale,
  });
}

export default async function CompanyDistributorsPage() {
  const [{ locale }, listing] = await Promise.all([getServerSitePreferences(), getProductList({ purchaseMode: 'buy', pageSize: 1, sort: 'featured' })]);
  const intakeProduct = listing.items[0] ?? null;

  if (!intakeProduct) {
    return null;
  }

  const partnershipPath = withLocalePath('/support/contact?topic=partnership', locale);
  const portalLoginPath = withLocalePath('/login?callbackUrl=%2Faccount%3Fportal%3Ddistributor', locale);
  const portalRegisterPath = withLocalePath('/register', locale);
  const officeBlocks = footerContactBlocks.filter((block) => block.title.includes('Center'));

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { name: 'Home', path: '/' },
      { name: 'About', path: '/company/about' },
      { name: 'Distributors', path: '/company/distributors' },
    ],
    locale,
  );
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Distributor Program',
    description: 'Regional distributor finder, partnership intake, and current portal-access guidance.',
  };

  return (
    <StorefrontFrame
      eyebrow="Company"
      title="Distributor program, regional channel coverage, and portal access in one route."
      description="Use this page to review the channel program, find regional distributor coverage, submit a distributor application, or sign in through the current business-account portal path."
      actions={
        <>
          <Link href={partnershipPath} className="button-primary">
            Apply as Distributor
          </Link>
          <Link href={portalLoginPath} className="button-secondary page-button-secondary-dark">
            Distributor Portal Login
          </Link>
        </>
      }
    >
      <JsonLdScript id="company-distributors-breadcrumb-jsonld" data={breadcrumbJsonLd} />
      <JsonLdScript id="company-distributors-collection-jsonld" data={collectionJsonLd} />

      <section className="section">
        <div className="section-inner trust-grid">
          {distributorProgramHighlights.map((item) => (
            <article key={item.title} className="trust-card">
              <div className="card-kicker">Program intro</div>
              <strong className="about-stat">{item.title}</strong>
              <span className="section-description compact-copy">{item.detail}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-inner support-contact-layout">
          <DistributorFinderClient locale={locale} />

          <aside className="trade-side-stack">
            <article className="info-card distributor-portal-card">
              <div className="card-kicker">Distributor portal</div>
              <h2 className="cart-section-title">Current login path for channel accounts</h2>
              <div className="support-list">
                {distributorPortalHighlights.map((item) => (
                  <div key={item} className="support-item">
                    <span className="support-bullet" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="trade-empty-actions">
                <Link href={portalLoginPath} className="button-primary">
                  Sign In
                </Link>
                <Link href={portalRegisterPath} className="button-secondary">
                  Register Company
                </Link>
              </div>
            </article>

            <article className="info-card distributor-portal-card">
              <div className="card-kicker">Regional support footprint</div>
              <h2 className="cart-section-title">Operating centers</h2>
              <div className="support-contact-info-grid">
                {officeBlocks.map((block) => (
                  <article key={block.title} className="summary-stat">
                    <span className="summary-label">{block.title}</span>
                    <strong>{block.lines[0]}</strong>
                  </article>
                ))}
              </div>
            </article>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="section-inner support-contact-layout">
          <div className="support-contact-stack">
            <article className="info-card support-contact-guidance">
              <div className="card-kicker">Become a distributor</div>
              <h2 className="cart-section-title">Send channel context through the partnership intake</h2>
              <p className="section-description">The form below reuses the storefront partnership workflow so your distributor application creates a real ticket, not a dead-end placeholder.</p>
            </article>

            <SupportContactClient locale={locale} intakeProductId={intakeProduct.id} initialTopic="partnership" />
          </div>

          <aside className="trade-side-stack">
            <article className="info-card distributor-portal-card">
              <div className="card-kicker">Application checklist</div>
              <h2 className="cart-section-title">Include these details in your request</h2>
              <div className="support-list">
                {distributorApplicationChecklist.map((item) => (
                  <div key={item} className="support-item">
                    <span className="support-bullet" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="info-card distributor-portal-card">
              <div className="card-kicker">Partner enablement</div>
              <h2 className="cart-section-title">What approved channel partners get</h2>
              <div className="support-list">
                {distributorProgramSupport.map((item) => (
                  <div key={item} className="support-item">
                    <span className="support-bullet" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </article>
          </aside>
        </div>
      </section>
    </StorefrontFrame>
  );
}