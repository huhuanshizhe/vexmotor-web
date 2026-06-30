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

export async function fetchGeoCountries(continent?: string) {
  const query = continent ? `?continent=${encodeURIComponent(continent)}` : '';
  const response = await apiFetch<{ items: GeoCountry[] }>(`/api/front/geo/countries${query}`);
  return response.items;
}

export async function fetchGeoDivisions(countryIso: string, parentId?: string | null) {
  const params = new URLSearchParams({ country: countryIso });
  if (parentId) {
    params.set('parentId', parentId);
  }
  const response = await apiFetch<{ items: GeoDivision[] }>(`/api/front/geo/divisions?${params.toString()}`);
  return response.items;
}
