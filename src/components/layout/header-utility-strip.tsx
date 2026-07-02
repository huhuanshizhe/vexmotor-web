'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';

import { useAuth } from '@/components/providers/auth-provider';
import { apiFetch, AUTH_TOKEN_CHANGED_EVENT, getAccessToken } from '@/lib/api-client';
import type { UserProfile } from '@/lib/auth-client';
import { CART_UPDATED_EVENT, getCartLineItemCount, type CartApiSnapshot, type CartUpdatedDetail } from '@/lib/cart-session';
import { COMPARE_ITEMS_UPDATED_EVENT, readCompareItems } from '@/lib/compare-items';
import { QUOTE_ITEMS_UPDATED_EVENT, readQuoteItems } from '@/lib/quote-live-items';
import { withLocalePath } from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n-context';
import { localizeUtilityLabel } from '@/lib/site-shell-localize';
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

function QuoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
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
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function getAccountInitials(user: UserProfile) {
  const first = user.firstName.trim()[0] ?? '';
  const last = user.lastName.trim()[0] ?? '';
  if (first || last) {
    return `${first}${last}`.toUpperCase();
  }
  return (user.email[0] ?? 'U').toUpperCase();
}

const UTILITY_ICONS: Record<string, (props: { className?: string }) => React.JSX.Element> = {
  cart: CartIcon,
  Quotes: QuoteIcon,
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

function resolveUtilityBadgeCount(label: string, cartCount: number, compareCount: number, quoteCount: number) {
  const normalized = label.toLowerCase();
  if (normalized === 'cart') {
    return cartCount;
  }
  if (normalized === 'quotes') {
    return quoteCount;
  }
  if (normalized === 'compare') {
    return compareCount;
  }
  return null;
}

function subscribeAccessToken(onStoreChange: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, onStoreChange);
  };
}

function getAccessTokenSnapshot() {
  return Boolean(getAccessToken());
}

function getServerAccessTokenSnapshot() {
  return false;
}

export function HeaderUtilityStrip({ links, initialCartCount }: HeaderUtilityStripProps) {
  const { locale, t } = useTranslation();
  const { user, isLoading } = useAuth();
  const hasStoredToken = useSyncExternalStore(
    subscribeAccessToken,
    getAccessTokenSnapshot,
    getServerAccessTokenSnapshot,
  );
  const [compareCount, setCompareCount] = useState(0);
  const [quoteCount, setQuoteCount] = useState(0);
  const [cartCount, setCartCount] = useState(initialCartCount);

  const showAccount = Boolean(user) || (isLoading && hasStoredToken);
  const resolvedLinks = useMemo(() => resolveUtilityLinks(links, showAccount), [links, showAccount]);

  useEffect(() => {
    const syncCompareCount = () => {
      setCompareCount(readCompareItems().length);
    };

    const syncQuoteCount = () => {
      setQuoteCount(readQuoteItems().length);
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
    syncQuoteCount();
    syncCartCount();
    window.addEventListener('storage', syncCompareCount);
    window.addEventListener('storage', syncQuoteCount);
    window.addEventListener(COMPARE_ITEMS_UPDATED_EVENT, syncCompareCount);
    window.addEventListener(QUOTE_ITEMS_UPDATED_EVENT, syncQuoteCount);
    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdated);

    return () => {
      window.removeEventListener('storage', syncCompareCount);
      window.removeEventListener('storage', syncQuoteCount);
      window.removeEventListener(COMPARE_ITEMS_UPDATED_EVENT, syncCompareCount);
      window.removeEventListener(QUOTE_ITEMS_UPDATED_EVENT, syncQuoteCount);
      window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdated);
    };
  }, []);

  return (
    <div className="header-utility-strip">
      <LanguageSwitcher />

      <div className="header-icon-links">
        {resolvedLinks.map((item) => {
          const IconComponent = UTILITY_ICONS[item.label];
          const count = resolveUtilityBadgeCount(item.label, cartCount, compareCount, quoteCount);
          const isAccountLink = item.label === 'Account';
          const linkTitle = isAccountLink
            ? t('header.myAccount')
            : localizeUtilityLabel(item.label, t);
          const badgeLabel = count !== null && count > 0 ? String(count) : null;

          const linkContent = (
            <span className="header-icon-link-inner">
              {isAccountLink && showAccount ? (
                user ? (
                  <span className="header-account-avatar" aria-hidden="true">
                    {getAccountInitials(user)}
                  </span>
                ) : (
                  <span className="header-account-avatar header-account-avatar--loading" aria-hidden="true" />
                )
              ) : IconComponent ? (
                <IconComponent className="header-icon-svg" />
              ) : (
                <span>{item.label}</span>
              )}
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
