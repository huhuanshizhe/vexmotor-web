'use client';

import { useEffect, useState } from 'react';

import { calculateOrderPricing, getShippingCountryOptions, type CommerceConfig } from '@/lib/commerce-config';
import { buildShippingOptions } from '@/lib/shipping';

type ShippingEstimatorClientProps = {
  currency?: string;
  defaultSubtotal?: number;
  commerceConfig: CommerceConfig;
};

function formatMoney(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function ShippingEstimatorClient({ currency = 'USD', defaultSubtotal = 180, commerceConfig }: ShippingEstimatorClientProps) {
  const [shippingCountry, setShippingCountry] = useState(commerceConfig.defaultCountryCode);
  const [subtotalInput, setSubtotalInput] = useState(String(defaultSubtotal));
  const [postalCode, setPostalCode] = useState('');
  const [selectedShippingOptionId, setSelectedShippingOptionId] = useState(commerceConfig.defaultShippingMethodCode);

  const merchandiseSubtotal = Math.max(0, Number.parseFloat(subtotalInput) || 0);
  const shippingCountryOptions = getShippingCountryOptions(commerceConfig);
  const shippingOptions = buildShippingOptions(shippingCountry, merchandiseSubtotal, commerceConfig);
  const pricing = calculateOrderPricing(commerceConfig, {
    subtotal: merchandiseSubtotal,
    countryCode: shippingCountry,
    shippingMethodCode: selectedShippingOptionId,
  });
  const selectedShippingOption = shippingOptions.find((option) => option.id === selectedShippingOptionId) ?? pricing.selectedShippingOption ?? shippingOptions[0] ?? null;
  const estimatedTaxRate = pricing.taxRate;
  const estimatedTax = pricing.taxAmount;
  const landedTotal = pricing.totalAmount;
  const freeShippingThreshold = selectedShippingOption?.freeShippingThreshold ?? 0;

  useEffect(() => {
    const nextSelectedOptionId = pricing.selectedShippingOption?.methodCode ?? shippingOptions[0]?.id;
    if (nextSelectedOptionId && !shippingOptions.some((option) => option.id === selectedShippingOptionId)) {
      setSelectedShippingOptionId(nextSelectedOptionId);
    }
  }, [pricing.selectedShippingOption?.methodCode, selectedShippingOptionId, shippingOptions]);

  return (
    <div className="shipping-estimator-stack">
      <article className="info-card cart-estimator-card">
        <div className="section-header trade-card-header">
          <div>
            <div className="card-kicker">Calculator</div>
            <h2 className="cart-section-title">Shipping estimator</h2>
            <p className="section-description">This uses the same carrier, ETA, and estimator logic currently shown on the cart page so support and checkout stay aligned.</p>
          </div>
        </div>

        <div className="cart-reference-grid">
          <label className="form-field">
            <span>Merchandise subtotal</span>
            <input className="form-input" type="number" min={0} inputMode="decimal" value={subtotalInput} onChange={(event) => setSubtotalInput(event.target.value)} />
          </label>
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
          <label className="form-field" style={{ gridColumn: '1 / -1' }}>
            <span>Postal code</span>
            <input className="form-input" value={postalCode} onChange={(event) => setPostalCode(event.target.value)} placeholder="Used only for rough delivery planning" />
          </label>
        </div>

        <div className="cart-shipping-option-list">
          {shippingOptions.map((option) => (
            <label key={option.id} className={`option-choice-card ${selectedShippingOptionId === option.id ? 'is-selected' : ''}`}>
              <input type="radio" name="support-shipping-estimator" checked={selectedShippingOptionId === option.id} onChange={() => setSelectedShippingOptionId(option.id)} />
              <div className="option-choice-body">
                <div className="cart-item-meta-row">
                  <strong>{option.carrier}</strong>
                  <span>{option.price === 0 ? 'Free' : formatMoney(option.price, currency)}</span>
                </div>
                <span className="section-description compact-copy">{option.eta}</span>
                <span className="section-description compact-copy">{option.note}</span>
              </div>
            </label>
          ))}
        </div>
      </article>

      <div className="shipping-overview-grid">
        <article className="summary-stat">
          <span className="summary-label">Estimated tax rate</span>
          <strong>{(estimatedTaxRate * 100).toFixed(0)}%</strong>
          <span className="section-description compact-copy">Directional landed-cost estimate by destination country.</span>
        </article>
        <article className="summary-stat">
          <span className="summary-label">Estimated tax</span>
          <strong>{formatMoney(estimatedTax, currency)}</strong>
          <span className="section-description compact-copy">Shown separately so buyers do not confuse it with the final invoice.</span>
        </article>
        <article className="summary-stat">
          <span className="summary-label">Estimated landed total</span>
          <strong>{formatMoney(landedTotal, currency)}</strong>
          <span className="section-description compact-copy">Subtotal + selected freight lane + estimated tax.</span>
        </article>
      </div>

      <article className="info-card shipping-note-card">
        <div className="card-kicker">Threshold</div>
        <h2 className="cart-section-title">Free-shipping rule</h2>
        <p className="section-description">
          {freeShippingThreshold > 0
            ? merchandiseSubtotal >= freeShippingThreshold
              ? `The current subtotal unlocks the selected lane because it meets the ${formatMoney(freeShippingThreshold, currency)} threshold.`
              : `Free shipping for the selected lane starts once merchandise subtotal reaches ${formatMoney(freeShippingThreshold, currency)}.`
            : 'The selected lane keeps explicit freight pricing and does not use an automatic free-shipping threshold.'}
        </p>
        <p className="section-description compact-copy">Postal code is used only for planning context in this support tool. Carrier, freight, and customs handling are still finalized at checkout or by the logistics team.</p>
      </article>

      {selectedShippingOption ? (
        <article className="info-card shipping-note-card">
          <div className="card-kicker">Selected lane</div>
          <h2 className="cart-section-title">{selectedShippingOption.carrier}</h2>
          <div className="support-list">
            <div className="support-item">
              <span className="support-bullet" />
              <span>ETA: {selectedShippingOption.eta}</span>
            </div>
            <div className="support-item">
              <span className="support-bullet" />
              <span>Planning freight: {selectedShippingOption.price === 0 ? 'Free' : formatMoney(selectedShippingOption.price, currency)}</span>
            </div>
            <div className="support-item">
              <span className="support-bullet" />
              <span>{selectedShippingOption.note}</span>
            </div>
          </div>
        </article>
      ) : null}
    </div>
  );
}