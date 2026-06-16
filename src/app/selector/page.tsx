import { JsonLdScript } from '@/components/seo/json-ld';
import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { createDefaultSelectorState, decodeSelectorScenario, selectorSteps } from '@/lib/selector';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import { getProductList } from '@/lib/storefront-api';

import { SelectorClient } from './selector-client';

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
  title: 'Motor Selector — Find the right motor in 5 steps',
  description: 'Use a five-step guided selector to narrow motion products by application, mechanics, electrical fit, and feedback needs.',
  path: '/selector',
    locale,
  });
}

export default async function SelectorPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; industry?: string; w?: string }>;
}) {
  const preferences = await getServerSitePreferences();
  const params = await searchParams;
  const catalog = await getProductList({ pageSize: 96, sort: 'featured' });

  const decodedScenario = decodeSelectorScenario(params.w);
  const presetIndustries = (params.industry ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const initialState = createDefaultSelectorState({
    category: params.category,
    scenario: presetIndustries.length ? { ...decodedScenario, industries: presetIndustries } : decodedScenario,
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { name: 'Home', path: '/' },
      { name: 'Motor Selector', path: '/selector' },
    ],
    preferences.locale,
  );
  const howToJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Motor Selector',
    description: 'Find the right motor in five guided steps.',
    step: selectorSteps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step,
      text: `Complete the ${step} step to narrow the selector results.`,
    })),
  };

  return (
    <StorefrontFrame
      eyebrow="Selector"
      title="Motor Selector"
      description="Move from application context into mechanical, electrical, and feedback constraints, then carry the best-fit SKUs into compare, cart, or quote."
    >
      <JsonLdScript id="selector-breadcrumb-jsonld" data={breadcrumbJsonLd} />
      <JsonLdScript id="selector-howto-jsonld" data={howToJsonLd} />

      <section className="section">
        <div className="section-inner">
          <SelectorClient
            locale={preferences.locale}
            catalogProducts={catalog.items}
            initialState={initialState}
            isLoggedIn={false}
          />
        </div>
      </section>
    </StorefrontFrame>
  );
}