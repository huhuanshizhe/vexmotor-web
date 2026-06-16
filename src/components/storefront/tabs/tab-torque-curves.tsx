import Link from 'next/link';
import type { ProductDetailImage } from './shared';

type TorqueCurvePoint = { rpm: number; torque: number; voltage?: number; current?: number; power?: number };
type TorqueCurveDataset = { label: string; unit?: string; points: TorqueCurvePoint[] };

type TabTorqueCurvesProps = {
  torqueCurveImages: ProductDetailImage[];
  torqueCurveDocumentHref?: string;
  datasheetUrl?: string;
  quoteHref: string;
  torqueCurveData?: unknown | null;
};

function parseTorqueCurveData(data: unknown): TorqueCurveDataset[] | null {
  if (!data || typeof data !== 'object') return null;
  const obj = data as Record<string, unknown>;
  const datasets = Array.isArray(obj.datasets) ? obj.datasets : Array.isArray(obj) ? obj : null;
  if (!datasets) return null;
  return datasets.filter(
    (d: unknown) => d && typeof d === 'object' && Array.isArray((d as Record<string, unknown>).points),
  ) as TorqueCurveDataset[];
}

export function TabTorqueCurves({ torqueCurveImages, torqueCurveDocumentHref, datasheetUrl, quoteHref, torqueCurveData }: TabTorqueCurvesProps) {
  const hasCurveSource = torqueCurveDocumentHref || datasheetUrl;
  const datasets = parseTorqueCurveData(torqueCurveData);
  const hasStructuredData = datasets && datasets.length > 0;

  return (
    <article className="info-card detail-panel-card">
      <div className="detail-panel-heading">
        <div className="detail-panel-copy">
          <span className="card-kicker">Performance validation</span>
          <h2 className="detail-panel-title">Torque-speed curves for driver sizing and operating-speed review.</h2>
        </div>
        <div className="detail-panel-badges">
          <span className="detail-panel-badge">
            {torqueCurveImages.length || (hasCurveSource ? 1 : 0) || (hasStructuredData ? datasets.length : 0)} curve source
          </span>
          {hasCurveSource ? (
            <a href={torqueCurveDocumentHref || datasheetUrl} target="_blank" rel="noreferrer" className="detail-tab-link">Curve PDF</a>
          ) : null}
        </div>
      </div>

      {hasStructuredData && (
        <div className="torque-curve-data-table" style={{ marginBottom: 24, overflowX: 'auto' }}>
          {datasets.map((ds, di) => (
            <div key={di} style={{ marginBottom: 16 }}>
              <h4 style={{ marginBottom: 8 }}>{ds.label}{ds.unit ? ` (${ds.unit})` : ''} — {ds.points.length} data points</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid var(--border)' }}>RPM</th>
                    <th style={{ textAlign: 'right', padding: '4px 8px', borderBottom: '1px solid var(--border)' }}>Torque (N·m)</th>
                    {ds.points[0]?.voltage != null && <th style={{ textAlign: 'right', padding: '4px 8px', borderBottom: '1px solid var(--border)' }}>Voltage (V)</th>}
                    {ds.points[0]?.current != null && <th style={{ textAlign: 'right', padding: '4px 8px', borderBottom: '1px solid var(--border)' }}>Current (A)</th>}
                    {ds.points[0]?.power != null && <th style={{ textAlign: 'right', padding: '4px 8px', borderBottom: '1px solid var(--border)' }}>Power (W)</th>}
                  </tr>
                </thead>
                <tbody>
                  {ds.points.map((p, pi) => (
                    <tr key={pi} style={{ background: pi % 2 === 0 ? 'var(--surface)' : 'transparent' }}>
                      <td style={{ padding: '3px 8px', fontVariantNumeric: 'tabular-nums' }}>{p.rpm.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', padding: '3px 8px', fontVariantNumeric: 'tabular-nums' }}>{p.torque}</td>
                      {ds.points[0]?.voltage != null && <td style={{ textAlign: 'right', padding: '3px 8px', fontVariantNumeric: 'tabular-nums' }}>{p.voltage}</td>}
                      {ds.points[0]?.current != null && <td style={{ textAlign: 'right', padding: '3px 8px', fontVariantNumeric: 'tabular-nums' }}>{p.current}</td>}
                      {ds.points[0]?.power != null && <td style={{ textAlign: 'right', padding: '3px 8px', fontVariantNumeric: 'tabular-nums' }}>{p.power}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      <div className="torque-curves-gallery">
        {torqueCurveImages.length ? (
          torqueCurveImages.map((image, i) => (
            <figure key={`${image.url}-${i}`} className="detail-media-card">
              <img src={image.url} alt={image.alt || 'Torque-speed curve'} className="detail-media-image" loading="lazy" />
            </figure>
          ))
        ) : hasCurveSource ? (
          <div className="torque-curve-content">
            <p>Complete torque-speed curves are available in the product datasheet.</p>
            <a href={torqueCurveDocumentHref || datasheetUrl} target="_blank" rel="noreferrer" className="button-secondary">Download datasheet with curves</a>
          </div>
        ) : hasStructuredData ? null : (
          <div className="torque-curve-placeholder">
            <p>Torque-speed curves will be available upon request.</p>
            <Link href={quoteHref} className="button-secondary">Request torque curves</Link>
          </div>
        )}
      </div>
    </article>
  );
}
