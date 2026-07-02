import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { getServerSitePreferences, getServerTranslations } from '@/lib/i18n-server';
import { buildMetadata } from '@/lib/seo';
import { CompareClient } from '@/components/storefront/compare-client';

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  const { t } = getServerTranslations(locale);
  return buildMetadata({
    title: t('comparePage.metaTitle'),
    description: t('comparePage.metaDescription'),
    path: '/compare',
    noIndex: true,
    locale,
  });
}

export default async function ComparePage() {
  const preferences = await getServerSitePreferences();
  const { t } = getServerTranslations(preferences.locale);

  return (
    <StorefrontFrame
      eyebrow={t('comparePage.eyebrow')}
      title={t('comparePage.title')}
      description={t('comparePage.description')}
    >
      <section className="section">
        <div className="section-inner">
          <CompareClient locale={preferences.locale} />
        </div>
      </section>
    </StorefrontFrame>
  );
}
