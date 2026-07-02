import Link from 'next/link';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences, getServerTranslations } from '@/lib/i18n-server';
import { buildMetadata } from '@/lib/seo';
import { LoginForm } from '@/components/storefront/login-form';

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  const { t } = getServerTranslations(locale);
  return buildMetadata({
    title: t('loginPage.metaTitle'),
    description: t('loginPage.metaDescription'),
    path: '/login',
    noIndex: true,
    locale,
  });
}

const authHighlightKeys = [
  'loginPage.highlight1',
  'loginPage.highlight2',
  'loginPage.highlight3',
  'loginPage.highlight4',
  'loginPage.highlight5',
] as const;

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
  const { t } = getServerTranslations(preferences.locale);
  const params = await searchParams;
  const callbackUrl = resolveCallbackUrl(params.next ?? params.callbackUrl);
  const notice = params.reset === '1'
    ? t('loginPage.passwordUpdated')
    : params.registered === '1'
      ? t('loginPage.accountCreated')
      : null;

  return (
    <StorefrontFrame
      eyebrow={t('loginPage.eyebrow')}
      title={t('loginPage.title')}
      description={t('loginPage.description')}
    >
      <section className="section">
        <div className="section-inner info-grid auth-grid">
          <article className="info-card auth-card">
            <div className="card-kicker">{t('loginPage.kicker')}</div>
            <h1 style={{ margin: 0 }}>{t('loginPage.title')}</h1>
            <p className="section-description">{t('loginPage.formDesc')}</p>
            <LoginForm callbackUrl={callbackUrl} initialEmail={params.email} initialNotice={notice} />
          </article>
          <article className="info-card auth-card">
            <div className="card-kicker">{t('loginPage.whySignInKicker')}</div>
            <h2 style={{ margin: 0 }}>{t('loginPage.whySignInTitle')}</h2>
            <p className="section-description">{t('loginPage.whySignInDesc')}</p>
            <div className="support-list">
              {authHighlightKeys.map((key) => (
                <div key={key} className="support-item">
                  <span className="support-bullet" />
                  <span>{t(key)}</span>
                </div>
              ))}
            </div>
            <div className="inline-link-list">
              <Link href={withLocalePath('/register', preferences.locale)} className="section-link">
                {t('loginPage.registerCompany')}
              </Link>
              <Link href={withLocalePath('/password-reset', preferences.locale)} className="section-link">
                {t('loginPage.resetPassword')}
              </Link>
              <Link href={withLocalePath('/account', preferences.locale)} className="section-link">
                {t('loginPage.openMemberCenter')}
              </Link>
              <Link href={withLocalePath('/checkout', preferences.locale)} className="section-link">
                {t('loginPage.goToCheckout')}
              </Link>
            </div>
          </article>
        </div>
      </section>
    </StorefrontFrame>
  );
}
