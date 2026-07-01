'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { CartCompatibleProducts } from '@/components/cart/cart-compatible-products';
import { CartLineItemList } from '@/components/cart/cart-line-item-list';
import { CartTotalsPanel } from '@/components/cart/cart-totals-panel';
import { apiFetch } from '@/lib/api-client';
import type { CommerceConfig } from '@/lib/commerce-config';
import type { Locale } from '@/lib/i18n';
import { withLocalePath } from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n-context';
import type { CartDetail, StorefrontProductCard } from '@/lib/storefront-types';

type EmptyStateCategory = {
  id: string;
  name: string;
  slug: string;
};

type CartClientProps = {
  initialCart: CartDetail;
  locale: Locale;
  crossSellProducts: StorefrontProductCard[];
  emptyStateCategories: EmptyStateCategory[];
  commerceConfig: CommerceConfig;
};

export function CartClient({ initialCart, locale, crossSellProducts, emptyStateCategories, commerceConfig }: CartClientProps) {
  const { t } = useTranslation();
  const [cart, setCart] = useState<CartDetail>(initialCart);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialCart) {
      return;
    }

    void apiFetch<CartDetail>('/api/front/cart')
      .then((detail) => setCart(detail))
      .catch(() => setCart(null));
  }, [initialCart]);

  const productsPath = withLocalePath('/products', locale);
  const quotePath = withLocalePath('/quote?cartOverlay=1', locale);
  const volumePricingPath = withLocalePath('/volume-pricing', locale);
  const contactPath = withLocalePath('/contact', locale);
  const checkoutPath = withLocalePath('/checkout', locale);
  const selectorPath = withLocalePath('/selector', locale);

  return (
    <div className="trade-flow-stack cart-page-stack">
      {!cart || !cart.items.length ? (
        <article className="info-card trade-empty-card">
          <div className="section-header trade-card-header">
            <div>
              <h2 className="cart-section-title">{t('cart.emptyTitle')}</h2>
              <p className="section-description">{t('cart.emptyDescription')}</p>
            </div>
            <span className="product-badge">Ready for direct buy or RFQ</span>
          </div>
          <div className="trade-empty-actions">
            <Link href={selectorPath} className="button-primary">Start with Selector</Link>
            <Link href={volumePricingPath} className="button-secondary">Explore Volume Pricing</Link>
            <Link href={quotePath} className="button-secondary product-back-link">Build RFQ Instead</Link>
          </div>
          {emptyStateCategories.length ? (
            <div className="cart-empty-category-grid">
              {emptyStateCategories.map((category) => (
                <Link key={category.id} href={withLocalePath(`/c/${category.slug}`, locale)} className="sidebar-link">
                  <span>{category.name}</span>
                  <span className="card-kicker">Browse family</span>
                </Link>
              ))}
            </div>
          ) : null}
        </article>
      ) : (
        <div className="trade-flow-grid cart-page-layout">
          <div className="trade-main-stack cart-page-main-stack">
            <article className="info-card cart-items-card">
              <div className="section-header trade-card-header">
                <div>
                  <h2 className="cart-section-title">{t('cart.title')}</h2>
                  <p className="section-description">{cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'} ready for checkout</p>
                </div>
              </div>

              <CartLineItemList
                cart={cart}
                locale={locale}
                commerceConfig={commerceConfig}
                onCartChange={(nextCart) => setCart(nextCart)}
                onMessage={setMessage}
                compact
                showStockStatus
              />
            </article>

            <CartCompatibleProducts
              products={crossSellProducts}
              locale={locale}
              title={t('product.compatibleProducts')}
              requestQuoteLabel={t('product.requestQuote')}
            />
          </div>

          <aside className="trade-side-stack cart-page-sidebar">
            <CartTotalsPanel
              cart={cart}
              checkoutPath={checkoutPath}
              quotePath={quotePath}
              productsPath={productsPath}
              contactPath={contactPath}
              message={message}
            />
          </aside>
        </div>
      )}
    </div>
  );
}
