import Link from 'next/link';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { JsonLdScript } from '@/components/seo/json-ld';
import { careerBenefits, careerHiringProcess, careerRoles, careerValues } from '@/lib/careers';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
  title: 'Careers — STEPMOTECH',
  description: 'Open roles, company values, benefits, hiring process, and application path for careers at STEPMOTECH.',
  path: '/company/careers',
    locale,
  });
}

export default async function CompanyCareersPage() {
  const { locale } = await getServerSitePreferences();
  const applyEmailPath = 'mailto:support@stepmotech.online?subject=Career%20Application%20-%20STEPMOTECH';
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { name: 'Home', path: '/' },
      { name: 'About', path: '/company/about' },
      { name: 'Careers', path: '/company/careers' },
    ],
    locale,
  );
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'STEPMOTECH Careers',
    description: 'Open roles, company values, and hiring-process overview for current recruiting.',
  };

  return (
    <StorefrontFrame
      eyebrow="Company"
      title="Careers across channel growth, engineering support, and factory-linked operations."
      description="Join the teams that connect catalog commerce, motion engineering, logistics discipline, and global buyer support into one operating system."
      actions={
        <>
          <a href="#open-roles" className="button-primary">
            View Open Roles
          </a>
          <a href={applyEmailPath} className="button-secondary page-button-secondary-dark">
            Apply by Email
          </a>
        </>
      }
    >
      <JsonLdScript id="company-careers-breadcrumb-jsonld" data={breadcrumbJsonLd} />
      <JsonLdScript id="company-careers-collection-jsonld" data={collectionJsonLd} />

      <section className="section">
        <div className="section-inner trust-grid">
          {careerValues.map((item) => (
            <article key={item.title} className="trust-card">
              <div className="card-kicker">Value</div>
              <strong className="about-stat">{item.title}</strong>
              <span className="section-description compact-copy">{item.detail}</span>
            </article>
          ))}
        </div>
      </section>

      <section id="open-roles" className="section">
        <div className="section-inner">
          <div className="section-header">
            <div>
              <h2 className="section-title">Open roles</h2>
              <p className="section-description">Browse current openings by department, location, and working mode, then open the full JD page for details and application instructions.</p>
            </div>
          </div>

          <div className="product-grid">
            {careerRoles.map((role) => (
              <article key={role.slug} className="info-card">
                <div className="card-kicker">{role.department}</div>
                <h3 className="cart-section-title">{role.title}</h3>
                <p className="section-description compact-copy">{role.summary}</p>
                <div className="support-list">
                  <div className="support-item">
                    <span className="support-bullet" />
                    <span>Location: {role.location}</span>
                  </div>
                  <div className="support-item">
                    <span className="support-bullet" />
                    <span>Working mode: {role.remoteMode}</span>
                  </div>
                  <div className="support-item">
                    <span className="support-bullet" />
                    <span>Type: {role.type}</span>
                  </div>
                </div>
                <div className="trade-empty-actions">
                  <Link href={withLocalePath(`/company/careers/${role.slug}`, locale)} className="button-secondary">
                    View JD
                  </Link>
                  <a href={`mailto:${role.applyEmail}?subject=${encodeURIComponent(`Career Application - ${role.title}`)}`} className="section-link">
                    Apply by email
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner info-grid">
          <article className="info-card">
            <div className="card-kicker">Benefits</div>
            <h2 className="cart-section-title">Why teams join and stay</h2>
            <div className="support-list">
              {careerBenefits.map((item) => (
                <div key={item} className="support-item">
                  <span className="support-bullet" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="info-card">
            <div className="card-kicker">Hiring process</div>
            <h2 className="cart-section-title">What to expect after you apply</h2>
            <div className="support-list">
              {careerHiringProcess.map((item) => (
                <div key={item} className="support-item">
                  <span className="support-bullet" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="section-inner story-grid">
          <article className="story-card story-card-accent">
            <div className="card-kicker">Apply</div>
            <h2 className="section-title">Email application is the current intake path.</h2>
            <p className="section-description">Until a dedicated recruiting system is exposed on the site, applications route through the company email with the role title in the subject line so the hiring owner can triage quickly.</p>
          </article>

          <article className="story-card">
            <div className="card-kicker">Related company pages</div>
            <div className="inline-link-list">
              <Link href={withLocalePath('/company/factory', locale)} className="section-link">
                Factory & QC
              </Link>
              <Link href={withLocalePath('/company/distributors', locale)} className="section-link">
                Distributor Program
              </Link>
              <Link href={withLocalePath('/company/about', locale)} className="section-link">
                About STEPMOTECH
              </Link>
            </div>
          </article>
        </div>
      </section>
    </StorefrontFrame>
  );
}