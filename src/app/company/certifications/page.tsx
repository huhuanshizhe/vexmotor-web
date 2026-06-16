import Link from 'next/link';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { JsonLdScript } from '@/components/seo/json-ld';
import { certificationRecords, exportComplianceNotes, restrictedCountryNotes } from '@/lib/certifications';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
  title: 'Certifications & Compliance — STEPMOTECH',
  description: 'Certification summaries, export-compliance notes, restricted-destination guidance, and downloadable compliance files for regulated buyer review.',
  path: '/company/certifications',
    locale,
  });
}

export default async function CompanyCertificationsPage() {
  const { locale } = await getServerSitePreferences();
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { name: 'Home', path: '/' },
      { name: 'About', path: '/company/about' },
      { name: 'Certifications', path: '/company/certifications' },
    ],
    locale,
  );
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Certifications & Compliance',
    description: 'Reference certification summaries and export-compliance notes for industrial buyer review.',
    inLanguage: locale,
    hasPart: certificationRecords.map((r) => ({
      '@type': 'Certification',
      name: r.title,
      identifier: r.code,
      issuedBy: r.issuer,
      about: r.applicableLines.join(', '),
    })),
  };
  const compliancePackPath = withLocalePath('/company/certifications/download-pack', locale);
  const technicalSupportPath = withLocalePath('/support/contact?topic=technical', locale);
  const officesPath = withLocalePath('/company/offices', locale);

  return (
    <StorefrontFrame
      eyebrow="Company"
      title="Certifications and compliance references for qualification-led motion sourcing."
      description="Use this page to review the main certification families, export-compliance notes, and downloadable reference files before a regulated build, supplier audit, or documentation-heavy RFQ."
      actions={
        <>
          <a href={compliancePackPath} className="button-primary">
            Download Compliance Pack
          </a>
          <Link href={technicalSupportPath} className="button-secondary page-button-secondary-dark">
            Request Signed Files
          </Link>
        </>
      }
    >
      <JsonLdScript id="certifications-breadcrumb-jsonld" data={breadcrumbJsonLd} />
      <JsonLdScript id="certifications-collection-jsonld" data={collectionJsonLd} />

      <section className="section">
        <div className="section-inner shipping-overview-grid">
          <article className="summary-stat">
            <span className="summary-label">Certificate families</span>
            <strong>{certificationRecords.length}</strong>
            <span className="section-description compact-copy">CE, UL, RoHS, REACH, ISO9001, IATF, IP65, and IEC reference summaries are organized into one qualification view.</span>
          </article>
          <article className="summary-stat">
            <span className="summary-label">Export compliance</span>
            <strong>EAR99 / ECCN review</strong>
            <span className="section-description compact-copy">Export-classification routing remains part of commercial review when destination or end use makes it necessary.</span>
          </article>
          <article className="summary-stat">
            <span className="summary-label">Download format</span>
            <strong>PDF + ZIP</strong>
            <span className="section-description compact-copy">Each certification card has a reference PDF and the page also exposes a bundled compliance-pack ZIP.</span>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="section-inner certification-grid">
          {certificationRecords.map((record) => (
            <article key={record.slug} className="info-card certification-card">
              <div className="certification-badge-row">
                <span className="filter-chip">{record.code}</span>
                <span className="summary-label">Reference file</span>
              </div>
              <h2 className="cart-section-title">{record.title}</h2>
              <p className="section-description compact-copy">{record.summary}</p>
              <div className="support-list">
                <div className="support-item">
                  <span className="support-bullet" />
                  <span>Applicable lines: {record.applicableLines.join(', ')}</span>
                </div>
                <div className="support-item">
                  <span className="support-bullet" />
                  <span>Issuer route: {record.issuer}</span>
                </div>
              </div>
              <div className="trade-empty-actions">
                <a href={withLocalePath(`/company/certifications/download/${record.slug}`, locale)} className="button-secondary">
                  Download PDF
                </a>
                <Link href={technicalSupportPath} className="section-link">
                  Request audited file
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-inner trade-flow-grid">
          <article className="info-card certification-card">
            <div className="card-kicker">Export compliance</div>
            <h2 className="cart-section-title">EAR99 / ECCN overview</h2>
            <div className="support-list">
              {exportComplianceNotes.map((item) => (
                <div key={item} className="support-item">
                  <span className="support-bullet" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>

          <aside className="trade-side-stack">
            <article className="info-card certification-card">
              <div className="card-kicker">Restricted destinations</div>
              <h2 className="cart-section-title">Manual review triggers</h2>
              <div className="support-list">
                {restrictedCountryNotes.map((item) => (
                  <div key={item} className="support-item">
                    <span className="support-bullet" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="info-card certification-card">
              <div className="card-kicker">Full bundle</div>
              <h2 className="cart-section-title">Download compliance pack</h2>
              <p className="section-description compact-copy">The ZIP bundle includes a certificate matrix, export notes, and a manifest that helps buyers organize qualification review before requesting signed audit files.</p>
              <div className="trade-empty-actions">
                <a href={compliancePackPath} className="button-primary">
                  Download ZIP
                </a>
                <Link href={officesPath} className="button-secondary">
                  Office Contacts
                </Link>
              </div>
            </article>
          </aside>
        </div>
      </section>
    </StorefrontFrame>
  );
}