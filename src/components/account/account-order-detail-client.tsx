'use client';

import Image from 'next/image';
import { LocalizedLink as Link } from '@/components/i18n/localized-link';
import { notFound } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { OrderRefundRequestDialog } from '@/components/account/order-refund-request-dialog';
import { useAuth } from '@/components/providers/auth-provider';
import {
  cancelAccountOrder,
  fetchAccountOrderDetail,
  requestAccountOrderRefund,
  type AccountOrderDetail,
  type AccountOrderLineItem,
} from '@/lib/account-orders-api';
import { buildCheckoutPayPath } from '@/lib/checkout-pay-path';
import {
  formatOrderDate,
  formatOrderMoney,
  orderStatusLabels,
  orderStatusPillClass,
  paymentStatusLabels,
  paymentStatusPillClass,
  refundStatusLabels,
  refundStatusPillClass,
  refundTypeLabels,
  returnTypeLabels,
  shippingStatusLabels,
  shippingStatusPillClass,
} from '@/lib/order-display';

type AccountOrderDetailClientProps = {
  orderNumber: string;
  locale?: string;
};

function formatAddress(snapshot: Record<string, string | null>) {
  return [
    [snapshot.firstName, snapshot.lastName].filter(Boolean).join(' '),
    snapshot.company,
    snapshot.addressLine1,
    snapshot.addressLine2,
    [snapshot.city, snapshot.state, snapshot.postalCode].filter(Boolean).join(', '),
    snapshot.countryCode,
    snapshot.phone,
  ].filter(Boolean);
}

function OrderLineCard({
  item,
  currencyCode,
  locale,
}: {
  item: AccountOrderLineItem;
  currencyCode: string;
  locale: string;
}) {
  return (
    <article className="account-order-line-card">
      <div className="account-order-line-card__thumb">
        {item.coverImage?.url ? (
          <Image
            src={item.coverImage.url}
            alt={item.coverImage.alt || item.productName}
            width={item.coverImage.width ?? 88}
            height={item.coverImage.height ?? 88}
            className="account-order-line-card__image"
          />
        ) : (
          <span className="account-order-line-card__thumb-fallback" aria-hidden="true">
            {item.sku.slice(0, 2)}
          </span>
        )}
      </div>
      <div className="account-order-line-card__body">
        <strong className="account-order-line-card__title">{item.productName}</strong>
        <span className="account-quote-mono account-order-line-card__sku">{item.sku}</span>
        {item.featureSelections?.length ? (
          <p className="account-order-line-card__features">
            {item.featureSelections.map((selection) => selection.display).join(' · ')}
          </p>
        ) : null}
        <div className="account-order-line-card__meta">
          <span>Qty {item.quantity}</span>
          <span>Unit {formatOrderMoney(item.unitPrice, currencyCode, locale)}</span>
        </div>
      </div>
      <div className="account-order-line-card__price">
        <span className="account-order-line-card__price-label">Line total</span>
        <strong>{formatOrderMoney(item.subtotal, currencyCode, locale)}</strong>
      </div>
    </article>
  );
}

export function AccountOrderDetailClient({ orderNumber, locale = 'en' }: AccountOrderDetailClientProps) {
  const { user } = useAuth();
  const [order, setOrder] = useState<AccountOrderDetail | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'not-found'>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [refundOpen, setRefundOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!user) {
      return;
    }

    void fetchAccountOrderDetail(orderNumber)
      .then((nextOrder) => {
        setOrder(nextOrder);
        setLoadState('ready');
      })
      .catch(() => {
        setLoadState('not-found');
      });
  }, [orderNumber, user]);

  if (!user) {
    return null;
  }

  if (loadState === 'loading') {
    return <p className="section-description">Loading order…</p>;
  }

  if (loadState === 'not-found' || !order) {
    notFound();
  }

  const detail = order;

  function reloadOrder() {
    return fetchAccountOrderDetail(orderNumber).then(setOrder);
  }

  function handleCancel() {
    if (!window.confirm(`Cancel order ${detail.orderNumber}?`)) {
      return;
    }

    startTransition(async () => {
      setMessage(null);
      try {
        await cancelAccountOrder(detail.orderNumber);
        await reloadOrder();
        setMessage('Order cancelled.');
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Unable to cancel order.');
      }
    });
  }

  function handleRefundSubmit(payload: Parameters<typeof requestAccountOrderRefund>[1]) {
    return requestAccountOrderRefund(detail.orderNumber, payload).then(async () => {
      await reloadOrder();
      setMessage('Refund request submitted. Our team will review it shortly.');
    });
  }

  const shippingAddress = formatAddress(detail.shippingAddressSnapshot);
  const billingAddress = formatAddress(detail.billingAddressSnapshot);
  const buyer = detail.buyerReferences;
  const hasBuyerRefs = Boolean(buyer.poNumber || buyer.taxId || buyer.contactEmail || buyer.narrative);

  return (
    <div className="account-order-detail-v2">
      <header className="account-order-detail-v2__header">
        <Link href="/account/orders" className="account-order-detail-v2__back">
          ← Back to orders
        </Link>

        <div className="account-order-detail-v2__hero">
          <div>
            <p className="account-quote-kicker">Order detail</p>
            <h1 className="account-order-detail-v2__title account-quote-mono">{detail.orderNumber}</h1>
            <p className="account-order-detail-v2__subtitle">
              Placed {formatOrderDate(detail.placedAt, locale)}
              {detail.paymentMethod ? ` · ${detail.paymentMethod}` : ''}
            </p>
          </div>
          <div className="account-order-detail-v2__total-chip">
            <span>Order total</span>
            <strong>{formatOrderMoney(detail.totalAmount, detail.currencyCode, locale)}</strong>
          </div>
        </div>

        <div className="account-order-detail-v2__status-row">
          <span className={orderStatusPillClass(detail.status)}>
            Order · {orderStatusLabels[detail.status] ?? detail.status}
          </span>
          <span className={paymentStatusPillClass(detail.paymentStatus)}>
            Payment · {paymentStatusLabels[detail.paymentStatus] ?? detail.paymentStatus}
          </span>
          <span className={shippingStatusPillClass(detail.shippingStatus)}>
            Shipping · {shippingStatusLabels[detail.shippingStatus] ?? detail.shippingStatus}
          </span>
          <span className={refundStatusPillClass(detail.refundStatus)}>
            Refund · {refundStatusLabels[detail.refundStatus] ?? detail.refundStatus}
          </span>
        </div>

        {(detail.canPay || detail.canCancel || detail.canRequestRefund) ? (
          <div className="account-order-detail-v2__actions">
            {detail.canPay ? (
              <Link href={buildCheckoutPayPath(detail.orderNumber)} className="button-primary">
                Pay now
              </Link>
            ) : null}
            {detail.canCancel ? (
              <button type="button" className="button-secondary" disabled={isPending} onClick={handleCancel}>
                Cancel order
              </button>
            ) : null}
            {detail.canRequestRefund ? (
              <button type="button" className="button-secondary" disabled={isPending} onClick={() => setRefundOpen(true)}>
                Request refund
              </button>
            ) : null}
          </div>
        ) : null}
      </header>

      {message ? <p className="account-order-detail-v2__message" role="status">{message}</p> : null}

      <section className="account-quote-block account-quote-block--lines">
        <div className="account-quote-block__header">
          <span className="account-quote-block__step">01</span>
          <div>
            <h2 className="account-quote-block__title">Line items</h2>
            <p className="account-quote-block__desc">
              {detail.items.length} line{detail.items.length === 1 ? '' : 's'} in this order snapshot.
            </p>
          </div>
        </div>
        <div className="account-order-line-card-list">
          {detail.items.map((item) => (
            <OrderLineCard key={item.id} item={item} currencyCode={detail.currencyCode} locale={locale} />
          ))}
        </div>
      </section>

      <section className="account-quote-block">
        <div className="account-quote-block__header">
          <span className="account-quote-block__step">02</span>
          <div>
            <h2 className="account-quote-block__title">Order summary</h2>
            <p className="account-quote-block__desc">Amounts captured at checkout.</p>
          </div>
        </div>
        <dl className="account-quote-facts account-order-summary-facts">
          <div><dt>Subtotal</dt><dd>{formatOrderMoney(detail.subtotal, detail.currencyCode, locale)}</dd></div>
          {Number(detail.discountAmount) > 0 ? (
            <div><dt>Discount</dt><dd>-{formatOrderMoney(detail.discountAmount, detail.currencyCode, locale)}</dd></div>
          ) : null}
          <div><dt>Shipping</dt><dd>{formatOrderMoney(detail.shippingAmount, detail.currencyCode, locale)}</dd></div>
          <div><dt>Tax</dt><dd>{formatOrderMoney(detail.taxAmount, detail.currencyCode, locale)}</dd></div>
          <div className="account-order-summary-facts__total">
            <dt>Total</dt>
            <dd>{formatOrderMoney(detail.totalAmount, detail.currencyCode, locale)}</dd>
          </div>
        </dl>
        {detail.coupon ? (
          <div className="account-order-coupon-note">
            <strong>Coupon {detail.coupon.couponCode}</strong>
            <span>-{formatOrderMoney(detail.coupon.discountAmount, detail.currencyCode, locale)}</span>
          </div>
        ) : null}
      </section>

      <div className="account-quote-panels">
        <section className="account-quote-block account-quote-block--panel">
          <div className="account-quote-block__header">
            <span className="account-quote-block__step">03</span>
            <div>
              <h2 className="account-quote-block__title">Fulfillment</h2>
            </div>
          </div>
          <dl className="account-quote-facts">
            <div><dt>Payment</dt><dd>{detail.paymentMethod ?? '—'}</dd></div>
            <div><dt>Shipping</dt><dd>{detail.shippingMethod ?? '—'}</dd></div>
            <div><dt>Currency</dt><dd>{detail.currencyCode}</dd></div>
          </dl>
        </section>

        <section className="account-quote-block account-quote-block--panel">
          <div className="account-quote-block__header">
            <span className="account-quote-block__step">04</span>
            <div>
              <h2 className="account-quote-block__title">Buyer references</h2>
            </div>
          </div>
          {hasBuyerRefs ? (
            <dl className="account-quote-facts">
              <div><dt>PO number</dt><dd>{buyer.poNumber ?? '—'}</dd></div>
              <div><dt>Tax ID / VAT</dt><dd>{buyer.taxId ?? '—'}</dd></div>
              <div><dt>Contact email</dt><dd>{buyer.contactEmail ?? '—'}</dd></div>
              {buyer.narrative ? (
                <div className="account-order-buyer-note">
                  <dt>Order comment</dt>
                  <dd style={{ whiteSpace: 'pre-wrap' }}>{buyer.narrative}</dd>
                </div>
              ) : null}
            </dl>
          ) : (
            <p className="account-quote-empty-inline">No buyer references on this order.</p>
          )}
        </section>
      </div>

      <div className="account-quote-panels">
        <section className="account-quote-block account-quote-block--panel">
          <div className="account-quote-block__header">
            <span className="account-quote-block__step">05</span>
            <div>
              <h2 className="account-quote-block__title">Shipping address</h2>
            </div>
          </div>
          {shippingAddress.length ? (
            <address className="account-order-address">
              {shippingAddress.map((line) => <div key={line}>{line}</div>)}
            </address>
          ) : (
            <p className="account-quote-empty-inline">No shipping address on file.</p>
          )}
        </section>

        <section className="account-quote-block account-quote-block--panel">
          <div className="account-quote-block__header">
            <span className="account-quote-block__step">06</span>
            <div>
              <h2 className="account-quote-block__title">Billing address</h2>
            </div>
          </div>
          {billingAddress.length ? (
            <address className="account-order-address">
              {billingAddress.map((line) => <div key={line}>{line}</div>)}
            </address>
          ) : (
            <p className="account-quote-empty-inline">No billing address on file.</p>
          )}
        </section>
      </div>

      {detail.shipments.length ? (
        <section className="account-quote-block">
          <div className="account-quote-block__header">
            <span className="account-quote-block__step">07</span>
            <div>
              <h2 className="account-quote-block__title">Shipments</h2>
              <p className="account-quote-block__desc">Tracking and dispatch details.</p>
            </div>
          </div>
          <div className="account-order-shipment-list">
            {detail.shipments.map((shipment) => (
              <article key={shipment.id} className="account-order-shipment-card">
                <div className="account-order-shipment-card__head">
                  <strong className="account-quote-mono">{shipment.trackingNumber}</strong>
                  <span>{formatOrderDate(shipment.shippedAt, locale)}</span>
                </div>
                {shipment.note ? <p className="account-order-shipment-card__note">{shipment.note}</p> : null}
                {shipment.items.length ? (
                  <p className="account-order-shipment-card__items">
                    {shipment.items.map((item) => `${item.productName} (${item.sku})`).join(', ')}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {detail.refundRequest ? (
        <section className="account-quote-block account-order-refund-block">
          <div className="account-quote-block__header">
            <span className="account-quote-block__step">08</span>
            <div>
              <h2 className="account-quote-block__title">Refund request</h2>
              <p className="account-quote-block__desc">Latest customer refund submission.</p>
            </div>
          </div>
          <dl className="account-quote-facts">
            <div><dt>Type</dt><dd>{refundTypeLabels[detail.refundRequest.refundType] ?? detail.refundRequest.refundType}</dd></div>
            <div><dt>Return</dt><dd>{returnTypeLabels[detail.refundRequest.returnType] ?? detail.refundRequest.returnType}</dd></div>
            {detail.refundRequest.requestedAmount ? (
              <div>
                <dt>Requested</dt>
                <dd>{formatOrderMoney(detail.refundRequest.requestedAmount, detail.currencyCode, locale)}</dd>
              </div>
            ) : null}
            {detail.refundRequest.reason ? (
              <div className="account-order-buyer-note">
                <dt>Reason</dt>
                <dd>{detail.refundRequest.reason}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}

      {refundOpen ? (
        <OrderRefundRequestDialog
          order={detail}
          onClose={() => setRefundOpen(false)}
          onSubmit={handleRefundSubmit}
        />
      ) : null}
    </div>
  );
}
