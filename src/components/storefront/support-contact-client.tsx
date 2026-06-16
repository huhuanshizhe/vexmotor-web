'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';

import { apiFetch } from '@/lib/api-client';
import type { Locale } from '@/lib/i18n';
import { withLocalePath } from '@/lib/i18n';

type SupportTopic = 'sales' | 'technical' | 'order-issue' | 'logistics' | 'press' | 'partnership';

type SupportContactClientProps = {
  locale: Locale;
  intakeProductId: string;
  initialTopic?: SupportTopic;
};

type SupportContactState = {
  topic: SupportTopic;
  fullName: string;
  email: string;
  phone: string;
  company: string;
  country: string;
  extraContext: string;
  message: string;
};

type SupportTopicConfig = {
  label: string;
  guidance: string;
  extraLabel: string;
  extraPlaceholder: string;
  successHint: string;
};

const TOPIC_CONFIG: Record<SupportTopic, SupportTopicConfig> = {
  sales: {
    label: 'Sales',
    guidance: 'Use sales for pricing, MOQ, availability, or cross-family sourcing questions that are not blocked by a field issue.',
    extraLabel: 'Target products or SKU family',
    extraPlaceholder: 'Stepper drivers, NEMA 23 motors, power supplies...',
    successHint: 'Sales will review the commercial context and route the request into the right quote or catalog path.',
  },
  technical: {
    label: 'Technical',
    guidance: 'Use technical for sizing, wiring, tuning, compatibility, or integration questions that need an engineering answer.',
    extraLabel: 'System context',
    extraPlaceholder: 'Controller model, voltage, torque target, load details...',
    successHint: 'Engineering support will review the setup details and decide whether the next step is selector guidance, documentation, or a live troubleshooting handoff.',
  },
  'order-issue': {
    label: 'Order issue',
    guidance: 'Use this when the request is tied to an existing order, missing item, wrong shipment, or post-purchase mismatch that needs case handling.',
    extraLabel: 'Order reference',
    extraPlaceholder: 'Order number, buyer PO, shipment reference...',
    successHint: 'Support will use the order reference to match the case against the shipping or return workflow quickly.',
  },
  logistics: {
    label: 'Logistics',
    guidance: 'Use logistics for transit timing, customs, duty handling, warehouse coordination, or delivery changes that need a support reply.',
    extraLabel: 'Shipment lane or destination',
    extraPlaceholder: 'Los Angeles warehouse, DDP Germany, urgent air shipment...',
    successHint: 'The logistics desk will review the routing details and reply with the correct shipping or customs path.',
  },
  press: {
    label: 'Press',
    guidance: 'Use press for media requests, publication interviews, product-feature stories, and company background requests.',
    extraLabel: 'Publication or outlet',
    extraPlaceholder: 'Magazine, publication, podcast, media company...',
    successHint: 'The request will be routed into the company and communication contact path.',
  },
  partnership: {
    label: 'Partnership',
    guidance: 'Use partnership for distribution, channel, integration, reseller, or ecosystem cooperation discussions.',
    extraLabel: 'Partnership type',
    extraPlaceholder: 'Distributor, systems integrator, OEM channel, education...',
    successHint: 'The commercial team will route the partnership request to the appropriate owner for follow-up.',
  },
};

const INITIAL_STATE: SupportContactState = {
  topic: 'sales',
  fullName: '',
  email: '',
  phone: '',
  company: '',
  country: '',
  extraContext: '',
  message: '',
};

function buildSupportContactMessage(form: SupportContactState, attachments: string[]) {
  const topic = TOPIC_CONFIG[form.topic];

  return [
    'SUPPORT CONTACT REQUEST',
    `Topic: ${topic.label}`,
    `Guidance route: ${topic.guidance}`,
    `Company: ${form.company || 'Not specified'}`,
    `Country: ${form.country || 'Not specified'}`,
    `Phone: ${form.phone || 'Not specified'}`,
    `${topic.extraLabel}: ${form.extraContext || 'Not specified'}`,
    `Attachments: ${attachments.length ? attachments.join(', ') : 'None listed'}`,
    'Message:',
    form.message || 'Not specified',
  ].join('\n');
}

function createInitialState(initialTopic?: SupportTopic): SupportContactState {
  const topic = initialTopic && TOPIC_CONFIG[initialTopic] ? initialTopic : 'sales';

  return {
    ...INITIAL_STATE,
    topic,
    message: TOPIC_CONFIG[topic].guidance,
  };
}

function UploadSummary({ attachments }: { attachments: string[] }) {
  if (!attachments.length) {
    return <span className="section-description compact-copy">Files are referenced by name in the ticket. Upload storage can be wired later without changing the intake path.</span>;
  }

  return (
    <div className="custom-upload-list">
      {attachments.map((name) => (
        <span key={name} className="custom-upload-pill">
          {name}
        </span>
      ))}
    </div>
  );
}

export function SupportContactClient({ locale, intakeProductId, initialTopic }: SupportContactClientProps) {
  const [form, setForm] = useState<SupportContactState>(() => createInitialState(initialTopic));
  const [attachments, setAttachments] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [receipt, setReceipt] = useState<{ id: string; redirectPath?: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const topicConfig = TOPIC_CONFIG[form.topic];

  function updateField<K extends keyof SupportContactState>(key: K, value: SupportContactState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFeedback(null);
  }

  function handleTopicChange(topic: SupportTopic) {
    setForm((current) => ({
      ...current,
      topic,
      extraContext: '',
      message: current.message.trim() ? current.message : TOPIC_CONFIG[topic].guidance,
    }));
    setFeedback(null);
  }

  function handleAttachmentChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).map((file) => file.name);
    setAttachments(files);
  }

  function validateForm() {
    if (!form.fullName.trim() || !form.email.trim()) {
      return 'Full name and email are required before submitting a support contact request.';
    }

    if (!form.company.trim()) {
      return 'Company is required so the team can route the request correctly.';
    }

    if (!form.message.trim()) {
      return 'Please include a short message describing the request.';
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
        const created = await apiFetch<{ id: string; redirectPath?: string }>('/api/front/inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: intakeProductId,
            fullName: form.fullName,
            email: form.email,
            phone: form.phone,
            company: form.company,
            country: form.country,
            message: buildSupportContactMessage(form, attachments),
          }),
        });

        setReceipt(created);
        setFeedback({ tone: 'success', text: `${topicConfig.successHint} Ticket #${created.id.slice(0, 8).toUpperCase()} has been created.` });
        setForm(createInitialState(form.topic));
        setAttachments([]);
      } catch (error) {
        setFeedback({ tone: 'error', text: error instanceof Error ? error.message : 'Unable to submit the support request right now.' });
      }
    });
  }

  return (
    <div className="support-contact-stack">
      {form.topic === 'technical' ? (
        <article className="info-card support-contact-guidance">
          <div className="card-kicker">Suggested before submit</div>
          <h2 className="cart-section-title">Technical issues often resolve faster with selector and support references</h2>
          <div className="trade-empty-actions">
            <Link href={withLocalePath('/support', locale)} className="button-secondary">
              Open Help Center
            </Link>
            <Link href={withLocalePath('/selector', locale)} className="button-secondary">
              Open Selector Tool
            </Link>
          </div>
        </article>
      ) : null}

      <form className="info-card support-contact-form" onSubmit={handleSubmit}>
        <div className="section-header trade-card-header">
          <div>
            <div className="card-kicker">Submit ticket</div>
            <h2 className="cart-section-title">Support contact form</h2>
            <p className="section-description">Pick the topic first so the request lands in the right queue, then include enough context for first-pass triage.</p>
          </div>
        </div>

        <div className="custom-form-grid">
          <label className="form-field">
            <span>Topic</span>
            <select className="form-input" value={form.topic} onChange={(event) => handleTopicChange(event.target.value as SupportTopic)}>
              {Object.entries(TOPIC_CONFIG).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Company</span>
            <input className="form-input" value={form.company} onChange={(event) => updateField('company', event.target.value)} placeholder="Company name" required disabled={isPending} />
          </label>

          <label className="form-field">
            <span>Country</span>
            <input className="form-input" value={form.country} onChange={(event) => updateField('country', event.target.value)} placeholder="Country or region" disabled={isPending} />
          </label>

          <label className="form-field">
            <span>Full name</span>
            <input className="form-input" value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} placeholder="Contact owner" required disabled={isPending} />
          </label>

          <label className="form-field">
            <span>Email</span>
            <input className="form-input" type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="name@company.com" required disabled={isPending} />
          </label>

          <label className="form-field">
            <span>Phone</span>
            <input className="form-input" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="Optional direct number" disabled={isPending} />
          </label>

          <label className="form-field">
            <span>{topicConfig.extraLabel}</span>
            <input className="form-input" value={form.extraContext} onChange={(event) => updateField('extraContext', event.target.value)} placeholder={topicConfig.extraPlaceholder} disabled={isPending} />
          </label>

          <label className="form-field">
            <span>Optional attachments</span>
            <input className="form-input" type="file" multiple onChange={handleAttachmentChange} disabled={isPending} />
            <UploadSummary attachments={attachments} />
          </label>

          <div className="form-field form-note-card">
            <span>Routing guidance</span>
            <strong>{topicConfig.label}</strong>
            <span className="section-description compact-copy">{topicConfig.guidance}</span>
          </div>
        </div>

        <label className="form-field">
          <span>Message</span>
          <textarea
            className="form-input form-textarea"
            rows={6}
            value={form.message}
            onChange={(event) => updateField('message', event.target.value)}
            placeholder="Describe the request, timeline, and any blockers."
            required
            disabled={isPending}
          />
        </label>

        <div className="inquiry-form-actions">
          <button type="submit" className="button-primary" disabled={isPending}>
            {isPending ? 'Submitting...' : 'Submit Support Ticket'}
          </button>
          <span className="section-description compact-copy">The current storefront will create an inquiry record and return a ticket reference immediately.</span>
        </div>

        {feedback ? (
          <p className={`form-feedback form-feedback-${feedback.tone}`} aria-live="polite">
            {feedback.text}
          </p>
        ) : null}

        {receipt ? (
          <div className="form-feedback form-feedback-success support-contact-receipt" aria-live="polite">
            <strong>Ticket #{receipt.id.slice(0, 8).toUpperCase()}</strong>
            <span>The request is now in the support queue. Use the inquiry record if you need to reference the case in follow-up communication.</span>
            {receipt.redirectPath ? (
              <Link href={receipt.redirectPath} className="button-secondary cart-action-button">
                Open Inquiry Record
              </Link>
            ) : null}
          </div>
        ) : null}
      </form>
    </div>
  );
}