'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { COMPARE_ITEMS_UPDATED_EVENT, clearCompareItems, readCompareItems, removeCompareItem, type CompareItem } from '@/lib/compare-items';
import type { Locale } from '@/lib/i18n';
import { withLocalePath } from '@/lib/i18n';

type CompareDrawerProps = {
  locale: Locale;
  expanded?: boolean;
};

export function CompareDrawer({ locale, expanded = false }: CompareDrawerProps) {
  const [items, setItems] = useState<CompareItem[]>([]);

  useEffect(() => {
    const syncItems = () => {
      setItems(readCompareItems());
    };

    syncItems();
    window.addEventListener('storage', syncItems);
    window.addEventListener(COMPARE_ITEMS_UPDATED_EVENT, syncItems);

    return () => {
      window.removeEventListener('storage', syncItems);
      window.removeEventListener(COMPARE_ITEMS_UPDATED_EVENT, syncItems);
    };
  }, []);

  if (!items.length) {
    return null;
  }

  return (
    <aside className={`compare-drawer${expanded ? ' is-expanded' : ''}`} aria-label="Compare drawer">
      <div className="compare-drawer-copy">
        <strong>Compare shortlist</strong>
        <p>{items.length} of 4 products pinned for side-by-side review.</p>
      </div>

      <div className="compare-drawer-items">
        {items.map((item) => (
          <article key={item.id} className="compare-drawer-chip">
            <div>
              <Link href={withLocalePath(`/products/${item.slug}`, locale)} className="compare-drawer-link">
                {item.name}
              </Link>
              <span className="compare-drawer-meta">{item.sku}</span>
            </div>
            <button type="button" className="compare-drawer-remove" onClick={() => setItems(removeCompareItem(item.id))} aria-label={`Remove ${item.name} from compare`}>
              Remove
            </button>
          </article>
        ))}
      </div>

      <div className="compare-drawer-actions">
        <Link href={withLocalePath('/compare', locale)} className="ui-button is-brand is-sm">
          Compare now
        </Link>
        <button type="button" className="ui-button is-secondary is-sm" onClick={() => setItems(clearCompareItems())}>
          Clear
        </button>
      </div>
    </aside>
  );
}