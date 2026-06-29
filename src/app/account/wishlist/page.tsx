'use client';

import { useEffect, useState } from 'react';

import { useAuth } from '@/components/providers/auth-provider';
import { fetchWishlist } from '@/lib/account-api';
import { useLocalizedPath } from '@/lib/use-localized-path';

export default function AccountWishlistPage() {
  const { user } = useAuth();
  const localizedPath = useLocalizedPath();
  const [items, setItems] = useState<Array<{ productId: string; name: string; slug: string }>>([]);

  useEffect(() => {
    if (!user) return;
    void fetchWishlist()
      .then((data) => setItems((data as { items?: typeof items }).items ?? []))
      .catch(() => setItems([]));
  }, [user]);

  return (
    <div className="account-panel-stack">
      <h1 className="section-title">Wishlist</h1>
      {!items.length ? <p className="section-description">No saved products yet.</p> : null}
      <div className="info-grid">
        {items.map((item) => (
          <article key={item.productId} className="info-card">
            <h2 style={{ marginTop: 0 }}>{item.name}</h2>
            <a href={localizedPath(`/products/${item.slug}`)} className="section-link">View product</a>
          </article>
        ))}
      </div>
    </div>
  );
}
