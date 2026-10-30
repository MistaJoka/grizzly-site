import { describe, expect, it } from 'vitest';
import siteConfig, { type SiteConfig } from '../../site.config';
import { breadcrumbJsonLd, faqJsonLd, localBusinessJsonLd, serviceJsonLd, SERVED_AREAS } from '../../src/lib/schema';

const site = new URL('https://grizzly.example.test');

function configWith(patch: (c: SiteConfig) => void): SiteConfig {
  const copy = structuredClone(siteConfig);
  patch(copy);
  return copy;
}

describe('localBusinessJsonLd (as shipped, unknowns empty)', () => {
  const data = localBusinessJsonLd(site, configWith((c) => {
    c.business.phone = ''; c.business.email = ''; c.business.hours = []; c.social = [];
  })) as Record<string, any>;

  it('declares the correct type and context', () => {
    expect(data['@context']).toBe('https://schema.org');
    expect(data['@type']).toBe('LandscapingBusiness');
    expect(data.name).toBe('Grizzly Lawn Care');
    expect(data.legalName).toBe('Grizzly Lawn Care, LLC');
    expect(data.founder.name).toBe('Alex Bermudez');
    expect(data.foundingDate).toBe('2021-07-20');
  });

  it('omits every unknown value instead of faking it', () => {
    for (const key of ['telephone', 'email', 'openingHours', 'sameAs', 'geo']) {
      expect(data, key).not.toHaveProperty(key);
    }
  });

  it('publishes only city/state/country as the address', () => {
    expect(data.address).toEqual({
      '@type': 'PostalAddress', addressLocality: 'Miami', addressRegion: 'FL', addressCountry: 'US',
    });
  });

  it('lists every served area', () => {
    expect(data.areaServed.map((a: any) => a.name)).toEqual(SERVED_AREAS);
  });
});

describe('localBusinessJsonLd (values filled in)', () => {
  const data = localBusinessJsonLd(site, configWith((c) => {
    c.business.phone = '(305) 555-0100';
    c.business.email = 'test@example.com';
    c.business.hours = ['Mon-Fri 8:00-17:00'];
    c.social = [{ label: 'Facebook', href: 'https://facebook.com/example' }];
  })) as Record<string, any>;

  it('includes them once supplied', () => {
    expect(data.telephone).toBe('(305) 555-0100');
    expect(data.email).toBe('test@example.com');
    expect(data.openingHours).toEqual(['Mon-Fri 8:00-17:00']);
    expect(data.sameAs).toEqual(['https://facebook.com/example']);
  });
});

describe('localBusinessJsonLd offer catalog', () => {
  const cfg = configWith(() => {});
  it('lists each service as an offered Service with its URL', () => {
    const data = localBusinessJsonLd(site, cfg, SERVED_AREAS, [
      { name: 'Lawn Mowing & Maintenance', url: 'https://grizzly.example.test/services/lawn-maintenance' },
    ]) as Record<string, any>;
    expect(data.hasOfferCatalog['@type']).toBe('OfferCatalog');
    const offer = data.hasOfferCatalog.itemListElement[0];
    expect(offer['@type']).toBe('Offer');
    expect(offer.itemOffered['@type']).toBe('Service');
    expect(offer.itemOffered.name).toBe('Lawn Mowing & Maintenance');
    expect(offer.itemOffered.url).toBe('https://grizzly.example.test/services/lawn-maintenance');
  });
  it('omits the catalog when no services are passed', () => {
    expect(localBusinessJsonLd(site, cfg)).not.toHaveProperty('hasOfferCatalog');
  });
});

describe('serviceJsonLd', () => {
  it('links the provider to the business node by @id when the site is known', () => {
    const data = serviceJsonLd({
      name: 'Pressure Washing',
      description: 'Washing walkways.',
      url: 'https://grizzly.example.test/services/pressure-washing',
      areaServed: ['Miami'],
      site,
    }) as Record<string, any>;
    expect(data.provider['@id']).toBe('https://grizzly.example.test/#business');
    expect(data.provider.name).toBe('Grizzly Lawn Care');
  });

  it('builds a Service node with a provider reference', () => {
    const data = serviceJsonLd({
      name: 'Pressure Washing',
      description: 'Washing walkways.',
      url: 'https://grizzly.example.test/services/pressure-washing',
      areaServed: ['Miami', 'Doral'],
    }) as Record<string, any>;
    expect(data['@type']).toBe('Service');
    expect(data.provider['@type']).toBe('LandscapingBusiness');
    expect(data.areaServed).toHaveLength(2);
  });
});

describe('faqJsonLd', () => {
  it('maps each question to an accepted answer', () => {
    const data = faqJsonLd([{ question: 'How long?', answer: 'Two days.' }]) as Record<string, any>;
    expect(data['@type']).toBe('FAQPage');
    expect(data.mainEntity[0].acceptedAnswer.text).toBe('Two days.');
  });
});

describe('breadcrumbJsonLd', () => {
  it('numbers positions from one', () => {
    const data = breadcrumbJsonLd([
      { name: 'Home', url: 'https://grizzly.example.test/' },
      { name: 'Services', url: 'https://grizzly.example.test/services' },
    ]) as Record<string, any>;
    expect(data.itemListElement.map((i: any) => i.position)).toEqual([1, 2]);
  });
});
