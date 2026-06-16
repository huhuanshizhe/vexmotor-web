'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState, useTransition } from 'react';

import { useToast } from '@C/toast';
import { apiFetch } from '@/lib/api-client';
import type { Locale } from '@/lib/i18n';
import { withLocalePath } from '@/lib/i18n';
import {
  clearCompareItems,
  COMPARE_ITEMS_UPDATED_EVENT,
  readCompareItems,
  removeCompareItem,
  type CompareItem,
  upsertCompareItem,
} from '@/lib/compare-items';

import { AddToCartButton } from './add-to-cart-button';

type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription?: string | null;
  price: {
    currency: string;
    amount: number;
    formatted: string;
  };
  purchaseMode: 'buy' | 'inquiry';
  inStock: boolean;
};

type CompareClientProps = {
  locale: Locale;
  catalogProducts: CatalogProduct[];
};

type CompareGroup = {
  title: string;
  rows: Array<{
    label: string;
    values: string[];
  }>;
};

const HIDE_IDENTICAL_STORAGE_KEY = 'vexmotor-compare-hide-identical';
const SAVED_LISTS_STORAGE_KEY = 'vexmotor-compare-saved-lists';

function getLeadTimeLabel(item: CompareItem) {
  return item.inStock ? 'Ships today to 5 business days' : '3 to 15 business days';
}

function getCompatibilityLabel(item: CompareItem) {
  const haystack = `${item.name} ${item.categories.join(' ')}`.toLowerCase();
  if (haystack.includes('nema 17')) {
    return 'Matched digital drivers for NEMA 17 builds';
  }
  if (haystack.includes('nema 23')) {
    return 'High-current drivers and 48V power stacks';
  }
  if (haystack.includes('driver')) {
    return 'Closed-loop motors, supplies, and cabinets';
  }
  if (haystack.includes('power')) {
    return 'Stepper drivers, motors, and cabinet integration';
  }
  return 'Review accessory matching with engineering';
}

function isDifferenceRow(values: string[]) {
  return new Set(values.map((value) => value.trim().toLowerCase())).size > 1;
}

function buildCompareGroups(items: CompareItem[]): CompareGroup[] {
  return [
    {
      title: 'Electrical',
      rows: [
        {
          label: 'Operating profile',
          values: items.map((item) => item.shortDescription ?? 'Engineering review required'),
        },
        {
          label: 'Purchase mode',
          values: items.map((item) => (item.purchaseMode === 'buy' ? 'Direct Buy' : 'RFQ / Inquiry')),
        },
      ],
    },
    {
      title: 'Mechanical',
      rows: [
        {
          label: 'SKU',
          values: items.map((item) => item.sku),
        },
        {
          label: 'Family',
          values: items.map((item) => (item.categories.length ? item.categories.join(', ') : 'Unclassified')),
        },
      ],
    },
    {
      title: 'Compliance & docs',
      rows: [
        {
          label: 'Datasheet / CAD',
          values: items.map(() => 'Available on the product detail page'),
        },
        {
          label: 'Engineering support',
          values: items.map((item) => (item.purchaseMode === 'buy' ? 'Catalog + engineering support' : 'RFQ-led engineering review')),
        },
      ],
    },
    {
      title: 'Stock & lead time',
      rows: [
        {
          label: 'Stock status',
          values: items.map((item) => (item.inStock ? 'In stock' : 'Lead time on request')),
        },
        {
          label: 'Lead time',
          values: items.map(getLeadTimeLabel),
        },
        {
          label: 'Price from',
          values: items.map((item) => item.priceLabel),
        },
      ],
    },
  ];
}

export function CompareClient({ locale, catalogProducts }: CompareClientProps) {
  const { pushToast } = useToast();
  const [items, setItems] = useState<CompareItem[]>([]);
  const [hideIdenticalRows, setHideIdenticalRows] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [unitModeLabel, setUnitModeLabel] = useState('Site units');
  const [isPending, startTransition] = useTransition();

  const compareLayoutStyle = useMemo(
    () => ({ '--compare-columns': String(Math.max(items.length, 1)) }) as CSSProperties,
    [items.length],
  );

  const filteredCatalogProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const currentIds = new Set(items.map((item) => item.id));
    const pool = catalogProducts.filter((product) => !currentIds.has(product.id));
    if (!query) {
      return pool.slice(0, 6);
    }

    return pool.filter((product) => `${product.name} ${product.sku}`.toLowerCase().includes(query)).slice(0, 6);
  }, [catalogProducts, items, searchTerm]);

  const compareGroups = useMemo(() => buildCompareGroups(items), [items]);
  const quoteSkus = items.map((item) => item.sku).join(',');
  const quoteHref = quoteSkus ? `${withLocalePath('/quote', locale)}?addSku=${encodeURIComponent(quoteSkus)}` : withLocalePath('/quote', locale);

  useEffect(() => {
    const syncItems = () => setItems(readCompareItems());

    syncItems();
    setHideIdenticalRows(window.sessionStorage.getItem(HIDE_IDENTICAL_STORAGE_KEY) === '1');
    window.addEventListener(COMPARE_ITEMS_UPDATED_EVENT, syncItems);

    return () => {
      window.removeEventListener(COMPARE_ITEMS_UPDATED_EVENT, syncItems);
    };
  }, []);

  useEffect(() => {
    if (items.length) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const urlSkus = params.get('skus')?.split(',').map((item) => item.trim()).filter(Boolean) ?? [];
    if (!urlSkus.length) {
      return;
    }

    const seededItems = urlSkus
      .map((sku) => catalogProducts.find((product) => product.sku.toLowerCase() === sku.toLowerCase()))
      .filter((product): product is CatalogProduct => Boolean(product))
      .map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        priceLabel: product.purchaseMode === 'buy' ? product.price.formatted : 'Request Quote',
        purchaseMode: product.purchaseMode,
        inStock: product.inStock,
        shortDescription: product.shortDescription,
        categories: [],
      }));

    if (!seededItems.length) {
      return;
    }

    seededItems.forEach((item) => upsertCompareItem(item));
    setItems(readCompareItems());
  }, [catalogProducts, items.length]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (items.length) {
      params.set('skus', items.map((item) => item.sku).join(','));
    } else {
      params.delete('skus');
    }

    const nextQuery = params.toString();
    const nextUrl = `${withLocalePath('/compare', locale)}${nextQuery ? `?${nextQuery}` : ''}`;
    window.history.replaceState({}, '', nextUrl);
  }, [items, locale]);

  function toggleHideIdentical() {
    setHideIdenticalRows((current) => {
      const nextValue = !current;
      window.sessionStorage.setItem(HIDE_IDENTICAL_STORAGE_KEY, nextValue ? '1' : '0');
      return nextValue;
    });
  }

  function saveList() {
    try {
      const storedLists = JSON.parse(window.localStorage.getItem(SAVED_LISTS_STORAGE_KEY) ?? '[]') as Array<{
        id: string;
        savedAt: string;
        skus: string[];
      }>;

      storedLists.push({
        id: `${Date.now()}`,
        savedAt: new Date().toISOString(),
        skus: items.map((item) => item.sku),
      });
      window.localStorage.setItem(SAVED_LISTS_STORAGE_KEY, JSON.stringify(storedLists.slice(-10)));
      pushToast({ title: 'Compare list saved', description: 'The current compare set was stored in this browser.', tone: 'success' });
    } catch {
      pushToast({ title: 'Could not save list', description: 'The saved compare list store could not be updated.', tone: 'error', persistent: true });
    }
  }

  function addAnother(product: CatalogProduct) {
    if (items.some((item) => item.id === product.id)) {
      pushToast({ title: 'Already in compare', description: `${product.sku} is already in the compare table.`, tone: 'success' });
      return;
    }
    if (items.length >= 4) {
      pushToast({ title: 'Compare list full', description: 'Remove one SKU before adding another item.', tone: 'error', persistent: true });
      return;
    }

    upsertCompareItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      priceLabel: product.purchaseMode === 'buy' ? product.price.formatted : 'Request Quote',
      purchaseMode: product.purchaseMode,
      inStock: product.inStock,
      shortDescription: product.shortDescription,
      categories: [],
    });
    setItems(readCompareItems());
    pushToast({ title: 'Added to compare', description: `${product.sku} was added to the compare list.`, tone: 'success' });
  }

  function addAllToCart() {
    const buyItems = items.filter((item) => item.purchaseMode === 'buy');
    if (!buyItems.length) {
      pushToast({ title: 'No direct-buy SKUs', description: 'Only direct-buy products can be added to the cart in bulk.', tone: 'error', persistent: true });
      return;
    }

    startTransition(async () => {
      let successCount = 0;
      for (const item of buyItems) {
        try {
          await apiFetch('/api/front/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: item.id, quantity: 1 }),
          });
          successCount += 1;
        } catch {
          // Continue with remaining items.
        }
      }

      if (successCount) {
        pushToast({
          title: 'Compare items added to cart',
          description: `${successCount} direct-buy SKU${successCount === 1 ? '' : 's'} added from the compare list.`,
          tone: 'success',
        });
        return;
      }

      pushToast({ title: 'Cart update failed', description: 'The compare items could not be added to the cart.', tone: 'error', persistent: true });
    });
  }

  if (!items.length) {
    return (
      <article className="info-card empty-state-card">
        <h3 style={{ margin: 0 }}>No products in the compare list yet.</h3>
        <p className="section-description">Browse the catalog and use Add to Compare on any product page or listing card.</p>
        <div className="inline-link-list">
          <Link href={withLocalePath('/products', locale)} className="section-link">
            Browse Products
          </Link>
          <Link href={withLocalePath('/search', locale)} className="section-link">
            Search Catalog
          </Link>
        </div>
      </article>
    );
  }

  return (
    <div className="compare-page-stack" style={compareLayoutStyle}>
      <div className="section-header compare-toolbar">
        <div>
          <h2 className="section-title">Comparing {items.length} product{items.length === 1 ? '' : 's'}</h2>
          <p className="section-description">Compare up to four SKUs, hide identical rows, print, save the current set, and route the shortlist into cart or RFQ.</p>
        </div>
        <div className="compare-toolbar-actions">
          <button type="button" className="button-secondary cart-action-button" onClick={toggleHideIdentical}>
            {hideIdenticalRows ? 'Show all rows' : 'Hide identical rows'}
          </button>
          <button type="button" className="button-secondary cart-action-button" onClick={() => window.print()}>
            Print
          </button>
          <button type="button" className="button-secondary cart-action-button" onClick={saveList}>
            Save list
          </button>
          <button type="button" className="button-secondary cart-action-button" onClick={() => setUnitModeLabel((current) => (current === 'Site units' ? 'Metric view' : 'Site units'))}>
            {unitModeLabel}
          </button>
          <button type="button" className="button-secondary cart-action-button" onClick={() => setItems(clearCompareItems())}>
            Clear list
          </button>
        </div>
      </div>

      <article className="info-card compare-add-panel">
        <div className="section-header trade-card-header">
          <div>
            <h3 className="cart-section-title">Add another (+)</h3>
            <p className="section-description">Search the catalog and add another SKU until the 4-column compare limit is reached.</p>
          </div>
        </div>
        <label className="form-field">
          <span>Search catalog</span>
          <input className="form-input" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search by SKU or product name" />
        </label>
        <div className="compare-add-grid">
          {filteredCatalogProducts.map((product) => (
            <article key={product.id} className="compare-add-card">
              <strong>{product.name}</strong>
              <span className="product-meta">{product.sku}</span>
              <span className="section-description compact-copy">{product.shortDescription ?? 'Catalog product ready for shortlist comparison.'}</span>
              <button type="button" className="button-secondary cart-action-button" onClick={() => addAnother(product)} disabled={items.length >= 4}>
                Add to compare
              </button>
            </article>
          ))}
        </div>
      </article>

      <div className="compare-column-grid">
        {items.map((item) => (
          <article key={item.id} className="compare-header-card">
            <div className="product-card-top">
              <span className="product-badge">{item.purchaseMode === 'buy' ? 'Direct Buy' : 'Inquiry'}</span>
              <button type="button" className="compare-remove-button" onClick={() => setItems(removeCompareItem(item.id))} aria-label={`Remove ${item.name} from compare`}>
                ×
              </button>
            </div>
            <h3>
              <Link href={withLocalePath(`/products/${item.slug}`, locale)}>{item.name}</Link>
            </h3>
            <p className="product-meta">{item.sku}</p>
            <p className="product-price">{item.priceLabel}</p>
            <span className="product-status">{item.inStock ? 'In stock' : 'Lead time on request'}</span>
            <p className="section-description compact-copy">{item.shortDescription ?? 'No short description available.'}</p>
            {item.purchaseMode === 'buy' ? (
              <AddToCartButton productId={item.id} redirectToCart={false} />
            ) : (
              <Link href={quoteHref} className="button-secondary product-back-link">
                Add to Quote
              </Link>
            )}
          </article>
        ))}
      </div>

      <div className="compare-group-stack">
        {compareGroups.map((group) => {
          const rows = hideIdenticalRows ? group.rows.filter((row) => isDifferenceRow(row.values)) : group.rows;
          if (!rows.length) {
            return null;
          }

          return (
            <article key={group.title} className="info-card compare-table-card">
              <div className="section-header trade-card-header">
                <div>
                  <h3 className="cart-section-title">{group.title}</h3>
                </div>
              </div>
              <div className="compare-spec-table" role="table" aria-label={`${group.title} comparison table`}>
                {rows.map((row) => {
                  const difference = isDifferenceRow(row.values);
                  return (
                    <div key={`${group.title}-${row.label}`} className={`compare-spec-row${difference ? ' is-different' : ''}`}>
                      <div className="compare-spec-label">{row.label}</div>
                      {row.values.map((value, index) => (
                        <div key={`${row.label}-${items[index]?.id ?? index}`} className="compare-spec-cell">
                          {value}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>

      <article className="info-card compare-table-card">
        <div className="section-header trade-card-header">
          <div>
            <h3 className="cart-section-title">Documents</h3>
            <p className="section-description">Quick links into each product’s PDF and CAD surface.</p>
          </div>
        </div>
        <div className="compare-column-grid compare-column-grid-docs">
          {items.map((item) => (
            <div key={`${item.id}-docs`} className="compare-doc-card">
              <Link href={withLocalePath(`/products/${item.slug}#detail-documents`, locale)} className="section-link">
                Datasheet / PDF
              </Link>
              <Link href={withLocalePath(`/products/${item.slug}#detail-documents`, locale)} className="section-link">
                CAD / STEP
              </Link>
            </div>
          ))}
        </div>
      </article>

      <article className="info-card compare-table-card">
        <div className="section-header trade-card-header">
          <div>
            <h3 className="cart-section-title">Compatible</h3>
            <p className="section-description">System-level pairing prompts that keep the compare flow useful before the full compatibility engine lands.</p>
          </div>
        </div>
        <div className="compare-column-grid compare-column-grid-docs">
          {items.map((item) => (
            <div key={`${item.id}-compatible`} className="compare-doc-card">
              <strong>{getCompatibilityLabel(item)}</strong>
              <Link href={withLocalePath('/search', locale)} className="section-link">
                Search matched accessories
              </Link>
            </div>
          ))}
        </div>
      </article>

      <article className="info-card compare-cta-strip">
        <Link href={quoteHref} className="button-primary">
          Add all to Quote
        </Link>
        <button type="button" className="button-secondary product-back-link" onClick={addAllToCart} disabled={isPending}>
          {isPending ? 'Adding...' : 'Add all to Cart'}
        </button>
        <button type="button" className="button-secondary product-back-link" onClick={saveList}>
          Save as list
        </button>
      </article>
    </div>
  );
}