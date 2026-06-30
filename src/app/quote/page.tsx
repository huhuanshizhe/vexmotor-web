import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { resolveProductSku } from '@/lib/product-sku';
import { buildMetadata } from '@/lib/seo';
import { getProductList } from '@/lib/storefront-api';

import { QuoteClient } from './quote-client';

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
    title: 'Request a Quote — STEPMOTECH',
    description: 'Submit RFQ lines with quantity, target market, and engineering notes.',
    path: '/quote',
    noIndex: true,
    locale,
  });
}

type QuotePageProps = {
  searchParams: Promise<{
    addSku?: string;
    productId?: string;
  }>;
};

export default async function QuotePage({ searchParams }: QuotePageProps) {
  const [{ locale }, params] = await Promise.all([getServerSitePreferences(), searchParams]);
  const catalog = await getProductList({ pageSize: 96, sort: 'featured' });

  let intakeProduct =
    (params.productId ? catalog.items.find((item) => item.id === params.productId) : undefined)
    ?? (params.addSku ? catalog.items.find((item) => resolveProductSku(item).toLowerCase() === params.addSku!.toLowerCase()) : undefined);

  if (!intakeProduct && params.addSku) {
    const searchResult = await getProductList({ keyword: params.addSku, pageSize: 8 });
    intakeProduct = searchResult.items.find((item) => resolveProductSku(item).toLowerCase() === params.addSku!.toLowerCase()) ?? searchResult.items[0];
  }

  return (
    <StorefrontFrame>
      <section className="section">
        <div className="section-inner">
          <QuoteClient
            locale={locale}
            intakeProductId={intakeProduct?.id ?? ''}
            intakeProductName={intakeProduct?.name ?? ''}
            intakeProduct={intakeProduct ?? null}
            cart={null}
            catalogProducts={catalog.items}
          />
        </div>
      </section>
    </StorefrontFrame>
  );
}
