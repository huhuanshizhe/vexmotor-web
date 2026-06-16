'use client';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/providers/auth-provider';
import { fetchOrderByNumber } from '@/lib/account-api';
import { parseOrderNote } from '@/lib/order-note';

export default function AccountOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ action?: string }>;
}) {
  const { user } = useAuth();
  const [orderNumber, setOrderNumber] = useState('');
  const [action, setAction] = useState<string | undefined>();
  const [order, setOrder] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    void (async () => {
      const [{ orderNumber: nextOrderNumber }, nextSearchParams] = await Promise.all([params, searchParams]);
      setOrderNumber(nextOrderNumber);
      setAction(nextSearchParams.action);
      if (!user) return;
      const nextOrder = await fetchOrderByNumber(nextOrderNumber).catch(() => null);
      setOrder(nextOrder as Record<string, any> | null);
    })();
  }, [params, searchParams, user]);

  if (!user) {
    return null;
  }

  if (order === null && orderNumber) {
    return <p className="section-description">Loading order…</p>;
  }

  if (!order) {
    notFound();
  }

  const rmaMode = action === 'rma';
  const shippingAddress = order.shippingAddressSnapshot as Record<string, string | null>;
  const billingAddress = order.billingAddressSnapshot as Record<string, string | null>;
  const parsedNote = parseOrderNote(order.customerNote);

  return (
    <div className="account-panel-stack">
      <div className="section-header">
        <div>
          <h1 className="section-title">Order {order.orderNumber}</h1>
          <p className="section-description">Status: {order.status} · Payment: {order.paymentMethod ?? 'Not set'} · Shipping: {order.shippingMethod ?? 'Not set'}</p>
        </div>
        <Link href="/account/orders" className="nav-link">Back to orders</Link>
      </div>
      {rmaMode ? (
        <article className="info-card" style={{ display: 'grid', gap: 14 }}>
          <div>
            <div className="card-kicker">Return / Warranty Request</div>
            <h2 style={{ margin: '6px 0 0' }}>RMA handoff for order {order.orderNumber}</h2>
          </div>
          <div className="support-list">
            <div className="support-item">
              <span className="support-bullet" />
              <span>Confirm which line item is affected and whether the issue is defect, wrong item, shipping damage, or warranty review.</span>
            </div>
          </div>
        </article>
      ) : null}
      <div className="info-grid" style={{ alignItems: 'start' }}>
        <article className="info-card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Items</h2>
          {(order.items ?? []).map((item: { id: string; productName: string; sku: string; quantity: number; subtotal: string }) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, paddingBottom: 12, borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <strong>{item.productName}</strong>
                <div className="product-meta">{item.sku} · Qty {item.quantity}</div>
              </div>
              <strong>${Number(item.subtotal).toFixed(2)}</strong>
            </div>
          ))}
        </article>
        <article className="info-card" style={{ display: 'grid', gap: 18 }}>
          <div>
            <h2 style={{ marginTop: 0 }}>Shipping Address</h2>
            <div className="section-description">
              <div>{shippingAddress.firstName} {shippingAddress.lastName}</div>
              <div>{shippingAddress.addressLine1}</div>
              <div>{shippingAddress.city} {shippingAddress.postalCode}</div>
              <div>{shippingAddress.countryCode}</div>
            </div>
          </div>
          <div>
            <h2 style={{ marginTop: 0 }}>Billing Address</h2>
            <div className="section-description">
              <div>{billingAddress.firstName} {billingAddress.lastName}</div>
              <div>{billingAddress.addressLine1}</div>
              <div>{billingAddress.city} {billingAddress.postalCode}</div>
              <div>{billingAddress.countryCode}</div>
            </div>
          </div>
          {parsedNote.narrative ? <p className="section-description">{parsedNote.narrative}</p> : null}
        </article>
      </div>
    </div>
  );
}
