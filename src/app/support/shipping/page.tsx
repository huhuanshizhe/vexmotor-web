import Link from 'next/link';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { JsonLdScript } from '@/components/seo/json-ld';
import { ShippingEstimatorClient } from '@/components/storefront/shipping-estimator-client';
import { getShippingCountryOptions } from '@/lib/commerce-config';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import { getEstimatedTaxRate } from '@/lib/shipping';
import { getCommerceConfig } from '@/lib/storefront-api';

const shippingLanes = [
  {
    warehouse: 'HK Warehouse',
    carrier: 'DHL Express Worldwide',
    eta: '4-7 business days',
    origin: 'Hong Kong export hub',
    fit: 'Default urgent lane for samples, replacements, and standard export demand.',
  },
  {
    warehouse: 'HK Warehouse',
    carrier: 'DDP Air Direct',
    eta: '7-12 business days',
    origin: 'China consolidated air lane',
    fit: 'Used when landed-cost predictability matters more than the absolute fastest carrier handoff.',
  },
  {
    warehouse: 'HK Warehouse',
    carrier: 'DDP Sea + Truck',
    eta: '15-30 business days',
    origin: 'China export plus destination trucking',
    fit: 'Cost-led route for larger replenishment releases where lead time is planned in advance.',
  },
  {
    warehouse: 'EU Buffer Stock',
    carrier: 'DHL Express',
    eta: '3-5 business days',
    origin: 'EU forward stock or customs-cleared lane',
    fit: 'Common for EU and UK engineering builds that need faster regional fulfillment.',
  },
  {
    warehouse: 'US Support Stock',
    carrier: 'FedEx Priority',
    eta: '3-5 business days',
    origin: 'US replenishment warehouse or priority import lane',
    fit: 'Balanced for North American replenishment, warehouse delivery, and order-issue recovery.',
  },
] as const;

const incoterms = [
  {
    term: 'EXW',
    title: 'Ex Works',
    coverage: 'Buyer arranges pickup, export, main freight, import, and local delivery.',
    whenToUse: 'Best when your forwarder controls the full lane and StepMotech only needs to release goods from origin.',
  },
  {
    term: 'FOB',
    title: 'Free On Board',
    coverage: 'Seller clears export and loads the shipment; buyer controls main freight and import clearance.',
    whenToUse: 'Useful when the customer already has a nominated forwarder for sea or air main carriage.',
  },
  {
    term: 'DAP',
    title: 'Delivered At Place',
    coverage: 'Seller manages carriage to destination, but import duties and taxes remain with the buyer.',
    whenToUse: 'Use when delivery speed is more important than all-inclusive duty handling.',
  },
  {
    term: 'DDP',
    title: 'Delivered Duty Paid',
    coverage: 'Seller arranges carriage, customs handling, import duties, and final delivery in supported lanes.',
    whenToUse: 'Preferred for customers who want predictable landed cost and minimal customs administration.',
  },
] as const;

const regionalPolicies = [
  {
    region: 'United States',
    taxLabel: `${(getEstimatedTaxRate('US') * 100).toFixed(0)}% estimator basis`,
    note: 'Priority DHL/FedEx lanes are common for urgent stocked demand. Standard courier or DAP-style lanes may still require buyer-side state tax or import coordination.',
  },
  {
    region: 'Canada',
    taxLabel: `${(getEstimatedTaxRate('CA') * 100).toFixed(0)}% estimator basis`,
    note: 'DDP handling is preferred when GST/HST predictability matters. Standard courier may require local broker coordination on arrival.',
  },
  {
    region: 'United Kingdom',
    taxLabel: `${(getEstimatedTaxRate('GB') * 100).toFixed(0)}% estimator basis`,
    note: 'UK-bound lanes often mirror EU express timing, but import documents and VAT treatment should be confirmed before release on non-DDP lanes.',
  },
  {
    region: 'European Union',
    taxLabel: `${(getEstimatedTaxRate('DE') * 100).toFixed(0)}% estimator basis`,
    note: 'EU deliveries often route through customs-cleared lanes or regional forward stock. DDP or broker-standardized lanes reduce clearance surprises.',
  },
  {
    region: 'Australia',
    taxLabel: `${(getEstimatedTaxRate('AU') * 100).toFixed(0)}% estimator basis`,
    note: 'Express lanes are common for pilot and service demand; DDP is preferred when the buyer wants import cost settled before dispatch.',
  },
  {
    region: 'Other destinations',
    taxLabel: `${(getEstimatedTaxRate('OTHER') * 100).toFixed(0)}% planning basis`,
    note: 'Destination-specific review is required for customs treatment, final tax, and restricted-destination checks before release.',
  },
] as const;

const restrictedDestinations = [
  'Customers shipping into India, Türkiye, Brazil, South Africa, and other stricter customs markets should confirm importer readiness before release.',
  'Sanctioned, embargoed, or export-controlled destinations require manual compliance review before the order can move into logistics execution.',
  'Sensitive end-use programs may require EAR / ECCN review, end-user declarations, or shipment refusal if compliance documentation is incomplete.',
] as const;

const packagingAndTracking = [
  'Carton, foam, anti-static, and SKU labeling are selected to match the product type and export handling risk.',
  'Commercial invoice, HS code, and shipment reference support are available for import preparation and broker handoff.',
  'Customers should inspect goods at delivery, keep packaging for claims, and report visible damage or POD discrepancies immediately.',
] as const;

const supportLinks = [
  { label: 'Shipping Policy', href: '/support/shipping-policy', note: 'Legacy article view for policy wording and service-level summary.' },
  { label: 'Clearance & Duty', href: '/support/clearance-duty', note: 'Use this when the main question is who pays customs or VAT on the chosen lane.' },
  { label: 'Free Shipping', href: '/support/free-shipping', note: 'Promotion details and threshold-specific qualification notes.' },
  { label: 'Contact Support', href: '/support/contact?topic=logistics', note: 'Open a logistics ticket when a live order or customs exception needs human handling.' },
] as const;

const faq = [
  {
    question: 'When should I choose DDP instead of a standard courier lane?',
    answer: 'Choose DDP when you want predictable landed cost and minimal customs administration. Standard courier or DAP-style handling is better only when your team already manages import brokerage internally.',
  },
  {
    question: 'What should I prepare before requesting a customs or shipping exception?',
    answer: 'Prepare the SKU list, destination country, delivery address context, importer details if applicable, and the commercial goal for the shipment so the logistics team can recommend the right lane quickly.',
  },
  {
    question: 'How should damage or POD issues be handled?',
    answer: 'Inspect goods on arrival, keep the packaging, capture photos immediately, and contact support with the tracking reference so the issue can be triaged before claim windows close.',
  },
] as const;

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
  title: 'Shipping & Customs — STEPMOTECH',
  description: 'Global shipping, customs handling, Incoterms guidance, regional tax and duty notes, and a shipping estimator aligned with the cart experience.',
  path: '/support/shipping',
    locale,
  });
}

export default async function SupportShippingPage() {
  const { locale } = await getServerSitePreferences();
  const commerceConfig = await getCommerceConfig(locale);
  const primaryLaneRate = commerceConfig.shippingCountryRates.find(
    (rate) => rate.countryCode === commerceConfig.defaultCountryCode && rate.shippingMethodCode === commerceConfig.defaultShippingMethodCode && rate.enabled,
  );
  const overviewStats = [
    { label: 'Processing window', value: '1-2 business days', note: 'Weekend and holiday orders move to the next working day before carrier handoff.' },
    {
      label: 'Free-shipping threshold',
      value: primaryLaneRate?.freeShippingThreshold ? `$${primaryLaneRate.freeShippingThreshold}+` : 'Configured by lane',
      note: primaryLaneRate?.freeShippingThreshold
        ? 'The default primary lane becomes free after the configured stocked-order subtotal is reached.'
        : 'Some lanes use explicit freight pricing without an automatic free-shipping threshold.',
    },
    { label: 'Tracking handoff', value: 'Email + 17TRACK', note: 'Tracking numbers are issued after dispatch and can be reviewed on the carrier side.' },
  ] as const;
  const shippingLanes = commerceConfig.shippingMethods
    .filter((method) => method.enabled)
    .map((method) => ({
      warehouse: method.code === 'warehouse-pickup' ? 'Factory pickup point' : 'HK Warehouse',
      carrier: method.name,
      eta: method.etaLabel,
      origin: method.code === 'warehouse-pickup' ? 'Warehouse appointment' : 'Hong Kong export hub',
      fit: method.note,
    }));
  const regionalPolicies = getShippingCountryOptions(commerceConfig).map((country) => ({
    region: country.label,
    taxLabel: `${(
      commerceConfig.shippingCountryRates.find((rate) => rate.enabled && rate.countryCode === country.code)?.taxRate ??
      commerceConfig.shippingCountryRates.find((rate) => rate.enabled && rate.countryCode === 'OTHER')?.taxRate ??
      0
    ) * 100}% estimator basis`,
    note:
      country.code === 'OTHER'
        ? 'Destination-specific review is still required for customs treatment, final tax, and restricted-destination checks before release.'
        : 'Freight lanes and landed-cost estimates for this destination now follow the same country-level configuration used in cart and checkout.',
  }));
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { name: 'Home', path: '/' },
      { name: 'Support', path: '/support' },
      { name: 'Shipping & Customs', path: '/support/shipping' },
    ],
    locale,
  );
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Shipping & Customs',
    description: 'Support page covering freight lanes, Incoterms, customs handling, packaging guidance, and planning estimates.',
  };
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
      title="Shipping and customs guidance for global stocked orders, replacements, and RFQ-led releases."
      description="Use this page to compare freight lanes, understand Incoterms and duty handling, check restricted-destination expectations, and estimate landed cost before checkout or logistics review."
      actions={
        <>
          <Link href={withLocalePath('/support/contact?topic=logistics', locale)} className="button-primary">
            Contact Logistics Support
          </Link>
          <a href="https://www.17track.net/en" className="button-secondary page-button-secondary-dark" target="_blank" rel="noreferrer">
            Track Shipment
          </a>
        </>
      }
    >
      <JsonLdScript id="support-shipping-breadcrumb-jsonld" data={breadcrumbJsonLd} />
      <JsonLdScript id="support-shipping-article-jsonld" data={articleJsonLd} />
      <JsonLdScript id="support-shipping-faq-jsonld" data={faqJsonLd} />

      <section className="section">
        <div className="section-inner shipping-overview-grid">
          {overviewStats.map((item) => (
            <article key={item.label} className="summary-stat">
              <span className="summary-label">{item.label}</span>
              <strong>{item.value}</strong>
              <span className="section-description compact-copy">{item.note}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-inner trade-flow-grid">
          <div className="trade-main-stack">
            <article className="info-card shipping-note-card">
              <div className="section-header trade-card-header">
                <div>
                  <div className="card-kicker">Lane overview</div>
                  <h2 className="cart-section-title">Warehouse, carrier, ETA, and origin</h2>
                  <p className="section-description">This overview gives the main planning lanes. The calculator below uses the same carrier and ETA source currently shown on the cart page.</p>
                </div>
              </div>

              <div className="shipping-lane-grid">
                {shippingLanes.map((lane) => (
                  <article key={`${lane.warehouse}-${lane.carrier}`} className="shipping-lane-row">
                    <div>
                      <span className="summary-label">Warehouse</span>
                      <strong>{lane.warehouse}</strong>
                    </div>
                    <div>
                      <span className="summary-label">Carrier</span>
                      <strong>{lane.carrier}</strong>
                    </div>
                    <div>
                      <span className="summary-label">ETA</span>
                      <strong>{lane.eta}</strong>
                    </div>
                    <div>
                      <span className="summary-label">Origin</span>
                      <strong>{lane.origin}</strong>
                    </div>
                    <div>
                      <span className="summary-label">Best fit</span>
                      <span className="section-description compact-copy">{lane.fit}</span>
                    </div>
                  </article>
                ))}
              </div>
            </article>

            <article className="info-card shipping-note-card">
              <div className="section-header trade-card-header">
                <div>
                  <div className="card-kicker">Incoterms</div>
                  <h2 className="cart-section-title">How responsibility changes by lane</h2>
                </div>
              </div>

              <div className="shipping-incoterm-grid">
                {incoterms.map((item) => (
                  <article key={item.term} className="summary-stat">
                    <span className="summary-label">{item.term}</span>
                    <strong>{item.title}</strong>
                    <span className="section-description compact-copy">{item.coverage}</span>
                    <span className="section-description compact-copy">{item.whenToUse}</span>
                  </article>
                ))}
              </div>
            </article>
          </div>

          <aside className="trade-side-stack">
            <article className="info-card shipping-note-card">
              <div className="card-kicker">Restricted destinations</div>
              <h2 className="cart-section-title">Compliance checks before release</h2>
              <div className="support-list">
                {restrictedDestinations.map((item) => (
                  <div key={item} className="support-item">
                    <span className="support-bullet" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="info-card shipping-note-card">
              <div className="card-kicker">Packaging, HS code, and tracking</div>
              <h2 className="cart-section-title">Operational checkpoints</h2>
              <div className="support-list">
                {packagingAndTracking.map((item) => (
                  <div key={item} className="support-item">
                    <span className="support-bullet" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="info-card shipping-note-card">
              <div className="card-kicker">Reference pages</div>
              <h2 className="cart-section-title">Shipping-related support paths</h2>
              <div className="shipping-utility-grid">
                {supportLinks.map((item) => (
                  <Link key={item.label} href={withLocalePath(item.href, locale)} className="summary-stat">
                    <span className="summary-label">Support</span>
                    <strong>{item.label}</strong>
                    <span className="section-description compact-copy">{item.note}</span>
                  </Link>
                ))}
              </div>
            </article>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="section-inner shipping-region-grid">
          {regionalPolicies.map((item) => (
            <article key={item.region} className="info-card shipping-note-card">
              <div className="card-kicker">Destination policy</div>
              <h2 className="cart-section-title">{item.region}</h2>
              <strong>{item.taxLabel}</strong>
              <p className="section-description compact-copy">{item.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-inner trade-flow-grid">
          <ShippingEstimatorClient commerceConfig={commerceConfig} />

          <aside className="trade-side-stack">
            <article className="info-card shipping-note-card">
              <div className="card-kicker">FAQ</div>
              <h2 className="cart-section-title">Common shipping questions</h2>
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