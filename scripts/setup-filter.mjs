import { execSync } from 'node:child_process';

try {
  execSync('git rev-parse --git-dir', { stdio: 'ignore' });
  execSync('git config filter.stripcomments.clean "node scripts/strip-comments.mjs %f"');
  execSync('git config filter.stripcomments.smudge cat');
  console.log('strip-comments filter configured.');
} catch {

}
