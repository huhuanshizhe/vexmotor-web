'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { apiFetch } from '@/lib/api-client';
import { useToast } from '@C/toast';
import { parseLocaleFromPathname, withLocalePath } from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n-context';

type AddToCartButtonProps = {
  productId: string;
  moq?: number;
  showQuantitySelector?: boolean;
  redirectToCart?: boolean;
  showBuyNow?: boolean;
};

/** Dispatched after a successful add-to-cart so header cart count can update. */
export const CART_UPDATED_EVENT = 'vexmotor:cart-updated';

function notifyCartUpdated() {
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
}

export function AddToCartButton({ productId, moq = 1, showQuantitySelector = false, redirectToCart = false, showBuyNow = false }: AddToCartButtonProps) {
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
        await apiFetch('/api/front/cart', {
          method: 'POST',
          body: JSON.stringify({ productId, quantity }),
        });
      } catch {
        setMessage(t('common.error'));
        return;
      }

      notifyCartUpdated();
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
        await apiFetch('/api/front/cart', {
          method: 'POST',
          body: JSON.stringify({ productId, quantity }),
        });
      } catch {
        setMessage(t('common.error'));
        return;
      }

      notifyCartUpdated();
      const locale = parseLocaleFromPathname(pathname).locale;
      router.push(withLocalePath('/checkout', locale));
    });
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
