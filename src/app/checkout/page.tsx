import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { getServerSitePreferences, getServerTranslations } from '@/lib/i18n-server';
import { buildMetadata } from '@/lib/seo';
import { getCommerceConfig } from '@/lib/storefront-api';

import { CheckoutClient } from './checkout-client';

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  const { t } = getServerTranslations(locale);
  return buildMetadata({
    title: t('checkoutPage.metaTitle'),
    description: t('checkoutPage.metaDescription'),
    path: '/checkout',
    noIndex: true,
    locale,
  });
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ buyNow?: string; productId?: string; qty?: string; fromQuote?: string }>;
}) {
  const { locale } = await getServerSitePreferences();
  const commerceConfig = await getCommerceConfig(locale);
  const params = await searchParams;
  const buyNowProductId = params.buyNow === '1' && params.productId ? params.productId : undefined;
  const buyNowQuantity = buyNowProductId ? Math.max(1, Number(params.qty) || 1) : undefined;
  const fromQuoteNumber = params.fromQuote?.trim() || undefined;

  return (
    <StorefrontFrame>
      <section className="section">
        <div className="section-inner">
          <CheckoutClient
            cart={null}
            addresses={[]}
            guestMode={true}
            commerceConfig={commerceConfig}
            buyNowProductId={buyNowProductId}
            buyNowQuantity={buyNowQuantity}
            fromQuoteNumber={fromQuoteNumber}
          />
        </div>
      </section>
    </StorefrontFrame>
  );
}
