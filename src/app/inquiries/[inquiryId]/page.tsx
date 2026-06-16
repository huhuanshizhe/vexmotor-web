import Link from 'next/link';
import { notFound } from 'next/navigation';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { serverFetch } from '@/lib/api-client';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
    title: 'Inquiry — STEPMOTECH',
    description: 'Buyer-facing RFQ snapshot.',
    path: '/inquiries',
    noIndex: true,
    locale,
  });
}

export default async function InquiryDetailPage({ params }: { params: Promise<{ inquiryId: string }> }) {
  const { inquiryId } = await params;
  const inquiry = await serverFetch<Record<string, any>>(`/api/front/inquiries/${encodeURIComponent(inquiryId)}`).catch(() => null);

  if (!inquiry) {
    notFound();
  }

  return (
    <StorefrontFrame title={`Inquiry ${inquiry.inquiryNumber ?? inquiryId}`} description="Buyer-facing RFQ snapshot.">
      <section className="section">
        <div className="section-inner">
          <article className="info-card">
            <h2 style={{ marginTop: 0 }}>Status: {inquiry.status}</h2>
            <p className="section-description">{inquiry.summary ?? 'Your inquiry has been received.'}</p>
            <Link href="/contact" className="button-primary">Contact support</Link>
          </article>
        </div>
      </section>
    </StorefrontFrame>
  );
}
