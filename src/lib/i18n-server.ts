import { cookies, headers } from 'next/headers';

import { redirect } from 'next/navigation';

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  LOCALE_REQUEST_HEADER,
  getMarketDefaults,
  normalizeLocale,
  withLocalePath,
  type Locale,
  type SitePreferences,
} from '@/lib/i18n';
import { getRegistryDefault } from '@/ui-strings/registry';

import enTranslations from '@/locales/en.json';

type TranslationObject = Record<string, any>;
type TranslationParams = Record<string, string | number | boolean>;

function getNestedValue(obj: TranslationObject, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function interpolateString(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return Object.entries(params).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }, template);
}

function resolveEnglishTemplate(key: string): string | undefined {
  const fromEn = getNestedValue(enTranslations, key);
  if (typeof fromEn === 'string') {
    return fromEn;
  }
  return getRegistryDefault(key);
}

/**
 * Server-side translation helper — safe to use in Server Components.
 * Resolution order: API uiStrings → en.json / registry English defaults.
 */
export function getServerTranslations(locale: Locale = DEFAULT_LOCALE, uiStrings: Record<string, string> = {}) {
  return {
    t: (key: string, params?: TranslationParams): string => {
      const fromRuntime = uiStrings[key];
      if (typeof fromRuntime === 'string' && fromRuntime.length > 0) {
        return interpolateString(fromRuntime, params);
      }

      const template = resolveEnglishTemplate(key);
      if (template) {
        return interpolateString(template, params);
      }

      return key;
    },
    locale,
  };
}

export async function getServerSitePreferences(): Promise<SitePreferences> {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const locale = normalizeLocale(headerStore.get(LOCALE_REQUEST_HEADER) ?? cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const defaults = getMarketDefaults(locale);

  return {
    locale,
    currency: defaults.currency,
    unitSystem: defaults.unitSystem,
  };
}

/** Server redirect that preserves the active locale in the target path. */
export async function redirectLocalized(path: string): Promise<never> {
  const { locale } = await getServerSitePreferences();
  redirect(withLocalePath(path, locale));
}
