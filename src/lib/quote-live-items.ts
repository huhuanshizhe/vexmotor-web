export const QUOTE_LIVE_STORAGE_KEY = 'vexmotor-quote-live-items';
export const QUOTE_ITEMS_UPDATED_EVENT = 'vexmotor:quote-items-updated';

export type QuoteLiveItem = {
  id: string;
  name: string;
  slug: string;
  spu: string;
  quantity: number;
  coverImage?: { url: string; alt: string } | null;
  listUnitPrice?: { amount: number; currency: string; formatted: string };
};

const MAX_QUOTE_ITEMS = 99;

export function readQuoteItems() {
  if (typeof window === 'undefined') {
    return [] as QuoteLiveItem[];
  }

  const stored = window.localStorage.getItem(QUOTE_LIVE_STORAGE_KEY);
  if (!stored) {
    return [] as QuoteLiveItem[];
  }

  try {
    const parsed = JSON.parse(stored) as QuoteLiveItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [] as QuoteLiveItem[];
  }
}

export function writeQuoteItems(items: QuoteLiveItem[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(QUOTE_LIVE_STORAGE_KEY, JSON.stringify(items.slice(0, MAX_QUOTE_ITEMS)));
  window.dispatchEvent(new Event(QUOTE_ITEMS_UPDATED_EVENT));
}

export function addQuoteItem(item: Omit<QuoteLiveItem, 'quantity'>, quantity: number) {
  const qty = Math.max(1, quantity);
  const current = readQuoteItems();
  const existing = current.find((entry) => entry.id === item.id);

  if (existing) {
    const nextItems = current.map((entry) =>
      entry.id === item.id ? { ...entry, quantity: Math.min(MAX_QUOTE_ITEMS, entry.quantity + qty) } : entry,
    );
    writeQuoteItems(nextItems);
    return nextItems;
  }

  const nextItems = [{ ...item, quantity: qty }, ...current].slice(0, MAX_QUOTE_ITEMS);
  writeQuoteItems(nextItems);
  return nextItems;
}

export function updateQuoteQty(productId: string, quantity: number) {
  const qty = Math.max(1, Math.min(MAX_QUOTE_ITEMS, quantity));
  const nextItems = readQuoteItems().map((entry) =>
    entry.id === productId ? { ...entry, quantity: qty } : entry,
  );
  writeQuoteItems(nextItems);
  return nextItems;
}

export function removeQuoteItem(productId: string) {
  const nextItems = readQuoteItems().filter((entry) => entry.id !== productId);
  writeQuoteItems(nextItems);
  return nextItems;
}

export function isProductInQuote(productId: string) {
  return readQuoteItems().some((entry) => entry.id === productId);
}

export function clearQuoteItems() {
  writeQuoteItems([]);
  return [] as QuoteLiveItem[];
}
