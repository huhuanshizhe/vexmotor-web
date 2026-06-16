import fs from 'node:fs';
import path from 'node:path';

const fetchReplacements = [
  ["fetch('/api/front/", "apiFetch('"],
  ['fetch("/api/front/', 'apiFetch("'],
  ["fetch('/api/auth/register'", "apiFetch('/api/front/auth/register'"],
  ['fetch("/api/auth/register"', 'apiFetch("/api/front/auth/register"'],
];

const importLine = "import { apiFetch } from '@/lib/api-client';\n";

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name)) {
      let content = fs.readFileSync(full, 'utf8');
      const original = content;
      for (const [from, to] of fetchReplacements) {
        content = content.split(from).join(to);
      }
      if (content !== original) {
        if (!content.includes("from '@/lib/api-client'")) {
          const useClient = content.startsWith("'use client'");
          if (useClient) {
            content = content.replace("'use client';\n\n", `'use client';\n\n${importLine}`);
          } else {
            content = `${importLine}\n${content}`;
          }
        }
        fs.writeFileSync(full, content);
        console.log(full);
      }
    }
  }
}

walk('src');
