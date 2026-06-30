'use client';

type CheckoutFreeShippingBannerProps = {
  freeShippingThresholdAmount: number;
  remainingForFreeShippingAmount: number;
  subtotalAmount: number;
  currency?: string;
  locale?: string;
};

function formatMoney(amount: number, currency = 'USD', locale = 'en') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

export function CheckoutFreeShippingBanner({
  freeShippingThresholdAmount,
  remainingForFreeShippingAmount,
  subtotalAmount,
  currency = 'USD',
  locale = 'en',
}: CheckoutFreeShippingBannerProps) {
  if (freeShippingThresholdAmount <= 0) {
    return null;
  }

  const unlocked = remainingForFreeShippingAmount <= 0;
  const progress = Math.min((subtotalAmount / Math.max(freeShippingThresholdAmount, 1)) * 100, 100);

  return (
    <div className={`checkout-free-shipping-banner${unlocked ? ' is-unlocked' : ''}`}>
      <div className="checkout-free-shipping-banner-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13" rx="2" />
          <path d="M16 8h4l3 5v3h-7V8z" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      </div>
      <div className="checkout-free-shipping-banner-body">
        <strong>
          {unlocked
            ? 'Free shipping unlocked for this order'
            : `Spend ${formatMoney(remainingForFreeShippingAmount, currency, locale)} more to get free shipping`}
        </strong>
        <div className="trade-progress-bar" aria-hidden="true">
          <span className="trade-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
