'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { InquiryMessageDialog } from '@/components/account/inquiry-message-dialog';
import { useAuth } from '@/components/providers/auth-provider';
import { useCountries } from '@/hooks/use-countries';
import { useIndustries } from '@/hooks/use-industries';
import { fetchInquiryDetail, type AccountInquiryDetail, type InquiryQuotedLine } from '@/lib/inquiry-api';
import { withLocalePath, type Locale } from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n-context';

function formatMoney(amount: number, currency: string, locale: Locale) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

type MergedQuoteLine = {
  key: string;
  rfq: NonNullable<AccountInquiryDetail['rfqPayload']>['lines'][number] | null;
  quoted: InquiryQuotedLine | null;
};

function buildMergedQuoteLines(
  rfqLines: NonNullable<AccountInquiryDetail['rfqPayload']>['lines'],
  quotedLines: InquiryQuotedLine[] | null,
): MergedQuoteLine[] {
  const quotedBySpu = new Map((quotedLines ?? []).map((line) => [line.spu, line]));
  const quotedByProductId = new Map(
    (quotedLines ?? []).filter((line) => line.productId).map((line) => [line.productId, line]),
  );
  const usedQuoted = new Set<InquiryQuotedLine>();
  const merged: MergedQuoteLine[] = [];

  for (const [index, rfq] of rfqLines.entries()) {
    const quoted =
      (rfq.productId ? quotedByProductId.get(rfq.productId) : undefined)
      ?? quotedBySpu.get(rfq.spu)
      ?? quotedLines?.[index]
      ?? null;

    if (quoted) {
      usedQuoted.add(quoted);
    }

    merged.push({
      key: `${rfq.spu}-${index}`,
      rfq,
      quoted,
    });
  }

  for (const quoted of quotedLines ?? []) {
    if (usedQuoted.has(quoted)) {
      continue;
    }

    merged.push({
      key: `${quoted.spu}-quoted`,
      rfq: null,
      quoted,
    });
  }

  return merged;
}

function QuoteLineItemCard({
  item,
  locale,
}: {
  item: MergedQuoteLine;
  locale: Locale;
}) {
  const rfq = item.rfq;
  const quoted = item.quoted;
  const name = rfq?.name ?? quoted?.name ?? '';
  const spu = rfq?.spu ?? quoted?.spu ?? '';
  const slug = rfq?.slug ?? quoted?.slug ?? '';
  const quantity = quoted?.quantity ?? rfq?.quantity ?? 1;
  const hasQuote = Boolean(quoted && quoted.unitPrice > 0);

  return (
    <article className="account-quote-line-item">
      <div className="account-quote-line-item__product">
        <div className="account-quote-rfq-line__thumb">
          {rfq?.coverImage?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={rfq.coverImage.url} alt={rfq.coverImage.alt || name} />
          ) : (
            <span className="account-quote-rfq-line__thumb-fallback">{spu.slice(0, 2)}</span>
          )}
        </div>
        <div className="account-quote-line-item__product-copy">
          <div className="account-quote-rfq-line__title-row">
            {slug ? (
              <Link href={withLocalePath(`/products/${slug}`, locale)} className="account-quote-rfq-line__title">
                {name}
              </Link>
            ) : (
              <strong className="account-quote-rfq-line__title">{name}</strong>
            )}
            <span className="account-quote-mono account-quote-rfq-line__spu">{spu}</span>
          </div>
        </div>
      </div>

      <div className="account-quote-line-item__compare">
        <div className="account-quote-line-item__col">
          <span className="account-quote-line-item__col-label">Requested</span>
          <dl className="account-quote-line-item__facts">
            <div>
              <dt>Qty</dt>
              <dd>{quantity}</dd>
            </div>
            {rfq?.requiredBy ? (
              <div>
                <dt>Required by</dt>
                <dd>{rfq.requiredBy}</dd>
              </div>
            ) : null}
            {rfq?.notes ? (
              <div>
                <dt>Notes</dt>
                <dd>{rfq.notes}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="account-quote-line-item__col account-quote-line-item__col--quoted">
          <span className="account-quote-line-item__col-label">Quoted</span>
          {hasQuote && quoted ? (
            <dl className="account-quote-line-item__facts">
              <div>
                <dt>Unit</dt>
                <dd>{formatMoney(quoted.unitPrice, quoted.currency, locale)}</dd>
              </div>
              <div>
                <dt>Line total</dt>
                <dd>{formatMoney(quoted.unitPrice * quoted.quantity, quoted.currency, locale)}</dd>
              </div>
              <div>
                <dt>Lead time</dt>
                <dd>{quoted.leadTime || '—'}</dd>
              </div>
              {quoted.note ? (
                <div>
                  <dt>Note</dt>
                  <dd>{quoted.note}</dd>
                </div>
              ) : null}
            </dl>
          ) : (
            <p className="account-quote-line-item__pending">Pricing pending</p>
          )}
        </div>
      </div>
    </article>
  );
}

export function AccountQuoteDetailClient({ locale, quote: initialQuote }: { locale: Locale; quote: AccountInquiryDetail }) {
  const [quote] = useState(initialQuote);
  const [showMessages, setShowMessages] = useState(false);
  const { getLabel: getIndustryLabel } = useIndustries();
  const { getLabel: getCountryLabel } = useCountries();

  const quoteNumber = quote.quoteNumber ?? quote.id;
  const canConvert = quote.status === 'quoted' && Boolean(quote.quotedLines?.length);
  const quotedTotal = quote.quotedLines?.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0) ?? 0;
  const quotedCurrency = quote.quotedLines?.[0]?.currency ?? 'USD';
  const mergedLines = buildMergedQuoteLines(quote.rfqPayload?.lines ?? [], quote.quotedLines);
  const hasLineItems = mergedLines.length > 0;

  return (
    <div className="account-quote-detail">
      <header className="account-quote-detail__header">
        <div>
          <p className="account-quote-kicker">Quote detail</p>
          <h1 className="account-quote-detail__title account-quote-mono">{quoteNumber}</h1>
          <p className="account-quote-detail__subtitle">{quote.projectName}</p>
        </div>
        <div className="account-quote-detail__header-meta">
          <span className="account-quote-status-pill">{formatStatus(quote.status)}</span>
          <span className="account-quote-detail__date">Created {new Date(quote.createdAt).toLocaleDateString(locale)}</span>
          {quote.expiresAt ? (
            <span className="account-quote-detail__date">Expires {new Date(quote.expiresAt).toLocaleDateString(locale)}</span>
          ) : null}
        </div>
        <div className="account-quote-detail__actions">
          <button type="button" className="button-secondary" onClick={() => setShowMessages(true)}>Message</button>
          {canConvert ? (
            <Link href={withLocalePath(`/checkout?fromQuote=${quoteNumber}`, locale)} className="button-primary">
              Convert to order
            </Link>
          ) : null}
        </div>
      </header>

      {hasLineItems ? (
        <section className="account-quote-block account-quote-block--lines">
          <div className="account-quote-block__header">
            <span className="account-quote-block__step">01</span>
            <div>
              <h2 className="account-quote-block__title">Line items</h2>
              <p className="account-quote-block__desc">
                Your original request and STEPMOTECH pricing side by side.
              </p>
            </div>
          </div>
          <div className="account-quote-line-item-list">
            {mergedLines.map((item) => (
              <QuoteLineItemCard key={item.key} item={item} locale={locale} />
            ))}
          </div>
          {quote.quotedLines?.length ? (
            <div className="account-quote-line-item-total">
              <span>Total quoted</span>
              <strong>{formatMoney(quotedTotal, quotedCurrency, locale)}</strong>
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="account-quote-panels">
        <section className="account-quote-block account-quote-block--panel">
          <div className="account-quote-block__header">
            <span className="account-quote-block__step">02</span>
            <div>
              <h2 className="account-quote-block__title">Contact & company</h2>
            </div>
          </div>
          <dl className="account-quote-facts">
            <div><dt>Name</dt><dd>{quote.rfqPayload?.contact.fullName || quote.fullName}</dd></div>
            <div><dt>Email</dt><dd>{quote.rfqPayload?.contact.email || quote.email}</dd></div>
            <div><dt>Company</dt><dd>{quote.rfqPayload?.contact.company || quote.company || '—'}</dd></div>
            <div><dt>Country</dt><dd>{getCountryLabel(quote.rfqPayload?.contact.country || quote.country)}</dd></div>
            <div><dt>Phone</dt><dd>{quote.rfqPayload?.contact.phone || quote.phone || '—'}</dd></div>
            <div><dt>VAT</dt><dd>{quote.rfqPayload?.contact.vat || '—'}</dd></div>
          </dl>
        </section>

        <section className="account-quote-block account-quote-block--panel">
          <div className="account-quote-block__header">
            <span className="account-quote-block__step">03</span>
            <div>
              <h2 className="account-quote-block__title">Project info</h2>
            </div>
          </div>
          <dl className="account-quote-facts">
            <div><dt>Name</dt><dd>{quote.rfqPayload?.project.projectName || '—'}</dd></div>
            <div><dt>Industry</dt><dd>{getIndustryLabel(quote.rfqPayload?.project.industry)}</dd></div>
            <div><dt>Target start</dt><dd>{quote.rfqPayload?.project.targetStartDate || '—'}</dd></div>
            <div><dt>Annual volume</dt><dd>{quote.rfqPayload?.project.annualVolumeEstimate || '—'}</dd></div>
          </dl>
        </section>
      </div>

      <section className="account-quote-block">
        <div className="account-quote-block__header">
          <span className="account-quote-block__step">04</span>
          <div>
            <h2 className="account-quote-block__title">Attachments</h2>
            <p className="account-quote-block__desc">Project files submitted with your RFQ.</p>
          </div>
        </div>
        {quote.rfqPayload?.projectAttachments?.length ? (
          <ul className="account-quote-attachments">
            {quote.rfqPayload.projectAttachments.map((attachment) => (
              <li key={attachment.key}>
                <a href={attachment.url} className="account-quote-link" target="_blank" rel="noreferrer">
                  {attachment.filename}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="account-quote-empty-inline">No project attachments.</p>
        )}
      </section>

      {showMessages ? (
        <InquiryMessageDialog
          locale={locale}
          inquiryId={quote.id}
          quoteNumber={quoteNumber}
          onClose={() => setShowMessages(false)}
        />
      ) : null}
    </div>
  );
}

export default function AccountQuoteDetailPage() {
  const { user } = useAuth();
  const { locale } = useTranslation();
  const params = useParams<{ quoteNumber: string }>();
  const [quote, setQuote] = useState<AccountInquiryDetail | null>(null);

  useEffect(() => {
    if (!user || !params.quoteNumber) {
      return;
    }
    void fetchInquiryDetail(params.quoteNumber)
      .then(setQuote)
      .catch(() => setQuote(null));
  }, [user, params.quoteNumber]);

  if (!quote) {
    return (
      <article className="account-quote-block">
        <p className="account-quote-empty-inline">Loading quote…</p>
      </article>
    );
  }

  return <AccountQuoteDetailClient locale={locale} quote={quote} />;
}
