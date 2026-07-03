import { Suspense } from 'react';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildMetadata } from '@/lib/seo';

import { CheckoutPaymentClient } from './checkout-payment-client';

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
    title: 'Secure Payment — STEPMOTECH',
    description: 'Complete card payment for your saved order.',
    path: '/checkout/pay',
    noIndex: true,
    locale,
  });
}

export default async function CheckoutPaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ guestToken?: string }>;
}) {
  const { orderNumber } = await params;
  const { guestToken } = await searchParams;

  return (
    <StorefrontFrame>
      <section className="section payment-gateway-page">
        <div className="section-inner">
          <Suspense fallback={<div className="payment-gateway-status">Loading payment…</div>}>
            <CheckoutPaymentClient orderNumber={orderNumber} guestToken={guestToken} />
          </Suspense>
        </div>
      </section>
    </StorefrontFrame>
  );
}
