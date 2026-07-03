'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { useMemo } from 'react';

import { StripePaymentForm } from '@/components/checkout/stripe-payment-form';

type StripePaymentCheckoutProps = {
  publicKey: string;
  clientSecret: string;
  returnUrl: string;
  onSuccess: (paymentIntentStatus: string) => void;
  onError: (message: string) => void;
};

export function StripePaymentCheckout({
  publicKey,
  clientSecret,
  returnUrl,
  onSuccess,
  onError,
}: StripePaymentCheckoutProps) {
  const stripePromise = useMemo(() => loadStripe(publicKey), [publicKey]);

  const options = useMemo(
    () => ({
      clientSecret,
      appearance: {
        theme: 'stripe' as const,
      },
    }),
    [clientSecret],
  );

  return (
    <Elements stripe={stripePromise as Promise<Stripe | null>} options={options}>
      <StripePaymentForm returnUrl={returnUrl} onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
}
