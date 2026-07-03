import { unstable_cache } from 'next/cache';

import { getApiBaseUrl } from '@/lib/api-client';

export const UI_STRINGS_CACHE_TAG = 'ui-strings';

/** Dev: 30s. Production: 1h (admin save also triggers tag revalidation). */
const UI_STRINGS_REVALIDATE_SECONDS =
  process.env.NODE_ENV === 'development' ? 30 : 60 * 60;

type FetchUiStringsOptions = {
  locale: string;
  keys?: string[];
  groups?: string[];
};

type UiStringsResponse = {
  locale: string;
  strings: Record<string, string>;
};

function buildCacheKey(options: FetchUiStringsOptions) {
  const keys = options.keys?.slice().sort().join(',') ?? '';
  const groups = options.groups?.slice().sort().join(',') ?? '';
  return `${options.locale}|k:${keys}|g:${groups}`;
}

async function fetchUiStringsFromApi(options: FetchUiStringsOptions): Promise<Record<string, string>> {
  const params = new URLSearchParams({ locale: options.locale });
  if (options.keys?.length) {
    params.set('keys', options.keys.join(','));
  }
  if (options.groups?.length) {
    params.set('groups', options.groups.join(','));
  }

  const base = getApiBaseUrl().replace(/\/+$/, '');
  const response = await fetch(`${base}/api/front/ui-strings?${params.toString()}`, {
    next: { revalidate: UI_STRINGS_REVALIDATE_SECONDS, tags: [UI_STRINGS_CACHE_TAG] },
  });

  if (!response.ok) {
    return {};
  }

  const payload = (await response.json()) as UiStringsResponse;
  return payload.strings ?? {};
}

export async function fetchUiStrings(options: FetchUiStringsOptions): Promise<Record<string, string>> {
  const cacheKey = buildCacheKey(options);

  return unstable_cache(
    async () => fetchUiStringsFromApi(options),
    ['ui-strings', cacheKey],
    { revalidate: UI_STRINGS_REVALIDATE_SECONDS, tags: [UI_STRINGS_CACHE_TAG] },
  )();
}

export async function fetchUiStringGroups(locale: string, groups: string[]) {
  return fetchUiStrings({ locale, groups });
}
