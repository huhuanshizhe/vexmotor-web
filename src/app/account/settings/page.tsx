import { accountSettingsSections } from '@/lib/account-portal';

export default async function AccountSettingsPage() {
  return (
    <div className="account-panel-stack">
      <div className="section-header">
        <div>
          <h1 className="section-title">Settings</h1>
          <p className="section-description">Profile, security, active sessions, notifications, and admin-facing integration keys live here. High-risk actions still require current-password confirmation before they are made live.</p>
        </div>
      </div>

      <div className="account-company-grid">
        {accountSettingsSections.map((section) => (
          <article key={section.id} className="info-card">
            <div className="card-kicker">{section.title}</div>
            <h2 className="cart-section-title">{section.title}</h2>
            <div className="account-nav-list">
              {section.items.map((item) => (
                <div key={item.label} className="summary-stat">
                  <span className="summary-label">{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </article>
        ))}

        <article className="info-card">
          <div className="card-kicker">Danger zone</div>
          <h2 className="cart-section-title">High-risk actions</h2>
          <p className="section-description">Email change, password reset, API key rotation, and account deletion still require password confirmation before the change is committed.</p>
          <div className="trade-empty-actions">
            <a href="/support/contact?topic=sales" className="button-secondary">Rotate API key</a>
            <a href="/support/contact?topic=sales" className="button-primary">Delete account workflow</a>
          </div>
        </article>
      </div>
    </div>
  );
}