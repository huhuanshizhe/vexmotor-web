'use client';

import { useEffect, useState } from 'react';

import { AccountQuotesClient } from '@/components/account/account-quotes-client';
import { useAuth } from '@/components/providers/auth-provider';
import { fetchInquiries, type AccountInquiryListItem } from '@/lib/inquiry-api';
import { useTranslation } from '@/lib/i18n-context';

export default function AccountQuotesPage() {
  const { user } = useAuth();
  const { locale } = useTranslation();
  const [quotes, setQuotes] = useState<AccountInquiryListItem[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    if (!user) {
      return;
    }
    void fetchInquiries()
      .then(setQuotes)
      .catch(() => setQuotes([]));
  }, [user]);

  return (
      <div className="account-quote-page">
      <div className="account-quote-page__header">
        <div>
          <p className="account-quote-kicker">Account</p>
          <h1 className="account-quote-page__title">Quotes</h1>
          <p className="account-quote-page__desc">Search project quotes, filter by status, and open detail views with quoted lines and attachments.</p>
        </div>
      </div>

      <article className="account-quote-filters">
        <div className="account-toolbar">
          <label className="account-quote-filter-field">
            <span>Search project or quote</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="account-quote-input"
              placeholder="Search quote number or project"
            />
          </label>
          <label className="account-quote-filter-field">
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="account-quote-input">
              <option value="all">All</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="quoted">Quoted</option>
              <option value="closed">Closed</option>
            </select>
          </label>
        </div>
      </article>

      <AccountQuotesClient locale={locale} initialQuotes={quotes} initialQuery={query} initialStatus={status} />
    </div>
  );
}
