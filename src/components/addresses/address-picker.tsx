'use client';

import { useState } from 'react';

import { AddressFormModal } from '@/components/addresses/address-form-modal';
import type { AccountAddress } from '@/lib/account-api';

type AddressPickerProps = {
  addresses: AccountAddress[];
  value: string;
  onChange: (addressId: string) => void;
  onAddressesChange: (addresses: AccountAddress[]) => void;
  name: string;
  defaultCountryCode?: string;
  variant?: 'page' | 'checkout';
  addLabel?: string;
};

function formatAddressLine(address: AccountAddress) {
  return [
    address.addressLine1,
    address.addressLine2,
    `${address.city}${address.state ? `, ${address.state}` : ''} ${address.postalCode}`,
    address.countryCode,
  ].filter(Boolean).join(' · ');
}

export function AddressPicker({
  addresses,
  value,
  onChange,
  onAddressesChange,
  name,
  defaultCountryCode = 'US',
  variant = 'page',
  addLabel = 'Add new address',
}: AddressPickerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AccountAddress | null>(null);

  function handleSaved(address: AccountAddress) {
    const exists = addresses.some((item) => item.id === address.id);
    const next = exists
      ? addresses.map((item) => (item.id === address.id ? address : item))
      : [...addresses, address];
    onAddressesChange(next);
    onChange(address.id);
  }

  return (
    <div className="address-picker">
      {addresses.length ? (
        <div className="address-choice-grid">
          {addresses.map((address) => (
            <label key={address.id} className={`address-choice-card trade-choice-card ${value === address.id ? 'is-selected' : ''}`}>
              <input
                type="radio"
                className="trade-choice-input"
                name={name}
                checked={value === address.id}
                onChange={() => onChange(address.id)}
              />
              <span className="trade-choice-mark" aria-hidden="true" />
              <div className="address-choice-body">
                <div className="address-choice-head">
                  <strong className="option-choice-title">{address.firstName} {address.lastName}</strong>
                  {address.isDefault ? <span className="option-choice-badge">Default</span> : null}
                </div>
                {address.company ? <span className="section-description">{address.company}</span> : null}
                <span className="section-description">{formatAddressLine(address)}</span>
                {address.phone ? <span className="option-choice-foot">{address.phone}</span> : null}
              </div>
            </label>
          ))}
        </div>
      ) : (
        <p className="section-description">No saved addresses yet. Add one to continue.</p>
      )}
      <button
        type="button"
        className="button-secondary address-picker__add"
        onClick={() => {
          setEditing(null);
          setModalOpen(true);
        }}
      >
        {addLabel}
      </button>
      <AddressFormModal
        open={modalOpen}
        editing={editing}
        defaultCountryCode={defaultCountryCode}
        variant={variant}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}
