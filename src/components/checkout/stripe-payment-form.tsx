'use client';

import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useState } from 'react';

type StripePaymentFormProps = {
  returnUrl: string;
  onSuccess: (paymentIntentStatus: string) => void;
  onError: (message: string) => void;
};

function StripePaymentFormInner({ returnUrl, onSuccess, onError }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!stripe || !elements || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: 'if_required',
      });

      if (result.error) {
        onError(result.error.message ?? 'Payment failed. Please check your card details and try again.');
        setIsSubmitting(false);
        return;
      }

      const status = result.paymentIntent?.status ?? 'processing';
      onSuccess(status);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unable to process payment.');
      setIsSubmitting(false);
    }
  }

  return (
    <form className="checkout-stripe-payment-form" onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit" className="button-primary payment-gateway-submit" disabled={!stripe || !elements || isSubmitting}>
        {isSubmitting ? 'Processing…' : 'Pay now'}
      </button>
    </form>
  );
}

export { StripePaymentFormInner as StripePaymentForm };
