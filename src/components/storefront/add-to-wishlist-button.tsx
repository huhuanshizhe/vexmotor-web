'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, useTransition } from 'react';

import { useToast } from '@C/toast';
import { parseLocaleFromPathname, withLocalePath } from '@/lib/i18n';
import { getAccessToken } from '@/lib/api-client';
import { apiFetch } from '@/lib/api-client';
import { useTranslation } from '@/lib/i18n-context';

type AddToWishlistButtonProps = {
  productId: string;
  icon?: boolean;
};

type WishlistResponse = {
  items: Array<{ productId: string }>;
};

function WishlistIcon({ className, filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export function AddToWishlistButton({ productId, icon = false }: AddToWishlistButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { pushToast } = useToast();
  const { t } = useTranslation();
  const [message, setMessage] = useState<string | null>(null);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isPending, startTransition] = useTransition();

  const syncWishlistState = useCallback(async () => {
    if (!getAccessToken()) {
      setIsInWishlist(false);
      setIsChecking(false);
      return;
    }

    try {
      const data = await apiFetch<WishlistResponse>('/api/front/wishlist');
      setIsInWishlist(data.items.some((entry) => entry.productId === productId));
    } catch {
      setIsInWishlist(false);
    } finally {
      setIsChecking(false);
    }
  }, [productId]);

  useEffect(() => {
    void syncWishlistState();
  }, [syncWishlistState]);

  function handleWishlist() {
    if (isInWishlist) {
      return;
    }

    startTransition(async () => {
      setMessage(null);
      const locale = parseLocaleFromPathname(pathname).locale;
      if (!getAccessToken()) {
        const callbackUrl = withLocalePath('/account/wishlist', locale);
        router.push(`${withLocalePath('/login', locale)}?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        return;
      }

      try {
        const data = await apiFetch<WishlistResponse>('/api/front/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        });
        setIsInWishlist(data.items.some((entry) => entry.productId === productId));
        pushToast({
          title: t('product.addToWishlist'),
          description: t('product.inWishlist'),
          tone: 'success',
          actionLabel: t('header.wishlist'),
          actionHref: withLocalePath('/account/wishlist', locale),
        });
      } catch {
        setMessage(t('common.error'));
      }
    });
  }

  const label = isInWishlist ? t('product.inWishlist') : t('product.addToWishlist');
  const disabled = isPending || isChecking || isInWishlist;

  if (icon) {
    return (
      <button
        type="button"
        className={`catalog-card-icon-btn${isInWishlist ? ' is-active' : ''}`}
        onClick={handleWishlist}
        disabled={disabled}
        aria-label={label}
        aria-pressed={isInWishlist}
        title={label}
      >
        <WishlistIcon className="catalog-card-icon-svg" filled={isInWishlist} />
      </button>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <button
        type="button"
        className={`button-secondary storefront-toggle-btn${isInWishlist ? ' is-added' : ''}`}
        onClick={handleWishlist}
        disabled={disabled}
        aria-pressed={isInWishlist}
      >
        {isInWishlist ? (
          <span className="storefront-toggle-btn-inner">
            <WishlistIcon className="storefront-toggle-btn-icon" filled />
            {label}
          </span>
        ) : isPending ? (
          t('common.loading')
        ) : (
          label
        )}
      </button>
      {message ? <span className="section-description">{message}</span> : null}
    </div>
  );
}
