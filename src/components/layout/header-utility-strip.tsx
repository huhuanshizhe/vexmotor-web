'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { apiFetch } from '@/lib/api-client';
import { COMPARE_ITEMS_UPDATED_EVENT, readCompareItems } from '@/lib/compare-items';
import { CURRENCY_COOKIE_NAME, LOCALE_COOKIE_NAME, PREFERENCE_COOKIE_MAX_AGE, type SitePreferences, withLocalePath, parseLocaleFromPathname } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/storefront/language-switcher';
import { CART_UPDATED_EVENT } from '@/components/storefront/add-to-cart-button';
import type { StorefrontUtilityLink } from '@/lib/storefront-api';

type HeaderUtilityStripProps = {
  links: StorefrontUtilityLink[];
  initialCartCount: number;
  preferences: SitePreferences;
};

/* ── Icon components for utility links ── */

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

const UTILITY_ICONS: Record<string, (props: { className?: string }) => React.JSX.Element> = {
  cart: CartIcon,
  Compare: CompareIcon,
  Wishlist: WishlistIcon,
  Login: LoginIcon,
};

export function HeaderUtilityStrip({ links, initialCartCount, preferences }: HeaderUtilityStripProps) {
  const [compareCount, setCompareCount] = useState(0);
  const [cartCount, setCartCount] = useState(initialCartCount);
  const [locale, setLocale] = useState(preferences.locale);
  const [currency, setCurrency] = useState(preferences.currency);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const syncCompareCount = () => {
      setCompareCount(readCompareItems().length);
    };

    const syncCartCount = () => {
      apiFetch<{ itemCount?: number }>('/api/front/cart')
        .then((detail) => {
          if (detail && typeof detail.itemCount === 'number') {
            setCartCount(detail.itemCount);
          }
        })
        .catch(() => {});
    };

    syncCompareCount();
    window.addEventListener('storage', syncCompareCount);
    window.addEventListener(COMPARE_ITEMS_UPDATED_EVENT, syncCompareCount);
    window.addEventListener(CART_UPDATED_EVENT, syncCartCount);

    return () => {
      window.removeEventListener('storage', syncCompareCount);
      window.removeEventListener(COMPARE_ITEMS_UPDATED_EVENT, syncCompareCount);
      window.removeEventListener(CART_UPDATED_EVENT, syncCartCount);
    };
  }, []);

  const writePreferenceCookie = (name: string, value: string) => {
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${PREFERENCE_COOKIE_MAX_AGE}; SameSite=Lax`;
  };

  const applyLocale = (nextLocale: SitePreferences['locale']) => {
    const strippedPath = parseLocaleFromPathname(pathname).pathname;
    const queryString = searchParams.toString();
    const nextPath = `${withLocalePath(strippedPath, nextLocale)}${queryString ? `?${queryString}` : ''}`;

    setLocale(nextLocale);
    writePreferenceCookie(LOCALE_COOKIE_NAME, nextLocale);

    const currentPath = `${withLocalePath(strippedPath, locale)}${queryString ? `?${queryString}` : ''}`;
    if (nextPath !== currentPath) {
      router.push(nextPath);
    } else {
      router.refresh();
    }
  };

  const applyCurrency = (nextCurrency: SitePreferences['currency']) => {
    setCurrency(nextCurrency);
    writePreferenceCookie(CURRENCY_COOKIE_NAME, nextCurrency);

    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="header-utility-strip">
      <div className="header-market-group" aria-label="Site preferences">
        <LanguageSwitcher />

        <label className="header-language-chip">
          <span className="sr-only">Currency</span>
          <select className="header-market-select" value={currency} onChange={(event) => applyCurrency(event.target.value as SitePreferences['currency'])} disabled={isPending}>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </label>
      </div>

      <div className="header-icon-links">
        {links.map((item) => {
          const IconComponent = UTILITY_ICONS[item.label];
          const count = item.label === 'cart' ? cartCount : item.label === 'Compare' ? compareCount : null;

          const linkContent = (
            <span className="header-icon-link-inner">
              {IconComponent ? <IconComponent className="header-icon-svg" /> : <span>{item.label}</span>}
              {count !== null && count > 0 ? <span className="header-utility-count">{count}</span> : null}
            </span>
          );

          const className = 'header-icon-link';

          if (item.external) {
            return (
              <a key={`${item.label}-${item.href}`} href={item.href} className={className} target="_blank" rel="noreferrer" title={item.label}>
                {linkContent}
              </a>
            );
          }

          return (
            <Link key={`${item.label}-${item.href}`} href={item.href.startsWith('/') ? withLocalePath(item.href, locale) : item.href} className={className} title={item.label}>
              {linkContent}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
