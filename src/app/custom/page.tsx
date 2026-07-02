import Link from 'next/link';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { JsonLdScript } from '@/components/seo/json-ld';
import { CustomDevelopmentForm } from '@/components/storefront/custom-development-form';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import { getProductList } from '@/lib/storefront-api';

const capabilities = [
  {
    title: 'Custom windings',
    caseCount: '48 delivered programs',
    description: 'Optimize voltage constants, torque density, and thermal behavior for the actual machine envelope.',
  },
  {
    title: 'Custom shafts & gearboxes',
    caseCount: '31 shaft / reducer variants',
    description: 'Move past stock output geometry with keyed shafts, dual shafts, custom lengths, and gearbox integration.',
  },
  {
    title: 'Integrated drivers',
    caseCount: '19 controller-ready builds',
    description: 'Bundle the motor, driver, harness, and comms stack when installation time matters more than the lowest component cost.',
  },
  {
    title: 'Special environments',
    caseCount: '14 sealed or extended-range projects',
    description: 'Support for temperature, ingress, shock, vibration, and traceability requirements beyond the standard catalog line.',
  },
];

const processTimeline = [
  { title: 'Inquiry', copy: 'Engineering triage reviews the machine brief, constraints, and commercial targets.' },
  { title: 'DFM', copy: 'We align manufacturability, winding, mechanical stack, and component sourcing assumptions.' },
  { title: 'Sample', copy: 'Prototype hardware or sub-assemblies are prepared with test scope and feedback loop.' },
  { title: 'EVT / DVT / PVT', copy: 'Validation gates close risk on performance, integration, and pre-production readiness.' },
  { title: 'MP', copy: 'Mass production release aligns MOQ, QC checkpoints, export documents, and delivery cadence.' },
];

const faq = [
  {
    question: 'What is the starting MOQ?',
    answer: 'Most custom programs start from 50 units, while gearbox or tooling-heavy variants may need a different ramp plan after DFM review.',
  },
  {
    question: 'How long does a custom sample take?',
    answer: 'Initial engineering triage is typically one business day, with sample timing determined by winding, machining, and test scope.',
  },
  {
    question: 'Can you work under NDA?',
    answer: 'Yes. Download the template, flag NDA-required review in the form, and attach the signed copy name so the team can route accordingly.',
  },
  {
    question: 'How are tooling charges handled?',
    answer: 'Tooling and NRE are scoped after manufacturability review and are quoted with the same engineering brief rather than as a separate intake.',
  },
];

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
  title: 'Custom Stepper / BLDC / Servo Motor Development — STEPMOTECH',
  description: 'Custom windings, shafts, integrated drivers, and special-environment motion programs with MOQ guidance and engineering intake.',
  path: '/custom',
    locale,
  });
}

type CustomDevelopmentPageProps = {
  searchParams: Promise<{ sourceSpu?: string; sourceProduct?: string }>;
};

export default async function CustomDevelopmentPage({ searchParams }: CustomDevelopmentPageProps) {
  const [preferences, params, listing] = await Promise.all([getServerSitePreferences(), searchParams, getProductList({ purchaseMode: 'buy', pageSize: 1, sort: 'featured' })]);
  const intakeProduct = listing.items[0] ?? null;

  if (!intakeProduct) {
    return null;
  }

  const referenceSpu = params.sourceSpu?.trim() || undefined;
  const referenceProductName = params.sourceProduct?.trim() || undefined;
  const selectorPath = withLocalePath('/selector', preferences.locale);
  const contactPath = `${withLocalePath('/contact', preferences.locale)}?topic=engineering-call`;
  const quotePath = withLocalePath('/quote', preferences.locale);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { name: 'Home', path: '/' },
      { name: 'Custom Development', path: '/custom' },
    ],
    preferences.locale,
  );
  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Custom motor development',
    description: 'Custom stepper, BLDC, servo, and integrated motion development service with engineering intake and MOQ guidance.',
    provider: {
      '@type': 'Organization',
      name: 'STEPMOTECH',
    },
    areaServed: 'Worldwide',
  };

  return (
    <StorefrontFrame
      eyebrow="Custom Development"
      title="Custom motor development"
      description="Talk to our motion engineers. NDA-ready, MOQ from 50 units. Use this page when the selector points outside catalog fits or the product needs mechanical, electrical, or environmental changes."
      actions={
        <>
          <a href="#custom-brief" className="button-primary">
            Start specification
          </a>
          <Link href={contactPath} className="button-secondary page-button-secondary-dark">
            Talk to an engineer
          </Link>
        </>
      }
    >
      <JsonLdScript id="custom-breadcrumb-jsonld" data={breadcrumbJsonLd} />
      <JsonLdScript id="custom-service-jsonld" data={serviceJsonLd} />

      <section className="section">
        <div className="section-inner custom-capability-grid">
          {capabilities.map((capability) => (
            <article key={capability.title} className="info-card custom-capability-card">
              <div className="card-kicker">Capability</div>
              <h2 className="section-title">{capability.title}</h2>
              <strong className="custom-capability-count">{capability.caseCount}</strong>
              <p className="section-description">{capability.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-inner custom-brief-layout">
          <div className="custom-main-stack">
            <CustomDevelopmentForm
              intakeProductId={intakeProduct.id}
              intakeProductName={intakeProduct.name}
              locale={preferences.locale}
              referenceSpu={referenceSpu}
              referenceProductName={referenceProductName}
            />
          </div>

          <aside className="trade-side-stack">
            <article className="info-card custom-summary-card">
              <h2 className="cart-section-title">Program summary</h2>
              {referenceSpu || referenceProductName ? (
                <article className="summary-stat">
                  <span className="summary-label">Starting point</span>
                  <strong>{[referenceProductName, referenceSpu ? `SPU ${referenceSpu}` : null].filter(Boolean).join(' · ')}</strong>
                </article>
              ) : null}
              <div className="support-list">
                <div className="support-item">
                  <span className="support-bullet" />
                  <span>MOQ usually starts from 50 units after engineering triage.</span>
                </div>
                <div className="support-item">
                  <span className="support-bullet" />
                  <span>Drafts can be saved locally and revisited before final submission.</span>
                </div>
                <div className="support-item">
                  <span className="support-bullet" />
                  <span>Attachment names are captured now, with secure transfer handled during follow-up.</span>
                </div>
                <div className="support-item">
                  <span className="support-bullet" />
                  <span>Typical engineering triage target is one business day.</span>
                </div>
              </div>

              <div className="inline-link-list">
                <Link href={selectorPath} className="section-link">
                  Back to selector
                </Link>
                <Link href={quotePath} className="section-link">
                  Open quote workspace
                </Link>
                <Link href={contactPath} className="section-link">
                  General RFQ desk
                </Link>
              </div>
            </article>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="section-inner custom-secondary-grid">
          <article className="info-card">
            <div className="section-header trade-card-header">
              <div>
                <div className="card-kicker">Process timeline</div>
                <h2 className="cart-section-title">How the program moves</h2>
              </div>
            </div>
            <div className="custom-timeline-grid">
              {processTimeline.map((step, index) => (
                <article key={step.title} className="custom-timeline-card">
                  <span className="custom-timeline-index">{index + 1}</span>
                  <strong>{step.title}</strong>
                  <p className="section-description">{step.copy}</p>
                </article>
              ))}
            </div>
          </article>

          <article className="info-card">
            <div className="section-header trade-card-header">
              <div>
                <div className="card-kicker">FAQ</div>
                <h2 className="cart-section-title">Commercial and IP questions</h2>
              </div>
            </div>
            <div className="custom-faq-grid">
              {faq.map((item) => (
                <article key={item.question} className="custom-faq-card">
                  <strong>{item.question}</strong>
                  <p className="section-description">{item.answer}</p>
                </article>
              ))}
            </div>
          </article>
        </div>
      </section>
    </StorefrontFrame>
  );
}