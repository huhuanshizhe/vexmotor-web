'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';

import { login as authLogin, register as authRegister } from '@/lib/auth-client';

import type { Locale } from '@/lib/i18n';
import { withLocalePath } from '@/lib/i18n';

type RegisterBusinessFormProps = {
  locale: Locale;
  initialEmail?: string;
};

type RegisterFormState = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: string;
  companyName: string;
  country: string;
  industry: string;
  companySize: string;
  website: string;
  taxId: string;
  annualVolumeEstimate: string;
  documents: string[];
  termsAccepted: boolean;
  privacyAccepted: boolean;
  exportComplianceAccepted: boolean;
};

const REGISTRATION_DRAFT_STORAGE_KEY = 'vexmotor-register-draft';
const REGISTRATION_STEPS = ['Account', 'Company', 'Verification'];
const ROLE_OPTIONS = ['Purchasing', 'Engineering', 'Operations', 'Founder / Owner', 'Other'];
const COUNTRY_OPTIONS = ['United States', 'Germany', 'France', 'Spain', 'United Kingdom', 'Canada', 'Mexico', 'China', 'Japan', 'Other'];
const INDUSTRY_OPTIONS = ['Factory Automation', 'Robotics', 'Medical Devices', 'Packaging', 'CNC & Tooling', 'Energy', 'University / Lab'];
const COMPANY_SIZE_OPTIONS = ['1-10', '11-50', '51-200', '201-1000', '1000+'];

const EMPTY_FORM: RegisterFormState = {
  email: '',
  firstName: '',
  lastName: '',
  password: '',
  role: 'Purchasing',
  companyName: '',
  country: 'United States',
  industry: 'Factory Automation',
  companySize: '11-50',
  website: '',
  taxId: '',
  annualVolumeEstimate: '',
  documents: [],
  termsAccepted: false,
  privacyAccepted: false,
  exportComplianceAccepted: false,
};

function getTaxIdLabel(country: string) {
  if (country === 'United States') {
    return 'Tax ID / EIN';
  }

  if (['Germany', 'France', 'Spain', 'United Kingdom'].includes(country)) {
    return 'VAT / Tax ID / EORI';
  }

  return 'VAT / Tax ID / EORI';
}

function readDraft() {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = window.localStorage.getItem(REGISTRATION_DRAFT_STORAGE_KEY);
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as RegisterFormState;
  } catch {
    window.localStorage.removeItem(REGISTRATION_DRAFT_STORAGE_KEY);
    return null;
  }
}

function validateStep(stepIndex: number, form: RegisterFormState) {
  if (stepIndex === 0) {
    if (!form.email.trim() || !form.firstName.trim() || !form.lastName.trim() || !form.password.trim()) {
      return 'Complete email, name, and password before moving on.';
    }
    if (form.password.trim().length < 8) {
      return 'Use a password with at least 8 characters.';
    }
  }

  if (stepIndex === 1) {
    if (!form.companyName.trim() || !form.country.trim() || !form.industry.trim() || !form.companySize.trim()) {
      return 'Complete the company profile before moving on.';
    }
  }

  if (stepIndex === 2) {
    if (!form.termsAccepted || !form.privacyAccepted || !form.exportComplianceAccepted) {
      return 'Accept the required terms and compliance statements before submitting.';
    }
  }

  return null;
}

export function RegisterBusinessForm({ locale, initialEmail }: RegisterBusinessFormProps) {
  const router = useRouter();
  const normalizedInitialEmail = initialEmail?.trim().toLowerCase() ?? '';
  const [form, setForm] = useState<RegisterFormState>({ ...EMPTY_FORM, email: normalizedInitialEmail });
  const [stepIndex, setStepIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const draft = readDraft();
    if (draft) {
      setForm({
        ...EMPTY_FORM,
        ...draft,
        email: normalizedInitialEmail || draft.email,
      });
    }
  }, [normalizedInitialEmail]);

  useEffect(() => {
    window.localStorage.setItem(REGISTRATION_DRAFT_STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  const taxIdLabel = useMemo(() => getTaxIdLabel(form.country), [form.country]);

  function updateForm<K extends keyof RegisterFormState>(key: K, value: RegisterFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFeedback(null);
    setSavedMessage(null);
  }

  function saveDraft() {
    window.localStorage.setItem(REGISTRATION_DRAFT_STORAGE_KEY, JSON.stringify(form));
    setSavedMessage('Draft saved locally in this browser.');
    setFeedback(null);
  }

  function goNext() {
    const validationError = validateStep(stepIndex, form);
    if (validationError) {
      setFeedback(validationError);
      return;
    }

    setStepIndex((current) => Math.min(current + 1, REGISTRATION_STEPS.length - 1));
  }

  function goPrevious() {
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    updateForm('documents', Array.from(event.target.files ?? []).map((file) => file.name));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateStep(stepIndex, form) ?? validateStep(0, form) ?? validateStep(1, form) ?? validateStep(2, form);
    if (validationError) {
      setFeedback(validationError);
      return;
    }

    startTransition(async () => {
      setFeedback(null);
      setSavedMessage(null);

      try {
        const payload = await authRegister(form);
        window.localStorage.removeItem(REGISTRATION_DRAFT_STORAGE_KEY);

        try {
          await authLogin(form.email.trim().toLowerCase(), form.password);
        } catch {
          router.push(`${withLocalePath('/login', locale)}?registered=1&email=${encodeURIComponent(form.email.trim().toLowerCase())}`);
          router.refresh();
          return;
        }

        router.push((payload as { redirectPath?: string }).redirectPath ?? '/account?pendingReview=1');
        router.refresh();
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : 'Unable to create the business account right now.');
      }
    });
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-step-tabs" role="tablist" aria-label="Registration steps">
        {REGISTRATION_STEPS.map((step, index) => (
          <button
            key={step}
            type="button"
            className={`auth-step-tab${index === stepIndex ? ' is-active' : ''}${index < stepIndex ? ' is-complete' : ''}`}
            onClick={() => setStepIndex(index)}
          >
            <span>{index + 1}</span>
            <strong>{step}</strong>
          </button>
        ))}
      </div>

      {stepIndex === 0 ? (
        <div className="auth-form-grid">
          <label className="form-field">
            <span>Work email</span>
            <input className="form-input" type="email" value={form.email} onChange={(event) => updateForm('email', event.target.value)} placeholder="name@company.com" required disabled={isPending} />
          </label>
          <label className="form-field">
            <span>Role</span>
            <select className="form-input" value={form.role} onChange={(event) => updateForm('role', event.target.value)} disabled={isPending}>
              {ROLE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>First name</span>
            <input className="form-input" value={form.firstName} onChange={(event) => updateForm('firstName', event.target.value)} required disabled={isPending} />
          </label>
          <label className="form-field">
            <span>Last name</span>
            <input className="form-input" value={form.lastName} onChange={(event) => updateForm('lastName', event.target.value)} required disabled={isPending} />
          </label>
          <label className="form-field auth-form-grid-span">
            <span>Password</span>
            <input className="form-input" type="password" value={form.password} onChange={(event) => updateForm('password', event.target.value)} placeholder="Use at least 8 characters" required disabled={isPending} />
          </label>
        </div>
      ) : null}

      {stepIndex === 1 ? (
        <div className="auth-form-grid">
          <label className="form-field auth-form-grid-span">
            <span>Company name</span>
            <input className="form-input" value={form.companyName} onChange={(event) => updateForm('companyName', event.target.value)} required disabled={isPending} />
          </label>
          <label className="form-field">
            <span>Country</span>
            <select className="form-input" value={form.country} onChange={(event) => updateForm('country', event.target.value)} disabled={isPending}>
              {COUNTRY_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Industry</span>
            <select className="form-input" value={form.industry} onChange={(event) => updateForm('industry', event.target.value)} disabled={isPending}>
              {INDUSTRY_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Company size</span>
            <select className="form-input" value={form.companySize} onChange={(event) => updateForm('companySize', event.target.value)} disabled={isPending}>
              {COMPANY_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Website</span>
            <input className="form-input" type="url" value={form.website} onChange={(event) => updateForm('website', event.target.value)} placeholder="https://" disabled={isPending} />
          </label>
          <label className="form-field">
            <span>{taxIdLabel}</span>
            <input className="form-input" value={form.taxId} onChange={(event) => updateForm('taxId', event.target.value)} disabled={isPending} />
          </label>
          <label className="form-field">
            <span>Annual volume estimate</span>
            <input className="form-input" value={form.annualVolumeEstimate} onChange={(event) => updateForm('annualVolumeEstimate', event.target.value)} placeholder="Optional" disabled={isPending} />
          </label>
        </div>
      ) : null}

      {stepIndex === 2 ? (
        <div className="auth-form">
          <label className="form-field">
            <span>Business license / tax certificate</span>
            <input className="form-input" type="file" multiple onChange={handleFileChange} disabled={isPending} />
            <small className="section-description">Optional for now. Uploading helps accelerate review; skipping keeps the account in limited pending mode.</small>
          </label>
          {form.documents.length ? (
            <div className="auth-file-list">
              {form.documents.map((documentName) => (
                <span key={documentName} className="filter-chip">{documentName}</span>
              ))}
            </div>
          ) : null}
          <label className="auth-checkbox-row">
            <input type="checkbox" checked={form.termsAccepted} onChange={(event) => updateForm('termsAccepted', event.target.checked)} disabled={isPending} />
            <span>I agree to the Terms of Service.</span>
          </label>
          <label className="auth-checkbox-row">
            <input type="checkbox" checked={form.privacyAccepted} onChange={(event) => updateForm('privacyAccepted', event.target.checked)} disabled={isPending} />
            <span>I agree to the Privacy Policy.</span>
          </label>
          <label className="auth-checkbox-row">
            <input type="checkbox" checked={form.exportComplianceAccepted} onChange={(event) => updateForm('exportComplianceAccepted', event.target.checked)} disabled={isPending} />
            <span>I confirm export compliance responsibility for my organization.</span>
          </label>
        </div>
      ) : null}

      <div className="auth-inline-row">
        <button type="button" className="button-secondary" onClick={saveDraft} disabled={isPending}>
          Save draft
        </button>
        <div className="auth-inline-actions">
          {stepIndex > 0 ? (
            <button type="button" className="button-secondary" onClick={goPrevious} disabled={isPending}>
              Back
            </button>
          ) : null}
          {stepIndex < REGISTRATION_STEPS.length - 1 ? (
            <button type="button" className="button-primary" onClick={goNext} disabled={isPending}>
              Continue
            </button>
          ) : (
            <button type="submit" className="button-primary" disabled={isPending}>
              {isPending ? 'Creating account...' : 'Create business account'}
            </button>
          )}
        </div>
      </div>

      <div className="auth-link-row">
        <Link href={withLocalePath('/login', locale)} className="section-link">
          Already registered? Sign in
        </Link>
      </div>

      {savedMessage ? <p className="form-feedback form-feedback-success" role="status">{savedMessage}</p> : null}
      {feedback ? <p className="form-feedback form-feedback-error" role="alert">{feedback}</p> : null}
    </form>
  );
}