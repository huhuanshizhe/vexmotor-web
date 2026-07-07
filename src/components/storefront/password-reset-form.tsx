'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';

import { apiFetch } from '@/lib/api-client';
import type { Locale } from '@/lib/i18n';
import { withLocalePath } from '@/lib/i18n';

type PasswordResetFormProps = {
  locale: Locale;
  token?: string | null;
};

type TokenValidationState = 'idle' | 'checking' | 'valid' | 'invalid';

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

export function PasswordResetForm({ locale, token }: PasswordResetFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [debugResetUrl, setDebugResetUrl] = useState<string | null>(null);
  const [resetAccountEmail, setResetAccountEmail] = useState<string | null>(null);
  const [tokenState, setTokenState] = useState<TokenValidationState>(token ? 'checking' : 'idle');
  const [isPending, startTransition] = useTransition();

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  useEffect(() => {
    if (!token) {
      setTokenState('idle');
      return;
    }

    let cancelled = false;
    setTokenState('checking');

    void apiFetch<{ valid: boolean; email?: string }>(`/api/front/auth/password-reset?token=${encodeURIComponent(token)}`)
      .then((payload) => {
        if (!cancelled) {
          setResetAccountEmail(payload.email ?? null);
          setTokenState('valid');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTokenState('invalid');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  function handleRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      setFeedback(null);
      setSuccessMessage(null);

      try {
        const payload = await apiFetch<{ resetUrl?: string | null }>('/api/front/auth/password-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'request', email }),
        });
        setDebugResetUrl(payload?.resetUrl ?? null);
        setSuccessMessage('If the account exists, a reset link has been sent. Check your inbox for instructions.');
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : 'Unable to prepare a reset link right now.');
      }
    });
  }

  function handleReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setFeedback('The password confirmation does not match.');
      return;
    }

    if (passwordStrength < 2) {
      setFeedback('Use a stronger password before submitting the reset.');
      return;
    }

    startTransition(async () => {
      setFeedback(null);
      setSuccessMessage(null);

      try {
        await apiFetch('/api/front/auth/password-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reset', token, password }),
        });
        setSuccessMessage('Password reset complete. Redirecting to sign-in...');
        router.push(withLocalePath('/login?reset=1', locale));
        router.refresh();
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : 'Unable to reset the password with this token.');
      }
    });
  }

  if (token) {
    if (tokenState === 'checking') {
      return <p className="section-description">Validating your reset link...</p>;
    }

    if (tokenState === 'invalid') {
      return (
        <div className="auth-form">
          <p className="form-feedback form-feedback-error">
            This reset link is invalid or has expired. Links are valid for 1 hour and can only be used once.
          </p>
          <div className="auth-link-row">
            <Link href={withLocalePath('/password-reset', locale)} className="section-link">
              Request a new reset link
            </Link>
            <Link href={withLocalePath('/login', locale)} className="section-link">
              Back to sign in
            </Link>
          </div>
        </div>
      );
    }

    return (
      <form className="auth-form" onSubmit={handleReset}>
        {resetAccountEmail ? (
          <label className="form-field">
            <span>Account</span>
            <input className="form-input" type="email" value={resetAccountEmail} readOnly aria-readonly="true" />
          </label>
        ) : null}
        <label className="form-field">
          <span>New password</span>
          <input className="form-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Use at least 8 characters" required disabled={isPending} />
        </label>
        <label className="form-field">
          <span>Confirm password</span>
          <input className="form-input" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat the new password" required disabled={isPending} />
        </label>
        <div className="auth-strength-meter" aria-label="Password strength">
          {[0, 1, 2, 3].map((index) => (
            <span key={index} className={`auth-strength-bar${index < passwordStrength ? ' is-active' : ''}`} />
          ))}
        </div>
        <div className="support-list">
          <div className="support-item"><span className="support-bullet" /><span>At least 8 characters</span></div>
          <div className="support-item"><span className="support-bullet" /><span>Mixed upper and lower case recommended</span></div>
          <div className="support-item"><span className="support-bullet" /><span>Add a number or symbol for stronger protection</span></div>
        </div>
        <button type="submit" className="button-primary" disabled={isPending}>
          {isPending ? 'Resetting...' : 'Reset password'}
        </button>
        <div className="auth-link-row">
          <Link href={withLocalePath('/login', locale)} className="section-link">
            Back to sign in
          </Link>
        </div>
        {successMessage ? <p className="form-feedback form-feedback-success">{successMessage}</p> : null}
        {feedback ? <p className="form-feedback form-feedback-error">{feedback}</p> : null}
      </form>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleRequest}>
      <label className="form-field">
        <span>Email</span>
        <input className="form-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" required disabled={isPending} />
      </label>
      <button type="submit" className="button-primary" disabled={isPending}>
        {isPending ? 'Sending...' : 'Send reset link'}
      </button>
      <div className="auth-link-row">
        <Link href={withLocalePath('/login', locale)} className="section-link">
          Back to sign in
        </Link>
        <Link href={withLocalePath('/register', locale)} className="section-link">
          Register your company
        </Link>
      </div>
      {successMessage ? <p className="form-feedback form-feedback-success">{successMessage}</p> : null}
      {feedback ? <p className="form-feedback form-feedback-error">{feedback}</p> : null}
      {debugResetUrl ? (
        <p className="section-description">
          Local dev link:{' '}
          <a href={debugResetUrl} className="section-link">
            Open reset link
          </a>
        </p>
      ) : null}
    </form>
  );
}
