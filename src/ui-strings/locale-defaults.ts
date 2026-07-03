import deDefaults from '@/ui-strings/locale-defaults/de.json';
import esDefaults from '@/ui-strings/locale-defaults/es.json';

import type { Locale } from '@/lib/i18n';

type NestedRecord = Record<string, unknown>;

function flattenTranslations(obj: NestedRecord, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenTranslations(value as NestedRecord, fullKey));
    } else if (typeof value === 'string') {
      result[fullKey] = value;
    }
  }

  return result;
}

const LOCALE_DEFAULTS: Partial<Record<Locale, Record<string, string>>> = {
  de: flattenTranslations(deDefaults as NestedRecord),
  es: flattenTranslations(esDefaults as NestedRecord),
};

export function getUiStringLocaleDefault(locale: Locale, key: string): string | undefined {
  return LOCALE_DEFAULTS[locale]?.[key];
}
