import Link from 'next/link';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { JsonLdScript } from '@/components/seo/json-ld';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';

const productionCapacity = [
  {
    label: 'Assembly lines',
    value: '6 dedicated cells',
    detail: 'Separate flow for standard stepper motors, drivers, linear actuators, gearbox kits, and export packing.',
  },
  {
    label: 'Monthly output',
    value: '120k+ units',
    detail: 'Catalog products and matched accessories move through a repeatable planning cycle instead of ad hoc batching.',
  },
  {
    label: 'Standard lead time',
    value: '2-4 weeks',
    detail: 'Sample and replenishment windows stay shorter when a build remains within the stocked catalog envelope.',
  },
  {
    label: 'Engineering samples',
    value: '7-10 working days',
    detail: 'Typical for fit-check, control validation, and documentation-led RFQ review before a wider release.',
  },
] as const;

const qcFlow = [
  {
    code: 'IQC',
    title: 'Incoming inspection',
    detail: 'Critical magnets, bearings, shafts, cables, and driver boards are checked against supplier files before they enter line inventory.',
  },
  {
    code: 'IPQC',
    title: 'In-process control',
    detail: 'Winding, rotor-stator assembly, connector fit, and torque checkpoints are verified during production instead of only at final pack-out.',
  },
  {
    code: 'OQC',
    title: 'Outgoing inspection',
    detail: 'Finished units are screened for electrical performance, labeling, accessories, and export-pack readiness before shipment release.',
  },
  {
    code: 'LAB',
    title: 'Reliability lab',
    detail: 'Engineering validation handles deeper stress testing, unusual duty cycles, and evidence gathering for regulated buyer review.',
  },
] as const;

const testingCapabilities = [
  'Torque tester for holding torque, pull-out behavior, and matched-load comparison.',
  'Vibration and mechanical integrity checks for higher-duty installations and transport robustness.',
  'Temperature chamber screening for thermal drift, startup behavior, and endurance planning.',
  'EMC review support for integrations that need cleaner system-level documentation.',
  'Life-test benches for duty-cycle simulation on repetitive motion programs.',
] as const;

const sustainabilityCommitments = [
  'RoHS and REACH documentation paths are maintained for standard catalog items and supported accessories.',
  'Conflict-minerals and supplier-declaration requests are routed through the same compliance desk used for qualification packs.',
  'Packaging and shipment planning are aligned with export review so documentation stays tied to the exact release path.',
] as const;

const certificationHighlights = [
  'ISO 9001 quality-system references for supplier onboarding and distributor review.',
  'IATF-oriented process summaries for automotive-adjacent qualification discussions.',
  'Environmental and material-compliance references that roll into the certifications and compliance pack.',
] as const;

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
  title: 'Factory & QC — STEPMOTECH',
  description: 'Production capacity, QC flow, reliability testing, and compliance practices behind the catalog and RFQ workflows.',
  path: '/company/factory',
    locale,
  });
}

export default async function CompanyFactoryPage() {
  const { locale } = await getServerSitePreferences();
  const certificationsPath = withLocalePath('/company/certifications', locale);
  const contactPath = withLocalePath('/contact', locale);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { name: 'Home', path: '/' },
      { name: 'About', path: '/company/about' },
      { name: 'Factory & QC', path: '/company/factory' },
    ],
    locale,
  );

  const manufacturingJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'STEPMOTECH Factory & QC',
    description: 'Factory capacity, quality-control flow, and reliability testing overview for motion-component buyers.',
    url: 'https://www.stepmotech.com/company/factory',
  };

  return (
    <StorefrontFrame
      eyebrow="Company"
      title="Factory and QC systems behind the catalog, RFQ, and after-sales workflows."
      description="Review production capacity, inspection flow, test capability, and compliance practices before you approve a sample, onboarding pack, or documentation-heavy build."
      actions={
        <>
          <Link href={contactPath} className="button-primary">
            Schedule a Virtual Tour
          </Link>
          <Link href={certificationsPath} className="button-secondary page-button-secondary-dark">
            Review Certifications
          </Link>
        </>
      }
    >
      <JsonLdScript id="company-factory-breadcrumb-jsonld" data={breadcrumbJsonLd} />
      <JsonLdScript id="company-factory-organization-jsonld" data={manufacturingJsonLd} />

      <section className="section">
        <div className="section-inner story-grid">
          <article className="story-card story-card-accent">
            <div className="card-kicker">Factory media</div>
            <h2 className="section-title">Production-floor and virtual-tour briefing placeholder.</h2>
            <p className="section-description">
              The design brief calls for factory photography or a short video. This slot keeps the media position in the page structure so real footage can be dropped in later without changing layout or copy flow.
            </p>
            <div className="support-list">
              <div className="support-item">
                <span className="support-bullet" />
                <span>Show winding, assembly, inspection, packing, and documentation checkpoints in one guided sequence.</span>
              </div>
              <div className="support-item">
                <span className="support-bullet" />
                <span>Keep autoplay off by default so buyers can choose whether to enter the media flow or stay in the qualification summary.</span>
              </div>
            </div>
          </article>

          <article className="story-card">
            <div className="card-kicker">What this page proves</div>
            <h2 className="section-title">Factory-direct supply is backed by process visibility, not just price.</h2>
            <p className="section-description">
              Buyers who source through the storefront still need evidence around manufacturing discipline, inspection routing, and validation depth. This page condenses that context before the request turns into a factory tour or audited document handoff.
            </p>
            <div className="inline-link-list">
              <Link href={certificationsPath} className="section-link">
                Certifications & Compliance
              </Link>
              <Link href={withLocalePath('/support/shipping', locale)} className="section-link">
                Shipping & Customs
              </Link>
              <Link href={withLocalePath('/company/offices', locale)} className="section-link">
                Office Locations
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <div className="section-header">
            <div>
              <h2 className="section-title">Production capacity</h2>
              <p className="section-description">A compact overview of the line structure, output rhythm, and lead-time expectations that sit behind stocked and custom-assisted builds.</p>
            </div>
          </div>

          <div className="trust-grid">
            {productionCapacity.map((item) => (
              <article key={item.label} className="trust-card">
                <div className="card-kicker">{item.label}</div>
                <strong className="about-stat">{item.value}</strong>
                <span className="section-description compact-copy">{item.detail}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <div className="section-header">
            <div>
              <h2 className="section-title">QC flow</h2>
              <p className="section-description">Incoming, in-process, outgoing, and lab validation checkpoints are separated so issues can be contained before they become shipment problems.</p>
            </div>
          </div>

          <div className="factory-process-grid">
            {qcFlow.map((step) => (
              <article key={step.code} className="info-card factory-process-card">
                <span className="filter-chip">{step.code}</span>
                <h3 className="cart-section-title">{step.title}</h3>
                <p className="section-description compact-copy">{step.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner info-grid">
          <article className="info-card factory-process-card">
            <div className="card-kicker">Testing capability</div>
            <h2 className="cart-section-title">Validation equipment and methods</h2>
            <div className="support-list">
              {testingCapabilities.map((item) => (
                <div key={item} className="support-item">
                  <span className="support-bullet" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="info-card factory-process-card">
            <div className="card-kicker">Sustainability & compliance</div>
            <h2 className="cart-section-title">Documentation aligned with shipment release</h2>
            <div className="support-list">
              {sustainabilityCommitments.map((item) => (
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
          <article className="info-card factory-process-card">
            <div className="card-kicker">Certification routing</div>
            <h2 className="cart-section-title">Factory systems connect directly to the compliance desk</h2>
            <div className="support-list">
              {certificationHighlights.map((item) => (
                <div key={item} className="support-item">
                  <span className="support-bullet" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="trade-empty-actions">
              <Link href={certificationsPath} className="button-secondary">
                Open Certifications
              </Link>
            </div>
          </article>

          <aside className="trade-side-stack">
            <article className="info-card factory-process-card">
              <div className="card-kicker">Virtual factory tour</div>
              <h2 className="cart-section-title">Schedule a guided remote walk-through</h2>
              <p className="section-description compact-copy">Use the main contact route when your team needs a live review of production flow, test capability, or qualification-document routing before a build is approved.</p>
              <div className="trade-empty-actions">
                <Link href={contactPath} className="button-primary">
                  Start Contact Request
                </Link>
                <Link href={withLocalePath('/company/about', locale)} className="section-link">
                  Back to About
                </Link>
              </div>
            </article>
          </aside>
        </div>
      </section>
    </StorefrontFrame>
  );
}