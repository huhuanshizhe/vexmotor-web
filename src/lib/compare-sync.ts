import {
  addCompareItemRemote,
  fetchCompareItems,
  type CompareServerItem,
} from '@/lib/compare-api';
import { type CompareItem, readCompareItems, writeCompareItems } from '@/lib/compare-items';

export function serverItemToCompareItem(entry: CompareServerItem): CompareItem {
  const product = entry.product;
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.spu,
    priceLabel: product.purchaseMode === 'buy' ? product.price.formatted : 'Request Quote',
    purchaseMode: product.purchaseMode === 'buy' ? 'buy' : 'inquiry',
    inStock: product.inStock,
    categories: product.category ? [product.category] : [],
  };
}

export function mergeCompareLists(local: CompareItem[], serverItems: CompareServerItem[]) {
  const fromServer = serverItems.map(serverItemToCompareItem);
  const serverIds = new Set(fromServer.map((item) => item.id));
  const localOnly = local.filter((item) => !serverIds.has(item.id));
  return [...fromServer, ...localOnly].slice(0, 4);
}

export async function syncCompareWithServer() {
  const server = await fetchCompareItems();
  const local = readCompareItems();
  const merged = mergeCompareLists(local, server.items);
  writeCompareItems(merged);

  const serverIds = new Set(server.items.map((item) => item.productId));
  const uploads = merged.filter((item) => !serverIds.has(item.id)).map((item) => addCompareItemRemote(item.id));
  if (uploads.length) {
    await Promise.all(uploads.map((task) => task.catch(() => undefined)));
  }

  return merged;
}
