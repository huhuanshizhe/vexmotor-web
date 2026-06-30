const ACCESS_TOKEN_KEY = 'vex_front_token';
const CART_TOKEN_KEY = 'vex_cart_token';

export const AUTH_TOKEN_CHANGED_EVENT = 'vex-auth-token-changed';

function notifyAuthTokenChanged(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new Event(AUTH_TOKEN_CHANGED_EVENT));
}

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5100';
}

function joinUrl(path: string): string {
  const base = getApiBaseUrl().replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
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

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload && typeof payload === 'object' && 'message' in payload ? String(payload.message) : response.statusText;
    throw new Error(message || `Request failed (${response.status})`);
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
    headers.set('x-vex-locale', init.locale);
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
    headers.set('x-vex-locale', locale);
  } else {
    try {
      const { headers: nextHeaders } = await import('next/headers');
      const headerStore = await nextHeaders();
      const requestLocale = headerStore.get('x-vex-locale');
      if (requestLocale) {
        headers.set('x-vex-locale', requestLocale);
      }
    } catch {
      // Not in a server context.
    }
  }

  const response = await fetch(joinUrl(path), {
    ...requestInit,
    headers,
    next: process.env.NODE_ENV === 'development' ? undefined : { revalidate: 60 },
    cache: process.env.NODE_ENV === 'development' ? 'no-store' : undefined,
    signal: process.env.NODE_ENV === 'development' ? AbortSignal.timeout(15_000) : requestInit.signal,
  });

  return parseJsonResponse<T>(response);
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
  const response = await fetch(joinUrl(path), {
    ...requestInit,
    headers: buildHeaders({ ...requestInit, locale }, true),
    cache: requestInit.cache ?? 'no-store',
  });

  const data = await parseJsonResponse<T>(response);
  if (path.includes('/api/front/cart')) {
    applyCartApiPayload(data);
  }

  return data;
}

export async function apiUploadForm<T>(path: string, formData: FormData, init?: FetchOptions): Promise<T> {
  const { locale, ...requestInit } = init ?? {};
  const headers = new Headers(requestInit.headers);
  if (locale) {
    headers.set('x-vex-locale', locale);
  }

  const response = await fetch(joinUrl(path), {
    ...requestInit,
    method: requestInit.method ?? 'POST',
    body: formData,
    headers,
    cache: 'no-store',
  });

  return parseJsonResponse<T>(response);
}
