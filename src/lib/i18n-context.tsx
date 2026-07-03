'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import {
  type Locale,
  DEFAULT_LOCALE,
  getMarketDefaults,
  LOCALE_COOKIE_NAME,
  CURRENCY_COOKIE_NAME,
  UNIT_SYSTEM_COOKIE_NAME,
  PREFERENCE_COOKIE_MAX_AGE,
} from '@/lib/i18n';
import { resolveLocalePathForSwitch } from '@/lib/locale-path';
import { getRegistryDefault } from '@/ui-strings/registry';

// Import English defaults only — de/es translations come from Admin ui_string_translations via API.
import enTranslations from '@/locales/en.json';

// Translation type
type TranslationValue = string | number | boolean;
type TranslationParams = Record<string, TranslationValue>;
type TranslationObject = Record<string, any>;

// All translations map — English file is the in-repo fallback; other locales use API uiStrings.
const enDefaults = enTranslations as TranslationObject;

function resolveEnglishTemplate(key: string): string | undefined {
  const template = getNestedValue(enDefaults, key);
  if (typeof template === 'string') {
    return template;
  }
  return getRegistryDefault(key);
}

// Context type
type I18nContextType = {
  locale: Locale;
  t: (key: string, params?: TranslationParams) => string;
  setLocale: (locale: Locale) => void;
  isLocaleSwitching: boolean;
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
  initialLocale = DEFAULT_LOCALE,
  initialUiStrings = {},
}: { 
  children: ReactNode;
  initialLocale?: Locale;
  initialUiStrings?: Record<string, string>;
}) {
  const pathname = usePathname();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [uiStrings, setUiStrings] = useState(initialUiStrings);
  const [isLocaleSwitching, setIsLocaleSwitching] = useState(false);

  useEffect(() => {
    setLocaleState(initialLocale);
  }, [initialLocale]);

  useEffect(() => {
    setUiStrings(initialUiStrings);
  }, [initialUiStrings]);

  const t = useCallback((key: string, params?: TranslationParams): string => {
    const fromRuntime = uiStrings[key];
    if (typeof fromRuntime === 'string' && fromRuntime.length > 0) {
      return interpolateString(fromRuntime, params);
    }

    const template = resolveEnglishTemplate(key);

    if (template) {
      return interpolateString(template, params);
    }

    // Fallback: return key if translation not found
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Translation key not found: "${key}" for locale "${locale}"`);
    }

    return key;
  }, [locale, uiStrings]);

  const setLocale = useCallback((newLocale: Locale) => {
    if (newLocale === locale || isLocaleSwitching) {
      return;
    }

    setIsLocaleSwitching(true);

    const defaults = getMarketDefaults(newLocale);

    document.cookie = `${LOCALE_COOKIE_NAME}=${newLocale}; Path=/; Max-Age=${PREFERENCE_COOKIE_MAX_AGE}; SameSite=Lax`;
    document.cookie = `${CURRENCY_COOKIE_NAME}=${defaults.currency}; Path=/; Max-Age=${PREFERENCE_COOKIE_MAX_AGE}; SameSite=Lax`;
    document.cookie = `${UNIT_SYSTEM_COOKIE_NAME}=${defaults.unitSystem}; Path=/; Max-Age=${PREFERENCE_COOKIE_MAX_AGE}; SameSite=Lax`;
    document.body.dataset.currency = defaults.currency;
    document.body.dataset.unitSystem = defaults.unitSystem;

    void resolveLocalePathForSwitch(pathname, newLocale)
      .then((newPath) => {
        window.location.assign(newPath);
      })
      .catch(() => {
        setIsLocaleSwitching(false);
      });
  }, [isLocaleSwitching, locale, pathname]);

  return (
    <I18nContext.Provider value={{ locale, t, setLocale, isLocaleSwitching }}>
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
      const template = resolveEnglishTemplate(key);

      if (template) {
        return interpolateString(template, params);
      }

      return key;
    },
    locale,
  };
}

// Export available locales for UI (legacy)
export { LOCALE_MARKET_OPTIONS as AVAILABLE_LOCALES } from '@/lib/i18n';
