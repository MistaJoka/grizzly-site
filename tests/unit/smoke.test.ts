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
});
