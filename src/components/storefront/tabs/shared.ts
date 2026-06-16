export type ProductDetailTabKey =
  | 'description'
  | 'specifications'
  | 'dimensions'
  | 'torque-curves'
  | 'custom-design'
  | 'downloads'
  | 'reviews';

export type ProductDetailSpecGroup = {
  title: string;
  description: string;
  rows: Array<{
    label: string;
    value: string;
  }>;
};

export type ProductDetailImage = {
  url: string;
  alt?: string | null;
  imageType?: string | null;
  isDimension?: boolean;
};

export type ProductDocumentCard = {
  title: string;
  meta: string;
  description: string;
  href: string;
  external?: boolean;
};

export type OverviewNote = {
  title: string;
  kind: 'chips' | 'copy';
  items?: string[];
  paragraphs?: string[];
};

export const TAB_DEFINITIONS: Array<{
  key: ProductDetailTabKey;
  label: string;
  panelId: string;
  legacyHash: string;
}> = [
  { key: 'description', label: 'Overview', panelId: 'detail-overview', legacyHash: 'tab-description' },
  { key: 'specifications', label: 'Specifications', panelId: 'detail-specifications', legacyHash: 'tab-specifications' },
  { key: 'dimensions', label: 'Dimensions', panelId: 'detail-dimensions', legacyHash: 'tab-dimensions' },
  { key: 'torque-curves', label: 'Torque Curves', panelId: 'detail-torque-curves', legacyHash: 'tab-torque-curves' },
  { key: 'custom-design', label: 'Custom Program', panelId: 'detail-custom-design', legacyHash: 'tab-custom-design' },
  { key: 'downloads', label: 'Documents', panelId: 'detail-downloads', legacyHash: 'tab-downloads' },
  { key: 'reviews', label: 'Field Feedback', panelId: 'detail-reviews', legacyHash: 'tab-reviews' },
];

export const TAB_BY_KEY = TAB_DEFINITIONS.reduce<Record<ProductDetailTabKey, (typeof TAB_DEFINITIONS)[number]>>((acc, tab) => {
  acc[tab.key] = tab;
  return acc;
}, {} as Record<ProductDetailTabKey, (typeof TAB_DEFINITIONS)[number]>);

export const HASH_TO_TAB = TAB_DEFINITIONS.reduce<Record<string, ProductDetailTabKey>>((acc, tab) => {
  acc[tab.panelId] = tab.key;
  acc[tab.legacyHash] = tab.key;
  return acc;
}, {});

export function formatStatValue(value: number) {
  return String(value).padStart(2, '0');
}

export function normalizeDescriptionText(value: string) {
  return value
    .replace(/\s+/g, ' ')
    .replace(/,(?=[^\s])/g, ', ')
    .replace(/;(?=[^\s])/g, '; ')
    .replace(/:(?=[^\s])/g, ': ')
    .replace(/\?(?=[^\s])/g, '? ')
    .replace(/!(?=[^\s])/g, '! ')
    .replace(/\.([A-Z])/g, '. $1')
    .replace(/([)])(?=[^\s])/g, '$1 ')
    .trim();
}

export function splitIntoParagraphs(value: string, chunkSize = 2) {
  const normalized = normalizeDescriptionText(value);
  if (!normalized) return [] as string[];

  const sentences = normalized.split(/(?<=[.!?])\s+(?=[A-Z])/).map((s) => s.trim()).filter(Boolean);
  if (sentences.length <= 1) return [normalized];

  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += chunkSize) {
    paragraphs.push(sentences.slice(i, i + chunkSize).join(' '));
  }
  return paragraphs;
}

export function splitIntoItems(value: string) {
  return normalizeDescriptionText(value)
    .replace(/\.$/, '')
    .split(/,\s+|\s+and\s+/i)
    .map((item) => item.trim().replace(/^(?:like|for)\s+/i, '').replace(/^and\s+/i, ''))
    .filter((item, i, arr) => item.length > 3 && arr.indexOf(item) === i)
    .slice(0, 6);
}

export function extractOverviewContent(description: string) {
  const normalized = normalizeDescriptionText(description);
  if (!normalized) return { leadParagraphs: [] as string[], notes: [] as OverviewNote[] };

  const markers = [
    { key: 'keyElectrical', label: 'Key Electrical Specs', pattern: /Key Electrical Specs/ },
    { key: 'mechanical', label: 'Mechanical Specs', pattern: /Mechanical Specs/ },
    { key: 'idealFor', label: 'Ideal applications', pattern: /Ideal For/, kind: 'chips' as const },
    { key: 'applications', label: 'Applications', pattern: /\bApplications\b(?=\s*[:\-])/, kind: 'chips' as const },
    { key: 'keyFeatures', label: 'Key features', pattern: /Key Features/, kind: 'chips' as const },
    { key: 'whyPick', label: 'Why this motor', pattern: /Why Pick This Motor\?/, kind: 'copy' as const },
    { key: 'whyChoose', label: 'Why choose this motor', pattern: /Why Choose This Motor\?/, kind: 'copy' as const },
  ];

  const matches = markers
    .map((m) => {
      const match = m.pattern.exec(normalized);
      return match ? { ...m, index: match.index, text: match[0] } : null;
    })
    .filter((m): m is NonNullable<typeof m> => Boolean(m))
    .sort((a, b) => a.index - b.index);

  const leadText = matches.length ? normalized.slice(0, matches[0].index).trim() : normalized;
  const leadParagraphs = splitIntoParagraphs(leadText, 2).slice(0, 2);
  const notes: OverviewNote[] = [];
  const seenTitles = new Set<string>();

  matches.forEach((match, idx) => {
    if (!('kind' in match)) return;
    const nextIdx = idx + 1 < matches.length ? matches[idx + 1].index : normalized.length;
    const sectionText = normalized.slice(match.index + match.text.length, nextIdx).replace(/^[:\-\s]+/, '').trim();
    if (!sectionText || seenTitles.has(match.label)) return;

    if (match.kind === 'chips') {
      const items = splitIntoItems(sectionText);
      if (items.length) {
        notes.push({ title: match.label, kind: 'chips', items });
        seenTitles.add(match.label);
      }
      return;
    }
    const paragraphs = splitIntoParagraphs(sectionText, 2).slice(0, 2);
    if (paragraphs.length) {
      notes.push({ title: match.label, kind: 'copy', paragraphs });
      seenTitles.add(match.label);
    }
  });

  if (!leadParagraphs.length && !notes.length) {
    return { leadParagraphs: [normalized], notes: [] as OverviewNote[] };
  }
  return { leadParagraphs, notes: notes.slice(0, 3) };
}
