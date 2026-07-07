'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';

import { CountrySelect } from '@/components/storefront/country-select';
import { IndustrySelect } from '@/components/storefront/industry-select';
import type { InquiryAttachment } from '@/lib/inquiry-api';
import { submitContactInquiry, uploadInquiryDocument } from '@/lib/inquiry-api';
import { MAX_QUOTE_ATTACHMENTS } from '@/lib/quote-form-options';

type ContactFormState = {
  contact: {
    fullName: string;
    email: string;
    company: string;
    country: string;
    phone: string;
    vat: string;
  };
  project: {
    projectName: string;
    industry: string;
    targetStartDate: string;
    annualVolumeEstimate: string;
  };
  procurementDetails: string;
  projectAttachments: InquiryAttachment[];
};

const EMPTY_FORM: ContactFormState = {
  contact: {
    fullName: '',
    email: '',
    company: '',
    country: 'US',
    phone: '',
    vat: '',
  },
  project: {
    projectName: '',
    industry: '',
    targetStartDate: '',
    annualVolumeEstimate: '',
  },
  procurementDetails: '',
  projectAttachments: [],
};

type ContactInquiryFormProps = {
  submitLabel?: string;
  successMessage?: string;
  contextNote?: string;
};

export function ContactInquiryForm({
  submitLabel = 'Send inquiry',
  successMessage = 'Inquiry submitted. Our team will follow up shortly.',
  contextNote,
}: ContactInquiryFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<ContactFormState>(EMPTY_FORM);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [isPending, startTransition] = useTransition();

  const uploading = uploadingCount > 0;

  function updateContactField<K extends keyof ContactFormState['contact']>(
    field: K,
    value: ContactFormState['contact'][K],
  ) {
    setForm((current) => ({ ...current, contact: { ...current.contact, [field]: value } }));
  }

  function updateProjectField<K extends keyof ContactFormState['project']>(
    field: K,
    value: ContactFormState['project'][K],
  ) {
    setForm((current) => ({ ...current, project: { ...current.project, [field]: value } }));
  }

  async function handleAttachmentUpload(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    const remaining = MAX_QUOTE_ATTACHMENTS - form.projectAttachments.length;
    const batch = Array.from(files).slice(0, remaining);

    for (const file of batch) {
      setUploadingCount((count) => count + 1);
      try {
        const uploaded = await uploadInquiryDocument(file);
        setForm((current) => ({
          ...current,
          projectAttachments: [...current.projectAttachments, uploaded],
        }));
      } catch (error) {
        setFeedback({
          tone: 'error',
          text: error instanceof Error ? error.message : 'Unable to upload attachment.',
        });
      } finally {
        setUploadingCount((count) => Math.max(0, count - 1));
      }
    }
  }

  function removeAttachment(index: number) {
    setForm((current) => ({
      ...current,
      projectAttachments: current.projectAttachments.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !form.contact.fullName.trim()
      || !form.contact.email.trim()
      || !form.contact.company.trim()
      || !form.contact.country.trim()
      || !form.contact.phone.trim()
      || !form.procurementDetails.trim()
    ) {
      setFeedback({ tone: 'error', text: 'Please complete all required fields, including procurement details.' });
      return;
    }

    startTransition(async () => {
      setFeedback(null);

      try {
        const result = await submitContactInquiry({
          fullName: form.contact.fullName.trim(),
          email: form.contact.email.trim(),
          phone: form.contact.phone.trim(),
          company: form.contact.company.trim(),
          country: form.contact.country.trim(),
          rfqPayload: {
            kind: 'contact',
            procurementDetails: form.procurementDetails.trim(),
            project: form.project,
            contact: { ...form.contact, createAccount: false },
            compliance: {
              unrestrictedUseConfirmed: true,
              complianceAccepted: true,
            },
            lines: [],
            projectAttachments: form.projectAttachments,
          },
        });

        if (result.redirectPath) {
          router.push(result.redirectPath);
          router.refresh();
          return;
        }

        setFeedback({ tone: 'success', text: successMessage });
        setForm(EMPTY_FORM);
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
      {contextNote ? <p className="section-description">{contextNote}</p> : null}

      <div className="inquiry-form-grid">
        <label className="form-field">
          <span className="form-field__label--required">Full name</span>
          <input className="form-input" value={form.contact.fullName} onChange={(e) => updateContactField('fullName', e.target.value)} required disabled={isPending} />
        </label>
        <label className="form-field">
          <span className="form-field__label--required">Email</span>
          <input className="form-input" type="email" value={form.contact.email} onChange={(e) => updateContactField('email', e.target.value)} required disabled={isPending} />
        </label>
        <label className="form-field">
          <span className="form-field__label--required">Company</span>
          <input className="form-input" value={form.contact.company} onChange={(e) => updateContactField('company', e.target.value)} required disabled={isPending} />
        </label>
        <label className="form-field">
          <span className="form-field__label--required">Country</span>
          <CountrySelect className="form-input" value={form.contact.country} onChange={(value) => updateContactField('country', value)} required disabled={isPending} />
        </label>
        <label className="form-field">
          <span className="form-field__label--required">Phone</span>
          <input className="form-input" value={form.contact.phone} onChange={(e) => updateContactField('phone', e.target.value)} required disabled={isPending} />
        </label>
        <label className="form-field">
          <span className="form-field__label--optional">VAT / Tax ID</span>
          <input className="form-input" value={form.contact.vat} onChange={(e) => updateContactField('vat', e.target.value)} disabled={isPending} />
        </label>
      </div>

      <div className="inquiry-form-grid">
        <label className="form-field form-field--wide">
          <span className="form-field__label--optional">Project name</span>
          <input className="form-input" value={form.project.projectName} onChange={(e) => updateProjectField('projectName', e.target.value)} disabled={isPending} />
        </label>
        <label className="form-field">
          <span className="form-field__label--optional">Industry</span>
          <IndustrySelect className="form-input" value={form.project.industry} onChange={(value) => updateProjectField('industry', value)} disabled={isPending} />
        </label>
        <label className="form-field">
          <span className="form-field__label--optional">Target start date</span>
          <input className="form-input" type="date" value={form.project.targetStartDate} onChange={(e) => updateProjectField('targetStartDate', e.target.value)} disabled={isPending} />
        </label>
        <label className="form-field form-field--wide">
          <span className="form-field__label--optional">Annual volume estimate</span>
          <input className="form-input" value={form.project.annualVolumeEstimate} onChange={(e) => updateProjectField('annualVolumeEstimate', e.target.value)} disabled={isPending} />
        </label>
      </div>

      <label className="form-field">
        <span className="form-field__label--required">Procurement details</span>
        <textarea
          className="form-input"
          rows={5}
          value={form.procurementDetails}
          onChange={(e) => setForm((current) => ({ ...current, procurementDetails: e.target.value }))}
          placeholder="Describe your sourcing scope, specifications, compliance needs, and timeline."
          required
          disabled={isPending}
        />
      </label>

      <div className="form-field">
        <span className="form-field__label--optional">Attachments</span>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="form-input"
          disabled={isPending || uploading || form.projectAttachments.length >= MAX_QUOTE_ATTACHMENTS}
          onChange={(event) => {
            void handleAttachmentUpload(event.target.files);
            event.target.value = '';
          }}
        />
        {form.projectAttachments.length ? (
          <ul className="inline-link-list">
            {form.projectAttachments.map((file, index) => (
              <li key={file.key}>
                <span>{file.filename}</span>
                <button type="button" className="section-link" onClick={() => removeAttachment(index)} disabled={isPending}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="section-description">Optional supporting files (up to {MAX_QUOTE_ATTACHMENTS}).</p>
        )}
      </div>

      <button type="submit" className="button-primary" disabled={isPending || uploading}>
        {isPending ? 'Sending…' : submitLabel}
      </button>

      {feedback ? (
        <p className={feedback.tone === 'success' ? 'form-feedback form-feedback-success' : 'form-feedback form-feedback-error'}>
          {feedback.text}
        </p>
      ) : null}
    </form>
  );
}
