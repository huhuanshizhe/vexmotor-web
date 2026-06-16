'use client';

import { useState, useRef, useEffect } from 'react';
import { DownOutlined, GlobalOutlined, CheckOutlined } from '@ant-design/icons';
import { useTranslation, AVAILABLE_LOCALES } from '@/lib/i18n-context';
import { type Locale } from '@/lib/i18n';
import { withLocalePath } from '@/lib/i18n';
import { usePathname } from 'next/navigation';

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleLocaleChange = (newLocale: Locale) => {
    setIsOpen(false);
    // setLocale() handles cookie, router.push, and router.refresh
    setLocale(newLocale);
  };

  const currentLocale = AVAILABLE_LOCALES.find(l => l.code === locale);

  return (
    <div className="language-switcher" ref={dropdownRef}>
      <button
        type="button"
        className="language-switcher-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select language"
      >
        <GlobalOutlined style={{ fontSize: '16px' }} />
        <span className="language-switcher-label">
          {currentLocale?.flag} {currentLocale?.label}
        </span>
        <DownOutlined style={{ fontSize: '12px' }} />
      </button>

      {isOpen && (
        <div className="language-dropdown" role="listbox">
          {AVAILABLE_LOCALES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              className={`language-dropdown-item ${locale === lang.code ? 'is-active' : ''}`}
              onClick={() => handleLocaleChange(lang.code)}
              role="option"
              aria-selected={locale === lang.code}
            >
              <span className="language-flag">{lang.flag}</span>
              <span className="language-name">{lang.label}</span>
              {locale === lang.code && (
                <CheckOutlined style={{ fontSize: '14px', color: 'var(--brand-600)' }} />
              )}
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        .language-switcher {
          position: relative;
          display: inline-block;
        }

        .language-switcher-button {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: 6px 12px;
          min-height: 36px;
          background: transparent;
          border: 1px solid var(--color-border-primary);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
          color: var(--color-text-primary);
          font-family: var(--font-sans);
          font-size: 0.875rem;
          font-weight: 500;
        }

        .language-switcher-button:hover,
        .language-switcher-button:focus-visible {
          background: var(--gray-50);
          border-color: var(--brand-500);
        }

        .language-switcher-label {
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }

        .language-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 200px;
          background: var(--color-bg-primary);
          border: 1px solid var(--color-border-secondary);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          padding: var(--spacing-xs);
          z-index: var(--z-dropdown);
          animation: dropdownFadeIn 150ms ease-out;
        }

        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .language-dropdown-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          width: 100%;
          padding: var(--spacing-sm) var(--spacing-md);
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
          color: var(--color-text-primary);
          font-family: var(--font-sans);
          font-size: 0.875rem;
          text-align: left;
        }

        .language-dropdown-item:hover,
        .language-dropdown-item:focus-visible {
          background: var(--gray-100);
        }

        .language-dropdown-item.is-active {
          background: var(--brand-50);
          color: var(--brand-700);
          font-weight: 600;
        }

        .language-flag {
          font-size: 1.25rem;
          line-height: 1;
        }

        .language-name {
          flex: 1;
        }

        /* Mobile responsive */
        @media (max-width: 767px) {
          .language-switcher-label span:last-child {
            display: none;
          }

          .language-dropdown {
            position: fixed;
            top: auto;
            bottom: 0;
            left: 0;
            right: 0;
            min-width: 100%;
            border-radius: var(--radius-lg) var(--radius-lg) 0 0;
            animation: slideUp 200ms ease-out;
          }

          @keyframes slideUp {
            from {
              transform: translateY(100%);
            }
            to {
              transform: translateY(0);
            }
          }

          .language-dropdown-item {
            padding: var(--spacing-md);
            min-height: 48px;
          }
        }
      `}</style>
    </div>
  );
}
