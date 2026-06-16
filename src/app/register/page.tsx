import Link from 'next/link';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { RegisterBusinessForm } from '@/components/storefront/register-business-form';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildMetadata } from '@/lib/seo';

const benefits = [
  'Net 30 and reviewed payment terms for qualified accounts.',
  'Saved BOM and compare-driven sourcing flows for repeat purchasing.',
  'Multi-user coordination across buyers, engineers, and operations leads.',
  'Pending review banner and staged account privileges after sign-up.',
];

const timeline = [
  'Submit the account profile and company information.',
  'The review queue receives your registration summary within the same workflow used for RFQ follow-up.',
  'Approval normally lands within one working day, while skipped verification keeps the account in limited pending mode.',
];

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
  title: 'Create a business account — STEPMOTECH',
  description: 'Register a company account for pricing, BOM, and RFQ follow-up.',
  path: '/register',
  noIndex: true,
    locale,
  });
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const preferences = await getServerSitePreferences();
  const params = await searchParams;

  return (
    <StorefrontFrame
      eyebrow="Register"
      title="Create a business account"
      description="Open a company account in minutes, keep sourcing history together, and enter the review queue without waiting on manual handoff."
    >
      <section className="section">
        <div className="section-inner info-grid auth-grid">
          <article className="info-card auth-card">
            <div className="card-kicker">Business registration</div>
            <h1 style={{ margin: 0 }}>Create a business account</h1>
            <p className="section-description">This flow now follows the three-step design: account setup, company details, then optional verification with draft save support.</p>
            <RegisterBusinessForm locale={preferences.locale} initialEmail={params.email} />
          </article>
          <article className="info-card auth-card">
            <div className="card-kicker">Why register</div>
            <h2 style={{ margin: 0 }}>Built for purchasing teams, engineers, and repeat buyers</h2>
            <div className="support-list">
              {benefits.map((item) => (
                <div key={item} className="support-item">
                  <span className="support-bullet" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="auth-timeline">
              {timeline.map((item, index) => (
                <article key={item} className="auth-timeline-card">
                  <strong>Step {index + 1}</strong>
                  <p className="section-description">{item}</p>
                </article>
              ))}
            </div>
            <div className="inline-link-list">
              <Link href={withLocalePath('/login', preferences.locale)} className="section-link">
                Already have an account?
              </Link>
            </div>
          </article>
        </div>
      </section>
    </StorefrontFrame>
  );
}