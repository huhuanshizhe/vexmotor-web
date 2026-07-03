'use client';

import Image from 'next/image';
import { LocalizedLink as Link } from '@/components/i18n/localized-link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';

import { AirwallexDropIn } from '@/components/checkout/airwallex-drop-in';
import { PaymentGatewayModeBadge } from '@/components/checkout/payment-gateway-mode-badge';
import { StripePaymentCheckout } from '@/components/checkout/stripe-payment-checkout';
import { useAuth } from '@/components/providers/auth-provider';
import { fetchGuestOrderDetail, fetchOrderByNumber } from '@/lib/account-api';
import {
  completeCheckoutPayment,
  confirmCheckoutPayment,
  createCheckoutPaymentIntent,
  fetchOrderPaymentGatewayStatus,
  finalizeCheckoutPayment,
  isOrderPaidOnSite,
  type CheckoutPaymentIntentSession,
} from '@/lib/checkout-payment-api';
import { type Locale } from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n-context';
import { formatCurrency } from '@/lib/i18n-formatter';
import { resolveOrderDisplayCurrency } from '@/lib/order-currency';
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
  spu: string;
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
  currencyCode?: string;
  locale?: string;
  customerNote?: string | null;
  items?: PayableOrderItem[];
};

function formatOrderAmount(amount: string, currencyCode: string, locale: Locale) {
  return formatCurrency(Number(amount), currencyCode, locale);
}

function formatOrderLineAmount(
  amount: string,
  currencyCode: string,
  locale: Locale,
  freeLabel: string,
) {
  if (Number(amount) === 0) {
    return freeLabel;
  }
  return formatOrderAmount(amount, currencyCode, locale);
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

function isOnlineCardPaymentMethod(paymentMethod: string) {
  return paymentMethod === 'Credit Card' || paymentMethod === 'Credit Card (Stripe)' || paymentMethod === 'Credit Card (Airwallex)';
}

export function CheckoutPaymentClient({ orderNumber, guestToken }: CheckoutPaymentClientProps) {
  const { user } = useAuth();
  const { locale, t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<PayableOrder | null>(null);
  const [paymentSession, setPaymentSession] = useState<CheckoutPaymentIntentSession | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'confirming' | 'error'>('loading');
  const [isPending, startTransition] = useTransition();

  const returnUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return '';
    }
    const params = new URLSearchParams();
    if (guestToken) {
      params.set('guestToken', guestToken);
    }
    const query = params.toString();
    return `${window.location.origin}${pathname}${query ? `?${query}` : ''}`;
  }, [guestToken, pathname]);

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
              ? t('checkoutPayment.loadOrderFailedAuth')
              : t('checkoutPayment.loadOrderFailedGuest'),
          );
          return;
        }

        if (!isOnlineCardPaymentMethod(nextOrder.paymentMethod)) {
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

        const redirectPaymentIntent = searchParams.get('payment_intent');
        const redirectClientSecret = searchParams.get('payment_intent_client_secret');
        if (redirectPaymentIntent && redirectClientSecret) {
          setPhase('confirming');
          try {
            const confirmResult = await completeCheckoutPayment(orderNumber, guestToken);
            router.replace(buildPaidRedirect(confirmResult.redirectPath, guestToken));
            router.refresh();
            return;
          } catch (error) {
            if (!cancelled) {
              setPhase('error');
              setLoadError(
                error instanceof Error
                  ? error.message
                  : t('checkoutPayment.paymentNotConfirmedRedirect'),
              );
            }
            return;
          }
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
          setLoadError(error instanceof Error ? error.message : t('checkoutPayment.startPaymentFailed'));
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [guestToken, orderNumber, router, searchParams, t, user]);

  function redirectAfterPayment(redirectPath: string) {
    router.push(buildPaidRedirect(redirectPath, guestToken));
    router.refresh();
  }

  function handleAirwallexSuccess() {
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
            : t('checkoutPayment.paymentNotConfirmed'),
        );
      }
    });
  }

  function handleStripeSuccess(paymentIntentStatus: string) {
    startTransition(async () => {
      setPhase('confirming');
      setMessage(null);

      try {
        const confirmResult =
          paymentIntentStatus === 'succeeded'
            ? await confirmCheckoutPayment(orderNumber, guestToken).catch(() => completeCheckoutPayment(orderNumber, guestToken))
            : await completeCheckoutPayment(orderNumber, guestToken);
        redirectAfterPayment(confirmResult.redirectPath);
      } catch (error) {
        setPhase('ready');
        setMessage(
          error instanceof Error
            ? error.message
            : t('checkoutPayment.paymentNotConfirmed'),
        );
      }
    });
  }

  if (phase === 'loading') {
    return (
      <div className="payment-gateway-shell">
        <div className="payment-gateway-status">{t('checkoutPayment.loadingStatus')}</div>
      </div>
    );
  }

  if (phase === 'error' || !order) {
    return (
      <div className="payment-gateway-shell">
        <article className="payment-gateway-card payment-gateway-card--centered">
          <h2>{t('checkoutPayment.unavailableTitle')}</h2>
          <p>{loadError ?? t('checkoutPayment.unavailableDefault')}</p>
          <div className="payment-gateway-actions">
            <Link href="/checkout" className="nav-link">{t('checkoutPayment.backToCheckout')}</Link>
            {user ? <Link href="/account/orders" className="nav-link">{t('checkoutPayment.viewOrders')}</Link> : null}
          </div>
        </article>
      </div>
    );
  }

  const currencyCode = resolveOrderDisplayCurrency(order, locale, paymentSession?.currency);
  const freeLabel = t('checkout.free');
  const lineCount = (order.items ?? []).length;

  return (
    <div className="payment-gateway-shell">
      <header className="payment-gateway-header">
        <div>
          <p className="payment-gateway-eyebrow">{t('checkoutPayment.eyebrow')}</p>
          <h1 className="payment-gateway-title">{t('checkoutPayment.title', { orderNumber: order.orderNumber })}</h1>
          <p className="payment-gateway-subtitle">
            {t('checkoutPayment.subtitle')}
          </p>
        </div>
        <div className="payment-gateway-total-chip">
          <span>{t('checkoutPayment.totalDue')}</span>
          <strong>{formatOrderAmount(order.totalAmount, currencyCode, locale)}</strong>
        </div>
      </header>

      <div className="payment-gateway-layout">
        <section className="payment-gateway-card payment-gateway-card--items">
          <div className="payment-gateway-card-head">
            <h2>{t('checkoutPayment.itemsTitle')}</h2>
            <span>{t('checkoutPayment.lineCount', { count: lineCount })}</span>
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
                  <span className="product-meta">{item.spu}</span>
                  <span className="payment-gateway-item-qty">{t('checkoutPayment.qty', { quantity: item.quantity })}</span>
                </div>
                <strong className="payment-gateway-item-price">
                  {formatOrderAmount(item.subtotal, currencyCode, locale)}
                </strong>
              </li>
            ))}
          </ul>

          <div className="payment-gateway-breakdown">
            <div><span>{t('cart.subtotal')}</span><strong>{formatOrderAmount(order.subtotal, currencyCode, locale)}</strong></div>
            {order.discountAmount && Number(order.discountAmount) > 0 ? (
              <div><span>{t('checkout.discount')}</span><strong>-{formatOrderAmount(order.discountAmount, currencyCode, locale)}</strong></div>
            ) : null}
            <div>
              <span>{t('cart.shipping')}</span>
              <strong>{formatOrderLineAmount(order.shippingAmount, currencyCode, locale, freeLabel)}</strong>
            </div>
            <div><span>{t('cart.tax')}</span><strong>{formatOrderAmount(order.taxAmount, currencyCode, locale)}</strong></div>
            <div className="is-total">
              <span>{t('checkoutPayment.totalDue')}</span>
              <strong>{formatOrderAmount(order.totalAmount, currencyCode, locale)}</strong>
            </div>
          </div>
        </section>

        <section className="payment-gateway-card payment-gateway-card--form">
          <div className="payment-gateway-card-head">
            <h2>{t('checkoutPayment.cardPayment')}</h2>
            {paymentSession?.mode ? (
              <PaymentGatewayModeBadge mode={paymentSession.mode} gateway={paymentSession.gateway} />
            ) : null}
          </div>

          {phase === 'confirming' || isPending ? (
            <div className="payment-gateway-status payment-gateway-status--active">
              {t('checkoutPayment.confirming')}
            </div>
          ) : null}

          {paymentSession && phase !== 'confirming' ? (
            <div className="payment-gateway-dropin-wrap">
              {paymentSession.gateway === 'stripe' && paymentSession.publicKey ? (
                <StripePaymentCheckout
                  publicKey={paymentSession.publicKey}
                  clientSecret={paymentSession.clientSecret}
                  returnUrl={returnUrl}
                  locale={locale}
                  onSuccess={handleStripeSuccess}
                  onError={(errorMessage) => setMessage(errorMessage)}
                />
              ) : paymentSession.gateway === 'airwallex' && paymentSession.env ? (
                <AirwallexDropIn
                  intentId={paymentSession.intentId}
                  clientSecret={paymentSession.clientSecret}
                  currency={paymentSession.currency}
                  env={paymentSession.env}
                  onSuccess={handleAirwallexSuccess}
                  onError={(errorMessage) => setMessage(errorMessage)}
                />
              ) : (
                <p className="form-error">{t('checkoutPayment.formLoadFailed')}</p>
              )}
            </div>
          ) : null}

          {message ? <p className="form-error" role="alert">{message}</p> : null}

          <p className="payment-gateway-footnote">
            {t('checkoutPayment.footnote')}{' '}
            <Link
              href={
                user
                  ? `/account/orders/${orderNumber}`
                  : `/checkout/confirmation/${orderNumber}${guestToken ? `?guestToken=${encodeURIComponent(guestToken)}` : ''}`
              }
              className="section-link"
            >
              {t('checkoutPayment.viewOrderSnapshot')}
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
