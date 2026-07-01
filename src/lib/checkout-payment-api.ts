import { apiFetch } from '@/lib/api-client';

export type CheckoutPaymentIntentSession = {
  intentId: string;
  clientSecret: string;
  currency: string;
  env: 'demo' | 'prod';
};

export type CheckoutPaymentConfirmResult = {
  paymentStatus: string;
  intentStatus: string;
  redirectPath: string;
  guestAccessToken?: string;
};

export type CheckoutPaymentStatusResult = {
  paymentStatus: string;
  intentStatus: string | null;
  orderStatus: string;
};

export type OrderPaymentGatewayStatus = {
  orderNumber: string;
  sitePaymentStatus: string;
  orderStatus: string;
  gatewayConfigured: boolean;
  gatewayIntentId: string | null;
  gatewayStatus: string | null;
  isPaidAtGateway: boolean;
  synced: boolean;
  redirectPath: string;
};

/** Poll for up to 90s — enough for 3DS and gateway propagation. */
export const PAYMENT_GATEWAY_CONFIRM_TIMEOUT_MS = 90_000;
export const PAYMENT_GATEWAY_POLL_INTERVAL_MS = 2_000;

type GuestPaymentOptions = {
  guestToken?: string;
};

function withGuestOrderToken(init: RequestInit | undefined, guestToken?: string): RequestInit {
  if (!guestToken) {
    return init ?? {};
  }

  const headers = new Headers(init?.headers);
  headers.set('x-guest-order-token', guestToken);
  return { ...init, headers };
}

export async function fetchOrderPaymentGatewayStatus(orderNumber: string, guestToken?: string) {
  return apiFetch<OrderPaymentGatewayStatus>(
    `/api/front/orders/${encodeURIComponent(orderNumber)}/payment-gateway-status`,
    withGuestOrderToken(undefined, guestToken),
  );
}

export function isOrderPaidOnSite(status: Pick<OrderPaymentGatewayStatus, 'sitePaymentStatus' | 'isPaidAtGateway'>) {
  return status.sitePaymentStatus === 'paid' || status.isPaidAtGateway;
}

export async function createCheckoutPaymentIntent(
  input: {
    orderNumber: string;
    customerEmail?: string;
  } & GuestPaymentOptions,
) {
  const { guestToken, ...body } = input;
  return apiFetch<CheckoutPaymentIntentSession>('/api/front/checkout/payment-intent', {
    method: 'POST',
    body: JSON.stringify(body),
    ...withGuestOrderToken(undefined, guestToken),
  });
}

export async function confirmCheckoutPayment(orderNumber: string, guestToken?: string) {
  return apiFetch<CheckoutPaymentConfirmResult>('/api/front/checkout/payment/confirm', {
    method: 'POST',
    body: JSON.stringify({ orderNumber }),
    ...withGuestOrderToken(undefined, guestToken),
  });
}

export async function fetchCheckoutPaymentStatus(orderNumber: string, guestToken?: string) {
  const query = new URLSearchParams({ orderNumber });
  return apiFetch<CheckoutPaymentStatusResult>(
    `/api/front/checkout/payment/status?${query.toString()}`,
    withGuestOrderToken(undefined, guestToken),
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function waitForOrderPaymentGatewayPaid(
  orderNumber: string,
  guestToken?: string,
  timeoutMs = PAYMENT_GATEWAY_CONFIRM_TIMEOUT_MS,
  intervalMs = PAYMENT_GATEWAY_POLL_INTERVAL_MS,
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const status = await fetchOrderPaymentGatewayStatus(orderNumber, guestToken);
    if (isOrderPaidOnSite(status)) {
      return status;
    }
    await sleep(intervalMs);
  }

  throw new Error(
    'Payment was not confirmed within 90 seconds. Your order remains unpaid — please try again or use another card.',
  );
}

export async function finalizeCheckoutPayment(orderNumber: string, guestToken?: string) {
  const status = await waitForOrderPaymentGatewayPaid(orderNumber, guestToken);
  return {
    paymentStatus: 'paid',
    intentStatus: status.gatewayStatus ?? 'SUCCEEDED',
    redirectPath: status.redirectPath,
    guestAccessToken: guestToken,
  } satisfies CheckoutPaymentConfirmResult;
}
