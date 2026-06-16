import Link from 'next/link';

import { accountInvoiceRecords } from '@/lib/account-portal';

export default async function AccountInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; currency?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? 'all';
  const currency = params.currency ?? 'all';
  const invoices = accountInvoiceRecords.filter((invoice) => {
    const matchesStatus = status === 'all' || invoice.status === status;
    const matchesCurrency = currency === 'all' || invoice.currency === currency;
    return matchesStatus && matchesCurrency;
  });
  const dueCount = accountInvoiceRecords.filter((invoice) => invoice.status === 'Due').length;
  const overdueCount = accountInvoiceRecords.filter((invoice) => invoice.status === 'Overdue').length;

  return (
    <div className="account-panel-stack">
      {overdueCount ? (
        <article className="account-overdue-banner" aria-live="polite">
          <strong>{overdueCount} overdue invoice{overdueCount === 1 ? '' : 's'}</strong>
          <p className="section-description">Outstanding invoices older than seven days should be resolved before the next consolidated release or Net30 extension request.</p>
        </article>
      ) : null}

      <div className="section-header">
        <div>
          <h1 className="section-title">Invoices</h1>
          <p className="section-description">Review payable status, export accounting-ready invoice PDFs, and route due items into the next payment run.</p>
        </div>
      </div>

      <div className="account-summary-grid">
        <article className="summary-stat">
          <span className="summary-label">Due now</span>
          <strong>{dueCount}</strong>
        </article>
        <article className="summary-stat">
          <span className="summary-label">Overdue</span>
          <strong>{overdueCount}</strong>
        </article>
        <article className="summary-stat">
          <span className="summary-label">Paid</span>
          <strong>{accountInvoiceRecords.filter((invoice) => invoice.status === 'Paid').length}</strong>
        </article>
      </div>

      <article className="info-card">
        <form action="/account/invoices" className="account-toolbar">
          <label className="knowledge-search-field">
            <span>Status</span>
            <select name="status" defaultValue={status} className="form-input">
              <option value="all">All</option>
              <option value="Paid">Paid</option>
              <option value="Due">Due</option>
              <option value="Overdue">Overdue</option>
            </select>
          </label>
          <label className="knowledge-search-field">
            <span>Currency</span>
            <select name="currency" defaultValue={currency} className="form-input">
              <option value="all">All</option>
              <option value="USD">USD</option>
            </select>
          </label>
          <button type="submit" className="button-primary">Apply</button>
        </form>
      </article>

      <article className="info-card account-table-card">
        <div className="account-table-head">
          <span>Invoice</span>
          <span>Date</span>
          <span>Order</span>
          <span>Amount</span>
          <span>Currency</span>
          <span>Due date</span>
          <span>Actions</span>
        </div>
        {invoices.map((invoice) => (
          <div key={invoice.invoiceNumber} className="account-table-row">
            <div>
              <strong>{invoice.invoiceNumber}</strong>
              <div className="product-badge">{invoice.status}</div>
            </div>
            <span>{invoice.date}</span>
            <span>{invoice.orderNumber}</span>
            <span>{invoice.amountLabel}</span>
            <span>{invoice.currency}</span>
            <span>{invoice.dueDate}</span>
            <div className="account-inline-actions">
              <a href={`/account/invoices/download/${invoice.invoiceNumber}`} className="nav-link">Download PDF</a>
              {invoice.status === 'Due' || invoice.status === 'Overdue' ? <Link href={`/checkout?invoice=${invoice.invoiceNumber}`} className="nav-link">Pay now</Link> : null}
            </div>
          </div>
        ))}
      </article>
    </div>
  );
}