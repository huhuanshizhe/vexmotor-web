import Link from 'next/link';
import { formatStatValue, type ProductDocumentCard } from './shared';

type TabDownloadsProps = {
  documentCards: ProductDocumentCard[];
};

export function TabDownloads({ documentCards }: TabDownloadsProps) {
  const externalDocumentCount = documentCards.filter((d) => d.external).length;
  const requestDocumentCount = Math.max(documentCards.length - externalDocumentCount, 0);

  return (
    <article className="info-card detail-panel-card">
      <div className="detail-panel-heading">
        <div className="detail-panel-copy">
          <span className="card-kicker">Documentation pack</span>
          <h2 className="detail-panel-title">Datasheets, support files and request-based engineering documents.</h2>
        </div>
        <div className="detail-panel-badges">
          <span className="detail-panel-badge">{externalDocumentCount} live downloads</span>
          <span className="detail-panel-badge">{requestDocumentCount} request workflows</span>
        </div>
      </div>

      <div className="detail-summary-strip">
        <article className="detail-summary-tile">
          <strong>{formatStatValue(externalDocumentCount)}</strong>
          <span>Open now</span>
        </article>
        <article className="detail-summary-tile">
          <strong>{formatStatValue(requestDocumentCount)}</strong>
          <span>Request-based</span>
        </article>
        <article className="detail-summary-tile">
          <strong>{formatStatValue(documentCards.length)}</strong>
          <span>Total file paths</span>
        </article>
      </div>

      <div className="pdp-doc-grid">
        {documentCards.map((item) => (
          <article key={`${item.title}-${item.meta}`} className="pdp-doc-card">
            <span className="pdp-doc-card-meta">{item.meta}</span>
            <strong>{item.title}</strong>
            <p className="section-description compact-copy">{item.description}</p>
            {item.external ? (
              <a href={item.href} target="_blank" rel="noreferrer">Open file</a>
            ) : (
              <Link href={item.href}>Request file</Link>
            )}
          </article>
        ))}
      </div>
    </article>
  );
}
