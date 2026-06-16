import Link from 'next/link';

import { accountDownloadRecords } from '@/lib/account-portal';

export default async function AccountDownloadsPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; type?: string; language?: string }>;
}) {
  const params = await searchParams;
  const updatedOnly = params.updated === '1';
  const type = params.type ?? 'all';
  const language = params.language ?? 'all';
  const downloads = accountDownloadRecords.filter((record) => {
    const matchesUpdated = !updatedOnly || record.updated;
    const matchesType = type === 'all' || record.type === type;
    const matchesLanguage = language === 'all' || record.language === language;
    return matchesUpdated && matchesType && matchesLanguage;
  });
  const updatedCount = accountDownloadRecords.filter((record) => record.updated).length;

  return (
    <div className="account-panel-stack">
      <div className="section-header">
        <div>
          <h1 className="section-title">Downloads</h1>
          <p className="section-description">Centralize purchased and inquiry-linked documents so the team can pull the latest CAD, datasheet, checklist, and compliance files from one place.</p>
        </div>
      </div>

      <article className="account-review-banner">
        <strong>{updatedCount} updated documents available</strong>
        <p className="section-description">Use updated-only mode for the newest document revisions, or package the current delta into one ZIP for handoff.</p>
        <div className="trade-empty-actions">
          <Link href="/account/downloads?updated=1" className="button-secondary">Show updated only</Link>
          <a href="/account/downloads/bulk" className="button-primary">Download updated pack</a>
        </div>
      </article>

      <article className="info-card">
        <form action="/account/downloads" className="account-toolbar">
          <label className="knowledge-search-field">
            <span>Document type</span>
            <select name="type" defaultValue={type} className="form-input">
              <option value="all">All</option>
              <option value="Datasheet">Datasheet</option>
              <option value="CAD">CAD</option>
              <option value="Checklist pack">Checklist pack</option>
              <option value="Compliance">Compliance</option>
            </select>
          </label>
          <label className="knowledge-search-field">
            <span>Language</span>
            <select name="language" defaultValue={language} className="form-input">
              <option value="all">All</option>
              <option value="English">English</option>
              <option value="Chinese">Chinese</option>
            </select>
          </label>
          <label className="product-card-top">
            <input type="checkbox" name="updated" value="1" defaultChecked={updatedOnly} />
            <span>Show updated only</span>
          </label>
          <button type="submit" className="button-primary">Apply</button>
        </form>
      </article>

      <article className="info-card account-table-card">
        <div className="account-table-head">
          <span>File</span>
          <span>Type</span>
          <span>Version</span>
          <span>Language</span>
          <span>Size</span>
          <span>Updated</span>
          <span>Download</span>
        </div>
        {downloads.map((record) => (
          <div key={record.id} className="account-table-row">
            <div>
              <strong>{record.fileName}</strong>
              <div className="section-description compact-copy">{record.productLabel}</div>
            </div>
            <span>{record.type}</span>
            <span>{record.version}</span>
            <span>{record.language}</span>
            <span>{record.sizeLabel}</span>
            <span>{record.updated ? `${record.updatedAt} · New` : record.updatedAt}</span>
            <div className="account-inline-actions">
              <a href={record.href} className="nav-link">Download</a>
              <Link href={`/products/${record.productSlug}`} className="nav-link">Open SKU</Link>
            </div>
          </div>
        ))}
      </article>
    </div>
  );
}