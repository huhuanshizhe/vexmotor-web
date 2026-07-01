'use client';

import { Suspense, useEffect, useState } from 'react';

import { AccountOrdersClient } from '@/components/account/account-orders-client';
import { useAuth } from '@/components/providers/auth-provider';
import { useTranslation } from '@/lib/i18n-context';

export default function AccountOrdersPage() {
  const { user } = useAuth();
  const { locale } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!user) {
    return null;
  }

  if (!mounted) {
    return <p className="section-description">Loading orders…</p>;
  }

  return (
    <div className="account-panel-stack">
      <div className="section-header">
        <div>
          <p className="account-quote-kicker">Account</p>
          <h1 className="section-title">Orders</h1>
          <p className="section-description">
            Review purchase history, filter by payment or fulfillment status, and complete unpaid checkouts.
          </p>
        </div>
      </div>

      <Suspense fallback={<p className="section-description">Loading orders…</p>}>
        <AccountOrdersClient locale={locale} />
      </Suspense>
    </div>
  );
}
