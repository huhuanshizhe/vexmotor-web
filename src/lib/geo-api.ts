import { apiFetch } from '@/lib/api-client';

export type GeoCountry = {
  id: string;
  code: string;
  isoAlpha2: string;
  isoAlpha3: string | null;
  continentCode: string;
  nameEn: string;
  nameZh: string | null;
  label: string;
};

export type GeoDivision = {
  id: string;
  code: string;
  level: string;
  nameEn: string;
  nameZh: string | null;
  label: string;
};

let cachedCountries: GeoCountry[] | null = null;
let countriesPromise: Promise<GeoCountry[]> | null = null;

export async function fetchGeoCountries(continent?: string) {
  if (!continent && cachedCountries) {
    return cachedCountries;
  }

  const query = continent ? `?continent=${encodeURIComponent(continent)}` : '';
  if (!continent && countriesPromise) {
    return countriesPromise;
  }

  const request = apiFetch<{ items: GeoCountry[] }>(`/api/front/geo/countries${query}`)
    .then((response) => {
      if (!continent) {
        cachedCountries = response.items;
      }
      return response.items;
    })
    .catch((error) => {
      if (!continent) {
        countriesPromise = null;
      }
      throw error;
    });

  if (!continent) {
    countriesPromise = request;
  }

  return request;
}

export async function fetchGeoDivisions(countryIso: string, parentId?: string | null) {
  const params = new URLSearchParams({ country: countryIso });
  if (parentId) {
    params.set('parentId', parentId);
  }
  const response = await apiFetch<{ items: GeoDivision[] }>(`/api/front/geo/divisions?${params.toString()}`);
  return response.items;
}

export function getCountryLabel(items: GeoCountry[], value: string | null | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    return '—';
  }

  const byIso = items.find((item) => item.isoAlpha2.toUpperCase() === trimmed.toUpperCase());
  if (byIso) {
    return byIso.nameEn;
  }

  const byName = items.find((item) => item.nameEn.toLowerCase() === trimmed.toLowerCase());
  return byName?.nameEn ?? trimmed;
}

export function resolveCountryCode(items: GeoCountry[], value: string | null | undefined): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    return '';
  }

  const byIso = items.find((item) => item.isoAlpha2.toUpperCase() === trimmed.toUpperCase());
  if (byIso) {
    return byIso.isoAlpha2;
  }

  const byName = items.find((item) => item.nameEn.toLowerCase() === trimmed.toLowerCase());
  if (byName) {
    return byName.isoAlpha2;
  }

  return trimmed;
}
