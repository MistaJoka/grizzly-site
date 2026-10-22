// Prints what Alex still has to fill in. Exits 0 always (informational); pass --strict to fail.
import siteConfig, { missingConfig } from '../site.config.ts';

const missing = missingConfig(siteConfig);
if (missing.length === 0) {
  console.log('site.config.ts: nothing missing.');
} else {
  console.log(`site.config.ts: ${missing.length} value(s) still empty (omitted from the site):`);
  for (const m of missing) console.log(`  - ${m}`);
  if (process.argv.includes('--strict')) process.exit(1);
}
