import fs from 'node:fs';
import path from 'node:path';

const replacements = [
  ['@/server/storefront/types', '@/lib/storefront-types'],
  ['@/server/storefront/catalog', '@/lib/storefront-api'],
  ['@/server/storefront', '@/lib/storefront-api'],
  ['@/server/content/blog', '@/lib/storefront-api'],
  ['@/server/content/support', '@/lib/storefront-api'],
  ['@/server/content/knowledge', '@/lib/storefront-api'],
  ['@/server/content/press', '@/lib/storefront-api'],
  ['@/server/storefront/content', '@/lib/storefront-api'],
  ['@/server/storefront/site-shell', '@/lib/site-shell'],
  ['@/server/commerce/config', '@/lib/storefront-api'],
];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name)) {
      let content = fs.readFileSync(full, 'utf8');
      const original = content;
      for (const [from, to] of replacements) {
        content = content.split(from).join(to);
      }
      if (content !== original) {
        fs.writeFileSync(full, content);
        console.log(full);
      }
    }
  }
}

walk('src');
