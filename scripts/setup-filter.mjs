// Wires up the strip-comments git clean filter for this repo. Runs automatically
// on `npm install` (via the "prepare" script) so a fresh clone is set up too.
import { execSync } from 'node:child_process';

try {
  execSync('git rev-parse --git-dir', { stdio: 'ignore' });
  execSync('git config filter.stripcomments.clean "node scripts/strip-comments.mjs %f"');
  execSync('git config filter.stripcomments.smudge cat');
  console.log('strip-comments filter configured.');
} catch {
  // not a git checkout (or git unavailable) — nothing to do
}
