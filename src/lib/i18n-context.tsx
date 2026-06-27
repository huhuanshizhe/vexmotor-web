'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  type Locale,
  DEFAULT_LOCALE,
  withLocalePath,
  parseLocaleFromPathname,
  getMarketDefaults,
  LOCALE_COOKIE_NAME,
  CURRENCY_COOKIE_NAME,
  UNIT_SYSTEM_COOKIE_NAME,
  PREFERENCE_COOKIE_MAX_AGE,
} from '@/lib/i18n';

// Import translations
import enTranslations from '@/locales/en.json';
import deTranslations from '@/locales/de.json';
import esTranslations from '@/locales/es.json';

// Translation type
type TranslationValue = string | number | boolean;
type TranslationParams = Record<string, TranslationValue>;
type TranslationObject = Record<string, any>;

// All translations map
const translations: Record<Locale, TranslationObject> = {
  en: enTranslations,
  de: deTranslations,
  es: esTranslations,
};

// Context type
type I18nContextType = {
  locale: Locale;
  t: (key: string, params?: TranslationParams) => string;
  setLocale: (locale: Locale) => void;
};

// Create context
const I18nContext = createContext<I18nContextType | null>(null);

// Helper: Get nested value from object using dot notation
function getNestedValue(obj: TranslationObject, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current?.[key];
  }, obj);
}

// Helper: Interpolate params into string
function interpolateString(template: string, params?: TranslationParams): string {
  if (!params) return template;
  
  return Object.entries(params).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }, template);
}

// Provider component
export function I18nProvider({ 
  children, 
  initialLocale = DEFAULT_LOCALE 
}: { 
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const t = useCallback((key: string, params?: TranslationParams): string => {
    const translationObj = translations[locale] || translations[DEFAULT_LOCALE];
    const template = getNestedValue(translationObj, key);

    if (typeof template === 'string') {
      return interpolateString(template, params);
    }

    // Fallback: return key if translation not found
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Translation key not found: "${key}" for locale "${locale}"`);
    }

    return key;
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    const defaults = getMarketDefaults(newLocale);

    setLocaleState(newLocale);
    document.cookie = `${LOCALE_COOKIE_NAME}=${newLocale}; Path=/; Max-Age=${PREFERENCE_COOKIE_MAX_AGE}; SameSite=Lax`;
    document.cookie = `${CURRENCY_COOKIE_NAME}=${defaults.currency}; Path=/; Max-Age=${PREFERENCE_COOKIE_MAX_AGE}; SameSite=Lax`;
    document.cookie = `${UNIT_SYSTEM_COOKIE_NAME}=${defaults.unitSystem}; Path=/; Max-Age=${PREFERENCE_COOKIE_MAX_AGE}; SameSite=Lax`;
    document.body.dataset.currency = defaults.currency;
    document.body.dataset.unitSystem = defaults.unitSystem;

    const strippedPath = parseLocaleFromPathname(pathname).pathname;
    const newPath = withLocalePath(strippedPath, newLocale);

    if (newPath !== pathname) {
      router.push(newPath);
    } else {
      router.refresh();
    }
  }, [router, pathname]);

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

// Hook to use translations
export function useTranslation() {
  const context = useContext(I18nContext);
  
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  
  return context;
}

// Server-side translation helper (for Server Components)
export function getTranslations(locale: Locale = DEFAULT_LOCALE) {
  return {
    t: (key: string, params?: TranslationParams): string => {
      const translationObj = translations[locale] || translations[DEFAULT_LOCALE];
      const template = getNestedValue(translationObj, key);
      
      if (typeof template === 'string') {
        return interpolateString(template, params);
      }
      
      return key;
    },
    locale,
  };
}

// Export available locales for UI (legacy)
export { LOCALE_MARKET_OPTIONS as AVAILABLE_LOCALES } from '@/lib/i18n';
