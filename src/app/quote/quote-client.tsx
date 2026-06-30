'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';

import { useToast } from '@C/toast';
import { apiFetch } from '@/lib/api-client';
import type { Locale } from '@/lib/i18n';
import { withLocalePath } from '@/lib/i18n';
import { resolveProductSku } from '@/lib/product-sku';

type Money = {
  currency: string;
  amount: number;
  formatted: string;
};

type CartDetail = {
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    product: {
      id: string;
      name: string;
      slug: string;
      sku: string;
      shortDescription?: string | null;
      purchaseMode: 'buy' | 'inquiry';
      price: Money;
    };
  }>;
} | null;

type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  sku?: string | null;
  spu?: string | null;
  shortDescription?: string | null;
  price: Money;
  purchaseMode: 'buy' | 'inquiry';
};

type QuoteLine = {
  id: string;
  productId: string | null;
  sku: string;
  name: string;
  quantity: string;
  targetUnitPrice: string;
  requiredBy: string;
  notes: string;
  source: 'cart' | 'manual' | 'csv' | 'custom';
  attachments: string[];
};

type QuoteProject = {
  projectName: string;
  industry: string;
  targetStartDate: string;
  annualVolumeEstimate: string;
  portOfDelivery: string;
  incoterm: string;
  customerReference: string;
  fullName: string;
  email: string;
  company: string;
  country: string;
  phone: string;
  vat: string;
  createAccount: boolean;
  unrestrictedUseConfirmed: boolean;
  complianceAccepted: boolean;
};

type QuoteClientProps = {
  locale: Locale;
  intakeProductId: string;
  intakeProductName: string;
  intakeProduct: CatalogProduct | null;
  cart: CartDetail;
  catalogProducts: CatalogProduct[];
};

const QUOTE_DRAFT_STORAGE_KEY = 'vexmotor-quote-draft';

const EMPTY_PROJECT: QuoteProject = {
  projectName: '',
  industry: '',
  targetStartDate: '',
  annualVolumeEstimate: '',
  portOfDelivery: '',
  incoterm: 'FOB',
  customerReference: '',
  fullName: '',
  email: '',
  company: '',
  country: '',
  phone: '',
  vat: '',
  createAccount: false,
  unrestrictedUseConfirmed: false,
  complianceAccepted: false,
};

const INDUSTRIES = ['Factory Automation', 'Robotics', 'Medical Devices', 'Packaging', 'CNC & Tooling', 'Lab Automation'];
const INCOTERMS = ['EXW', 'FOB', 'DAP', 'DDP'];

function catalogProductCode(product: { sku?: string | null; spu?: string | null }) {
  return resolveProductSku(product);
}

function matchesCatalogCode(product: { sku?: string | null; spu?: string | null }, code: string) {
  const normalized = code.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  return catalogProductCode(product).toLowerCase() === normalized;
}

function resolveProductsFromIntake(
  catalogProducts: CatalogProduct[],
  intakeProduct: CatalogProduct | null,
  addSku: string | null,
  productId: string | null,
) {
  const results: CatalogProduct[] = [];
  const seen = new Set<string>();

  const push = (product?: CatalogProduct | null) => {
    if (!product) {
      return;
    }
    const code = catalogProductCode(product);
    if (!code) {
      return;
    }
    const key = product.id || code.toLowerCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    results.push(product);
  };

  if (productId) {
    push(catalogProducts.find((product) => product.id === productId) ?? intakeProduct);
  }

  if (addSku) {
    for (const sku of addSku.split(',').map((item) => item.trim()).filter(Boolean)) {
      push(catalogProducts.find((product) => matchesCatalogCode(product, sku)));
      if (intakeProduct && matchesCatalogCode(intakeProduct, sku)) {
        push(intakeProduct);
      }
    }
  }

  return results;
}

function buildLineId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildLineFromCatalog(product: CatalogProduct, source: QuoteLine['source']): QuoteLine {
  return {
    id: buildLineId(),
    productId: product.id,
    sku: catalogProductCode(product),
    name: product.name,
    quantity: '1',
    targetUnitPrice: product.purchaseMode === 'buy' ? product.price.amount.toFixed(2) : '',
    requiredBy: '',
    notes: '',
    source,
    attachments: [],
  };
}

function buildLineFromCartItem(item: NonNullable<CartDetail>['items'][number]): QuoteLine {
  return {
    id: buildLineId(),
    productId: item.productId,
    sku: item.product.sku,
    name: item.product.name,
    quantity: String(item.quantity),
    targetUnitPrice: item.product.purchaseMode === 'buy' ? item.product.price.amount.toFixed(2) : '',
    requiredBy: '',
    notes: item.product.shortDescription ?? '',
    source: 'cart',
    attachments: [],
  };
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (character === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }

    current += character;
  }

  cells.push(current.trim());
  return cells;
}

function mapCsvHeaders(headers: string[]) {
  const normalizedHeaders = headers.map((header) => header.trim().toLowerCase());
  const findIndex = (names: string[]) => normalizedHeaders.findIndex((header) => names.includes(header));
  return {
    sku: findIndex(['sku', 'model', '型号', '料号']),
    name: findIndex(['name', 'product', '产品', '名称']),
    quantity: findIndex(['qty', 'quantity', '数量']),
    targetUnitPrice: findIndex(['target unit price', 'target price', 'price', '目标单价']),
    notes: findIndex(['notes', 'note', '备注']),
  };
}

function toDraftPayload(project: QuoteProject, lines: QuoteLine[], projectAttachments: string[]) {
  return JSON.stringify({ project, lines, projectAttachments });
}

export function QuoteClient({ locale, intakeProductId, intakeProductName, intakeProduct, cart, catalogProducts }: QuoteClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pushToast } = useToast();
  const [project, setProject] = useState<QuoteProject>(EMPTY_PROJECT);
  const [lines, setLines] = useState<QuoteLine[]>(() => cart?.items.map(buildLineFromCartItem) ?? []);
  const [activeSource, setActiveSource] = useState<'cart' | 'manual' | 'csv' | 'custom'>('cart');
  const [skuSearch, setSkuSearch] = useState('');
  const [customLineName, setCustomLineName] = useState('');
  const [customLineQuantity, setCustomLineQuantity] = useState('1');
  const [customLineNotes, setCustomLineNotes] = useState('');
  const [projectAttachments, setProjectAttachments] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fromCartCount = cart?.items.length ?? 0;
  const annualVolumeDisplay = project.annualVolumeEstimate.trim() || 'Not set';
  const filteredProducts = useMemo(() => {
    const query = skuSearch.trim().toLowerCase();
    if (!query) {
      return catalogProducts.slice(0, 8);
    }

    return catalogProducts
      .filter((product) => `${product.name} ${catalogProductCode(product)}`.toLowerCase().includes(query))
      .slice(0, 8);
  }, [catalogProducts, skuSearch]);

  useEffect(() => {
    if (!cart?.items.length) {
      const stored = window.localStorage.getItem(QUOTE_DRAFT_STORAGE_KEY);
      if (!stored) {
        return;
      }

      try {
        const parsed = JSON.parse(stored) as { project?: QuoteProject; lines?: QuoteLine[]; projectAttachments?: string[] };
        if (parsed.project) {
          setProject(parsed.project);
        }
        if (parsed.lines?.length) {
          setLines(parsed.lines);
        }
        if (parsed.projectAttachments?.length) {
          setProjectAttachments(parsed.projectAttachments);
        }
      } catch {
        window.localStorage.removeItem(QUOTE_DRAFT_STORAGE_KEY);
      }
    }
  }, [cart]);

  useEffect(() => {
    const addSku = searchParams.get('addSku');
    const productId = searchParams.get('productId');
    if (!addSku && !productId) {
      return;
    }

    const incomingProducts = resolveProductsFromIntake(catalogProducts, intakeProduct, addSku, productId);
    if (!incomingProducts.length) {
      return;
    }

    setLines((current) => {
      const existingCodes = new Set(current.map((line) => line.sku.toLowerCase()));
      const nextLines = incomingProducts
        .filter((product) => {
          const code = catalogProductCode(product).toLowerCase();
          return code && !existingCodes.has(code);
        })
        .map((product) => buildLineFromCatalog(product, 'manual'));

      return nextLines.length ? [...current, ...nextLines] : current;
    });
    setActiveSource('manual');
  }, [catalogProducts, intakeProduct, searchParams]);

  function updateProject<K extends keyof QuoteProject>(key: K, value: QuoteProject[K]) {
    setProject((current) => ({ ...current, [key]: value }));
  }

  function updateLine<K extends keyof QuoteLine>(lineId: string, key: K, value: QuoteLine[K]) {
    setLines((current) => current.map((line) => (line.id === lineId ? { ...line, [key]: value } : line)));
  }

  function addCatalogLine(product: CatalogProduct, source: QuoteLine['source']) {
    setLines((current) => {
      if (current.some((line) => line.sku.toLowerCase() === catalogProductCode(product).toLowerCase())) {
        return current;
      }
      return [...current, buildLineFromCatalog(product, source)];
    });
    setFeedback(null);
  }

  function addCustomLine() {
    if (!customLineName.trim()) {
      setFeedback('Enter a custom line name before adding a custom requirement.');
      return;
    }

    setLines((current) => [
      ...current,
      {
        id: buildLineId(),
        productId: null,
        sku: 'CUSTOM',
        name: customLineName.trim(),
        quantity: customLineQuantity.trim() || '1',
        targetUnitPrice: '',
        requiredBy: '',
        notes: customLineNotes.trim(),
        source: 'custom',
        attachments: [],
      },
    ]);
    setCustomLineName('');
    setCustomLineQuantity('1');
    setCustomLineNotes('');
    setFeedback(null);
  }

  async function importBom(file: File) {
    const text = await file.text();
    const rows = text.split(/\r?\n/).map((row) => row.trim()).filter(Boolean);
    if (rows.length < 2) {
      setFeedback('The CSV needs a header row and at least one line item.');
      return;
    }

    const headerMap = mapCsvHeaders(parseCsvLine(rows[0]!));
    if (headerMap.sku < 0 && headerMap.name < 0) {
      setFeedback('CSV import needs at least an SKU or product name column.');
      return;
    }

    const nextLines: QuoteLine[] = [];
    for (const row of rows.slice(1)) {
      const cells = parseCsvLine(row);
      const sku = headerMap.sku >= 0 ? cells[headerMap.sku] ?? '' : '';
      const name = headerMap.name >= 0 ? cells[headerMap.name] ?? '' : '';
      const quantity = headerMap.quantity >= 0 ? cells[headerMap.quantity] ?? '1' : '1';
      const targetUnitPrice = headerMap.targetUnitPrice >= 0 ? cells[headerMap.targetUnitPrice] ?? '' : '';
      const notes = headerMap.notes >= 0 ? cells[headerMap.notes] ?? '' : '';

      const matched = catalogProducts.find((product) => matchesCatalogCode(product, sku))
        ?? catalogProducts.find((product) => product.name.toLowerCase() === name.toLowerCase());

      if (matched) {
        nextLines.push({ ...buildLineFromCatalog(matched, 'csv'), quantity: quantity || '1', targetUnitPrice: targetUnitPrice || '', notes });
      } else if (sku || name) {
        nextLines.push({
          id: buildLineId(),
          productId: null,
          sku: sku || 'CUSTOM',
          name: name || sku,
          quantity: quantity || '1',
          targetUnitPrice: targetUnitPrice || '',
          requiredBy: '',
          notes,
          source: 'csv',
          attachments: [],
        });
      }
    }

    if (!nextLines.length) {
      setFeedback('No usable rows were found in the CSV import.');
      return;
    }

    setLines((current) => {
      const existingSkus = new Set(current.map((line) => `${line.sku}:${line.name}`.toLowerCase()));
      return [...current, ...nextLines.filter((line) => !existingSkus.has(`${line.sku}:${line.name}`.toLowerCase()))];
    });
    setFeedback(`${nextLines.length} line item${nextLines.length === 1 ? '' : 's'} imported from CSV.`);
    pushToast({ title: 'BOM imported', description: `${nextLines.length} line item${nextLines.length === 1 ? '' : 's'} added to the RFQ.`, tone: 'success' });
  }

  function saveDraft() {
    window.localStorage.setItem(QUOTE_DRAFT_STORAGE_KEY, toDraftPayload(project, lines, projectAttachments));
    pushToast({ title: 'Draft saved', description: 'The current RFQ draft is stored locally in this browser.', tone: 'success' });
  }

  function validateBeforeSubmit() {
    if (!project.fullName.trim() || !project.email.trim()) {
      return 'Buyer name and email are required before submitting the RFQ.';
    }
    if (!lines.length) {
      return 'Add at least one line item before submitting the RFQ.';
    }
    if (lines.some((line) => Number(line.quantity) <= 0)) {
      return 'Every RFQ line needs a quantity greater than zero.';
    }
    if (!project.unrestrictedUseConfirmed || !project.complianceAccepted) {
      return 'Confirm the compliance statements before submitting the RFQ.';
    }
    return null;
  }

  function submitRfq() {
    startTransition(async () => {
      const validationError = validateBeforeSubmit();
      if (validationError) {
        setFeedback(validationError);
        pushToast({ title: 'RFQ incomplete', description: validationError, tone: 'error', persistent: true });
        return;
      }

      setFeedback(null);

      const message = [
        'RFQ PROJECT',
        `Project name: ${project.projectName || 'Not specified'}`,
        `Industry: ${project.industry || 'Not specified'}`,
        `Target start date: ${project.targetStartDate || 'Not specified'}`,
        `Annual volume estimate: ${project.annualVolumeEstimate || 'Not specified'}`,
        `Port of delivery: ${project.portOfDelivery || 'Not specified'}`,
        `Incoterm: ${project.incoterm}`,
        `Customer reference: ${project.customerReference || 'Not specified'}`,
        `VAT / Tax ID: ${project.vat || 'Not specified'}`,
        project.createAccount ? 'Create account to track this RFQ: yes' : 'Create account to track this RFQ: no',
        '',
        'LINE ITEMS',
        ...lines.map((line, index) => [
          `${index + 1}. ${line.name}`,
          `   SKU: ${line.sku}`,
          `   Quantity: ${line.quantity}`,
          `   Target unit price: ${line.targetUnitPrice || 'Not specified'}`,
          `   Required by: ${line.requiredBy || 'Not specified'}`,
          `   Notes: ${line.notes || 'Not specified'}`,
          `   Attachments: ${line.attachments.length ? line.attachments.join(', ') : 'None'}`,
          `   Source: ${line.source}`,
        ].join('\n')),
        '',
        'PROJECT ATTACHMENTS',
        projectAttachments.length ? projectAttachments.join(', ') : 'None',
        '',
        'COMPLIANCE',
        'Confirmed unrestricted use: yes',
        'Confirmed documentation/compliance statements: yes',
      ].join('\n');

      try {
        const created = await apiFetch<{ redirectPath?: string }>('/api/front/inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: intakeProductId,
            fullName: project.fullName,
            email: project.email,
            phone: project.phone,
            company: project.company,
            country: project.country,
            message,
          }),
        });

        window.localStorage.removeItem(QUOTE_DRAFT_STORAGE_KEY);
        pushToast({ title: 'RFQ submitted', description: 'The quote request was sent to the sales queue.', tone: 'success' });
        router.push(created.redirectPath ?? withLocalePath('/contact', locale));
        router.refresh();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'The RFQ could not be submitted right now.';
        setFeedback(errorMessage);
        pushToast({ title: 'RFQ submission failed', description: errorMessage, tone: 'error', persistent: true });
      }
    });
  }

  return (
    <div className="quote-stack">
      <nav className="detail-tab-nav detail-subnav" aria-label="RFQ section navigation">
        <a href="#quote-project" className="detail-tab-link">Project</a>
        <a href="#quote-lines" className="detail-tab-link">Line items</a>
        <a href="#quote-submit" className="detail-tab-link">Submit</a>
      </nav>

      <div className="quote-layout-grid">
        <div className="trade-main-stack quote-main-stack">
          <article id="quote-project" className="info-card quote-section-card">
            <div className="section-header trade-card-header">
              <div>
                <h2 className="cart-section-title">Project info</h2>
                <p className="section-description">Capture the project context once so the sales and engineering teams can qualify the RFQ without bouncing across separate forms.</p>
              </div>
              <span className="product-badge">Step 1 of 3</span>
            </div>

            <div className="quote-form-grid">
              <label className="form-field">
                <span>Project name</span>
                <input className="form-input" value={project.projectName} onChange={(event) => updateProject('projectName', event.target.value)} placeholder="OEM pilot line, retrofit, tooling refresh..." />
              </label>
              <label className="form-field">
                <span>Industry</span>
                <select className="form-input" value={project.industry} onChange={(event) => updateProject('industry', event.target.value)}>
                  <option value="">Select industry</option>
                  {INDUSTRIES.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Target start date</span>
                <input type="date" className="form-input" value={project.targetStartDate} onChange={(event) => updateProject('targetStartDate', event.target.value)} />
              </label>
              <label className="form-field">
                <span>Annual volume estimate</span>
                <input className="form-input" value={project.annualVolumeEstimate} onChange={(event) => updateProject('annualVolumeEstimate', event.target.value)} placeholder="Annual demand or pilot quantity" />
              </label>
              <label className="form-field">
                <span>Port of delivery</span>
                <input className="form-input" value={project.portOfDelivery} onChange={(event) => updateProject('portOfDelivery', event.target.value)} placeholder="Hamburg, Los Angeles, Shenzhen..." />
              </label>
              <label className="form-field">
                <span>Incoterm</span>
                <select className="form-input" value={project.incoterm} onChange={(event) => updateProject('incoterm', event.target.value)}>
                  {INCOTERMS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="form-field" style={{ gridColumn: '1 / -1' }}>
                <span>Customer reference</span>
                <input className="form-input" value={project.customerReference} onChange={(event) => updateProject('customerReference', event.target.value)} placeholder="Buyer reference, program code, or internal request number" />
              </label>
            </div>
          </article>

          <article id="quote-lines" className="info-card quote-section-card">
            <div className="section-header trade-card-header">
              <div>
                <h2 className="cart-section-title">Line items</h2>
                <p className="section-description">Use the quote cart, search direct SKUs, import a BOM CSV, or describe custom requirements. All sources normalize into one line-item list.</p>
              </div>
              <span className="product-badge">Step 2 of 3</span>
            </div>

            <div className="filter-chip-list">
              <button type="button" className={`filter-chip cart-chip-button ${activeSource === 'cart' ? 'quote-chip-active' : ''}`} onClick={() => setActiveSource('cart')}>From Quote Cart ({fromCartCount})</button>
              <button type="button" className={`filter-chip cart-chip-button ${activeSource === 'manual' ? 'quote-chip-active' : ''}`} onClick={() => setActiveSource('manual')}>Add SKU</button>
              <button type="button" className={`filter-chip cart-chip-button ${activeSource === 'csv' ? 'quote-chip-active' : ''}`} onClick={() => setActiveSource('csv')}>Import BOM (CSV)</button>
              <button type="button" className={`filter-chip cart-chip-button ${activeSource === 'custom' ? 'quote-chip-active' : ''}`} onClick={() => setActiveSource('custom')}>Describe custom</button>
            </div>

            {activeSource === 'cart' ? (
              <div className="quote-source-panel">
                <p className="section-description">{fromCartCount ? 'Direct-buy cart lines have been pulled in as the default RFQ starting point.' : 'No current cart lines were found, so build the RFQ from SKU search, CSV import, or a custom line.'}</p>
                {fromCartCount ? (
                  <Link href={withLocalePath('/cart', locale)} className="section-link">Review the source cart</Link>
                ) : null}
              </div>
            ) : null}

            {activeSource === 'manual' ? (
              <div className="quote-source-panel">
                <label className="form-field">
                  <span>Search SKU or product</span>
                  <input className="form-input" value={skuSearch} onChange={(event) => setSkuSearch(event.target.value)} placeholder="Search by SKU, driver, motor family, or accessory" />
                </label>
                <div className="quote-search-result-list">
                  {filteredProducts.map((product) => (
                    <article key={product.id} className="quote-search-result-card">
                      <div>
                        <strong>{product.name}</strong>
                        <p className="product-meta">{catalogProductCode(product)} · {product.purchaseMode === 'buy' ? product.price.formatted : 'Request Quote'}</p>
                        <p className="section-description compact-copy">{product.shortDescription ?? 'Catalog product available for quote intake.'}</p>
                      </div>
                      <button type="button" className="button-secondary cart-action-button" onClick={() => addCatalogLine(product, 'manual')}>
                        Add line
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {activeSource === 'csv' ? (
              <div className="quote-source-panel">
                <p className="section-description">Accepted headers include SKU / Name / Quantity / Target Unit Price / Notes, and BOM import also recognizes Chinese headers like 型号, 名称, 数量, 目标单价, 备注.</p>
                <div className="trade-empty-actions">
                  <a
                    href={`data:text/csv;charset=utf-8,SKU,Name,Quantity,Target Unit Price,Notes\nVXM-17-45NCM,17 Single Shaft Bipolar Stepper Motor,10,22.50,Need matching driver`}
                    download="rfq-template.csv"
                    className="button-secondary product-back-link"
                  >
                    Download template
                  </a>
                  <label className="button-primary quote-file-button">
                    Upload CSV
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          void importBom(file);
                        }
                        event.target.value = '';
                      }}
                      hidden
                    />
                  </label>
                </div>
              </div>
            ) : null}

            {activeSource === 'custom' ? (
              <div className="quote-source-panel quote-form-grid">
                <label className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <span>Custom item / requirement</span>
                  <input className="form-input" value={customLineName} onChange={(event) => setCustomLineName(event.target.value)} placeholder="Custom gearbox bracket, cable set, modified shaft, OEM assembly..." />
                </label>
                <label className="form-field">
                  <span>Quantity</span>
                  <input className="form-input" value={customLineQuantity} onChange={(event) => setCustomLineQuantity(event.target.value)} placeholder="1" />
                </label>
                <label className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <span>Parameters / notes</span>
                  <textarea className="form-input form-textarea" rows={4} value={customLineNotes} onChange={(event) => setCustomLineNotes(event.target.value)} placeholder="Key dimensions, torque, voltage, file references, and commercial constraints" />
                </label>
                <button type="button" className="button-secondary cart-action-button" onClick={addCustomLine}>Add custom line</button>
              </div>
            ) : null}

            <div className="quote-line-list">
              {lines.length ? (
                lines.map((line) => (
                  <article key={line.id} className="quote-line-card">
                    <div className="quote-line-head">
                      <div>
                        <strong>{line.name}</strong>
                        <p className="product-meta">{line.sku} · Source: {line.source}</p>
                      </div>
                      <button type="button" className="button-secondary cart-action-button" onClick={() => setLines((current) => current.filter((item) => item.id !== line.id))}>
                        Remove
                      </button>
                    </div>

                    <div className="quote-form-grid quote-line-grid">
                      <label className="form-field">
                        <span>SKU</span>
                        <input className="form-input" value={line.sku} onChange={(event) => updateLine(line.id, 'sku', event.target.value)} />
                      </label>
                      <label className="form-field">
                        <span>Qty</span>
                        <input className="form-input" value={line.quantity} onChange={(event) => updateLine(line.id, 'quantity', event.target.value)} />
                      </label>
                      <label className="form-field">
                        <span>Target unit price</span>
                        <input className="form-input" value={line.targetUnitPrice} onChange={(event) => updateLine(line.id, 'targetUnitPrice', event.target.value)} placeholder="Optional" />
                      </label>
                      <label className="form-field">
                        <span>Required by</span>
                        <input type="date" className="form-input" value={line.requiredBy} onChange={(event) => updateLine(line.id, 'requiredBy', event.target.value)} />
                      </label>
                      <label className="form-field" style={{ gridColumn: '1 / -1' }}>
                        <span>Notes</span>
                        <textarea className="form-input form-textarea" rows={3} value={line.notes} onChange={(event) => updateLine(line.id, 'notes', event.target.value)} placeholder="Line-specific notes, alternate requirements, engineering context, or commercial targets" />
                      </label>
                      <label className="form-field" style={{ gridColumn: '1 / -1' }}>
                        <span>Line attachments</span>
                        <input
                          type="file"
                          multiple
                          onChange={(event) => updateLine(line.id, 'attachments', Array.from(event.target.files ?? []).map((file) => file.name))}
                        />
                        <span className="section-description compact-copy">{line.attachments.length ? line.attachments.join(', ') : 'No line-level files attached yet.'}</span>
                      </label>
                    </div>
                  </article>
                ))
              ) : (
                <article className="info-card trade-empty-card">
                  <h3 style={{ marginTop: 0 }}>No RFQ lines yet</h3>
                  <p className="section-description">Start from the quote cart, add a specific SKU, import a BOM CSV, or describe a custom requirement.</p>
                </article>
              )}
            </div>
          </article>

          <article className="info-card quote-section-card">
            <div className="section-header trade-card-header">
              <div>
                <h2 className="cart-section-title">Project attachments</h2>
                <p className="section-description">List the files that should travel with the quote, including CAD packages, drawings, requirement docs, or customer BOMs.</p>
              </div>
            </div>

            <label className="button-secondary quote-file-button">
              Attach project files
              <input
                type="file"
                multiple
                onChange={(event) => setProjectAttachments(Array.from(event.target.files ?? []).map((file) => file.name))}
                hidden
              />
            </label>
            <p className="section-description compact-copy">{projectAttachments.length ? projectAttachments.join(', ') : 'No project-level attachments listed yet.'}</p>
          </article>

          <article className="info-card quote-section-card">
            <div className="section-header trade-card-header">
              <div>
                <h2 className="cart-section-title">Contact & company</h2>
                <p className="section-description">Buyer details are required so the response can route into the right quoting, compliance, and follow-up workflow.</p>
              </div>
            </div>

            <div className="quote-form-grid">
              <label className="form-field">
                <span>Email</span>
                <input className="form-input" type="email" value={project.email} onChange={(event) => updateProject('email', event.target.value)} placeholder="name@company.com" />
              </label>
              <label className="form-field">
                <span>Full name</span>
                <input className="form-input" value={project.fullName} onChange={(event) => updateProject('fullName', event.target.value)} placeholder="Buyer or engineering contact" />
              </label>
              <label className="form-field">
                <span>Company</span>
                <input className="form-input" value={project.company} onChange={(event) => updateProject('company', event.target.value)} placeholder="Company name" />
              </label>
              <label className="form-field">
                <span>Country</span>
                <input className="form-input" value={project.country} onChange={(event) => updateProject('country', event.target.value)} placeholder="Country / Region" />
              </label>
              <label className="form-field">
                <span>Phone</span>
                <input className="form-input" value={project.phone} onChange={(event) => updateProject('phone', event.target.value)} placeholder="Optional but recommended" />
              </label>
              <label className="form-field">
                <span>VAT / Tax ID</span>
                <input className="form-input" value={project.vat} onChange={(event) => updateProject('vat', event.target.value)} placeholder="Optional" />
              </label>
            </div>
          </article>

          <article id="quote-submit" className="info-card quote-section-card">
            <div className="section-header trade-card-header">
              <div>
                <h2 className="cart-section-title">Compliance & submit</h2>
                <p className="section-description">Confirm the compliance statements, optionally keep an account-tracking hint, then submit the RFQ into the existing inquiry queue.</p>
              </div>
              <span className="product-badge">Step 3 of 3</span>
            </div>

            <label className="checkout-toggle-row">
              <input type="checkbox" checked={project.unrestrictedUseConfirmed} onChange={(event) => updateProject('unrestrictedUseConfirmed', event.target.checked)} />
              <span>I confirm the project is not intended for restricted use and can proceed through standard export/compliance review.</span>
            </label>
            <label className="checkout-toggle-row">
              <input type="checkbox" checked={project.complianceAccepted} onChange={(event) => updateProject('complianceAccepted', event.target.checked)} />
              <span>I understand that pricing, lead time, and document availability are confirmed after engineering and sourcing review.</span>
            </label>
            <label className="checkout-toggle-row">
              <input type="checkbox" checked={project.createAccount} onChange={(event) => updateProject('createAccount', event.target.checked)} />
              <span>Create account to track this RFQ</span>
            </label>

            <div className="trade-empty-actions">
              <button type="button" className="button-secondary product-back-link" onClick={saveDraft}>
                Save draft
              </button>
              <button type="button" className="button-primary" onClick={submitRfq} disabled={isPending}>
                {isPending ? 'Submitting...' : 'Submit RFQ'}
              </button>
            </div>
            <p className="section-description compact-copy">Typical response within 1 business day. The RFQ is submitted through the current inquiry service using {intakeProductName} as the intake anchor.</p>
            {feedback ? <p className="form-feedback form-feedback-error">{feedback}</p> : null}
          </article>
        </div>

        <aside className="trade-side-stack quote-side-stack">
          <article className="info-card cart-summary-card quote-summary-card">
            <h2 className="cart-section-title">RFQ summary</h2>
            <div className="cart-summary-list">
              <div className="cart-summary-row">
                <span className="section-description">Project</span>
                <strong>{project.projectName || 'Untitled RFQ'}</strong>
              </div>
              <div className="cart-summary-row">
                <span className="section-description">Line items</span>
                <strong>{lines.length}</strong>
              </div>
              <div className="cart-summary-row">
                <span className="section-description">Annual volume</span>
                <strong>{annualVolumeDisplay}</strong>
              </div>
              <div className="cart-summary-row">
                <span className="section-description">Incoterm</span>
                <strong>{project.incoterm}</strong>
              </div>
              <div className="cart-summary-row is-total">
                <span>Response target</span>
                <strong>1 business day</strong>
              </div>
            </div>

            <div className="quote-summary-note-list">
              <div className="support-item">
                <span className="support-bullet" />
                <span>From Quote Cart, Add SKU, Import BOM, and custom lines all normalize into one shared line list.</span>
              </div>
              <div className="support-item">
                <span className="support-bullet" />
                <span>Line attachments and project files are captured as named references in the current inquiry workflow.</span>
              </div>
              <div className="support-item">
                <span className="support-bullet" />
                <span>Use Save draft before leaving if the BOM or buyer details are still incomplete.</span>
              </div>
            </div>

            <Link href={withLocalePath('/cart', locale)} className="nav-link">Back to cart</Link>
            <Link href={withLocalePath('/contact', locale)} className="nav-link">General RFQ desk</Link>
          </article>
        </aside>
      </div>
    </div>
  );
}