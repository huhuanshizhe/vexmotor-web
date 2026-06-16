import Link from 'next/link';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { PasswordResetForm } from '@/components/storefront/password-reset-form';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildMetadata } from '@/lib/seo';

const resetNotes = [
  'Request mode always returns a generic success message to avoid account enumeration.',
  'Reset tokens are single-use and expire automatically.',
  'Completing the reset upgrades pending accounts to active sign-in status in the current implementation.',
];

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
  title: 'Password reset — STEPMOTECH',
  description: 'Request or complete a password reset for your business account.',
  path: '/password-reset',
  noIndex: true,
    locale,
  });
}

export default async function PasswordResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const preferences = await getServerSitePreferences();
  const params = await searchParams;

  return (
    <StorefrontFrame
      eyebrow="Password Reset"
      title={params.token ? 'Set a new password' : 'Forgot your password?'}
      description="Request a reset link or complete a token-based reset without leaving the storefront auth flow."
    >
      <section className="section">
        <div className="section-inner info-grid auth-grid">
          <article className="info-card auth-card">
            <div className="card-kicker">Self-service recovery</div>
            <h1 style={{ margin: 0 }}>{params.token ? 'Choose a new password' : 'Forgot your password?'}</h1>
            <p className="section-description">{params.token ? 'This token-driven reset keeps the flow on a single page with strength guidance and clear invalid-token handling.' : 'Enter your work email and we will prepare a reset link without exposing whether the account exists.'}</p>
            <PasswordResetForm locale={preferences.locale} token={params.token} />
          </article>
          <article className="info-card auth-card">
            <div className="card-kicker">Reset policy</div>
            <h2 style={{ margin: 0 }}>What to expect</h2>
            <div className="support-list">
              {resetNotes.map((item) => (
                <div key={item} className="support-item">
                  <span className="support-bullet" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="inline-link-list">
              <Link href={withLocalePath('/login', preferences.locale)} className="section-link">
                Return to login
              </Link>
              <Link href={withLocalePath('/register', preferences.locale)} className="section-link">
                Create a business account
              </Link>
            </div>
          </article>
        </div>
      </section>
    </StorefrontFrame>
  );
}