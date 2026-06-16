import Link from 'next/link';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { JsonLdScript } from '@/components/seo/json-ld';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
    title: 'Returns & Warranty — STEPMOTECH',
    description: 'Transparent return process: 30-day window, RMA authorization, scenario-based handling, and cost deduction policies.',
    path: '/support/returns',
    locale,
  });
}

const returnRequirements = [
  { label: 'Authorization', detail: 'All returns require prior official approval. Unauthorized return packages will be returned or disposed of via the original route.' },
  { label: 'Logistics', detail: 'Use FedEx or DHL for returns. Postal services are not accepted.' },
  { label: 'Time Limit', detail: 'Returns must be submitted within 30 days of receipt (tracked by valid logistics number).' },
  { label: 'Product Condition', detail: 'Products must be unused, untested, and unprogrammed. Original packaging and accessories must be intact and undamaged.' },
  { label: 'Custom Products', detail: 'Only eligible for return if there are process defects or functional failures upon receipt. Non-quality issues are not eligible for returns or exchanges.' },
];

const deductionRules = [
  'Costs for quality inspection, secondary packaging, warehouse management, and transportation losses will be deducted from the refund. Deduction ratios vary by product type.',
  'Initial export postage and packaging fees are non-refundable. Return shipping costs are customer-borne.',
  'If quality defects are confirmed, apply for "freight collect" to return items. Submit clear visual evidence of defects simultaneously.',
  'Purchase sufficient insurance to mitigate transportation risks. StepMotech is not responsible for loss, damage, or customs detention during logistics.',
];

const returnScenarios = [
  {
    title: 'Regular Product Return (Non-Quality Issue)',
    eligibility: 'Subjective dissatisfaction, mistaken purchase, or demand change.',
    process: 'Submit an application via the account center with a product panoramic photo and proof of packaging integrity. Upon approval, a unique RMA number (e.g., RMA123456789) will be generated. Mark the RMA number on the recipient information column; otherwise, the warehouse may reject the package.',
    refund: 'Refund = Product Payment Price - Purchase Cost - Export Postage. Return logistics costs are not deducted.',
  },
  {
    title: 'Received the Wrong Item',
    eligibility: 'Must be reported within 48 hours of delivery.',
    process: 'Contact customer service with a screenshot comparing the wrong item vs. the order, plus multi-angle photos/videos of the package.',
    refund: 'Option 1: Keep the wrong item + 50% price difference compensation (via coupon/refund) + reshipment of correct item. Option 2: Return within 5 working days (no additional compensation).',
  },
  {
    title: 'Defective Product Return',
    eligibility: 'Request must be submitted within 15 working days of delivery.',
    process: 'Provide 3 videos from different angles, 10 high-definition photos under ambient lighting, and a fault statement attached to the original packaging.',
    refund: 'Refund ratio may be reduced based on evaluation if packaging is improper. If quality defects are confirmed, return freight is covered.',
  },
];

const timelineSteps = [
  { label: 'Review Feedback', detail: 'Standard cases: 2 working days. Complex cases: up to 5 working days.' },
  { label: 'Shipment Deadline', detail: 'Approved returns must be shipped within 7 natural days. Otherwise, the return right is considered waived and the package may be rejected.' },
  { label: 'Refund Processing', detail: 'Approved refunds are typically issued within 2 business days after inspection, with funds appearing in 10 to 15 business days depending on the payment provider.' },
];

const faq = [
  { question: 'When does StepMotech cover return freight?', answer: 'Return freight is covered when a confirmed quality defect or wrong-item shipment is established. Change-of-mind or demand-change returns remain customer-paid.' },
  { question: 'What if I receive the wrong item?', answer: 'Report within 48 hours of delivery. You can keep the wrong item with 50% price difference compensation plus reshipment, or return within 5 working days.' },
  { question: 'What evidence is needed for defective returns?', answer: '3 videos from different angles, 10 high-definition photos under ambient lighting, and a fault statement attached to the original packaging.' },
];

export default async function ReturnsWarrantyPage() {
  const { locale } = await getServerSitePreferences();
  const contactPath = withLocalePath('/support/contact?topic=order-issue', locale);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [{ name: 'Home', path: '/' }, { name: 'Support', path: '/support' }, { name: 'Returns & Warranty', path: '/support/returns' }],
    locale,
  );

  return (
    <StorefrontFrame
      eyebrow="Support"
      title="Transparent return and warranty service for every order."
      description="Before submitting a return request, please review the requirements, scenarios, and timelines below. All returns require prior RMA authorization."
      actions={
        <>
          <Link href={contactPath} className="button-primary">Contact Order Support</Link>
          <Link href={withLocalePath('/support/shipping', locale)} className="button-secondary page-button-secondary-dark">Shipping & Customs</Link>
        </>
      }
    >
      <JsonLdScript id="returns-breadcrumb-jsonld" data={breadcrumbJsonLd} />

      <section className="section">
        <div className="section-inner returns-summary-grid">
          <article className="summary-stat">
            <span className="summary-label">Return window</span>
            <strong>30 calendar days</strong>
            <span className="section-description compact-copy">From delivery date, tracked by valid logistics number.</span>
          </article>
          <article className="summary-stat">
            <span className="summary-label">Review time</span>
            <strong>2–5 working days</strong>
            <span className="section-description compact-copy">Standard review within 2 days; complex cases up to 5 days.</span>
          </article>
          <article className="summary-stat">
            <span className="summary-label">Refund timeline</span>
            <strong>10–15 business days</strong>
            <span className="section-description compact-copy">After inspection approval, depending on payment provider.</span>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <div className="section-header">
            <div><h2 className="section-title">Return Requirements</h2><p className="section-description">All returns must meet these conditions before an RMA can be approved.</p></div>
          </div>
          <div className="trust-grid">
            {returnRequirements.map((item) => (
              <article key={item.label} className="trust-card">
                <div className="card-kicker">{item.label}</div>
                <p className="section-description" style={{ marginBottom: 0 }}>{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <div className="section-header">
            <div><h2 className="section-title">Cost Deductions & Responsibilities</h2><p className="section-description">Understand what costs may be deducted and who bears responsibility in each scenario.</p></div>
          </div>
          <div className="support-list">
            {deductionRules.map((item) => (
              <div key={item} className="support-item"><span className="support-bullet" /><span>{item}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <div className="section-header">
            <div><h2 className="section-title">Return Handling by Scenario</h2><p className="section-description">Different procedures apply depending on the reason for return.</p></div>
          </div>
          <div className="trade-flow-grid">
            {returnScenarios.map((scenario) => (
              <article key={scenario.title} className="info-card" style={{ gridColumn: '1 / -1' }}>
                <div className="card-kicker">{scenario.eligibility}</div>
                <h3 style={{ marginTop: 4 }}>{scenario.title}</h3>
                <p className="section-description"><strong>Process:</strong> {scenario.process}</p>
                <p className="section-description"><strong>Refund:</strong> {scenario.refund}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <div className="section-header">
            <div><h2 className="section-title">Process Timelines</h2></div>
          </div>
          <div className="trust-grid">
            {timelineSteps.map((item) => (
              <article key={item.label} className="trust-card">
                <div className="card-kicker">{item.label}</div>
                <p className="section-description" style={{ marginBottom: 0 }}>{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <article className="info-card">
            <div className="card-kicker">FAQ</div>
            <h2 className="cart-section-title">Common return questions</h2>
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
