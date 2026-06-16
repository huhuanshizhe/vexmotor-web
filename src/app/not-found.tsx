import Link from 'next/link';

import { StorefrontFrame } from '@/components/layout/storefront-frame';

export default function NotFound() {
  return (
    <StorefrontFrame
      eyebrow="404 — Page Not Found"
      title="This page is out of stock."
      description="The page you requested may have moved, been renamed, or never existed. Use the links below to get back to a working part of the storefront."
      actions={
        <>
          <Link href="/" className="button-primary">
            Back to home
          </Link>
          <Link href="/products" className="button-secondary page-button-secondary-dark">
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
            <Link href="/products" className="section-link">
              View catalog
            </Link>
          </article>
          <article className="info-card">
            <h2 style={{ margin: 0 }}>Request a quote</h2>
            <p className="section-description">Need OEM volumes or a custom assembly? Start an RFQ and our team will follow up.</p>
            <Link href="/quote" className="section-link">
              Start an RFQ
            </Link>
          </article>
          <article className="info-card">
            <h2 style={{ margin: 0 }}>Talk to support</h2>
            <p className="section-description">Questions about stock, compatibility, or shipping? Reach sales and engineering.</p>
            <Link href="/contact" className="section-link">
              Contact us
            </Link>
          </article>
        </div>
      </section>
    </StorefrontFrame>
  );
}
