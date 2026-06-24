// One-shot history rewrite helper: strips comments from every matching source
// file under the current directory, in place. Invoked (by absolute path) from
// `git filter-branch --tree-filter` so the whole history looks comment-free.
import fs from 'node:fs';
import path from 'node:path';
import { stripContent } from './strip-lib.mjs';

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'scripts', '.claude', 'moved', 'tools']);
const EXTS = new Set(['js', 'mjs', 'css', 'html', 'htm']);

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(path.join(dir, entry.name));
    } else if (EXTS.has(entry.name.toLowerCase().split('.').pop())) {
      const p = path.join(dir, entry.name);
      const before = fs.readFileSync(p, 'utf8');
      const after = stripContent(entry.name, before);
      if (after !== before) fs.writeFileSync(p, after);
    }
  }
}

walk(process.cwd());
