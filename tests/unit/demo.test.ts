import { describe, expect, it } from 'vitest';
import { realConfig, type SiteConfig } from '../../site.config';
import { applyDemo, DEMO_BEFORE_AFTER, SAMPLE, SAMPLE_TESTIMONIALS } from '../../src/lib/demo';

const FABRICATION = /\$\d|\b4\.\d\b|\d+ reviews/i;

describe('applyDemo', () => {
  const demo = applyDemo(realConfig);

  it('fills the contact blanks and exactly three generic credentials', () => {
    expect(demo.business.phone).toBe('(305) 555-0188');
    expect(demo.business.phoneHref).toBe('tel:+13055550188');
    expect(demo.business.email).toBe('quotes@grizzlylawncare.example');
    expect(demo.business.hours).toEqual(['Mon–Sat, 7:00 am – 6:00 pm']);
    const filled = Object.values(demo.business.credentials).filter(Boolean);
    expect(filled).toHaveLength(3);
  });

  it('keeps the verified public facts untouched', () => {
    expect(demo.business.name).toBe(realConfig.business.name);
    expect(demo.business.legalName).toBe(realConfig.business.legalName);
    expect(demo.business.floridaDocNumber).toBe(realConfig.business.floridaDocNumber);
    expect(demo.business.operator).toBe(realConfig.business.operator);
  });

  it('never invents a licence, certification, exemption, social link or quote URL', () => {
    const c = demo.business.credentials;
    expect(c.fertilizerLicense).toBe('');
    expect(c.treeTrimmerCert).toBe('');
    expect(c.workersComp).toBe('');
    expect(c.sbeCertification).toBe('');
    expect(demo.social).toEqual([]);
    expect(demo.quote.groundworkQuoteUrl).toBe(realConfig.quote.groundworkQuoteUrl);
  });

  it('does not overwrite a value Alex has supplied', () => {
    const supplied: SiteConfig = structuredClone(realConfig);
    supplied.business.phone = '(305) 000-0000';
    supplied.business.phoneHref = 'tel:+13050000000';
    const out = applyDemo(supplied);
    expect(out.business.phone).toBe('(305) 000-0000');
    expect(out.business.phoneHref).toBe('tel:+13050000000');
    expect(out.business.email).toBe(SAMPLE.email);
  });

  it('does not mutate its input', () => {
    const before = JSON.stringify(realConfig);
    applyDemo(realConfig);
    expect(JSON.stringify(realConfig)).toBe(before);
  });
});

describe('sample content is labelled and free of fabricated numbers', () => {
  it('marks every sample review as a sample', () => {
    expect(SAMPLE_TESTIMONIALS).toHaveLength(3);
    for (const t of SAMPLE_TESTIMONIALS) {
      expect(t.attribution).toMatch(/^Sample review/);
      expect(t.quote.length).toBeGreaterThan(20);
      expect(t.town.length).toBeGreaterThan(0);
    }
  });

  it('contains no prices, ratings or review counts', () => {
    expect(JSON.stringify(SAMPLE)).not.toMatch(FABRICATION);
    expect(JSON.stringify(SAMPLE_TESTIMONIALS)).not.toMatch(FABRICATION);
    expect(JSON.stringify(DEMO_BEFORE_AFTER)).not.toMatch(FABRICATION);
  });

  it('describes the before/after pair as illustrations', () => {
    expect(DEMO_BEFORE_AFTER.beforeImage).toBe('/images/demo/forty-trees-before.jpg');
    expect(DEMO_BEFORE_AFTER.afterImage).toBe('/images/demo/forty-trees-after.jpg');
    expect(DEMO_BEFORE_AFTER.beforeAlt).toMatch(/^Illustration/);
    expect(DEMO_BEFORE_AFTER.afterAlt).toMatch(/^Illustration/);
  });
});
