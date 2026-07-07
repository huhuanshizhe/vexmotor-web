'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { InquiryMessageDialog } from '@/components/account/inquiry-message-dialog';
import type { AccountInquiryListItem } from '@/lib/inquiry-api';
import { withLocalePath } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDate(value: string | null, locale: Locale) {
  if (!value) {
    return '—';
  }
  return new Date(value).toLocaleDateString(locale);
}

function renderQuoteCell(quote: AccountInquiryListItem) {
  const isContact = quote.inquiryKind === 'contact';
  const hasValue = quote.valueLabel && !quote.valueLabel.toLowerCase().includes('pending') && quote.valueLabel !== 'Contact';
  return (
    <div className="account-quote-cell">
      <strong className="account-quote-cell__value">{isContact ? 'Contact' : hasValue ? quote.valueLabel : 'Pending quote'}</strong>
      <span className="account-quote-status-pill">{formatStatus(quote.status)}</span>
    </div>
  );
}

type AccountQuotesClientProps = {
  locale: Locale;
  initialQuotes: AccountInquiryListItem[];
  initialQuery?: string;
  initialStatus?: string;
};

export function AccountQuotesClient({
  locale,
  initialQuotes,
  initialQuery = '',
  initialStatus = 'all',
}: AccountQuotesClientProps) {
  const [messageTarget, setMessageTarget] = useState<AccountInquiryListItem | null>(null);

  const quotes = useMemo(() => {
    const query = initialQuery.trim().toLowerCase();
    return initialQuotes.filter((quote) => {
      const matchesStatus = initialStatus === 'all' || quote.status === initialStatus;
      const haystack = `${quote.quoteNumber ?? ''} ${quote.projectName}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [initialQuotes, initialQuery, initialStatus]);

  return (
    <>
      <article className="account-quote-table-card">
        <div className="account-quote-table-head">
          <span>Quote #</span>
          <span>Project</span>
          <span>Lines</span>
          <span>Created</span>
          <span>Quote</span>
          <span>Expires</span>
          <span>Actions</span>
        </div>

        {quotes.length ? quotes.map((quote) => {
          const quoteNumber = quote.quoteNumber ?? quote.id;
          const canConvert = quote.status === 'quoted' && Boolean(quote.quotedLines?.length) && quote.inquiryKind !== 'contact';

          return (
            <div key={quote.id} className="account-quote-table-row">
              <div className="account-quote-mono">{quoteNumber}</div>
              <div className="account-quote-table-project">
                <strong>{quote.projectName}</strong>
              </div>
              <span>{quote.inquiryKind === 'contact' ? '—' : quote.lineCount}</span>
              <span>{formatDate(quote.createdAt, locale)}</span>
              {renderQuoteCell(quote)}
              <span>{formatDate(quote.expiresAt, locale)}</span>
              <div className="account-quote-row-actions">
                <Link href={withLocalePath(`/account/quotes/${quoteNumber}`, locale)} className="account-quote-link">View</Link>
                {canConvert ? (
                  <Link href={withLocalePath(`/checkout?fromQuote=${quoteNumber}`, locale)} className="account-quote-link">Convert</Link>
                ) : null}
                <button type="button" className="account-quote-link" onClick={() => setMessageTarget(quote)}>Message</button>
              </div>
            </div>
          );
        }) : (
          <p className="account-quote-empty">No quotes match your filters yet.</p>
        )}
      </article>

      {messageTarget ? (
        <InquiryMessageDialog
          locale={locale}
          inquiryId={messageTarget.id}
          quoteNumber={messageTarget.quoteNumber ?? messageTarget.id}
          onClose={() => setMessageTarget(null)}
        />
      ) : null}
    </>
  );
}
