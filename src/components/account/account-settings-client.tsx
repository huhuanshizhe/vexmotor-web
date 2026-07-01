'use client';

import { LocalizedLink as Link } from '@/components/i18n/localized-link';
import { useAuth } from '@/components/providers/auth-provider';
import {
  changePassword,
  updateProfile,
  type UserProfile,
} from '@/lib/auth-client';
import {
  getLocaleLabel,
  getMarketDefaults,
  LOCALE_MARKET_OPTIONS,
  type Locale,
} from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n-context';
import { useEffect, useMemo, useState, useTransition } from 'react';

type ProfileFormState = {
  firstName: string;
  lastName: string;
  phone: string;
  jobTitle: string;
};

type PasswordFormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

function profileToForm(profile: UserProfile): ProfileFormState {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    phone: profile.phone ?? '',
    jobTitle: profile.jobTitle ?? '',
  };
}

function profilePayload(form: ProfileFormState) {
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    phone: form.phone.trim() || null,
    jobTitle: form.jobTitle.trim() || null,
  };
}

function formatAccountDate(value: string | null | undefined, locale: string) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString(locale);
}

function formatStatus(status: UserProfile['status']) {
  if (status === 'active') {
    return 'Active';
  }

  if (status === 'disabled') {
    return 'Disabled';
  }

  return 'Pending';
}

export function AccountSettingsClient() {
  const { user, refreshProfile } = useAuth();
  const { locale, setLocale } = useTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(user);
  const [profileForm, setProfileForm] = useState<ProfileFormState | null>(user ? profileToForm(user) : null);
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isProfilePending, startProfileTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileForm(null);
      return;
    }

    setProfile(user);
    setProfileForm(profileToForm(user));
  }, [user]);

  const profileDirty = useMemo(() => {
    if (!profile || !profileForm) {
      return false;
    }

    return JSON.stringify(profilePayload(profileForm)) !== JSON.stringify(profilePayload(profileToForm(profile)));
  }, [profile, profileForm]);

  const marketDefaults = getMarketDefaults(locale);

  if (!user || !profile || !profileForm) {
    return null;
  }

  function updateProfileField<K extends keyof ProfileFormState>(field: K, value: ProfileFormState[K]) {
    setProfileForm((current) => (current ? { ...current, [field]: value } : current));
    setProfileMessage(null);
    setProfileError(null);
  }

  function updatePasswordField<K extends keyof PasswordFormState>(field: K, value: PasswordFormState[K]) {
    setPasswordForm((current) => ({ ...current, [field]: value }));
    setPasswordMessage(null);
    setPasswordError(null);
  }

  function handleProfileSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!profileForm) {
      return;
    }

    const currentForm = profileForm;

    startProfileTransition(async () => {
      setProfileMessage(null);
      setProfileError(null);

      try {
        const updated = await updateProfile(profilePayload(currentForm));
        setProfile(updated);
        setProfileForm(profileToForm(updated));
        await refreshProfile();
        setProfileMessage('Profile updated.');
      } catch (error) {
        setProfileError(error instanceof Error ? error.message : 'Unable to save profile.');
      }
    });
  }

  function handlePasswordSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    startPasswordTransition(async () => {
      setPasswordMessage(null);
      setPasswordError(null);

      try {
        await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordMessage('Password updated.');
      } catch (error) {
        setPasswordError(error instanceof Error ? error.message : 'Unable to change password.');
      }
    });
  }

  return (
    <div className="account-settings-page">
      <header className="account-company-page__header">
        <div>
          <p className="account-quote-kicker">Account settings</p>
          <h1 className="account-company-page__title">{profile.firstName} {profile.lastName}</h1>
          <p className="account-company-page__subtitle">{profile.email}</p>
        </div>
        <div className="account-settings-page__status">
          <span className={`account-settings-status account-settings-status--${profile.status}`}>
            {formatStatus(profile.status)}
          </span>
          <span className="account-settings-page__meta">
            Member since {formatAccountDate(profile.createdAt, locale)}
          </span>
        </div>
      </header>

      <section className="account-quote-block">
        <div className="account-quote-block__header">
          <span className="account-quote-block__step">01</span>
          <div>
            <h2 className="account-quote-block__title">Personal profile</h2>
            <p className="account-quote-block__desc">Update the contact details used across orders and quotes.</p>
          </div>
        </div>
        <form className="account-company-form-grid" onSubmit={handleProfileSubmit}>
          <label className="form-field">
            <span>First name</span>
            <input
              className="form-input"
              value={profileForm.firstName}
              onChange={(event) => updateProfileField('firstName', event.target.value)}
              required
            />
          </label>
          <label className="form-field">
            <span>Last name</span>
            <input
              className="form-input"
              value={profileForm.lastName}
              onChange={(event) => updateProfileField('lastName', event.target.value)}
              required
            />
          </label>
          <label className="form-field">
            <span>Phone</span>
            <input
              className="form-input"
              value={profileForm.phone}
              onChange={(event) => updateProfileField('phone', event.target.value)}
              placeholder="Optional"
            />
          </label>
          <label className="form-field">
            <span>Job title / role</span>
            <input
              className="form-input"
              value={profileForm.jobTitle}
              onChange={(event) => updateProfileField('jobTitle', event.target.value)}
              placeholder="e.g. Purchasing, Engineering"
            />
          </label>
          <div className="account-company-form-grid__full account-settings-page__form-actions">
            {profileMessage ? <p className="account-company-page__message" role="status">{profileMessage}</p> : null}
            {profileError ? <p className="form-feedback form-feedback-error" role="alert">{profileError}</p> : null}
            <button type="submit" className="button-primary" disabled={isProfilePending || !profileDirty}>
              {isProfilePending ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>
      </section>

      <section className="account-quote-block">
        <div className="account-quote-block__header">
          <span className="account-quote-block__step">02</span>
          <div>
            <h2 className="account-quote-block__title">Sign-in email</h2>
            <p className="account-quote-block__desc">Your login email is managed by support today and cannot be changed here.</p>
          </div>
        </div>
        <dl className="account-quote-facts">
          <div><dt>Email</dt><dd>{profile.email}</dd></div>
          <div>
            <dt>Verification</dt>
            <dd>{profile.emailVerifiedAt ? `Verified ${formatAccountDate(profile.emailVerifiedAt, locale)}` : 'Not verified'}</dd>
          </div>
        </dl>
      </section>

      <section className="account-quote-block">
        <div className="account-quote-block__header">
          <span className="account-quote-block__step">03</span>
          <div>
            <h2 className="account-quote-block__title">Site preferences</h2>
            <p className="account-quote-block__desc">Language updates storefront copy, currency, and unit defaults.</p>
          </div>
        </div>
        <div className="account-company-form-grid">
          <label className="form-field">
            <span>Language</span>
            <select
              className="form-input"
              value={locale}
              onChange={(event) => setLocale(event.target.value as Locale)}
            >
              {LOCALE_MARKET_OPTIONS.map((option) => (
                <option key={option.code} value={option.code}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Currency</span>
            <input className="form-input" value={marketDefaults.currency} readOnly />
          </label>
          <label className="form-field">
            <span>Units</span>
            <input
              className="form-input"
              value={marketDefaults.unitSystem === 'metric' ? 'Metric' : 'Imperial'}
              readOnly
            />
          </label>
          <div className="account-company-form-grid__full">
            <p className="account-settings-page__hint">
              Current locale: {getLocaleLabel(locale)}. Currency and units follow the selected language market.
            </p>
          </div>
        </div>
      </section>

      <section className="account-quote-block">
        <div className="account-quote-block__header">
          <span className="account-quote-block__step">04</span>
          <div>
            <h2 className="account-quote-block__title">Password</h2>
            <p className="account-quote-block__desc">Change your password using your current sign-in password.</p>
          </div>
        </div>
        <form className="account-company-form-grid" onSubmit={handlePasswordSubmit}>
          <label className="form-field account-company-form-grid__full">
            <span>Current password</span>
            <input
              className="form-input"
              type="password"
              autoComplete="current-password"
              value={passwordForm.currentPassword}
              onChange={(event) => updatePasswordField('currentPassword', event.target.value)}
              required
            />
          </label>
          <label className="form-field">
            <span>New password</span>
            <input
              className="form-input"
              type="password"
              autoComplete="new-password"
              value={passwordForm.newPassword}
              onChange={(event) => updatePasswordField('newPassword', event.target.value)}
              minLength={8}
              required
            />
          </label>
          <label className="form-field">
            <span>Confirm new password</span>
            <input
              className="form-input"
              type="password"
              autoComplete="new-password"
              value={passwordForm.confirmPassword}
              onChange={(event) => updatePasswordField('confirmPassword', event.target.value)}
              minLength={8}
              required
            />
          </label>
          <div className="account-company-form-grid__full account-settings-page__form-actions">
            {passwordMessage ? <p className="account-company-page__message" role="status">{passwordMessage}</p> : null}
            {passwordError ? <p className="form-feedback form-feedback-error" role="alert">{passwordError}</p> : null}
            <button type="submit" className="button-primary" disabled={isPasswordPending}>
              {isPasswordPending ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </section>

      <section className="account-quote-block">
        <div className="account-quote-block__header">
          <span className="account-quote-block__step">05</span>
          <div>
            <h2 className="account-quote-block__title">Company profile</h2>
            <p className="account-quote-block__desc">Business registration details live on a separate page.</p>
          </div>
        </div>
        <Link href="/account/company" className="button-secondary">Manage company profile</Link>
      </section>
    </div>
  );
}
