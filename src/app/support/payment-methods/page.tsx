import Link from 'next/link';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { JsonLdScript } from '@/components/seo/json-ld';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
    title: 'Secure Payment Methods — STEPMOTECH',
    description: 'Multiple secure payment channels including PayPal, credit cards (VISA, MasterCard, American Express), bank transfer, and purchase orders for corporate clients.',
    path: '/support/payment-methods',
    locale,
  });
}

const paymentMethods = [
  {
    title: 'PayPal',
    description: 'Enjoy efficient, encrypted online payment. After submitting your order, you will be redirected to PayPal to complete payment securely. Supports credit cards, debit cards, and direct bank account deduction. All payment data is encrypted by PayPal servers — your card details are never exposed to us. PayPal Credit also offers flexible installment plans with monthly repayment scheduling.',
    icon: 'P',
  },
  {
    title: 'Credit Card (Direct)',
    description: 'We accept VISA, MasterCard, and American Express for direct payment. Transaction processing efficiency and security are identical whether paying directly or through PayPal. Upon successful payment, your order confirmation is displayed immediately. Note: some card issuers may charge additional cross-border transaction fees — please verify with your issuer or contact our customer service team before payment.',
    icon: 'C',
  },
  {
    title: 'Bank Transfer & Purchase Order (PO)',
    description: 'For corporate clients and users who prefer traditional payment methods, we support bank transfer and purchase order payment. Options include: debit card deduction from bank account, formal purchase orders approved by your procurement department, Proforma Invoice (PI) to confirm transaction details, and freight account billing for logistics fees. Contact our team to determine which option best suits your procurement workflow.',
    icon: 'B',
  },
];

export default async function PaymentPage() {
  const { locale } = await getServerSitePreferences();

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { name: 'Home', path: '/' },
      { name: 'Support', path: '/support' },
      { name: 'Payment Methods', path: '/support/payment-methods' },
    ],
    locale,
  );

  return (
    <StorefrontFrame
      eyebrow="Support"
      title="Secure Payment Methods"
      description="Multiple payment channels to meet the diverse needs of individual consumers and corporate customers. All methods prioritize security and adhere to international financial security standards."
    >
      <JsonLdScript id="payment-breadcrumb-jsonld" data={breadcrumbJsonLd} />

      <section className="section">
        <div className="section-inner trust-grid">
          {paymentMethods.map((method) => (
            <article key={method.title} className="trust-card">
              <div className="about-avatar" aria-hidden="true">{method.icon}</div>
              <strong>{method.title}</strong>
              <p className="section-description" style={{ marginBottom: 0 }}>{method.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-inner story-grid">
          <article className="story-card story-card-accent">
            <div className="card-kicker">Need help?</div>
            <h2 className="section-title">Not sure which payment option works best for you?</h2>
            <p className="section-description">Our customer service team can verify cross-border fees, assist with Proforma Invoices, and guide you through the procurement process.</p>
            <div className="trade-empty-actions">
              <Link href={withLocalePath('/contact', locale)} className="button-primary">Contact Support</Link>
            </div>
          </article>
        </div>
      </section>
    </StorefrontFrame>
  );
}
