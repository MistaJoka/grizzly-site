import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { parse, type HTMLElement } from 'node-html-parser';

export const DIST = process.env.SEO_DIST ?? 'dist';
export const SITE_URL = (process.env.SITE_URL ?? '').trim().replace(/\/$/, '');
export const HOLD_BACK = (process.env.HOLD_BACK ?? '').trim() !== '';
/** The build is meant to be indexable only with a real URL and no hold-back (mirrors site.config isLive). */
export const EXPECT_LIVE = SITE_URL !== '' && !HOLD_BACK;

/** Pages that exist but must never be indexed or listed. */
export const NON_INDEXABLE = ['/404', '/preview'];

export function requireDist(): void {
  if (!SITE_URL) throw new Error('SITE_URL must be set to the same value the build used (e.g. SITE_URL=https://example.com npm run test:seo)');
  if (!existsSync(join(DIST, 'index.html'))) throw new Error(`${DIST}/ missing: run \`npm run build\` with the same SITE_URL/HOLD_BACK before \`npm run test:seo\``);
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

export interface Page {
  /** Route path as a visitor types it: '/', '/services', '/services/lawn-maintenance/kendall'. */
  path: string;
  file: string;
  dom: HTMLElement;
}

function pathFor(file: string): string {
  const rel = relative(DIST, file).replace(/\\/g, '/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${dirname(rel)}`;
  return `/${rel.replace(/\.html$/, '')}`;
}

let cache: Page[] | undefined;
export function pages(): Page[] {
  if (!cache) {
    cache = walk(DIST)
      .filter((file) => file.endsWith('.html'))
      .map((file) => ({ path: pathFor(file), file, dom: parse(readFileSync(file, 'utf-8')) }))
      .sort((a, b) => a.path.localeCompare(b.path));
  }
  return cache;
}

export const isIndexable = (path: string): boolean => !NON_INDEXABLE.includes(path);
export const indexablePages = (): Page[] => pages().filter((p) => isIndexable(p.path));

/** What the canonical and the sitemap must both say for a route. */
export const canonicalFor = (path: string): string => (path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`);

/** True when a site-relative href points at a built page or a file in dist/. */
export function resolves(href: string): boolean {
  const clean = href.split(/[?#]/)[0];
  if (clean === '' || clean === '/') return existsSync(join(DIST, 'index.html'));
  const path = clean.replace(/\/$/, '');
  return (
    existsSync(join(DIST, path)) && statSync(join(DIST, path)).isFile() ||
    existsSync(join(DIST, `${path}.html`)) ||
    existsSync(join(DIST, path, 'index.html'))
  );
}

export const isInternal = (href: string): boolean => href.startsWith('/') && !href.startsWith('//');

export function sitemapUrls(): string[] {
  const index = readFileSync(join(DIST, 'sitemap-index.xml'), 'utf-8');
  const files = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].split('/').pop()!);
  return files.flatMap((f) => [...readFileSync(join(DIST, f), 'utf-8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
}

export const robots = (): string => readFileSync(join(DIST, 'robots.txt'), 'utf-8');

export function jsonLd(page: Page): Record<string, any>[] {
  return page.dom.querySelectorAll('script[type="application/ld+json"]').map((s) => JSON.parse(s.rawText));
}
