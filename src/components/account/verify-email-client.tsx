'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { confirmEmailVerification } from '@/lib/auth-client';
import { apiFetch } from '@/lib/api-client';
import type { Locale } from '@/lib/i18n';
import { withLocalePath } from '@/lib/i18n';

type VerifyEmailClientProps = {
  locale: Locale;
  token?: string | null;
};

type TokenState = 'idle' | 'checking' | 'valid' | 'invalid' | 'success';

export function VerifyEmailClient({ locale, token }: VerifyEmailClientProps) {
  const router = useRouter();
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [tokenState, setTokenState] = useState<TokenState>(token ? 'checking' : 'idle');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!token) {
      setTokenState('idle');
      return;
    }

    let cancelled = false;
    setTokenState('checking');

    void apiFetch<{ valid: boolean; email?: string }>(`/api/front/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((payload) => {
        if (!cancelled) {
          setAccountEmail(payload.email ?? null);
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

  function handleConfirm() {
    if (!token) {
      return;
    }

    startTransition(async () => {
      setFeedback(null);

      try {
        const result = await confirmEmailVerification(token);
        setAccountEmail(result.email);
        setTokenState('success');
        router.push(withLocalePath(result.redirectPath, locale));
        router.refresh();
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : 'Unable to verify this email link.');
      }
    });
  }

  if (!token) {
    return (
      <div className="auth-form">
        <p className="form-feedback form-feedback-error">A verification token is required.</p>
        <div className="auth-link-row">
          <Link href={withLocalePath('/account/settings', locale)} className="section-link">
            Go to account settings
          </Link>
        </div>
      </div>
    );
  }

  if (tokenState === 'checking') {
    return <p className="section-description">Validating your verification link...</p>;
  }

  if (tokenState === 'invalid') {
    return (
      <div className="auth-form">
        <p className="form-feedback form-feedback-error">
          This verification link is invalid or has expired. Links are valid for 24 hours.
        </p>
        <div className="auth-link-row">
          <Link href={withLocalePath('/account/settings', locale)} className="section-link">
            Request a new verification email
          </Link>
          <Link href={withLocalePath('/login', locale)} className="section-link">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  if (tokenState === 'success') {
    return (
      <div className="auth-form">
        <p className="form-feedback form-feedback-success">
          {accountEmail ? `${accountEmail} has been verified.` : 'Your email has been verified.'}
        </p>
        <div className="auth-link-row">
          <Link href={withLocalePath('/account/settings', locale)} className="section-link">
            Return to account settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-form">
      {accountEmail ? (
        <label className="form-field">
          <span>Account email</span>
          <input className="form-input" type="email" value={accountEmail} readOnly aria-readonly="true" />
        </label>
      ) : null}
      <p className="section-description">
        Confirm that this is the correct email for your STEPMOTECH account. Verification links can only be used once.
      </p>
      <button type="button" className="button-primary" onClick={handleConfirm} disabled={isPending}>
        {isPending ? 'Verifying...' : 'Confirm verification'}
      </button>
      <div className="auth-link-row">
        <Link href={withLocalePath('/account/settings', locale)} className="section-link">
          Back to account settings
        </Link>
      </div>
      {feedback ? <p className="form-feedback form-feedback-error">{feedback}</p> : null}
    </div>
  );
}
