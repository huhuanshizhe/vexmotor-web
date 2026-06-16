'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { apiFetch } from '@/lib/api-client';

type ProductInquiryFormProps = {
  productId: string;
  productName: string;
  mode?: 'product' | 'rfq';
  submitLabel?: string;
  successMessage?: string;
  contextNote?: string;
};

type InquiryFormState = {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  country: string;
  estimatedQuantity: string;
  targetLeadTime: string;
  message: string;
};

type InquiryReceipt = {
  id: string;
  fullName?: string | null;
  email?: string | null;
  redirectPath?: string;
};

function createInitialState(productName: string, mode: 'product' | 'rfq'): InquiryFormState {
  return {
    fullName: '',
    email: '',
    phone: '',
    company: '',
    country: '',
    estimatedQuantity: '',
    targetLeadTime: '',
    message:
      mode === 'rfq'
        ? `Please share pricing, MOQ, engineering review steps, and export lead time for ${productName}.`
        : `Please share pricing, lead time, MOQ, and shipping details for ${productName}.`,
  };
}

export function ProductInquiryForm({
  productId,
  productName,
  mode = 'product',
  submitLabel,
  successMessage,
  contextNote,
}: ProductInquiryFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<InquiryFormState>(() => createInitialState(productName, mode));
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [receipt, setReceipt] = useState<InquiryReceipt | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateField<K extends keyof InquiryFormState>(key: K, value: InquiryFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      setFeedback(null);
      setReceipt(null);

      try {
        const created = await apiFetch<InquiryReceipt>('/api/front/inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId,
            fullName: form.fullName,
            email: form.email,
            phone: form.phone,
            company: form.company,
            country: form.country,
            message: [
              form.message.trim(),
              form.estimatedQuantity.trim() ? `Estimated Quantity: ${form.estimatedQuantity.trim()}` : null,
              form.targetLeadTime.trim() ? `Target Lead Time: ${form.targetLeadTime.trim()}` : null,
            ]
              .filter(Boolean)
              .join('\n'),
          }),
        });

        if (created.redirectPath) {
          router.push(created.redirectPath);
          router.refresh();
          return;
        }

        setFeedback({ tone: 'success', text: successMessage ?? 'Inquiry submitted. Our sales team will follow up shortly.' });
        setReceipt(created);
        setForm(createInitialState(productName, mode));
        router.refresh();
      } catch (error) {
        setFeedback({
          tone: 'error',
          text: error instanceof Error ? error.message : 'Unable to submit your inquiry right now.',
        });
      }
    });
  }

  return (
    <form className="inquiry-form" onSubmit={handleSubmit}>
      <div className="inquiry-form-grid">
        <label className="form-field">
          <span>Full name</span>
          <input
            className="form-input"
            value={form.fullName}
            onChange={(event) => updateField('fullName', event.target.value)}
            placeholder="Your name"
            required
            disabled={isPending}
          />
        </label>
        <label className="form-field">
          <span>Email</span>
          <input
            className="form-input"
            type="email"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            placeholder="name@company.com"
            required
            disabled={isPending}
          />
        </label>
        <label className="form-field">
          <span>Phone</span>
          <input
            className="form-input"
            value={form.phone}
            onChange={(event) => updateField('phone', event.target.value)}
            placeholder="Optional"
            disabled={isPending}
          />
        </label>
        <label className="form-field">
          <span>Company</span>
          <input
            className="form-input"
            value={form.company}
            onChange={(event) => updateField('company', event.target.value)}
            placeholder="Optional"
            disabled={isPending}
          />
        </label>
        <label className="form-field">
          <span>Country</span>
          <input
            className="form-input"
            value={form.country}
            onChange={(event) => updateField('country', event.target.value)}
            placeholder="Optional"
            disabled={isPending}
          />
        </label>
        <label className="form-field">
          <span>Estimated Quantity</span>
          <input
            className="form-input"
            value={form.estimatedQuantity}
            onChange={(event) => updateField('estimatedQuantity', event.target.value)}
            placeholder={mode === 'rfq' ? 'Prototype, pilot, or annual volume' : 'Optional quantity target'}
            disabled={isPending}
          />
        </label>
        <label className="form-field">
          <span>Target Lead Time</span>
          <input
            className="form-input"
            value={form.targetLeadTime}
            onChange={(event) => updateField('targetLeadTime', event.target.value)}
            placeholder="Optional delivery expectation"
            disabled={isPending}
          />
        </label>
        <div className="form-field form-note-card">
          <span>{mode === 'rfq' ? 'RFQ Channel' : 'Product'}</span>
          <strong>{productName}</strong>
          <span className="section-description compact-copy">
            {contextNote ??
              (mode === 'rfq'
                ? 'Use this route for OEM projects, bundle requests, or non-standard configurations that need quotation review.'
                : 'This inquiry will be attached to the current product detail page.')}
          </span>
        </div>
      </div>
      <label className="form-field">
        <span>{mode === 'rfq' ? 'Procurement details' : 'Project details'}</span>
        <textarea
          className="form-input form-textarea"
          value={form.message}
          onChange={(event) => updateField('message', event.target.value)}
          required
          disabled={isPending}
          rows={6}
        />
      </label>
      <div className="inquiry-form-actions">
        <button type="submit" className="button-primary" disabled={isPending}>
          {isPending ? 'Submitting...' : submitLabel ?? (mode === 'rfq' ? 'Send RFQ' : 'Submit Inquiry')}
        </button>
        <span className="section-description compact-copy">
          Guest submission is supported. Logged-in users can review submitted inquiries in their account center.
        </span>
      </div>
      {feedback ? (
        <p className={`form-feedback form-feedback-${feedback.tone}`} aria-live="polite">
          {feedback.text}
        </p>
      ) : null}
      {receipt ? (
        <div className="form-feedback form-feedback-success" aria-live="polite" style={{ display: 'grid', gap: 10 }}>
          <strong>Reference ID: {receipt.id.slice(0, 8).toUpperCase()}</strong>
          <span>
            {mode === 'rfq'
              ? 'Sales will review your scope, quantity band, and lead-time target before responding with the right quotation path.'
              : 'The inquiry is now attached to this product context for follow-up from sales or engineering.'}
          </span>
          <button type="button" className="button-secondary cart-action-button" onClick={() => setReceipt(null)}>
            Submit another request
          </button>
        </div>
      ) : null}
    </form>
  );
}