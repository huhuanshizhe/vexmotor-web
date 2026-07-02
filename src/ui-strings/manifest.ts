import { createHash } from 'crypto';

import { UI_STRING_REGISTRY } from '@/ui-strings/registry';

export type UiStringsManifest = {
  version: string;
  generatedAt: string;
  sourceLocale: 'en';
  keys: Array<{
    key: string;
    default: string;
    group: string;
    context?: string;
  }>;
};

export function buildUiStringsManifest(): UiStringsManifest {
  const keys = Object.entries(UI_STRING_REGISTRY)
    .map(([key, entry]) => ({
      key,
      default: entry.default,
      group: entry.group,
      context: entry.context,
    }))
    .sort((left, right) => left.key.localeCompare(right.key));

  const version = createHash('sha256')
    .update(keys.map((item) => `${item.key}:${item.default}`).join('\n'))
    .digest('hex')
    .slice(0, 12);

  return {
    version,
    generatedAt: new Date().toISOString(),
    sourceLocale: 'en',
    keys,
  };
}
