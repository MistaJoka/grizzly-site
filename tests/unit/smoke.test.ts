import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('project scaffold', () => {
  it('is a static site with env-driven site URL and no server adapter', () => {
    const config = readFileSync('astro.config.mjs', 'utf-8');
    expect(config).toContain("output: 'static'");
    expect(config).toContain('SITE_URL');
    expect(config).not.toMatch(/@astrojs\/(netlify|vercel|node|cloudflare)/);
  });

  it('exposes the required npm scripts', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
    for (const script of ['dev', 'build', 'test:unit', 'test:e2e', 'check:config']) {
      expect(pkg.scripts).toHaveProperty(script);
    }
  });

  it('emits search-engine verification tags only when a token is configured', () => {
    const meta = readFileSync('src/components/seo/Meta.astro', 'utf-8');
    expect(meta).toMatch(/verification\.google && <meta name="google-site-verification"/);
    expect(meta).toMatch(/verification\.bing && <meta name="msvalidate\.01"/);
  });

  it('never forwards the indexable-demo escape hatch to the deploy workflow', () => {
    // DEMO_ALLOW_INDEXABLE exists for CI's Lighthouse run only. Deploy must not be able to ship an indexable demo.
    const pages = readFileSync('.github/workflows/pages.yml', 'utf-8');
    expect(pages).not.toContain('DEMO_ALLOW_INDEXABLE');
    const config = readFileSync('site.config.ts', 'utf-8');
    expect(config).not.toMatch(/env\('DEMO_ALLOW_INDEXABLE'\)/);
    expect(config).toContain('process.env.DEMO_ALLOW_INDEXABLE');
  });

  it('starts Playwright dev servers alongside any other dev server, never killing one', () => {
    // `astro dev --force` kills whatever process holds the project lock (another session's server, too).
    for (const file of ['playwright.config.ts', 'playwright.demo.config.ts']) {
      const source = readFileSync(file, 'utf-8');
      expect(source, file).toContain('--ignore-lock');
      expect(source, file).not.toMatch(/--force\b/);
    }
  });

  it('forwards every site.config env() key through the Pages deploy workflow', () => {
    const config = readFileSync('site.config.ts', 'utf-8');
    const keys = [...config.matchAll(/env\('([A-Z_]+)'\)/g)].map((m) => m[1]);
    expect(keys.length).toBeGreaterThan(3);
    const pages = readFileSync('.github/workflows/pages.yml', 'utf-8');
    for (const key of keys) expect(pages, key).toContain(`${key}: \${{ vars.${key} }}`);
  });
});
