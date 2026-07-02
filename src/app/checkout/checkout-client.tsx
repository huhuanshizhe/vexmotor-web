'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';

import { CartLineItemList } from '@/components/cart/cart-line-item-list';
import {
  CheckoutAddressSection,
  createGuestAddressForm,
  guestAddressSnapshot,
  isGuestAddressReady,
} from '@/components/checkout/checkout-address-section';
import { CheckoutAuthPanel, type CheckoutAuthMode } from '@/components/checkout/checkout-auth-panel';
import { CheckoutFreeShippingBanner } from '@/components/checkout/checkout-free-shipping-banner';
import { CheckoutOrderSummary } from '@/components/checkout/checkout-order-summary';
import { PaymentMethodIcon } from '@/components/checkout/payment-method-icon';
import { CouponSection } from '@/components/checkout/coupon-section';
import { useAuth } from '@/components/providers/auth-provider';
import { apiFetch } from '@/lib/api-client';
import { fetchAddresses, fetchCart, type AccountAddress } from '@/lib/account-api';
import { fetchBuyNowPreview, fetchQuoteCheckoutPreview } from '@/lib/checkout-api';
import { buildCheckoutPayPath } from '@/lib/checkout-pay-path';
import { syncCartResponse } from '@/lib/cart-api';
import type { CommerceConfig } from '@/lib/commerce-config';
import { parseLocaleFromPathname, withLocalePath } from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n-context';
import { useCheckoutPricing } from '@/lib/use-checkout-pricing';
import type { CartDetail } from '@/lib/storefront-types';

export function CheckoutClient({
  cart: initialCart,
  addresses: initialAddresses,
  guestMode = false,
  commerceConfig,
  buyNowProductId,
  buyNowQuantity = 1,
  fromQuoteNumber,
}: {
  cart: CartDetail | null;
  addresses: AccountAddress[];
  guestMode?: boolean;
  commerceConfig: CommerceConfig;
  buyNowProductId?: string;
  buyNowQuantity?: number;
  fromQuoteNumber?: string;
}) {
  const isBuyNowMode = Boolean(buyNowProductId);
  const isQuoteMode = Boolean(fromQuoteNumber);
  const { user, refreshProfile, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useMemo(() => parseLocaleFromPathname(pathname).locale, [pathname]);
  const { t } = useTranslation();

  const isLoggedIn = Boolean(user);
  const isGuestCheckout = !isLoggedIn;

  const [cart, setCart] = useState<CartDetail | null>(initialCart);
  const [buyNowQty, setBuyNowQty] = useState(buyNowQuantity);
  const [addresses, setAddresses] = useState<AccountAddress[]>(initialAddresses);
  const [isBootstrapping, setIsBootstrapping] = useState(!initialCart);
  const [authMode, setAuthMode] = useState<CheckoutAuthMode>(isLoggedIn ? 'logged-in' : 'guest');

  const defaultAddressId = useMemo(() => addresses.find((item) => item.isDefault)?.id ?? addresses[0]?.id ?? '', [addresses]);
  const [shippingAddressId, setShippingAddressId] = useState(defaultAddressId);
  const [billingAddressId, setBillingAddressId] = useState(defaultAddressId);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [guestShippingForm, setGuestShippingForm] = useState(() => createGuestAddressForm(commerceConfig.defaultCountryCode));
  const [guestBillingForm, setGuestBillingForm] = useState(() => createGuestAddressForm(commerceConfig.defaultCountryCode));

  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [subscribeToUpdates, setSubscribeToUpdates] = useState(false);
  const [shippingMethod, setShippingMethod] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState('');
  const [taxId, setTaxId] = useState('');
  const [orderComment, setOrderComment] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadBuyNowCart = useCallback(async (quantity: number) => {
    if (!buyNowProductId) return null;
    return fetchBuyNowPreview({ productId: buyNowProductId, quantity });
  }, [buyNowProductId]);

  const loadQuoteCart = useCallback(async () => {
    if (!fromQuoteNumber) return null;
    return fetchQuoteCheckoutPreview(fromQuoteNumber);
  }, [fromQuoteNumber]);

  useEffect(() => {
    if (isLoggedIn) {
      setAuthMode('logged-in');
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (defaultAddressId && !shippingAddressId) {
      setShippingAddressId(defaultAddressId);
      setBillingAddressId(defaultAddressId);
    }
  }, [defaultAddressId, shippingAddressId]);

  useEffect(() => {
    void (async () => {
      try {
        if (isQuoteMode && fromQuoteNumber) {
          if (!user) {
            setCart(null);
            return;
          }
          const [nextCart, nextAddresses] = await Promise.all([
            loadQuoteCart(),
            initialAddresses.length ? Promise.resolve(initialAddresses) : fetchAddresses(),
          ]);
          setCart(nextCart);
          setAddresses(nextAddresses);
          return;
        }

        if (isBuyNowMode && buyNowProductId) {
          const [nextCart, nextAddresses] = await Promise.all([
            loadBuyNowCart(buyNowQty),
            initialAddresses.length || !user ? Promise.resolve(initialAddresses) : fetchAddresses(),
          ]);
          setCart(nextCart);
          setAddresses(nextAddresses);
          return;
        }

        const [nextCart, nextAddresses] = await Promise.all([
          initialCart ? Promise.resolve(initialCart) : fetchCart<CartDetail>(),
          initialAddresses.length || !user ? Promise.resolve(initialAddresses) : fetchAddresses(),
        ]);
        setCart(nextCart);
        setAddresses(nextAddresses);
      } catch {
        setCart(null);
      } finally {
        setIsBootstrapping(false);
      }
    })();
  }, [initialCart, initialAddresses, user, isBuyNowMode, buyNowProductId, buyNowQty, loadBuyNowCart, isQuoteMode, fromQuoteNumber, loadQuoteCart]);

  const selectedShippingAddress = addresses.find((item) => item.id === shippingAddressId) ?? null;
  const resolvedShippingCountryCode = isGuestCheckout
    ? guestShippingForm.countryCode.trim().toUpperCase() || null
    : selectedShippingAddress?.countryCode?.trim().toUpperCase() || null;

  const isShippingAddressReady = isGuestCheckout
    ? isGuestAddressReady(isGuestCheckout, guestShippingForm, guestBillingForm, billingSameAsShipping)
    : Boolean(shippingAddressId);

  const checkoutPricing = useCheckoutPricing({
    cart,
    commerceConfig,
    shippingCountryCode: isShippingAddressReady ? resolvedShippingCountryCode : null,
    shippingMethodCode: shippingMethod || commerceConfig.defaultShippingMethodCode,
  });

  useEffect(() => {
    if (!isShippingAddressReady) {
      setShippingMethod('');
      return;
    }
    const nextMethod = checkoutPricing.selectedShippingOption?.methodCode ?? checkoutPricing.availableShippingOptions[0]?.methodCode ?? '';
    if (nextMethod && (!shippingMethod || !checkoutPricing.availableShippingOptions.some((option) => option.methodCode === shippingMethod))) {
      setShippingMethod(nextMethod);
    }
  }, [checkoutPricing.availableShippingOptions, checkoutPricing.selectedShippingOption?.methodCode, isShippingAddressReady, shippingMethod]);

  const effectiveBillingAddressId = billingSameAsShipping ? shippingAddressId : billingAddressId;

  const contactComplete = isGuestCheckout ? Boolean(contactEmail.trim()) : true;
  const addressComplete = isGuestCheckout
    ? isGuestAddressReady(isGuestCheckout, guestShippingForm, guestBillingForm, billingSameAsShipping)
    : Boolean(shippingAddressId && effectiveBillingAddressId);
  const shippingComplete = isShippingAddressReady && Boolean(shippingMethod && checkoutPricing.selectedShippingOption);
  const paymentComplete = Boolean(paymentMethod);

  const reviewBlockingMessage = !contactComplete
    ? t('checkout.needContactEmail')
    : !addressComplete
      ? t('checkout.needAddress')
      : !shippingComplete
        ? isShippingAddressReady
          ? t('checkout.selectShippingMethod')
          : t('checkout.selectShippingAddress')
        : !paymentComplete
          ? t('checkout.selectPaymentMethod')
          : null;

  const canPlaceOrder = !reviewBlockingMessage && shippingComplete && paymentComplete;

  const stepItems = [
    { label: t('checkout.stepItems'), complete: Boolean(cart?.items.length) },
    { label: t('checkout.stepAccount'), complete: isLoggedIn || contactComplete },
    { label: t('checkout.stepAddress'), complete: addressComplete },
    { label: t('checkout.stepShipping'), complete: shippingComplete },
    { label: t('checkout.stepPayment'), complete: paymentComplete },
  ];

  const paymentOptions = [
    { value: 'Credit Card', title: t('checkout.creditCard'), note: t('checkout.paymentCreditCardNote'), disabled: false },
    { value: 'PayPal', title: t('checkout.paymentPayPal'), note: t('checkout.paymentPayPalNote'), disabled: true },
    { value: 'Wire transfer', title: t('checkout.paymentWire'), note: t('checkout.paymentWireNote'), disabled: true },
  ];

  async function handleAuthSuccess() {
    await refreshProfile();
    const nextAddresses = await fetchAddresses();
    setAddresses(nextAddresses);
    const nextDefault = nextAddresses.find((item) => item.isDefault)?.id ?? nextAddresses[0]?.id ?? '';
    if (nextDefault) {
      setShippingAddressId(nextDefault);
      setBillingAddressId(nextDefault);
    }
    if (!isBuyNowMode) {
      const nextCart = await fetchCart<CartDetail>();
      setCart(nextCart);
    }
    setAuthMode('logged-in');
  }

  function handleBuyNowQuantityChange(quantity: number) {
    setBuyNowQty(quantity);
    startTransition(async () => {
      setMessage(null);
      try {
        const nextCart = await loadBuyNowCart(quantity);
        if (nextCart) setCart(nextCart);
      } catch {
        setMessage('Unable to update quantity.');
      }
    });
  }

  function handleBuyNowRemove() {
    const slug = cart?.items[0]?.product.slug;
    router.push(slug ? withLocalePath(`/products/${slug}`, locale) : withLocalePath('/products', locale));
  }

  function redirectAfterOrder(order: { orderNumber: string; redirectPath?: string; guestAccessToken?: string }) {
    if (paymentMethod === 'Credit Card') {
      router.push(withLocalePath(buildCheckoutPayPath(order.orderNumber, order.guestAccessToken), locale));
      router.refresh();
      return;
    }

    const destination = order.guestAccessToken
      ? `/checkout/confirmation/${order.orderNumber}?guestToken=${encodeURIComponent(order.guestAccessToken)}`
      : (order.redirectPath ?? `/account/orders/${order.orderNumber}`);
    router.push(withLocalePath(destination, locale));
    router.refresh();
  }

  function scrollToCheckoutBlocker(blocker: string) {
    const anchorByBlocker: Record<string, string> = {
      'Add a contact email for guest checkout.': '#checkout-account',
      'Complete shipping and billing details before placing the order.': '#checkout-address',
      'Select a shipping method.': '#checkout-shipping',
      'Select or enter a shipping address first.': '#checkout-address',
      'Select a payment method.': '#checkout-payment',
    };

    const anchor = anchorByBlocker[blocker];
    if (!anchor) {
      return;
    }

    document.querySelector(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function placeOrder() {
    if (reviewBlockingMessage) {
      setMessage(reviewBlockingMessage);
      scrollToCheckoutBlocker(reviewBlockingMessage);
      return;
    }

    startTransition(async () => {
      setMessage(null);

      const buyNowPayload = isBuyNowMode && buyNowProductId
        ? { productId: buyNowProductId, quantity: buyNowQty }
        : undefined;

      let order: { orderNumber: string; redirectPath?: string; guestAccessToken?: string };
      try {
        order = await apiFetch('/api/front/checkout/orders', {
          method: 'POST',
          locale,
          body: JSON.stringify({
            ...(isGuestCheckout
              ? {
                  shippingAddress: guestAddressSnapshot({
                    ...guestShippingForm,
                    phone: guestShippingForm.phone.trim() || contactPhone.trim(),
                  }),
                  billingAddress: guestAddressSnapshot({
                    ...(billingSameAsShipping ? guestShippingForm : guestBillingForm),
                    phone: (billingSameAsShipping ? guestShippingForm.phone : guestBillingForm.phone).trim() || contactPhone.trim(),
                  }),
                  contactEmail: contactEmail.trim().toLowerCase(),
                }
              : {
                  shippingAddressId,
                  billingAddressId: effectiveBillingAddressId,
                }),
            shippingMethod,
            paymentMethod,
            purchaseOrderNumber: purchaseOrderNumber.trim() || undefined,
            taxId: taxId.trim() || undefined,
            orderComment: orderComment.trim() || undefined,
            subscribeToUpdates,
            buyNow: buyNowPayload,
            fromQuote: isQuoteMode ? fromQuoteNumber : undefined,
          }),
        });
      } catch (error) {
        setMessage(error instanceof Error ? error.message : t('checkout.placeOrderFailed'));
        return;
      }

      redirectAfterOrder(order);
    });
  }

  if (isBootstrapping) {
    return <p className="section-description">{t('checkoutPage.loading')}</p>;
  }

  if (isQuoteMode && !user) {
    return (
      <article className="info-card">
        <h2 style={{ marginTop: 0 }}>{t('checkoutPage.signInForQuoteTitle')}</h2>
        <p className="section-description">{t('checkoutPage.signInForQuoteDesc')}</p>
      </article>
    );
  }

  if (!cart || !cart.items.length) {
    return (
      <article className="info-card">
        <h2 style={{ marginTop: 0 }}>{t('checkoutPage.emptyCartTitle')}</h2>
        <p className="section-description">{t('checkoutPage.emptyCartDesc')}</p>
      </article>
    );
  }

  const selectedShippingOption = checkoutPricing.selectedShippingOption;
  const shippingMethodLabel = selectedShippingOption?.title ?? (shippingMethod || 'Shipping');
  const shippingEta = selectedShippingOption?.eta;
  const shippingFreightLabel = selectedShippingOption
    ? selectedShippingOption.price === 0
      ? t('checkout.freightFree')
      : `${t('checkout.freight')}: ${new Intl.NumberFormat(locale, { style: 'currency', currency: cart.shipping.currency }).format(selectedShippingOption.price)}`
    : undefined;

  const freeShippingThresholdAmount = cart.freeShippingThreshold.amount;
  const remainingForFreeShippingAmount =
    checkoutPricing.isShippingAddressReady && checkoutPricing.freeShippingThreshold != null
      ? checkoutPricing.remainingForFreeShipping
      : cart.remainingForFreeShipping.amount;

  return (
    <div className="trade-flow-grid checkout-flow-grid">
      <div className="trade-main-stack">
        {isQuoteMode && fromQuoteNumber ? (
          <article className="checkout-quote-banner account-quote-checkout-banner">
            <p className="account-quote-checkout-banner__eyebrow">{t('checkout.quoteCheckoutEyebrow')}</p>
            <p className="account-quote-checkout-banner__title">
              {t('checkout.quoteCheckoutTitle', { quoteNumber: fromQuoteNumber })}
            </p>
            <p className="account-quote-checkout-banner__desc">{t('checkout.quoteCheckoutDesc')}</p>
          </article>
        ) : null}
        <CheckoutFreeShippingBanner
          freeShippingThresholdAmount={freeShippingThresholdAmount}
          remainingForFreeShippingAmount={remainingForFreeShippingAmount}
          subtotalAmount={cart.subtotal.amount}
          currency={cart.subtotal.currency}
          locale={locale}
        />

        <article className="info-card checkout-step-card checkout-section-anchor" id="checkout-items">
          <h2 className="cart-section-title">Order items</h2>
          <CartLineItemList
            cart={cart}
            locale={locale}
            commerceConfig={commerceConfig}
            onCartChange={(nextCart) => setCart(syncCartResponse(nextCart))}
            onMessage={setMessage}
            compact
            mode={isQuoteMode ? 'quote' : isBuyNowMode ? 'buyNow' : 'cart'}
            readOnlyQuantities={isQuoteMode}
            onBuyNowQuantityChange={handleBuyNowQuantityChange}
            onBuyNowRemove={handleBuyNowRemove}
          />
        </article>

        <CheckoutAuthPanel
          mode={authMode}
          onModeChange={setAuthMode}
          contactEmail={contactEmail}
          contactPhone={contactPhone}
          subscribeToUpdates={subscribeToUpdates}
          onContactEmailChange={setContactEmail}
          onContactPhoneChange={setContactPhone}
          onSubscribeToUpdatesChange={setSubscribeToUpdates}
          userDisplayName={user ? `${user.firstName} ${user.lastName}`.trim() : undefined}
          userEmail={user?.email}
          onAuthSuccess={handleAuthSuccess}
          onSignOut={() => logout()}
        />

        {!isBuyNowMode && !isQuoteMode ? (
          <CouponSection cart={cart} onCartChange={(nextCart) => setCart(syncCartResponse(nextCart))} onMessage={setMessage} />
        ) : null}

        <CheckoutAddressSection
          isGuest={isGuestCheckout}
          addresses={addresses}
          shippingAddressId={shippingAddressId}
          billingAddressId={billingAddressId}
          billingSameAsShipping={billingSameAsShipping}
          guestShippingForm={guestShippingForm}
          guestBillingForm={guestBillingForm}
          defaultCountryCode={commerceConfig.defaultCountryCode}
          onShippingAddressIdChange={setShippingAddressId}
          onBillingAddressIdChange={setBillingAddressId}
          onBillingSameAsShippingChange={setBillingSameAsShipping}
          onGuestShippingFormChange={setGuestShippingForm}
          onGuestBillingFormChange={setGuestBillingForm}
          onAddressesChange={setAddresses}
        />

        <article className="info-card checkout-step-card checkout-section-anchor" id="checkout-shipping">
          <div className="section-header trade-card-header">
            <div>
              <h2 className="cart-section-title">{t('checkout.shippingMethod')}</h2>
              <p className="section-description">
                {isShippingAddressReady
                  ? t('checkout.shippingMethodReady')
                  : t('checkout.shippingMethodNeedAddress')}
              </p>
            </div>
          </div>

          {isShippingAddressReady ? (
            <div className="option-choice-grid">
              {checkoutPricing.availableShippingOptions.map((option) => (
                <label key={option.methodCode} className={`option-choice-card trade-choice-card ${shippingMethod === option.methodCode ? 'is-selected' : ''}`}>
                  <input type="radio" className="trade-choice-input" name="shipping-method" checked={shippingMethod === option.methodCode} onChange={() => setShippingMethod(option.methodCode)} />
                  <span className="trade-choice-mark" aria-hidden="true" />
                  <div className="option-choice-body">
                    <div className="address-choice-head">
                      <strong className="option-choice-title">{option.title}</strong>
                      <span className="option-choice-badge">{option.eta}</span>
                    </div>
                    <span className="section-description">{option.note}</span>
                    <div className="option-choice-foot">
                      <span>{t('checkout.freight')}</span>
                      <strong>{option.price === 0 ? t('checkoutPage.free') : new Intl.NumberFormat(locale, { style: 'currency', currency: cart.shipping.currency }).format(option.price)}</strong>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          ) : null}
        </article>

        {shippingComplete ? (
          <article className="info-card checkout-step-card checkout-section-anchor" id="checkout-payment">
            <div className="section-header trade-card-header">
              <div>
                <h2 className="cart-section-title">{t('checkout.paymentMethod')}</h2>
              </div>
            </div>
            <div className="option-choice-grid">
              {paymentOptions.map((option) => {
                const isDisabled = option.disabled;
                const isSelected = paymentMethod === option.value;

                return (
                  <label
                    key={option.value}
                    className={`option-choice-card trade-choice-card${isSelected ? ' is-selected' : ''}${isDisabled ? ' is-disabled' : ''}`}
                    aria-disabled={isDisabled || undefined}
                  >
                    <input
                      type="radio"
                      className="trade-choice-input"
                      name="payment-method"
                      checked={isSelected}
                      disabled={isDisabled}
                      onChange={() => {
                        if (!isDisabled) {
                          setPaymentMethod(option.value);
                        }
                      }}
                    />
                    <span className="trade-choice-mark" aria-hidden="true" />
                    <div className="option-choice-body">
                      <div className="option-choice-title-row">
                        <span className="payment-method-icon" aria-hidden="true">
                          <PaymentMethodIcon method={option.value} />
                        </span>
                        <strong className="option-choice-title">{option.title}</strong>
                      </div>
                      <span className="section-description">{option.note}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </article>
        ) : null}

        <article className="info-card checkout-step-card checkout-section-anchor" id="checkout-buyer-refs">
          <h2 className="cart-section-title">{t('checkout.buyerReferences')}</h2>
          <div className="inquiry-form-grid checkout-reference-grid">
            <label className="form-field">
              <span>{t('checkout.poNumber')}</span>
              <input
                className="form-input"
                value={purchaseOrderNumber}
                onChange={(e) => setPurchaseOrderNumber(e.target.value)}
                placeholder={t('checkout.poPlaceholder')}
              />
            </label>
            <label className="form-field">
              <span>{t('checkout.taxId')}</span>
              <input
                className="form-input"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder={t('checkout.taxIdPlaceholder')}
              />
            </label>
          </div>
        </article>

        <article className="info-card checkout-step-card checkout-section-anchor" id="checkout-order-comment">
          <h2 className="cart-section-title">{t('checkout.orderComment')}</h2>
          <label className="form-field">
            <span>{t('checkout.orderCommentLabel')}</span>
            <textarea className="form-input form-textarea" rows={3} value={orderComment} onChange={(e) => setOrderComment(e.target.value)} placeholder={t('checkout.orderCommentPlaceholder')} />
          </label>
        </article>
      </div>

      <aside className="trade-side-stack">
        <CheckoutOrderSummary
          cart={cart}
          pricing={checkoutPricing}
          stepItems={stepItems}
          shippingComplete={shippingComplete}
          paymentComplete={paymentComplete}
          shippingMethodLabel={shippingMethodLabel}
          shippingEta={shippingEta}
          shippingFreightLabel={shippingFreightLabel}
          paymentMethod={paymentMethod}
          canPlaceOrder={canPlaceOrder}
          reviewBlockingMessage={reviewBlockingMessage}
          isPending={isPending}
          message={message}
          locale={locale}
          onPlaceOrder={placeOrder}
        />
      </aside>
    </div>
  );
}
