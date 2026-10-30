import { beforeAll, describe, expect, it } from 'vitest';
import { DESC_MAX, DESC_MIN, TITLE_MAX, TITLE_MIN } from '../../src/lib/seo';
import {
  canonicalFor, EXPECT_LIVE, indexablePages, isInternal, jsonLd, NON_INDEXABLE, pages, requireDist, resolves, robots, SITE_URL, sitemapUrls,
} from './dist';

beforeAll(requireDist);

const attr = (page: ReturnType<typeof pages>[number], selector: string, name: string) =>
  page.dom.querySelectorAll(selector).map((el) => el.getAttribute(name) ?? '');

describe('every indexable page is well-formed for search', () => {
  it('has exactly one h1', () => {
    for (const page of indexablePages()) expect(page.dom.querySelectorAll('h1').length, page.path).toBe(1);
  });

  it(`has one title between ${TITLE_MIN} and ${TITLE_MAX} characters`, () => {
    for (const page of indexablePages()) {
      const titles = page.dom.querySelectorAll('title');
      expect(titles.length, page.path).toBe(1);
      const len = titles[0].text.trim().length;
      expect(len, `${page.path}: "${titles[0].text}"`).toBeGreaterThanOrEqual(TITLE_MIN);
      expect(len, `${page.path}: "${titles[0].text}"`).toBeLessThanOrEqual(TITLE_MAX);
    }
  });

  it(`has one meta description between ${DESC_MIN} and ${DESC_MAX} characters`, () => {
    for (const page of indexablePages()) {
      const descriptions = attr(page, 'meta[name="description"]', 'content');
      expect(descriptions.length, page.path).toBe(1);
      expect(descriptions[0].length, `${page.path}: "${descriptions[0]}"`).toBeGreaterThanOrEqual(DESC_MIN);
      expect(descriptions[0].length, `${page.path}: "${descriptions[0]}"`).toBeLessThanOrEqual(DESC_MAX);
    }
  });

  it('declares one canonical equal to SITE_URL + path', () => {
    for (const page of indexablePages()) {
      expect(attr(page, 'link[rel="canonical"]', 'href'), page.path).toEqual([canonicalFor(page.path)]);
    }
  });

  it('matches og:url to the canonical and resolves og:image', () => {
    for (const page of indexablePages()) {
      expect(attr(page, 'meta[property="og:url"]', 'content'), page.path).toEqual([canonicalFor(page.path)]);
      const [image] = attr(page, 'meta[property="og:image"]', 'content');
      expect(image, page.path).toMatch(new RegExp(`^${SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/`));
      expect(resolves(image.slice(SITE_URL.length)), `${page.path}: ${image}`).toBe(true);
    }
  });
});

describe('titles and descriptions are unique', () => {
  it('no two indexable pages share a title', () => {
    const seen = new Map<string, string>();
    for (const page of indexablePages()) {
      const title = page.dom.querySelector('title')!.text.trim();
      expect(seen.get(title), `${page.path} duplicates ${seen.get(title)}: "${title}"`).toBeUndefined();
      seen.set(title, page.path);
    }
  });
  it('no two indexable pages share a description', () => {
    const seen = new Map<string, string>();
    for (const page of indexablePages()) {
      const [description] = attr(page, 'meta[name="description"]', 'content');
      expect(seen.get(description), `${page.path} duplicates ${seen.get(description)}`).toBeUndefined();
      seen.set(description, page.path);
    }
  });
});

describe('structured data forms one graph', () => {
  it('parses on every page and carries the business node with its @id', () => {
    for (const page of pages()) {
      const nodes = jsonLd(page);
      expect(nodes.length, page.path).toBeGreaterThan(0);
      const business = nodes.find((n) => n['@type'] === 'LandscapingBusiness');
      expect(business?.['@id'], page.path).toBe(`${SITE_URL}/#business`);
    }
  });

  it('links every Service to the business by @id, with a City areaServed', () => {
    let services = 0;
    for (const page of pages()) {
      for (const node of jsonLd(page).filter((n) => n['@type'] === 'Service')) {
        services += 1;
        expect(node.provider?.['@id'], page.path).toBe(`${SITE_URL}/#business`);
        expect(node.areaServed?.length, page.path).toBeGreaterThan(0);
        expect(node.url, page.path).toBe(canonicalFor(page.path));
      }
    }
    expect(services).toBeGreaterThan(0);
  });

  it('gives every BreadcrumbList at least two items and every FAQPage at least one question', () => {
    for (const page of pages()) {
      for (const node of jsonLd(page)) {
        if (node['@type'] === 'BreadcrumbList') expect(node.itemListElement.length, page.path).toBeGreaterThanOrEqual(2);
        if (node['@type'] === 'FAQPage') expect(node.mainEntity.length, page.path).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('lists every service page in the business OfferCatalog', () => {
    const [home] = pages().filter((p) => p.path === '/');
    const business = jsonLd(home).find((n) => n['@type'] === 'LandscapingBusiness')!;
    const offered: string[] = business.hasOfferCatalog.itemListElement.map((o: any) => o.itemOffered.url);
    const servicePages = indexablePages().filter((p) => /^\/services\/[^/]+$/.test(p.path)).map((p) => canonicalFor(p.path));
    expect(offered.sort()).toEqual(servicePages.sort());
  });
});

describe('links and images', () => {
  it('every internal href resolves to a built page or file', () => {
    const broken: string[] = [];
    for (const page of pages()) {
      for (const href of attr(page, 'a[href], link[href]', 'href')) {
        if (isInternal(href) && !resolves(href)) broken.push(`${page.path} -> ${href}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it('every img on an indexable page has alt text, or is decorative: inside a labelled link or an aria-hidden block', () => {
    for (const page of indexablePages()) {
      for (const img of page.dom.querySelectorAll('img')) {
        const alt = img.getAttribute('alt');
        const where = `${page.path}: ${img.getAttribute('src')}`;
        expect(alt, `${where} has no alt attribute`).toBeDefined();
        if (alt!.trim() === '') {
          const labelledLink = (img.closest('a')?.text.trim() ?? '') !== '';
          const hidden = img.closest('[aria-hidden="true"]') !== null;
          expect(labelledLink || hidden, `${where} is alt="" but neither in a labelled link nor aria-hidden`).toBe(true);
        }
      }
    }
  });
});

describe('sitemap', () => {
  it('lists exactly the indexable pages, in canonical form', () => {
    const expected = indexablePages().map((p) => canonicalFor(p.path)).sort();
    expect(sitemapUrls().sort()).toEqual(expected);
  });
  it('never lists a non-indexable page', () => {
    for (const url of sitemapUrls()) {
      for (const path of NON_INDEXABLE) expect(url, path).not.toBe(canonicalFor(path));
    }
  });
});

describe(`robots and noindex agree with the build (${EXPECT_LIVE ? 'live' : 'held back'})`, () => {
  const noindexed = () => pages().filter((p) => p.dom.querySelector('meta[name="robots"][content*="noindex"]')).map((p) => p.path);

  if (EXPECT_LIVE) {
    it('robots.txt allows crawling and names the sitemap', () => {
      expect(robots()).toContain('Allow: /');
      expect(robots()).toContain(`Sitemap: ${SITE_URL}/sitemap-index.xml`);
      expect(robots()).not.toMatch(/Disallow: \/\s*$/m);
    });
    it('only the private pages carry noindex', () => {
      expect(noindexed().sort()).toEqual([...NON_INDEXABLE].filter((p) => pages().some((pg) => pg.path === p)).sort());
    });
  } else {
    it('robots.txt disallows everything', () => {
      expect(robots()).toMatch(/Disallow: \/\s*$/m);
      expect(robots()).not.toContain('Allow: /');
    });
    it('every page carries noindex', () => {
      expect(noindexed().sort()).toEqual(pages().map((p) => p.path).sort());
    });
    it('the sitemap is still built, ready for launch', () => {
      expect(sitemapUrls().length).toBeGreaterThan(0);
    });
  }
});
