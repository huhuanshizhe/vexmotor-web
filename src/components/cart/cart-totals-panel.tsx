'use client';

import Link from 'next/link';

import { useTranslation } from '@/lib/i18n-context';
import { t as formatMessage } from '@/lib/i18n-formatter';
import type { CartDetail } from '@/lib/storefront-types';

type CartTotalsPanelProps = {
  cart: NonNullable<CartDetail>;
  checkoutPath: string;
  quotePath: string;
  productsPath: string;
  contactPath: string;
  message: string | null;
};

export function CartTotalsPanel({
  cart,
  checkoutPath,
  quotePath,
  productsPath,
  contactPath,
  message,
}: CartTotalsPanelProps) {
  const { t, locale } = useTranslation();
  const hasAdjustments =
    (cart.volumeDiscount && cart.volumeDiscount.amount > 0) ||
    (cart.coupon?.isApplied && cart.discount.amount > 0);

  return (
    <article className="cart-totals-panel">
      <header className="cart-totals-panel__header">
        <span className="cart-totals-panel__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 6h15l-1.5 9h-12L6 6Z" strokeLinejoin="round" />
            <path d="M6 6 5 3H2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="9" cy="20" r="1.4" fill="currentColor" stroke="none" />
            <circle cx="17" cy="20" r="1.4" fill="currentColor" stroke="none" />
          </svg>
        </span>
        <div className="cart-totals-panel__intro">
          <h2 className="cart-totals-panel__title">{t('cart.totalsTitle')}</h2>
          <p className="cart-totals-panel__meta">
            {formatMessage('cart.itemCount', { locale, count: cart.itemCount })} · {t('cart.estimatedShipping')}
          </p>
        </div>
      </header>

      <div className="cart-totals-panel__hero">
        <span className="cart-totals-panel__hero-label">{t('cart.subtotal')}</span>
        <strong className="cart-totals-panel__hero-amount">{cart.subtotal.formatted}</strong>
      </div>

      {hasAdjustments ? (
        <dl className="cart-totals-panel__adjustments">
          {cart.volumeDiscount && cart.volumeDiscount.amount > 0 ? (
            <div className="cart-totals-panel__adjustment-row">
              <dt>{t('cart.volumeDiscount')}</dt>
              <dd>-{cart.volumeDiscount.formatted}</dd>
            </div>
          ) : null}
          {cart.coupon?.isApplied && cart.discount.amount > 0 ? (
            <div className="cart-totals-panel__adjustment-row">
              <dt>{t('cart.couponDiscount', { code: cart.coupon.code })}</dt>
              <dd>-{cart.discount.formatted}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      <div className="cart-totals-panel__actions">
        <Link href={checkoutPath} className="button-primary cart-totals-panel__cta">
          {t('cart.proceedToCheckout')}
        </Link>
        <Link href={quotePath} className="button-secondary cart-totals-panel__cta cart-totals-panel__cta-secondary">
          {t('cart.convertToRfq')}
        </Link>
      </div>

      <div className="cart-totals-panel__links">
        <Link href={productsPath} className="cart-totals-panel__link">
          {t('cart.continueShopping')}
        </Link>
        <Link href={contactPath} className="cart-totals-panel__link">
          {t('cart.needQuoteSupport')}
        </Link>
      </div>

      {message ? <p className="cart-totals-panel__message">{message}</p> : null}
    </article>
  );
}
