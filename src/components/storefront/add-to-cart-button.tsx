'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { apiFetch } from '@/lib/api-client';
import { CART_UPDATED_EVENT, notifyCartUpdatedFromResponse, type CartApiSnapshot } from '@/lib/cart-session';
import { useToast } from '@C/toast';
import { parseLocaleFromPathname, withLocalePath } from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n-context';

export { CART_UPDATED_EVENT };

type AddToCartButtonProps = {
  productId: string;
  moq?: number;
  showQuantitySelector?: boolean;
  redirectToCart?: boolean;
  showBuyNow?: boolean;
  compact?: boolean;
  bar?: boolean;
};

export function AddToCartButton({ productId, moq = 1, showQuantitySelector = false, redirectToCart = false, showBuyNow = false, compact = false, bar = false }: AddToCartButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { pushToast } = useToast();
  const { t } = useTranslation();
  const [message, setMessage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(Math.max(1, moq));
  const [isPending, startTransition] = useTransition();

  function updateQuantity(nextQuantity: number) {
    setQuantity(Math.max(moq, nextQuantity));
  }

  function handleAddToCart() {
    startTransition(async () => {
      setMessage(null);
      try {
        const cart = await apiFetch<CartApiSnapshot>('/api/front/cart', {
          method: 'POST',
          body: JSON.stringify({ productId, quantity }),
        });
        notifyCartUpdatedFromResponse(cart);
      } catch {
        setMessage(t('common.error'));
        return;
      }

      const locale = parseLocaleFromPathname(pathname).locale;

      if (redirectToCart) {
        router.push(withLocalePath('/cart', locale));
      } else {
        pushToast({
          title: t('product.addToCart'),
          description: `${quantity} ${quantity > 1 ? 'items' : 'item'} added.`,
          tone: 'success',
          actionLabel: t('header.cart'),
          actionHref: withLocalePath('/cart', locale),
        });
      }
    });
  }

  function handleBuyNow() {
    startTransition(async () => {
      setMessage(null);
      try {
        const cart = await apiFetch<CartApiSnapshot>('/api/front/cart', {
          method: 'POST',
          body: JSON.stringify({ productId, quantity }),
        });
        notifyCartUpdatedFromResponse(cart);
      } catch {
        setMessage(t('common.error'));
        return;
      }

      const locale = parseLocaleFromPathname(pathname).locale;
      router.push(withLocalePath('/checkout', locale));
    });
  }

  if (bar) {
    return (
      <button type="button" className="catalog-add-to-cart-bar" onClick={handleAddToCart} disabled={isPending}>
        {isPending ? t('common.loading') : t('product.addToCart')}
      </button>
    );
  }

  if (compact) {
    return (
      <button type="button" className="catalog-action-btn catalog-action-btn-primary" onClick={handleAddToCart} disabled={isPending}>
        {isPending ? t('common.loading') : t('product.addToCart')}
      </button>
    );
  }

  return (
    <div className="add-to-cart-stack">
      {showQuantitySelector ? (
        <div className="quantity-cart-row">
          <label className="quantity-control">
            <span className="summary-label">Qty</span>
            <div className="quantity-stepper">
              <button type="button" className="quantity-stepper-button" onClick={() => updateQuantity(quantity - 1)} disabled={isPending || quantity <= 1}>
                -
              </button>
              <input
                type="number"
                min={1}
                inputMode="numeric"
                className="quantity-stepper-input"
                value={quantity}
                onChange={(event) => updateQuantity(Number(event.target.value) || 1)}
                aria-label="Quantity"
                disabled={isPending}
              />
              <button type="button" className="quantity-stepper-button" onClick={() => updateQuantity(quantity + 1)} disabled={isPending}>
                +
              </button>
            </div>
          </label>

          <button type="button" className="button-primary quantity-cart-button" onClick={handleAddToCart} disabled={isPending}>
            {isPending ? t('common.loading') : t('product.addToCart')}
          </button>
        </div>
      ) : (
        <button type="button" className="button-primary" onClick={handleAddToCart} disabled={isPending}>
          {isPending ? t('common.loading') : t('product.addToCart')}
        </button>
      )}

      {message ? <span className="section-description">{message}</span> : null}

      {showBuyNow ? (
        <button type="button" className="button-secondary buy-now-button" onClick={handleBuyNow} disabled={isPending}>
          {isPending ? t('common.loading') : t('product.buyNow')}
        </button>
      ) : null}
    </div>
  );
}
