import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import {
  type Locale,
  CURRENCY_COOKIE_NAME,
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  LOCALE_REQUEST_HEADER,
  UNIT_SYSTEM_COOKIE_NAME,
  getMarketDefaults,
  parseLocaleFromPathname,
  resolveRequestLocale,
} from '@/lib/i18n';

function attachPreferenceCookies(response: NextResponse, locale: Locale) {
  const localeDefaults = getMarketDefaults(locale);

  response.cookies.set(LOCALE_COOKIE_NAME, locale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
  response.cookies.set(CURRENCY_COOKIE_NAME, localeDefaults.currency, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
  response.cookies.set(UNIT_SYSTEM_COOKIE_NAME, localeDefaults.unitSystem, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const parsed = parseLocaleFromPathname(pathname);

  // /en or /en/* → canonical default-locale URL without prefix (/xxx).
  if (parsed.hadPrefix && parsed.locale === DEFAULT_LOCALE) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = parsed.pathname;
    const response = NextResponse.redirect(redirectUrl, 308);
    attachPreferenceCookies(response, DEFAULT_LOCALE);
    return response;
  }

  const cookieLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  const locale = resolveRequestLocale({
    pathname,
    cookieLocale,
    acceptLanguage: request.headers.get('accept-language'),
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_REQUEST_HEADER, locale);

  const response = parsed.hadPrefix
    ? NextResponse.rewrite(new URL(parsed.pathname === '/' ? '/' : parsed.pathname, request.url), {
        request: {
          headers: requestHeaders,
        },
      })
    : NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });

  attachPreferenceCookies(response, locale);
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
