import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { getServerSitePreferences, getServerTranslations } from '@/lib/i18n-server';
import { buildMetadata } from '@/lib/seo';

import { QuoteClient } from './quote-client';

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  const { t } = getServerTranslations(locale);
  return buildMetadata({
    title: t('quotePage.metaTitle'),
    description: t('quotePage.metaDescription'),
    path: '/quote',
    noIndex: true,
    locale,
  });
}

export default async function QuotePage() {
  const { locale } = await getServerSitePreferences();

  return (
    <StorefrontFrame>
      <div className="quote-rfq-shell">
        <QuoteClient locale={locale} />
      </div>
    </StorefrontFrame>
  );
}
