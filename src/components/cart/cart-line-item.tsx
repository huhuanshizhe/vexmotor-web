'use client';

import Image from 'next/image';
import Link from 'next/link';

import type { CommerceConfig } from '@/lib/commerce-config';
import type { Locale } from '@/lib/i18n';
import { withLocalePath } from '@/lib/i18n';
import { productSpuBadge } from '@/lib/product-spu';
import type { CartDetail } from '@/lib/storefront-types';
import { getNextVolumeTier } from '@/lib/volume-pricing';

type CartLine = NonNullable<CartDetail>['items'][number];

type CartLineItemProps = {
  item: CartLine;
  locale: Locale;
  commerceConfig: CommerceConfig;
  showStockStatus?: boolean;
  readOnlyQuantities?: boolean;
  isPending?: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  onPreviewImage: (image: { url: string; alt: string }) => void;
};

export function CartLineItem({
  item,
  locale,
  commerceConfig,
  showStockStatus = false,
  readOnlyQuantities = false,
  isPending = false,
  t,
  onQuantityChange,
  onRemove,
  onPreviewImage,
}: CartLineItemProps) {
  const nextTier = getNextVolumeTier(
    item.product.price.amount,
    item.product.price.currency,
    item.quantity,
    commerceConfig.volumePricingRules,
  );
  const productHref = withLocalePath(`/products/${item.product.slug}`, locale);
  const coverAlt = item.product.coverImage?.alt || item.product.name;

  return (
    <div className="cart-item-row">
      {item.product.coverImage ? (
        <button
          type="button"
          className="cart-item-media cart-item-media--preview"
          onClick={() => onPreviewImage({ url: item.product.coverImage!.url, alt: coverAlt })}
          aria-label={t('cart.previewImage', { name: item.product.name })}
        >
          <Image
            src={item.product.coverImage.url}
            alt={coverAlt}
            fill
            unoptimized
            className="cart-item-image"
            sizes="120px"
          />
          <span className="cart-item-media-zoom" aria-hidden="true">
            ⌕
          </span>
        </button>
      ) : (
        <span className="cart-item-media cart-item-media--static" aria-hidden="true">
          <span className="cart-item-image-fallback" title={`SPU ${item.product.spu || '—'}`}>
            {productSpuBadge(item.product)}
          </span>
        </span>
      )}

      <div className="cart-item-main">
        <div
          className={`cart-item-head cart-item-head--compact${showStockStatus ? ' cart-item-head--with-stock' : ''}`}
        >
          <h3 className="cart-item-title cart-item-head__title">
            <Link href={productHref} className="cart-item-title-link">
              {item.product.name}
            </Link>
          </h3>
          <p className="product-meta cart-item-head__spu">
            {t('product.spu')} {item.product.spu || '—'}
          </p>
          {showStockStatus ? (
            <span className={`cart-stock-status cart-stock-status--head-row${item.product.inStock ? ' is-in-stock' : ''}`}>
              {item.product.inStock ? t('cart.inStock') : t('cart.leadTimeRequired')}
            </span>
          ) : null}
          <div className="cart-line-price-block cart-item-head__subtotal">
            <strong className="cart-line-subtotal-amount">{item.subtotal.formatted}</strong>
            <span className="product-meta">{t('cart.lineSubtotal')}</span>
          </div>
          <div className="cart-item-pricing-strip cart-item-head__pricing">
            <strong className="cart-item-pricing-strip__price">{item.unitPrice.formatted}</strong>
            <span className="cart-item-pricing-strip__unit">{t('cart.perUnit')}</span>
            {item.tierApplied && item.listUnitPrice ? (
              <span className="cart-item-pricing-strip__ref">
                {t('cart.tierList', { price: item.listUnitPrice.formatted })}
              </span>
            ) : item.listUnitPrice && item.unitPrice.amount < item.listUnitPrice.amount ? (
              <span className="cart-item-pricing-strip__ref cart-item-pricing-strip__ref--struck">
                {t('cart.listPrice', { price: item.listUnitPrice.formatted })}
              </span>
            ) : item.product.compareAtPrice ? (
              <span className="cart-item-pricing-strip__ref">
                {t('cart.refPrice', { price: item.product.compareAtPrice.formatted })}
              </span>
            ) : null}
          </div>
        </div>

        {nextTier ? (
          <div className="cart-tier-callout cart-tier-callout--compact">
            {t('cart.volumeTierHint', {
              count: nextTier.unitsToGo,
              price: nextTier.unitPriceLabel,
              range: nextTier.rangeLabel,
            })}
          </div>
        ) : null}

        {readOnlyQuantities ? (
          <div className="cart-item-meta-row">
            <div className="cart-unit-price">
              <span className="summary-label">{t('product.quantity')}</span>
              <strong>{item.quantity}</strong>
            </div>
            <div className="cart-unit-price">
              <span className="summary-label">{t('cart.unitPrice')}</span>
              <strong>{item.unitPrice.formatted}</strong>
            </div>
          </div>
        ) : (
          <div className="cart-item-actions">
            <div className="quantity-stepper cart-quantity-stepper">
              <button
                type="button"
                className="quantity-stepper-button"
                onClick={() => onQuantityChange(Math.max(1, item.quantity - 1))}
                disabled={isPending || item.quantity <= 1}
              >
                -
              </button>
              <input
                type="number"
                min={1}
                inputMode="numeric"
                className="quantity-stepper-input"
                value={item.quantity}
                onChange={(event) => onQuantityChange(Math.max(1, Number(event.target.value) || 1))}
                aria-label={t('cart.quantityFor', { name: item.product.name })}
                disabled={isPending}
              />
              <button
                type="button"
                className="quantity-stepper-button"
                onClick={() => onQuantityChange(item.quantity + 1)}
                disabled={isPending}
              >
                +
              </button>
            </div>

            <button type="button" className="cart-item-remove-link" onClick={onRemove} disabled={isPending}>
              {t('cart.remove')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
