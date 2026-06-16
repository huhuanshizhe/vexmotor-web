import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { type Locale, CURRENCY_COOKIE_NAME, DEFAULT_LOCALE, LOCALE_COOKIE_NAME, LOCALE_REQUEST_HEADER, SUPPORTED_LOCALES, UNIT_SYSTEM_COOKIE_NAME, getMarketDefaults, normalizeCurrency, normalizeUnitSystem, parseLocaleFromPathname } from '@/lib/i18n';

function parseAcceptLanguage(header: string | null): string | null {
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
      if ((SUPPORTED_LOCALES as readonly string[]).includes(code)) return code;
    }
    return null;
  } catch {
    return null;
  }
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { locale: urlLocale, pathname: normalizedPathname, hadPrefix } = parseLocaleFromPathname(pathname);

  const hasCookie = Boolean(request.cookies.get(LOCALE_COOKIE_NAME)?.value);
  const detectedLocale = (!hadPrefix && !hasCookie) ? parseAcceptLanguage(request.headers.get('accept-language')) : null;
  const locale = (detectedLocale ?? urlLocale) as Locale;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_REQUEST_HEADER, locale);

  const syncPreferenceCookies = (response: NextResponse) => {
    const localeDefaults = getMarketDefaults(locale);
    const currentCurrency = normalizeCurrency(request.cookies.get(CURRENCY_COOKIE_NAME)?.value);
    const currentUnitSystem = normalizeUnitSystem(request.cookies.get(UNIT_SYSTEM_COOKIE_NAME)?.value);

    response.cookies.set(LOCALE_COOKIE_NAME, locale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });

    if (!currentCurrency) {
      response.cookies.set(CURRENCY_COOKIE_NAME, localeDefaults.currency, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
    }

    if (!currentUnitSystem) {
      response.cookies.set(UNIT_SYSTEM_COOKIE_NAME, localeDefaults.unitSystem, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
    }
  };

  const response = hadPrefix
    ? NextResponse.rewrite(new URL(normalizedPathname === '/' ? '/' : normalizedPathname, request.url), {
        request: {
          headers: requestHeaders,
        },
      })
    : NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });

  if (!request.cookies.get(LOCALE_COOKIE_NAME)?.value && DEFAULT_LOCALE === locale) {
    response.cookies.set(LOCALE_COOKIE_NAME, DEFAULT_LOCALE, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
  }

  syncPreferenceCookies(response);
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
