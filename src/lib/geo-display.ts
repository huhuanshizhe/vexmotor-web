import type { GeoCountry, GeoDivision } from '@/lib/geo-api';

export function formatGeoCountryOption(country: Pick<GeoCountry, 'isoAlpha2' | 'nameEn'>) {
  return `${country.isoAlpha2} — ${country.nameEn}`;
}

export function formatGeoDivisionOption(division: Pick<GeoDivision, 'nameEn'>) {
  return division.nameEn;
}
