import { redirect } from 'next/navigation';

import { getApiBaseUrl, serverFetch } from '@/lib/api-client';
import { type Locale, stripLocaleFromPath, withLocalePath } from '@/lib/i18n';

type LocalePathResponse = {
  path?: string;
};

export function pathWithoutQueryHash(path: string) {
  return path.split('?')[0].split('#')[0];
}

export async function resolveLocalizedPathServer(pathname: string, locale: Locale): Promise<string | null> {
  try {
    const params = new URLSearchParams({ pathname, to: locale });
    const result = await serverFetch<LocalePathResponse>(`/api/front/locale-path?${params.toString()}`);
    return result.path ?? null;
  } catch {
    return null;
  }
}

/** Server-side redirect when URL slug belongs to another locale. */
export async function redirectToCanonicalPathIfNeeded(pathname: string, locale: Locale) {
  const resolved = await resolveLocalizedPathServer(pathname, locale);
  if (!resolved) return;
  if (pathWithoutQueryHash(resolved) !== pathWithoutQueryHash(pathname)) {
    redirect(withLocalePath(resolved, locale));
  }
}

/** Resolve slug-based paths to the target locale before switching language (client). */
export async function resolveLocalePathForSwitch(fullPathname: string, targetLocale: Locale): Promise<string> {
  const strippedPath = stripLocaleFromPath(fullPathname);

  try {
    const base = getApiBaseUrl().replace(/\/+$/, '');
    const params = new URLSearchParams({
      pathname: strippedPath,
      to: targetLocale,
    });
    const response = await fetch(`${base}/api/front/locale-path?${params.toString()}`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`locale-path ${response.status}`);
    }

    const payload = (await response.json()) as LocalePathResponse;
    if (!payload.path) {
      throw new Error('locale-path missing path');
    }

    return withLocalePath(payload.path, targetLocale);
  } catch {
    return withLocalePath(strippedPath, targetLocale);
  }
}
