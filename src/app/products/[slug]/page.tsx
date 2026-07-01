import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { JsonLdScript } from '@/components/seo/json-ld';
import { AddToQuoteButton } from '@/components/storefront/add-to-quote-button';
import { PdpBuyProvider, PdpPricePanel, PdpPurchaseActions } from '@/components/storefront/pdp-buy-panel';
import { AddToCompareButton } from '@/components/storefront/add-to-compare-button';
import { AddToWishlistButton } from '@/components/storefront/add-to-wishlist-button';
import { CopyActionButton } from '@/components/storefront/copy-action-button';
import { ProductDetailTabs } from '@/components/storefront/product-detail-tabs';
import { ProductGallery } from '@/components/storefront/product-gallery';
import { ProductInquiryForm } from '@/components/storefront/product-inquiry-form';
import { RecentlyViewedProducts } from '@/components/storefront/recently-viewed-products';
import { type Locale, withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildCompatibleGroups, type DetailCompatibleGroup } from '@/lib/product-compatibility';
import { buildApplicationCards, buildDocumentCards, buildFaqItems, buildOverviewBullets, buildTrustItems, matchesAttachmentAsset } from '@/lib/product-content';
import { buildFaqJsonLd, buildProductJsonLd } from '@/lib/product-seo';
import { getProductTranslation } from '@/lib/product-translations';
import { buildSpecGroups, formatSpecValue, type DetailSpecGroup } from '@/lib/product-specs';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import { SITE_NAME, SITE_URL } from '@/lib/site-config';
import { buildVolumePricingTiers } from '@/lib/volume-pricing';
import { resolveProductSku } from '@/lib/product-sku';
import { getCommerceConfig } from '@/lib/storefront-api';
import { getHomeData, getProductBySlug, type StorefrontProductCard } from '@/lib/storefront-api';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await getServerSitePreferences();
  const p = await getProductBySlug(slug);

  if (!p) {
    return buildMetadata({
      title: 'Product not found — STEPMOTECH',
      path: '/products',
      locale,
      noIndex: true,
    });
  }

  const topSpecs = p.features.slice(0, 2).map((feature) => `${feature.key} ${formatSpecValue(feature.value, feature.unit)}`);
  const description =
    p.seoDescription ??
    `${p.name} (${p.sku}) with ${topSpecs.join(', ') || 'engineering-grade motion parameters'}, ${p.inStock ? 'multi-warehouse availability' : 'quote-based lead times'}, and ${p.purchaseMode === 'buy' ? `pricing from ${p.price.formatted}` : 'RFQ pricing support'}.`;

  return buildMetadata({
    title: p.seoTitle ?? `${p.name} — ${p.sku} | ${SITE_NAME}`,
    description,
    path: `/products/${slug}`,
    locale,
    type: 'website',
    images: p.coverImage ? [{ url: p.coverImage.url, alt: p.coverImage.alt || p.name }] : undefined,
  });
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [{ locale }, product, homeData, commerceConfig] = await Promise.all([
    getServerSitePreferences(),
    getProductBySlug(slug),
    getHomeData(),
    getCommerceConfig(),
  ]);

  if (!product) {
    notFound();
  }

  // Apply locale-specific translations
  const raw = product;
  const translation = locale !== 'en' ? await getProductTranslation(raw.id, locale as Locale) : null;
  const p = translation
    ? { ...raw, ...(translation.name ? { name: translation.name } : {}), ...(translation.shortDescription ? { shortDescription: translation.shortDescription } : {}), ...(translation.description ? { description: translation.description } : {}), ...(translation.seoTitle ? { seoTitle: translation.seoTitle } : {}), ...(translation.seoDescription ? { seoDescription: translation.seoDescription } : {}) }
    : raw;

  const galleryImages = p.coverImage
    ? [p.coverImage, ...p.gallery.filter((image) => image.url !== p.coverImage?.url)]
    : p.gallery.length
      ? p.gallery
      : [];
  const category = p.categories[0] ?? null;
  const productsPath = withLocalePath('/products', locale);
  const productPath = withLocalePath(`/products/${p.slug}`, locale);
  const contactPath = withLocalePath('/contact', locale);
  const categoryPath = category ? withLocalePath(`/c/${category.slug}`, locale) : productsPath;
  const productUrl = `${SITE_URL}${productPath}`;

  // Attachment detection
  const fullDatasheet = p.attachments.find(
    (a) => matchesAttachmentAsset(a, /full[\s_-]*datasheet|datasheet/i) && !matchesAttachmentAsset(a, /torque[\s_-]*curve|curve|graph/i),
  ) ?? null;
  const genericSpec = p.attachments.find((a) => /pdf|datasheet|spec/i.test(`${a.name} ${a.mimeType} ${a.url}`)) ?? null;
  const datasheetAttachment = fullDatasheet ?? genericSpec;
  const torqueCurveAttachment =
    p.attachments.find((a) => matchesAttachmentAsset(a, /torque[\s_-]*curve|speed[\s_-]*curve|performance[\s_-]*curve|graph/i)) ?? datasheetAttachment;
  const dimensionDocAttachment =
    p.attachments.find((a) => matchesAttachmentAsset(a, /dimension|drawing|outline|mechanical/i)) ?? fullDatasheet;

  // Build derived data
  const specGroups = buildSpecGroups(product);
  const topSpecs = specGroups.flatMap((g) => g.rows).slice(0, 5);
  const heroSpecs = topSpecs.filter((item) => item.label !== 'SKU' && item.label !== 'SPU').slice(0, 4);

  const priceHeadline = p.purchaseMode === 'buy' ? p.price.formatted : 'Request Quote';
  const productCode = resolveProductSku(p);

  const lifecycleBadge = (() => {
    if (!p.lifecycleStatus || p.lifecycleStatus === 'active') return null;
    const map: Record<string, { label: string; className: string }> = {
      new: { label: 'New', className: 'is-accent' },
      nfd: { label: 'End of Life Notice', className: 'is-warning' },
      eol: { label: 'Discontinued', className: 'is-critical' },
      last_time_buy: { label: 'Last Time Buy', className: 'is-critical' },
    };
    return map[p.lifecycleStatus] ?? null;
  })();

  const eolDeadline = p.eolDate ? new Date(p.eolDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null;
  const ltbDeadline = p.lastTimeBuyDate ? new Date(p.lastTimeBuyDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null;

  const bulkPrices =
    p.purchaseMode === 'buy'
      ? buildVolumePricingTiers(p.price.amount, p.price.currency, commerceConfig.volumePricingRules).filter((t) => t.minQuantity > 1)
      : [];

  // URLs
  const queryForQuote = new URLSearchParams({
    addSku: productCode,
    productId: p.id,
  }).toString();
  const queryForSample = new URLSearchParams({ topic: 'sample', product: productCode }).toString();
  const queryForVolume = new URLSearchParams({ sku: productCode }).toString();
  const queryForCustom = new URLSearchParams({ sourceSku: productCode, sourceProduct: p.name }).toString();
  const quoteHref = `${withLocalePath('/quote', locale)}?${queryForQuote}`;
  const sampleHref = `${contactPath}?${queryForSample}`;
  const volumePricingHref = `${withLocalePath('/volume-pricing', locale)}?${queryForVolume}`;
  const customHref = `${withLocalePath('/custom', locale)}?${queryForCustom}`;

  // Derived content
  const trustItems = buildTrustItems(product);
  const overviewBullets = buildOverviewBullets(product, topSpecs);
  const documentCards = buildDocumentCards(p.attachments, quoteHref);
  const faqItems = buildFaqItems(product, topSpecs);

  // Related & compatible
  const relatedCandidates = p.relatedProducts.filter((item) => item.id !== p.id);
  const peopleAlsoBought = homeData.mostViewedProducts
    .filter((item) => item.id !== p.id && !relatedCandidates.some((r) => r.id === item.id))
    .slice(0, 4);
  const compatibleGroups = buildCompatibleGroups(p.compatibleGroups ?? [], [...relatedCandidates, ...peopleAlsoBought]);
  const visibleCompatibleGroups = compatibleGroups.filter((g) => g.items.length);
  const compatibleProductCount = visibleCompatibleGroups.reduce((sum, g) => sum + g.items.length, 0);

  // Image filters
  const dimensionImages = galleryImages.filter((img) => {
    const marker = `${img.url ?? ''} ${img.imageType ?? ''}`.toLowerCase();
    return img.isDimension || img.imageType === 'dimension' || /dimension|diagram|size|drawing|outline|mechanical/i.test(marker);
  });
  const torqueCurveImages = galleryImages.filter((img) => {
    const marker = `${img.url ?? ''} ${img.imageType ?? ''}`.toLowerCase();
    return (img.imageType === 'detail' || /torque|curve|performance|graph/i.test(marker)) && !dimensionImages.some((d) => d.url === img.url);
  });

  // Application cards
  const applicationCards = buildApplicationCards(product, homeData.featuredIndustries, topSpecs);

  // JSON-LD
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { name: 'Home', path: '/' },
      { name: 'Products', path: '/products' },
      ...(category ? [{ name: category.name, path: `/c/${category.slug}` }] : []),
      { name: p.name, path: `/products/${p.slug}` },
    ],
    locale,
  );
  const productJsonLd = buildProductJsonLd(
    product,
    productUrl,
    galleryImages.map((img) => img.url),
    specGroups,
    bulkPrices,
    locale,
  );
  const faqJsonLd = buildFaqJsonLd(faqItems);

  return (
    <StorefrontFrame>
      <JsonLdScript id="product-breadcrumb-jsonld" data={breadcrumbJsonLd} />
      <JsonLdScript id="product-jsonld" data={productJsonLd} />
      <JsonLdScript id="product-faq-jsonld" data={faqJsonLd} />

      <section className="section product-detail-section">
        <div className="section-inner">
          <nav className="detail-breadcrumbs" aria-label="Breadcrumb">
            <Link href={withLocalePath('/', locale)}>Home</Link>
            <span>/</span>
            <Link href={productsPath}>Products</Link>
            {category ? (
              <>
                <span>/</span>
                <Link href={categoryPath}>{category.name}</Link>
              </>
            ) : null}
            <span>/</span>
            <span>{p.name}</span>
          </nav>

          <header className="pdp-top-header">
            <div className="pdp-top-header-copy">
              <div className="pdp-top-header-meta">
                {category ? (
                  <Link href={categoryPath} className="pdp-top-eyebrow">{category.name}</Link>
                ) : (
                  <span className="pdp-top-eyebrow">Catalog product</span>
                )}
                <span className="pdp-top-sku">SPU {p.spu}</span>
              </div>
              <h1 className="pdp-top-title">{p.name}</h1>
              {lifecycleBadge ? (
                <span className={`pdp-top-badge ${lifecycleBadge.className}`} style={{ marginTop: 8 }}>{lifecycleBadge.label}</span>
              ) : null}
            </div>
          </header>

          <div className="product-detail-grid">
            <div className="product-gallery-column">
              <ProductGallery images={galleryImages} productName={p.name} />
              <div className="detail-share-row pdp-share-row">
                <span className="summary-label">Share & docs</span>
                <div className="detail-share-chips">
                  <CopyActionButton value={productUrl} idleLabel="Copy link" copiedLabel="Link copied" toastTitle="Product link copied" className="button-secondary" />
                  {datasheetAttachment ? (
                    <a href={datasheetAttachment.url} target="_blank" rel="noreferrer" className="button-secondary">Datasheet</a>
                  ) : null}
                  <Link href={quoteHref} className="button-secondary">Engineering support</Link>
                </div>
              </div>
            </div>

            <article className="info-card product-summary-card pdp-buybox-card">
              {p.purchaseMode === 'buy' ? (
                <PdpBuyProvider
                  productId={p.id}
                  moq={p.moq}
                  inStock={p.inStock}
                  basePriceAmount={p.price.amount}
                  currency={p.price.currency}
                  volumePricingRules={commerceConfig.volumePricingRules}
                >
              <div className="pdp-header-stack">
                <div className="pdp-sku-row">
                  <p className="product-meta">SPU {p.spu}</p>
                  <div className="pdp-sku-actions">
                    <CopyActionButton value={p.spu} idleLabel="Copy SPU" copiedLabel="SPU copied" toastTitle="SPU copied" className="button-secondary" />
                    {datasheetAttachment ? (
                      <a href={datasheetAttachment.url} target="_blank" rel="noreferrer" className="button-secondary">View datasheet</a>
                    ) : null}
                  </div>
                </div>
                <div className="pdp-stock-row">
                  <span className={`pdp-stock-status${p.inStock ? ' is-available' : ' is-unavailable'}`}>
                    {p.inStock ? `In stock · ${p.stockQuantity} available` : 'Out of stock'}
                  </span>
                </div>
              </div>

              <PdpPricePanel
                priceHeadline={priceHeadline}
                compareAtPrice={p.compareAtPrice?.formatted}
                volumePricingHref={volumePricingHref}
              />

              <div className="pdp-specs-strip">
                {heroSpecs.map((item) => (
                  <span key={`${item.label}-${item.value}`} className="pdp-spec-chip">
                    <span className="pdp-spec-chip-label">{item.label}</span>
                    <span className="pdp-spec-chip-value">{item.value}</span>
                  </span>
                ))}
              </div>

              <div className="pdp-logistics-bar">
                <span className="pdp-logistics-item">{p.moq > 1 ? `MOQ ${p.moq}` : 'No MOQ'}</span>
                <span className="pdp-logistics-divider" aria-hidden="true" />
                <span className="pdp-logistics-item">{p.inStock ? `${p.stockQuantity} in stock` : 'Build to order'}</span>
                <span className="pdp-logistics-divider" aria-hidden="true" />
                <span className="pdp-logistics-item">{p.leadTimeMin}–{p.leadTimeMax} {p.leadTimeUnit.replace(/_/g, ' ')}</span>
                {p.efficiencyClass ? (
                  <>
                    <span className="pdp-logistics-divider" aria-hidden="true" />
                    <span className="pdp-logistics-item">{p.efficiencyClass}</span>
                  </>
                ) : null}
              </div>

              {p.paidSampleEnabled ? (
                <div className="pdp-sample-banner">
                  <span className="pdp-sample-badge">Pay-for-Shipping Sample</span>
                  <p className="pdp-sample-desc">Try before you buy — order 1 unit as a sample, pay only shipping. Our team will review and confirm your sample request.</p>
                  <Link href={`${sampleHref}&sample=1`} className="button-primary pdp-sample-cta">Request Sample — Shipping Only</Link>
                </div>
              ) : null}

              <PdpPurchaseActions />

              <div className="pdp-primary-cta">
                <AddToQuoteButton
                  productId={p.id}
                  name={p.name}
                  slug={p.slug}
                  spu={productCode}
                  coverImage={p.coverImage ? { url: p.coverImage.url, alt: p.coverImage.alt || p.name } : null}
                  listUnitPrice={{ amount: p.price.amount, currency: p.price.currency, formatted: p.price.formatted }}
                />
                <div className="pdp-support-links">
                  <Link href={customHref} className="detail-inline-link">Discuss a custom variant</Link>
                  <Link href={contactPath} className="detail-inline-link">Talk to engineering support</Link>
                </div>
              </div>

              <div className="pdp-utility-actions">
                <AddToCompareButton
                  item={{
                    id: p.id,
                    name: p.name,
                    slug: p.slug,
                    sku: productCode,
                    priceLabel: p.price.formatted,
                    purchaseMode: p.purchaseMode,
                    inStock: p.inStock,
                    shortDescription: p.shortDescription,
                    categories: p.categories.map((item) => item.name),
                  }}
                />
                <AddToWishlistButton productId={p.id} />
              </div>
                </PdpBuyProvider>
              ) : (
                <>
              <div className="pdp-header-stack">
                <div className="pdp-sku-row">
                  <p className="product-meta">SPU {p.spu}</p>
                  <div className="pdp-sku-actions">
                    <CopyActionButton value={p.spu} idleLabel="Copy SPU" copiedLabel="SPU copied" toastTitle="SPU copied" className="button-secondary" />
                    {datasheetAttachment ? (
                      <a href={datasheetAttachment.url} target="_blank" rel="noreferrer" className="button-secondary">View datasheet</a>
                    ) : null}
                  </div>
                </div>
                <div className="pdp-stock-row">
                  <span className={`pdp-stock-status${p.inStock ? ' is-available' : ' is-unavailable'}`}>
                    {p.inStock ? `In stock · ${p.stockQuantity} available` : 'Out of stock'}
                  </span>
                </div>
              </div>

              <div className="product-pricing-stack pdp-price-panel">
                <p className="product-price">{priceHeadline}</p>
              </div>

              <div className="pdp-specs-strip">
                {heroSpecs.map((item) => (
                  <span key={`${item.label}-${item.value}`} className="pdp-spec-chip">
                    <span className="pdp-spec-chip-label">{item.label}</span>
                    <span className="pdp-spec-chip-value">{item.value}</span>
                  </span>
                ))}
              </div>

              <div className="pdp-logistics-bar">
                <span className="pdp-logistics-item">{p.moq > 1 ? `MOQ ${p.moq}` : 'No MOQ'}</span>
                <span className="pdp-logistics-divider" aria-hidden="true" />
                <span className="pdp-logistics-item">{p.inStock ? `${p.stockQuantity} in stock` : 'Build to order'}</span>
                <span className="pdp-logistics-divider" aria-hidden="true" />
                <span className="pdp-logistics-item">{p.leadTimeMin}–{p.leadTimeMax} {p.leadTimeUnit.replace(/_/g, ' ')}</span>
                {p.efficiencyClass ? (
                  <>
                    <span className="pdp-logistics-divider" aria-hidden="true" />
                    <span className="pdp-logistics-item">{p.efficiencyClass}</span>
                  </>
                ) : null}
              </div>

              {p.paidSampleEnabled ? (
                <div className="pdp-sample-banner">
                  <span className="pdp-sample-badge">Pay-for-Shipping Sample</span>
                  <p className="pdp-sample-desc">Try before you buy — order 1 unit as a sample, pay only shipping. Our team will review and confirm your sample request.</p>
                  <Link href={`${sampleHref}&sample=1`} className="button-primary pdp-sample-cta">Request Sample — Shipping Only</Link>
                </div>
              ) : null}

              <div className="product-action-stack pdp-action-cluster">
                <div className="inquiry-form-wrap">
                  <ProductInquiryForm productId={p.id} productName={p.name} />
                </div>
                <div className="pdp-support-links">
                  <Link href={customHref} className="detail-inline-link">Discuss a custom variant</Link>
                  <Link href={contactPath} className="detail-inline-link">Talk to engineering support</Link>
                </div>
                <div className="pdp-utility-actions">
                  <AddToCompareButton
                    item={{
                      id: p.id,
                      name: p.name,
                      slug: p.slug,
                      sku: productCode,
                      priceLabel: 'Request Quote',
                      purchaseMode: p.purchaseMode,
                      inStock: p.inStock,
                      shortDescription: p.shortDescription,
                      categories: p.categories.map((item) => item.name),
                    }}
                  />
                  <AddToWishlistButton productId={p.id} />
                </div>
              </div>
                </>
              )}

              <div className="pdp-trust-list">
                {trustItems.map((item) => (
                  <div key={item} className="pdp-trust-item">{item}</div>
                ))}
              </div>

              {p.certifications && p.certifications.length > 0 ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                  {p.certifications.map((cert) => (
                    <span key={cert} className="detail-note-chip">{cert}</span>
                  ))}
                </div>
              ) : null}

              <article className="pdp-custom-note">
                <span className="summary-label">Custom program</span>
                <strong>Need changes to shaft, winding, gearbox, or environment?</strong>
                <Link href={customHref} className="section-link">Start custom development with this SKU</Link>
              </article>
            </article>
          </div>
        </div>
      </section>

      <section className="section detail-tabs-section">
        <div className="section-inner">
          <ProductDetailTabs
            description={p.descriptionLong || p.description}
            specGroups={specGroups}
            dimensionImages={dimensionImages}
            torqueCurveImages={torqueCurveImages}
            dimensionDocumentHref={dimensionDocAttachment?.url}
            torqueCurveDocumentHref={torqueCurveAttachment?.url}
            datasheetUrl={datasheetAttachment?.url}
            quoteHref={quoteHref}
            customHref={customHref}
            contactPath={contactPath}
            documentCards={documentCards}
            torqueCurveData={p.torqueCurveData}
            configurationRules={p.configurationRules}
          />

          {visibleCompatibleGroups.length ? (
            <article id="detail-compatible" className="info-card detail-panel-card">
              <div className="detail-panel-heading">
                <div className="detail-panel-copy">
                  <span className="card-kicker">Compatible planning</span>
                  <h2 className="detail-panel-title">Compatible and recommended products already paired with this SKU.</h2>
                </div>
                <div className="detail-panel-badges">
                  <span className="detail-panel-badge">{compatibleProductCount} matches</span>
                </div>
              </div>
              <CompatibleGroupsSection groups={visibleCompatibleGroups} locale={locale} />
            </article>
          ) : null}

          <div id="detail-faq" className="tab-content-wrapper detail-bottom-grid">
            <article className="info-card detail-panel-card detail-faq-card">
              <div className="detail-panel-heading">
                <div className="detail-panel-copy">
                  <span className="card-kicker">Support briefing</span>
                  <h2 className="detail-panel-title">Quick answers on ordering, documents and fulfillment.</h2>
                </div>
                <div className="detail-panel-badges">
                  <span className="detail-panel-badge">{faqItems.length} answers</span>
                </div>
              </div>
              <div className="pdp-faq-list">
                {faqItems.map((item, index) => (
                  <details key={`${item.question}-${index}`} className="faq-item">
                    <summary className="faq-question">
                      <span className="faq-question-index">{String(index + 1).padStart(2, '0')}</span>
                      <span className="faq-question-text">{item.question}</span>
                      <span className="faq-toggle-marker" aria-hidden="true" />
                    </summary>
                    <div className="faq-answer"><p>{item.answer}</p></div>
                  </details>
                ))}
              </div>
            </article>
            <RecentlyViewedProducts currentProduct={product} fallbackProducts={[...relatedCandidates, ...peopleAlsoBought]} locale={locale} />
          </div>
        </div>
      </section>
    </StorefrontFrame>
  );
}

function CompatibleGroupsSection({ groups, locale }: { groups: DetailCompatibleGroup[]; locale: Locale }) {
  return (
    <div className="compatible-groups-container">
      {groups.map((group) => (
        <section key={`${group.title}-${group.badge}`} className="compatible-group" aria-label={group.title}>
          <div className="compatible-group-header">
            <span className="compatible-badge">{group.badge}</span>
            <div className="detail-panel-copy">
              <h3 className="compatible-group-title">{group.title}</h3>
              <p className="compatible-group-description">{group.description}</p>
            </div>
          </div>
          <div className="compatible-product-list">
            {group.items.map((item) => (
              <Link key={item.id} href={withLocalePath(`/products/${item.slug}`, locale)} className="compatible-product-card">
                <div className="compatible-product-image">
                  {item.coverImage ? (
                    <img src={item.coverImage.url} alt={item.coverImage.alt || item.name} loading="lazy" />
                  ) : (
                    <div className="compatible-product-placeholder" aria-hidden="true">No image</div>
                  )}
                </div>
                <div className="compatible-product-info">
                  <p className="product-meta">SKU {item.sku}</p>
                  <h4 className="compatible-product-name">{item.name}</h4>
                  <div className="compatible-product-footer">
                    <span className="compatible-product-price">{item.purchaseMode === 'buy' ? item.price.formatted : 'Request Quote'}</span>
                    <span className="compatible-product-mode">{item.purchaseMode === 'buy' ? (item.inStock ? 'In stock' : 'Lead time') : 'RFQ'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
