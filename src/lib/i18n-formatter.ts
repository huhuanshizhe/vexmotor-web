/**
 * Enhanced i18n utilities with message formatting and pluralization
 * Similar to next-intl functionality but using our existing translation system
 */

import { SUPPORTED_LOCALES, type Locale, DEFAULT_LOCALE } from '@/lib/i18n';
import { getRegistryDefault } from '@/ui-strings/registry';
import enTranslations from '@/locales/en.json';

type TranslationObject = Record<string, any>;
type TranslationParams = Record<string, string | number | boolean>;

function getNestedValue(obj: TranslationObject, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function resolveEnglishTemplate(key: string): string | undefined {
  const fromEn = getNestedValue(enTranslations, key);
  if (typeof fromEn === 'string') {
    return fromEn;
  }
  return getRegistryDefault(key);
}

/**
 * Pluralization rules for supported locales
 */
const pluralRules: Record<Locale, (count: number) => 'zero' | 'one' | 'two' | 'few' | 'many' | 'other'> = {
  en: (count) => {
    if (count === 0) return 'zero';
    if (count === 1) return 'one';
    return 'other';
  },
  de: (count) => {
    if (count === 0) return 'zero';
    if (count === 1) return 'one';
    return 'other';
  },
  es: (count) => {
    if (count === 0) return 'zero';
    if (count === 1) return 'one';
    return 'other';
  },
};

/**
 * Format number according to locale
 */
export function formatNumber(value: number, locale: Locale, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : locale, options).format(value);
}

/**
 * Format currency according to locale
 */
export function formatCurrency(value: number, currency: string, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format date according to locale
 */
export function formatDate(date: Date | string, locale: Locale, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : locale, options).format(dateObj);
}

/**
 * Handle pluralization in translations
 * Supports: {count, plural, one {item} other {items}}
 */
export function handlePluralization(
  template: string,
  count: number,
  locale: Locale,
  params?: TranslationParams
): string {
  const pluralForm = pluralRules[locale](count);
  
  const pluralRegex = /\{(\w+),\s*plural,\s*(.+?)\}/g;
  
  return template.replace(pluralRegex, (match, param, forms) => {
    if (param !== 'count') return match;
    
    const formRegex = /(zero|one|two|few|many|other)\s*\{([^}]*)\}/g;
    let result: string | null = null;
    
    let formMatch;
    while ((formMatch = formRegex.exec(forms)) !== null) {
      if (formMatch[1] === pluralForm) {
        result = formMatch[2];
        break;
      }
      if (formMatch[1] === 'other') {
        result = formMatch[2];
      }
    }
    
    if (!result) return match;
    
    return result.replace(/\{count\}/g, String(count));
  });
}

/**
 * Rich text formatting in translations
 * Supports: <b>bold</b>, <i>italic</i>, <link>...</link>
 */
export function formatRichText(
  template: string,
  params?: TranslationParams,
  components?: Record<string, React.ComponentType<any>>
): string | React.ReactNode {
  if (!components) {
    return interpolateString(template, params);
  }
  
  let result = interpolateString(template, params);
  result = result.replace(/<b>(.*?)<\/b>/g, '<strong>$1</strong>');
  result = result.replace(/<i>(.*?)<\/i>/g, '<em>$1</em>');
  
  return result;
}

function interpolateString(template: string, params?: TranslationParams): string {
  if (!params) return template;
  
  return Object.entries(params).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }, template);
}

/**
 * Enhanced translation function with formatting support
 */
export function t(
  key: string,
  options: {
    locale?: Locale;
    params?: TranslationParams;
    count?: number;
    defaultValue?: string;
  } = {}
): string {
  const { locale = DEFAULT_LOCALE, params, count, defaultValue } = options;
  
  let template = resolveEnglishTemplate(key);
  
  if (!template) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Translation key not found: "${key}" for locale "${locale}"`);
    }
    return defaultValue || key;
  }
  
  if (count !== undefined) {
    template = handlePluralization(template, count, locale, params);
  }
  
  return interpolateString(template, params);
}

/**
 * Get English defaults (in-repo source for registry sync)
 */
export function getTranslationsForLocale(_locale: Locale): TranslationObject {
  return enTranslations as TranslationObject;
}

/**
 * Check if translation key exists
 */
export function hasTranslation(key: string): boolean {
  return resolveEnglishTemplate(key) !== undefined;
}

/**
 * Get available locales
 */
export function getAvailableLocales() {
  return [...SUPPORTED_LOCALES];
}
