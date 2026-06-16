import Link from 'next/link';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { JsonLdScript } from '@/components/seo/json-ld';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata, buildOrganizationJsonLd } from '@/lib/seo';

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
    title: 'About STEPMOTECH — Precision Stepper Motors Engineered for Industrial Reliability',
    description: 'Factory-direct supplier of stepper motors, drivers, and matched motion systems. 100,000h MTBF, ±0.05° precision, IP67 options available.',
    path: '/company/about',
    type: 'website',
    locale,
  });
}

const milestones = [
  { year: '2009', label: 'Founded', detail: 'Started as a stepper-motor winding workshop serving regional automation builders.' },
  { year: '2014', label: 'Driver line', detail: 'Added matched driver and controller production to ship complete motion sets.' },
  { year: '2018', label: 'Export program', detail: 'Opened export-compliant logistics with duty-inclusive routes for OEM buyers.' },
  { year: '2022', label: 'Direct storefront', detail: 'Launched the direct catalog and RFQ platform for distributors and engineers.' },
  { year: '2026', label: 'Today', detail: 'A hybrid catalog and project-sourcing partner across global motion markets.' },
];

const stats = [
  { label: 'Employees', value: '200+' },
  { label: 'Factory area', value: '32,000 m²' },
  { label: 'Monthly capacity', value: '120k units' },
  { label: 'Customer countries', value: '60+' },
  { label: 'Catalog SKUs', value: '2,400+' },
  { label: 'MTBF Rating', value: '100,000h' },
];

const techHighlights = [
  { title: 'Precision That Scales', detail: '±0.05° step error at 3,000 RPM (ISO 230-2), outperforming NEMA 17-42 standards for CNC tool changers and optical alignment systems.' },
  { title: 'Thermal Consistency', detail: '<0.005% torque variance from -30°C to 120°C, with IP67 options validated in battery module assembly environments.' },
  { title: 'Energy-Efficient Innovation', detail: 'Patented coil design delivers 35% lower power consumption vs. conventional motors, proven in 24/7 pharmaceutical blister packaging lines.' },
  { title: 'Regenerative Braking', detail: 'Recovers 18% kinetic energy in automated warehouse shuttle systems.' },
  { title: 'Rugged Reliability', detail: '100,000h MTBF validated per MIL-HDBK-217F for semiconductor wafer transfer robots. Vacuum-ready operation at 10⁻⁶ mbar for cleanroom automation.' },
];

const industrySolutions = [
  { title: '3D Printing Systems', detail: '±0.0417mm linear repeatability in extrusion path control, reducing material waste by 19% in aerospace-grade composite printing.' },
  { title: 'Semiconductor Automation', detail: 'Vacuum-rated NEMA 23 motors with <0.008° angular deviation at 10⁻⁶ mbar for wafer transfer.' },
  { title: 'Medical Robotics', detail: 'FDA-compliant NEMA 17 motors enabling 72-hour continuous operation in surgical robotic arms.' },
  { title: 'Smart Logistics', detail: 'EtherCAT-synchronized motors driving warehouse robots with ±0.1mm positioning accuracy.' },
];

const values = [
  { title: 'Precision', detail: 'Specifications are measured, documented, and verifiable — not marketing rounding.' },
  { title: 'Engineering', detail: 'We support sizing decisions with real torque, inertia, and thermal guidance.' },
  { title: 'Customer', detail: 'Catalog speed for repeat orders, structured RFQ care for complex projects.' },
  { title: 'Sustainability', detail: 'Efficient drives and right-sized motors reduce energy and material waste.' },
];

const leadership = [
  { name: 'L. Wen', role: 'Chief Executive Officer', bio: 'Two decades in motion manufacturing, focused on factory-direct quality and export readiness.' },
  { name: 'M. Aigner', role: 'VP Engineering', bio: 'Leads motor and driver design, datasheet accuracy, and application sizing support.' },
  { name: 'S. Ferraro', role: 'Director of Customer Operations', bio: 'Owns the RFQ, credit, and after-sales experience for B2B accounts.' },
];

export default async function CompanyAboutPage() {
  const { locale } = await getServerSitePreferences();

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { name: 'Home', path: '/' },
      { name: 'Company', path: '/company/about' },
      { name: 'About', path: '/company/about' },
    ],
    locale,
  );

  return (
    <StorefrontFrame
      eyebrow="Company"
      title="Stepper Motors Engineered for Industrial Reliability"
      description="While stepper motors are rarely the headline of a factory tour, their precision defines every micro-movement in modern industry. At StepMotech, we deliver mission-critical motion control for applications where 0.05° accuracy impacts million-dollar production lines."
      actions={
        <>
          <Link href={withLocalePath('/products', locale)} className="button-primary">Browse Catalog</Link>
          <Link href={withLocalePath('/company/factory', locale)} className="button-secondary page-button-secondary-dark">Factory Tour</Link>
        </>
      }
    >
      <JsonLdScript id="company-about-organization-jsonld" data={buildOrganizationJsonLd()} />
      <JsonLdScript id="company-about-breadcrumb-jsonld" data={breadcrumbJsonLd} />

      <section className="section">
        <div className="section-inner">
          <div className="section-header">
            <div>
              <h2 className="section-title">Technical Superiority</h2>
              <p className="section-description">Engineering-grade performance data that sets our motion products apart.</p>
            </div>
          </div>
          <div className="trust-grid">
            {techHighlights.map((item) => (
              <article key={item.title} className="trust-card">
                <div className="card-kicker">{item.title}</div>
                <p className="section-description" style={{ marginBottom: 0 }}>{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <div className="section-header">
            <div>
              <h2 className="section-title">Industry-Proven Solutions</h2>
              <p className="section-description">Real-world applications where precision motion control makes the difference.</p>
            </div>
          </div>
          <div className="trust-grid">
            {industrySolutions.map((item) => (
              <article key={item.title} className="trust-card">
                <div className="card-kicker">{item.title}</div>
                <p className="section-description" style={{ marginBottom: 0 }}>{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <div className="section-header">
            <div>
              <h2 className="section-title">By the Numbers</h2>
              <p className="section-description">A snapshot of the manufacturing and commercial footprint behind every order.</p>
            </div>
          </div>
          <div className="trust-grid about-stat-grid">
            {stats.map((item) => (
              <article key={item.label} className="trust-card">
                <strong className="about-stat">{item.value}</strong>
                <div className="card-kicker">{item.label}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <div className="section-header">
            <div>
              <h2 className="section-title">Our Story</h2>
              <p className="section-description">From a single winding workshop to a direct global motion supplier.</p>
            </div>
          </div>
          <div className="about-timeline">
            {milestones.map((item) => (
              <article key={item.year} className="about-timeline-item">
                <strong className="about-timeline-year">{item.year}</strong>
                <div>
                  <div className="card-kicker">{item.label}</div>
                  <p className="section-description" style={{ margin: 0 }}>{item.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <div className="section-header">
            <div>
              <h2 className="section-title">Rooted in Industrial Excellence</h2>
              <p className="section-description">As a technology spin-off from FA Dreamworks Limited — the automation backbone for Fortune 500 manufacturers — we inherit 20 years of mission-critical engineering (IATF 16949 / ISO 13849 certified). Zero-compromise DNA with 72hr rapid prototyping for NEMA 8-34 customizations.</p>
            </div>
          </div>
          <div className="story-grid">
            <article className="story-card">
              <div className="card-kicker">Engineering DNA</div>
              <p className="section-description">Backed by 200+ engineers in Hong Kong, with 15+ new regional centers planned across the US, EMEA, and LATAM over the next 3 years.</p>
            </article>
            <article className="story-card story-card-accent">
              <div className="card-kicker">Global Scale</div>
              <p className="section-description">Multi-warehouse fulfillment across Asia, Europe, North America, and Australia — including the US, Germany, UK, Australia, Poland, Japan, France, and China.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <div className="section-header">
            <div>
              <h2 className="section-title">Leadership</h2>
              <p className="section-description">The team accountable for product quality, engineering support, and customer operations.</p>
            </div>
          </div>
          <div className="trust-grid">
            {leadership.map((person) => (
              <article key={person.name} className="trust-card">
                <div className="about-avatar" aria-hidden="true">{person.name.charAt(0)}</div>
                <strong>{person.name}</strong>
                <div className="card-kicker">{person.role}</div>
                <p className="section-description" style={{ marginBottom: 0 }}>{person.bio}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <div className="section-header">
            <div>
              <h2 className="section-title">What We Value</h2>
              <p className="section-description">Principles that shape how we engineer, document, and support motion products.</p>
            </div>
          </div>
          <div className="trust-grid">
            {values.map((value) => (
              <article key={value.title} className="trust-card">
                <div className="card-kicker">{value.title}</div>
                <p className="section-description" style={{ marginBottom: 0 }}>{value.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner story-grid">
          <article className="story-card story-card-accent">
            <div className="card-kicker">Join or visit</div>
            <h2 className="section-title">Work with us or see how it's built.</h2>
            <p className="section-description">Explore open roles or book a factory tour to review the production process behind our motion systems.</p>
            <div className="trade-empty-actions">
              <Link href={withLocalePath('/company/careers', locale)} className="button-primary">View Careers</Link>
              <Link href={withLocalePath('/company/factory', locale)} className="button-secondary page-button-secondary-dark">Factory Tour</Link>
            </div>
          </article>
        </div>
      </section>
    </StorefrontFrame>
  );
}
