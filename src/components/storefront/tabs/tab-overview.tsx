import Link from 'next/link';
import { extractOverviewContent, type ProductDetailSpecGroup, type ProductDocumentCard } from './shared';

type TabOverviewProps = {
  description: string;
  specGroups: ProductDetailSpecGroup[];
  externalDocumentCount: number;
  quoteHref: string;
  customHref: string;
};

export function TabOverview({ description, specGroups, externalDocumentCount, quoteHref, customHref }: TabOverviewProps) {
  const overviewContent = extractOverviewContent(description);

  return (
    <div className="detail-overview-layout">
      <article className="info-card detail-panel-card">
        <div className="detail-panel-heading">
          <div className="detail-panel-copy">
            <span className="card-kicker">Engineering brief</span>
            <h3 className="detail-panel-title">Overview of fit, motion behavior and sourcing context.</h3>
          </div>
          <div className="detail-panel-badges">
            <span className="detail-panel-badge">{specGroups.length} spec groups</span>
            <span className="detail-panel-badge">{externalDocumentCount} live files</span>
          </div>
        </div>

        <div className="product-description-content detail-copy-stack">
          {overviewContent.leadParagraphs.map((p, i) => (
            <p key={`${p.slice(0, 32)}-${i}`}>{p}</p>
          ))}

          {overviewContent.notes.length ? (
            <div className="detail-overview-notes">
              {overviewContent.notes.map((note) => (
                <article key={note.title} className="detail-overview-note">
                  <span className="summary-label">{note.title}</span>
                  {note.kind === 'chips' ? (
                    <div className="detail-note-chip-list">
                      {note.items?.map((item) => (
                        <span key={item} className="detail-note-chip">{item}</span>
                      ))}
                    </div>
                  ) : (
                    <div className="detail-note-copy">
                      {note.paragraphs?.map((p, i) => (
                        <p key={`${note.title}-${i}`}>{p}</p>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </article>

      <aside className="info-card detail-rail-card">
        <div className="detail-rail-section">
          <span className="card-kicker">Review priorities</span>
          <ul className="detail-rail-list">
            {specGroups.slice(0, 4).map((group) => (
              <li key={group.title}>
                <strong>{group.title}</strong>
                <span>{group.rows.length} data lines</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="detail-rail-section">
          <span className="card-kicker">Next step</span>
          <p className="section-description compact-copy">Use drawings and torque curves to confirm mechanical fit before sending the SKU into procurement or a custom review.</p>
          <div className="detail-rail-actions">
            <Link href={quoteHref} className="button-secondary">Request technical review</Link>
            <Link href={customHref} className="detail-inline-link">Open custom program</Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
