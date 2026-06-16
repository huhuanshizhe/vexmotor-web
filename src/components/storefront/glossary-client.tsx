'use client';

import Link from 'next/link';
import { useDeferredValue, useState } from 'react';

import type { Locale } from '@/lib/i18n';
import { withLocalePath } from '@/lib/i18n';
import { glossaryTermToPlainText, type GlossaryTerm, type KnowledgeLinkedProduct } from '@/lib/knowledge';

type GlossaryClientProps = {
  glossaryTerms: GlossaryTerm[];
  locale: Locale;
  productsBySlug: Record<string, KnowledgeLinkedProduct>;
};

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function GlossaryClient({ glossaryTerms, locale, productsBySlug }: GlossaryClientProps) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const glossaryTermMap = new Map(glossaryTerms.map((term) => [term.id, term]));

  const filteredTerms = glossaryTerms.filter((term) => !normalizedQuery || glossaryTermToPlainText(term).toLowerCase().includes(normalizedQuery));
  const visibleLetters = new Set(filteredTerms.map((term) => term.term.charAt(0).toUpperCase()));
  const technicalSupportHref = withLocalePath('/support/contact?topic=technical', locale);

  return (
    <div className="glossary-stack">
      <div className="info-card knowledge-toolbar-card">
        <div className="knowledge-toolbar">
          <label className="knowledge-search-field">
            <span>Search glossary</span>
            <input
              className="newsletter-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search torque margin, IP rating, inertia ratio..."
            />
          </label>
          <div className="knowledge-toolbar-note">
            <span className="product-meta">{filteredTerms.length} terms</span>
            <span className="product-meta">A-Z anchor navigation</span>
          </div>
        </div>
      </div>

      <nav className="glossary-alphabet-nav" aria-label="Glossary letters">
        {alphabet.map((letter) =>
          visibleLetters.has(letter) ? (
            <a key={letter} href={`#letter-${letter.toLowerCase()}`} className="filter-chip filter-chip-link glossary-letter-link">
              {letter}
            </a>
          ) : (
            <span key={letter} className="filter-chip glossary-letter-link is-disabled" aria-hidden="true">
              {letter}
            </span>
          ),
        )}
      </nav>

      {alphabet.map((letter) => {
        const terms = filteredTerms.filter((term) => term.term.charAt(0).toUpperCase() === letter);
        if (!terms.length) {
          return null;
        }

        return (
          <section key={letter} id={`letter-${letter.toLowerCase()}`} className="glossary-section">
            <div className="section-header glossary-section-header">
              <div>
                <div className="card-kicker">Letter {letter}</div>
                <h2 className="section-title">{letter}</h2>
              </div>
              <p className="section-description">{terms.length} term{terms.length === 1 ? '' : 's'}</p>
            </div>

            <div className="glossary-grid">
              {terms.map((term) => (
                <article key={term.id} id={`term-${term.id}`} className="info-card glossary-card">
                  <div className="glossary-term-header">
                    <div>
                      <h3>{term.term}</h3>
                      {term.synonyms.length ? <p className="glossary-term-synonyms">Also called: {term.synonyms.join(', ')}</p> : null}
                    </div>
                    <a href={`#term-${term.id}`} className="section-link">Deep link</a>
                  </div>

                  {term.definition.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}

                  {term.relatedTermIds.length ? (
                    <div className="knowledge-related-block">
                      <span className="product-meta">Related terms</span>
                      <div className="knowledge-chip-row">
                        {term.relatedTermIds.map((relatedId) => {
                          const related = glossaryTermMap.get(relatedId);
                          return related ? (
                            <a key={relatedId} href={`#term-${relatedId}`} className="filter-chip filter-chip-link">
                              {related.term}
                            </a>
                          ) : null;
                        })}
                      </div>
                    </div>
                  ) : null}

                  {term.relatedProductSlugs.length ? (
                    <div className="knowledge-related-block">
                      <span className="product-meta">Related products</span>
                      <div className="knowledge-related-grid">
                        {term.relatedProductSlugs.map((slug) => {
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
                </article>
              ))}
            </div>
          </section>
        );
      })}

      {!filteredTerms.length ? (
        <article className="info-card empty-state-card knowledge-empty-state">
          <h3 style={{ margin: 0 }}>No glossary matches for "{query}".</h3>
          <p className="section-description">Try a simpler term, a synonym, or route the unclear requirement into technical support.</p>
          <div className="trade-empty-actions">
            <button type="button" className="button-secondary" onClick={() => setQuery('')}>Reset search</button>
            <Link href={technicalSupportHref} className="button-primary">Suggest a term</Link>
          </div>
        </article>
      ) : null}

      <article className="info-card blog-cta-card">
        <div>
          <div className="card-kicker">Suggest a term</div>
          <h2 className="cart-section-title">Missing a program-specific motion term?</h2>
          <p className="section-description">Send the phrase, product context, and destination market so the glossary can be expanded without introducing ambiguous definitions.</p>
        </div>
        <div className="trade-empty-actions">
          <Link href={withLocalePath('/tech-faq', locale)} className="button-secondary">Open Tech FAQ</Link>
          <Link href={technicalSupportHref} className="button-primary">Suggest a term</Link>
        </div>
      </article>
    </div>
  );
}