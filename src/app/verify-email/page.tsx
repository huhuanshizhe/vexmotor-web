import Link from 'next/link';

import { VerifyEmailClient } from '@/components/account/verify-email-client';
import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildMetadata } from '@/lib/seo';

const verifyNotes = [
  'Verification links are valid for 24 hours and can only be used once.',
  'After verification, your account settings will show a verified timestamp.',
  'If you did not request this email, you can safely ignore it.',
];

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
    title: 'Verify email — STEPMOTECH',
    description: 'Confirm your STEPMOTECH account email address.',
    path: '/verify-email',
    noIndex: true,
    locale,
  });
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const preferences = await getServerSitePreferences();
  const params = await searchParams;
  const hasToken = Boolean(params.token);

  return (
    <StorefrontFrame
      eyebrow="Email Verification"
      title={hasToken ? 'Confirm your email' : 'Email verification'}
      description={
        hasToken
          ? 'Use the secure link from your email to confirm your sign-in address. The link expires 24 hours after it was sent.'
          : 'Open the verification link from your email to continue.'
      }
    >
      <section className="section">
        <div className="section-inner info-grid auth-grid">
          <article className="info-card auth-card">
            <div className="card-kicker">Account security</div>
            <h1 style={{ margin: 0 }}>{hasToken ? 'Verify your email address' : 'Email verification'}</h1>
            <p className="section-description">
              {hasToken
                ? 'Your verification link is checked automatically when this page loads. If it is still valid, confirm the account email below.'
                : 'A verification token is required to complete this step.'}
            </p>
            <VerifyEmailClient locale={preferences.locale} token={params.token} />
          </article>
          <article className="info-card auth-card">
            <div className="card-kicker">Verification policy</div>
            <h2 style={{ margin: 0 }}>What to expect</h2>
            <div className="support-list">
              {verifyNotes.map((item) => (
                <div key={item} className="support-item">
                  <span className="support-bullet" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="inline-link-list">
              <Link href={withLocalePath('/account/settings', preferences.locale)} className="section-link">
                Account settings
              </Link>
              <Link href={withLocalePath('/login', preferences.locale)} className="section-link">
                Return to login
              </Link>
            </div>
          </article>
        </div>
      </section>
    </StorefrontFrame>
  );
}
