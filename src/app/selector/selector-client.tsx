'use client';

import Link from 'next/link';
import { useDeferredValue, useEffect, useMemo, useState, useTransition } from 'react';

import { AddToCartButton } from '@/components/storefront/add-to-cart-button';
import { AddToCompareButton } from '@/components/storefront/add-to-compare-button';
import type { Locale } from '@/lib/i18n';
import { withLocalePath } from '@/lib/i18n';
import {
  type SelectorFormState,
  type SelectorMatchResult,
  SELECTOR_STORAGE_KEY,
  createDefaultSelectorState,
  encodeSelectorScenario,
  getSelectorOptionLabel,
  getSelectorSummaryItems,
  matchSelectorProducts,
  normalizeSelectorScenario,
  selectorRules,
  selectorSteps,
} from '@/lib/selector';
import type { StorefrontProductCard } from '@/lib/storefront-types';

type SelectorClientProps = {
  locale: Locale;
  catalogProducts: StorefrontProductCard[];
  initialState: SelectorFormState;
  isLoggedIn: boolean;
};

function buildCompareItem(match: SelectorMatchResult) {
  return {
    id: match.product.id,
    name: match.product.name,
    slug: match.product.slug,
    spu: match.product.spu,
    priceLabel: match.product.purchaseMode === 'buy' ? match.product.price.formatted : 'Request Quote',
    purchaseMode: match.product.purchaseMode,
    inStock: match.product.inStock,
    shortDescription: match.product.shortDescription,
    categories: match.rule.categories,
  };
}

function SelectorChipGroup({
  values,
  selectedValues,
  onToggle,
}: {
  values: Array<{ value: string; label: string }>;
  selectedValues: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="selector-chip-grid">
      {values.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`selector-chip-button${selectedValues.includes(option.value) ? ' is-active' : ''}`}
          onClick={() => onToggle(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function SelectorClient({ locale, catalogProducts, initialState, isLoggedIn }: SelectorClientProps) {
  const [form, setForm] = useState(initialState);
  const [stepIndex, setStepIndex] = useState(0);
  const [tipsCollapsed, setTipsCollapsed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const deferredForm = useDeferredValue(form);
  const matches = useMemo(() => matchSelectorProducts(catalogProducts, deferredForm), [catalogProducts, deferredForm]);
  const exactMatches = useMemo(() => matches.filter((item) => item.exact), [matches]);
  const displayedMatches = useMemo(() => (exactMatches.length ? exactMatches : matches).slice(0, 6), [exactMatches, matches]);
  const progress = ((stepIndex + 1) / selectorSteps.length) * 100;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('w') || searchParams.has('category') || searchParams.has('industry')) {
      return;
    }

    const stored = window.sessionStorage.getItem(SELECTOR_STORAGE_KEY);
    if (!stored) {
      return;
    }

    try {
      const parsed = normalizeSelectorScenario(JSON.parse(stored) as Partial<SelectorFormState>);
      setForm((current) => ({ ...current, ...parsed }));
    } catch {
      window.sessionStorage.removeItem(SELECTOR_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.sessionStorage.setItem(SELECTOR_STORAGE_KEY, JSON.stringify(form));
    const url = new URL(window.location.href);
    url.searchParams.set('w', encodeSelectorScenario(form));
    if (form.motorType && form.motorType !== 'help-me-decide') {
      url.searchParams.set('category', form.motorType);
    } else {
      url.searchParams.delete('category');
    }
    window.history.replaceState({}, '', url.toString());
  }, [form]);

  function updateField<K extends keyof SelectorFormState>(key: K, value: SelectorFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage(null);
  }

  function toggleArrayValue(key: 'industries' | 'communication', value: string) {
    setForm((current) => {
      const currentValues = new Set(current[key]);
      if (currentValues.has(value)) {
        currentValues.delete(value);
      } else {
        currentValues.add(value);
      }

      return { ...current, [key]: Array.from(currentValues) };
    });
    setMessage(null);
  }

  function saveScenario() {
    startTransition(async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setMessage(isLoggedIn ? 'Scenario saved and link copied.' : 'Scenario saved locally and link copied. Sign in later to attach it to saved lists.');
      } catch {
        setMessage(isLoggedIn ? 'Scenario saved in this browser.' : 'Scenario saved in this browser. Sign in later to attach it to saved lists.');
      }
    });
  }

  function resetScenario() {
    const resetState = createDefaultSelectorState({ category: initialState.motorType, scenario: null });
    setForm(resetState);
    setStepIndex(0);
    setMessage('Scenario reset.');
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(SELECTOR_STORAGE_KEY);
    }
  }

  function stepTo(index: number) {
    setStepIndex(Math.min(Math.max(index, 0), selectorSteps.length - 1));
    setMessage(null);
  }

  const summaryItems = getSelectorSummaryItems(form);
  const quoteBasePath = withLocalePath('/quote', locale);
  const customDevelopmentPath = withLocalePath('/custom', locale);

  return (
    <div className="selector-page-stack">
      <article className="info-card selector-progress-card">
        <div className="selector-progress-header">
          <div>
            <div className="card-kicker">5-step flow</div>
            <h2 className="cart-section-title">Application → Mechanical → Electrical → Feedback → Results</h2>
            <p className="section-description">The selector keeps the scenario in session storage and syncs a shareable URL state as you refine the brief.</p>
          </div>
          <div className="selector-toolbar-actions">
            <button type="button" className="button-secondary" onClick={resetScenario}>
              Reset
            </button>
            <button type="button" className="button-secondary" onClick={saveScenario} disabled={isPending}>
              {isPending ? 'Saving...' : 'Save scenario'}
            </button>
          </div>
        </div>

        <div className="trade-progress-bar" aria-hidden="true">
          <span className="trade-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="selector-step-list" role="tablist" aria-label="Selector steps">
          {selectorSteps.map((step, index) => (
            <button
              key={step}
              type="button"
              className={`selector-step-button${index === stepIndex ? ' is-active' : ''}${index < stepIndex ? ' is-complete' : ''}`}
              onClick={() => stepTo(index)}
              aria-current={index === stepIndex ? 'step' : undefined}
            >
              <span>{index + 1}</span>
              <strong>{step}</strong>
            </button>
          ))}
        </div>

        {message ? <p className="form-feedback form-feedback-success">{message}</p> : null}
      </article>

      <div className="selector-layout-grid">
        <aside className="info-card selector-tips-card">
          <div className="selector-tip-header">
            <div>
              <div className="card-kicker">Why we ask</div>
              <h2 className="cart-section-title">Selection notes</h2>
            </div>
            <button type="button" className="button-secondary selector-tip-toggle" onClick={() => setTipsCollapsed((current) => !current)}>
              {tipsCollapsed ? 'Expand tips' : 'Collapse tips'}
            </button>
          </div>

          {!tipsCollapsed ? (
            <div className="selector-tip-list">
              {selectorRules.tips.map((tip) => (
                <article key={tip} className="selector-note-card">
                  <span className="support-bullet" />
                  <span>{tip}</span>
                </article>
              ))}
            </div>
          ) : null}

          <div className="selector-refine-card">
            <strong>Scenario snapshot</strong>
            {summaryItems.length ? (
              <div className="selector-refine-list">
                {summaryItems.map((item) => (
                  <button key={`${item.label}-${item.value}`} type="button" className="selector-refine-item" onClick={() => stepTo(item.stepIndex)}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </button>
                ))}
              </div>
            ) : (
              <p className="section-description">No filters applied yet. Start with motor type or industry to narrow the shortlist.</p>
            )}
          </div>
        </aside>

        <section className="info-card selector-main-card" role="group" aria-labelledby={`selector-step-${stepIndex}`}>
          <div className="section-header selector-section-header">
            <div>
              <div className="card-kicker">Step {stepIndex + 1}</div>
              <h2 id={`selector-step-${stepIndex}`} className="cart-section-title">{selectorSteps[stepIndex]}</h2>
            </div>
          </div>

          {stepIndex === 0 ? (
            <div className="selector-step-stack">
              <div className="selector-tile-grid">
                {selectorRules.options.motorTypes.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`selector-type-card${form.motorType === option.value ? ' is-active' : ''}`}
                    onClick={() => updateField('motorType', option.value)}
                  >
                    <strong>{option.label}</strong>
                    <span className="section-description compact-copy">{option.description}</span>
                  </button>
                ))}
              </div>

              <div className="selector-subsection">
                <strong>Industries</strong>
                <SelectorChipGroup values={selectorRules.options.industries} selectedValues={form.industries} onToggle={(value) => toggleArrayValue('industries', value)} />
              </div>
            </div>
          ) : null}

          {stepIndex === 1 ? (
            <div className="selector-form-grid">
              <label className="form-field">
                <span>Required torque</span>
                <input className="form-input" inputMode="decimal" value={form.requiredTorque} onChange={(event) => updateField('requiredTorque', event.target.value)} placeholder="e.g. 45" />
              </label>
              <label className="form-field">
                <span>Torque unit</span>
                <select className="form-input" value={form.torqueUnit} onChange={(event) => updateField('torqueUnit', event.target.value as SelectorFormState['torqueUnit'])}>
                  <option value="Ncm">N·cm</option>
                  <option value="Nm">N·m</option>
                </select>
              </label>
              <label className="form-field">
                <span>Peak torque</span>
                <input className="form-input" inputMode="decimal" value={form.peakTorque} onChange={(event) => updateField('peakTorque', event.target.value)} placeholder="Optional peak torque" />
              </label>
              <label className="form-field">
                <span>Required speed</span>
                <input className="form-input" inputMode="numeric" value={form.requiredSpeed} onChange={(event) => updateField('requiredSpeed', event.target.value)} placeholder="rpm" />
              </label>
              <label className="form-field">
                <span>Frame size minimum</span>
                <select className="form-input" value={form.frameSizeMin} onChange={(event) => updateField('frameSizeMin', event.target.value)}>
                  <option value="">Any</option>
                  {selectorRules.options.frameSizes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="form-field">
                <span>Frame size maximum</span>
                <select className="form-input" value={form.frameSizeMax} onChange={(event) => updateField('frameSizeMax', event.target.value)}>
                  <option value="">Any</option>
                  {selectorRules.options.frameSizes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="form-field">
                <span>Shaft</span>
                <select className="form-input" value={form.shaft} onChange={(event) => updateField('shaft', event.target.value)}>
                  {selectorRules.options.shafts.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="form-field">
                <span>Mounting</span>
                <select className="form-input" value={form.mounting} onChange={(event) => updateField('mounting', event.target.value)}>
                  {selectorRules.options.mountings.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="form-field">
                <span>Orientation</span>
                <select className="form-input" value={form.orientation} onChange={(event) => updateField('orientation', event.target.value)}>
                  {selectorRules.options.orientations.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="form-field">
                <span>Temperature</span>
                <select className="form-input" value={form.temperature} onChange={(event) => updateField('temperature', event.target.value)}>
                  {selectorRules.options.temperatures.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="form-field">
                <span>IP rating</span>
                <select className="form-input" value={form.ipRating} onChange={(event) => updateField('ipRating', event.target.value)}>
                  {selectorRules.options.ipRatings.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            </div>
          ) : null}

          {stepIndex === 2 ? (
            <div className="selector-form-grid">
              <label className="form-field">
                <span>Supply voltage</span>
                <input className="form-input" inputMode="numeric" value={form.supplyVoltage} onChange={(event) => updateField('supplyVoltage', event.target.value)} placeholder="e.g. 24 or 48" />
              </label>
              <label className="form-field">
                <span>Current limit</span>
                <input className="form-input" inputMode="decimal" value={form.currentLimit} onChange={(event) => updateField('currentLimit', event.target.value)} placeholder="e.g. 2.8" />
              </label>
              <label className="form-field">
                <span>Driver included?</span>
                <select className="form-input" value={form.driverIncluded} onChange={(event) => updateField('driverIncluded', event.target.value as SelectorFormState['driverIncluded'])}>
                  <option value="any">Any</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
              <div className="form-field selector-field-span">
                <span>Communication</span>
                <SelectorChipGroup values={selectorRules.options.communications} selectedValues={form.communication} onToggle={(value) => toggleArrayValue('communication', value)} />
              </div>
            </div>
          ) : null}

          {stepIndex === 3 ? (
            <div className="selector-form-grid">
              <label className="form-field">
                <span>Feedback</span>
                <select className="form-input" value={form.feedback} onChange={(event) => updateField('feedback', event.target.value as SelectorFormState['feedback'])}>
                  {selectorRules.options.feedbackModes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="form-field">
                <span>Resolution</span>
                <select className="form-input" value={form.resolution} onChange={(event) => updateField('resolution', event.target.value)}>
                  {selectorRules.options.resolutionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="form-field">
                <span>Brake</span>
                <select className="form-input" value={form.brake} onChange={(event) => updateField('brake', event.target.value as SelectorFormState['brake'])}>
                  <option value="any">Any</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
            </div>
          ) : null}

          {stepIndex === 4 ? (
            <div className="selector-results-layout">
              <aside className="selector-refine-card">
                <strong>Refine</strong>
                {summaryItems.length ? (
                  <div className="selector-refine-list">
                    {summaryItems.map((item) => (
                      <button key={`${item.label}-${item.value}-results`} type="button" className="selector-refine-item" onClick={() => stepTo(item.stepIndex)}>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="section-description">Apply more filters in earlier steps to tighten the result set.</p>
                )}
              </aside>

              <div className="selector-match-list">
                <article className="selector-note-card selector-results-callout">
                  <div>
                    <strong>{exactMatches.length ? `${exactMatches.length} direct-fit matches` : 'No exact catalog match yet'}</strong>
                    <p className="section-description">
                      {exactMatches.length
                        ? 'The shortlist below favors the strongest score and exposes the reasons behind each fit.'
                        : 'Nearest matches stay visible so you can compare options quickly, then route edge cases into a custom engineering conversation.'}
                    </p>
                  </div>
                  {!exactMatches.length ? (
                    <Link href={customDevelopmentPath} className="button-secondary">
                      Request custom development
                    </Link>
                  ) : null}
                </article>

                {displayedMatches.map((match) => (
                  <article key={match.product.id} className="selector-match-card">
                    <div className="selector-match-header">
                      <div>
                        <div className="card-kicker">{match.product.spu}</div>
                        <h3 className="selector-match-title">{match.product.name}</h3>
                      </div>
                      <div className="selector-match-meta">
                        <span className="selector-match-score">{match.score}% match</span>
                        <span className="product-badge">{match.product.purchaseMode === 'buy' ? match.product.price.formatted : 'Request Quote'}</span>
                      </div>
                    </div>

                    <div className="selector-reason-list">
                      {match.reasons.map((reason) => (
                        <span key={`${match.product.id}-${reason}`} className="filter-chip">
                          {reason}
                        </span>
                      ))}
                    </div>

                    <div className="selector-parameter-grid">
                      {match.rule.keyParameters.map((parameter) => (
                        <article key={`${match.product.id}-${parameter.label}`} className="selector-parameter-card">
                          <span>{parameter.label}</span>
                          <strong>{parameter.value}</strong>
                        </article>
                      ))}
                    </div>

                    <p className="section-description">{match.rule.tierHint}</p>

                    <div className="selector-result-actions">
                      <AddToCompareButton item={buildCompareItem(match)} />
                      {match.product.purchaseMode === 'buy' ? (
                        <AddToCartButton productId={match.product.id} redirectToCart={false} />
                      ) : (
                        <Link href={withLocalePath(`/products/${match.product.slug}`, locale)} className="button-secondary">
                          Review RFQ item
                        </Link>
                      )}
                      <Link href={`${quoteBasePath}?addSpu=${encodeURIComponent(match.product.spu)}`} className="button-secondary">
                        Add to Quote
                      </Link>
                      <Link href={withLocalePath(`/products/${match.product.slug}`, locale)} className="section-link selector-detail-link">
                        View product details
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          <div className="selector-actions-row">
            <button type="button" className="button-secondary" onClick={() => stepTo(stepIndex - 1)} disabled={stepIndex === 0}>
              Back
            </button>
            {stepIndex < selectorSteps.length - 1 ? (
              <button type="button" className="button-primary" onClick={() => stepTo(stepIndex + 1)}>
                Next
              </button>
            ) : (
              <button type="button" className="button-primary" onClick={() => stepTo(0)}>
                Start over
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}