'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { useMemo } from 'react';

import { StripePaymentForm } from '@/components/checkout/stripe-payment-form';

type StripePaymentCheckoutProps = {
  publicKey: string;
  clientSecret: string;
  returnUrl: string;
  locale?: string;
  onSuccess: (paymentIntentStatus: string) => void;
  onError: (message: string) => void;
};

export function StripePaymentCheckout({
  publicKey,
  clientSecret,
  returnUrl,
  locale = 'en',
  onSuccess,
  onError,
}: StripePaymentCheckoutProps) {
  const stripePromise = useMemo(() => loadStripe(publicKey), [publicKey]);

  const options = useMemo(
    () => ({
      clientSecret,
      locale: (locale === 'de' || locale === 'es' ? locale : 'en') as 'en' | 'de' | 'es',
      appearance: {
        theme: 'stripe' as const,
      },
    }),
    [clientSecret, locale],
  );

  return (
    <Elements stripe={stripePromise as Promise<Stripe | null>} options={options}>
      <StripePaymentForm returnUrl={returnUrl} onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
}
