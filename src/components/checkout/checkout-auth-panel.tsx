'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

import { LoginForm } from '@/components/storefront/login-form';
import { RegisterBusinessForm } from '@/components/storefront/register-business-form';
import { parseLocaleFromPathname } from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n-context';

export type CheckoutAuthMode = 'guest' | 'sign-in' | 'register' | 'logged-in';

type CheckoutAuthPanelProps = {
  mode: CheckoutAuthMode;
  onModeChange: (mode: CheckoutAuthMode) => void;
  contactEmail: string;
  contactPhone: string;
  subscribeToUpdates: boolean;
  onContactEmailChange: (value: string) => void;
  onContactPhoneChange: (value: string) => void;
  onSubscribeToUpdatesChange: (value: boolean) => void;
  userDisplayName?: string;
  userEmail?: string;
  onAuthSuccess: () => void | Promise<void>;
  onSignOut?: () => void;
};

export function CheckoutAuthPanel({
  mode,
  onModeChange,
  contactEmail,
  contactPhone,
  subscribeToUpdates,
  onContactEmailChange,
  onContactPhoneChange,
  onSubscribeToUpdatesChange,
  userDisplayName,
  userEmail,
  onAuthSuccess,
  onSignOut,
}: CheckoutAuthPanelProps) {
  const pathname = usePathname();
  const locale = useMemo(() => parseLocaleFromPathname(pathname).locale, [pathname]);
  const { t } = useTranslation();

  if (mode === 'logged-in') {
    return (
      <article className="info-card checkout-account-bar checkout-section-anchor" id="checkout-account">
        <div className="card-kicker">{t('checkout.account')}</div>
        <div className="checkout-account-logged-in">
          <div className="checkout-account-summary">
            <p className="checkout-account-greeting">
              <span className="checkout-account-greeting-label">{t('checkout.loggedInAs')}</span>
              <span className="checkout-account-greeting-name">{userDisplayName}</span>
            </p>
            {userEmail ? <span className="section-description">{userEmail}</span> : null}
          </div>
          {onSignOut ? (
            <button type="button" className="checkout-sign-out-link" onClick={onSignOut}>
              {t('checkout.notYouSignOut')}
            </button>
          ) : null}
        </div>
      </article>
    );
  }

  return (
    <article className="info-card checkout-account-bar checkout-auth-panel checkout-section-anchor" id="checkout-account">
      <div className="section-header trade-card-header">
        <div>
          <h2 className="cart-section-title">{t('checkout.account')}</h2>
          <p className="section-description">{t('checkout.accountDesc')}</p>
        </div>
      </div>

      <div className="checkout-auth-segmented" role="tablist" aria-label={t('checkout.accountModeNav')}>
        {(['guest', 'sign-in', 'register'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={mode === tab}
            className={`checkout-auth-segment${mode === tab ? ' is-active' : ''}`}
            onClick={() => onModeChange(tab)}
          >
            {tab === 'guest' ? t('checkout.guest') : tab === 'sign-in' ? t('checkout.signIn') : t('checkout.register')}
          </button>
        ))}
      </div>

      {mode === 'guest' ? (
        <div className="checkout-auth-body">
          <div className="checkout-address-form-grid">
            <label className="form-field">
              <span>{t('checkout.contactEmail')}</span>
              <input className="form-input" type="email" value={contactEmail} onChange={(e) => onContactEmailChange(e.target.value)} placeholder={t('checkout.contactEmailPlaceholder')} />
            </label>
            <label className="form-field">
              <span>{t('checkout.contactPhone')}</span>
              <input className="form-input" value={contactPhone} onChange={(e) => onContactPhoneChange(e.target.value)} placeholder={t('checkout.optional')} />
            </label>
            <label className="checkout-toggle-row checkout-toggle-card">
              <input type="checkbox" checked={subscribeToUpdates} onChange={(e) => onSubscribeToUpdatesChange(e.target.checked)} />
              <span>{t('checkout.subscribeUpdates')}</span>
            </label>
          </div>
        </div>
      ) : null}

      {mode === 'sign-in' ? (
        <div className="checkout-auth-body">
          <LoginForm
            callbackUrl="/checkout"
            variant="checkout"
            initialEmail={contactEmail}
            onSuccess={onAuthSuccess}
          />
        </div>
      ) : null}

      {mode === 'register' ? (
        <div className="checkout-auth-body checkout-auth-body--scroll">
          <RegisterBusinessForm
            locale={locale}
            initialEmail={contactEmail}
            variant="checkout"
            onSuccess={onAuthSuccess}
          />
        </div>
      ) : null}
    </article>
  );
}
