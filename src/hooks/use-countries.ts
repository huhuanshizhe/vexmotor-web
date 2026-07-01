'use client';

import { useEffect, useState } from 'react';

import {
  fetchGeoCountries,
  getCountryLabel,
  type GeoCountry,
} from '@/lib/geo-api';

let cachedItems: GeoCountry[] | null = null;

export function useCountries() {
  const [items, setItems] = useState<GeoCountry[]>(cachedItems ?? []);
  const [loading, setLoading] = useState(!cachedItems);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchGeoCountries()
      .then((list) => {
        if (!cancelled) {
          cachedItems = list;
          setItems(list);
          setError(null);
        }
      })
      .catch((fetchError) => {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : 'Unable to load countries');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    items,
    loading,
    error,
    getLabel: (value: string | null | undefined) => getCountryLabel(items, value),
  };
}
