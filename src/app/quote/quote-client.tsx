'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from 'react';

import { CountrySelect } from '@/components/storefront/country-select';
import { IndustrySelect } from '@/components/storefront/industry-select';
import { QuoteImageLightbox } from '@/components/quote/quote-image-lightbox';
import { QuoteLineItem } from '@/components/quote/quote-line-item';
import { QuoteSubmitRail } from '@/components/quote/quote-submit-rail';
import { useToast } from '@C/toast';
import { apiFetch } from '@/lib/api-client';
import type { InquiryAttachment } from '@/lib/inquiry-api';
import { submitInquiry, uploadInquiryDocument } from '@/lib/inquiry-api';
import type { Locale } from '@/lib/i18n';
import { withLocalePath } from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n-context';
import { MAX_QUOTE_ATTACHMENTS } from '@/lib/quote-form-options';
import { fetchGeoCountries, resolveCountryCode } from '@/lib/geo-api';
import { fetchIndustries, resolveIndustrySlug } from '@/lib/industries-api';
import {
  clearQuoteItems,
  readQuoteItems,
  removeQuoteItem,
  updateQuoteQty,
  type QuoteLiveItem,
} from '@/lib/quote-live-items';

const QUOTE_DRAFT_STORAGE_KEY = 'vexmotor-quote-draft';
const QUOTE_CART_OVERLAY_KEY = 'quote-cart-overlay';

type DraftForm = {
  project: {
    projectName: string;
    industry: string;
    targetStartDate: string;
    annualVolumeEstimate: string;
  };
  contact: {
    fullName: string;
    email: string;
    company: string;
    country: string;
    phone: string;
    vat: string;
  };
  projectAttachments: InquiryAttachment[];
};

const EMPTY_DRAFT: DraftForm = {
  project: { projectName: '', industry: '', targetStartDate: '', annualVolumeEstimate: '' },
  contact: { fullName: '', email: '', company: '', country: 'US', phone: '', vat: '' },
  projectAttachments: [],
};

type DisplayLine = QuoteLiveItem & { overlay?: boolean };

type QuoteClientProps = {
  locale: Locale;
};

type PendingUpload = {
  id: string;
  filename: string;
};

function mergeLines(liveItems: QuoteLiveItem[], overlayItems: QuoteLiveItem[]): DisplayLine[] {
  const map = new Map<string, DisplayLine>();
  for (const item of liveItems) {
    map.set(item.id, { ...item });
  }
  for (const item of overlayItems) {
    const existing = map.get(item.id);
    if (existing) {
      map.set(item.id, { ...existing, quantity: existing.quantity + item.quantity, overlay: true });
    } else {
      map.set(item.id, { ...item, overlay: true });
    }
  }
  return Array.from(map.values());
}

function QuoteSection({
  step,
  title,
  description,
  requirement,
  children,
}: {
  step: string;
  title: string;
  description?: string;
  requirement?: 'required' | 'optional';
  children: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <section className="quote-rfq-block">
      <header className="quote-rfq-block__header">
        <span className="quote-rfq-block__step">{step}</span>
        <div>
          <div className="quote-rfq-block__title-row">
            <h2 className="quote-rfq-block__title">{title}</h2>
            {requirement === 'required' ? (
              <span className="quote-rfq-requirement quote-rfq-requirement--required" title={t('quotePage.sectionRequiredTitle')}>
                {t('quotePage.sectionRequired')}
              </span>
            ) : null}
            {requirement === 'optional' ? (
              <span className="quote-rfq-requirement quote-rfq-requirement--optional" title={t('quotePage.sectionOptionalTitle')}>
                {t('quotePage.sectionOptional')}
              </span>
            ) : null}
          </div>
          {description ? <p className="quote-rfq-block__desc">{description}</p> : null}
        </div>
      </header>
      <div className="quote-rfq-block__body">{children}</div>
    </section>
  );
}

export function QuoteClient({ locale }: QuoteClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { pushToast } = useToast();
  const [draft, setDraft] = useState<DraftForm>(EMPTY_DRAFT);
  const [liveItems, setLiveItems] = useState<QuoteLiveItem[]>([]);
  const [overlayItems, setOverlayItems] = useState<QuoteLiveItem[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [previewImage, setPreviewImage] = useState<{ url: string; alt: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const draftSavedRef = useRef(false);
  const submittedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cartOverlay = searchParams.get('cartOverlay') === '1';
  const displayLines = useMemo(() => mergeLines(liveItems, overlayItems), [liveItems, overlayItems]);
  const uploading = uploadingCount > 0;

  const syncLiveItems = useCallback(() => {
    setLiveItems(readQuoteItems());
  }, []);

  useEffect(() => {
    syncLiveItems();
    const stored = window.localStorage.getItem(QUOTE_DRAFT_STORAGE_KEY);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as Partial<DraftForm> & { contact?: Partial<DraftForm['contact']> & { createAccount?: boolean } };
      const legacyContact = (parsed.contact ?? {}) as Partial<DraftForm['contact']> & {
        createAccount?: boolean;
      };
      const { createAccount: _createAccount, ...contactFields } = legacyContact;

      void Promise.all([fetchIndustries(), fetchGeoCountries()]).then(([industries, countries]) => {
        setDraft({
          project: {
            ...EMPTY_DRAFT.project,
            ...parsed.project,
            industry: resolveIndustrySlug(industries, parsed.project?.industry),
          },
          contact: {
            ...EMPTY_DRAFT.contact,
            ...contactFields,
            country: resolveCountryCode(countries, contactFields.country),
          },
          projectAttachments: parsed.projectAttachments ?? [],
        });
      });
    } catch {
      window.localStorage.removeItem(QUOTE_DRAFT_STORAGE_KEY);
    }
  }, [syncLiveItems]);

  useEffect(() => {
    if (!cartOverlay) {
      return;
    }

    const storedOverlay = window.sessionStorage.getItem(QUOTE_CART_OVERLAY_KEY);
    if (storedOverlay) {
      try {
        setOverlayItems(JSON.parse(storedOverlay) as QuoteLiveItem[]);
        return;
      } catch {
        window.sessionStorage.removeItem(QUOTE_CART_OVERLAY_KEY);
      }
    }

    apiFetch<{
      items: Array<{
        productId: string;
        quantity: number;
        product: {
          name: string;
          slug: string;
          spu: string;
          price: { amount: number; currency: string; formatted: string };
          coverImage?: { url: string; alt: string } | null;
        };
      }>;
    }>('/api/front/cart')
      .then((cart) => {
        if (!cart?.items?.length) {
          return;
        }
        const mapped = cart.items.map((item) => ({
          id: item.productId,
          name: item.product.name,
          slug: item.product.slug,
          spu: item.product.spu,
          quantity: item.quantity,
          coverImage: item.product.coverImage ?? null,
          listUnitPrice: {
            amount: item.product.price.amount,
            currency: item.product.price.currency,
            formatted: item.product.price.formatted,
          },
        }));
        setOverlayItems(mapped);
        window.sessionStorage.setItem(QUOTE_CART_OVERLAY_KEY, JSON.stringify(mapped));
      })
      .catch(() => {});
  }, [cartOverlay]);

  useEffect(() => {
    return () => {
      if (!draftSavedRef.current && !submittedRef.current && cartOverlay) {
        window.sessionStorage.removeItem(QUOTE_CART_OVERLAY_KEY);
      }
    };
  }, [cartOverlay]);

  function updateProjectField<K extends keyof DraftForm['project']>(key: K, value: DraftForm['project'][K]) {
    setDraft((current) => ({ ...current, project: { ...current.project, [key]: value } }));
  }

  function updateContactField<K extends keyof DraftForm['contact']>(key: K, value: DraftForm['contact'][K]) {
    setDraft((current) => ({ ...current, contact: { ...current.contact, [key]: value } }));
  }

  function handleQtyChange(line: DisplayLine, quantity: number) {
    const qty = Math.max(1, quantity);
    if (line.overlay) {
      setOverlayItems((current) => {
        const next = current.map((item) => (item.id === line.id ? { ...item, quantity: qty } : item));
        window.sessionStorage.setItem(QUOTE_CART_OVERLAY_KEY, JSON.stringify(next));
        return next;
      });
      return;
    }

    updateQuoteQty(line.id, qty);
    syncLiveItems();
  }

  function handleRemove(line: DisplayLine) {
    if (line.overlay) {
      setOverlayItems((current) => {
        const next = current.filter((item) => item.id !== line.id);
        window.sessionStorage.setItem(QUOTE_CART_OVERLAY_KEY, JSON.stringify(next));
        return next;
      });
      return;
    }

    removeQuoteItem(line.id);
    syncLiveItems();
  }

  function saveDraft() {
    window.localStorage.setItem(QUOTE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    draftSavedRef.current = true;
    pushToast({ title: t('quotePage.draftSaved'), description: t('quotePage.draftSavedDesc'), tone: 'success' });
  }

  async function handleAttachmentUpload(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    const remainingSlots = MAX_QUOTE_ATTACHMENTS - draft.projectAttachments.length - pendingUploads.length;
    const selected = Array.from(files).slice(0, Math.max(0, remainingSlots));

    if (!selected.length) {
      setFeedback(t('quotePage.maxAttachments', { count: MAX_QUOTE_ATTACHMENTS }));
      return;
    }

    for (const file of selected) {
      const pendingId = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setPendingUploads((current) => [...current, { id: pendingId, filename: file.name }]);
      setUploadingCount((count) => count + 1);

      try {
        const uploaded = await uploadInquiryDocument(file);
        setDraft((current) => ({
          ...current,
          projectAttachments: [...current.projectAttachments, uploaded],
        }));
      } catch {
        setFeedback(t('quotePage.uploadFailed'));
      } finally {
        setPendingUploads((current) => current.filter((item) => item.id !== pendingId));
        setUploadingCount((count) => Math.max(0, count - 1));
      }
    }
  }

  function removeAttachment(index: number) {
    setDraft((current) => ({
      ...current,
      projectAttachments: current.projectAttachments.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function handleSubmit() {
    if (!displayLines.length) {
      setFeedback(t('quotePage.needLine'));
      return;
    }

    if (
      !draft.contact.fullName.trim()
      || !draft.contact.email.trim()
      || !draft.contact.company.trim()
      || !draft.contact.country.trim()
      || !draft.contact.phone.trim()
    ) {
      setFeedback(t('quotePage.needContact'));
      return;
    }

    const anchorProductId = displayLines[0]?.id;
    if (!anchorProductId) {
      setFeedback(t('quotePage.needLine'));
      return;
    }

    const rfqPayload = {
      project: draft.project,
      contact: { ...draft.contact, createAccount: false },
      compliance: {
        unrestrictedUseConfirmed: true,
        complianceAccepted: true,
      },
      lines: displayLines.map((line) => ({
        productId: line.id,
        spu: line.spu,
        name: line.name,
        slug: line.slug,
        quantity: line.quantity,
        requiredBy: '',
        notes: '',
        coverImage: line.coverImage ?? null,
      })),
      projectAttachments: draft.projectAttachments,
    };

    startTransition(async () => {
      setFeedback(null);
      try {
        const result = await submitInquiry({
          productId: anchorProductId,
          fullName: draft.contact.fullName.trim(),
          email: draft.contact.email.trim(),
          phone: draft.contact.phone.trim() || undefined,
          company: draft.contact.company.trim() || undefined,
          country: draft.contact.country.trim() || undefined,
          rfqPayload,
        });

        submittedRef.current = true;
        clearQuoteItems();
        window.localStorage.removeItem(QUOTE_DRAFT_STORAGE_KEY);
        window.sessionStorage.removeItem(QUOTE_CART_OVERLAY_KEY);
        syncLiveItems();

        pushToast({
          title: t('quotePage.submitted'),
          description: result.quoteNumber ? `Quote ${result.quoteNumber}` : t('quotePage.submittedDesc'),
          tone: 'success',
        });

        router.push(withLocalePath(result.redirectPath, locale));
      } catch {
        setFeedback(t('quotePage.submitFailed'));
      }
    });
  }

  return (
    <div className="quote-rfq-page">
      <header className="quote-rfq-hero">
        <div className="quote-rfq-hero__copy">
          <p className="quote-rfq-hero__eyebrow">{t('quotePage.eyebrow')}</p>
          <h1 className="quote-rfq-hero__title">{t('quotePage.heroTitle')}</h1>
          <p className="quote-rfq-hero__desc">{t('quotePage.heroDesc')}</p>
        </div>
        <div className="quote-rfq-hero__meta">
          <span className="quote-rfq-hero__pill">
            {displayLines.length === 1
              ? t('quotePage.lineCount', { count: displayLines.length })
              : t('quotePage.lineCountPlural', { count: displayLines.length })}
          </span>
          <Link href={withLocalePath('/products', locale)} className="quote-rfq-hero__link">
            {t('quotePage.continueShopping')}
          </Link>
        </div>
      </header>

      <div className="quote-rfq-layout">
        <div className="quote-rfq-main">
          <QuoteSection
            step="01"
            title={t('quotePage.lineItemsTitle')}
            requirement="required"
            description={t('quotePage.lineItemsDesc')}
          >
            {!displayLines.length ? (
              <div className="quote-rfq-empty">
                <p>{t('quotePage.emptyList')}</p>
                <Link href={withLocalePath('/products', locale)} className="button-primary">{t('quotePage.browseProducts')}</Link>
              </div>
            ) : (
              <div className="quote-rfq-line-list">
                {displayLines.map((line) => (
                  <QuoteLineItem
                    key={line.id}
                    locale={locale}
                    name={line.name}
                    slug={line.slug}
                    spu={line.spu}
                    quantity={line.quantity}
                    overlay={line.overlay}
                    coverImage={line.coverImage}
                    onQuantityChange={(quantity) => handleQtyChange(line, quantity)}
                    onRemove={() => handleRemove(line)}
                    onPreviewImage={setPreviewImage}
                  />
                ))}
              </div>
            )}
          </QuoteSection>

          <div className="quote-rfq-panels">
            <QuoteSection
              step="02"
              title={t('quotePage.contactTitle')}
              requirement="required"
              description={t('quotePage.contactDesc')}
            >
              <div className="quote-rfq-form-grid">
                <label className="quote-rfq-field">
                  <span className="quote-rfq-field__label quote-rfq-field__label--required">{t('quotePage.fieldFullName')}</span>
                  <input
                    className="quote-rfq-input"
                    value={draft.contact.fullName}
                    onChange={(e) => updateContactField('fullName', e.target.value)}
                    autoComplete="name"
                    required
                  />
                </label>
                <label className="quote-rfq-field">
                  <span className="quote-rfq-field__label quote-rfq-field__label--required">{t('quotePage.fieldWorkEmail')}</span>
                  <input
                    type="email"
                    className="quote-rfq-input"
                    value={draft.contact.email}
                    onChange={(e) => updateContactField('email', e.target.value)}
                    autoComplete="email"
                    required
                  />
                </label>
                <label className="quote-rfq-field">
                  <span className="quote-rfq-field__label quote-rfq-field__label--required">{t('quotePage.fieldCompany')}</span>
                  <input
                    className="quote-rfq-input"
                    value={draft.contact.company}
                    onChange={(e) => updateContactField('company', e.target.value)}
                    autoComplete="organization"
                    required
                  />
                </label>
                <label className="quote-rfq-field">
                  <span className="quote-rfq-field__label quote-rfq-field__label--required">{t('quotePage.fieldCountry')}</span>
                  <CountrySelect
                    className="quote-rfq-input"
                    value={draft.contact.country}
                    onChange={(value) => updateContactField('country', value)}
                    required
                  />
                </label>
                <label className="quote-rfq-field">
                  <span className="quote-rfq-field__label quote-rfq-field__label--required">{t('quotePage.fieldPhone')}</span>
                  <input
                    className="quote-rfq-input"
                    value={draft.contact.phone}
                    onChange={(e) => updateContactField('phone', e.target.value)}
                    autoComplete="tel"
                    required
                  />
                </label>
                <label className="quote-rfq-field">
                  <span className="quote-rfq-field__label quote-rfq-field__label--optional">{t('quotePage.fieldVat')}</span>
                  <input
                    className="quote-rfq-input"
                    value={draft.contact.vat}
                    onChange={(e) => updateContactField('vat', e.target.value)}
                    placeholder={t('checkout.optional')}
                  />
                </label>
              </div>
            </QuoteSection>

            <QuoteSection
              step="03"
              title={t('quotePage.projectTitle')}
              requirement="optional"
              description={t('quotePage.projectDesc')}
            >
              <div className="quote-rfq-form-grid">
                <label className="quote-rfq-field quote-rfq-field--wide">
                  <span className="quote-rfq-field__label">{t('quotePage.fieldProjectName')}</span>
                  <input className="quote-rfq-input" value={draft.project.projectName} onChange={(e) => updateProjectField('projectName', e.target.value)} placeholder={t('quotePage.projectNamePlaceholder')} />
                </label>
                <label className="quote-rfq-field">
                  <span className="quote-rfq-field__label">{t('quotePage.fieldIndustry')}</span>
                  <IndustrySelect
                    className="quote-rfq-input"
                    value={draft.project.industry}
                    onChange={(value) => updateProjectField('industry', value)}
                  />
                </label>
                <label className="quote-rfq-field">
                  <span className="quote-rfq-field__label">{t('quotePage.fieldTargetStart')}</span>
                  <input type="date" className="quote-rfq-input" value={draft.project.targetStartDate} onChange={(e) => updateProjectField('targetStartDate', e.target.value)} />
                </label>
                <label className="quote-rfq-field quote-rfq-field--wide">
                  <span className="quote-rfq-field__label">{t('quotePage.fieldAnnualVolume')}</span>
                  <input className="quote-rfq-input" value={draft.project.annualVolumeEstimate} onChange={(e) => updateProjectField('annualVolumeEstimate', e.target.value)} placeholder={t('quotePage.annualVolumePlaceholder')} />
                </label>
              </div>
            </QuoteSection>
          </div>

          <QuoteSection
            step="04"
            title={t('quotePage.attachmentsTitle')}
            requirement="optional"
            description={t('quotePage.attachmentsDesc')}
          >
            <div className="quote-rfq-upload">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="quote-rfq-upload__input"
                disabled={uploading || draft.projectAttachments.length + pendingUploads.length >= MAX_QUOTE_ATTACHMENTS}
                onChange={(event) => {
                  void handleAttachmentUpload(event.target.files);
                  event.target.value = '';
                }}
              />
              <button
                type="button"
                className="quote-rfq-upload__trigger"
                disabled={uploading || draft.projectAttachments.length + pendingUploads.length >= MAX_QUOTE_ATTACHMENTS}
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="quote-rfq-upload__icon" aria-hidden="true">↑</span>
                <span>
                  <strong>{uploading ? t('quotePage.uploading') : t('quotePage.chooseFiles')}</strong>
                  <small>{t('quotePage.uploadHint')}</small>
                </span>
              </button>

              {pendingUploads.length || draft.projectAttachments.length ? (
                <div className="quote-rfq-upload__list">
                  {pendingUploads.map((pending) => (
                    <span key={pending.id} className="quote-rfq-upload__chip is-uploading">
                      {pending.filename}
                    </span>
                  ))}
                  {draft.projectAttachments.map((file, index) => (
                    <span key={`${file.key}-${index}`} className="quote-rfq-upload__chip">
                      <span>{file.filename}</span>
                      <button type="button" onClick={() => removeAttachment(index)} aria-label={t('quotePage.removeFile', { filename: file.filename })}>
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </QuoteSection>
        </div>

        <QuoteSubmitRail
          lineCount={displayLines.length}
          projectName={draft.project.projectName}
          annualVolumeEstimate={draft.project.annualVolumeEstimate}
          onSaveDraft={saveDraft}
          onSubmit={handleSubmit}
          isSubmitting={isPending}
          canSubmit={displayLines.length > 0}
          feedback={feedback}
        />
      </div>

      {previewImage ? (
        <QuoteImageLightbox url={previewImage.url} alt={previewImage.alt} onClose={() => setPreviewImage(null)} />
      ) : null}
    </div>
  );
}
