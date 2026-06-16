import Link from 'next/link';

type ConfigOption = { id: string; label: string; surcharge?: number; constraints?: Record<string, unknown> };
type ConfigModule = { module: string; label: string; options: ConfigOption[] };

type TabCustomDesignProps = {
  customHref: string;
  contactPath: string;
  configurationRules?: unknown | null;
};

const defaultModules: ConfigModule[] = [
  {
    module: 'shaft',
    label: 'Shaft modifications',
    options: [{ id: 'custom-shaft', label: 'Custom length, diameter, keyway, D-cut or special profiles.' }],
  },
  {
    module: 'winding',
    label: 'Winding options',
    options: [{ id: 'custom-winding', label: 'Voltage, current and resistance adjustments for the required driver window.' }],
  },
  {
    module: 'gearbox',
    label: 'Gearbox integration',
    options: [{ id: 'custom-gearbox', label: 'Ratio selection, backlash targets and mounting configuration around the same motor family.' }],
  },
  {
    module: 'environmental',
    label: 'Environmental protection',
    options: [{ id: 'custom-env', label: 'IP upgrades, coatings and temperature-range adjustments for harsher duty cycles.' }],
  },
];

function parseConfigRules(data: unknown): ConfigModule[] | null {
  if (!data || !Array.isArray(data)) return null;
  const valid = data.filter(
    (m: unknown) => m && typeof m === 'object' && typeof (m as Record<string, unknown>).module === 'string',
  );
  return valid.length > 0 ? (valid as ConfigModule[]) : null;
}

export function TabCustomDesign({ customHref, contactPath, configurationRules }: TabCustomDesignProps) {
  const parsed = parseConfigRules(configurationRules);
  const modules = parsed ?? defaultModules;

  return (
    <article className="info-card detail-panel-card">
      <div className="detail-panel-heading">
        <div className="detail-panel-copy">
          <span className="card-kicker">Custom engineering</span>
          <h2 className="detail-panel-title">Modification paths for shaft, winding, drivetrain and environment.</h2>
        </div>
        <div className="detail-panel-badges">
          <span className="detail-panel-badge">{modules.length} program modules</span>
          <span className="detail-panel-badge">Pilot-to-batch ready</span>
        </div>
      </div>

      <div className="custom-design-content">
        <p className="section-description">Use the same base frame and tailor the motor around your mechanics, electrical target, motion profile or environmental constraints.</p>

        <div className="custom-program-grid">
          {modules.map((mod) => (
            <article key={mod.module} className="custom-program-card">
              <strong>{mod.label}</strong>
              {mod.options.map((opt) => (
                <p key={opt.id}>
                  {opt.label}
                  {opt.surcharge != null ? ` (+${opt.surcharge}%)` : ''}
                </p>
              ))}
            </article>
          ))}
        </div>

        <div className="custom-program-steps">
          <article className="custom-program-step">
            <span className="card-kicker">Step 01</span>
            <strong>Application brief</strong>
            <p>Share motion target, driver stack, mounting limits and environmental conditions.</p>
          </article>
          <article className="custom-program-step">
            <span className="card-kicker">Step 02</span>
            <strong>Engineering review</strong>
            <p>We confirm winding, shaft, gearbox and thermal tradeoffs against the base SKU.</p>
          </article>
          <article className="custom-program-step">
            <span className="card-kicker">Step 03</span>
            <strong>Pilot approval</strong>
            <p>Prototype, sample sign-off and batch handoff follow the same documented path.</p>
          </article>
        </div>

        <div className="custom-program-actions">
          <Link href={customHref} className="button-primary">Start custom development</Link>
          <Link href={contactPath} className="button-secondary">Talk to an engineer</Link>
        </div>
      </div>
    </article>
  );
}
