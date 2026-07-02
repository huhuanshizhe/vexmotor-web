'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import type { Locale } from '@/lib/i18n';
import { apiFetch } from '@/lib/api-client';
import { withLocalePath } from '@/lib/i18n';
import type { StorefrontProductCard } from '@/lib/storefront-api';

const RECENTLY_VIEWED_STORAGE_KEY = 'vexmotor-recently-viewed-products';

type RecentProduct = Pick<StorefrontProductCard, 'id' | 'name' | 'slug' | 'spu' | 'price' | 'purchaseMode' | 'coverImage' | 'inStock'>;

type RecentlyViewedProductsProps = {
  currentProduct: StorefrontProductCard;
  fallbackProducts: StorefrontProductCard[];
  locale: Locale;
};

function formatAvailability(item: RecentProduct) {
  if (item.purchaseMode !== 'buy') {
    return 'RFQ workflow';
  }

  return item.inStock ? 'Stock ready' : 'Quote review';
}

function toRecentProduct(product: StorefrontProductCard): RecentProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    spu: product.spu,
    price: product.price,
    purchaseMode: product.purchaseMode,
    coverImage: product.coverImage,
    inStock: product.inStock,
  };
}

function hydrateRecentProduct(item: RecentProduct, fallbackProduct?: StorefrontProductCard): RecentProduct {
  if (!fallbackProduct) {
    return item;
  }

  return {
    ...item,
    coverImage: item.coverImage ?? fallbackProduct.coverImage,
    inStock: item.inStock ?? fallbackProduct.inStock,
  };
}

function buildVisibleRecentProducts(storedItems: RecentProduct[], currentProductId: string, fallbackProducts: StorefrontProductCard[]) {
  const fallbackById = new Map(fallbackProducts.map((item) => [item.id, item]));
  const hydratedStored = storedItems
    .filter((item) => item.id !== currentProductId)
    .slice(0, 8)
    .map((item) => hydrateRecentProduct(item, fallbackById.get(item.id)));

  const preferredItems = hydratedStored.filter((item) => item.coverImage).slice(0, 3);

  if (preferredItems.length === 3) {
    return preferredItems;
  }

  const fallbackItems = fallbackProducts
    .map(toRecentProduct)
    .filter((item) => item.id !== currentProductId && !preferredItems.some((preferredItem) => preferredItem.id === item.id))
    .filter((item) => item.coverImage)
    .slice(0, 3 - preferredItems.length);

  return [...preferredItems, ...fallbackItems].slice(0, 3);
}

type RecentProductPatch = Pick<RecentProduct, 'coverImage' | 'inStock' | 'purchaseMode' | 'price'>;

function readRecentlyViewed() {
  if (typeof window === 'undefined') {
    return [] as RecentProduct[];
  }

  const stored = window.localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY);
  if (!stored) {
    return [] as RecentProduct[];
  }

  try {
    const parsed = JSON.parse(stored) as RecentProduct[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [] as RecentProduct[];
  }
}

export function RecentlyViewedProducts({ currentProduct, fallbackProducts, locale }: RecentlyViewedProductsProps) {
  const [items, setItems] = useState<RecentProduct[]>(fallbackProducts.map(toRecentProduct).filter((item) => item.id !== currentProduct.id).slice(0, 3));

  useEffect(() => {
    const stored = readRecentlyViewed();
    const nextStored = [toRecentProduct(currentProduct), ...stored.filter((item) => item.id !== currentProduct.id)].slice(0, 8);

    window.localStorage.setItem(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(nextStored));

    const visibleItems = buildVisibleRecentProducts(nextStored, currentProduct.id, fallbackProducts);

    if (visibleItems.length) {
      setItems(visibleItems);
      return;
    }

    setItems(fallbackProducts.map(toRecentProduct).filter((item) => item.id !== currentProduct.id).slice(0, 3));
  }, [currentProduct, fallbackProducts]);

  useEffect(() => {
    const missingImageItems = items.filter((item) => !item.coverImage).slice(0, 3);

    if (!missingImageItems.length) {
      return;
    }

    let isCancelled = false;

    const loadMissingImages = async () => {
      const results = await Promise.all(
        missingImageItems.map(async (item) => {
          try {
            const product = await apiFetch<StorefrontProductCard>(`/api/front/products/${item.slug}`);

            if (!product.coverImage) {
              return null;
            }

            return {
              id: item.id,
              patch: {
                coverImage: product.coverImage,
                inStock: product.inStock,
                purchaseMode: product.purchaseMode,
                price: product.price,
              } satisfies RecentProductPatch,
            };
          } catch {
            return null;
          }
        }),
      );

      if (isCancelled) {
        return;
      }

      const updateEntries = results.flatMap((result) => (result ? [[result.id, result.patch] as const] : []));
      const updates = new Map(updateEntries);

      if (!updates.size) {
        return;
      }

      setItems((currentItems) =>
        currentItems.map((item) => {
          const patch = updates.get(item.id);
          return patch ? { ...item, ...patch } : item;
        }),
      );

      const stored = readRecentlyViewed();
      const nextStored = stored.map((item) => {
        const patch = updates.get(item.id);
        return patch ? { ...item, ...patch } : item;
      });

      window.localStorage.setItem(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(nextStored));
    };

    void loadMissingImages();

    return () => {
      isCancelled = true;
    };
  }, [items]);

  if (!items.length) {
    return null;
  }

  return (
    <article className="info-card detail-panel-card detail-recent-card">
      <div className="detail-recent-header">
        <h2 className="section-title detail-recent-title-heading">Recently viewed</h2>
      </div>

      <div className="detail-recent-list">
        {items.map((item) => (
          <Link key={item.id} href={withLocalePath(`/products/${item.slug}`, locale)} className="detail-recent-item">
            <div className="detail-recent-media">
              {item.coverImage ? (
                <Image
                  src={item.coverImage.url}
                  alt={item.coverImage.alt || item.name}
                  fill
                  sizes="96px"
                  className="detail-recent-image"
                  unoptimized
                />
              ) : (
                <div className="detail-recent-placeholder">No image</div>
              )}
            </div>

            <div className="detail-recent-content">
              <strong className="detail-recent-title">{item.name}</strong>
              <div className="detail-recent-stats">
                <span className="detail-recent-stat">SPU {item.spu}</span>
                <span className="detail-recent-stat">{item.purchaseMode === 'buy' ? item.price.formatted : 'Request Quote'}</span>
                <span className="detail-recent-stat">{formatAvailability(item)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </article>
  );
}