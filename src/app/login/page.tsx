import Link from 'next/link';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildMetadata } from '@/lib/seo';
import { LoginForm } from '@/components/storefront/login-form';

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
  title: 'Sign in — STEPMOTECH',
  description: 'Access account orders, checkout, and inquiry records.',
  path: '/login',
  noIndex: true,
    locale,
  });
}

const authHighlights = [
  'View orders, quotes, invoices, and saved addresses from your member center.',
  'Resume checkout and account tasks without re-entering your details.',
  'Track quote requests and inquiry history in one place.',
  'Company accounts are ready to use right after registration.',
  'Update company profile, shipping addresses, and preferences anytime.',
];

function resolveCallbackUrl(input?: string) {
  if (!input || !input.startsWith('/') || input.startsWith('//')) {
    return '/account';
  }

  return input;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; next?: string; reset?: string; registered?: string; email?: string }>;
}) {
  const preferences = await getServerSitePreferences();
  const params = await searchParams;
  const callbackUrl = resolveCallbackUrl(params.next ?? params.callbackUrl);
  const notice = params.reset === '1'
    ? 'Password updated. Sign in with your new credentials.'
    : params.registered === '1'
      ? 'Business account created. Sign in to continue.'
      : null;

  return (
    <StorefrontFrame
      eyebrow="Sign In"
      title="Sign in to STEPMOTECH"
      description="Use your work account to continue checkout, track RFQs, and manage saved BOM-ready sourcing activity."
    >
      <section className="section">
        <div className="section-inner info-grid auth-grid">
          <article className="info-card auth-card">
            <div className="card-kicker">Account login</div>
            <h1 style={{ margin: 0 }}>Sign in to STEPMOTECH</h1>
            <p className="section-description">After sign-in, you will return to the requested protected page or the member center with a safe internal redirect.</p>
            <LoginForm callbackUrl={callbackUrl} initialEmail={params.email} initialNotice={notice} />
          </article>
          <article className="info-card auth-card">
            <div className="card-kicker">Why sign in</div>
            <h2 style={{ margin: 0 }}>One account for orders, quotes, and company details</h2>
            <p className="section-description">
              Your STEPMOTECH member account keeps purchasing activity, quote follow-up, and company information in one place so your team can buy faster and stay organized.
            </p>
            <div className="support-list">
              {authHighlights.map((item) => (
                <div key={item} className="support-item">
                  <span className="support-bullet" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="inline-link-list">
              <Link href={withLocalePath('/register', preferences.locale)} className="section-link">
                Register your company
              </Link>
              <Link href={withLocalePath('/password-reset', preferences.locale)} className="section-link">
                Reset password
              </Link>
              <Link href={withLocalePath('/account', preferences.locale)} className="section-link">
                Open member center
              </Link>
              <Link href={withLocalePath('/checkout', preferences.locale)} className="section-link">
                Go to checkout
              </Link>
            </div>
          </article>
        </div>
      </section>
    </StorefrontFrame>
  );
}
