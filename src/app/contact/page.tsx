import Link from 'next/link';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { ContactInquiryForm } from '@/components/storefront/contact-inquiry-form';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { sanitizeLegacyCopy } from '@/lib/legacy-content';
import { buildMetadata } from '@/lib/seo';
import { getCmsPageByLegacySlug } from '@/lib/storefront-api';

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
  title: 'Contact Sales & Engineering — STEPMOTECH',
  description: 'Reach STEPMOTECH for pricing, MOQ, export shipping, custom assemblies, and broader OEM sourcing requests.',
  path: '/contact',
    locale,
  });
}

export default async function ContactPage() {
  const [{ locale }, legacyContactPage] = await Promise.all([
    getServerSitePreferences(),
    getCmsPageByLegacySlug('10-contact-us', 'en'),
  ]);
  const legacySummary = sanitizeLegacyCopy(legacyContactPage?.summary ?? legacyContactPage?.content ?? '');
  const supportChannels = [
    'Sales inquiries for pricing, MOQ, and export shipping coordination.',
    'Engineering follow-up for custom assemblies and integration requirements.',
    'Catalog support for stock status, compatible drivers, and accessory selection.',
    'Post-order coordination for logistics updates and documentation requests.',
  ];

  return (
    <StorefrontFrame
      eyebrow="Contact & RFQ"
      title={legacyContactPage?.title || 'Contact Sales & Engineering'}
      description={legacySummary || 'Reach STEPMOTECH for pricing, MOQ, export shipping, custom assemblies, and broader OEM sourcing requests.'}
      actions={
        <>
          <Link href={withLocalePath('/products', locale)} className="button-primary">
            Browse Catalog
          </Link>
          <Link href={withLocalePath('/support', locale)} className="button-secondary page-button-secondary-dark">
            Open Help Center
          </Link>
        </>
      }
    >
      <section className="section">
        <div className="section-inner story-grid">
          <article className="story-card story-card-accent">
            <div className="card-kicker">Legacy-aligned contact content</div>
            <h2 className="section-title">Contact workflow aligned with the imported legacy page</h2>
            <p className="section-description">{legacySummary || 'General RFQ intake for industrial procurement projects with technical validation and logistics coordination.'}</p>
          </article>
          <article className="story-card">
            <div className="card-kicker">Support coverage</div>
            <div className="support-list">
              {supportChannels.map((item) => (
                <div key={item} className="support-item">
                  <span className="support-bullet" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="section-inner trade-flow-grid">
          <article className="info-card checkout-step-card">
            <div className="section-header trade-card-header">
              <div>
                <h2 className="cart-section-title">General RFQ Intake</h2>
                <p className="section-description">Send a consolidated request when the quote spans multiple parts, a custom assembly, or a sourcing discussion that should start before a cart order.</p>
              </div>
              <span className="product-badge">Sales desk</span>
            </div>
            <ContactInquiryForm
              submitLabel="Send inquiry"
              successMessage="Inquiry submitted. Sales will review the scope and reply with the right quote path."
              contextNote="This channel routes general procurement requests into the same inquiry queue as product RFQs, without requiring catalog line items."
            />
          </article>

          <div className="trade-side-stack">
            <article className="info-card">
              <h2 className="section-title">Quick links</h2>
              <div className="inline-link-list">
                <Link href={withLocalePath('/products', locale)} className="section-link">
                  Browse all products
                </Link>
                <Link href={withLocalePath('/search', locale)} className="section-link">
                  Search by keyword
                </Link>
                <Link href={withLocalePath('/support/after-sales', locale)} className="section-link">
                  After-sales support
                </Link>
                <Link href={withLocalePath('/account/quotes', locale)} className="section-link">
                  Review submitted quotes
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>
    </StorefrontFrame>
  );
}
