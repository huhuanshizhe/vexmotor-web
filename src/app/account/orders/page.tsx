'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/providers/auth-provider';
import { fetchOrders, type AccountOrder } from '@/lib/account-api';

export default function AccountOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<AccountOrder[]>([]);

  useEffect(() => {
    if (!user) return;
    void fetchOrders()
      .then(setOrders)
      .catch(() => setOrders([]));
  }, [user]);

  return (
    <div className="account-panel-stack">
      <div className="section-header">
        <div>
          <h1 className="section-title">Orders</h1>
          <p className="section-description">Track every order written by the checkout flow, including totals, payment method, and shipment snapshots.</p>
        </div>
      </div>
      {!orders.length ? (
        <article className="info-card">
          <h2>No orders yet</h2>
          <p className="section-description">Your completed checkouts will appear here.</p>
          <Link href="/products" className="button-primary">Start Shopping</Link>
        </article>
      ) : (
        <div className="info-grid">
          {orders.map((order) => (
            <article key={order.id} className="info-card" style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0 }}>{order.orderNumber}</h2>
                <span className="product-badge">{order.status}</span>
              </div>
              <p className="section-description">Placed: {order.placedAt ? new Date(order.placedAt).toLocaleString() : 'Pending'}</p>
              <p className="section-description">Payment: {order.paymentMethod ?? 'Not set'}</p>
              <p className="product-price">${Number(order.totalAmount).toFixed(2)}</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link href={`/account/orders/${order.orderNumber}`} className="nav-link">View order details</Link>
                <Link href={`/account/orders/${order.orderNumber}?action=rma`} className="nav-link">Open RMA</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
