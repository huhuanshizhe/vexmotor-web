import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildMetadata } from '@/lib/seo';
import { getCommerceConfig } from '@/lib/storefront-api';

import { CheckoutClient } from './checkout-client';

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
    title: 'Checkout — STEPMOTECH',
    description: 'Secure one-page checkout for direct-buy orders.',
    path: '/checkout',
    noIndex: true,
    locale,
  });
}

export default async function CheckoutPage() {
  const commerceConfig = await getCommerceConfig();

  return (
    <StorefrontFrame>
      <section className="section">
        <div className="section-inner">
          <CheckoutClient cart={null} addresses={[]} guestMode={true} commerceConfig={commerceConfig} />
        </div>
      </section>
    </StorefrontFrame>
  );
}
