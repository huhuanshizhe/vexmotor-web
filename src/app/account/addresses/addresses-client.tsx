'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';

import { apiFetch } from '@/lib/api-client';

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

type AddressFormState = {
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
  isDefault: boolean;
};

const emptyState: AddressFormState = {
  firstName: '',
  lastName: '',
  company: '',
  phone: '',
  countryCode: 'US',
  state: '',
  city: '',
  addressLine1: '',
  addressLine2: '',
  postalCode: '',
  isDefault: false,
};

export function AddressesClient({ initialAddresses }: { initialAddresses: Address[] }) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [form, setForm] = useState<AddressFormState>(emptyState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditingId(null);
    setForm(emptyState);
    setOpen(true);
  }

  function openEdit(address: Address) {
    setEditingId(address.id);
    setForm({
      firstName: address.firstName,
      lastName: address.lastName,
      company: address.company ?? '',
      phone: address.phone ?? '',
      countryCode: address.countryCode,
      state: address.state ?? '',
      city: address.city,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 ?? '',
      postalCode: address.postalCode,
      isDefault: address.isDefault,
    });
    setOpen(true);
  }

  function submit() {
    startTransition(async () => {
      setMessage(null);
      const payload = {
        ...form,
        company: form.company || null,
        phone: form.phone || null,
        state: form.state || null,
        addressLine2: form.addressLine2 || null,
      };

      try {
        if (editingId) {
          await apiFetch(`/api/front/addresses/${editingId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        } else {
          await apiFetch('/api/front/addresses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        }

        const nextRows = await apiFetch<Address[]>('/api/front/addresses');
        setAddresses(nextRows);
        setOpen(false);
        setEditingId(null);
        setForm(emptyState);
      } catch {
        setMessage('Unable to save address.');
      }
    });
  }

  function removeAddress(id: string) {
    startTransition(async () => {
      setMessage(null);
      try {
        await apiFetch(`/api/front/addresses/${id}`, { method: 'DELETE' });
        const nextRows = await apiFetch<Address[]>('/api/front/addresses');
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
          <p className="section-description">Manage the saved shipping and billing addresses used during checkout.</p>
        </div>
        <button type="button" className="button-primary" onClick={openCreate}>
          Add Address
        </button>
      </div>
      <div className="info-grid">
        {addresses.map((address) => (
          <article key={address.id} className="info-card" style={{ display: 'grid', gap: 12 }}>
            <div>
              <h2 style={{ margin: 0 }}>
                {address.firstName} {address.lastName}
              </h2>
              <p className="section-description">{address.company ?? 'Personal address'}</p>
            </div>
            <div className="section-description">
              <div>{address.addressLine1}</div>
              {address.addressLine2 ? <div>{address.addressLine2}</div> : null}
              <div>{address.city}{address.state ? `, ${address.state}` : ''} {address.postalCode}</div>
              <div>{address.countryCode}</div>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {address.isDefault ? <span className="product-badge">Default</span> : null}
              <button type="button" className="button-secondary" style={{ color: 'var(--color-ink)', borderColor: 'var(--color-border)' }} onClick={() => openEdit(address)}>
                Edit
              </button>
              <button type="button" className="button-secondary" style={{ color: 'var(--color-primary-dark)', borderColor: 'var(--color-border)' }} onClick={() => removeAddress(address.id)} disabled={isPending}>
                Delete
              </button>
            </div>
          </article>
        ))}
        {!addresses.length ? (
          <article className="info-card">
            <h2>No saved addresses</h2>
            <p className="section-description">Add at least one address before placing an order.</p>
            <Link href="/checkout" className="nav-link">Go to checkout</Link>
          </article>
        ) : null}
      </div>
      {open ? (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(17, 24, 31, 0.4)', display: 'grid', placeItems: 'center', padding: 16, zIndex: 40 }}>
          <div className="info-card" style={{ width: 'min(720px, 100%)', display: 'grid', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <h2 style={{ margin: 0 }}>{editingId ? 'Edit Address' : 'New Address'}</h2>
              <button type="button" className="nav-link" onClick={() => setOpen(false)}>Close</button>
            </div>
            <div className="info-grid">
              <label style={{ display: 'grid', gap: 8 }}><span className="product-meta">First name</span><input value={form.firstName} onChange={(e) => setForm((current) => ({ ...current, firstName: e.target.value }))} className="newsletter-input" /></label>
              <label style={{ display: 'grid', gap: 8 }}><span className="product-meta">Last name</span><input value={form.lastName} onChange={(e) => setForm((current) => ({ ...current, lastName: e.target.value }))} className="newsletter-input" /></label>
              <label style={{ display: 'grid', gap: 8 }}><span className="product-meta">Company</span><input value={form.company} onChange={(e) => setForm((current) => ({ ...current, company: e.target.value }))} className="newsletter-input" /></label>
              <label style={{ display: 'grid', gap: 8 }}><span className="product-meta">Phone</span><input value={form.phone} onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))} className="newsletter-input" /></label>
              <label style={{ display: 'grid', gap: 8 }}><span className="product-meta">Country</span><select value={form.countryCode} onChange={(e) => setForm((current) => ({ ...current, countryCode: e.target.value }))} style={{ minHeight: 48, borderRadius: 999, padding: '0 16px', border: '1px solid var(--color-border)' }}><option value="US">US</option><option value="CN">CN</option><option value="DE">DE</option><option value="GB">GB</option></select></label>
              <label style={{ display: 'grid', gap: 8 }}><span className="product-meta">State</span><input value={form.state} onChange={(e) => setForm((current) => ({ ...current, state: e.target.value }))} className="newsletter-input" /></label>
              <label style={{ display: 'grid', gap: 8 }}><span className="product-meta">City</span><input value={form.city} onChange={(e) => setForm((current) => ({ ...current, city: e.target.value }))} className="newsletter-input" /></label>
              <label style={{ display: 'grid', gap: 8 }}><span className="product-meta">Postal code</span><input value={form.postalCode} onChange={(e) => setForm((current) => ({ ...current, postalCode: e.target.value }))} className="newsletter-input" /></label>
            </div>
            <label style={{ display: 'grid', gap: 8 }}><span className="product-meta">Address line 1</span><input value={form.addressLine1} onChange={(e) => setForm((current) => ({ ...current, addressLine1: e.target.value }))} className="newsletter-input" /></label>
            <label style={{ display: 'grid', gap: 8 }}><span className="product-meta">Address line 2</span><input value={form.addressLine2} onChange={(e) => setForm((current) => ({ ...current, addressLine2: e.target.value }))} className="newsletter-input" /></label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={form.isDefault} onChange={(e) => setForm((current) => ({ ...current, isDefault: e.target.checked }))} /> <span className="product-meta">Set as default address</span></label>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button type="button" className="button-primary" onClick={submit} disabled={isPending}>{isPending ? 'Saving...' : 'Save Address'}</button>
              <button type="button" className="button-secondary" style={{ color: 'var(--color-ink)', borderColor: 'var(--color-border)' }} onClick={() => setOpen(false)}>Cancel</button>
            </div>
            {message ? <p className="section-description">{message}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
