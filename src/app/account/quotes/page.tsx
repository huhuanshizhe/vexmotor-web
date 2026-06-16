import Link from 'next/link';

import { accountQuoteRecords } from '@/lib/account-portal';

export default async function AccountQuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() ?? '';
  const status = params.status ?? 'all';
  const quotes = accountQuoteRecords.filter((quote) => {
    const matchesStatus = status === 'all' || quote.status === status;
    const matchesQuery = !query || `${quote.quoteNumber} ${quote.projectName} ${quote.projectSummary}`.toLowerCase().includes(query);
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="account-panel-stack">
      <div className="section-header">
        <div>
          <h1 className="section-title">Quotes</h1>
          <p className="section-description">Search project quotes, filter by status, and jump into a detail view that keeps the quoted lines, attachments, and message thread together.</p>
        </div>
      </div>

      <article className="info-card">
        <form action="/account/quotes" className="account-toolbar">
          <label className="knowledge-search-field">
            <span>Search project or quote</span>
            <input name="q" defaultValue={params.q} className="newsletter-input" placeholder="Search quote number or project" />
          </label>
          <label className="knowledge-search-field">
            <span>Status</span>
            <select name="status" defaultValue={status} className="form-input">
              <option value="all">All</option>
              <option value="Submitted">Submitted</option>
              <option value="Quoted">Quoted</option>
              <option value="Negotiating">Negotiating</option>
              <option value="Won">Won</option>
              <option value="Expired">Expired</option>
            </select>
          </label>
          <button type="submit" className="button-primary">Apply</button>
        </form>
      </article>

      <article className="info-card account-table-card">
        <div className="account-table-head">
          <span>Quote</span>
          <span>Project</span>
          <span>Lines</span>
          <span>Value</span>
          <span>Expires</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        {quotes.map((quote) => (
          <div key={quote.quoteNumber} className="account-table-row">
            <div>
              <strong>{quote.quoteNumber}</strong>
              <div className="product-meta">Owner: {quote.contactOwner}</div>
            </div>
            <div>
              <strong>{quote.projectName}</strong>
              <div className="section-description compact-copy">{quote.projectSummary}</div>
            </div>
            <span>{quote.lineCount}</span>
            <span>{quote.valueLabel}</span>
            <span>{quote.expiresAt}</span>
            <span className="product-badge">{quote.status}</span>
            <div className="account-inline-actions">
              <Link href={`/account/quotes/${quote.quoteNumber}`} className="nav-link">View</Link>
              <Link href={`/checkout?quote=${quote.quoteNumber}`} className="nav-link">Convert</Link>
              <Link href="/support/contact?topic=sales" className="nav-link">Message</Link>
            </div>
          </div>
        ))}
      </article>
    </div>
  );
}