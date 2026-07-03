'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { useToast } from '@C/toast';
import { useWishlist } from '@/components/providers/wishlist-provider';
import { getAccessToken } from '@/lib/api-client';
import { parseLocaleFromPathname, withLocalePath } from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n-context';

type AddToWishlistButtonProps = {
  productId: string;
  icon?: boolean;
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
  const { isInWishlist, isLoading, addToWishlist } = useWishlist();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const inWishlist = isInWishlist(productId);

  function handleWishlist() {
    if (inWishlist) {
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
        await addToWishlist(productId);
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

  const label = inWishlist ? t('product.inWishlist') : t('product.addToWishlist');
  const disabled = isPending || isLoading || inWishlist;

  if (icon) {
    return (
      <button
        type="button"
        className={`catalog-card-icon-btn${inWishlist ? ' is-active' : ''}`}
        onClick={handleWishlist}
        disabled={disabled}
        aria-label={label}
        aria-pressed={inWishlist}
        title={label}
      >
        <WishlistIcon className="catalog-card-icon-svg" filled={inWishlist} />
      </button>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <button
        type="button"
        className={`button-secondary storefront-toggle-btn${inWishlist ? ' is-added' : ''}`}
        onClick={handleWishlist}
        disabled={disabled}
        aria-pressed={inWishlist}
      >
        {inWishlist ? (
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
