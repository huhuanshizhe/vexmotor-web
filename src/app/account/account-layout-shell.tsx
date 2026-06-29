'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { useAuth } from '@/components/providers/auth-provider';
import { accountNavLinks } from '@/lib/account-portal';
import { withLocalePath } from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n-context';

export function AccountLayoutShell({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const { locale } = useTranslation();

  if (isLoading) {
    return <p className="section-description">Loading account…</p>;
  }

  if (!user) {
    return (
      <article className="info-card">
        <h2 style={{ marginTop: 0 }}>Sign in to access your member center</h2>
        <p className="section-description">Orders, addresses, wishlist items, and inquiry history are tied to an authenticated account.</p>
        <Link href={`${withLocalePath('/login', locale)}?callbackUrl=${encodeURIComponent(withLocalePath('/account', locale))}`} className="button-primary">
          Go to Login
        </Link>
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
      </aside>
      <div className="account-shell-content">{children}</div>
    </div>
  );
}
