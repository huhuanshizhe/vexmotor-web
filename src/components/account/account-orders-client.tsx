'use client';

import { LocalizedLink as Link } from '@/components/i18n/localized-link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';

import {
  cancelAccountOrder,
  fetchAccountOrders,
  type AccountOrderListItem,
  type AccountOrdersListResult,
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
  shippingStatusLabels,
  shippingStatusPillClass,
} from '@/lib/order-display';

type AccountOrdersClientProps = {
  locale?: string;
};

function getCapabilities(order: AccountOrderListItem) {
  const canPay =
    order.paymentStatus === 'unpaid'
    && order.paymentMethod === 'Credit Card'
    && order.status !== 'cancelled';
  const canCancel = order.paymentStatus === 'unpaid' && order.status === 'unpaid';
  return { canPay, canCancel };
}

export function AccountOrdersClient({ locale = 'en' }: AccountOrdersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<AccountOrdersListResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState({ unpaid: 0, processing: 0, shipped: 0 });

  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const q = searchParams.get('q') ?? '';
  const paymentStatus = searchParams.get('paymentStatus') ?? 'all';
  const orderStatus = searchParams.get('orderStatus') ?? 'all';

  const [draftQ, setDraftQ] = useState(q);

  useEffect(() => {
    setDraftQ(q);
  }, [q]);

  const query = useMemo(
    () => ({ page, pageSize: 10, q, paymentStatus, orderStatus }),
    [page, paymentStatus, orderStatus, q],
  );

  const loadOrders = useCallback(async () => {
    const result = await fetchAccountOrders(query);
    setData(result);
  }, [query]);

  useEffect(() => {
    void loadOrders().catch(() => setData({ items: [], page: 1, pageSize: 10, total: 0, totalPages: 0 }));
  }, [loadOrders]);

  useEffect(() => {
    void (async () => {
      try {
        const [unpaid, processing, shipped] = await Promise.all([
          fetchAccountOrders({ paymentStatus: 'unpaid', page: 1, pageSize: 1 }),
          fetchAccountOrders({ orderStatus: 'pending_processing', page: 1, pageSize: 1 }),
          fetchAccountOrders({ orderStatus: 'shipped', page: 1, pageSize: 1 }),
        ]);
        setSummary({
          unpaid: unpaid.total,
          processing: processing.total,
          shipped: shipped.total,
        });
      } catch {
        setSummary({ unpaid: 0, processing: 0, shipped: 0 });
      }
    })();
  }, []);

  function updateParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (!value || value === 'all') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    if (!('page' in next)) {
      params.delete('page');
    }
    const suffix = params.toString();
    router.push(suffix ? `/account/orders?${suffix}` : '/account/orders');
  }

  function applyFilters(event: React.FormEvent) {
    event.preventDefault();
    updateParams({ q: draftQ.trim() || undefined, paymentStatus, orderStatus, page: undefined });
  }

  function handleCancel(orderNumber: string) {
    if (!window.confirm(`Cancel order ${orderNumber}? This cannot be undone.`)) {
      return;
    }

    startTransition(async () => {
      setMessage(null);
      try {
        await cancelAccountOrder(orderNumber);
        await loadOrders();
        setMessage(`Order ${orderNumber} was cancelled.`);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Unable to cancel order.');
      }
    });
  }

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const rangeStart = total === 0 ? 0 : (page - 1) * 10 + 1;
  const rangeEnd = Math.min(page * 10, total);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 1) {
      return [1];
    }
    const pages: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let current = start; current <= end; current += 1) {
      pages.push(current);
    }
    return pages;
  }, [page, totalPages]);

  return (
    <div className="account-order-page">
      <div className="account-order-kpi-grid">
        <article className="account-order-kpi">
          <span>Unpaid</span>
          <strong>{summary.unpaid}</strong>
        </article>
        <article className="account-order-kpi">
          <span>Processing</span>
          <strong>{summary.processing}</strong>
        </article>
        <article className="account-order-kpi">
          <span>Shipped</span>
          <strong>{summary.shipped}</strong>
        </article>
      </div>

      <article className="account-order-filters">
        <form className="account-toolbar" onSubmit={applyFilters}>
          <label className="account-quote-filter-field">
            <span>Search order</span>
            <input
              className="account-quote-input"
              value={draftQ}
              onChange={(event) => setDraftQ(event.target.value)}
              placeholder="Order number"
            />
          </label>
          <label className="account-quote-filter-field">
            <span>Payment</span>
            <select
              className="account-quote-input"
              value={paymentStatus}
              onChange={(event) => updateParams({ paymentStatus: event.target.value, page: undefined })}
            >
              <option value="all">All</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
            </select>
          </label>
          <label className="account-quote-filter-field">
            <span>Order status</span>
            <select
              className="account-quote-input"
              value={orderStatus}
              onChange={(event) => updateParams({ orderStatus: event.target.value, page: undefined })}
            >
              <option value="all">All</option>
              <option value="pending_processing">Processing</option>
              <option value="partially_shipped">Partially shipped</option>
              <option value="shipped">Shipped</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <button type="submit" className="button-primary">Apply</button>
        </form>
      </article>

      {message ? <p className="section-description">{message}</p> : null}

      <article className="account-order-table-card">
        <div className="account-order-table-head">
          <span>Order</span>
          <span>Placed</span>
          <span>Lines</span>
          <span>Total</span>
          <span>Payment</span>
          <span>Order</span>
          <span>Shipping</span>
          <span>Refund</span>
          <span>Actions</span>
        </div>

        {items.length ? items.map((order) => {
          const { canPay, canCancel } = getCapabilities(order);
          return (
            <div key={order.id} className="account-order-table-row">
              <div>
                <strong className="account-quote-mono">{order.orderNumber}</strong>
              </div>
              <span>{formatOrderDate(order.placedAt, locale)}</span>
              <span>{order.itemCount}</span>
              <strong>{formatOrderMoney(order.totalAmount, order.currencyCode, locale)}</strong>
              <span className={paymentStatusPillClass(order.paymentStatus)}>
                {paymentStatusLabels[order.paymentStatus] ?? order.paymentStatus}
              </span>
              <span className={orderStatusPillClass(order.status)}>
                {orderStatusLabels[order.status] ?? order.status}
              </span>
              <span className={shippingStatusPillClass(order.shippingStatus)}>
                {shippingStatusLabels[order.shippingStatus] ?? order.shippingStatus}
              </span>
              <span className={refundStatusPillClass(order.refundStatus)}>
                {refundStatusLabels[order.refundStatus] ?? order.refundStatus}
              </span>
              <div className="account-order-row-actions">
                <Link href={`/account/orders/${order.orderNumber}`} className="account-order-link">View</Link>
                {canPay ? (
                  <Link href={buildCheckoutPayPath(order.orderNumber)} className="account-order-link">Pay now</Link>
                ) : null}
                {canCancel ? (
                  <button
                    type="button"
                    className="account-order-link account-order-link--danger"
                    disabled={isPending}
                    onClick={() => handleCancel(order.orderNumber)}
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </div>
          );
        }) : (
          <p className="account-order-empty">No orders match your filters.</p>
        )}

        {totalPages > 0 ? (
          <div className="account-order-pagination">
            <span className="section-description">
              Showing {rangeStart}–{rangeEnd} of {total}
            </span>
            <div className="account-order-pagination__pages">
              <button
                type="button"
                className="account-order-pagination__nav"
                disabled={page <= 1 || isPending}
                onClick={() => updateParams({ page: String(page - 1) })}
              >
                Previous
              </button>
              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={`account-order-pagination__page${pageNumber === page ? ' is-active' : ''}`}
                  disabled={isPending}
                  onClick={() => updateParams({ page: String(pageNumber) })}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                className="account-order-pagination__nav"
                disabled={page >= totalPages || isPending}
                onClick={() => updateParams({ page: String(page + 1) })}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </article>
    </div>
  );
}
