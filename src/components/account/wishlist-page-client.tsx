'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState, useTransition } from 'react';

import { useAuth } from '@/components/providers/auth-provider';
import { AddToCartButton } from '@/components/storefront/add-to-cart-button';
import { fetchWishlist, removeWishlistItem, type WishlistItem } from '@/lib/account-api';
import { useTranslation } from '@/lib/i18n-context';
import { useLocalizedPath } from '@/lib/use-localized-path';

type PreviewImage = {
  url: string;
  alt: string;
};

export function WishlistPageClient() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const localizedPath = useLocalizedPath();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<PreviewImage | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadWishlist = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchWishlist();
      setItems(data.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    void loadWishlist();
  }, [user, loadWishlist]);

  function handleRemove(productId: string) {
    startTransition(async () => {
      try {
        await removeWishlistItem(productId);
        setItems((current) => current.filter((item) => item.productId !== productId));
      } catch {
        // Keep list unchanged on failure.
      }
    });
  }

  if (isLoading) {
    return (
      <div className="account-panel-stack wishlist-page">
        <h1 className="section-title">{t('wishlist.title')}</h1>
        <p className="section-description">{t('wishlist.loading')}</p>
      </div>
    );
  }

  return (
    <div className="account-panel-stack wishlist-page">
      <div className="wishlist-page-header">
        <div>
          <h1 className="section-title">{t('wishlist.title')}</h1>
          <p className="section-description">
            {items.length
              ? items.length === 1
                ? t('wishlist.savedCountSingle')
                : t('wishlist.savedCount', { count: items.length })
              : t('wishlist.emptyDesc')}
          </p>
        </div>
        {items.length ? <span className="wishlist-count-badge">{items.length}</span> : null}
      </div>

      {!items.length ? (
        <div className="wishlist-empty-card">
          <p className="section-description">{t('wishlist.emptyTitle')}</p>
          <Link href={localizedPath('/products')} className="button-primary">
            {t('wishlist.browseCatalog')}
          </Link>
        </div>
      ) : (
        <ul className="wishlist-list">
          {items.map((item) => {
            const productHref = localizedPath(`/products/${item.slug}`);
            const cover = item.coverImage;

            return (
              <li key={item.id}>
                <article className="wishlist-item-card">
                  <button
                    type="button"
                    className="wishlist-thumb-button"
                    onClick={() => {
                      if (cover?.url) {
                        setPreviewImage({ url: cover.url, alt: cover.alt || item.name });
                      }
                    }}
                    disabled={!cover?.url}
                    aria-label={cover?.url ? t('wishlist.previewFor', { name: item.name }) : t('wishlist.noImageFor', { name: item.name })}
                  >
                    {cover?.url ? (
                      <Image
                        src={cover.url}
                        alt={cover.alt || item.name}
                        width={72}
                        height={72}
                        unoptimized
                        className="wishlist-thumb-image"
                      />
                    ) : (
                      <span className="wishlist-thumb-placeholder" aria-hidden="true">
                        {t('wishlist.noImage')}
                      </span>
                    )}
                  </button>

                  <div className="wishlist-item-main">
                    <div className="wishlist-item-topline">
                      <span className="product-badge">{item.inStock ? t('product.inStock') : t('catalog.leadTimeOnRequest')}</span>
                      <span className="wishlist-item-spu">
                        <span className="catalog-grid-spu-label">{t('product.spu')}</span>
                        {item.spu}
                      </span>
                    </div>
                    <h2 className="wishlist-item-title">
                      <Link href={productHref}>{item.name}</Link>
                    </h2>
                    {item.shortDescription ? (
                      <p className="section-description compact-copy wishlist-item-description">{item.shortDescription}</p>
                    ) : null}
                    <p className="product-price wishlist-item-price">
                      {item.purchaseMode === 'buy' ? item.price.formatted : t('product.requestQuote')}
                    </p>
                  </div>

                  <div className="wishlist-item-actions">
                    <Link href={productHref} className="button-secondary wishlist-action-btn">
                      {t('wishlist.viewProduct')}
                    </Link>
                    {item.purchaseMode === 'buy' ? (
                      <AddToCartButton productId={item.productId} redirectToCart={false} bar />
                    ) : (
                      <Link href={productHref} className="catalog-add-to-cart-bar catalog-add-to-cart-bar-secondary">
                        {t('product.requestQuote')}
                      </Link>
                    )}
                    <button
                      type="button"
                      className="wishlist-remove-btn"
                      onClick={() => handleRemove(item.productId)}
                      disabled={isPending}
                    >
                      {t('wishlist.remove')}
                    </button>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}

      {previewImage ? (
        <div
          className="wishlist-preview-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={t('wishlist.previewDialog')}
          onClick={() => setPreviewImage(null)}
        >
          <button type="button" className="wishlist-preview-close" onClick={() => setPreviewImage(null)} aria-label={t('wishlist.closePreview')}>
            ×
          </button>
          <div className="wishlist-preview-frame" onClick={(event) => event.stopPropagation()}>
            <Image
              src={previewImage.url}
              alt={previewImage.alt}
              width={960}
              height={960}
              unoptimized
              className="wishlist-preview-image"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
