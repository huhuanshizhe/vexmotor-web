'use client';

import {
  AddressFormFields,
  createEmptyAddressForm,
  isAddressFormComplete,
  toAddressPayload,
  type AddressFormState,
} from '@/components/addresses/address-form-fields';
import { AddressPicker } from '@/components/addresses/address-picker';
import type { AccountAddress } from '@/lib/account-api';

type CheckoutAddressSectionProps = {
  isGuest: boolean;
  addresses: AccountAddress[];
  shippingAddressId: string;
  billingAddressId: string;
  billingSameAsShipping: boolean;
  guestShippingForm: AddressFormState;
  guestBillingForm: AddressFormState;
  defaultCountryCode?: string;
  onShippingAddressIdChange: (id: string) => void;
  onBillingAddressIdChange: (id: string) => void;
  onBillingSameAsShippingChange: (value: boolean) => void;
  onGuestShippingFormChange: (form: AddressFormState) => void;
  onGuestBillingFormChange: (form: AddressFormState) => void;
  onAddressesChange: (addresses: AccountAddress[]) => void;
};

export function CheckoutAddressSection({
  isGuest,
  addresses,
  shippingAddressId,
  billingAddressId,
  billingSameAsShipping,
  guestShippingForm,
  guestBillingForm,
  defaultCountryCode = 'US',
  onShippingAddressIdChange,
  onBillingAddressIdChange,
  onBillingSameAsShippingChange,
  onGuestShippingFormChange,
  onGuestBillingFormChange,
  onAddressesChange,
}: CheckoutAddressSectionProps) {
  return (
    <article className="info-card checkout-step-card checkout-section-anchor" id="checkout-address">
      <div className="section-header trade-card-header">
        <div>
          <h2 className="cart-section-title">Shipping address</h2>
          <p className="section-description">
            {isGuest ? 'Enter the delivery destination for this order.' : 'Select a saved address or add a new one.'}
          </p>
        </div>
      </div>

      {isGuest ? (
        <AddressFormFields form={guestShippingForm} onChange={onGuestShippingFormChange} variant="checkout" />
      ) : (
        <AddressPicker
          addresses={addresses}
          value={shippingAddressId}
          onChange={onShippingAddressIdChange}
          onAddressesChange={onAddressesChange}
          name="checkout-shipping-address"
          defaultCountryCode={defaultCountryCode}
          variant="checkout"
        />
      )}

      <label className="checkout-toggle-row checkout-toggle-card">
        <input
          type="checkbox"
          checked={billingSameAsShipping}
          onChange={(event) => onBillingSameAsShippingChange(event.target.checked)}
        />
        <span>Use the same address for billing</span>
      </label>

      {!billingSameAsShipping ? (
        <div className="checkout-billing-address-block">
          <h3 className="cart-section-title">Invoice address</h3>
          {isGuest ? (
            <AddressFormFields form={guestBillingForm} onChange={onGuestBillingFormChange} variant="checkout" />
          ) : (
            <AddressPicker
              addresses={addresses}
              value={billingAddressId}
              onChange={onBillingAddressIdChange}
              onAddressesChange={onAddressesChange}
              name="checkout-billing-address"
              defaultCountryCode={defaultCountryCode}
              variant="checkout"
              addLabel="Add billing address"
            />
          )}
        </div>
      ) : null}
    </article>
  );
}

export function createGuestAddressForm(defaultCountryCode = 'US') {
  return createEmptyAddressForm(defaultCountryCode);
}

export function isGuestAddressReady(
  isGuest: boolean,
  guestShippingForm: AddressFormState,
  guestBillingForm: AddressFormState,
  billingSameAsShipping: boolean,
) {
  if (!isGuest) return false;
  return isAddressFormComplete(guestShippingForm) && (billingSameAsShipping || isAddressFormComplete(guestBillingForm));
}

export function guestAddressSnapshot(form: AddressFormState) {
  return toAddressPayload(form);
}
