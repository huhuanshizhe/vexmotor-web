'use client';

import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { Fragment, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/providers/auth-provider';
import {
  fetchProductCompare,
  removeCompareItemRemote,
  type CompareMatrixRow,
  type CompareResult,
} from '@/lib/compare-api';
import type { Locale } from '@/lib/i18n';
import { withLocalePath } from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n-context';
import {
  COMPARE_ITEMS_UPDATED_EVENT,
  readCompareItems,
  removeCompareItem,
  type CompareItem,
} from '@/lib/compare-items';
import { syncCompareWithServer } from '@/lib/compare-sync';

import { AddToCartButton } from './add-to-cart-button';

type CompareClientProps = {
  locale: Locale;
};

type CompareGroup = {
  title: string;
  rows: Array<{
    label: string;
    values: string[];
    isDifferent: boolean;
  }>;
};

function matrixToCompareGroups(matrix: CompareMatrixRow[], groups: CompareResult['groups']): CompareGroup[] {
  const matrixByKey = new Map(matrix.map((row) => [row.key, row]));

  return groups
    .map((group) => ({
      title: group.name,
      rows: group.rows
        .map((key) => {
          const row = matrixByKey.get(key);
          if (!row) {
            return null;
          }
          return { label: row.label, values: row.values, isDifferent: row.isDifferent };
        })
        .filter((row): row is CompareGroup['rows'][number] => row !== null),
    }))
    .filter((group) => group.rows.length > 0);
}

function CompareBoardMessage({ children }: { children: ReactNode }) {
  return (
    <div className="compare-board-message">
      <p className="section-description">{children}</p>
    </div>
  );
}

export function CompareClient({ locale }: CompareClientProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();
  const [items, setItems] = useState<CompareItem[]>([]);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [matrixError, setMatrixError] = useState<string | null>(null);

  const compareLayoutStyle = useMemo(
    () => ({ '--compare-columns': String(Math.max(items.length, 1)) }) as CSSProperties,
    [items.length],
  );

  const compareGroups = useMemo(
    () => (compareResult ? matrixToCompareGroups(compareResult.matrix, compareResult.groups) : []),
    [compareResult],
  );

  const displayItems = useMemo(() => {
    if (!compareResult?.products.length) {
      return items;
    }

    const productById = new Map(compareResult.products.map((product) => [product.id, product]));
    return items.map((item) => {
      const fresh = productById.get(item.id);
      if (!fresh) {
        return item;
      }

      return {
        ...item,
        name: fresh.name,
        slug: fresh.slug,
        spu: fresh.spu,
        priceLabel: fresh.purchaseMode === 'buy' ? fresh.price.formatted : t('product.requestQuote'),
        purchaseMode: fresh.purchaseMode === 'buy' ? ('buy' as const) : ('inquiry' as const),
        inStock: fresh.inStock,
        categories: fresh.category ? [fresh.category] : item.categories,
      };
    });
  }, [compareResult, items]);

  useEffect(() => {
    const syncItems = () => setItems(readCompareItems());

    syncItems();
    window.addEventListener(COMPARE_ITEMS_UPDATED_EVENT, syncItems);

    return () => {
      window.removeEventListener(COMPARE_ITEMS_UPDATED_EVENT, syncItems);
    };
  }, []);

  useEffect(() => {
    if (!window.location.search) {
      return;
    }

    window.history.replaceState({}, '', withLocalePath('/compare', locale));
  }, [locale]);

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    let cancelled = false;
    void syncCompareWithServer()
      .then((merged) => {
        if (!cancelled) {
          setItems(merged);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  useEffect(() => {
    if (items.length < 2) {
      setCompareResult(null);
      setMatrixError(null);
      setMatrixLoading(false);
      return;
    }

    let cancelled = false;
    setMatrixLoading(true);
    setMatrixError(null);

    void fetchProductCompare(items.map((item) => item.id))
      .then((result) => {
        if (!cancelled) {
          setCompareResult(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCompareResult(null);
          setMatrixError(t('comparePage.matrixError'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setMatrixLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [items]);

  function handleRemoveItem(productId: string) {
    if (user) {
      void removeCompareItemRemote(productId).catch(() => undefined);
    }
    setItems(removeCompareItem(productId));
  }

  if (!items.length) {
    return (
      <article className="info-card empty-state-card">
        <h3 style={{ margin: 0 }}>{t('comparePage.emptyTitle')}</h3>
        <p className="section-description">{t('comparePage.emptyDesc')}</p>
        <div className="inline-link-list">
          <Link href={withLocalePath('/products', locale)} className="section-link">
            {t('comparePage.browseProducts')}
          </Link>
          <Link href={withLocalePath('/search', locale)} className="section-link">
            {t('comparePage.searchCatalog')}
          </Link>
        </div>
      </article>
    );
  }

  return (
    <div className="compare-page-stack" style={compareLayoutStyle}>
      <div className="compare-page-intro">
        <p className="section-description">
          {t('comparePage.intro', { count: items.length })}
        </p>
        <Link href={withLocalePath('/products', locale)} className="section-link">
          {t('comparePage.browseMore')}
        </Link>
      </div>

      <article className="compare-board">
        <div className="compare-board-scroll">
          <div className="compare-board-grid">
            <div className="compare-board-corner" aria-hidden="true" />

            {displayItems.map((item) => (
              <section key={item.id} className="compare-product-col">
                <div className="compare-product-top">
                  <span className="product-badge">{item.purchaseMode === 'buy' ? t('comparePage.directBuy') : t('comparePage.inquiry')}</span>
                </div>
                <h3 className="compare-product-title">
                  <Link href={withLocalePath(`/products/${item.slug}`, locale)}>{item.name}</Link>
                </h3>
                <p className="product-meta">{item.spu || '—'}</p>
                <p className="product-price">{item.priceLabel}</p>
                <span className="product-status">{item.inStock ? t('comparePage.inStock') : t('comparePage.leadTimeOnRequest')}</span>
                {item.categories.length ? (
                  <p className="section-description compact-copy">{item.categories.join(' · ')}</p>
                ) : null}
                <div className="compare-product-actions">
                  {item.purchaseMode === 'buy' ? (
                    <AddToCartButton productId={item.id} redirectToCart={false} />
                  ) : (
                    <Link href={`${withLocalePath('/quote', locale)}?addSpu=${encodeURIComponent(item.spu)}`} className="button-secondary product-back-link">
                      {t('product.addToQuote')}
                    </Link>
                  )}
                  <button type="button" className="button-secondary compare-remove-action" onClick={() => handleRemoveItem(item.id)}>
                    {t('comparePage.remove')}
                  </button>
                </div>
              </section>
            ))}

            {items.length < 2 ? (
              <CompareBoardMessage>{t('comparePage.needMore')}</CompareBoardMessage>
            ) : null}

            {items.length >= 2 && matrixLoading ? (
              <CompareBoardMessage>{t('comparePage.loadingMatrix')}</CompareBoardMessage>
            ) : null}

            {items.length >= 2 && matrixError ? <CompareBoardMessage>{matrixError}</CompareBoardMessage> : null}

            {items.length >= 2 && !matrixLoading && !matrixError
              ? compareGroups.map((group) => (
                  <Fragment key={group.title}>
                    <div className="compare-group-heading">{group.title}</div>
                    {group.rows.map((row) => (
                      <Fragment key={`${group.title}-${row.label}`}>
                        <div className={`compare-spec-label${row.isDifferent ? ' is-different' : ''}`}>{row.label}</div>
                        {row.values.map((value, index) => (
                          <div
                            key={`${row.label}-${displayItems[index]?.id ?? index}`}
                            className={`compare-spec-value${row.isDifferent ? ' is-different' : ''}`}
                          >
                            {value}
                          </div>
                        ))}
                      </Fragment>
                    ))}
                  </Fragment>
                ))
              : null}
          </div>
        </div>
      </article>
    </div>
  );
}
