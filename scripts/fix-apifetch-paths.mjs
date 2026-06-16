import fs from 'node:fs';
import path from 'node:path';

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name)) {
      let content = fs.readFileSync(full, 'utf8');
      const original = content;
      content = content.replace(/apiFetch\('(?!\/api\/front\/)([^']+)'/g, "apiFetch('/api/front/$1'");
      if (content !== original) {
        fs.writeFileSync(full, content);
        console.log(full);
      }
    }
  }
}

walk('src');
