import { describe, expect, it } from 'vitest';
import { absoluteUrl, areaTitle, canonical, DESC_MAX, DESC_MIN, localTitle, pageTitle, serviceTitle, TITLE_MAX, TITLE_MIN } from '../../src/lib/seo';

const site = new URL('https://grizzly.example.test');

describe('canonical', () => {
  it('builds an absolute URL from a pathname', () => {
    expect(canonical('/services', site)).toBe('https://grizzly.example.test/services');
  });
  it('strips a trailing slash from non-root paths', () => {
    expect(canonical('/services/', site)).toBe('https://grizzly.example.test/services');
    expect(canonical('/areas/miami/', site)).toBe('https://grizzly.example.test/areas/miami');
  });
  it('drops the .html suffix and /index.html that build.format "file" puts in the pathname', () => {
    expect(canonical('/services.html', site)).toBe('https://grizzly.example.test/services');
    expect(canonical('/services/lawn-maintenance/kendall.html', site)).toBe('https://grizzly.example.test/services/lawn-maintenance/kendall');
    expect(canonical('/index.html', site)).toBe('https://grizzly.example.test/');
  });
  it('keeps the root path as a single slash', () => {
    expect(canonical('/', site)).toBe('https://grizzly.example.test/');
  });
  it('falls back to the local origin when site is undefined', () => {
    expect(canonical('/about', undefined)).toBe('http://localhost:4321/about');
  });
});

describe('pageTitle', () => {
  it('applies the template to a page title', () => {
    expect(pageTitle('Services')).toBe('Services | Grizzly Lawn Care');
  });
  it('returns the default title when given nothing', () => {
    expect(pageTitle()).toContain('Grizzly Lawn Care');
    expect(pageTitle()).not.toContain('%s');
  });
});

describe('absoluteUrl', () => {
  it('resolves a relative asset path', () => {
    expect(absoluteUrl('/og/default.jpg', site)).toBe('https://grizzly.example.test/og/default.jpg');
  });
  it('passes through an already-absolute URL', () => {
    expect(absoluteUrl('https://cdn.example.com/a.jpg', site)).toBe('https://cdn.example.com/a.jpg');
  });
});

describe('location-aware titles', () => {
  it('names the county on service pages', () => {
    expect(serviceTitle('Tree & Plant Installation')).toBe('Tree & Plant Installation in Miami-Dade, FL');
  });
  it('names the town on local pages', () => {
    expect(localTitle('Mulching & Planting Beds', 'Coral Gables', 'FL')).toBe('Mulching & Planting Beds in Coral Gables, FL');
  });
  it('names the town on area pages and stays inside the bound for the longest town', () => {
    expect(areaTitle('Coral Gables', 'FL')).toBe('Lawn care & tree installs in Coral Gables, FL');
    expect(pageTitle(areaTitle('Coral Gables', 'FL')).length).toBeLessThanOrEqual(TITLE_MAX);
  });
  it('keeps the longest service + town inside the title bound once templated', () => {
    const longest = pageTitle(localTitle('Mulching & Planting Beds', 'Coral Gables', 'FL'));
    expect(longest.length).toBeLessThanOrEqual(TITLE_MAX);
    expect(TITLE_MIN).toBeLessThan(TITLE_MAX);
    expect(DESC_MIN).toBeLessThan(DESC_MAX);
  });
});
