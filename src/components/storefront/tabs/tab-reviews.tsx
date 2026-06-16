import Link from 'next/link';

type TabReviewsProps = {
  quoteHref: string;
  contactPath: string;
};

export function TabReviews({ quoteHref, contactPath }: TabReviewsProps) {
  return (
    <article className="info-card detail-panel-card">
      <div className="detail-panel-heading">
        <div className="detail-panel-copy">
          <span className="card-kicker">Field feedback</span>
          <h2 className="detail-panel-title">Application notes and buyer feedback are handled through a guided review loop.</h2>
        </div>
        <div className="detail-panel-badges">
          <span className="detail-panel-badge">No public reviews yet</span>
        </div>
      </div>

      <div className="field-feedback-hero">
        <p className="section-description">This SKU has not accumulated enough published buyer reviews yet, but we can still support validation through engineering dialogue, sample evaluation and application-specific references.</p>
      </div>

      <div className="field-feedback-grid">
        <article className="field-feedback-card">
          <strong>Application matching</strong>
          <p>Discuss frame size, torque reserve, driver pairing and load profile before release.</p>
        </article>
        <article className="field-feedback-card">
          <strong>Pilot sample feedback</strong>
          <p>Use sample runs to confirm vibration, temperature and mounting suitability in the real machine.</p>
        </article>
        <article className="field-feedback-card">
          <strong>Procurement handoff</strong>
          <p>Once validated, we align the same SKU or custom derivative into sample, pilot and batch purchasing.</p>
        </article>
      </div>

      <div className="field-feedback-actions">
        <Link href={contactPath} className="button-secondary">Contact us with your application</Link>
        <Link href={quoteHref} className="detail-inline-link">Request evaluation support</Link>
      </div>
    </article>
  );
}
