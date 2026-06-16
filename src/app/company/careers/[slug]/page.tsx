import Link from 'next/link';
import { notFound } from 'next/navigation';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { JsonLdScript } from '@/components/seo/json-ld';
import { careerRoles, getCareerRoleBySlug } from '@/lib/careers';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';

export async function generateStaticParams() {
  return careerRoles.map((role) => ({ slug: role.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { locale } = await getServerSitePreferences();
  const { slug } = await params;
  const role = getCareerRoleBySlug(slug);

  if (!role) {
    return buildMetadata({ title: 'Careers — STEPMOTECH', path: '/company/careers', locale, noIndex: true });
  }

  return buildMetadata({
    title: `${role.title} — Careers — STEPMOTECH`,
    description: role.summary,
    path: `/company/careers/${role.slug}`,
    type: 'article',
    locale,
  });
}

export default async function CareerRoleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ slug }, { locale }] = await Promise.all([params, getServerSitePreferences()]);
  const role = getCareerRoleBySlug(slug);

  if (!role) {
    notFound();
  }

  const applyPath = `mailto:${role.applyEmail}?subject=${encodeURIComponent(`Career Application - ${role.title}`)}`;
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { name: 'Home', path: '/' },
      { name: 'Careers', path: '/company/careers' },
      { name: role.title, path: `/company/careers/${role.slug}` },
    ],
    locale,
  );
  const jobPostingJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: role.title,
    description: role.summary,
    employmentType: role.type,
    hiringOrganization: {
      '@type': 'Organization',
      name: 'STEPMOTECH',
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: role.location,
        addressCountry: 'CN',
      },
    },
    applicantLocationRequirements: role.remoteMode,
  };

  return (
    <StorefrontFrame
      eyebrow="Careers"
      title={role.title}
      description={role.summary}
      actions={
        <>
          <a href={applyPath} className="button-primary">
            Apply by Email
          </a>
          <Link href={withLocalePath('/company/careers', locale)} className="button-secondary page-button-secondary-dark">
            All Open Roles
          </Link>
        </>
      }
    >
      <JsonLdScript id="career-role-breadcrumb-jsonld" data={breadcrumbJsonLd} />
      <JsonLdScript id="career-role-jobposting-jsonld" data={jobPostingJsonLd} />

      <section className="section">
        <div className="section-inner trust-grid">
          <article className="trust-card">
            <div className="card-kicker">Department</div>
            <strong className="about-stat">{role.department}</strong>
          </article>
          <article className="trust-card">
            <div className="card-kicker">Location</div>
            <strong className="about-stat">{role.location}</strong>
          </article>
          <article className="trust-card">
            <div className="card-kicker">Working mode</div>
            <strong className="about-stat">{role.remoteMode}</strong>
          </article>
          <article className="trust-card">
            <div className="card-kicker">Employment type</div>
            <strong className="about-stat">{role.type}</strong>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="section-inner info-grid">
          <article className="info-card">
            <div className="card-kicker">Responsibilities</div>
            <h2 className="cart-section-title">What you will own</h2>
            <div className="support-list">
              {role.responsibilities.map((item) => (
                <div key={item} className="support-item">
                  <span className="support-bullet" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="info-card">
            <div className="card-kicker">Requirements</div>
            <h2 className="cart-section-title">What we need from the role</h2>
            <div className="support-list">
              {role.requirements.map((item) => (
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
            <div className="card-kicker">Compensation</div>
            <h2 className="section-title">Package summary</h2>
            <p className="section-description">{role.compensation}</p>
          </article>

          <article className="story-card">
            <div className="card-kicker">Apply</div>
            <p className="section-description">Send your application, role title, and a short note on relevant experience to the current recruiting inbox. The hiring team will route follow-up from there.</p>
            <div className="trade-empty-actions">
              <a href={applyPath} className="button-secondary">
                Email Application
              </a>
            </div>
          </article>
        </div>
      </section>
    </StorefrontFrame>
  );
}