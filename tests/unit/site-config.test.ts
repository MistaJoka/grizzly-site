import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import siteConfig, { credentialList, isLive, missingConfig, type SiteConfig } from '../../site.config';

describe('siteConfig', () => {
  it('carries the verified public facts', () => {
    expect(siteConfig.business.name).toBe('Grizzly Lawn Care');
    expect(siteConfig.business.legalName).toBe('Grizzly Lawn Care, LLC');
    expect(siteConfig.business.operator).toBe('Alex Bermudez');
    expect(siteConfig.business.floridaDocNumber).toBe('L21000330992');
    expect(siteConfig.business.foundingDate).toBe('2021-07-20');
  });

  it('publishes a city only, never a street address, ZIP or coordinates', () => {
    expect(Object.keys(siteConfig.business.locality).sort()).toEqual(['city', 'country', 'region']);
    expect(JSON.stringify(siteConfig)).not.toMatch(/postalCode|latitude|streetAddress/);
  });

  it('defines navigation including the commercial page', () => {
    expect(siteConfig.nav.map((item) => item.href)).toEqual(['/services', '/commercial', '/work', '/about', '/contact']);
  });

  it('provides a title template containing a placeholder', () => {
    expect(siteConfig.seo.titleTemplate).toContain('%s');
  });
});

describe('unknown values are empty placeholders, not invented', () => {
  it('reports every empty value through missingConfig', () => {
    const empty = missingConfig({ ...siteConfig, site: { url: '', basePath: '' }, quote: { groundworkQuoteUrl: '' } });
    expect(empty).toEqual(expect.arrayContaining(['business.phone', 'business.email', 'business.credentials.generalLiability']));
    expect(empty).toContain('site.url (SITE_URL)');
    expect(empty).toContain('quote.groundworkQuoteUrl (GROUNDWORK_QUOTE_URL)');
  });

  it('lists only supplied credentials', () => {
    const list = credentialList();
    expect(list[0]).toContain('L21000330992');
    const withOne: SiteConfig = structuredClone(siteConfig);
    withOne.business.credentials.fertilizerLicense = 'FDACS LF license (example)';
    expect(credentialList(withOne)).toContain('FDACS LF license (example)');
    expect(credentialList(withOne).length).toBe(credentialList({ ...withOne, business: { ...withOne.business, credentials: { ...withOne.business.credentials, fertilizerLicense: '' } } }).length + 1);
  });

  it('treats the site as not live until a URL is configured', () => {
    expect(isLive({ ...siteConfig, site: { url: '', basePath: '', holdBack: '' } })).toBe(false);
    expect(isLive({ ...siteConfig, site: { url: 'https://example.com', basePath: '', holdBack: '' } })).toBe(true);
  });

  it('keeps a staging build with HOLD_BACK set out of search even with a real URL', () => {
    expect(isLive({ ...siteConfig, site: { url: 'https://example.com', basePath: '', holdBack: '1' } })).toBe(false);
  });
});

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

describe('brand strings stay in configuration', () => {
  it('does not hardcode the business name or phone in components or layouts', () => {
    const offenders: string[] = [];
    for (const root of ['src/components', 'src/layouts']) {
      for (const file of walk(root)) {
        const source = readFileSync(file, 'utf-8');
        if (source.includes(siteConfig.business.name) || (siteConfig.business.phone && source.includes(siteConfig.business.phone))) {
          offenders.push(file);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('keeps template leftovers and private details out of the source', () => {
    const banned = /Stonecrop|Hudson Valley|Ellis Vance|LawnStarter/i;
    const offenders: string[] = [];
    for (const root of ['src', 'site.config.ts', 'astro.config.mjs']) {
      const files = statSync(root).isDirectory() ? walk(root) : [root];
      for (const file of files) {
        if (/\.(jpg|png|ico|svg|woff2?)$/.test(file)) continue;
        if (banned.test(readFileSync(file, 'utf-8'))) offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });
});
