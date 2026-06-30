'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTransition } from 'react';

import { removeCartItem, syncCartResponse, updateCartItemQuantity } from '@/lib/cart-api';
import type { CommerceConfig } from '@/lib/commerce-config';
import type { Locale } from '@/lib/i18n';
import { withLocalePath } from '@/lib/i18n';
import { productSpuBadge } from '@/lib/product-sku';
import type { CartDetail } from '@/lib/storefront-types';
import { getNextVolumeTier } from '@/lib/volume-pricing';

type CartLineItemListProps = {
  cart: NonNullable<CartDetail>;
  locale: Locale;
  commerceConfig: CommerceConfig;
  onCartChange: (cart: CartDetail) => void;
  onMessage?: (message: string | null) => void;
  compact?: boolean;
  mode?: 'cart' | 'buyNow';
  onBuyNowQuantityChange?: (quantity: number) => void;
  onBuyNowRemove?: () => void;
  showStockStatus?: boolean;
};

export function CartLineItemList({
  cart,
  locale,
  commerceConfig,
  onCartChange,
  onMessage,
  compact = false,
  mode = 'cart',
  onBuyNowQuantityChange,
  onBuyNowRemove,
  showStockStatus = false,
}: CartLineItemListProps) {
  const [isPending, startTransition] = useTransition();
  const isBuyNow = mode === 'buyNow';

  function handleCartUpdate(nextCart: CartDetail) {
    onCartChange(syncCartResponse(nextCart));
  }

  function updateQuantity(itemId: string, quantity: number) {
    if (isBuyNow) {
      onBuyNowQuantityChange?.(quantity);
      return;
    }

    startTransition(async () => {
      onMessage?.(null);
      try {
        handleCartUpdate(await updateCartItemQuantity(itemId, quantity));
      } catch {
        onMessage?.('Unable to update quantity.');
      }
    });
  }

  function removeItem(itemId: string) {
    if (isBuyNow) {
      onBuyNowRemove?.();
      return;
    }

    startTransition(async () => {
      onMessage?.(null);
      try {
        handleCartUpdate(await removeCartItem(itemId));
      } catch {
        onMessage?.('Unable to remove item.');
      }
    });
  }

  return (
    <div className={`cart-line-item-list${compact ? ' cart-line-item-list--compact' : ''}`}>
      {cart.items.map((item) => {
        const nextTier = getNextVolumeTier(item.product.price.amount, item.product.price.currency, item.quantity, commerceConfig.volumePricingRules);

        return (
          <div key={item.id} className="cart-item-row">
            <Link href={withLocalePath(`/products/${item.product.slug}`, locale)} className="cart-item-media">
              {item.product.coverImage ? (
                <Image
                  src={item.product.coverImage.url}
                  alt={item.product.coverImage.alt || item.product.name}
                  fill
                  unoptimized
                  className="cart-item-image"
                  sizes="120px"
                />
              ) : (
                <span className="cart-item-image-fallback" title={`SPU ${item.product.spu || '—'}`}>
                  {productSpuBadge(item.product)}
                </span>
              )}
            </Link>

            <div className="cart-item-main">
              <div
                className={`cart-item-head${compact ? ' cart-item-head--compact' : ''}${compact && showStockStatus ? ' cart-item-head--with-stock' : ''}`}
              >
                {compact && showStockStatus ? (
                  <>
                    <h3 className="cart-item-title cart-item-head__title">
                      <Link href={withLocalePath(`/products/${item.product.slug}`, locale)} className="cart-item-title-link">
                        {item.product.name}
                      </Link>
                    </h3>
                    <p className="product-meta cart-item-head__spu">SPU {item.product.spu || '—'}</p>
                    <span className={`cart-stock-status cart-stock-status--head-row${item.product.inStock ? ' is-in-stock' : ''}`}>
                      {item.product.inStock ? 'In stock' : 'Lead time required'}
                    </span>
                    <div className="cart-line-price-block cart-item-head__subtotal">
                      <strong className="cart-line-subtotal-amount">{item.subtotal.formatted}</strong>
                      <span className="product-meta">Line subtotal</span>
                    </div>
                    <div className="cart-item-pricing-strip cart-item-head__pricing">
                      <strong className="cart-item-pricing-strip__price">{item.unitPrice.formatted}</strong>
                      <span className="cart-item-pricing-strip__unit">/ unit</span>
                      {item.tierApplied && item.listUnitPrice ? (
                        <span className="cart-item-pricing-strip__ref">Tier · list {item.listUnitPrice.formatted}</span>
                      ) : item.product.compareAtPrice ? (
                        <span className="cart-item-pricing-strip__ref">Ref {item.product.compareAtPrice.formatted}</span>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="cart-item-head-main">
                      <h3 className="cart-item-title">
                        <Link href={withLocalePath(`/products/${item.product.slug}`, locale)} className="cart-item-title-link">
                          {item.product.name}
                        </Link>
                      </h3>
                      <p className="product-meta">SPU {item.product.spu || '—'}</p>
                      {!compact && item.product.shortDescription ? <p className="section-description">{item.product.shortDescription}</p> : null}
                      {compact ? (
                        <div className="cart-item-pricing-strip">
                          <strong className="cart-item-pricing-strip__price">{item.unitPrice.formatted}</strong>
                          <span className="cart-item-pricing-strip__unit">/ unit</span>
                          {item.tierApplied && item.listUnitPrice ? (
                            <span className="cart-item-pricing-strip__ref">Tier · list {item.listUnitPrice.formatted}</span>
                          ) : item.product.compareAtPrice ? (
                            <span className="cart-item-pricing-strip__ref">Ref {item.product.compareAtPrice.formatted}</span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    <div className="cart-line-price-block">
                      <strong className="cart-line-subtotal-amount">{item.subtotal.formatted}</strong>
                      <span className="product-meta">Line subtotal</span>
                    </div>
                  </>
                )}
              </div>

              {compact ? (
                <>
                  {nextTier ? (
                    <div className="cart-tier-callout cart-tier-callout--compact">
                      Add {nextTier.unitsToGo} more for {nextTier.unitPriceLabel} each ({nextTier.rangeLabel} pcs)
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="cart-item-meta-row">
                    <div className="cart-unit-price">
                      <span className="summary-label">Unit price</span>
                      <strong>{item.unitPrice.formatted}</strong>
                      {item.tierApplied && item.listUnitPrice ? (
                        <span className="comparison-note">Tier price · list {item.listUnitPrice.formatted}</span>
                      ) : item.product.compareAtPrice ? (
                        <span className="comparison-note">Reference {item.product.compareAtPrice.formatted}</span>
                      ) : null}
                    </div>
                    <span className={`cart-stock-status${item.product.inStock ? ' is-in-stock' : ''}`}>
                      {item.product.inStock ? 'In stock' : 'Lead time required'}
                    </span>
                  </div>

                  {nextTier ? (
                    <div className="cart-tier-callout">
                      Add {nextTier.unitsToGo} more for {nextTier.unitPriceLabel} each ({nextTier.rangeLabel} pcs)
                    </div>
                  ) : null}
                </>
              )}

              <div className="cart-item-actions">
                <div className="quantity-stepper cart-quantity-stepper">
                  <button type="button" className="quantity-stepper-button" onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} disabled={isPending || item.quantity <= 1}>
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    className="quantity-stepper-input"
                    value={item.quantity}
                    onChange={(event) => updateQuantity(item.id, Math.max(1, Number(event.target.value) || 1))}
                    aria-label={`Quantity for ${item.product.name}`}
                    disabled={isPending}
                  />
                  <button type="button" className="quantity-stepper-button" onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={isPending}>
                    +
                  </button>
                </div>

                {!compact ? (
                  <Link href={withLocalePath(`/products/${item.product.slug}`, locale)} className="cart-view-product-link">
                    View product
                  </Link>
                ) : null}

                <button
                  type="button"
                  className="cart-item-remove-link"
                  onClick={() => removeItem(item.id)}
                  disabled={isPending}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
