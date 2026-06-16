'use client';

import Link from 'next/link';
import { useDeferredValue, useEffect, useState } from 'react';

import type { Locale } from '@/lib/i18n';
import { withLocalePath } from '@/lib/i18n';
import { techFaqEntryToPlainText, type GlossaryTerm, type KnowledgeLinkedProduct, type TechFaqCategory, type TechFaqEntry } from '@/lib/knowledge';

type TechFaqClientProps = {
  glossaryTerms: GlossaryTerm[];
  locale: Locale;
  productsBySlug: Record<string, KnowledgeLinkedProduct>;
  techFaqCategories: TechFaqCategory[];
  techFaqEntries: TechFaqEntry[];
};

export function TechFaqClient({ glossaryTerms, locale, productsBySlug, techFaqCategories, techFaqEntries }: TechFaqClientProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TechFaqCategory | 'All'>('All');
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [feedbackById, setFeedbackById] = useState<Record<string, 'up' | 'down'>>({});
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const glossaryTermMap = new Map(glossaryTerms.map((term) => [term.id, term]));

  useEffect(() => {
    function applyHashState() {
      if (typeof window === 'undefined') {
        return;
      }

      const hash = decodeURIComponent(window.location.hash.replace(/^#/, ''));
      if (!hash.startsWith('q-')) {
        return;
      }

      const id = hash.slice(2);
      const matchedEntry = techFaqEntries.find((entry) => entry.id === id);
      if (!matchedEntry) {
        return;
      }

      setExpandedIds((current) => (current.includes(id) ? current : [...current, id]));
      setSelectedCategory((current) => (current === 'All' || current === matchedEntry.category ? current : matchedEntry.category));
      requestAnimationFrame(() => {
        document.getElementById(`q-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    applyHashState();
    window.addEventListener('hashchange', applyHashState);
    return () => window.removeEventListener('hashchange', applyHashState);
  }, []);

  const filteredEntries = techFaqEntries.filter((entry) => {
    const matchesCategory = selectedCategory === 'All' || entry.category === selectedCategory;
    const matchesQuery = !normalizedQuery || techFaqEntryToPlainText(entry).toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });

  function toggleExpanded(id: string) {
    setExpandedIds((current) => (current.includes(id) ? current.filter((entryId) => entryId !== id) : [...current, id]));
  }

  function setFeedback(id: string, value: 'up' | 'down') {
    setFeedbackById((current) => ({ ...current, [id]: value }));
  }

  const technicalSupportHref = withLocalePath('/support/contact?topic=technical', locale);
  const glossaryHref = withLocalePath('/glossary', locale);

  return (
    <div className="tech-faq-layout">
      <aside className="info-card tech-faq-sidebar">
        <div>
          <div className="card-kicker">Instant filter</div>
          <h2 className="cart-section-title">Search by topic or problem statement</h2>
          <p className="section-description compact-copy">Search runs locally against every question, summary, formula, and example block.</p>
        </div>

        <label className="knowledge-search-field">
          <span>Search FAQ</span>
          <input
            className="newsletter-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search wiring, torque, compliance, shipping..."
          />
        </label>

        <div className="tech-faq-category-list" role="list" aria-label="FAQ categories">
          <button
            type="button"
            className={`filter-chip filter-chip-link${selectedCategory === 'All' ? ' is-active' : ''}`}
            onClick={() => setSelectedCategory('All')}
          >
            All ({techFaqEntries.filter((entry) => !normalizedQuery || techFaqEntryToPlainText(entry).toLowerCase().includes(normalizedQuery)).length})
          </button>
          {techFaqCategories.map((category) => {
            const count = techFaqEntries.filter((entry) => entry.category === category && (!normalizedQuery || techFaqEntryToPlainText(entry).toLowerCase().includes(normalizedQuery))).length;

            return (
              <button
                key={category}
                type="button"
                className={`filter-chip filter-chip-link${selectedCategory === category ? ' is-active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category} ({count})
              </button>
            );
          })}
        </div>

        <div className="knowledge-side-links">
          <Link href={glossaryHref} className="section-link">Open glossary</Link>
          <Link href={technicalSupportHref} className="section-link">Ask engineering</Link>
        </div>
      </aside>

      <div className="knowledge-page-stack">
        <div className="knowledge-meta-line">
          <span className="product-meta">{filteredEntries.length} results</span>
          <span className="product-meta">Deep link format: #q-id</span>
          <span className="product-meta">Feedback stays local during migration</span>
        </div>

        {techFaqCategories.map((category) => {
          const entries = filteredEntries.filter((entry) => entry.category === category);
          if (!entries.length) {
            return null;
          }

          return (
            <section key={category} className="tech-faq-group">
              <div className="section-header trade-card-header">
                <div>
                  <div className="card-kicker">{category}</div>
                  <h2 className="cart-section-title">{category} questions</h2>
                </div>
              </div>

              {entries.map((entry) => {
                const isExpanded = expandedIds.includes(entry.id);

                return (
                  <article key={entry.id} id={`q-${entry.id}`} className="info-card tech-faq-item">
                    <div className="tech-faq-header-row">
                      <button type="button" className="tech-faq-trigger" aria-expanded={isExpanded} onClick={() => toggleExpanded(entry.id)}>
                        <div>
                          <h3>{entry.question}</h3>
                          <p className="section-description compact-copy">{entry.searchSummary}</p>
                        </div>
                        <span className="tech-faq-toggle-indicator" aria-hidden="true">{isExpanded ? '-' : '+'}</span>
                      </button>
                      <a href={`#q-${entry.id}`} className="section-link">Deep link</a>
                    </div>

                    {isExpanded ? (
                      <div className="tech-faq-answer">
                        {entry.answer.paragraphs.map((paragraph) => (
                          <p key={paragraph}>{paragraph}</p>
                        ))}

                        {entry.answer.formula ? (
                          <figure className="knowledge-formula-block">
                            <figcaption className="product-meta">{entry.answer.formula.label}</figcaption>
                            <code>{entry.answer.formula.expression}</code>
                          </figure>
                        ) : null}

                        {entry.answer.codeSample ? (
                          <div className="knowledge-code-block-wrap">
                            <div className="product-meta">{entry.answer.codeSample.label}</div>
                            <pre className="knowledge-code-block">
                              <code>{entry.answer.codeSample.code}</code>
                            </pre>
                          </div>
                        ) : null}

                        {entry.answer.bullets?.length ? (
                          <ul className="blog-article-list">
                            {entry.answer.bullets.map((item) => <li key={item}>{item}</li>)}
                          </ul>
                        ) : null}

                        {entry.relatedGlossaryTermIds.length ? (
                          <div className="knowledge-related-block">
                            <span className="product-meta">Related terms</span>
                            <div className="knowledge-chip-row">
                              {entry.relatedGlossaryTermIds.map((termId) => {
                                const term = glossaryTermMap.get(termId);
                                return term ? (
                                  <Link key={termId} href={`${glossaryHref}#term-${termId}`} className="filter-chip filter-chip-link">
                                    {term.term}
                                  </Link>
                                ) : null;
                              })}
                            </div>
                          </div>
                        ) : null}

                        {entry.relatedProductSlugs.length ? (
                          <div className="knowledge-related-block">
                            <span className="product-meta">Related products</span>
                            <div className="knowledge-related-grid">
                              {entry.relatedProductSlugs.map((slug) => {
                                const product = productsBySlug[slug];
                                return product ? (
                                  <Link key={slug} href={withLocalePath(`/products/${slug}`, locale)} className="summary-stat knowledge-product-card">
                                    <span className="summary-label">{product.purchaseMode === 'buy' ? product.priceLabel : 'Request Quote'}</span>
                                    <strong>{product.name}</strong>
                                    <span className="section-description compact-copy">{product.sku}</span>
                                  </Link>
                                ) : null;
                              })}
                            </div>
                          </div>
                        ) : null}

                        <div className="tech-faq-feedback-row">
                          <span className="product-meta">Was this helpful?</span>
                          <div className="tech-faq-feedback-buttons">
                            <button
                              type="button"
                              className={`button-secondary tech-faq-feedback-button${feedbackById[entry.id] === 'up' ? ' is-active' : ''}`}
                              onClick={() => setFeedback(entry.id, 'up')}
                              aria-pressed={feedbackById[entry.id] === 'up'}
                            >
                              Helpful
                            </button>
                            <button
                              type="button"
                              className={`button-secondary tech-faq-feedback-button${feedbackById[entry.id] === 'down' ? ' is-active' : ''}`}
                              onClick={() => setFeedback(entry.id, 'down')}
                              aria-pressed={feedbackById[entry.id] === 'down'}
                            >
                              Needs work
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </section>
          );
        })}

        {!filteredEntries.length ? (
          <article className="info-card empty-state-card knowledge-empty-state">
            <h3 style={{ margin: 0 }}>No FAQ matches for "{query}".</h3>
            <p className="section-description">Try a broader technical term or route the open issue to engineering.</p>
            <div className="trade-empty-actions">
              <button type="button" className="button-secondary" onClick={() => { setQuery(''); setSelectedCategory('All'); }}>
                Reset filters
              </button>
              <Link href={technicalSupportHref} className="button-primary">Ask engineering</Link>
            </div>
          </article>
        ) : null}

        <article className="info-card blog-cta-card">
          <div>
            <div className="card-kicker">Escalation path</div>
            <h2 className="cart-section-title">Did not find the exact issue?</h2>
            <p className="section-description">Route the case into technical support with the actual motor, driver, load, controller, and wiring context so engineering can triage it properly.</p>
          </div>
          <div className="trade-empty-actions">
            <Link href={glossaryHref} className="button-secondary">Open glossary</Link>
            <Link href={technicalSupportHref} className="button-primary">Ask engineering</Link>
          </div>
        </article>
      </div>
    </div>
  );
}