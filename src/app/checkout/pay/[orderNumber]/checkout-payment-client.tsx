'use client';

import Image from 'next/image';
import { LocalizedLink as Link } from '@/components/i18n/localized-link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { AirwallexDropIn } from '@/components/checkout/airwallex-drop-in';
import { useAuth } from '@/components/providers/auth-provider';
import { fetchGuestOrderDetail, fetchOrderByNumber } from '@/lib/account-api';
import {
  createCheckoutPaymentIntent,
  fetchOrderPaymentGatewayStatus,
  finalizeCheckoutPayment,
  isOrderPaidOnSite,
  type CheckoutPaymentIntentSession,
} from '@/lib/checkout-payment-api';
import { parseOrderNote } from '@/lib/order-note';

type CheckoutPaymentClientProps = {
  orderNumber: string;
  guestToken?: string;
};

type CoverImage = {
  url: string;
  alt: string;
  width?: number | null;
  height?: number | null;
};

type PayableOrderItem = {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  subtotal: string;
  coverImage?: CoverImage | null;
};

type PayableOrder = {
  orderNumber: string;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: string;
  subtotal: string;
  shippingAmount: string;
  taxAmount: string;
  discountAmount?: string;
  customerNote?: string | null;
  items?: PayableOrderItem[];
};

function formatAmount(amount: string) {
  return `$${Number(amount).toFixed(2)}`;
}

function buildPaidRedirect(redirectPath: string, guestToken?: string) {
  if (!guestToken || redirectPath.includes('guestToken=')) {
    return redirectPath;
  }
  if (redirectPath.startsWith('/checkout/confirmation/')) {
    return `${redirectPath}?guestToken=${encodeURIComponent(guestToken)}`;
  }
  return redirectPath;
}

export function CheckoutPaymentClient({ orderNumber, guestToken }: CheckoutPaymentClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<PayableOrder | null>(null);
  const [paymentSession, setPaymentSession] = useState<CheckoutPaymentIntentSession | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'confirming' | 'error'>('loading');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setPhase('loading');
      setLoadError(null);
      setMessage(null);

      try {
        const nextOrder = (user
          ? await fetchOrderByNumber(orderNumber).catch(() => null)
          : await fetchGuestOrderDetail(orderNumber, guestToken).catch(() => null)) as PayableOrder | null;

        if (cancelled) {
          return;
        }

        if (!nextOrder) {
          setPhase('error');
          setLoadError(
            guestToken || user
              ? 'Unable to load this order for payment.'
              : 'Sign in or open the payment link from your order confirmation to continue.',
          );
          return;
        }

        if (nextOrder.paymentMethod !== 'Credit Card') {
          router.replace(
            guestToken
              ? `/checkout/confirmation/${orderNumber}?guestToken=${encodeURIComponent(guestToken)}`
              : `/checkout/confirmation/${orderNumber}`,
          );
          return;
        }

        const gatewayStatus = await fetchOrderPaymentGatewayStatus(orderNumber, guestToken);
        if (isOrderPaidOnSite(gatewayStatus)) {
          router.replace(buildPaidRedirect(gatewayStatus.redirectPath, guestToken));
          return;
        }

        setOrder({
          ...nextOrder,
          items: nextOrder.items ?? [],
        });

        const customerEmail = nextOrder.customerNote
          ? parseOrderNote(nextOrder.customerNote).contactEmail ?? undefined
          : undefined;

        try {
          const session = await createCheckoutPaymentIntent({
            orderNumber,
            customerEmail,
            guestToken,
          });

          if (cancelled) {
            return;
          }

          setPaymentSession(session);
          setPhase('ready');
        } catch (intentError) {
          const synced = await fetchOrderPaymentGatewayStatus(orderNumber, guestToken).catch(() => null);
          if (synced && isOrderPaidOnSite(synced)) {
            router.replace(buildPaidRedirect(synced.redirectPath, guestToken));
            return;
          }

          throw intentError;
        }
      } catch (error) {
        if (!cancelled) {
          setPhase('error');
          setLoadError(error instanceof Error ? error.message : 'Unable to start payment.');
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [guestToken, orderNumber, router, user]);

  function redirectAfterPayment(redirectPath: string) {
    router.push(buildPaidRedirect(redirectPath, guestToken));
    router.refresh();
  }

  function handlePaymentSuccess() {
    startTransition(async () => {
      setPhase('confirming');
      setMessage(null);

      try {
        const confirmResult = await finalizeCheckoutPayment(orderNumber, guestToken);
        redirectAfterPayment(confirmResult.redirectPath);
      } catch (error) {
        setPhase('ready');
        setMessage(
          error instanceof Error
            ? error.message
            : 'Payment was not confirmed. Your order remains unpaid — please try again.',
        );
      }
    });
  }

  if (phase === 'loading') {
    return (
      <div className="payment-gateway-shell">
        <div className="payment-gateway-status">Checking payment status with gateway…</div>
      </div>
    );
  }

  if (phase === 'error' || !order) {
    return (
      <div className="payment-gateway-shell">
        <article className="payment-gateway-card payment-gateway-card--centered">
          <h2>Payment unavailable</h2>
          <p>{loadError ?? 'Unable to load payment for this order.'}</p>
          <div className="payment-gateway-actions">
            <Link href="/checkout" className="nav-link">Back to checkout</Link>
            {user ? <Link href="/account/orders" className="nav-link">View orders</Link> : null}
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="payment-gateway-shell">
      <header className="payment-gateway-header">
        <div>
          <p className="payment-gateway-eyebrow">Secure payment gateway</p>
          <h1 className="payment-gateway-title">Pay for order {order.orderNumber}</h1>
          <p className="payment-gateway-subtitle">
            Your order is saved. Complete card payment below to finish checkout.
          </p>
        </div>
        <div className="payment-gateway-total-chip">
          <span>Total due</span>
          <strong>{formatAmount(order.totalAmount)}</strong>
        </div>
      </header>

      <div className="payment-gateway-layout">
        <section className="payment-gateway-card payment-gateway-card--items">
          <div className="payment-gateway-card-head">
            <h2>Items in this order</h2>
            <span>{(order.items ?? []).length} line{(order.items ?? []).length === 1 ? '' : 's'}</span>
          </div>

          <ul className="payment-gateway-item-list">
            {(order.items ?? []).map((item) => (
              <li key={item.id} className="payment-gateway-item">
                <div className="payment-gateway-item-media">
                  {item.coverImage?.url ? (
                    <Image
                      src={item.coverImage.url}
                      alt={item.coverImage.alt || item.productName}
                      width={item.coverImage.width ?? 96}
                      height={item.coverImage.height ?? 96}
                      className="payment-gateway-item-image"
                    />
                  ) : (
                    <div className="payment-gateway-item-placeholder" aria-hidden="true" />
                  )}
                </div>
                <div className="payment-gateway-item-copy">
                  <strong>{item.productName}</strong>
                  <span className="product-meta">{item.sku}</span>
                  <span className="payment-gateway-item-qty">Qty {item.quantity}</span>
                </div>
                <strong className="payment-gateway-item-price">{formatAmount(item.subtotal)}</strong>
              </li>
            ))}
          </ul>

          <div className="payment-gateway-breakdown">
            <div><span>Subtotal</span><strong>{formatAmount(order.subtotal)}</strong></div>
            {order.discountAmount && Number(order.discountAmount) > 0 ? (
              <div><span>Discount</span><strong>-{formatAmount(order.discountAmount)}</strong></div>
            ) : null}
            <div><span>Shipping</span><strong>{formatAmount(order.shippingAmount)}</strong></div>
            <div><span>Tax</span><strong>{formatAmount(order.taxAmount)}</strong></div>
            <div className="is-total"><span>Total due</span><strong>{formatAmount(order.totalAmount)}</strong></div>
          </div>
        </section>

        <section className="payment-gateway-card payment-gateway-card--form">
          <div className="payment-gateway-card-head">
            <h2>Card payment</h2>
            <span className="payment-gateway-secure-badge">SSL encrypted</span>
          </div>

          {phase === 'confirming' || isPending ? (
            <div className="payment-gateway-status payment-gateway-status--active">
              Payment received. Confirming with payment gateway…
            </div>
          ) : null}

          {paymentSession && phase !== 'confirming' ? (
            <div className="payment-gateway-dropin-wrap">
              <AirwallexDropIn
                intentId={paymentSession.intentId}
                clientSecret={paymentSession.clientSecret}
                currency={paymentSession.currency}
                env={paymentSession.env}
                onSuccess={handlePaymentSuccess}
                onError={(errorMessage) => setMessage(errorMessage)}
              />
            </div>
          ) : null}

          {message ? <p className="form-error" role="alert">{message}</p> : null}

          <p className="payment-gateway-footnote">
            Need to review details first?{' '}
            <Link
              href={
                user
                  ? `/account/orders/${orderNumber}`
                  : `/checkout/confirmation/${orderNumber}${guestToken ? `?guestToken=${encodeURIComponent(guestToken)}` : ''}`
              }
              className="section-link"
            >
              View order snapshot
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
