'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';

import { apiFetch } from '@/lib/api-client';
import { notifyCartUpdatedFromResponse, type CartApiSnapshot } from '@/lib/cart-session';
import { AddToCartButton } from '@/components/storefront/add-to-cart-button';
import { calculateOrderPricing, type CommerceConfig } from '@/lib/commerce-config';
import type { Locale } from '@/lib/i18n';
import { withLocalePath } from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n-context';
import { buildShippingOptions, getShippingCountryOptions } from '@/lib/shipping';
import { getNextVolumeTier } from '@/lib/volume-pricing';

type Money = {
  currency: string;
  amount: number;
  formatted: string;
};

function resolveProductSku(product: { sku?: string | null; spu?: string | null }) {
  return product.sku?.trim() || product.spu?.trim() || '';
}

function productSkuBadge(product: { sku?: string | null; spu?: string | null }) {
  const code = resolveProductSku(product);
  return code.slice(0, 3).toUpperCase() || '—';
}

type CartDetail = {
  id: string;
  couponCode?: string | null;
  coupon?: {
    code: string;
    description: string;
    isApplied: boolean;
    message: string | null;
  } | null;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    listUnitPrice?: Money;
    unitPrice: Money;
    subtotal: Money;
    tierApplied?: boolean;
    product: {
      id: string;
      name: string;
      slug: string;
      sku?: string;
      spu?: string;
      shortDescription?: string | null;
      purchaseMode: 'buy' | 'inquiry';
      inStock: boolean;
      price: Money;
      compareAtPrice?: Money | null;
      coverImage?: {
        id: string;
        url: string;
        alt: string;
        width?: number | null;
        height?: number | null;
      } | null;
    };
  }>;
  itemCount: number;
  subtotal: Money;
  volumeDiscount?: Money;
  discount: Money;
  shipping: Money;
  tax: Money;
  total: Money;
  freeShippingThreshold: Money;
  remainingForFreeShipping: Money;
} | null;

type CrossSellProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription?: string | null;
  coverImage?: {
    id: string;
    url: string;
    alt: string;
  } | null;
  price: Money;
  purchaseMode: 'buy' | 'inquiry';
};

type EmptyStateCategory = {
  id: string;
  name: string;
  slug: string;
};

type CartClientProps = {
  initialCart: CartDetail;
  locale: Locale;
  hasAccountContext: boolean;
  crossSellProducts: CrossSellProduct[];
  emptyStateCategories: EmptyStateCategory[];
  commerceConfig: CommerceConfig;
};

export function CartClient({ initialCart, locale, hasAccountContext, crossSellProducts, emptyStateCategories, commerceConfig }: CartClientProps) {
  const { t } = useTranslation();

  function formatMoney(amount: number, currency = 'USD') {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  }
  const [cart, setCart] = useState<CartDetail>(initialCart);
  const [couponCode, setCouponCode] = useState(initialCart?.couponCode ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [shippingCountry, setShippingCountry] = useState(commerceConfig.defaultCountryCode);
  const [postalCode, setPostalCode] = useState('');
  const [selectedShippingOptionId, setSelectedShippingOptionId] = useState(commerceConfig.defaultShippingMethodCode);
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState('');
  const [buyerNote, setBuyerNote] = useState('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (initialCart) {
      return;
    }

    void apiFetch<CartDetail>('/api/front/cart')
      .then((detail) => {
        setCart(detail);
        setCouponCode(detail?.couponCode ?? '');
      })
      .catch(() => {
        setCart(null);
      });
  }, [initialCart]);

  const productsPath = withLocalePath('/products', locale);
  const selectorPath = withLocalePath('/selector', locale);
  const quotePath = withLocalePath('/quote', locale);
  const samplePath = withLocalePath('/sample', locale);
  const volumePricingPath = withLocalePath('/volume-pricing', locale);
  const contactPath = withLocalePath('/contact', locale);
  const checkoutPath = withLocalePath('/checkout', locale);
  const searchPath = withLocalePath('/search', locale);

  const shippingCountryOptions = getShippingCountryOptions(commerceConfig);
  const shippingOptions = buildShippingOptions(shippingCountry, cart?.subtotal.amount ?? 0, commerceConfig);
  const estimatedPricing = cart
    ? calculateOrderPricing(commerceConfig, {
        subtotal: cart.subtotal.amount,
        discountAmount: cart.discount.amount,
        countryCode: shippingCountry,
        shippingMethodCode: selectedShippingOptionId,
      })
    : null;
  const selectedShippingOption = shippingOptions.find((option) => option.id === selectedShippingOptionId) ?? estimatedPricing?.selectedShippingOption ?? shippingOptions[0] ?? null;
  const estimatedTaxRate = estimatedPricing?.taxRate ?? 0;
  const estimatedTax = estimatedPricing?.taxAmount ?? 0;
  const estimatedTotal = estimatedPricing?.totalAmount ?? 0;

  useEffect(() => {
    const nextSelectedOptionId = estimatedPricing?.selectedShippingOption?.methodCode ?? shippingOptions[0]?.id;
    if (nextSelectedOptionId && !shippingOptions.some((option) => option.id === selectedShippingOptionId)) {
      setSelectedShippingOptionId(nextSelectedOptionId);
    }
  }, [estimatedPricing?.selectedShippingOption?.methodCode, selectedShippingOptionId, shippingOptions]);

  function syncCart(nextCart: CartDetail) {
    setCart(nextCart);
    setCouponCode(nextCart?.couponCode ?? '');
    notifyCartUpdatedFromResponse(nextCart);
  }

  function updateQuantity(itemId: string, quantity: number) {
    startTransition(async () => {
      setMessage(null);
      try {
        const nextCart = await apiFetch<CartDetail>(`/api/front/cart/items/${itemId}`, {
          method: 'PATCH',
          body: JSON.stringify({ quantity }),
        });
        syncCart(nextCart);
      } catch {
        setMessage('Unable to update cart quantity.');
      }
    });
  }

  function removeItem(itemId: string) {
    startTransition(async () => {
      setMessage(null);
      try {
        await apiFetch(`/api/front/cart/items/${itemId}`, { method: 'DELETE' });
        const nextCart = await apiFetch<CartDetail>('/api/front/cart');
        syncCart(nextCart);
      } catch {
        setMessage('Unable to remove cart item.');
      }
    });
  }

  function applyCoupon(nextCouponCode?: string | null) {
    startTransition(async () => {
      setMessage(null);
      try {
        const nextCart = await apiFetch<CartDetail>('/api/front/cart', {
          method: 'PATCH',
          body: JSON.stringify({ couponCode: nextCouponCode ?? (couponCode.trim() || null) }),
        });
        syncCart(nextCart);
        setMessage(nextCouponCode === null || !couponCode.trim() ? 'Coupon removed.' : 'Coupon updated.');
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Unable to update coupon code.');
      }
    });
  }

  const freeShippingThresholdAmount = selectedShippingOption?.freeShippingThreshold ?? cart?.freeShippingThreshold.amount ?? 0;
  const remainingForFreeShippingAmount = cart && freeShippingThresholdAmount > 0 ? Math.max(freeShippingThresholdAmount - cart.subtotal.amount, 0) : 0;
  const freeShippingProgress = cart ? (freeShippingThresholdAmount > 0 ? Math.min((cart.subtotal.amount / Math.max(freeShippingThresholdAmount, 1)) * 100, 100) : 100) : 0;

  return (
    <div className="trade-flow-stack">
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
            <Link href={selectorPath} className="button-primary">
              Start with Selector
            </Link>
            <Link href={volumePricingPath} className="button-secondary">
              Explore Volume Pricing
            </Link>
            <Link href={quotePath} className="button-secondary product-back-link">
              Build RFQ Instead
            </Link>
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
        <div className="trade-flow-grid">
          <div className="trade-main-stack">
            <article className="info-card cart-items-card">
              <div className="section-header trade-card-header">
                <div>
                  <h2 className="cart-section-title">{t('cart.title')} ({cart.itemCount})</h2>
                </div>
              </div>

              {freeShippingThresholdAmount > 0 ? (
                <div className="trade-progress-card">
                  <div className="trade-progress-copy">
                    <strong>
                      {remainingForFreeShippingAmount > 0
                        ? `${formatMoney(remainingForFreeShippingAmount, cart.subtotal.currency)} to free shipping`
                        : 'Free shipping unlocked'}
                    </strong>
                  </div>
                  <div className="trade-progress-bar" aria-hidden="true">
                    <span className="trade-progress-fill" style={{ width: `${freeShippingProgress}%` }} />
                  </div>
                </div>
              ) : null}

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
                      <span className="cart-item-image-fallback">{productSkuBadge(item.product)}</span>
                    )}
                  </Link>

                  <div className="cart-item-main">
                    <div className="cart-item-head">
                      <div>
                        <h3 className="cart-item-title">{item.product.name}</h3>
                        <p className="product-meta">Model {resolveProductSku(item.product) || '—'}</p>
                        <p className="section-description">{item.product.shortDescription}</p>
                      </div>
                      <div className="cart-line-price-block">
                        <strong>{item.subtotal.formatted}</strong>
                        <span className="product-meta">Line subtotal</span>
                      </div>
                    </div>

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
                      <div className="cart-line-badges">
                        <span className="filter-chip">{item.product.inStock ? 'Stocked catalog item' : 'Production scheduling'}</span>
                        <span className="filter-chip">{item.quantity >= 5 ? 'Tiered volume active' : 'Tier 1 pricing'}</span>
                      </div>
                    </div>

                    {nextTier ? (
                      <div className="cart-tier-callout">
                        Add {nextTier.unitsToGo} more for {nextTier.unitPriceLabel} each ({nextTier.rangeLabel} pcs)
                      </div>
                    ) : null}

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

                      <button type="button" className="cart-remove-button" onClick={() => removeItem(item.id)} disabled={isPending}>
                        Remove
                      </button>
                      <Link href={withLocalePath(`/products/${item.product.slug}`, locale)} className="cart-view-product-link">
                        View product
                      </Link>
                    </div>

                    {!item.product.inStock ? (
                      <div className="cart-line-warning">This SKU is not currently in stock. Save it for later review or move it into the RFQ path for lead-time confirmation.</div>
                    ) : null}
                  </div>
                </div>
                );
              })}
            </article>

            <article className="info-card cart-coupon-card">
              <h3 className="cart-section-title">Coupon</h3>

              <details className="cart-detail-toggle" open>
                <summary>Promo code</summary>
                <div className="coupon-form-row">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                    disabled={isPending}
                  />
                  <button type="button" className="button-secondary cart-action-button" onClick={() => applyCoupon()} disabled={isPending}>
                    Apply Coupon
                  </button>
                  {cart.couponCode ? (
                    <button type="button" className="button-secondary cart-action-button" onClick={() => applyCoupon(null)} disabled={isPending}>
                      Remove Coupon
                    </button>
                  ) : null}
                </div>

                <div className="filter-chip-list">
                  {['SMALLBATCH5', 'B2B10'].map((code) => (
                    <button key={code} type="button" className="filter-chip cart-chip-button" onClick={() => setCouponCode(code)} disabled={isPending}>
                      {code}
                    </button>
                  ))}
                </div>
              </details>

              {cart.coupon ? (
                <div className={`cart-coupon-status ${cart.coupon.isApplied ? 'is-applied' : 'is-inactive'}`}>
                  <strong>{cart.coupon.code}</strong>
                  <span>{cart.coupon.description}</span>
                  {cart.coupon.message ? <span>{cart.coupon.message}</span> : null}
                </div>
              ) : null}

              {hasAccountContext ? (
                <details className="cart-detail-toggle">
                  <summary>PO Number / Notes</summary>
                  <div className="cart-reference-grid">
                    <label className="form-field">
                      <span>PO Number</span>
                      <input className="form-input" value={purchaseOrderNumber} onChange={(event) => setPurchaseOrderNumber(event.target.value)} placeholder="Optional internal PO reference" />
                    </label>
                    <label className="form-field" style={{ gridColumn: '1 / -1' }}>
                      <span>Buyer Notes</span>
                      <textarea className="form-input form-textarea" rows={4} value={buyerNote} onChange={(event) => setBuyerNote(event.target.value)} placeholder="Share delivery, packaging, or sourcing notes for this cart." />
                    </label>
                  </div>
                </details>
              ) : null}
            </article>

            <article className="info-card cart-estimator-card">
              <h3 className="cart-section-title">{t('cart.shipping')}</h3>

              <div className="cart-reference-grid">
                <label className="form-field">
                  <span>Country / Region</span>
                  <select className="form-input" value={shippingCountry} onChange={(event) => setShippingCountry(event.target.value)}>
                    {shippingCountryOptions.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span>Postal Code</span>
                  <input className="form-input" value={postalCode} onChange={(event) => setPostalCode(event.target.value)} placeholder="Used only for rough delivery planning" />
                </label>
              </div>

              <div className="cart-shipping-option-list">
                {shippingOptions.map((option) => (
                  <label key={option.id} className={`option-choice-card ${selectedShippingOptionId === option.id ? 'is-selected' : ''}`}>
                    <input type="radio" name="cart-shipping-estimator" checked={selectedShippingOptionId === option.id} onChange={() => setSelectedShippingOptionId(option.id)} />
                    <div className="option-choice-body">
                      <div className="cart-item-meta-row">
                        <strong>{option.carrier}</strong>
                        <span>{option.price === 0 ? 'Free' : formatMoney(option.price, cart.subtotal.currency)}</span>
                      </div>
                      <span className="section-description compact-copy">{option.eta}</span>
                      <span className="section-description compact-copy">{option.note}</span>
                    </div>
                  </label>
                ))}
              </div>
            </article>

            <article className="info-card cart-estimator-card">
              <h3 className="cart-section-title">{t('cart.tax')}</h3>

              <div className="cart-tax-grid">
                <article className="summary-stat">
                  <span className="summary-label">Estimated rate</span>
                  <strong>{(estimatedTaxRate * 100).toFixed(0)}%</strong>
                </article>
                <article className="summary-stat">
                  <span className="summary-label">Estimated tax</span>
                  <strong>{formatMoney(estimatedTax, cart.tax.currency)}</strong>
                </article>
                <article className="summary-stat">
                  <span className="summary-label">Basis</span>
                  <strong>{shippingCountry === 'OTHER' ? 'Destination-specific review' : 'Estimated from destination country'}</strong>
                </article>
              </div>
            </article>

            {crossSellProducts.length ? (
              <article className="info-card cart-cross-sell-card">
                <h3 className="cart-section-title">{t('product.compatibleProducts')}</h3>
                <div className="cart-cross-sell-list">
                  {crossSellProducts.map((item) => (
                    <div key={item.id} className="detail-related-card cart-cross-sell-item">
                      <Link href={withLocalePath(`/products/${item.slug}`, locale)} className="cart-cross-sell-image-wrap">
                        {item.coverImage ? (
                          <Image src={item.coverImage.url} alt={item.coverImage.alt || item.name} fill sizes="100px" unoptimized className="cart-item-image" />
                        ) : (
                          <span className="cart-item-image-fallback">{productSkuBadge(item)}</span>
                        )}
                      </Link>
                      <Link href={withLocalePath(`/products/${item.slug}`, locale)}>
                        <strong>{item.name}</strong>
                      </Link>
                      <span className="product-meta">SKU {resolveProductSku(item) || '—'}</span>
                      <span className="card-kicker">{item.purchaseMode === 'buy' ? item.price.formatted : t('product.requestQuote')}</span>
                      {item.purchaseMode === 'buy' ? (
                        <AddToCartButton productId={item.id} redirectToCart={false} />
                      ) : (
                        <Link href={withLocalePath(`/products/${item.slug}`, locale)} className="button-secondary">
                          {t('product.requestQuote')}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            ) : null}
          </div>

          <aside className="trade-side-stack">
            <article className="info-card cart-summary-card">
              <h2 className="cart-section-title">{t('checkout.orderSummary')}</h2>
              <div className="cart-summary-list">
                <div className="cart-summary-row">
                  <span className="section-description">{t('cart.subtotal')}</span>
                  <strong>{cart.subtotal.formatted}</strong>
                </div>
                {cart.volumeDiscount && cart.volumeDiscount.amount > 0 ? (
                  <div className="cart-summary-row">
                    <span className="section-description">Volume discount</span>
                    <strong>-{cart.volumeDiscount.formatted}</strong>
                  </div>
                ) : null}
                {cart.discount.amount > 0 || cart.couponCode ? (
                  <div className="cart-summary-row">
                    <span className="section-description">Discount</span>
                    <strong>{cart.discount.amount > 0 ? `-${cart.discount.formatted}` : '$0.00'}</strong>
                  </div>
                ) : null}
                <div className="cart-summary-row">
                  <span className="section-description">{t('cart.shipping')}</span>
                  <strong>{selectedShippingOption ? (selectedShippingOption.price === 0 ? 'Free' : formatMoney(selectedShippingOption.price, cart.shipping.currency)) : cart.shipping.formatted}</strong>
                </div>
                <div className="cart-summary-row">
                  <span className="section-description">{t('cart.tax')}</span>
                  <strong>{formatMoney(estimatedTax, cart.tax.currency)}</strong>
                </div>
                <div className="cart-summary-row is-total">
                  <span>{t('cart.total')}</span>
                  <strong>{formatMoney(estimatedTotal, cart.total.currency)}</strong>
                </div>
              </div>

              <Link href={checkoutPath} className="button-primary">
                {t('cart.proceedToCheckout')}
              </Link>
              <Link href={quotePath} className="button-secondary product-back-link">
                Convert Cart to RFQ
              </Link>
              <Link href={productsPath} className="nav-link">
                {t('cart.continueShopping')}
              </Link>
              <Link href={contactPath} className="nav-link">
                Need quote support?
              </Link>
              {message ? <p className="section-description">{message}</p> : null}
            </article>
          </aside>
        </div>
      )}
    </div>
  );
}
