'use client';

import { useState, useTransition } from 'react';

import { QuoteImageLightbox } from '@/components/quote/quote-image-lightbox';
import { CartLineItem } from '@/components/cart/cart-line-item';
import { removeCartItem, syncCartResponse, updateCartItemQuantity } from '@/lib/cart-api';
import type { CommerceConfig } from '@/lib/commerce-config';
import type { Locale } from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n-context';
import type { CartDetail } from '@/lib/storefront-types';

type CartLineItemListProps = {
  cart: NonNullable<CartDetail>;
  locale: Locale;
  commerceConfig: CommerceConfig;
  onCartChange: (cart: CartDetail) => void;
  onMessage?: (message: string | null) => void;
  mode?: 'cart' | 'buyNow' | 'quote';
  readOnlyQuantities?: boolean;
  showStockStatus?: boolean;
  onBuyNowQuantityChange?: (quantity: number) => void;
  onBuyNowRemove?: () => void;
};

export function CartLineItemList({
  cart,
  locale,
  commerceConfig,
  onCartChange,
  onMessage,
  mode = 'cart',
  readOnlyQuantities = false,
  showStockStatus = false,
  onBuyNowQuantityChange,
  onBuyNowRemove,
}: CartLineItemListProps) {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [previewImage, setPreviewImage] = useState<{ url: string; alt: string } | null>(null);
  const isBuyNow = mode === 'buyNow';
  const isReadOnly = readOnlyQuantities || mode === 'quote';

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
        handleCartUpdate(await updateCartItemQuantity(itemId, quantity, locale));
      } catch {
        onMessage?.(t('cart.updateQuantityFailed'));
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
        handleCartUpdate(await removeCartItem(itemId, locale));
      } catch {
        onMessage?.(t('cart.removeFailed'));
      }
    });
  }

  return (
    <>
      <div className="cart-line-item-list cart-line-item-list--compact">
        {cart.items.map((item) => (
          <CartLineItem
            key={item.id}
            item={item}
            locale={locale}
            commerceConfig={commerceConfig}
            showStockStatus={showStockStatus}
            readOnlyQuantities={isReadOnly}
            isPending={isPending}
            t={t}
            onQuantityChange={(quantity) => updateQuantity(item.id, quantity)}
            onRemove={() => removeItem(item.id)}
            onPreviewImage={setPreviewImage}
          />
        ))}
      </div>

      {previewImage ? (
        <QuoteImageLightbox url={previewImage.url} alt={previewImage.alt} onClose={() => setPreviewImage(null)} />
      ) : null}
    </>
  );
}
