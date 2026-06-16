import Link from 'next/link';

import { accountSavedLists } from '@/lib/account-portal';

export default async function AccountListsPage() {
  return (
    <div className="account-panel-stack">
      <div className="section-header">
        <div>
          <h1 className="section-title">Saved lists</h1>
          <p className="section-description">Manage reusable BOMs, service kits, and reorder bundles that can move into cart, sample, or quote workflows without rebuilding the line items each time.</p>
        </div>
        <Link href="/products" className="button-primary">New list from catalog</Link>
      </div>

      <div className="account-company-grid">
        {accountSavedLists.map((list) => (
          <article key={list.id} className="info-card">
            <div className="product-card-top">
              <span className="product-badge">{list.scope}</span>
              <span className="product-meta">Updated {list.updatedAt}</span>
            </div>
            <h2>{list.name}</h2>
            <p className="section-description">{list.description}</p>
            <div className="knowledge-chip-row">
              {list.sharedWith.map((member) => (
                <span key={member} className="filter-chip">{member}</span>
              ))}
            </div>
            <div className="account-inline-actions">
              <span className="product-meta">{list.itemCount} items</span>
              <Link href={`/account/lists/${list.id}`} className="section-link">Open list</Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}