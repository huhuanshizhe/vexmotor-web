'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { useAuth } from '@/components/providers/auth-provider';
import { accountNavLinks } from '@/lib/account-portal';
import { withLocalePath } from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n-context';

export function AccountLayoutShell({ children }: { children: ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const { locale, t } = useTranslation();

  function handleSignOut() {
    logout();
  }

  if (isLoading) {
    return <p className="section-description">Loading account…</p>;
  }

  if (!user) {
    return (
      <article className="info-card">
        <h2 style={{ marginTop: 0 }}>Sign in to access your member center</h2>
        <p className="section-description">Orders, addresses, wishlist items, and inquiry history are tied to an authenticated account.</p>
        <div className="account-inline-actions">
          <Link href={`${withLocalePath('/login', locale)}?callbackUrl=${encodeURIComponent(withLocalePath('/account', locale))}`} className="button-primary">
            Go to Login
          </Link>
          <Link href={withLocalePath('/', locale)} className="button-secondary">
            Go to Home
          </Link>
        </div>
      </article>
    );
  }

  return (
    <div className="account-shell-grid">
      <aside className="info-card account-nav-card">
        <div className="card-kicker">Account navigation</div>
        <div className="account-nav-list">
          {accountNavLinks.map((item) => (
            <Link key={item.href} href={withLocalePath(item.href, locale)} className="nav-link">
              {item.label}
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
