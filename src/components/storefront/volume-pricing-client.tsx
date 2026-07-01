'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { IndustrySelect } from '@/components/storefront/industry-select';
import { useIndustries } from '@/hooks/use-industries';

import type { VolumePricingRuleConfig } from '@/lib/commerce-config';
import { apiFetch } from '@/lib/api-client';
import type { Locale } from '@/lib/i18n';
import { withLocalePath } from '@/lib/i18n';
import { buildVolumePricingTiers, getVolumePricingEstimate, volumePricingIllustrationBands } from '@/lib/volume-pricing';
import type { StorefrontProductCard } from '@/lib/storefront-types';

type VolumePricingClientProps = {
  locale: Locale;
  intakeProductId: string;
  products: StorefrontProductCard[];
  initialSku?: string;
  volumePricingRules: VolumePricingRuleConfig[];
};

type ContractPricingState = {
  company: string;
  industry: string;
  annualPurchase: string;
  interestedSku: string;
  fullName: string;
  email: string;
  phone: string;
  notes: string;
};

const CONTRACT_BENEFITS = [
  'Fixed pricing windows up to 12 months for approved annual programs.',
  'Reserved stock and scheduled releases for warehouse and line-side planning.',
  'Priority production and export coordination when the program cadence is defined.',
  'Engineering support for alternates, AVL reviews, and controlled revisions.',
  'Net30 review path for approved business accounts and recurring demand.',
] as const;

const INITIAL_CONTRACT_FORM: ContractPricingState = {
  company: '',
  industry: '',
  annualPurchase: '',
  interestedSku: '',
  fullName: '',
  email: '',
  phone: '',
  notes: '',
};

function buildContractPricingMessage(
  form: ContractPricingState,
  product: StorefrontProductCard | null,
  quantity: number,
  publishedSavingsLine: string,
  industryLabel: string,
) {
  return [
    'CONTRACT PRICING REQUEST',
    `Company: ${form.company || 'Not specified'}`,
    `Industry: ${industryLabel || 'Not specified'}`,
    `Annual purchase estimate: ${form.annualPurchase || 'Not specified'}`,
    `Interested SKU: ${form.interestedSku || product?.sku || 'Not specified'}`,
    `Selected product: ${product ? `${product.name} (${product.sku})` : 'Not specified'}`,
    `Annual quantity for calculator: ${quantity}`,
    `Published savings snapshot: ${publishedSavingsLine}`,
    `Full name: ${form.fullName || 'Not specified'}`,
    `Email: ${form.email || 'Not specified'}`,
    `Phone: ${form.phone || 'Not specified'}`,
    `Additional notes: ${form.notes || 'Not specified'}`,
  ].join('\n');
}

export function VolumePricingClient({ locale, intakeProductId, products, initialSku, volumePricingRules }: VolumePricingClientProps) {
  const router = useRouter();
  const { getLabel } = useIndustries();
  const defaultSku = products.some((product) => product.sku === initialSku) ? initialSku ?? '' : products[0]?.sku ?? '';
  const [selectedSku, setSelectedSku] = useState(defaultSku);
  const [quantityInput, setQuantityInput] = useState('50');
  const [form, setForm] = useState<ContractPricingState>({
    ...INITIAL_CONTRACT_FORM,
    interestedSku: defaultSku,
  });
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedProduct = products.find((product) => product.sku === selectedSku) ?? products[0] ?? null;
  const quantity = Math.max(1, Number.parseInt(quantityInput, 10) || 1);
  const tiers = selectedProduct ? buildVolumePricingTiers(selectedProduct.price.amount, selectedProduct.price.currency, volumePricingRules) : [];
  const estimate = selectedProduct ? getVolumePricingEstimate(selectedProduct.price.amount, selectedProduct.price.currency, quantity, volumePricingRules) : null;
  const productDetailPath = selectedProduct ? withLocalePath(`/products/${selectedProduct.slug}`, locale) : withLocalePath('/products', locale);
  const quotePath = withLocalePath('/quote', locale);
  const contactFallbackPath = `${withLocalePath('/contact', locale)}?topic=contract-pricing`;
  const publishedSavingsLine = estimate
    ? estimate.savingsAmount > 0
      ? `${estimate.savingsLabel} saved at ${estimate.applicableTier.label} (${estimate.applicableTier.rangeLabel} pcs, ${estimate.savingsPercent}% off list).`
      : `List tier still applies at ${estimate.quantity} units.`
    : 'Calculator not available.';

  function updateForm<K extends keyof ContractPricingState>(key: K, value: ContractPricingState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFeedback(null);
  }

  function handleSkuChange(nextSku: string) {
    setSelectedSku(nextSku);
    setForm((current) => ({ ...current, interestedSku: nextSku }));
    setFeedback(null);
  }

  function validateForm() {
    if (!form.company.trim()) {
      return 'Company name is required before the contract-pricing request can be sent.';
    }

    if (!form.fullName.trim() || !form.email.trim()) {
      return 'Contact name and email are required before submission.';
    }

    if (!form.annualPurchase.trim()) {
      return 'Annual purchase estimate is required for commercial review.';
    }

    return null;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const validationError = validateForm();
      if (validationError) {
        setFeedback({ tone: 'error', text: validationError });
        return;
      }

      try {
        const created = await apiFetch<{ redirectPath?: string }>('/api/front/inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: intakeProductId,
            fullName: form.fullName,
            email: form.email,
            phone: form.phone,
            company: form.company,
            message: buildContractPricingMessage(
              form,
              selectedProduct,
              quantity,
              publishedSavingsLine,
              getLabel(form.industry),
            ),
          }),
        });

        const redirectPath = created.redirectPath ? `${created.redirectPath}?type=contract-pricing` : contactFallbackPath;
        router.push(redirectPath);
        router.refresh();
      } catch (error) {
        setFeedback({ tone: 'error', text: error instanceof Error ? error.message : 'Unable to submit the contract-pricing request right now.' });
      }
    });
  }

  return (
    <div className="volume-pricing-stack">
      <div className="volume-pricing-grid">
        <article className="info-card volume-pricing-card">
          <div className="section-header trade-card-header">
            <div>
              <div className="card-kicker">How tiers work</div>
              <h2 className="cart-section-title">Published web tiers</h2>
              <p className="section-description">Each SKU can have its own breakpoints. This page uses the same published tier logic currently surfaced on product detail pages.</p>
            </div>
          </div>

          <div className="volume-tier-grid">
            {volumePricingIllustrationBands.map((band) => (
              <article key={band.rangeLabel} className="volume-tier-band">
                <span className="summary-label">{band.rangeLabel}</span>
                <strong>{band.headline}</strong>
                <p className="section-description compact-copy">{band.note}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="info-card volume-pricing-card">
          <div className="section-header trade-card-header">
            <div>
              <div className="card-kicker">Example calculator</div>
              <h2 className="cart-section-title">Estimate published savings</h2>
              <p className="section-description">Choose a stocked catalog SKU and annual quantity to see the published web-tier impact before asking for contract terms.</p>
            </div>
          </div>

          <div className="volume-calc-grid">
            <label className="form-field">
              <span>SKU</span>
              <select className="form-input" value={selectedSku} onChange={(event) => handleSkuChange(event.target.value)}>
                {products.map((product) => (
                  <option key={product.id} value={product.sku}>
                    {product.sku} · {product.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Annual quantity</span>
              <input className="form-input" type="number" min={1} inputMode="numeric" value={quantityInput} onChange={(event) => setQuantityInput(event.target.value)} />
            </label>
          </div>

          <div className="volume-inline-meta">
            <Link href={productDetailPath} className="section-link">
              View product page
            </Link>
            <Link href={quotePath} className="section-link">
              Need bundled RFQ instead?
            </Link>
          </div>

          {estimate ? (
            <div className="volume-estimate-grid">
              <article className="summary-stat">
                <span className="summary-label">List unit price</span>
                <strong>{selectedProduct?.price.formatted}</strong>
              </article>
              <article className="summary-stat">
                <span className="summary-label">Published tier</span>
                <strong>
                  {estimate.applicableTier.label} · {estimate.applicableTier.unitPriceLabel}
                </strong>
              </article>
              <article className="summary-stat">
                <span className="summary-label">Annual spend</span>
                <strong>{estimate.tierExtendedLabel}</strong>
              </article>
              <article className="summary-stat">
                <span className="summary-label">Published savings</span>
                <strong>{estimate.savingsAmount > 0 ? `${estimate.savingsLabel} (${estimate.savingsPercent}%)` : 'List tier'}</strong>
              </article>
            </div>
          ) : null}

          {tiers.length ? (
            <div className="detail-volume-pricing">
              {tiers.filter((tier) => tier.minQuantity > 1).map((tier) => (
                <span key={tier.label} className="detail-volume-line">
                  {tier.rangeLabel} pcs · {tier.unitPriceLabel}
                </span>
              ))}
            </div>
          ) : null}
        </article>
      </div>

      <div className="volume-secondary-grid">
        <article className="info-card volume-pricing-card">
          <div className="section-header trade-card-header">
            <div>
              <div className="card-kicker">Contract benefits</div>
              <h2 className="cart-section-title">Annual program advantages</h2>
            </div>
          </div>
          <div className="volume-program-grid">
            {CONTRACT_BENEFITS.map((benefit) => (
              <article key={benefit} className="summary-stat">
                <span className="summary-label">Benefit</span>
                <strong>{benefit}</strong>
              </article>
            ))}
          </div>
        </article>

        <article className="info-card volume-pricing-card">
          <div className="section-header trade-card-header">
            <div>
              <div className="card-kicker">Eligibility</div>
              <h2 className="cart-section-title">When to request contract pricing</h2>
            </div>
          </div>
          <div className="support-list">
            <div className="support-item">
              <span className="support-bullet" />
              <span>Typical qualification starts at annual purchasing above $50k or a single release above 200 pcs.</span>
            </div>
            <div className="support-item">
              <span className="support-bullet" />
              <span>Programs with scheduled warehouse releases, AVL commitments, or payment-term review should route here early.</span>
            </div>
            <div className="support-item">
              <span className="support-bullet" />
              <span>Engineering-led variants should move to the custom or RFQ workflow first, then convert into the contract lane once scope stabilizes.</span>
            </div>
          </div>
        </article>
      </div>

      <form id="contract-apply" className="info-card volume-apply-card" onSubmit={handleSubmit}>
        <div className="section-header trade-card-header">
          <div>
            <div className="card-kicker">Apply</div>
            <h2 className="cart-section-title">Request contract pricing</h2>
            <p className="section-description">Submission enters the current sales follow-up queue. The team uses the published calculator snapshot plus your annual demand to decide whether contract review is appropriate.</p>
          </div>
        </div>

        <div className="custom-form-grid">
          <label className="form-field">
            <span>Company</span>
            <input className="form-input" value={form.company} onChange={(event) => updateForm('company', event.target.value)} placeholder="Company name" required />
          </label>
          <label className="form-field">
            <span>Industry</span>
            <IndustrySelect
              className="form-input"
              value={form.industry}
              onChange={(value) => updateForm('industry', value)}
            />
          </label>
          <label className="form-field">
            <span>Annual purchase estimate</span>
            <input className="form-input" value={form.annualPurchase} onChange={(event) => updateForm('annualPurchase', event.target.value)} placeholder="$50k / 12,000 pcs / scheduled releases" required />
          </label>
          <label className="form-field">
            <span>Interested SKU</span>
            <input className="form-input" value={form.interestedSku} onChange={(event) => updateForm('interestedSku', event.target.value)} placeholder="Primary motor or driver family" />
          </label>
          <label className="form-field">
            <span>Full name</span>
            <input className="form-input" value={form.fullName} onChange={(event) => updateForm('fullName', event.target.value)} placeholder="Commercial or sourcing owner" required />
          </label>
          <label className="form-field">
            <span>Email</span>
            <input className="form-input" type="email" value={form.email} onChange={(event) => updateForm('email', event.target.value)} placeholder="name@company.com" required />
          </label>
          <label className="form-field">
            <span>Phone</span>
            <input className="form-input" value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} placeholder="Optional" />
          </label>
          <label className="form-field custom-field-span">
            <span>Program notes</span>
            <textarea className="form-input form-textarea" rows={4} value={form.notes} onChange={(event) => updateForm('notes', event.target.value)} placeholder="Forecast cadence, payment-term expectations, warehouse regions, or approval constraints." />
          </label>
        </div>

        <div className="trade-empty-actions">
          <Link href={quotePath} className="button-secondary">
            Open RFQ workspace
          </Link>
          <button type="submit" className="button-primary" disabled={isPending}>
            {isPending ? 'Submitting...' : 'Request contract pricing'}
          </button>
        </div>

        {feedback ? <p className={`form-feedback form-feedback-${feedback.tone}`}>{feedback.text}</p> : null}
      </form>
    </div>
  );
}