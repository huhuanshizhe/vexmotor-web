import Link from 'next/link';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { JsonLdScript } from '@/components/seo/json-ld';
import { GlossaryClient } from '@/components/storefront/glossary-client';
import { glossaryTermToPlainText, type KnowledgeLinkedProduct } from '@/lib/knowledge';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import { SITE_URL } from '@/lib/site-config';
import { getKnowledgeCatalog } from '@/lib/storefront-api';
import { getProductBySlug, type StorefrontProductDetail } from '@/lib/storefront-api';

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
  title: 'Motion Glossary — STEPMOTECH',
  description: 'Searchable glossary for motion-control, drivetrain, and compliance terms used across the STEPMOTECH content library.',
  path: '/glossary',
    locale,
  });
}

function buildKnowledgeProductMap(products: StorefrontProductDetail[]) {
  return products.reduce<Record<string, KnowledgeLinkedProduct>>((accumulator, product) => {
    accumulator[product.slug] = {
      slug: product.slug,
      name: product.name,
      spu: product.spu,
      purchaseMode: product.purchaseMode,
      priceLabel: product.purchaseMode === 'buy' ? product.price.formatted : 'Request Quote',
      shortDescription: product.shortDescription ?? undefined,
    };
    return accumulator;
  }, {});
}

export default async function GlossaryPage() {
  const { locale } = await getServerSitePreferences();
  const knowledgeCatalog = await getKnowledgeCatalog();
  const productSlugs = Array.from(new Set(knowledgeCatalog.glossaryTerms.flatMap((term) => term.relatedProductSlugs).concat(knowledgeCatalog.techFaqEntries.flatMap((entry) => entry.relatedProductSlugs))));
  const products = await Promise.all(productSlugs.map((slug) => getProductBySlug(slug)));
  const productMap = buildKnowledgeProductMap(products.filter((product): product is StorefrontProductDetail => Boolean(product)));
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Glossary', path: '/glossary' },
  ], locale);
  const definedTermSetJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: 'STEPMOTECH Motion Glossary',
    hasDefinedTerm: knowledgeCatalog.glossaryTerms.map((term) => ({
      '@type': 'DefinedTerm',
      name: term.term,
      alternateName: term.synonyms,
      description: glossaryTermToPlainText(term),
      url: `${SITE_URL}${withLocalePath('/glossary', locale)}#term-${term.id}`,
    })),
  };

  return (
    <StorefrontFrame
      eyebrow="Glossary"
      title="Motion, drivetrain, and compliance terms explained without forcing readers out to external docs."
      description="Use the glossary when a page mentions a motion term, a sizing concept, or a compliance label that should be clarified in-place before product selection or escalation."
      actions={
        <>
          <Link href={withLocalePath('/tech-faq', locale)} className="button-secondary page-button-secondary-dark">
            Open Tech FAQ
          </Link>
          <Link href={withLocalePath('/support/contact?topic=technical', locale)} className="button-primary">
            Suggest a term
          </Link>
        </>
      }
    >
      <JsonLdScript id="glossary-breadcrumb-jsonld" data={breadcrumbJsonLd} />
      <JsonLdScript id="glossary-definedtermset-jsonld" data={definedTermSetJsonLd} />

      <section className="section">
        <div className="section-inner knowledge-page-shell">
          <GlossaryClient glossaryTerms={knowledgeCatalog.glossaryTerms} locale={locale} productsBySlug={productMap} />
        </div>
      </section>
    </StorefrontFrame>
  );
}