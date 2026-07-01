'use client';

import { LocalizedLink as Link } from '@/components/i18n/localized-link';
import { CountrySelect } from '@/components/storefront/country-select';
import { IndustrySelect } from '@/components/storefront/industry-select';
import { useAuth } from '@/components/providers/auth-provider';
import { useCountries } from '@/hooks/use-countries';
import { useIndustries } from '@/hooks/use-industries';
import {
  getCompanyProfile,
  updateCompanyProfile,
  type CompanyProfile,
} from '@/lib/auth-client';
import { withLocalePath, type Locale } from '@/lib/i18n';
import { useEffect, useMemo, useState, useTransition } from 'react';

const COMPANY_SIZE_OPTIONS = ['1-10', '11-50', '51-200', '201-1000', '1000+'] as const;

type CompanyFormState = {
  company: string;
  industry: string;
  companyCountryCode: string;
  companyState: string;
  companyCity: string;
  companyAddressLine1: string;
  companyAddressLine2: string;
  companyPostalCode: string;
  website: string;
  taxId: string;
  companySize: string;
  annualVolumeEstimate: string;
};

type AccountCompanyClientProps = {
  locale?: Locale;
};

function profileToForm(profile: CompanyProfile): CompanyFormState {
  return {
    company: profile.company ?? '',
    industry: profile.industry ?? '',
    companyCountryCode: profile.companyCountryCode ?? '',
    companyState: profile.companyState ?? '',
    companyCity: profile.companyCity ?? '',
    companyAddressLine1: profile.companyAddressLine1 ?? '',
    companyAddressLine2: profile.companyAddressLine2 ?? '',
    companyPostalCode: profile.companyPostalCode ?? '',
    website: profile.website ?? '',
    taxId: profile.taxId ?? '',
    companySize: profile.companySize ?? '',
    annualVolumeEstimate: profile.annualVolumeEstimate ?? '',
  };
}

function formToPayload(form: CompanyFormState) {
  return {
    company: form.company.trim() || null,
    industry: form.industry.trim() || null,
    companyCountryCode: form.companyCountryCode.trim() || null,
    companyState: form.companyState.trim() || null,
    companyCity: form.companyCity.trim() || null,
    companyAddressLine1: form.companyAddressLine1.trim() || null,
    companyAddressLine2: form.companyAddressLine2.trim() || null,
    companyPostalCode: form.companyPostalCode.trim() || null,
    website: form.website.trim() || null,
    taxId: form.taxId.trim() || null,
    companySize: form.companySize.trim() || null,
    annualVolumeEstimate: form.annualVolumeEstimate.trim() || null,
  };
}

function getTaxIdLabel(countryCode: string) {
  if (countryCode === 'US') {
    return 'Tax ID / EIN';
  }

  if (['DE', 'FR', 'ES', 'GB'].includes(countryCode)) {
    return 'VAT / Tax ID / EORI';
  }

  return 'VAT / Tax ID / EORI';
}

function getProfileCompleteness(form: CompanyFormState) {
  const required = [
    form.company.trim(),
    form.industry.trim(),
    form.companyCountryCode.trim(),
    form.companySize.trim(),
  ];
  const filled = required.filter(Boolean).length;
  return {
    filled,
    total: required.length,
    percent: Math.round((filled / required.length) * 100),
  };
}

function formatDocumentDate(value: string | undefined, locale: string) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleDateString(locale);
}

export function AccountCompanyClient({ locale = 'en' }: AccountCompanyClientProps) {
  const { user } = useAuth();
  const { getLabel: getCountryLabel } = useCountries();
  const { getLabel: getIndustryLabel } = useIndustries();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [form, setForm] = useState<CompanyFormState | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!user) {
      return;
    }

    void getCompanyProfile()
      .then((nextProfile) => {
        if (!nextProfile) {
          setLoadState('error');
          return;
        }

        setProfile(nextProfile);
        setForm(profileToForm(nextProfile));
        setLoadState('ready');
      })
      .catch(() => {
        setLoadState('error');
      });
  }, [user]);

  const completeness = useMemo(() => (form ? getProfileCompleteness(form) : null), [form]);
  const isDirty = useMemo(() => {
    if (!profile || !form) {
      return false;
    }

    return JSON.stringify(formToPayload(form)) !== JSON.stringify(formToPayload(profileToForm(profile)));
  }, [form, profile]);

  function updateField<K extends keyof CompanyFormState>(field: K, value: CompanyFormState[K]) {
    setForm((current) => (current ? { ...current, [field]: value } : current));
    setMessage(null);
    setError(null);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form) {
      return;
    }

    startTransition(async () => {
      setMessage(null);
      setError(null);

      try {
        const updated = await updateCompanyProfile(formToPayload(form));
        setProfile(updated);
        setForm(profileToForm(updated));
        setMessage('Company profile saved.');
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : 'Unable to save company profile.');
      }
    });
  }

  if (!user) {
    return null;
  }

  if (loadState === 'loading') {
    return <p className="section-description">Loading company profile…</p>;
  }

  if (loadState === 'error' || !profile || !form) {
    return (
      <article className="account-quote-block">
        <h2 className="account-quote-block__title">Company profile unavailable</h2>
        <p className="account-quote-block__desc">We could not load your registered company information.</p>
      </article>
    );
  }

  const taxIdLabel = getTaxIdLabel(form.companyCountryCode);
  const countryLabel = form.companyCountryCode ? getCountryLabel(form.companyCountryCode) : '—';
  const industryLabel = form.industry ? getIndustryLabel(form.industry) : '—';
  const supportHref = withLocalePath('/support/contact?topic=partnership', locale);

  return (
    <form className="account-company-page" onSubmit={handleSubmit}>
      <header className="account-company-page__header">
        <div>
          <p className="account-quote-kicker">Company profile</p>
          <h1 className="account-company-page__title">{form.company.trim() || 'Your company'}</h1>
          <p className="account-company-page__subtitle">
            {industryLabel} · {countryLabel}
          </p>
        </div>
        <div className="account-company-page__summary">
          {completeness ? (
            <div className="account-company-page__completeness">
              <span>Profile completeness</span>
              <strong>{completeness.percent}%</strong>
              <span className="account-company-page__completeness-note">
                {completeness.filled}/{completeness.total} required fields
              </span>
            </div>
          ) : null}
          <button type="submit" className="button-primary" disabled={isPending || !isDirty}>
            {isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </header>

      {message ? <p className="account-company-page__message" role="status">{message}</p> : null}
      {error ? <p className="form-feedback form-feedback-error" role="alert">{error}</p> : null}

      <section className="account-quote-block">
        <div className="account-quote-block__header">
          <span className="account-quote-block__step">01</span>
          <div>
            <h2 className="account-quote-block__title">Business identity</h2>
            <p className="account-quote-block__desc">Core company details from your business registration.</p>
          </div>
        </div>
        <div className="account-company-form-grid">
          <label className="form-field">
            <span>Company name</span>
            <input
              className="form-input"
              value={form.company}
              onChange={(event) => updateField('company', event.target.value)}
              required
            />
          </label>
          <label className="form-field">
            <span>Industry</span>
            <IndustrySelect
              className="form-input"
              value={form.industry}
              onChange={(value) => updateField('industry', value)}
              required
            />
          </label>
          <label className="form-field">
            <span>Company size</span>
            <select
              className="form-input"
              value={form.companySize}
              onChange={(event) => updateField('companySize', event.target.value)}
              required
            >
              <option value="">Select size</option>
              {COMPANY_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option} employees</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Website</span>
            <input
              className="form-input"
              value={form.website}
              onChange={(event) => updateField('website', event.target.value)}
              placeholder="https://example.com"
            />
          </label>
        </div>
      </section>

      <section className="account-quote-block">
        <div className="account-quote-block__header">
          <span className="account-quote-block__step">02</span>
          <div>
            <h2 className="account-quote-block__title">Tax and sourcing volume</h2>
            <p className="account-quote-block__desc">Used for billing, customs, and quote qualification.</p>
          </div>
        </div>
        <div className="account-company-form-grid">
          <label className="form-field">
            <span>{taxIdLabel}</span>
            <input
              className="form-input"
              value={form.taxId}
              onChange={(event) => updateField('taxId', event.target.value)}
              placeholder="Optional"
            />
          </label>
          <label className="form-field">
            <span>Annual volume estimate</span>
            <input
              className="form-input"
              value={form.annualVolumeEstimate}
              onChange={(event) => updateField('annualVolumeEstimate', event.target.value)}
              placeholder="e.g. 500 units / year"
            />
          </label>
        </div>
      </section>

      <section className="account-quote-block">
        <div className="account-quote-block__header">
          <span className="account-quote-block__step">03</span>
          <div>
            <h2 className="account-quote-block__title">Registered address</h2>
            <p className="account-quote-block__desc">Legal business address tied to your account.</p>
          </div>
        </div>
        <div className="account-company-form-grid">
          <label className="form-field">
            <span>Country</span>
            <CountrySelect
              className="form-input"
              value={form.companyCountryCode}
              onChange={(value) => updateField('companyCountryCode', value)}
              required
            />
          </label>
          <label className="form-field">
            <span>State / province</span>
            <input
              className="form-input"
              value={form.companyState}
              onChange={(event) => updateField('companyState', event.target.value)}
            />
          </label>
          <label className="form-field">
            <span>City</span>
            <input
              className="form-input"
              value={form.companyCity}
              onChange={(event) => updateField('companyCity', event.target.value)}
            />
          </label>
          <label className="form-field">
            <span>Postal code</span>
            <input
              className="form-input"
              value={form.companyPostalCode}
              onChange={(event) => updateField('companyPostalCode', event.target.value)}
            />
          </label>
          <label className="form-field account-company-form-grid__full">
            <span>Address line 1</span>
            <input
              className="form-input"
              value={form.companyAddressLine1}
              onChange={(event) => updateField('companyAddressLine1', event.target.value)}
            />
          </label>
          <label className="form-field account-company-form-grid__full">
            <span>Address line 2</span>
            <input
              className="form-input"
              value={form.companyAddressLine2}
              onChange={(event) => updateField('companyAddressLine2', event.target.value)}
              placeholder="Suite, floor, building (optional)"
            />
          </label>
        </div>
      </section>

      <section className="account-quote-block">
        <div className="account-quote-block__header">
          <span className="account-quote-block__step">04</span>
          <div>
            <h2 className="account-quote-block__title">Verification documents</h2>
            <p className="account-quote-block__desc">Files submitted during business account registration.</p>
          </div>
        </div>
        {profile.verificationDocuments.length ? (
          <ul className="account-company-doc-list">
            {profile.verificationDocuments.map((document) => (
              <li key={document.key} className="account-company-doc-item">
                <div>
                  <strong>{document.filename}</strong>
                  <span className="account-company-doc-item__meta">
                    {document.contentType}
                    {formatDocumentDate(document.uploadedAt, locale)
                      ? ` · Uploaded ${formatDocumentDate(document.uploadedAt, locale)}`
                      : ''}
                  </span>
                </div>
                <a href={document.url} className="account-order-link" target="_blank" rel="noreferrer">
                  View file
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="account-quote-empty-inline">No verification documents on file.</p>
        )}
        <p className="account-company-doc-note">
          To replace or add qualification documents after registration, contact our team for a manual review.
        </p>
        <Link href={supportHref} className="section-link">Contact support</Link>
      </section>

      <div className="account-company-page__footer">
        <button type="submit" className="button-primary" disabled={isPending || !isDirty}>
          {isPending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
