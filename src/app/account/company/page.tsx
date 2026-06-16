import Link from 'next/link';

import { accountCompanyProfile } from '@/lib/account-portal';

export default async function AccountCompanyPage() {
  return (
    <div className="account-panel-stack">
      <div className="section-header">
        <div>
          <h1 className="section-title">Company profile</h1>
          <p className="section-description">Manage company identity, tax and trade IDs, verification documents, credit posture, and the team members who share sourcing workflows.</p>
        </div>
      </div>

      <div className="account-company-grid">
        <article className="info-card">
          <div className="card-kicker">Company info</div>
          <h2 className="cart-section-title">Registered business details</h2>
          <div className="account-nav-list">
            {accountCompanyProfile.companyInfo.map((item) => (
              <div key={item.label} className="summary-stat">
                <span className="summary-label">{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="info-card">
          <div className="card-kicker">Tax and trade IDs</div>
          <h2 className="cart-section-title">IDs that affect billing and customs</h2>
          <div className="account-nav-list">
            {accountCompanyProfile.taxIds.map((item) => (
              <div key={item.label} className="summary-stat">
                <span className="summary-label">{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="info-card">
          <div className="card-kicker">Verification</div>
          <h2 className="cart-section-title">Qualification documents</h2>
          <div className="account-nav-list">
            {accountCompanyProfile.verificationDocuments.map((item) => (
              <div key={item.name} className="summary-stat">
                <span className="summary-label">{item.status}</span>
                <strong>{item.name}</strong>
                <span className="section-description compact-copy">{item.note}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="info-card">
          <div className="card-kicker">Credit and terms</div>
          <h2 className="cart-section-title">Payment posture</h2>
          <div className="account-summary-grid">
            <article className="summary-stat">
              <span className="summary-label">Payment terms</span>
              <strong>{accountCompanyProfile.credit.paymentTerms}</strong>
            </article>
            <article className="summary-stat">
              <span className="summary-label">Credit limit</span>
              <strong>{accountCompanyProfile.credit.creditLimit}</strong>
            </article>
            <article className="summary-stat">
              <span className="summary-label">Available credit</span>
              <strong>{accountCompanyProfile.credit.availableCredit}</strong>
            </article>
          </div>
          <p className="section-description">{accountCompanyProfile.credit.note}</p>
          <Link href="/support/contact?topic=sales" className="section-link">Apply for credit</Link>
        </article>

        <article className="info-card">
          <div className="card-kicker">Shipping defaults</div>
          <h2 className="cart-section-title">Incoterm and courier preferences</h2>
          <div className="account-nav-list">
            {accountCompanyProfile.shippingDefaults.map((item) => (
              <div key={item.label} className="summary-stat">
                <span className="summary-label">{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="info-card" id="team">
          <div className="card-kicker">Team members</div>
          <h2 className="cart-section-title">Shared access and roles</h2>
          <div className="account-nav-list">
            {accountCompanyProfile.teamMembers.map((member) => (
              <div key={member.email} className="summary-stat">
                <span className="summary-label">{member.role}</span>
                <strong>{member.name}</strong>
                <span className="section-description compact-copy">{member.email}</span>
              </div>
            ))}
          </div>
          <div className="trade-empty-actions">
            <Link href="/support/contact?topic=partnership" className="button-secondary">Invite teammate</Link>
            <Link href="/account/settings" className="button-primary">Review permissions</Link>
          </div>
        </article>
      </div>
    </div>
  );
}