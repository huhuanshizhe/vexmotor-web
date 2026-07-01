import type { ReactNode } from 'react';

import { LocalizedLink as Link } from '@/components/i18n/localized-link';

import { buildCheckoutPayPath, orderNeedsCardPayment } from '@/lib/checkout-pay-path';

type CompletePaymentLinkProps = {
  orderNumber: string;
  paymentStatus: string;
  paymentMethod: string;
  guestToken?: string;
  className?: string;
  children?: ReactNode;
};

export function CompletePaymentLink({
  orderNumber,
  paymentStatus,
  paymentMethod,
  guestToken,
  className = 'button-primary',
  children = 'Complete payment',
}: CompletePaymentLinkProps) {
  if (!orderNeedsCardPayment({ paymentStatus, paymentMethod })) {
    return null;
  }

  return (
    <Link href={buildCheckoutPayPath(orderNumber, guestToken)} className={className}>
      {children}
    </Link>
  );
}
