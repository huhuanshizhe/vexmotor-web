import Link from 'next/link';
import type { ProductDetailImage } from './shared';

type TabDimensionsProps = {
  dimensionImages: ProductDetailImage[];
  dimensionDocumentHref?: string;
  quoteHref: string;
};

export function TabDimensions({ dimensionImages, dimensionDocumentHref, quoteHref }: TabDimensionsProps) {
  return (
    <article className="info-card detail-panel-card">
      <div className="detail-panel-heading">
        <div className="detail-panel-copy">
          <span className="card-kicker">Mechanical verification</span>
          <h2 className="detail-panel-title">Dimensional drawings for integration, mounting and enclosure checks.</h2>
        </div>
        <div className="detail-panel-badges">
          <span className="detail-panel-badge">{dimensionImages.length || (dimensionDocumentHref ? 1 : 0)} reference source</span>
          {dimensionDocumentHref ? (
            <a href={dimensionDocumentHref} target="_blank" rel="noreferrer" className="detail-tab-link">Source PDF</a>
          ) : null}
        </div>
      </div>

      <div className="dimensions-gallery">
        {dimensionImages.length ? (
          dimensionImages.map((image, i) => (
            <figure key={`${image.url}-${i}`} className="detail-media-card">
              <img src={image.url} alt={image.alt || 'Dimension drawing'} className="detail-media-image" loading="lazy" />
            </figure>
          ))
        ) : dimensionDocumentHref ? (
          <div className="dimension-placeholder">
            <p>Legacy dimension drawings are available in the original technical file package.</p>
            <a href={dimensionDocumentHref} target="_blank" rel="noreferrer" className="button-secondary">Open dimension reference</a>
          </div>
        ) : (
          <div className="dimension-placeholder">
            <p>Dimensional drawings will be available upon request.</p>
            <Link href={quoteHref} className="button-secondary">Request dimension drawings</Link>
          </div>
        )}
      </div>
    </article>
  );
}
