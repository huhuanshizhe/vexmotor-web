'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { useToast } from '@C/toast';
import { apiFetch } from '@/lib/api-client';
import type { Locale } from '@/lib/i18n';
import { withLocalePath } from '@/lib/i18n';

type Money = {
  currency: string;
  amount: number;
  formatted: string;
};

type CartDetail = {
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    product: {
      id: string;
      name: string;
      slug: string;
      sku: string;
      shortDescription?: string | null;
      purchaseMode: 'buy' | 'inquiry';
      price: Money;
    };
  }>;
} | null;

type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription?: string | null;
  price: Money;
  purchaseMode: 'buy' | 'inquiry';
};

type SampleItem = {
  id: string;
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  purpose: string;
  freeSample: boolean;
  priceLabel: string;
};

type SampleClientProps = {
  locale: Locale;
  intakeProductId: string;
  intakeProductName: string;
  cart: CartDetail;
  catalogProducts: CatalogProduct[];
};

const PURPOSES = ['Prototyping', 'Qualification', 'EVT / DVT / PVT', 'Education', 'Reseller test'];

function buildSampleItem(product: CatalogProduct, quantity = 1): SampleItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    productId: product.id,
    sku: product.sku,
    name: product.name,
    quantity: Math.min(2, Math.max(1, quantity)),
    purpose: PURPOSES[0]!,
    freeSample: product.price.amount <= 30,
    priceLabel: product.price.amount <= 30 ? 'Free sample' : product.price.formatted,
  };
}

function buildSampleShippingRates(country: string) {
  switch (country) {
    case 'DE':
      return [
        { label: 'DHL Express', price: '$24.00', note: '3-5 business days' },
        { label: 'FedEx Priority', price: '$28.00', note: '3-5 business days' },
        { label: 'UPS Express', price: '$30.00', note: '4-6 business days' },
      ];
    case 'US':
    default:
      return [
        { label: 'DHL Express', price: '$22.00', note: '2-4 business days' },
        { label: 'FedEx Priority', price: '$25.00', note: '3-5 business days' },
        { label: 'UPS Saver', price: '$27.00', note: '3-5 business days' },
      ];
  }
}

export function SampleClient({ locale, intakeProductId, intakeProductName, cart, catalogProducts }: SampleClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pushToast } = useToast();
  const [items, setItems] = useState<SampleItem[]>(() => (cart?.items ?? []).filter((item) => item.product.purchaseMode === 'buy').slice(0, 3).map((item) => buildSampleItem(item.product, 1)));
  const [country, setCountry] = useState('US');
  const [address, setAddress] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [applicationSummary, setApplicationSummary] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const sku = searchParams.get('sku');
    if (!sku) {
      return;
    }

    const matchedProduct = catalogProducts.find((product) => product.sku.toLowerCase() === sku.toLowerCase());
    if (!matchedProduct) {
      return;
    }

    setItems((current) => {
      if (current.some((item) => item.sku.toLowerCase() === matchedProduct.sku.toLowerCase())) {
        return current;
      }
      return [...current, buildSampleItem(matchedProduct, 1)].slice(0, 4);
    });
  }, [catalogProducts, searchParams]);

  function updateQuantity(itemId: string, nextQuantity: number) {
    const clampedQuantity = Math.min(2, Math.max(1, nextQuantity));
    setItems((current) => current.map((item) => (item.id === itemId ? { ...item, quantity: clampedQuantity } : item)));
    if (nextQuantity !== clampedQuantity) {
      pushToast({ title: 'Sample limit applied', description: 'Each SKU is currently limited to 2 sample units.', tone: 'success' });
    }
  }

  function submitSampleRequest() {
    startTransition(async () => {
      if (!items.length) {
        setFeedback('Add at least one sample SKU before submitting.');
        return;
      }
      if (!contactName.trim() || !email.trim() || !address.trim()) {
        setFeedback('Contact name, email, and shipping address are required for sample requests.');
        return;
      }

      const rates = buildSampleShippingRates(country);
      const message = [
        'SAMPLE REQUEST',
        `Contact: ${contactName}`,
        `Company: ${company || 'Not specified'}`,
        `Phone: ${phone || 'Not specified'}`,
        `Country: ${country}`,
        `Address: ${address}`,
        `Application summary: ${applicationSummary || 'Not specified'}`,
        '',
        'ITEMS',
        ...items.map((item, index) => `${index + 1}. ${item.name} | SKU ${item.sku} | Qty ${item.quantity} | Purpose ${item.purpose} | ${item.priceLabel}`),
        '',
        'FREIGHT OPTIONS',
        ...rates.map((rate) => `${rate.label}: ${rate.price} (${rate.note})`),
      ].join('\n');

      try {
        const created = await apiFetch<{ redirectPath?: string }>('/api/front/inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: intakeProductId,
            fullName: contactName,
            email,
            phone,
            company,
            country,
            message,
          }),
        });

        pushToast({ title: 'Samples requested', description: 'The request was routed to the sales and engineering queue.', tone: 'success' });
        router.push(created.redirectPath ?? withLocalePath('/contact', locale));
        router.refresh();
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : 'The sample request could not be submitted right now.');
      }
    });
  }

  const shippingRates = buildSampleShippingRates(country);

  return (
    <div className="trade-flow-grid">
      <div className="trade-main-stack">
        <article className="info-card quote-section-card">
          <div className="section-header trade-card-header">
            <div>
              <h2 className="cart-section-title">Sample policy</h2>
              <p className="section-description">Each customer is currently limited to 2 units per SKU. Some lower-value SKUs can be issued as free samples, while freight remains buyer-paid unless otherwise approved.</p>
            </div>
            <span className="product-badge">Engineering validation</span>
          </div>
        </article>

        <article className="info-card quote-section-card">
          <div className="section-header trade-card-header">
            <div>
              <h2 className="cart-section-title">Sample items</h2>
              <p className="section-description">Request a small number of units for prototyping, qualification, or reseller test before converting into a full order.</p>
            </div>
          </div>

          <div className="quote-line-list">
            {items.length ? (
              items.map((item) => (
                <article key={item.id} className="quote-line-card">
                  <div className="quote-line-head">
                    <div>
                      <strong>{item.name}</strong>
                      <p className="product-meta">{item.sku}</p>
                    </div>
                    <button type="button" className="button-secondary cart-action-button" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}>
                      Remove
                    </button>
                  </div>

                  <div className="quote-form-grid quote-line-grid">
                    <label className="form-field">
                      <span>Qty</span>
                      <input
                        type="number"
                        min={1}
                        max={2}
                        inputMode="numeric"
                        className="form-input"
                        value={item.quantity}
                        aria-label={`Sample quantity for ${item.sku}`}
                        onChange={(event) => updateQuantity(item.id, Number(event.target.value) || 1)}
                        onBlur={(event) => updateQuantity(item.id, Number(event.target.value) || item.quantity)}
                      />
                    </label>
                    <label className="form-field">
                      <span>Purpose of use</span>
                      <select className="form-input" value={item.purpose} onChange={(event) => setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, purpose: event.target.value } : entry)))}>
                        {PURPOSES.map((purpose) => (
                          <option key={purpose} value={purpose}>{purpose}</option>
                        ))}
                      </select>
                    </label>
                    <div className="form-field">
                      <span>Sample pricing</span>
                      <strong>{item.priceLabel}</strong>
                    </div>
                    <div className="form-field">
                      <span>Freight</span>
                      <strong>Paid by buyer</strong>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <article className="info-card trade-empty-card">
                <h3 style={{ marginTop: 0 }}>No sample items selected</h3>
                <p className="section-description">Start from a PDP Request Sample action or add a cart SKU to the sample request.</p>
                <Link href={withLocalePath('/products', locale)} className="button-primary">Browse products</Link>
              </article>
            )}
          </div>
        </article>

        <article className="info-card quote-section-card">
          <div className="section-header trade-card-header">
            <div>
              <h2 className="cart-section-title">Shipping address</h2>
              <p className="section-description">Courier options and freight estimates are shown after the delivery region and shipping address are entered.</p>
            </div>
          </div>

          <div className="quote-form-grid">
            <label className="form-field">
              <span>Country / Region</span>
              <select className="form-input" value={country} onChange={(event) => setCountry(event.target.value)}>
                <option value="US">United States</option>
                <option value="DE">Germany / EU</option>
                <option value="GB">United Kingdom</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
            <label className="form-field" style={{ gridColumn: '1 / -1' }}>
              <span>Shipping address</span>
              <textarea className="form-input form-textarea" rows={4} value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Warehouse or lab delivery address" />
            </label>
          </div>

          <div className="cart-shipping-option-list">
            {shippingRates.map((rate) => (
              <article key={rate.label} className="option-choice-card">
                <div className="option-choice-body">
                  <div className="cart-item-meta-row">
                    <strong>{rate.label}</strong>
                    <span>{rate.price}</span>
                  </div>
                  <span className="section-description compact-copy">{rate.note}</span>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="info-card quote-section-card">
          <div className="section-header trade-card-header">
            <div>
              <h2 className="cart-section-title">Engineering contact</h2>
              <p className="section-description">Share the evaluation owner so the sample request can be approved and converted into an order if the test succeeds.</p>
            </div>
          </div>

          <div className="quote-form-grid">
            <label className="form-field">
              <span>Full name</span>
              <input className="form-input" value={contactName} onChange={(event) => setContactName(event.target.value)} placeholder="Engineering or buyer contact" />
            </label>
            <label className="form-field">
              <span>Email</span>
              <input className="form-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" />
            </label>
            <label className="form-field">
              <span>Phone</span>
              <input className="form-input" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Optional" />
            </label>
            <label className="form-field">
              <span>Company</span>
              <input className="form-input" value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Optional" />
            </label>
            <label className="form-field" style={{ gridColumn: '1 / -1' }}>
              <span>Application summary</span>
              <textarea className="form-input form-textarea" rows={4} value={applicationSummary} onChange={(event) => setApplicationSummary(event.target.value)} placeholder="What will this sample validate and what follows if it passes?" />
            </label>
          </div>

          <div className="trade-empty-actions">
            <Link href={withLocalePath('/cart', locale)} className="button-secondary product-back-link">Skip sample, place full order</Link>
            <button type="button" className="button-primary" onClick={submitSampleRequest} disabled={isPending}>
              {isPending ? 'Submitting...' : 'Request samples'}
            </button>
          </div>
          <p className="section-description compact-copy">This sample request currently uses {intakeProductName} as the intake anchor before the dedicated sample-order backend lands.</p>
          {feedback ? <p className="form-feedback form-feedback-error">{feedback}</p> : null}
        </article>
      </div>

      <aside className="trade-side-stack">
        <article className="info-card cart-summary-card quote-summary-card">
          <h2 className="cart-section-title">Sample summary</h2>
          <div className="cart-summary-list">
            <div className="cart-summary-row">
              <span className="section-description">Sample SKUs</span>
              <strong>{items.length}</strong>
            </div>
            <div className="cart-summary-row">
              <span className="section-description">Policy</span>
              <strong>2 units per SKU</strong>
            </div>
            <div className="cart-summary-row is-total">
              <span>Fulfillment</span>
              <strong>Buyer-paid freight</strong>
            </div>
          </div>
          <div className="quote-summary-note-list">
            <div className="support-item">
              <span className="support-bullet" />
              <span>Free sample badges appear on lower-value SKUs while freight stays visible.</span>
            </div>
            <div className="support-item">
              <span className="support-bullet" />
              <span>Use sample requests for lab validation, then convert winning SKUs into cart or RFQ.</span>
            </div>
          </div>
        </article>
      </aside>
    </div>
  );
}