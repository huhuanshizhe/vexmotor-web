'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';

import { useAuth } from '@/components/providers/auth-provider';
import { apiFetch } from '@/lib/api-client';
import { register as authRegister } from '@/lib/auth-client';
import { fetchAddresses, fetchCart } from '@/lib/account-api';
import { calculateOrderPricing, getShippingCountryOptions, type CommerceConfig } from '@/lib/commerce-config';
import { useTranslation } from '@/lib/i18n-context';

type Money = {
  currency: string;
  amount: number;
  formatted: string;
};

type CartDetail = {
  couponCode?: string | null;
  coupon?: {
    code: string;
    description: string;
    isApplied: boolean;
    message: string | null;
  } | null;
  items: Array<{ id: string; quantity: number; product: { name: string; sku: string }; subtotal: Money }>;
  subtotal: Money;
  discount: Money;
  shipping: Money;
  tax: Money;
  total: Money;
};

type Address = {
  id: string;
  firstName: string;
  lastName: string;
  company: string | null;
  phone: string | null;
  countryCode: string;
  state: string | null;
  city: string;
  addressLine1: string;
  addressLine2: string | null;
  postalCode: string;
  isDefault: boolean;
};

type AddressInput = {
  firstName: string;
  lastName: string;
  company: string;
  phone: string;
  countryCode: string;
  state: string;
  city: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
};

function createEmptyAddress(defaultCountryCode = 'US'): AddressInput {
  return {
    firstName: '',
    lastName: '',
    company: '',
    phone: '',
    countryCode: defaultCountryCode,
    state: '',
    city: '',
    addressLine1: '',
    addressLine2: '',
    postalCode: '',
  };
}

function formatMoney(amount: number, currency = 'USD', locale = 'en') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

function isAddressComplete(address: AddressInput) {
  return Boolean(
    address.firstName.trim() &&
      address.lastName.trim() &&
      address.countryCode.trim() &&
      address.city.trim() &&
      address.addressLine1.trim() &&
      address.postalCode.trim(),
  );
}

function normalizeAddress(address: AddressInput) {
  return {
    firstName: address.firstName.trim(),
    lastName: address.lastName.trim(),
    company: address.company.trim() || null,
    phone: address.phone.trim() || null,
    countryCode: address.countryCode.trim().toUpperCase(),
    state: address.state.trim() || null,
    city: address.city.trim(),
    addressLine1: address.addressLine1.trim(),
    addressLine2: address.addressLine2.trim() || null,
    postalCode: address.postalCode.trim(),
  };
}

function isEuCountry(countryCode: string) {
  return ['AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK'].includes(countryCode.trim().toUpperCase());
}

export function CheckoutClient({
  cart: initialCart,
  addresses: initialAddresses,
  guestMode = false,
  commerceConfig,
}: {
  cart: CartDetail | null;
  addresses: Address[];
  guestMode?: boolean;
  commerceConfig: CommerceConfig;
}) {
  const { user, refreshProfile } = useAuth();
  const isGuestCheckout = guestMode && !user;
  const { t } = useTranslation();
  const router = useRouter();
  const [cart, setCart] = useState<CartDetail | null>(initialCart);
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [isBootstrapping, setIsBootstrapping] = useState(!initialCart);

  useEffect(() => {
    void (async () => {
      try {
        const [nextCart, nextAddresses] = await Promise.all([
          initialCart ? Promise.resolve(initialCart) : fetchCart<CartDetail>(),
          initialAddresses.length || !user ? Promise.resolve(initialAddresses) : fetchAddresses(),
        ]);
        setCart(nextCart);
        setAddresses(nextAddresses as Address[]);
      } catch {
        setCart(null);
      } finally {
        setIsBootstrapping(false);
      }
    })();
  }, [initialCart, initialAddresses, user]);

  const defaultAddressId = useMemo(() => addresses.find((item) => item.isDefault)?.id ?? addresses[0]?.id ?? '', [addresses]);
  const selectedShippingAddress = useMemo(() => addresses.find((item) => item.id === defaultAddressId) ?? addresses[0] ?? null, [addresses, defaultAddressId]);
  const [shippingAddressId, setShippingAddressId] = useState(defaultAddressId);
  const [billingAddressId, setBillingAddressId] = useState(defaultAddressId);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [guestShippingAddress, setGuestShippingAddress] = useState<AddressInput>(() => createEmptyAddress(commerceConfig.defaultCountryCode));
  const [guestBillingAddress, setGuestBillingAddress] = useState<AddressInput>(() => createEmptyAddress(commerceConfig.defaultCountryCode));
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [subscribeToUpdates, setSubscribeToUpdates] = useState(false);
  const [shippingMethod, setShippingMethod] = useState(commerceConfig.defaultShippingMethodCode);
  const [paymentMethod, setPaymentMethod] = useState('Wire transfer');
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState('');
  const [taxId, setTaxId] = useState('');
  const [requestedShipDate, setRequestedShipDate] = useState('');
  const [tradeTerm, setTradeTerm] = useState('DDP');
  const [customerNote, setCustomerNote] = useState('');
  const [exportComplianceConfirmed, setExportComplianceConfirmed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showQuickSignup, setShowQuickSignup] = useState(false);
  const [quickSignupFields, setQuickSignupFields] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [signupMessage, setSignupMessage] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const paymentOptions = [
    {
      value: 'Credit Card',
      title: 'Credit Card',
      note: 'Fastest for smaller catalog transactions where immediate authorization is preferred.',
    },
    {
      value: 'PayPal',
      title: 'PayPal',
      note: 'Useful for small orders where buyer protection or internal reimbursement is required.',
    },
    {
      value: 'Wire transfer',
      title: 'Wire transfer',
      note: 'Preferred for larger B2B orders that route through finance review or PO approval.',
    },
  ];

  const effectiveBillingAddressId = billingSameAsShipping ? shippingAddressId : billingAddressId;
  const selectedShipping = addresses.find((item) => item.id === shippingAddressId) ?? selectedShippingAddress;
  const shippingCountryOptions = getShippingCountryOptions(commerceConfig);
  const activeCountryCode = (isGuestCheckout ? guestShippingAddress.countryCode : selectedShipping?.countryCode ?? '').trim().toUpperCase() || commerceConfig.defaultCountryCode;
  const checkoutPricing = calculateOrderPricing(commerceConfig, {
    subtotal: cart?.subtotal.amount ?? 0,
    discountAmount: cart?.discount.amount ?? 0,
    countryCode: activeCountryCode,
    shippingMethodCode: shippingMethod,
  });
  const shippingOptions = checkoutPricing.availableShippingOptions;
  const selectedShippingOption = checkoutPricing.selectedShippingOption;
  const taxIdRequired = isEuCountry(activeCountryCode) && tradeTerm !== 'EXW';
  const contactComplete = isGuestCheckout ? Boolean(contactEmail.trim()) : true;
  const addressComplete = isGuestCheckout
    ? isAddressComplete(guestShippingAddress) && (billingSameAsShipping || isAddressComplete(guestBillingAddress))
    : Boolean(shippingAddressId && effectiveBillingAddressId);
  const shippingComplete = Boolean(selectedShippingOption);
  const paymentComplete = Boolean(paymentMethod);
  const reviewBlockingMessage = !contactComplete
    ? 'Add a contact email so guest confirmation and support follow-up can reach the buyer.'
    : !addressComplete
      ? 'Complete shipping and billing details before placing the order.'
      : !shippingComplete
        ? 'No shipping lane is available for the selected destination. Please adjust the country or contact support.'
      : taxIdRequired && !taxId.trim()
        ? 'VAT / Tax ID is required for EU shipments under the selected incoterm.'
        : !exportComplianceConfirmed
          ? 'Confirm restricted end-use compliance before placing the order.'
          : null;
  const canPlaceOrder = !reviewBlockingMessage && shippingComplete && paymentComplete;
  const stepItems = [
    { label: 'Address', anchorId: 'checkout-address', complete: addressComplete },
    { label: 'Shipping', anchorId: 'checkout-shipping', complete: shippingComplete },
    { label: 'Payment', anchorId: 'checkout-payment', complete: paymentComplete },
    { label: 'Review', anchorId: 'checkout-review', complete: canPlaceOrder },
  ];

  useEffect(() => {
    const nextShippingMethod = selectedShippingOption?.methodCode ?? shippingOptions[0]?.methodCode ?? '';
    if (nextShippingMethod && !shippingOptions.some((option) => option.methodCode === shippingMethod)) {
      setShippingMethod(nextShippingMethod);
    }
  }, [selectedShippingOption?.methodCode, shippingMethod, shippingOptions]);

  function updateGuestAddress(kind: 'shipping' | 'billing', field: keyof AddressInput, value: string) {
    const setter = kind === 'shipping' ? setGuestShippingAddress : setGuestBillingAddress;
    setter((current) => ({ ...current, [field]: value }));
  }

  function placeOrder() {
    if (reviewBlockingMessage) {
      setMessage(reviewBlockingMessage);
      return;
    }

    startTransition(async () => {
      setMessage(null);
      let order: { orderNumber: string; redirectPath?: string; guestAccessToken?: string };
      try {
        order = await apiFetch('/api/front/checkout/orders', {
          method: 'POST',
          body: JSON.stringify({
            ...(isGuestCheckout
              ? {
                  shippingAddress: normalizeAddress({
                    ...guestShippingAddress,
                    phone: guestShippingAddress.phone.trim() || contactPhone.trim(),
                  }),
                  billingAddress: normalizeAddress({
                    ...(billingSameAsShipping ? guestShippingAddress : guestBillingAddress),
                    phone: (billingSameAsShipping ? guestShippingAddress.phone : guestBillingAddress.phone).trim() || contactPhone.trim(),
                  }),
                  contactEmail: contactEmail.trim().toLowerCase(),
                }
              : {
                  shippingAddressId,
                  billingAddressId: effectiveBillingAddressId,
                }),
            shippingMethod,
            paymentMethod,
            purchaseOrderNumber,
            taxId,
            requestedShipDate: requestedShipDate || undefined,
            tradeTerm,
            customerNote,
            subscribeToUpdates,
            exportComplianceConfirmed,
          }),
        });
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Unable to place order. Please verify cart and address data.');
        return;
      }

      // For Credit Card / PayPal, redirect to Stripe Checkout
      const stripePaymentMethods = ['Credit Card', 'PayPal'];
      if (stripePaymentMethods.includes(paymentMethod)) {
        try {
          const stripeData = await apiFetch<{ sessionUrl?: string }>('/api/front/checkout/stripe-session', {
            method: 'POST',
            body: JSON.stringify({
              orderNumber: order.orderNumber,
              customerEmail: isGuestCheckout ? contactEmail.trim().toLowerCase() : undefined,
            }),
          });

          if (stripeData.sessionUrl) {
            window.location.href = stripeData.sessionUrl;
            return;
          }
          // If Stripe session creation fails, fall through to confirmation page
          console.warn('Stripe session creation failed, redirecting to confirmation page');
        } catch (stripeError) {
          console.warn('Stripe redirect error:', stripeError);
        }
      }

      const destination = order.guestAccessToken
        ? `/checkout/confirmation/${order.orderNumber}?guestToken=${encodeURIComponent(order.guestAccessToken)}`
        : (order.redirectPath ?? `/account/orders/${order.orderNumber}`);
      router.push(destination);
      router.refresh();
    });
  }

  if (isBootstrapping) {
    return <p className="section-description">Loading checkout…</p>;
  }

  if (!cart || !cart.items.length) {
    return (
      <article className="info-card">
        <h2 style={{ marginTop: 0 }}>Your cart is empty</h2>
        <p className="section-description">Add at least one direct-buy product before checking out.</p>
      </article>
    );
  }

  return (
    <div className="trade-flow-grid checkout-flow-grid">
      <div className="trade-main-stack">
        <article className="info-card checkout-mini-header">
          <div className="checkout-mini-header-bar">
            <div>
              <div className="card-kicker">Secure checkout</div>
              <h2 className="cart-section-title">One-page wholesale checkout</h2>
              <p className="section-description">Support line +1-518-722-7315. Prices stay locked to the current storefront currency for this order review.</p>
            </div>
            <div className="checkout-step-anchor-row">
              {stepItems.map((step) => (
                <a key={step.label} href={`#${step.anchorId}`} className={`checkout-step-anchor${step.complete ? ' is-complete' : ''}`}>
                  <strong>{step.label}</strong>
                  <span>{step.complete ? 'Ready' : 'Pending'}</span>
                </a>
              ))}
            </div>
          </div>
        </article>

        <article className="info-card checkout-account-bar" id="checkout-contact">
          <div>
            <div className="card-kicker">Account state</div>
            <h2 className="cart-section-title">{isGuestCheckout ? 'Continue as guest or sign in for saved addresses' : 'Signed-in checkout with saved address book access'}</h2>
            <p className="section-description">
              {isGuestCheckout
                ? 'Guest checkout now keeps a buyer contact section at the top, while sign-in remains the faster path for saved addresses and future order tracking.'
                : 'Your saved address book can drive shipping and billing snapshots without leaving checkout.'}
            </p>
          </div>

          {isGuestCheckout ? (
            <div className="checkout-account-actions">
              <a href="/login?callbackUrl=/checkout" className="button-secondary">Sign in for saved addresses</a>
              <button type="button" className="nav-link" onClick={() => setShowQuickSignup(!showQuickSignup)}>
                {showQuickSignup ? 'Hide quick signup' : 'Create account in 30 seconds'}
              </button>
              {showQuickSignup ? (
                <div className="checkout-quick-signup">
                  <p className="section-description">Quick signup saves your details for order tracking and faster checkout next time.</p>
                  <div className="inquiry-form-grid checkout-reference-grid">
                    <label className="form-field">
                      <span>First Name</span>
                      <input className="form-input" value={quickSignupFields.firstName} onChange={(e) => setQuickSignupFields({ ...quickSignupFields, firstName: e.target.value })} placeholder="First name" />
                    </label>
                    <label className="form-field">
                      <span>Last Name</span>
                      <input className="form-input" value={quickSignupFields.lastName} onChange={(e) => setQuickSignupFields({ ...quickSignupFields, lastName: e.target.value })} placeholder="Last name" />
                    </label>
                    <label className="form-field">
                      <span>Email</span>
                      <input className="form-input" type="email" value={quickSignupFields.email || contactEmail} onChange={(e) => setQuickSignupFields({ ...quickSignupFields, email: e.target.value })} placeholder="name@company.com" />
                    </label>
                    <label className="form-field">
                      <span>Password</span>
                      <input className="form-input" type="password" value={quickSignupFields.password} onChange={(e) => setQuickSignupFields({ ...quickSignupFields, password: e.target.value })} placeholder="At least 8 characters" />
                    </label>
                  </div>
                  <button type="button" className="button-secondary" onClick={() => {
                    startTransition(async () => {
                      setSignupMessage(null);
                      setSignupSuccess(false);
                      try {
                        await authRegister({
                          _quick: true,
                          email: (quickSignupFields.email || contactEmail).trim().toLowerCase(),
                          password: quickSignupFields.password,
                          firstName: quickSignupFields.firstName.trim(),
                          lastName: quickSignupFields.lastName.trim(),
                        });
                        await refreshProfile();
                        setSignupSuccess(true);
                        setSignupMessage('Account created. Saved addresses are now available on this checkout.');
                        setShowQuickSignup(false);
                      } catch (error) {
                        setSignupSuccess(false);
                        setSignupMessage(error instanceof Error ? error.message : 'Unable to create account.');
                      }
                    });
                  }} disabled={isPending}>
                    {isPending ? 'Creating...' : 'Create Account'}
                  </button>
                  {signupMessage ? (
                    <p className={`form-feedback ${signupSuccess ? 'form-feedback-success' : 'form-feedback-error'}`} role="status">
                      {signupMessage}
                    </p>
                  ) : null}
                </div>
              ) : null}
              <span className="section-description">Guest checkout stays available for first-time buyers.</span>
            </div>
          ) : (
            <div className="checkout-account-actions">
              <a href="/account/addresses" className="button-secondary">Manage addresses</a>
              <a href="/account/orders" className="nav-link">Review account orders</a>
            </div>
          )}

          {isGuestCheckout ? (
            <div className="inquiry-form-grid checkout-reference-grid">
              <label className="form-field">
                <span>Contact email</span>
                <input className="form-input" type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} placeholder="buyer@company.com" />
              </label>
              <label className="form-field">
                <span>Contact phone</span>
                <input className="form-input" value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} placeholder="Optional buyer phone" />
              </label>
              <label className="checkout-toggle-row checkout-toggle-card">
                <input type="checkbox" checked={subscribeToUpdates} onChange={(event) => setSubscribeToUpdates(event.target.checked)} />
                <span>Subscribe to engineering updates, launches, and sourcing notes.</span>
              </label>
            </div>
          ) : (
            <div className="checkout-account-summary">
              <span className="filter-chip">Saved addresses active</span>
              <span className="section-description">Contact routing follows your account credentials, while this page only asks for order-specific logistics and procurement notes.</span>
            </div>
          )}
        </article>

        <article className="info-card checkout-step-card">
          <div id="checkout-address" />
          <div className="section-header trade-card-header">
            <div>
              <h2 className="cart-section-title">{t('checkout.shippingAddress')}</h2>
              <p className="section-description">
                {isGuestCheckout
                  ? 'Enter the delivery contact and destination for this guest wholesale order.'
                  : 'Pick the warehouse destination and buyer contact the order should follow.'}
              </p>
            </div>
            {isGuestCheckout ? (
              <a href="/login?callbackUrl=/checkout" className="nav-link">
                Sign in instead
              </a>
            ) : (
              <a href="/account/addresses" className="nav-link">
                Manage addresses
              </a>
            )}
          </div>

          {isGuestCheckout ? (
            <div className="inquiry-form-grid checkout-reference-grid">
              <label className="form-field">
                <span>First Name</span>
                <input className="form-input" value={guestShippingAddress.firstName} onChange={(event) => updateGuestAddress('shipping', 'firstName', event.target.value)} placeholder="Buyer contact first name" />
              </label>
              <label className="form-field">
                <span>Last Name</span>
                <input className="form-input" value={guestShippingAddress.lastName} onChange={(event) => updateGuestAddress('shipping', 'lastName', event.target.value)} placeholder="Buyer contact last name" />
              </label>
              <label className="form-field">
                <span>Company</span>
                <input className="form-input" value={guestShippingAddress.company} onChange={(event) => updateGuestAddress('shipping', 'company', event.target.value)} placeholder="Optional company name" />
              </label>
              <label className="form-field">
                <span>Phone</span>
                <input className="form-input" value={guestShippingAddress.phone} onChange={(event) => updateGuestAddress('shipping', 'phone', event.target.value)} placeholder="Delivery phone or dock contact" />
              </label>
              <label className="form-field">
                <span>Country / Region</span>
                <select className="form-input" value={guestShippingAddress.countryCode} onChange={(event) => updateGuestAddress('shipping', 'countryCode', event.target.value)}>
                  {shippingCountryOptions.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>State / Province</span>
                <input className="form-input" value={guestShippingAddress.state} onChange={(event) => updateGuestAddress('shipping', 'state', event.target.value)} placeholder="Optional state or province" />
              </label>
              <label className="form-field">
                <span>City</span>
                <input className="form-input" value={guestShippingAddress.city} onChange={(event) => updateGuestAddress('shipping', 'city', event.target.value)} placeholder="Destination city" />
              </label>
              <label className="form-field">
                <span>Postal Code</span>
                <input className="form-input" value={guestShippingAddress.postalCode} onChange={(event) => updateGuestAddress('shipping', 'postalCode', event.target.value)} placeholder="Postal code" />
              </label>
              <label className="form-field checkout-field-span">
                <span>Address Line 1</span>
                <input className="form-input" value={guestShippingAddress.addressLine1} onChange={(event) => updateGuestAddress('shipping', 'addressLine1', event.target.value)} placeholder="Street address, building, or warehouse" />
              </label>
              <label className="form-field checkout-field-span">
                <span>Address Line 2</span>
                <input className="form-input" value={guestShippingAddress.addressLine2} onChange={(event) => updateGuestAddress('shipping', 'addressLine2', event.target.value)} placeholder="Suite, floor, or optional delivery detail" />
              </label>
            </div>
          ) : (
            <div className="address-choice-grid">
              {addresses.map((address) => (
                <label key={address.id} className={`address-choice-card ${shippingAddressId === address.id ? 'is-selected' : ''}`}>
                  <input
                    type="radio"
                    name="shipping-address"
                    checked={shippingAddressId === address.id}
                    onChange={() => setShippingAddressId(address.id)}
                  />
                  <div className="address-choice-body">
                    <div className="address-choice-head">
                      <strong>
                        {address.firstName} {address.lastName}
                      </strong>
                      {address.isDefault ? <span className="filter-chip">Default</span> : null}
                    </div>
                    <span className="section-description">
                      {address.company ? `${address.company} · ` : ''}
                      {address.addressLine1}
                      {address.addressLine2 ? `, ${address.addressLine2}` : ''}
                    </span>
                    <span className="section-description">
                      {address.city}
                      {address.state ? `, ${address.state}` : ''} {address.postalCode} · {address.countryCode}
                    </span>
                    {address.phone ? <span className="product-meta">{address.phone}</span> : null}
                  </div>
                </label>
              ))}
            </div>
          )}

          <label className="checkout-toggle-row checkout-toggle-card">
            <input type="checkbox" checked={billingSameAsShipping} onChange={(event) => setBillingSameAsShipping(event.target.checked)} />
            <span>Use the same address for billing</span>
          </label>

          {!billingSameAsShipping ? (
            isGuestCheckout ? (
              <div className="inquiry-form-grid checkout-reference-grid">
                <label className="form-field">
                  <span>Billing First Name</span>
                  <input className="form-input" value={guestBillingAddress.firstName} onChange={(event) => updateGuestAddress('billing', 'firstName', event.target.value)} placeholder="Billing contact first name" />
                </label>
                <label className="form-field">
                  <span>Billing Last Name</span>
                  <input className="form-input" value={guestBillingAddress.lastName} onChange={(event) => updateGuestAddress('billing', 'lastName', event.target.value)} placeholder="Billing contact last name" />
                </label>
                <label className="form-field">
                  <span>Company</span>
                  <input className="form-input" value={guestBillingAddress.company} onChange={(event) => updateGuestAddress('billing', 'company', event.target.value)} placeholder="Optional billing company" />
                </label>
                <label className="form-field">
                  <span>Phone</span>
                  <input className="form-input" value={guestBillingAddress.phone} onChange={(event) => updateGuestAddress('billing', 'phone', event.target.value)} placeholder="Optional billing phone" />
                </label>
                <label className="form-field">
                  <span>Country / Region</span>
                  <select className="form-input" value={guestBillingAddress.countryCode} onChange={(event) => updateGuestAddress('billing', 'countryCode', event.target.value)}>
                    {shippingCountryOptions.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span>State / Province</span>
                  <input className="form-input" value={guestBillingAddress.state} onChange={(event) => updateGuestAddress('billing', 'state', event.target.value)} placeholder="Optional state or province" />
                </label>
                <label className="form-field">
                  <span>City</span>
                  <input className="form-input" value={guestBillingAddress.city} onChange={(event) => updateGuestAddress('billing', 'city', event.target.value)} placeholder="Billing city" />
                </label>
                <label className="form-field">
                  <span>Postal Code</span>
                  <input className="form-input" value={guestBillingAddress.postalCode} onChange={(event) => updateGuestAddress('billing', 'postalCode', event.target.value)} placeholder="Billing postal code" />
                </label>
                <label className="form-field checkout-field-span">
                  <span>Address Line 1</span>
                  <input className="form-input" value={guestBillingAddress.addressLine1} onChange={(event) => updateGuestAddress('billing', 'addressLine1', event.target.value)} placeholder="Billing street address" />
                </label>
                <label className="form-field checkout-field-span">
                  <span>Address Line 2</span>
                  <input className="form-input" value={guestBillingAddress.addressLine2} onChange={(event) => updateGuestAddress('billing', 'addressLine2', event.target.value)} placeholder="Optional secondary address line" />
                </label>
              </div>
            ) : (
              <div className="address-choice-grid">
                {addresses.map((address) => (
                  <label key={address.id} className={`address-choice-card ${billingAddressId === address.id ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="billing-address"
                      checked={billingAddressId === address.id}
                      onChange={() => setBillingAddressId(address.id)}
                    />
                    <div className="address-choice-body">
                      <strong>
                        {address.firstName} {address.lastName}
                      </strong>
                      <span className="section-description">
                        {address.company ? `${address.company} · ` : ''}
                        {address.addressLine1}
                      </span>
                      <span className="section-description">
                        {address.city}
                        {address.state ? `, ${address.state}` : ''} {address.postalCode} · {address.countryCode}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )
          ) : null}
        </article>

        <article className="info-card checkout-step-card">
          <div id="checkout-shipping" />
          <div className="section-header trade-card-header">
            <div>
              <h2 className="cart-section-title">Shipping method</h2>
              <p className="section-description">Choose the delivery mode that fits the selected destination, lead time, customs preference, and landed cost target.</p>
            </div>
          </div>

          <div className="option-choice-grid">
            {shippingOptions.map((option) => (
              <label key={option.methodCode} className={`option-choice-card ${shippingMethod === option.methodCode ? 'is-selected' : ''}`}>
                <input type="radio" name="shipping-method" checked={shippingMethod === option.methodCode} onChange={() => setShippingMethod(option.methodCode)} />
                <div className="option-choice-body">
                  <div className="address-choice-head">
                    <strong>{option.title}</strong>
                    <span className="filter-chip">{option.eta}</span>
                  </div>
                  <span className="section-description">{option.note}</span>
                  <span className="product-meta">{option.price === 0 ? 'Freight: Free' : `Freight: ${formatMoney(option.price, cart.shipping.currency)}`}</span>
                </div>
              </label>
            ))}
          </div>
        </article>

        <article className="info-card checkout-step-card">
          <div className="section-header trade-card-header">
            <div>
              <h2 className="cart-section-title">Customs &amp; compliance</h2>
              <p className="section-description">Select the incoterm for this shipment and confirm the order is not intended for restricted end use.</p>
            </div>
          </div>

          <div className="inquiry-form-grid checkout-reference-grid">
            <article className="checkout-note-card">
              <strong>HS code</strong>
              <p className="section-description">Final HS classification is confirmed on the shipping paperwork and invoice for the exact ordered mix.</p>
            </article>
            <label className="form-field">
              <span>Incoterm</span>
              <select className="form-input" value={tradeTerm} onChange={(event) => setTradeTerm(event.target.value)}>
                <option value="DDP">DDP</option>
                <option value="DAP">DAP</option>
                <option value="EXW">EXW</option>
                <option value="FOB Hong Kong">FOB Hong Kong</option>
              </select>
            </label>
          </div>

          <label className="checkout-toggle-row checkout-toggle-card">
            <input type="checkbox" checked={exportComplianceConfirmed} onChange={(event) => setExportComplianceConfirmed(event.target.checked)} />
            <span>I confirm these goods are not for restricted end use and my organization is responsible for local import compliance.</span>
          </label>

          {taxIdRequired ? <p className="form-feedback form-feedback-error">VAT / Tax ID is required for EU shipments unless you switch the incoterm to EXW.</p> : null}
        </article>

        <article className="info-card checkout-step-card">
          <div id="checkout-payment" />
          <div className="section-header trade-card-header">
            <div>
              <h2 className="cart-section-title">{t('checkout.paymentMethod')}</h2>
              <p className="section-description">Keep the payment path aligned with buyer approval rules and order value.</p>
            </div>
          </div>

          <div className="option-choice-grid">
            {paymentOptions.map((option) => (
              <label key={option.value} className={`option-choice-card ${paymentMethod === option.value ? 'is-selected' : ''}`}>
                <input type="radio" name="payment-method" checked={paymentMethod === option.value} onChange={() => setPaymentMethod(option.value)} />
                <div className="option-choice-body">
                  <strong>{option.title}</strong>
                  <span className="section-description">{option.note}</span>
                </div>
              </label>
            ))}
          </div>

          {paymentMethod === 'Wire transfer' ? <p className="section-description">Bank details are shared in the confirmation stage so finance can remit using the order number as the reference.</p> : null}
        </article>

        <article className="info-card checkout-step-card">
          <div className="section-header trade-card-header">
            <div>
              <h2 className="cart-section-title">Buyer references</h2>
              <p className="section-description">Add procurement details that usually appear in small wholesale checkout before finance or purchasing approval.</p>
            </div>
          </div>

          <div className="inquiry-form-grid checkout-reference-grid">
            <label className="form-field">
              <span>PO Number</span>
              <input className="form-input" value={purchaseOrderNumber} onChange={(event) => setPurchaseOrderNumber(event.target.value)} placeholder="Optional purchase order reference" />
            </label>
            <label className="form-field">
              <span>Tax ID / VAT</span>
              <input className="form-input" value={taxId} onChange={(event) => setTaxId(event.target.value)} placeholder="Optional tax identifier" />
            </label>
            <label className="form-field">
              <span>Requested Ship Date</span>
              <input className="form-input" type="date" value={requestedShipDate} onChange={(event) => setRequestedShipDate(event.target.value)} />
            </label>
            <label className="form-field">
              <span>Notes for warehouse</span>
              <input className="form-input" value={customerNote} onChange={(event) => setCustomerNote(event.target.value)} placeholder="Packaging notes, labels, or receiving instructions" />
            </label>
          </div>
        </article>
      </div>

      <aside className="trade-side-stack">
        <article className="info-card checkout-summary-card" id="checkout-review">
          <div className="card-kicker">Review</div>
          <h2 className="cart-section-title">Order summary</h2>
          <p className="section-description">Freight and tax are recalculated from the selected destination and shipping lane before the order is submitted.</p>

          <div className="checkout-summary-chip-list">
            {stepItems.map((step) => (
              <span key={step.label} className={`checkout-summary-chip${step.complete ? ' is-complete' : ''}`}>{step.label}</span>
            ))}
          </div>

          <div className="checkout-summary-items">
          {cart.items.map((item) => (
            <div key={item.id} className="checkout-summary-item">
              <div>
                <strong>{item.product.name}</strong>
                <div className="product-meta">{item.product.sku} · Qty {item.quantity}</div>
              </div>
              <strong>{item.subtotal.formatted}</strong>
            </div>
          ))}
          </div>

          {cart.coupon?.isApplied ? <div className="cart-coupon-status is-applied"><strong>{cart.coupon.code}</strong><span>{cart.coupon.description}</span></div> : null}

          <div className="cart-summary-list">
            <div className="cart-summary-row"><span className="section-description">{t('cart.subtotal')}</span><strong>{cart.subtotal.formatted}</strong></div>
            {cart.discount.amount > 0 ? <div className="cart-summary-row"><span className="section-description">Discount</span><strong>-{cart.discount.formatted}</strong></div> : null}
            <div className="cart-summary-row"><span className="section-description">Shipping</span><strong>{selectedShippingOption ? (selectedShippingOption.price === 0 ? 'Free' : formatMoney(selectedShippingOption.price, cart.shipping.currency)) : cart.shipping.formatted}</strong></div>
            <div className="cart-summary-row"><span className="section-description">Tax</span><strong>{formatMoney(checkoutPricing.taxAmount, cart.tax.currency)}</strong></div>
            <div className="cart-summary-row is-total"><span>{t('cart.total')}</span><strong>{formatMoney(checkoutPricing.totalAmount, cart.total.currency)}</strong></div>
          </div>

          <div className="checkout-summary-note">
            <strong>{selectedShippingOption?.title ?? shippingMethod}</strong>
            <span className="section-description">{paymentMethod} · {tradeTerm} · {isGuestCheckout ? 'Guest checkout' : 'Account checkout'}</span>
          </div>

          <div className="support-list">
            <div className="support-item">
              <span className="support-bullet" />
              <span>Order submission writes item totals, address snapshots, and structured buyer references into the order record.</span>
            </div>
            <div className="support-item">
              <span className="support-bullet" />
              <span>Guest orders keep a secure confirmation link, while signed-in buyers continue into account order history.</span>
            </div>
          </div>

          <button type="button" className="button-primary" onClick={placeOrder} disabled={isPending || !canPlaceOrder}>
            {isPending ? t('common.loading') : `${t('checkout.placeOrder')} ${formatMoney(checkoutPricing.totalAmount, cart.total.currency)}`}
          </button>
          {message ? <p className="form-feedback form-feedback-error">{message}</p> : null}

          <div className="checkout-trust-strip">
            <article className="checkout-trust-card">
              <strong>Secure order record</strong>
              <span className="section-description">Guest confirmation links stay available after refresh through a secure order token.</span>
            </article>
            <article className="checkout-trust-card">
              <strong>Commercial details preserved</strong>
              <span className="section-description">PO, tax ID, incoterm, and requested delivery date remain attached to the order snapshot.</span>
            </article>
            <article className="checkout-trust-card">
              <strong>Support on standby</strong>
              <span className="section-description">Need help before submitting? Call +1-518-722-7315 or switch to RFQ for more complex projects.</span>
            </article>
          </div>
        </article>
      </aside>
    </div>
  );
}
