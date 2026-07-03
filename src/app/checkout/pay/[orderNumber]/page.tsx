import { Suspense } from 'react';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { getServerSitePreferences, getServerTranslations } from '@/lib/i18n-server';
import { fetchUiStringGroups } from '@/lib/ui-strings-client';
import { buildMetadata } from '@/lib/seo';

import { CheckoutPaymentClient } from './checkout-payment-client';

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  const uiStrings = await fetchUiStringGroups(locale, ['checkoutPayment']).catch(() => ({}));
  const { t } = getServerTranslations(locale, uiStrings);
  return buildMetadata({
    title: t('checkoutPayment.metaTitle'),
    description: t('checkoutPayment.metaDescription'),
    path: '/checkout/pay',
    noIndex: true,
    locale,
  });
}

export default async function CheckoutPaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ guestToken?: string }>;
}) {
  const { orderNumber } = await params;
  const { guestToken } = await searchParams;
  const { locale } = await getServerSitePreferences();
  const uiStrings = await fetchUiStringGroups(locale, ['checkoutPayment']).catch(() => ({}));
  const { t } = getServerTranslations(locale, uiStrings);

  return (
    <StorefrontFrame>
      <section className="section payment-gateway-page">
        <div className="section-inner">
          <Suspense fallback={<div className="payment-gateway-status">{t('checkoutPayment.loadingPage')}</div>}>
            <CheckoutPaymentClient orderNumber={orderNumber} guestToken={guestToken} />
          </Suspense>
        </div>
      </section>
    </StorefrontFrame>
  );
}
