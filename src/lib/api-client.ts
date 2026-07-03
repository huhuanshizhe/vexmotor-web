import { LOCALE_COOKIE_NAME, LOCALE_REQUEST_HEADER, normalizeLocale } from '@/lib/i18n';

const ACCESS_TOKEN_KEY = 'vex_front_token';
const CART_TOKEN_KEY = 'vex_cart_token';

function readLocaleCookie(): string | undefined {
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

export const AUTH_TOKEN_CHANGED_EVENT = 'vex-auth-token-changed';

function notifyAuthTokenChanged(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new Event(AUTH_TOKEN_CHANGED_EVENT));
}

export function getApiBaseUrl(): string {
  const url = process.env.API_URL?.trim();
  if (!url) {
    throw new Error('API_URL is not configured');
  }

  return url;
}

function joinUrl(path: string): string {
  const base = getApiBaseUrl().replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchFromApi(path: string, init?: RequestInit): Promise<Response> {
  const url = joinUrl(path);
  const maxAttempts = process.env.NODE_ENV === 'development' ? 3 : 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch(url, init);
    if (response.ok || response.status < 500 || attempt === maxAttempts) {
      return response;
    }

    await sleep(attempt * 750);
  }

  throw new Error(`Request failed after ${maxAttempts} attempts: ${url}`);
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  notifyAuthTokenChanged();
}

export function clearAccessToken(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  notifyAuthTokenChanged();
}

export function getCartToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem(CART_TOKEN_KEY);
}

export function setCartToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(CART_TOKEN_KEY, token);
}

type FetchOptions = RequestInit & {
  locale?: string;
};

async function parseJsonResponse<T>(response: Response, requestUrl?: string): Promise<T> {
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload && typeof payload === 'object' && 'message' in payload ? String(payload.message) : response.statusText;
    const target = requestUrl ? ` ${requestUrl}` : '';
    throw new Error(message ? `${message} (${response.status})${target}` : `Request failed (${response.status})${target}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function buildHeaders(init?: FetchOptions, includeAuth = false): Headers {
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type') && init?.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (init?.locale) {
    headers.set(LOCALE_REQUEST_HEADER, init.locale);
  } else {
    const cookieLocale = readLocaleCookie();
    if (cookieLocale) {
      headers.set(LOCALE_REQUEST_HEADER, cookieLocale);
    }
  }
  if (includeAuth && typeof window !== 'undefined') {
    const token = getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    const cartToken = getCartToken();
    if (cartToken) {
      headers.set('X-Cart-Token', cartToken);
    }
  }
  return headers;
}

export async function serverFetch<T>(path: string, init?: FetchOptions): Promise<T> {
  const { locale, ...requestInit } = init ?? {};
  const headers = new Headers(requestInit.headers);

  if (locale) {
    headers.set(LOCALE_REQUEST_HEADER, locale);
  } else {
    try {
      const { headers: nextHeaders } = await import('next/headers');
      const headerStore = await nextHeaders();
      const requestLocale = headerStore.get(LOCALE_REQUEST_HEADER);
      if (requestLocale) {
        headers.set(LOCALE_REQUEST_HEADER, requestLocale);
      }
    } catch {
      // Not in a server context.
    }
  }

  const url = joinUrl(path);
  const response = await fetchFromApi(path, {
    ...requestInit,
    headers,
    next: process.env.NODE_ENV === 'development' ? undefined : { revalidate: 60 },
    cache: process.env.NODE_ENV === 'development' ? 'no-store' : undefined,
    signal: process.env.NODE_ENV === 'development' ? AbortSignal.timeout(45_000) : requestInit.signal,
  });

  return parseJsonResponse<T>(response, url);
}

function applyCartApiPayload(payload: unknown) {
  if (!payload || typeof payload !== 'object' || typeof window === 'undefined') {
    return;
  }

  const cartToken = 'cartToken' in payload ? payload.cartToken : undefined;
  if (typeof cartToken === 'string' && cartToken.length > 0) {
    setCartToken(cartToken);
  }
}

export async function apiFetch<T>(path: string, init?: FetchOptions): Promise<T> {
  const { locale, ...requestInit } = init ?? {};
  const url = joinUrl(path);
  const response = await fetch(url, {
    ...requestInit,
    headers: buildHeaders({ ...requestInit, locale }, true),
    cache: requestInit.cache ?? 'no-store',
  });

  const data = await parseJsonResponse<T>(response, url);
  if (path.includes('/api/front/cart')) {
    applyCartApiPayload(data);
  }

  return data;
}

export async function apiUploadForm<T>(path: string, formData: FormData, init?: FetchOptions): Promise<T> {
  const { locale, ...requestInit } = init ?? {};
  const headers = new Headers(requestInit.headers);
  if (locale) {
    headers.set(LOCALE_REQUEST_HEADER, locale);
  } else {
    const cookieLocale = readLocaleCookie();
    if (cookieLocale) {
      headers.set(LOCALE_REQUEST_HEADER, cookieLocale);
    }
  }

  const url = joinUrl(path);
  const response = await fetch(url, {
    ...requestInit,
    method: requestInit.method ?? 'POST',
    body: formData,
    headers,
    cache: 'no-store',
  });

  return parseJsonResponse<T>(response, url);
}
