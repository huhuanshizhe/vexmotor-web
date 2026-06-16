'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';

import { login as authLogin } from '@/lib/auth-client';
import { parseLocaleFromPathname, withLocalePath } from '@/lib/i18n';

type LoginFormProps = {
  callbackUrl: string;
  initialEmail?: string;
  initialNotice?: string | null;
};

const REMEMBERED_EMAIL_STORAGE_KEY = 'vexmotor-login-remembered-email';
const LOGIN_FAILURE_STORAGE_KEY = 'vexmotor-login-failure-state';

type FailureState = {
  email: string;
  attempts: number;
  lockedUntil: number;
};

function readFailureState(email: string) {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = window.sessionStorage.getItem(LOGIN_FAILURE_STORAGE_KEY);
  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored) as FailureState;
    if (parsed.email !== email.trim().toLowerCase()) {
      return null;
    }
    if (parsed.lockedUntil && parsed.lockedUntil < Date.now()) {
      window.sessionStorage.removeItem(LOGIN_FAILURE_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    window.sessionStorage.removeItem(LOGIN_FAILURE_STORAGE_KEY);
    return null;
  }
}

function writeFailureState(email: string) {
  if (typeof window === 'undefined') {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const current = readFailureState(normalizedEmail);
  const attempts = (current?.attempts ?? 0) + 1;
  const nextState: FailureState = {
    email: normalizedEmail,
    attempts,
    lockedUntil: attempts >= 5 ? Date.now() + 1000 * 60 * 10 : 0,
  };

  window.sessionStorage.setItem(LOGIN_FAILURE_STORAGE_KEY, JSON.stringify(nextState));
  return nextState;
}

function clearFailureState() {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(LOGIN_FAILURE_STORAGE_KEY);
}

export function LoginForm({ callbackUrl, initialEmail, initialNotice = null }: LoginFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useMemo(() => parseLocaleFromPathname(pathname).locale, [pathname]);
  const [email, setEmail] = useState(initialEmail ?? '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(Boolean(initialEmail));
  const [message, setMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(initialNotice);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (initialEmail) {
      return;
    }

    const rememberedEmail = window.localStorage.getItem(REMEMBERED_EMAIL_STORAGE_KEY);
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, [initialEmail]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    const failureState = readFailureState(normalizedEmail);
    if (failureState?.lockedUntil && failureState.lockedUntil > Date.now()) {
      setMessage('Too many attempts. Try again in 10 minutes or reset your password.');
      return;
    }

    startTransition(async () => {
      setMessage(null);
      setNotice(null);

      try {
        await authLogin(normalizedEmail, password);
      } catch {
        const nextFailureState = writeFailureState(normalizedEmail);
        setMessage(nextFailureState?.lockedUntil ? 'Too many attempts. Try again in 10 minutes or reset your password.' : 'Email or password is incorrect.');
        return;
      }

      clearFailureState();
      if (rememberMe) {
        window.localStorage.setItem(REMEMBERED_EMAIL_STORAGE_KEY, normalizedEmail);
      } else {
        window.localStorage.removeItem(REMEMBERED_EMAIL_STORAGE_KEY);
      }

      router.push(callbackUrl);
      router.refresh();
    });
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="form-field">
        <span>Email</span>
        <input
          className="form-input"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@company.com"
          required
          disabled={isPending}
        />
      </label>
      <label className="form-field">
        <span>Password</span>
        <input
          className="form-input"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter password"
          required
          disabled={isPending}
        />
      </label>
      <div className="auth-inline-row">
        <label className="auth-checkbox-row">
          <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} disabled={isPending} />
          <span>Remember me</span>
        </label>
        <Link href={withLocalePath('/password-reset', locale)} className="section-link">
          Forgot password?
        </Link>
      </div>
      <button type="submit" className="button-primary" disabled={isPending}>
        {isPending ? 'Signing in...' : 'Sign In'}
      </button>
      <div className="auth-or-divider" aria-hidden="true">
        <span />
        <strong>or</strong>
        <span />
      </div>
      <div className="auth-social-grid">
        <button type="button" className="button-secondary" disabled>
          Continue with Google
        </button>
        <button type="button" className="button-secondary" disabled>
          Continue with Microsoft
        </button>
      </div>
      <div className="auth-link-row">
        <Link href={withLocalePath('/password-reset', locale)} className="section-link">
          Forgot password?
        </Link>
        <Link href={withLocalePath('/register', locale)} className="section-link">
          Register your company
        </Link>
      </div>
      {notice ? <p className="form-feedback form-feedback-success" role="status" aria-live="polite">{notice}</p> : null}
      {message ? <p className="form-feedback form-feedback-error" role="alert" aria-live="polite">{message}</p> : null}
    </form>
  );
}