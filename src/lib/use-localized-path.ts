'use client';

import { useCallback } from 'react';

import { withLocalePath } from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n-context';

/** Returns a function that prefixes internal paths with the active locale. */
export function useLocalizedPath() {
  const { locale } = useTranslation();

  return useCallback((path: string) => withLocalePath(path, locale), [locale]);
}
