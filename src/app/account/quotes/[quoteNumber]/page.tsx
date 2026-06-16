import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getAccountQuoteByNumber } from '@/lib/account-portal';

type AccountQuoteDetailPageProps = {
  params: Promise<{ quoteNumber: string }>;
};

export default async function AccountQuoteDetailPage({ params }: AccountQuoteDetailPageProps) {
  const { quoteNumber } = await params;
  const quote = getAccountQuoteByNumber(quoteNumber);

  if (!quote) {
    notFound();
  }

  return (
    <div className="account-panel-stack">
      <div className="section-header">
        <div>
          <h1 className="section-title">{quote.quoteNumber}</h1>
          <p className="section-description">{quote.projectName} · {quote.projectSummary}</p>
        </div>
        <div className="account-inline-actions">
          <span className="product-badge">{quote.status}</span>
          <span className="product-meta">Expires {quote.expiresAt}</span>
        </div>
      </div>

      <div className="account-summary-grid">
        <article className="summary-stat">
          <span className="summary-label">Quoted value</span>
          <strong>{quote.valueLabel}</strong>
        </article>
        <article className="summary-stat">
          <span className="summary-label">Lines</span>
          <strong>{quote.lineCount}</strong>
        </article>
        <article className="summary-stat">
          <span className="summary-label">Owner</span>
          <strong>{quote.contactOwner}</strong>
        </article>
        <article className="summary-stat">
          <span className="summary-label">Created</span>
          <strong>{quote.createdAt}</strong>
        </article>
      </div>

      <article className="info-card account-table-card">
        <div className="section-header trade-card-header">
          <div>
            <div className="card-kicker">Quoted lines</div>
            <h2 className="cart-section-title">Line-by-line review</h2>
          </div>
          <div className="account-inline-actions">
            <Link href={`/checkout?quote=${quote.quoteNumber}`} className="button-primary">Convert to order</Link>
            <Link href="/support/contact?topic=sales" className="button-secondary">Counter / message</Link>
          </div>
        </div>
        <div className="account-table-head">
          <span>SKU</span>
          <span>Description</span>
          <span>Qty</span>
          <span>Unit</span>
          <span>Lead time</span>
          <span>Note</span>
          <span>Actions</span>
        </div>
        {quote.lines.map((line) => (
          <div key={line.sku} className="account-table-row">
            <strong>{line.sku}</strong>
            <span>{line.description}</span>
            <span>{line.quantity}</span>
            <span>{line.unitLabel}</span>
            <span>{line.leadTime}</span>
            <span>{line.note}</span>
            <div className="account-inline-actions">
              <Link href="/support/contact?topic=sales" className="nav-link">Accept</Link>
              <Link href="/support/contact?topic=sales" className="nav-link">Counter</Link>
            </div>
          </div>
        ))}
      </article>

      <div className="info-grid account-company-grid">
        <article className="info-card">
          <div className="card-kicker">Attachments</div>
          <h2 className="cart-section-title">Project files</h2>
          <div className="account-nav-list">
            {quote.attachments.map((attachment) => (
              <a key={attachment.name} href={attachment.href} className="nav-link">
                {attachment.name} · {attachment.type}
              </a>
            ))}
          </div>
        </article>

        <article className="info-card">
          <div className="card-kicker">Close-out</div>
          <h2 className="cart-section-title">Next commercial step</h2>
          <p className="section-description">Use convert-to-order for accepted lines, or keep the thread active when the buyer needs a revised price, quantity, or ship split.</p>
          <div className="trade-empty-actions">
            <Link href={`/checkout?quote=${quote.quoteNumber}`} className="button-primary">Convert to order</Link>
            <Link href="/support/contact?topic=sales" className="button-secondary">Share lost reason / counter</Link>
          </div>
        </article>
      </div>

      <article className="info-card">
        <div className="card-kicker">Messages</div>
        <h2 className="cart-section-title">Buyer and engineer thread</h2>
        <div className="account-message-thread" role="log" aria-live="polite">
          {quote.messages.map((message) => (
            <article key={`${message.from}-${message.timestamp}`} className={`account-message-card${message.tone === 'internal' ? ' is-internal' : ''}`}>
              <div className="product-card-top">
                <strong>{message.from}</strong>
                <span className="product-meta">{message.role} · {message.timestamp}</span>
              </div>
              <p className="section-description compact-copy">{message.body}</p>
            </article>
          ))}
        </div>
      </article>
    </div>
  );
}