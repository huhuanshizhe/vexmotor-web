import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildMetadata } from '@/lib/seo';
import { getCommerceConfig, getHomeData } from '@/lib/storefront-api';

import { CartClient } from './cart-client';

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
    title: 'Cart — STEPMOTECH',
    description: 'Review line items before checkout or quote submission.',
    path: '/cart',
    noIndex: true,
    locale,
  });
}

export default async function CartPage() {
  const { locale } = await getServerSitePreferences();
  const [homeData, commerceConfig] = await Promise.all([getHomeData(), getCommerceConfig(locale)]);

  return (
    <StorefrontFrame>
      <section className="section">
        <div className="section-inner">
          <CartClient
            initialCart={null}
            locale={locale}
            crossSellProducts={homeData.mostViewedProducts.slice(0, 3)}
            emptyStateCategories={homeData.featuredCategories.slice(0, 3)}
            commerceConfig={commerceConfig}
          />
        </div>
      </section>
    </StorefrontFrame>
  );
}
