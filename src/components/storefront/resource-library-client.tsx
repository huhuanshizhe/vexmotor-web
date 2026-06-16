'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useDeferredValue, useMemo, useState } from 'react';

import type { ResourceItem } from '@/lib/resources';
import { apiFetch } from '@/lib/api-client';
import { getResourceFilters } from '@/lib/resources';
import { withLocalePath, type Locale } from '@/lib/i18n';

type ResourceLibraryClientProps = {
  locale: Locale;
  resources: ResourceItem[];
};

type FeedbackState = Record<string, { tone: 'success' | 'error'; text: string }>;

function actionLabelForResource(resource: ResourceItem) {
  if (resource.section === 'webinars' && resource.webinarStatus === 'upcoming') {
    return 'Register interest';
  }

  if (resource.section === 'videos') {
    return 'Open brief';
  }

  if (resource.section === 'webinars' && resource.webinarStatus === 'on-demand') {
    return 'Download deck';
  }

  if (resource.section === 'cad') {
    return 'Download CAD';
  }

  if (resource.section === 'datasheet') {
    return 'Download datasheet';
  }

  return 'Download resource';
}

function ResourceCard({
  locale,
  resource,
  loginHref,
  unlocked,
  email,
  company,
  onEmailChange,
  onCompanyChange,
  onUnlock,
  isPending,
  feedback,
}: {
  locale: Locale;
  resource: ResourceItem;
  loginHref: string;
  unlocked: boolean;
  email: string;
  company: string;
  onEmailChange: (value: string) => void;
  onCompanyChange: (value: string) => void;
  onUnlock: () => void;
  isPending: boolean;
  feedback?: { tone: 'success' | 'error'; text: string };
}) {
  const downloadHref = withLocalePath(`/resources/download/${resource.slug}`, locale);
  const registerHref = withLocalePath('/support/contact?topic=sales', locale);

  return (
    <article className="resource-card">
      <div className="resource-card-head">
        <div className="resource-chip-row">
          <span className="resource-chip">{resource.section === 'datasheet' ? 'Datasheet' : resource.section === 'cad' ? 'CAD' : resource.format}</span>
          {resource.gated ? <span className="resource-chip">Locked</span> : null}
          {resource.webinarStatus ? <span className="resource-chip">{resource.webinarStatus === 'upcoming' ? 'Upcoming' : 'On-demand'}</span> : null}
        </div>
        {(resource.section === 'videos' || resource.section === 'webinars') ? (
          <div className="resource-media-placeholder">
            <span>{resource.section === 'videos' ? '16:9 preview' : 'Session overview'}</span>
            <strong>{resource.duration ?? resource.eventDate ?? 'Engineering session'}</strong>
          </div>
        ) : null}
      </div>

      <div className="resource-copy-stack">
        <div className="card-kicker">{resource.topic}</div>
        <h3>{resource.title}</h3>
        <p>{resource.summary}</p>
      </div>

      <dl className="resource-meta-grid">
        <div>
          <dt>Product line</dt>
          <dd>{resource.productLine}</dd>
        </div>
        <div>
          <dt>Language</dt>
          <dd>{resource.language}</dd>
        </div>
        <div>
          <dt>Format</dt>
          <dd>{resource.format}</dd>
        </div>
        <div>
          <dt>{resource.section === 'cad' || resource.section === 'datasheet' ? 'SKU' : 'Access'}</dt>
          <dd>{resource.sku ?? (resource.gated ? 'Email / login' : 'Open')}</dd>
        </div>
      </dl>

      <div className="resource-action-stack">
        {resource.section === 'webinars' && resource.webinarStatus === 'upcoming' ? (
          <Link href={registerHref} className="button-primary">{actionLabelForResource(resource)}</Link>
        ) : resource.gated && !unlocked ? (
          <form
            className="resource-gate-form"
            onSubmit={(event) => {
              event.preventDefault();
              onUnlock();
            }}
          >
            <label className="resource-screenreader-only" htmlFor={`${resource.slug}-email`}>Work email</label>
            <input
              id={`${resource.slug}-email`}
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="Unlock with work email"
              autoComplete="email"
            />
            <label className="resource-screenreader-only" htmlFor={`${resource.slug}-company`}>Company</label>
            <input
              id={`${resource.slug}-company`}
              type="text"
              value={company}
              onChange={(event) => onCompanyChange(event.target.value)}
              placeholder="Company (optional)"
              autoComplete="organization"
            />
            <div className="resource-gate-actions">
              <button type="submit" className="button-primary" disabled={isPending}>
                {isPending ? 'Unlocking...' : 'Unlock resource'}
              </button>
              <Link href={loginHref} className="button-secondary">Login</Link>
            </div>
          </form>
        ) : (
          <a href={downloadHref} className="button-primary">
            {actionLabelForResource(resource)}
          </a>
        )}

        {feedback ? <p className={`resource-feedback ${feedback.tone === 'error' ? 'resource-feedback-error' : 'resource-feedback-success'}`}>{feedback.text}</p> : null}
      </div>
    </article>
  );
}

export function ResourceLibraryClient({ locale, resources }: ResourceLibraryClientProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const callbackPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const filters = useMemo(() => getResourceFilters(resources), [resources]);
  const [keyword, setKeyword] = useState('');
  const [topic, setTopic] = useState('all');
  const [productLine, setProductLine] = useState('all');
  const [language, setLanguage] = useState('all');
  const [format, setFormat] = useState('all');
  const [gated, setGated] = useState('all');
  const [emailBySlug, setEmailBySlug] = useState<Record<string, string>>({});
  const [companyBySlug, setCompanyBySlug] = useState<Record<string, string>>({});
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [unlockedSlugs, setUnlockedSlugs] = useState<Record<string, boolean>>({});
  const [feedbackBySlug, setFeedbackBySlug] = useState<FeedbackState>({});
  const deferredKeyword = useDeferredValue(keyword.trim().toLowerCase());

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const matchesKeyword = !deferredKeyword
        || `${resource.title} ${resource.summary} ${resource.topic} ${resource.productLine} ${resource.language} ${resource.sku ?? ''}`.toLowerCase().includes(deferredKeyword);
      const matchesTopic = topic === 'all' || resource.topic === topic;
      const matchesProductLine = productLine === 'all' || resource.productLine === productLine;
      const matchesLanguage = language === 'all' || resource.language === language;
      const matchesFormat = format === 'all' || resource.format === format;
      const matchesGated = gated === 'all' || (gated === 'gated' ? resource.gated : !resource.gated);

      return matchesKeyword && matchesTopic && matchesProductLine && matchesLanguage && matchesFormat && matchesGated;
    });
  }, [deferredKeyword, format, gated, language, productLine, resources, topic]);

  const isWebinarSection = resources.length > 0 && resources.every((resource) => resource.section === 'webinars');
  const upcomingWebinars = filteredResources.filter((resource) => resource.webinarStatus === 'upcoming');
  const onDemandWebinars = filteredResources.filter((resource) => resource.webinarStatus === 'on-demand');

  async function unlockResource(resource: ResourceItem) {
    const email = emailBySlug[resource.slug]?.trim() ?? '';

    if (!email) {
      setFeedbackBySlug((current) => ({
        ...current,
        [resource.slug]: { tone: 'error', text: 'Enter a work email to unlock this resource.' },
      }));
      return;
    }

    setPendingSlug(resource.slug);
    setFeedbackBySlug((current) => ({
      ...current,
      [resource.slug]: { tone: 'success', text: 'Submitting request...' },
    }));

    try {
      await apiFetch('/api/front/resource-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          company: companyBySlug[resource.slug]?.trim() || undefined,
          resourceSlug: resource.slug,
          sourcePath: `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
          utmSource: searchParams.get('utm_source') ?? undefined,
          utmMedium: searchParams.get('utm_medium') ?? undefined,
          utmCampaign: searchParams.get('utm_campaign') ?? undefined,
        }),
      });

      setUnlockedSlugs((current) => ({ ...current, [resource.slug]: true }));
      setFeedbackBySlug((current) => ({
        ...current,
        [resource.slug]: { tone: 'success', text: 'Resource unlocked. The download button is now available.' },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to unlock resource.';
      setFeedbackBySlug((current) => ({
        ...current,
        [resource.slug]: { tone: 'error', text: message },
      }));
    } finally {
      setPendingSlug(null);
    }
  }

  function renderResources(items: ResourceItem[]) {
    return (
      <div className="resource-grid">
        {items.map((resource) => (
          <ResourceCard
            key={resource.slug}
            locale={locale}
            resource={resource}
            loginHref={withLocalePath(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`, locale)}
            unlocked={Boolean(unlockedSlugs[resource.slug])}
            email={emailBySlug[resource.slug] ?? ''}
            company={companyBySlug[resource.slug] ?? ''}
            onEmailChange={(value) => setEmailBySlug((current) => ({ ...current, [resource.slug]: value }))}
            onCompanyChange={(value) => setCompanyBySlug((current) => ({ ...current, [resource.slug]: value }))}
            onUnlock={() => void unlockResource(resource)}
            isPending={pendingSlug === resource.slug}
            feedback={feedbackBySlug[resource.slug]}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="resource-library-shell">
      <div className="resource-filter-grid">
        <label>
          Search title or SKU
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Search by keyword or SKU" />
        </label>
        <label>
          Topic
          <select value={topic} onChange={(event) => setTopic(event.target.value)}>
            <option value="all">All topics</option>
            {filters.topics.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Product line
          <select value={productLine} onChange={(event) => setProductLine(event.target.value)}>
            <option value="all">All product lines</option>
            {filters.productLines.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Language
          <select value={language} onChange={(event) => setLanguage(event.target.value)}>
            <option value="all">All languages</option>
            {filters.languages.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Format
          <select value={format} onChange={(event) => setFormat(event.target.value)}>
            <option value="all">All formats</option>
            {filters.formats.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Access
          <select value={gated} onChange={(event) => setGated(event.target.value)}>
            <option value="all">All access modes</option>
            <option value="ungated">Open resources</option>
            <option value="gated">Gated resources</option>
          </select>
        </label>
      </div>

      <div className="resource-filter-meta">
        <p className="section-description" aria-live="polite">{filteredResources.length} resources matched. Gated unlocks submit email and UTM context through the storefront API.</p>
      </div>

      {isWebinarSection ? (
        <div className="resource-section-stack">
          <section className="resource-panel">
            <div className="resource-panel-heading">
              <div>
                <div className="card-kicker">Upcoming</div>
                <h2 className="section-title">Live webinar schedule</h2>
              </div>
              <p className="section-description">HubSpot is still being migrated, so live sessions currently route into the existing contact workflow.</p>
            </div>
            {upcomingWebinars.length ? renderResources(upcomingWebinars) : <p className="section-description">No upcoming webinars matched the current filters.</p>}
          </section>
          <section className="resource-panel">
            <div className="resource-panel-heading">
              <div>
                <div className="card-kicker">On-demand</div>
                <h2 className="section-title">Replay decks and follow-up packs</h2>
              </div>
              <p className="section-description">On-demand replays stay gated so the commercial team can follow up on program fit, forecast timing, and CAD scope.</p>
            </div>
            {onDemandWebinars.length ? renderResources(onDemandWebinars) : <p className="section-description">No on-demand webinars matched the current filters.</p>}
          </section>
        </div>
      ) : filteredResources.length ? renderResources(filteredResources) : (
        <section className="resource-panel">
          <h2 className="section-title">No matching resources</h2>
          <p className="section-description">Adjust the topic, format, or access filters to widen the current view.</p>
        </section>
      )}
    </div>
  );
}