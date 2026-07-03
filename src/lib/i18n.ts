export const SUPPORTED_LOCALES = ['en', 'de', 'es'] as const;
export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP'] as const;
export const SUPPORTED_UNIT_SYSTEMS = ['imperial', 'metric'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];
export type UnitSystem = (typeof SUPPORTED_UNIT_SYSTEMS)[number];

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE_NAME = 'site_locale';
export const CURRENCY_COOKIE_NAME = 'site_currency';
export const UNIT_SYSTEM_COOKIE_NAME = 'site_unit_system';
export const PREFERENCE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
export const LOCALE_REQUEST_HEADER = 'x-vex-locale';

const localeDefaults: Record<Locale, { currency: Currency; unitSystem: UnitSystem; label: string }> = {
  en: { currency: 'USD', unitSystem: 'imperial', label: 'English' },
  de: { currency: 'EUR', unitSystem: 'metric', label: 'Deutsch' },
  es: { currency: 'EUR', unitSystem: 'metric', label: 'Español' },
};

export type SitePreferences = {
  locale: Locale;
  currency: Currency;
  unitSystem: UnitSystem;
};

export function isSupportedLocale(value: string | null | undefined): value is Locale {
  return Boolean(value && SUPPORTED_LOCALES.includes(value as Locale));
}

export function normalizeLocale(value: string | null | undefined): Locale {
  return isSupportedLocale(value) ? value : DEFAULT_LOCALE;
}

export function normalizeCurrency(value: string | null | undefined): Currency | null {
  return value && SUPPORTED_CURRENCIES.includes(value as Currency) ? (value as Currency) : null;
}

export function normalizeUnitSystem(value: string | null | undefined): UnitSystem | null {
  return value && SUPPORTED_UNIT_SYSTEMS.includes(value as UnitSystem) ? (value as UnitSystem) : null;
}

const countryToLocale: Record<string, Locale> = {
  US: 'en', GB: 'en', CA: 'en', AU: 'en', NZ: 'en', IE: 'en',
  DE: 'de', AT: 'de', CH: 'de',
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es',
};

const countryToCurrency: Record<string, Currency> = {
  US: 'USD', GB: 'GBP', DE: 'EUR', FR: 'EUR', ES: 'EUR', AT: 'EUR',
  BE: 'EUR', LU: 'EUR', IE: 'EUR', CH: 'EUR',
  CA: 'USD', AU: 'USD', NZ: 'USD',
  MX: 'USD', AR: 'USD', CO: 'USD', CL: 'USD', PE: 'USD',
};

export function detectLocaleFromCountry(countryCode: string | null | undefined): Locale | null {
  if (!countryCode) return null;
  return countryToLocale[countryCode.toUpperCase()] ?? null;
}

export function detectCurrencyFromCountry(countryCode: string | null | undefined): Currency | null {
  if (!countryCode) return null;
  return countryToCurrency[countryCode.toUpperCase()] ?? null;
}

export function getEffectiveCurrency(locale: Locale, countryCode?: string | null): Currency {
  const countryCurrency = detectCurrencyFromCountry(countryCode);
  if (countryCurrency) return countryCurrency;
  return localeDefaults[locale].currency;
}

export function getMarketDefaults(locale: Locale, countryCode?: string | null) {
  return {
    ...localeDefaults[locale],
    currency: getEffectiveCurrency(locale, countryCode),
  };
}

export function getLocaleLabel(locale: Locale) {
  return localeDefaults[locale].label;
}

export const LOCALE_MARKET_OPTIONS = SUPPORTED_LOCALES.map((code) => ({
  code,
  label: localeDefaults[code].label,
  currency: localeDefaults[code].currency,
  shortCode: code.toUpperCase(),
}));

export function isDefaultLocale(locale: Locale): boolean {
  return locale === DEFAULT_LOCALE;
}

export function parseAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;
  try {
    const locales = header
      .split(',')
      .map((part) => {
        const [code, q = '1'] = part.trim().split(';q=');
        return { code: code.split('-')[0].toLowerCase(), q: parseFloat(q) };
      })
      .sort((a, b) => b.q - a.q);
    for (const { code } of locales) {
      if (isSupportedLocale(code)) return code;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Resolve locale for an incoming document request.
 * - `/de/*`, `/es/*`, `/en/*`: locale comes from the URL prefix (en is redirected separately).
 * - Unprefixed paths: English (default); first-time visitors may match Accept-Language when no cookie exists.
 */
export function resolveRequestLocale(input: {
  pathname: string;
  cookieLocale?: string | null;
  acceptLanguage?: string | null;
}): Locale {
  const { locale: urlLocale, hadPrefix } = parseLocaleFromPathname(input.pathname);

  if (hadPrefix) {
    return urlLocale;
  }

  const hasCookie = Boolean(input.cookieLocale);
  if (!hasCookie) {
    const detected = parseAcceptLanguage(input.acceptLanguage);
    if (detected) {
      return detected;
    }
  }

  return DEFAULT_LOCALE;
}

/**
 * Parse locale prefix from a pathname.
 * - `/es/products` → locale `es`, path `/products`, hadPrefix true
 * - `/en/products` → locale `en`, path `/products` (middleware redirects to `/products`)
 * - `/products` → locale `en` (default), hadPrefix false
 */
export function parseLocaleFromPathname(pathname: string) {
  const normalizedPathname = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const [firstSegment, ...restSegments] = normalizedPathname.split('/').filter(Boolean);

  if (isSupportedLocale(firstSegment)) {
    const strippedPathname = restSegments.length ? `/${restSegments.join('/')}` : '/';

    return {
      locale: firstSegment,
      pathname: strippedPathname,
      hadPrefix: true,
    };
  }

  return {
    locale: DEFAULT_LOCALE,
    pathname: normalizedPathname || '/',
    hadPrefix: false,
  };
}

/** Strip an optional locale prefix from a path (ignores query/hash). */
export function stripLocaleFromPath(pathname: string) {
  const hashIndex = pathname.indexOf('#');
  const queryIndex = pathname.indexOf('?');
  const pathEnd = Math.min(
    queryIndex >= 0 ? queryIndex : pathname.length,
    hashIndex >= 0 ? hashIndex : pathname.length,
  );
  const pathOnly = pathname.slice(0, pathEnd);
  const suffix = pathname.slice(pathEnd);
  const { pathname: stripped } = parseLocaleFromPathname(pathOnly);

  return `${stripped}${suffix}`;
}

/**
 * Prefix internal paths with the active locale.
 * - Default locale (en): no prefix — bare path means English.
 * - Other locales: `/de/...`, `/es/...`
 * Idempotent: strips an existing locale prefix before applying the target locale.
 */
export function withLocalePath(pathname: string, locale: Locale) {
  if (!pathname.startsWith('/') || pathname.startsWith('//')) {
    return pathname;
  }

  const normalized = stripLocaleFromPath(pathname);
  const barePath = normalized.split('?')[0].split('#')[0];

  // Static assets (e.g. /downloads/file.txt) are served without locale routing.
  if (/\.[a-z0-9]{2,8}$/i.test(barePath)) {
    return normalized;
  }

  if (normalized === '/') {
    return locale === DEFAULT_LOCALE ? '/' : `/${locale}`;
  }

  return locale === DEFAULT_LOCALE ? normalized : `/${locale}${normalized}`;
}

export function toPreferenceCookie(name: string, value: string, maxAge = PREFERENCE_COOKIE_MAX_AGE) {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

/** Read active locale from the browser cookie (client components / apiFetch). */
export function readClientLocaleCookie(): Locale | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const entry = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${LOCALE_COOKIE_NAME}=`));

  if (!entry) {
    return undefined;
  }

  return normalizeLocale(decodeURIComponent(entry.slice(LOCALE_COOKIE_NAME.length + 1)));
}
