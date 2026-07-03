'use client';

import { useEffect, useRef, useState } from 'react';

import { useTranslation } from '@/lib/i18n-context';
import { LOCALE_MARKET_OPTIONS, type Locale } from '@/lib/i18n';
import { getApiBaseUrl } from '@/lib/api-client';

function GlobeIcon() {
  return (
    <svg className="locale-switcher-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 12h18" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 3c2.5 3 3.8 6 3.8 9s-1.3 6-3.8 9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 3c-2.5 3-3.8 6-3.8 9s1.3 6 3.8 9" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg className={`locale-switcher-chevron${open ? ' is-open' : ''}`} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LocaleSwitcherSpinner() {
  return <span className="locale-switcher-spinner" aria-hidden="true" />;
}

export function LanguageSwitcher() {
  const { locale, setLocale, isLocaleSwitching, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [localeOptions, setLocaleOptions] = useState(LOCALE_MARKET_OPTIONS);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = localeOptions.find((item) => item.code === locale) ?? localeOptions[0] ?? LOCALE_MARKET_OPTIONS[0];

  useEffect(() => {
    let cancelled = false;

    async function loadActiveLocales() {
      try {
        const base = getApiBaseUrl().replace(/\/+$/, '');
        const response = await fetch(`${base}/api/front/languages`, { cache: 'no-store' });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          languages?: Array<{ code: string; status?: string }>;
        };
        const activeCodes = new Set(
          (payload.languages ?? [])
            .filter((item) => item.status !== 'inactive')
            .map((item) => item.code),
        );
        if (!activeCodes.size || cancelled) return;
        setLocaleOptions(LOCALE_MARKET_OPTIONS.filter((item) => activeCodes.has(item.code)));
      } catch {
        // Keep static fallback options when API is unavailable.
      }
    }

    void loadActiveLocales();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleSelect = (nextLocale: Locale) => {
    setIsOpen(false);
    if (nextLocale !== locale) {
      setLocale(nextLocale);
    }
  };

  const triggerLabel = isLocaleSwitching ? t('common.loading') : current.label;

  return (
    <div className={`locale-switcher${isLocaleSwitching ? ' is-switching' : ''}`} ref={rootRef}>
      <button
        type="button"
        className={`locale-switcher-trigger${isLocaleSwitching ? ' is-loading' : ''}`}
        onClick={() => {
          if (!isLocaleSwitching) {
            setIsOpen((value) => !value);
          }
        }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-busy={isLocaleSwitching}
        aria-label={isLocaleSwitching ? t('common.loading') : t('header.selectLanguage')}
        disabled={isLocaleSwitching}
      >
        {isLocaleSwitching ? <LocaleSwitcherSpinner /> : <GlobeIcon />}
        <span className="locale-switcher-trigger-copy">
          <span className="locale-switcher-trigger-label">{triggerLabel}</span>
          {!isLocaleSwitching ? (
            <span className="locale-switcher-trigger-meta">{current.currency}</span>
          ) : null}
        </span>
        {!isLocaleSwitching ? <ChevronIcon open={isOpen} /> : null}
      </button>

      {isOpen && !isLocaleSwitching ? (
        <div className="locale-switcher-menu" role="listbox" aria-label={t('header.selectLanguage')}>
          <div className="locale-switcher-menu-head">{t('header.language')}</div>
          {localeOptions.map((option) => {
            const active = option.code === locale;

            return (
              <button
                key={option.code}
                type="button"
                role="option"
                aria-selected={active}
                className={`locale-switcher-option${active ? ' is-active' : ''}`}
                onClick={() => handleSelect(option.code)}
              >
                <span className="locale-switcher-option-code">{option.shortCode}</span>
                <span className="locale-switcher-option-copy">
                  <span className="locale-switcher-option-label">{option.label}</span>
                  <span className="locale-switcher-option-currency">{option.currency}</span>
                </span>
                {active ? (
                  <svg className="locale-switcher-option-check" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3.5 8.5l3 3 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
