// Prints what Alex still has to fill in. Exits 0 always (informational); pass --strict to fail.
import { isDemo, missingConfig, realConfig } from '../site.config.ts';

const missing = missingConfig(realConfig);
if (missing.length === 0) {
  console.log('site.config.ts: nothing missing.');
} else {
  const demo = isDemo(realConfig);
  console.log(
    demo
      ? `site.config.ts: DEMO_DATA is set: sample values stand in for these ${missing.length} value(s):`
      : `site.config.ts: ${missing.length} value(s) still empty (omitted from the site):`,
  );
  for (const m of missing) console.log(`  - ${m}`);
  if (process.argv.includes('--strict')) process.exit(1);
}
