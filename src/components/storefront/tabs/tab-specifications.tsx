import { formatStatValue, type ProductDetailSpecGroup } from './shared';

type TabSpecificationsProps = {
  specGroups: ProductDetailSpecGroup[];
};

export function TabSpecifications({ specGroups }: TabSpecificationsProps) {
  const specRowCount = specGroups.reduce((total, g) => total + g.rows.length, 0);

  const dossierStats = [
    { label: 'Spec groups', value: formatStatValue(specGroups.length), note: 'Electrical, mechanical and commercial coverage' },
    { label: 'Data rows', value: formatStatValue(specRowCount), note: 'Normalized points for engineering and sourcing review' },
  ];

  return (
    <article className="info-card detail-panel-card">
      <div className="detail-panel-heading">
        <div className="detail-panel-copy">
          <span className="card-kicker">Specification dossier</span>
          <h3 className="detail-panel-title">Structured electrical, mechanical and commercial values.</h3>
        </div>
        <div className="detail-panel-badges">
          <span className="detail-panel-badge">{specGroups.length} groups</span>
          <span className="detail-panel-badge">{specRowCount} rows</span>
        </div>
      </div>

      <div className="detail-summary-strip">
        {dossierStats.map((item) => (
          <article key={item.label} className="detail-summary-tile">
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </article>
        ))}
      </div>

      <div className="pdp-spec-group-list">
        {specGroups.map((group) => (
          <section key={group.title} className="pdp-spec-group detail-group-card">
            <div className="pdp-spec-group-header detail-group-header">
              <div>
                <h3>{group.title}</h3>
                <p className="section-description compact-copy">{group.description}</p>
              </div>
              <span className="detail-panel-badge">{group.rows.length} rows</span>
            </div>

            <div className="spec-table">
              {group.rows.map((row) => (
                <div key={`${group.title}-${row.label}-${row.value}`} className="spec-row">
                  <span className="spec-label">{row.label}</span>
                  <strong className="spec-value">{row.value}</strong>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
