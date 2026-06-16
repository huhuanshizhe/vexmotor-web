'use client';

import Link from 'next/link';
import { useDeferredValue, useMemo, useState } from 'react';

import { distributorCoverage } from '@/lib/distributors';
import type { Locale } from '@/lib/i18n';
import { withLocalePath } from '@/lib/i18n';

type DistributorFinderClientProps = {
  locale: Locale;
};

const REGION_FILTERS = [
  { label: 'All regions', value: 'all' },
  ...distributorCoverage.map((entry) => ({ label: entry.region, value: entry.id })),
];

export function DistributorFinderClient({ locale }: DistributorFinderClientProps) {
  const [regionFilter, setRegionFilter] = useState('all');
  const [countryQuery, setCountryQuery] = useState('');
  const deferredCountryQuery = useDeferredValue(countryQuery.trim().toLowerCase());
  const partnershipPath = withLocalePath('/support/contact?topic=partnership', locale);

  const matches = useMemo(() => {
    return distributorCoverage.filter((entry) => {
      const matchesRegion = regionFilter === 'all' || entry.id === regionFilter;
      if (!matchesRegion) {
        return false;
      }

      if (!deferredCountryQuery) {
        return true;
      }

      return entry.region.toLowerCase().includes(deferredCountryQuery) || entry.countries.some((country) => country.toLowerCase().includes(deferredCountryQuery));
    });
  }, [deferredCountryQuery, regionFilter]);

  return (
    <article className="info-card distributor-finder-card">
      <div className="section-header trade-card-header">
        <div>
          <div className="card-kicker">Find a distributor</div>
          <h2 className="cart-section-title">Search by country or regional coverage lane</h2>
          <p className="section-description">Start with the region filter, then narrow by country or market name to find the closest channel route currently documented on the storefront.</p>
        </div>
      </div>

      <div className="custom-form-grid">
        <label className="form-field">
          <span>Region</span>
          <select className="form-input" value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)}>
            {REGION_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span>Country or market</span>
          <input
            className="form-input"
            value={countryQuery}
            onChange={(event) => setCountryQuery(event.target.value)}
            placeholder="Germany, Brazil, Middle East..."
          />
        </label>
      </div>

      <div className="distributor-filter-meta">
        <span className="summary-label">Matching routes</span>
        <strong>{matches.length}</strong>
      </div>

      <div className="distributor-results-grid">
        {matches.length ? (
          matches.map((entry) => (
            <article key={entry.id} className="info-card distributor-coverage-card">
              <div className="certification-badge-row">
                <span className="filter-chip">{entry.region}</span>
                <span className="summary-label">Regional desk</span>
              </div>
              <h3 className="cart-section-title">{entry.desk}</h3>
              <p className="section-description compact-copy">{entry.note}</p>
              <div className="support-list">
                <div className="support-item">
                  <span className="support-bullet" />
                  <span>Warehouse route: {entry.warehouse}</span>
                </div>
                <div className="support-item">
                  <span className="support-bullet" />
                  <span>Support lane: {entry.lead}</span>
                </div>
              </div>
              <p className="distributor-country-copy">Coverage: {entry.countries.join(', ')}</p>
              <Link href={partnershipPath} className="section-link">
                Open partnership intake
              </Link>
            </article>
          ))
        ) : (
          <article className="info-card distributor-coverage-card">
            <div className="card-kicker">No exact match yet</div>
            <h3 className="cart-section-title">Request manual channel routing</h3>
            <p className="section-description compact-copy">If your country is not listed, use the partnership intake so the commercial team can map the right distributor or direct support path manually.</p>
            <Link href={partnershipPath} className="button-secondary">
              Contact Partnership Desk
            </Link>
          </article>
        )}
      </div>
    </article>
  );
}