'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import type { Locale } from '@/lib/i18n';
import { withLocalePath } from '@/lib/i18n';

export const COOKIE_CONSENT_COOKIE_NAME = 'cookie_consent_state';
export const COOKIE_CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 180;

type CookieConsentBarProps = {
  locale: Locale;
  initiallyAccepted: boolean;
};

function hasAcceptedCookieInDocument() {
  if (typeof document === 'undefined') {
    return false;
  }

  return document.cookie
    .split(';')
    .map((entry) => entry.trim())
    .some((entry) => {
      if (!entry.startsWith(`${COOKIE_CONSENT_COOKIE_NAME}=`)) {
        return false;
      }

      const value = entry.slice(COOKIE_CONSENT_COOKIE_NAME.length + 1);
      return decodeURIComponent(value) === 'accepted';
    });
}

function buildConsentCookieValue() {
  const isBrowser = typeof window !== 'undefined';
  const hostname = isBrowser ? window.location.hostname : '';
  const isStepmotechDomain = hostname === 'stepmotech.online' || hostname === 'www.stepmotech.online';
  const domainAttribute = isStepmotechDomain ? '; Domain=.stepmotech.online' : '';
  const secureAttribute = isBrowser && window.location.protocol === 'https:' ? '; Secure' : '';

  return `${COOKIE_CONSENT_COOKIE_NAME}=accepted; Path=/; Max-Age=${COOKIE_CONSENT_COOKIE_MAX_AGE}; SameSite=Lax${domainAttribute}${secureAttribute}`;
}

export function CookieConsentBar({ locale, initiallyAccepted }: CookieConsentBarProps) {
  const [accepted, setAccepted] = useState(initiallyAccepted);
  const privacyHref = useMemo(() => withLocalePath('/legal/privacy', locale), [locale]);

  useEffect(() => {
    if (!accepted && hasAcceptedCookieInDocument()) {
      setAccepted(true);
    }
  }, [accepted]);

  if (accepted) {
    return null;
  }

  return (
    <aside className="cookie-consent-bar" aria-label="Cookie consent banner">
      <div className="cookie-consent-copy">
        <strong>Cookie preferences</strong>
        <p>
          We use cookies for cart persistence, session preferences, site analytics, and support workflows. You can review GDPR/CCPA details in our privacy policy.
        </p>
      </div>
      <div className="cookie-consent-actions">
        <Link href={privacyHref} className="ui-button is-secondary is-sm">
          Privacy policy
        </Link>
        <button
          type="button"
          className="ui-button is-brand is-sm"
          onClick={() => {
            document.cookie = buildConsentCookieValue();
            setAccepted(true);
          }}
        >
          Accept cookies
        </button>
      </div>
    </aside>
  );
}