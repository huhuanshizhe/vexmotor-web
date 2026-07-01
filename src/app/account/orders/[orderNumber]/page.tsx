'use client';

import { Suspense, useEffect, useState } from 'react';

import { AccountOrderDetailClient } from '@/components/account/account-order-detail-client';
import { useAuth } from '@/components/providers/auth-provider';
import { useTranslation } from '@/lib/i18n-context';

function OrderDetailContent({ orderNumber }: { orderNumber: string }) {
  const { locale } = useTranslation();
  return <AccountOrderDetailClient orderNumber={orderNumber} locale={locale} />;
}

export default function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { user } = useAuth();
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    void params.then(({ orderNumber: nextOrderNumber }) => setOrderNumber(nextOrderNumber));
  }, [params]);

  if (!user) {
    return null;
  }

  if (!orderNumber) {
    return <p className="section-description">Loading order…</p>;
  }

  return (
    <div className="account-panel-stack">
      <Suspense fallback={<p className="section-description">Loading order…</p>}>
        <OrderDetailContent orderNumber={orderNumber} />
      </Suspense>
    </div>
  );
}
