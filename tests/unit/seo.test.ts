import { describe, expect, it } from 'vitest';
import { absoluteUrl, canonical, pageTitle } from '../../src/lib/seo';

const site = new URL('https://grizzly.example.test');

describe('canonical', () => {
  it('builds an absolute URL from a pathname', () => {
    expect(canonical('/services', site)).toBe('https://grizzly.example.test/services');
  });
  it('strips a trailing slash from non-root paths', () => {
    expect(canonical('/services/', site)).toBe('https://grizzly.example.test/services');
    expect(canonical('/areas/miami/', site)).toBe('https://grizzly.example.test/areas/miami');
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
