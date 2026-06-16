type SupportArticleFeedbackProps = {
  articleTitle: string;
  articlePath: string;
  vote?: 'yes' | 'no' | null;
};

export function SupportArticleFeedback({ articleTitle, articlePath, vote = null }: SupportArticleFeedbackProps) {

  return (
    <article className="info-card support-feedback-card">
      <div>
        <div className="card-kicker">Feedback</div>
        <h2 className="cart-section-title">Was this article helpful?</h2>
        <p className="section-description">Use this quick feedback to decide whether you should continue browsing support content or move straight into contact support for {articleTitle}.</p>
      </div>

      <form action={articlePath} className="trade-empty-actions">
        <button type="submit" name="feedback" value="yes" className={`button-secondary support-feedback-button${vote === 'yes' ? ' is-active' : ''}`}>
          Yes
        </button>
        <button type="submit" name="feedback" value="no" className={`button-secondary support-feedback-button${vote === 'no' ? ' is-active' : ''}`}>
          No
        </button>
      </form>

      {vote ? (
        <p className={`form-feedback ${vote === 'yes' ? 'form-feedback-success' : 'form-feedback-error'}`}>
          {vote === 'yes' ? 'Good. You can keep this article as the reference path for the issue.' : 'Use Contact Support for a faster handoff when the article does not fully cover your case.'}
        </p>
      ) : null}
    </article>
  );
}