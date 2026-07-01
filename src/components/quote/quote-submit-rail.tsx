'use client';

type QuoteSubmitRailProps = {
  lineCount: number;
  projectName: string;
  annualVolumeEstimate: string;
  onSaveDraft: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  canSubmit: boolean;
  feedback: string | null;
};

export function QuoteSubmitRail({
  lineCount,
  projectName,
  annualVolumeEstimate,
  onSaveDraft,
  onSubmit,
  isSubmitting,
  canSubmit,
  feedback,
}: QuoteSubmitRailProps) {
  return (
    <aside className="quote-rfq-rail" aria-label="RFQ summary">
      <div className="quote-rfq-rail__inner">
        <div className="quote-rfq-rail__summary">
          <p className="quote-rfq-rail__eyebrow">RFQ summary</p>
          <div className="quote-rfq-rail__stats">
            <div>
              <span className="quote-rfq-rail__stat-label">Lines</span>
              <strong>{lineCount}</strong>
            </div>
            <div>
              <span className="quote-rfq-rail__stat-label">Project</span>
              <strong>{projectName.trim() || '—'}</strong>
            </div>
            <div>
              <span className="quote-rfq-rail__stat-label">Annual volume</span>
              <strong>{annualVolumeEstimate.trim() || '—'}</strong>
            </div>
          </div>
          <p className="quote-rfq-rail__note">Typical response within 1 business day.</p>
          {feedback ? <p className="quote-rfq-rail__feedback">{feedback}</p> : null}
        </div>
        <div className="quote-rfq-rail__actions">
          <button type="button" className="quote-rfq-rail__draft" onClick={onSaveDraft} disabled={isSubmitting}>
            Save draft
          </button>
          <button type="button" className="quote-rfq-rail__submit" onClick={onSubmit} disabled={isSubmitting || !canSubmit}>
            {isSubmitting ? 'Submitting…' : 'Submit RFQ'}
          </button>
        </div>
      </div>
    </aside>
  );
}
