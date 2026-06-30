'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';

import { AddressFormModal } from '@/components/addresses/address-form-modal';
import { apiFetch } from '@/lib/api-client';
import type { AccountAddress } from '@/lib/account-api';

function formatAddressLine(address: AccountAddress) {
  return [
    address.addressLine1,
    address.addressLine2,
    `${address.city}${address.state ? `, ${address.state}` : ''} ${address.postalCode}`,
    address.countryCode,
  ].filter(Boolean);
}

export function AddressesClient({ initialAddresses }: { initialAddresses: AccountAddress[] }) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [editing, setEditing] = useState<AccountAddress | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(address: AccountAddress) {
    setEditing(address);
    setModalOpen(true);
  }

  function handleSaved(address: AccountAddress) {
    setAddresses((current) => {
      const exists = current.some((item) => item.id === address.id);
      if (exists) {
        return current.map((item) => (item.id === address.id ? address : item));
      }
      return [...current, address];
    });
  }

  function removeAddress(id: string) {
    startTransition(async () => {
      setMessage(null);
      try {
        await apiFetch(`/api/front/addresses/${id}`, { method: 'DELETE' });
        const nextRows = await apiFetch<AccountAddress[]>('/api/front/addresses');
        setAddresses(nextRows);
      } catch {
        setMessage('Unable to delete address.');
      }
    });
  }

  return (
    <div className="account-panel-stack">
      <div className="section-header">
        <div>
          <h1 className="section-title">Addresses</h1>
          <p className="section-description">Saved addresses for checkout and orders.</p>
        </div>
        <button type="button" className="button-primary" onClick={openCreate}>
          Add address
        </button>
      </div>

      <div className="address-list-grid">
        {addresses.map((address) => (
          <article key={address.id} className="info-card address-list-card">
            <div className="address-list-card__head">
              <h2 className="cart-section-title">{address.firstName} {address.lastName}</h2>
              {address.isDefault ? <span className="filter-chip">Default</span> : null}
            </div>
            {address.company ? <p className="section-description">{address.company}</p> : null}
            <div className="section-description">
              {formatAddressLine(address).map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
            {address.phone ? <p className="product-meta">{address.phone}</p> : null}
            <div className="address-list-card__actions">
              <button type="button" className="button-secondary" onClick={() => openEdit(address)} disabled={isPending}>
                Edit
              </button>
              <button type="button" className="button-secondary" onClick={() => removeAddress(address.id)} disabled={isPending}>
                Delete
              </button>
            </div>
          </article>
        ))}
        {!addresses.length ? (
          <article className="info-card address-list-card">
            <h2 className="cart-section-title">No saved addresses</h2>
            <p className="section-description">Add at least one address before placing an order.</p>
            <Link href="/checkout" className="nav-link">Go to checkout</Link>
          </article>
        ) : null}
      </div>

      <AddressFormModal
        open={modalOpen}
        editing={editing}
        variant="page"
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />

      {message ? <p className="form-feedback form-feedback-error">{message}</p> : null}
    </div>
  );
}
