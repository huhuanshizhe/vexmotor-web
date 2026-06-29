'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/providers/auth-provider';
import { apiFetch, getAccessToken } from '@/lib/api-client';
import { CART_UPDATED_EVENT, getCartLineItemCount, type CartApiSnapshot, type CartUpdatedDetail } from '@/lib/cart-session';
import { COMPARE_ITEMS_UPDATED_EVENT, readCompareItems } from '@/lib/compare-items';
import { withLocalePath } from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n-context';
import { LanguageSwitcher } from '@/components/storefront/language-switcher';
import type { StorefrontUtilityLink } from '@/lib/storefront-api';

type HeaderUtilityStripProps = {
  links: StorefrontUtilityLink[];
  initialCartCount: number;
};

function CartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function CompareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <rect x="7" y="10" width="3" height="8" rx="0.5" />
      <rect x="14" y="6" width="3" height="12" rx="0.5" />
    </svg>
  );
}

function WishlistIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function LoginIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function AccountIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6v1H4v-1z" />
    </svg>
  );
}

const UTILITY_ICONS: Record<string, (props: { className?: string }) => React.JSX.Element> = {
  cart: CartIcon,
  Compare: CompareIcon,
  Wishlist: WishlistIcon,
  Login: LoginIcon,
  Account: AccountIcon,
};

function isLoginUtilityLink(item: StorefrontUtilityLink) {
  return item.label === 'Login' || item.href === '/login' || item.href.endsWith('/login');
}

function resolveUtilityLinks(links: StorefrontUtilityLink[], showAccount: boolean): StorefrontUtilityLink[] {
  return links.map((item) => {
    if (!isLoginUtilityLink(item)) {
      return item;
    }

    if (showAccount) {
      return { ...item, label: 'Account', href: '/account' };
    }

    return item;
  });
}

function resolveUtilityBadgeCount(label: string, cartCount: number, compareCount: number) {
  const normalized = label.toLowerCase();
  if (normalized === 'cart') {
    return cartCount;
  }
  if (normalized === 'compare') {
    return compareCount;
  }
  return null;
}

export function HeaderUtilityStrip({ links, initialCartCount }: HeaderUtilityStripProps) {
  const { locale, t } = useTranslation();
  const { user, isLoading } = useAuth();
  const [compareCount, setCompareCount] = useState(0);
  const [cartCount, setCartCount] = useState(initialCartCount);

  const showAccount = Boolean(user) || (isLoading && Boolean(getAccessToken()));
  const resolvedLinks = useMemo(() => resolveUtilityLinks(links, showAccount), [links, showAccount]);

  useEffect(() => {
    const syncCompareCount = () => {
      setCompareCount(readCompareItems().length);
    };

    const syncCartCount = () => {
      apiFetch<CartApiSnapshot>('/api/front/cart')
        .then((detail) => {
          if (detail) {
            setCartCount(getCartLineItemCount(detail));
          }
        })
        .catch(() => {});
    };

    const handleCartUpdated = (event: Event) => {
      const detail = (event as CustomEvent<CartUpdatedDetail>).detail;
      if (typeof detail?.lineItemCount === 'number') {
        setCartCount(detail.lineItemCount);
        return;
      }
      syncCartCount();
    };

    syncCompareCount();
    syncCartCount();
    window.addEventListener('storage', syncCompareCount);
    window.addEventListener(COMPARE_ITEMS_UPDATED_EVENT, syncCompareCount);
    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdated);

    return () => {
      window.removeEventListener('storage', syncCompareCount);
      window.removeEventListener(COMPARE_ITEMS_UPDATED_EVENT, syncCompareCount);
      window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdated);
    };
  }, []);

  return (
    <div className="header-utility-strip">
      <LanguageSwitcher />

      <div className="header-icon-links">
        {resolvedLinks.map((item) => {
          const IconComponent = UTILITY_ICONS[item.label];
          const count = resolveUtilityBadgeCount(item.label, cartCount, compareCount);
          const isAccountLink = item.label === 'Account';
          const linkTitle = isAccountLink ? t('header.myAccount') : item.label === 'Login' ? t('header.login') : item.label;
          const badgeLabel = count !== null && count > 0 ? String(count) : null;

          const linkContent = (
            <span className="header-icon-link-inner">
              {IconComponent ? <IconComponent className="header-icon-svg" /> : <span>{item.label}</span>}
              {badgeLabel ? (
                <span className="header-icon-badge" aria-hidden="true">
                  {badgeLabel}
                </span>
              ) : null}
            </span>
          );

          const ariaLabel = badgeLabel ? `${linkTitle} (${badgeLabel})` : linkTitle;

          const className = `header-icon-link${isAccountLink ? ' is-authenticated' : ''}`;

          if (item.external) {
            return (
              <a key={`${item.label}-${item.href}`} href={item.href} className={className} target="_blank" rel="noreferrer" title={linkTitle} aria-label={ariaLabel}>
                {linkContent}
              </a>
            );
          }

          return (
            <Link key={`${item.label}-${item.href}`} href={item.href.startsWith('/') ? withLocalePath(item.href, locale) : item.href} className={className} title={linkTitle} aria-label={ariaLabel}>
              {linkContent}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
