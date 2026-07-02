'use client';

import Link from 'next/link';
import { useEffect, useRef, type ReactNode } from 'react';

import { useAuth } from '@/components/providers/auth-provider';
import { accountNavLinks } from '@/lib/account-portal';
import { withLocalePath } from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n-context';

export function AccountLayoutShell({ children }: { children: ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const { locale, t } = useTranslation();
  const signInPanelRef = useRef<HTMLElement>(null);
  const hadUserRef = useRef(false);

  useEffect(() => {
    if (user) {
      hadUserRef.current = true;
      return;
    }

    if (!isLoading && hadUserRef.current) {
      hadUserRef.current = false;
      requestAnimationFrame(() => {
        signInPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }, [user, isLoading]);

  function handleSignOut() {
    logout();
  }

  if (isLoading) {
    return <p className="section-description">{t('accountPortal.loading')}</p>;
  }

  if (!user) {
    return (
      <article ref={signInPanelRef} className="info-card account-sign-in-panel">
        <h2 style={{ marginTop: 0 }}>{t('accountPortal.signInTitle')}</h2>
        <p className="section-description">{t('accountPortal.signInDesc')}</p>
        <div className="account-inline-actions">
          <Link href={`${withLocalePath('/login', locale)}?callbackUrl=${encodeURIComponent(withLocalePath('/account', locale))}`} className="button-primary">
            {t('accountPortal.goToLogin')}
          </Link>
          <Link href={withLocalePath('/', locale)} className="button-secondary">
            {t('accountPortal.goToHome')}
          </Link>
        </div>
      </article>
    );
  }

  return (
    <div className="account-shell-grid">
      <aside className="info-card account-nav-card">
        <div className="card-kicker">{t('accountPortal.navKicker')}</div>
        <div className="account-nav-list">
          {accountNavLinks.map((item) => (
            <Link key={item.href} href={withLocalePath(item.href, locale)} className="nav-link">
              {t(item.labelKey)}
            </Link>
          ))}
        </div>
        <div className="account-nav-footer">
          <button type="button" className="account-nav-sign-out" onClick={handleSignOut}>
            {t('header.logout')}
          </button>
        </div>
      </aside>
      <div className="account-shell-content">{children}</div>
    </div>
  );
}
