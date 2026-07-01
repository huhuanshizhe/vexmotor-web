'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';

import { CountrySelect } from '@/components/storefront/country-select';
import { IndustrySelect } from '@/components/storefront/industry-select';

import { useAuth } from '@/components/providers/auth-provider';
import {
  buildRegisterPayload,
  register as authRegister,
  uploadRegistrationDocument,
  type RegistrationDocumentInput,
} from '@/lib/auth-client';

import type { Locale } from '@/lib/i18n';
import { withLocalePath } from '@/lib/i18n';
import { fetchGeoCountries, resolveCountryCode } from '@/lib/geo-api';
import { fetchIndustries, resolveIndustrySlug } from '@/lib/industries-api';

type RegisterBusinessFormProps = {
  locale: Locale;
  initialEmail?: string;
  variant?: 'page' | 'checkout';
  onSuccess?: () => void | Promise<void>;
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
  documents: RegistrationDocumentInput[];
  termsAccepted: boolean;
  privacyAccepted: boolean;
  exportComplianceAccepted: boolean;
};

const REGISTRATION_DRAFT_STORAGE_KEY = 'vexmotor-register-draft';
const REGISTRATION_STEPS = ['Account', 'Company', 'Verification'];
const MAX_REGISTRATION_DOCUMENTS = 5;
const ROLE_OPTIONS = ['Purchasing', 'Engineering', 'Operations', 'Founder / Owner', 'Other'];
const COMPANY_SIZE_OPTIONS = ['1-10', '11-50', '51-200', '201-1000', '1000+'];

const EMPTY_FORM: RegisterFormState = {
  email: '',
  firstName: '',
  lastName: '',
  password: '',
  role: 'Purchasing',
  companyName: '',
  country: 'US',
  industry: 'factory-automation',
  companySize: '11-50',
  website: '',
  taxId: '',
  annualVolumeEstimate: '',
  documents: [],
  termsAccepted: false,
  privacyAccepted: false,
  exportComplianceAccepted: false,
};

type RegisterDraft = Omit<RegisterFormState, 'documents' | 'password'>;

type PendingUpload = {
  id: string;
  filename: string;
};

function createPendingUpload(filename: string): PendingUpload {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    filename,
  };
}

function getTaxIdLabel(country: string) {
  if (country === 'United States') {
    return 'Tax ID / EIN';
  }

  if (['Germany', 'France', 'Spain', 'United Kingdom'].includes(country)) {
    return 'VAT / Tax ID / EORI';
  }

  return 'VAT / Tax ID / EORI';
}

function readDraft(): RegisterDraft | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = window.localStorage.getItem(REGISTRATION_DRAFT_STORAGE_KEY);
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as RegisterDraft;
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

export function RegisterBusinessForm({ locale, initialEmail, variant = 'page', onSuccess }: RegisterBusinessFormProps) {
  const isCheckout = variant === 'checkout';
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const normalizedInitialEmail = initialEmail?.trim().toLowerCase() ?? '';
  const [form, setForm] = useState<RegisterFormState>({ ...EMPTY_FORM, email: normalizedInitialEmail });
  const [stepIndex, setStepIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isCheckout) {
      return;
    }

    const draft = readDraft();
    if (draft) {
      void Promise.all([fetchIndustries(), fetchGeoCountries()]).then(([industries, countries]) => {
        setForm({
          ...EMPTY_FORM,
          ...draft,
          industry: resolveIndustrySlug(industries, draft.industry) || EMPTY_FORM.industry,
          country: resolveCountryCode(countries, draft.country) || EMPTY_FORM.country,
          email: normalizedInitialEmail || draft.email,
          password: '',
          documents: [],
        });
      });
    }
  }, [normalizedInitialEmail, isCheckout]);

  useEffect(() => {
    if (isCheckout) {
      return;
    }

    const { documents: _documents, password: _password, ...draft } = form;
    window.localStorage.setItem(REGISTRATION_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [form, isCheckout]);

  const taxIdLabel = useMemo(() => getTaxIdLabel(form.country), [form.country]);

  function updateForm<K extends keyof RegisterFormState>(key: K, value: RegisterFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFeedback(null);
    setSavedMessage(null);
  }

  function saveDraft() {
    const { documents: _documents, password: _password, ...draft } = form;
    window.localStorage.setItem(REGISTRATION_DRAFT_STORAGE_KEY, JSON.stringify(draft));
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

  function removeDocument(key: string) {
    updateForm(
      'documents',
      form.documents.filter((document) => document.key !== key),
    );
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';

    if (!files.length) {
      return;
    }

    const remainingSlots = MAX_REGISTRATION_DOCUMENTS - form.documents.length - pendingUploads.length;
    if (remainingSlots <= 0) {
      setFeedback(`You can upload up to ${MAX_REGISTRATION_DOCUMENTS} documents.`);
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      setFeedback(`Only ${remainingSlots} more file${remainingSlots === 1 ? '' : 's'} can be added (maximum ${MAX_REGISTRATION_DOCUMENTS}).`);
    } else {
      setFeedback(null);
    }

    const queuedUploads = filesToUpload.map((file) => createPendingUpload(file.name));
    setPendingUploads((current) => [...current, ...queuedUploads]);
    setUploadingFiles(true);

    const uploadResults = await Promise.all(
      filesToUpload.map(async (file, index) => {
        const pendingId = queuedUploads[index]?.id;
        if (!pendingId) {
          return { ok: false as const, pendingId: '', message: 'Unable to queue the selected file.' };
        }

        try {
          const uploaded = await uploadRegistrationDocument(file);
          return { ok: true as const, pendingId, uploaded };
        } catch (error) {
          return {
            ok: false as const,
            pendingId,
            message: error instanceof Error ? error.message : 'Unable to upload the selected file.',
          };
        }
      }),
    );

    const uploadedDocuments: RegistrationDocumentInput[] = [];
    const uploadErrors: string[] = [];

    for (const result of uploadResults) {
      setPendingUploads((current) => current.filter((item) => item.id !== result.pendingId));
      if (result.ok) {
        uploadedDocuments.push(result.uploaded);
      } else if (result.message) {
        uploadErrors.push(result.message);
      }
    }

    if (uploadedDocuments.length) {
      setForm((current) => ({
        ...current,
        documents: [...current.documents, ...uploadedDocuments],
      }));
    }

    if (uploadErrors.length) {
      setFeedback(uploadErrors[0] ?? 'Unable to upload the selected file.');
    }

    setUploadingFiles(false);
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
        await authRegister(buildRegisterPayload(form));
        window.localStorage.removeItem(REGISTRATION_DRAFT_STORAGE_KEY);
        await refreshProfile();
        if (onSuccess) {
          await onSuccess();
          return;
        }
        const redirectPath = '/account';
        router.push(withLocalePath(redirectPath, locale));
        router.refresh();
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : 'Unable to create the business account right now.');
      }
    });
  }

  const formClassName = isCheckout ? 'auth-form checkout-auth-form' : 'auth-form';
  const stepTabClass = isCheckout ? 'checkout-auth-step' : 'auth-step-tab';
  const gridClassName = isCheckout ? 'checkout-auth-form-grid' : 'auth-form-grid';
  const gridSpanClass = isCheckout ? 'checkout-auth-grid-span' : 'auth-form-grid-span';

  return (
    <form className={formClassName} onSubmit={handleSubmit}>
      <div className={isCheckout ? 'checkout-auth-step-tabs' : 'auth-step-tabs'} role="tablist" aria-label="Registration steps">
        {REGISTRATION_STEPS.map((step, index) => (
          <button
            key={step}
            type="button"
            className={`${stepTabClass}${index === stepIndex ? ' is-active' : ''}${index < stepIndex ? ' is-complete' : ''}`}
            onClick={() => setStepIndex(index)}
          >
            <span>{index + 1}</span>
            <strong>{step}</strong>
          </button>
        ))}
      </div>

      {stepIndex === 0 ? (
        <div className={gridClassName}>
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
          <label className={`form-field ${gridSpanClass}`}>
            <span>Password</span>
            <input className="form-input" type="password" value={form.password} onChange={(event) => updateForm('password', event.target.value)} placeholder="Use at least 8 characters" required disabled={isPending} />
          </label>
        </div>
      ) : null}

      {stepIndex === 1 ? (
        <div className={gridClassName}>
          <label className={`form-field ${gridSpanClass}`}>
            <span>Company name</span>
            <input className="form-input" value={form.companyName} onChange={(event) => updateForm('companyName', event.target.value)} required disabled={isPending} />
          </label>
          <label className="form-field">
            <span>Country</span>
            <CountrySelect
              className="form-input"
              value={form.country}
              onChange={(value) => updateForm('country', value)}
              disabled={isPending}
              required
            />
          </label>
          <label className="form-field">
            <span>Industry</span>
            <IndustrySelect
              className="form-input"
              value={form.industry}
              onChange={(value) => updateForm('industry', value)}
              disabled={isPending}
              required
            />
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
            <div className="auth-file-input-shell">
              <input className="form-input" type="file" multiple onChange={handleFileChange} disabled={isPending || uploadingFiles || form.documents.length + pendingUploads.length >= MAX_REGISTRATION_DOCUMENTS} />
            </div>
            <small className="section-description">
              Optional. Upload up to {MAX_REGISTRATION_DOCUMENTS} files (PDF, Office, or images). Files are stored securely for B2B verification and account reconciliation.
            </small>
          </label>
          {pendingUploads.length || form.documents.length ? (
            <div className="auth-file-list" role={pendingUploads.length ? 'status' : undefined} aria-live={pendingUploads.length ? 'polite' : undefined}>
              {pendingUploads.map((pending) => (
                <span key={pending.id} className="auth-file-chip is-uploading">
                  <span className="auth-file-spinner" aria-hidden="true" />
                  <span className="auth-file-chip-name">{pending.filename}</span>
                </span>
              ))}
              {form.documents.map((document) => (
                <span key={document.key} className="auth-file-chip">
                  <span className="auth-file-chip-name">{document.filename}</span>
                  <button type="button" className="auth-file-chip-remove" onClick={() => removeDocument(document.key)} disabled={isPending || uploadingFiles}>
                    Remove
                  </button>
                </span>
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
        {!isCheckout ? (
          <button type="button" className="button-secondary" onClick={saveDraft} disabled={isPending}>
            Save draft
          </button>
        ) : null}
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
            <button type="submit" className="button-primary" disabled={isPending || uploadingFiles}>
              {isPending ? 'Creating account...' : 'Create business account'}
            </button>
          )}
        </div>
      </div>

      {!isCheckout ? (
        <div className="auth-link-row">
          <Link href={withLocalePath('/login', locale)} className="section-link">
            Already registered? Sign in
          </Link>
        </div>
      ) : null}

      {savedMessage ? <p className="form-feedback form-feedback-success" role="status">{savedMessage}</p> : null}
      {feedback ? <p className="form-feedback form-feedback-error" role="alert">{feedback}</p> : null}
    </form>
  );
}
