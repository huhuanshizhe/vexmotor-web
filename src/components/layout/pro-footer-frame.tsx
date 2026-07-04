import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';

import { HeaderUtilityStrip } from '@/components/layout/header-utility-strip';
import { CookieConsentBar, COOKIE_CONSENT_COOKIE_NAME } from '@/components/layout/cookie-consent-bar';
import { NotificationBar } from '@/components/layout/notification-bar';
import { StorefrontNav } from '@/components/layout/storefront-nav';
import type { Locale } from '@/lib/i18n';
import type { SitePreferences } from '@/lib/i18n';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildCategoryLookupByShellSlug, localizeStorefrontNavigation } from '@/lib/catalog-categories';
import { getStorefrontNavigation, homeShell } from '@/lib/site-shell';
import { getCategories, getHomeData } from '@/lib/storefront-api';
import { NewsletterSignupForm } from '@/components/storefront/newsletter-signup-form';

type StorefrontFrameProps = {
  title?: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
};

type FrameLinkProps = {
  href: string;
  className: string;
  children: ReactNode;
  external?: boolean;
  locale: Locale;
};

const fallbackSitePreferences: SitePreferences = {
  locale: 'en',
  currency: 'USD',
  unitSystem: 'imperial',
};

function FrameLink({ href, className, children, external, locale }: FrameLinkProps) {
  if (external) {
    return (
      <a href={href} className={className} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }

  return (
    <Link href={href.startsWith('/') ? withLocalePath(href, locale) : href} className={className}>
      {children}
    </Link>
  );
}

export async function StorefrontFrame({ title, description, eyebrow, actions, children }: StorefrontFrameProps) {
  const cookieStore = await cookies();
  const preferences = await getServerSitePreferences().catch(() => fallbackSitePreferences);
  const homeData = await getHomeData().catch(() => homeShell);
  const [localizedCategories, canonicalCategories] = await Promise.all([
    getCategories(preferences.locale).catch(() => []),
    preferences.locale === 'en' ? Promise.resolve([]) : getCategories('en').catch(() => []),
  ]);
  const categoryLookup = buildCategoryLookupByShellSlug(
    localizedCategories,
    canonicalCategories.length ? canonicalCategories : localizedCategories,
  );
  const navigation = localizeStorefrontNavigation(getStorefrontNavigation(), categoryLookup);
  const cookieConsentAccepted = cookieStore.get(COOKIE_CONSENT_COOKIE_NAME)?.value === 'accepted';

  return (
    <main className="storefront-shell">
      <NotificationBar />

      <div className="storefront-topbar">
        <div className="storefront-topbar-inner">
          <span>Self-owned brand | Factory direct supply | Global delivery support</span>
          <span>Technical service for stepper motors, drivers, and motion components</span>
        </div>
      </div>

      <header className="storefront-header">
        <div className="storefront-header-main">
          <Link href={withLocalePath('/', preferences.locale)} className="brand-mark">
            <Image src="/brand/stepmotech-logo-legacy.jpg" alt="StepMotech" width={300} height={37} className="brand-logo-image" priority />
            <span className="brand-title brand-title-fallback">StepMotech</span>
            <span className="brand-subtitle">Factory Direct Motion Components</span>
          </Link>

          <form action={withLocalePath('/search', preferences.locale)} className="header-search-form" role="search">
            <input name="q" className="header-search-input" placeholder="Search Product Here..." aria-label="Search products" />
            <button type="submit" className="header-search-button">
              Search
            </button>
          </form>

          <HeaderUtilityStrip links={navigation.utilityLinks} initialCartCount={0} locale={preferences.locale} />
        </div>

        <div className="storefront-nav-band">
          <StorefrontNav items={navigation.mainLinks} locale={preferences.locale} />
        </div>
      </header>

      {title ? (
        <section className="section">
          <div className="section-inner">
            <article className="page-hero-card">
              <div className="page-hero-copy">
                {eyebrow ? <div className="card-kicker">{eyebrow}</div> : null}
                <h1 className="section-title">{title}</h1>
                {description ? <p className="section-description">{description}</p> : null}
              </div>
              {actions ? <div className="page-hero-actions">{actions}</div> : null}
            </article>
          </div>
        </section>
      ) : null}

      {children}

      {/* ═══════════════════════════════════════════════════════════
          PROFESSIONAL FOOTER - Industrial E-commerce Standard
          Inspired by: vexmotor.com, mcmaster.com, misumi.com
          ═══════════════════════════════════════════════════════════ */}
      <footer className="pro-footer">
        {/* TRUST BADGES */}
        <div className="pro-footer-trust">
          <div className="pro-footer-container">
            <div className="pro-footer-trust-grid">
              {homeData.trustHighlights.map((item) => (
                <div key={item.title} className="pro-footer-trust-item">
                  <div className="pro-footer-trust-title">{item.title}</div>
                  <div className="pro-footer-trust-desc">{item.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* NEWSLETTER */}
        <div className="pro-footer-newsletter">
          <div className="pro-footer-container">
            <div className="pro-footer-newsletter-inner">
              <div className="pro-footer-newsletter-content">
                <h3 className="pro-footer-newsletter-title">{homeData.newsletter.title}</h3>
                <p className="pro-footer-newsletter-desc">{homeData.newsletter.description}</p>
              </div>
              <NewsletterSignupForm placeholder={homeData.newsletter.placeholder} buttonLabel={homeData.newsletter.buttonLabel} />
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="pro-footer-main">
          <div className="pro-footer-container">
            <div className="pro-footer-grid">
              {/* Column 1: About Company */}
              <div className="pro-footer-col pro-footer-col-wide">
                <h4 className="pro-footer-heading">{homeData.brandStory.title}</h4>
                <p className="pro-footer-text">{homeData.brandStory.description}</p>
              </div>

              {/* Column 2-3: Quick Links */}
              {homeData.footerSections.map((section) => (
                <div key={section.id} className="pro-footer-col">
                  <h4 className="pro-footer-heading">{section.title}</h4>
                  <ul className="pro-footer-links">
                    {section.links.map((link) => (
                      <li key={`${section.id}-${link.label}`}>
                        <FrameLink href={link.href} className="pro-footer-link" external={link.external} locale={preferences.locale}>
                          {link.label}
                        </FrameLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* Column 4: Featured Products */}
              <div className="pro-footer-col">
                <h4 className="pro-footer-heading">Featured Products</h4>
                <div className="pro-footer-products">
                  {homeData.mostViewedProducts.slice(0, 3).map((product) => (
                    <Link key={product.id} href={withLocalePath(`/products/${product.slug}`, preferences.locale)} className="pro-footer-product">
                      {product.coverImage ? (
                        <div className="pro-footer-product-img">
                          <Image src={product.coverImage.url} alt={product.coverImage.alt || product.name} fill sizes="60px" unoptimized />
                        </div>
                      ) : null}
                      <div className="pro-footer-product-info">
                        <div className="pro-footer-product-name">{product.name}</div>
                        <div className="pro-footer-product-price">
                          {product.purchaseMode === 'buy' ? product.price.formatted : 'Quote'}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Column 5: Contact Info */}
              <div className="pro-footer-col pro-footer-col-contact">
                <h4 className="pro-footer-heading">Contact Us</h4>
                <div className="pro-footer-contact">
                  {homeData.footerContact.map((item) => (
                    <div key={item.title} className="pro-footer-contact-item">
                      <div className="pro-footer-contact-label">{item.title}</div>
                      {item.href ? (
                        <a href={item.href} className="pro-footer-contact-value pro-footer-contact-link">
                          {item.lines[0]}
                        </a>
                      ) : (
                        <div className="pro-footer-contact-value">
                          {item.lines.map((line, i) => (
                            <div key={i}>{line}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="pro-footer-bottom">
          <div className="pro-footer-container">
            <div className="pro-footer-bottom-inner">
              <div className="pro-footer-payments">
                {homeData.paymentMethods.map((method) => (
                  <span key={method} className="pro-footer-payment">
                    {method}
                  </span>
                ))}
              </div>
              <div className="pro-footer-copyright">{homeData.copyright}</div>
            </div>
          </div>
        </div>
      </footer>

      <CookieConsentBar locale={preferences.locale} initiallyAccepted={cookieConsentAccepted} />
    </main>
  );
}
