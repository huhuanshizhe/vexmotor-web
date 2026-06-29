import Link from 'next/link';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';

export default async function NotFound() {
  const { locale } = await getServerSitePreferences();

  return (
    <StorefrontFrame
      eyebrow="404 — Page Not Found"
      title="This page is out of stock."
      description="The page you requested may have moved, been renamed, or never existed. Use the links below to get back to a working part of the storefront."
      actions={
        <>
          <Link href={withLocalePath('/', locale)} className="button-primary">
            Back to home
          </Link>
          <Link href={withLocalePath('/products', locale)} className="button-secondary page-button-secondary-dark">
            Browse catalog
          </Link>
        </>
      }
    >
      <section className="section">
        <div className="section-inner info-grid">
          <article className="info-card">
            <h2 style={{ margin: 0 }}>Shop products</h2>
            <p className="section-description">Explore stepper motors, drivers, power supplies, and matched motion accessories.</p>
            <Link href={withLocalePath('/products', locale)} className="section-link">
              View catalog
            </Link>
          </article>
          <article className="info-card">
            <h2 style={{ margin: 0 }}>Request a quote</h2>
            <p className="section-description">Need OEM volumes or a custom assembly? Start an RFQ and our team will follow up.</p>
            <Link href={withLocalePath('/quote', locale)} className="section-link">
              Start an RFQ
            </Link>
          </article>
          <article className="info-card">
            <h2 style={{ margin: 0 }}>Talk to support</h2>
            <p className="section-description">Questions about stock, compatibility, or shipping? Reach sales and engineering.</p>
            <Link href={withLocalePath('/contact', locale)} className="section-link">
              Contact us
            </Link>
          </article>
        </div>
      </section>
    </StorefrontFrame>
  );
}
