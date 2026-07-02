'use client';

import { useState, useTransition } from 'react';

import { applyCartCoupon, syncCartResponse } from '@/lib/cart-api';
import { useTranslation } from '@/lib/i18n-context';
import type { CartDetail } from '@/lib/storefront-types';

type CouponSectionProps = {
  cart: NonNullable<CartDetail>;
  onCartChange: (cart: CartDetail) => void;
  onMessage?: (message: string | null) => void;
};

export function CouponSection({ cart, onCartChange, onMessage }: CouponSectionProps) {
  const { t } = useTranslation();
  const [couponCode, setCouponCode] = useState(cart.couponCode ?? '');
  const [isPending, startTransition] = useTransition();

  function applyCoupon(nextCouponCode?: string | null) {
    startTransition(async () => {
      onMessage?.(null);
      try {
        const nextCart = await applyCartCoupon(nextCouponCode ?? (couponCode.trim() || null));
        if (!nextCart) return;
        onCartChange(syncCartResponse(nextCart));
        setCouponCode(nextCart.couponCode ?? '');
        const submittedCode = nextCouponCode ?? (couponCode.trim() || null);
        if (!submittedCode) {
          onMessage?.(t('checkout.couponRemoved'));
        } else if (nextCart.coupon?.isApplied) {
          onMessage?.(t('checkout.couponApplied'));
        } else if (nextCart.coupon?.message) {
          onMessage?.(nextCart.coupon.message);
        }
      } catch (error) {
        onMessage?.(error instanceof Error ? error.message : t('checkout.couponUpdateFailed'));
      }
    });
  }

  return (
    <article className="info-card checkout-coupon-card" id="checkout-coupon">
      <h2 className="cart-section-title">{t('checkout.coupon')}</h2>
      <div className="coupon-form-row">
        <input
          type="text"
          className="form-input"
          placeholder={t('checkout.couponPlaceholder')}
          value={couponCode}
          onChange={(event) => setCouponCode(event.target.value)}
          disabled={isPending}
        />
        <button type="button" className="button-secondary cart-action-button" onClick={() => applyCoupon()} disabled={isPending}>
          {t('checkout.apply')}
        </button>
        {cart.couponCode ? (
          <button type="button" className="button-secondary cart-action-button" onClick={() => applyCoupon(null)} disabled={isPending}>
            {t('checkout.remove')}
          </button>
        ) : null}
      </div>
      {cart.coupon && (cart.coupon.description || cart.coupon.message) ? (
        <div className={`cart-coupon-status ${cart.coupon.isApplied ? 'is-applied' : 'is-inactive'}`}>
          {cart.coupon.description ? <span>{cart.coupon.description}</span> : null}
          {cart.coupon.message ? <span>{cart.coupon.message}</span> : null}
        </div>
      ) : null}
    </article>
  );
}
