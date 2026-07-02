'use client';

import { useTranslation } from '@/lib/i18n-context';
import type { CheckoutPricingResult } from '@/lib/use-checkout-pricing';
import type { CartDetail } from '@/lib/storefront-types';

type StepItem = {
  label: string;
  complete: boolean;
};

type CheckoutOrderSummaryProps = {
  cart: NonNullable<CartDetail>;
  pricing: CheckoutPricingResult;
  stepItems: StepItem[];
  shippingComplete: boolean;
  paymentComplete: boolean;
  shippingMethodLabel: string;
  shippingEta?: string;
  shippingFreightLabel?: string;
  paymentMethod: string;
  canPlaceOrder: boolean;
  reviewBlockingMessage?: string | null;
  isPending: boolean;
  placeOrderHidden?: boolean;
  placeOrderLabel?: string;
  message: string | null;
  locale?: string;
  onPlaceOrder: () => void;
};

function formatMoney(amount: number, currency = 'USD', locale = 'en') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

function stepAnchorId(label: string) {
  return `#checkout-${label.toLowerCase()}`;
}

export function CheckoutOrderSummary({
  cart,
  pricing,
  stepItems,
  shippingComplete,
  paymentComplete,
  shippingMethodLabel,
  shippingEta,
  shippingFreightLabel,
  paymentMethod,
  canPlaceOrder,
  reviewBlockingMessage = null,
  isPending,
  placeOrderHidden = false,
  placeOrderLabel,
  message,
  locale = 'en',
  onPlaceOrder,
}: CheckoutOrderSummaryProps) {
  const { t } = useTranslation();
  const currency = cart.subtotal.currency;

  return (
    <article className="info-card checkout-summary-card" id="checkout-summary">
      <h2 className="cart-section-title">{t('checkout.orderSummary')}</h2>

      <nav className="checkout-progress-nav" aria-label={t('checkout.progressNav')}>
        {stepItems.map((step) => (
          <a
            key={step.label}
            href={stepAnchorId(step.label)}
            className={`checkout-progress-link${step.complete ? ' is-complete' : ''}`}
          >
            {step.label}
          </a>
        ))}
      </nav>

      {cart.coupon?.isApplied ? (
        <div className="cart-coupon-status is-applied">
          <strong>{cart.coupon.code}</strong>
          <span>{cart.coupon.description}</span>
        </div>
      ) : null}

      <div className="cart-summary-list">
        <div className="cart-summary-row">
          <span className="section-description">{t('cart.subtotal')}</span>
          <strong>{cart.subtotal.formatted}</strong>
        </div>
        {cart.discount.amount > 0 ? (
          <div className="cart-summary-row is-discount">
            <span className="section-description">{t('checkout.discount')}</span>
            <strong>-{cart.discount.formatted}</strong>
          </div>
        ) : null}
        <div className="cart-summary-row">
          <span className="section-description">{t('cart.shipping')}</span>
          <strong>
            {!pricing.isShippingAddressReady
              ? '—'
              : pricing.shippingAmount === 0
                ? t('checkout.free')
                : formatMoney(pricing.shippingAmount, currency, locale)}
          </strong>
        </div>
        <div className="cart-summary-row">
          <span className="section-description">{t('cart.tax')}</span>
          <strong>
            {!pricing.isShippingAddressReady ? '—' : formatMoney(pricing.taxAmount, currency, locale)}
          </strong>
        </div>
        <div className="cart-summary-row is-total">
          <span>{t('cart.total')}</span>
          <strong>{formatMoney(pricing.totalAmount, currency, locale)}</strong>
        </div>
      </div>

      {shippingComplete ? (
        <div className="checkout-selection-summary">
          <div className="checkout-selection-block">
            <span className="checkout-selection-label">{t('checkout.stepShipping')}</span>
            <strong>{shippingMethodLabel}</strong>
            {shippingEta || shippingFreightLabel ? (
              <span className="section-description">
                {[shippingEta, shippingFreightLabel].filter(Boolean).join(' · ')}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {paymentComplete ? (
        <div className="checkout-selection-summary">
          <div className="checkout-selection-block">
            <span className="checkout-selection-label">{t('checkout.paymentMethod')}</span>
            <strong>{paymentMethod}</strong>
          </div>
        </div>
      ) : null}

      {placeOrderHidden ? (
        placeOrderLabel ? <p className="section-description">{placeOrderLabel}</p> : null
      ) : (
        <>
          {!canPlaceOrder && reviewBlockingMessage ? (
            <p className="form-feedback form-feedback-error checkout-place-order-hint">{reviewBlockingMessage}</p>
          ) : null}
          <button
            type="button"
            className={`button-primary${canPlaceOrder ? '' : ' is-muted'}`}
            onClick={onPlaceOrder}
            disabled={isPending}
            aria-disabled={!canPlaceOrder || isPending}
          >
            {isPending
              ? t('common.loading')
              : (placeOrderLabel ?? `${t('checkout.placeOrder')} ${formatMoney(pricing.totalAmount, currency, locale)}`)}
          </button>
        </>
      )}
      {message ? <p className="form-feedback form-feedback-error">{message}</p> : null}
    </article>
  );
}
