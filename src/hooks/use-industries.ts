'use client';

import { useEffect, useState } from 'react';

import {
  fetchIndustries,
  getIndustryLabel,
  type IndustryOption,
} from '@/lib/industries-api';

export function useIndustries() {
  const [items, setItems] = useState<IndustryOption[]>(cachedItems ?? []);
  const [loading, setLoading] = useState(!cachedItems);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchIndustries()
      .then((list) => {
        if (!cancelled) {
          cachedItems = list;
          setItems(list);
          setError(null);
        }
      })
      .catch((fetchError) => {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : 'Unable to load industries');
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
    getLabel: (value: string | null | undefined) => getIndustryLabel(items, value),
  };
}

let cachedItems: IndustryOption[] | null = null;
