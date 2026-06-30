'use client';

import { useEffect, useState, useTransition } from 'react';

import {
  AddressFormFields,
  addressToForm,
  createEmptyAddressForm,
  isAddressFormComplete,
  toAddressPayload,
  type AddressFormState,
} from '@/components/addresses/address-form-fields';
import { apiFetch } from '@/lib/api-client';
import type { AccountAddress } from '@/lib/account-api';

type AddressFormModalProps = {
  open: boolean;
  editing: AccountAddress | null;
  defaultCountryCode?: string;
  variant?: 'page' | 'checkout';
  onClose: () => void;
  onSaved: (address: AccountAddress) => void;
};

export function AddressFormModal({
  open,
  editing,
  defaultCountryCode = 'US',
  variant = 'page',
  onClose,
  onSaved,
}: AddressFormModalProps) {
  const [form, setForm] = useState<AddressFormState>(createEmptyAddressForm(defaultCountryCode));
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setForm(editing ? addressToForm(editing) : createEmptyAddressForm(defaultCountryCode));
    setMessage(null);
  }, [open, editing, defaultCountryCode]);

  if (!open) {
    return null;
  }

  function submit() {
    if (!isAddressFormComplete(form)) {
      setMessage('Please complete all required address fields.');
      return;
    }

    startTransition(async () => {
      setMessage(null);
      const payload = toAddressPayload(form);
      try {
        const saved = editing
          ? await apiFetch<AccountAddress>(`/api/front/addresses/${editing.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })
          : await apiFetch<AccountAddress>('/api/front/addresses', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
        onSaved(saved);
        onClose();
      } catch {
        setMessage('Unable to save address.');
      }
    });
  }

  return (
    <div className="address-form-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className={`info-card address-form-modal${variant === 'checkout' ? ' address-form-modal--compact' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-form-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="address-form-modal__header">
          <h2 id="address-form-modal-title" className="cart-section-title">{editing ? 'Edit address' : 'New address'}</h2>
          <button type="button" className="nav-link" onClick={onClose}>Close</button>
        </div>
        <AddressFormFields form={form} onChange={setForm} variant={variant} disabled={isPending} />
        <div className="address-form-modal__actions">
          <button type="button" className="button-primary" onClick={submit} disabled={isPending}>
            {isPending ? 'Saving...' : 'Save address'}
          </button>
          <button type="button" className="button-secondary" onClick={onClose} disabled={isPending}>Cancel</button>
        </div>
        {message ? <p className="form-feedback form-feedback-error">{message}</p> : null}
      </div>
    </div>
  );
}
