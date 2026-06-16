'use client';

import { useState } from 'react';
import { DownOutlined, UpOutlined, CloseOutlined } from '@ant-design/icons';

type SpecCompareItem = {
  id: string;
  name: string;
  sku: string;
  image?: string;
  specs: Record<string, string>;
};

type ProductCompareTableProps = {
  items: SpecCompareItem[];
  onRemove?: (id: string) => void;
  maxItems?: number;
};

export function ProductCompareTable({
  items,
  onRemove,
  maxItems = 4,
}: ProductCompareTableProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  if (items.length === 0) {
    return null;
  }

  // Extract all unique spec keys
  const allSpecKeys = Array.from(
    new Set(items.flatMap((item) => Object.keys(item.specs)))
  );

  // Group specs by category (simple heuristic based on key patterns)
  const specGroups = {
    'Electrical & Motion': allSpecKeys.filter(
      (key) => /(voltage|current|power|torque|speed|rpm|step|phase)/i.test(key)
    ),
    'Physical Dimensions': allSpecKeys.filter(
      (key) => /(length|width|height|weight|size|diameter|shaft)/i.test(key)
    ),
    'Performance': allSpecKeys.filter(
      (key) => /(accuracy|resolution|efficiency|temperature|rating)/i.test(key)
    ),
    'Commercial': allSpecKeys.filter(
      (key) => /(sku|brand|stock|price|warranty|moq)/i.test(key)
    ),
    Other: allSpecKeys.filter(
      (key) =>
        !/(voltage|current|power|torque|speed|rpm|step|phase|length|width|height|weight|size|diameter|shaft|accuracy|resolution|efficiency|temperature|rating|sku|brand|stock|price|warranty|moq)/i.test(key)
    ),
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Initialize all sections as expanded
  Object.keys(specGroups).forEach((section) => {
    if (!(section in expandedSections)) {
      expandedSections[section] = true;
    }
  });

  return (
    <div className="product-compare-table">
      {/* Header with product cards */}
      <div className="compare-header">
        <div className="compare-label-cell">
          {/* Compare icon - inline SVG */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 17V7" />
            <path d="M18 17V12" />
            <path d="M8 17V12" />
            <path d="M3 22V2" />
            <path d="M13 22V12" />
            <path d="M18 22V17" />
            <path d="M8 22V17" />
          </svg>
          <span className="compare-title">Quick Specification Compare</span>
        </div>
        {items.map((item) => (
          <div key={item.id} className="compare-product-cell">
            {onRemove && (
              <button
                type="button"
                className="compare-remove-btn"
                onClick={() => onRemove(item.id)}
                aria-label={`Remove ${item.name} from comparison`}
              >
                <CloseOutlined style={{ fontSize: '16px' }} />
              </button>
            )}
            {item.image && (
              <img
                src={item.image}
                alt={item.name}
                className="compare-product-image"
              />
            )}
            <div className="compare-product-info">
              <h4 className="compare-product-name">{item.name}</h4>
              <p className="compare-product-sku">{item.sku}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Spec groups */}
      {Object.entries(specGroups)
        .filter(([_, keys]) => keys.length > 0)
        .map(([groupName, specKeys]) => (
          <div key={groupName} className="compare-spec-group">
            <button
              type="button"
              className="compare-group-header"
              onClick={() => toggleSection(groupName)}
              aria-expanded={expandedSections[groupName]}
            >
              <span className="compare-group-title">{groupName}</span>
              {expandedSections[groupName] ? (
                <UpOutlined style={{ fontSize: '18px' }} />
              ) : (
                <DownOutlined style={{ fontSize: '18px' }} />
              )}
            </button>

            {expandedSections[groupName] && (
              <div className="compare-spec-rows">
                {specKeys.map((specKey) => (
                  <div key={specKey} className="compare-spec-row">
                    <div className="compare-spec-label">{specKey}</div>
                    {items.map((item) => (
                      <div key={item.id} className="compare-spec-value mono">
                        {item.specs[specKey] || '—'}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

      {/* Footer with CTA */}
      <div className="compare-footer">
        <span className="compare-note">
          Comparing {items.length} of {maxItems} products
        </span>
        {items.length > 1 && (
          <span className="compare-highlight">
            {allSpecKeys.length} specifications compared
          </span>
        )}
      </div>

      <style jsx>{`
        .product-compare-table {
          background: var(--color-bg-primary);
          border: 1px solid var(--color-border-secondary);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-md);
          overflow: hidden;
        }

        .compare-header {
          display: grid;
          grid-template-columns: 180px repeat(${items.length}, minmax(180px, 1fr));
          background: var(--gray-50);
          border-bottom: 2px solid var(--color-border-primary);
        }

        .compare-label-cell {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-lg);
          font-weight: 600;
          color: var(--color-text-primary);
          border-right: 1px solid var(--color-border-secondary);
        }

        .compare-title {
          font-size: 0.9375rem;
        }

        .compare-product-cell {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
          padding: var(--spacing-lg);
          border-right: 1px solid var(--color-border-secondary);
        }

        .compare-product-cell:last-child {
          border-right: none;
        }

        .compare-remove-btn {
          position: absolute;
          top: var(--spacing-sm);
          right: var(--spacing-sm);
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: var(--gray-200);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
          color: var(--color-text-secondary);
        }

        .compare-remove-btn:hover {
          background: var(--gray-300);
          color: var(--color-text-primary);
        }

        .compare-product-image {
          width: 100%;
          height: 120px;
          object-fit: contain;
          border-radius: var(--radius-sm);
          background: var(--color-bg-primary);
        }

        .compare-product-info {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .compare-product-name {
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--color-text-primary);
          line-height: 1.4;
          margin: 0;
        }

        .compare-product-sku {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          margin: 0;
        }

        .compare-spec-group {
          border-bottom: 1px solid var(--color-border-secondary);
        }

        .compare-spec-group:last-child {
          border-bottom: none;
        }

        .compare-group-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: var(--spacing-md) var(--spacing-lg);
          background: var(--gray-50);
          border: none;
          cursor: pointer;
          transition: background var(--transition-fast);
        }

        .compare-group-header:hover {
          background: var(--gray-100);
        }

        .compare-group-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-text-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .compare-spec-rows {
          display: flex;
          flex-direction: column;
        }

        .compare-spec-row {
          display: grid;
          grid-template-columns: 180px repeat(${items.length}, minmax(180px, 1fr));
          border-bottom: 1px solid var(--color-border-secondary);
        }

        .compare-spec-row:last-child {
          border-bottom: none;
        }

        .compare-spec-label {
          padding: var(--spacing-sm) var(--spacing-lg);
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-text-secondary);
          background: var(--gray-50);
          border-right: 1px solid var(--color-border-secondary);
        }

        .compare-spec-value {
          padding: var(--spacing-sm) var(--spacing-lg);
          font-size: 0.875rem;
          color: var(--color-text-primary);
          border-right: 1px solid var(--color-border-secondary);
        }

        .compare-spec-value:last-child {
          border-right: none;
        }

        .compare-spec-value.mono {
          font-family: var(--font-mono);
          font-size: 0.8125rem;
        }

        .compare-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-md) var(--spacing-lg);
          background: var(--gray-50);
          border-top: 1px solid var(--color-border-secondary);
        }

        .compare-note {
          font-size: 0.8125rem;
          color: var(--color-text-secondary);
        }

        .compare-highlight {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--brand-600);
        }

        /* Mobile responsive */
        @media (max-width: 767px) {
          .compare-header,
          .compare-spec-row {
            grid-template-columns: 140px repeat(${items.length}, minmax(140px, 1fr));
          }

          .compare-label-cell,
          .compare-product-cell,
          .compare-spec-label,
          .compare-spec-value {
            padding: var(--spacing-sm) var(--spacing-md);
          }

          .compare-title {
            font-size: 0.8125rem;
          }

          .compare-product-name {
            font-size: 0.8125rem;
          }

          .compare-product-image {
            height: 80px;
          }

          .compare-group-title {
            font-size: 0.75rem;
          }

          .compare-spec-label,
          .compare-spec-value {
            font-size: 0.75rem;
          }
        }

        /* Horizontal scroll on small screens */
        @media (max-width: 479px) {
          .compare-header,
          .compare-spec-row {
            min-width: 640px;
          }

          .product-compare-table {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
        }
      `}</style>
    </div>
  );
}
