import siteConfig, { type SiteConfig } from '../../site.config';
import { absoluteUrl } from './seo';

/** Cities named by the area pages. Kept here so JSON-LD and pages cannot drift. */
export const SERVED_AREAS = ['Miami', 'Miami Beach', 'Hialeah', 'Coral Gables', 'Doral', 'Kendall'];

/** Only emit a property when it has a real value. */
function omitEmpty<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => {
      if (v === undefined || v === null) return false;
      if (typeof v === 'string') return v.trim() !== '';
      if (Array.isArray(v)) return v.length > 0;
      return true;
    }),
  ) as Partial<T>;
}

export function businessId(site: URL | undefined): string {
  return `${absoluteUrl('/', site)}#business`;
}

export function localBusinessJsonLd(
  site: URL | undefined,
  config: SiteConfig = siteConfig,
  areas: string[] = SERVED_AREAS,
  services: { name: string; url: string }[] = [],
) {
  const { business } = config;
  const sameAs = config.social.map((s) => s.href).filter(Boolean);
  const hasOfferCatalog =
    services.length > 0
      ? {
          '@type': 'OfferCatalog',
          name: 'Services',
          itemListElement: services.map((service) => ({
            '@type': 'Offer',
            itemOffered: { '@type': 'Service', name: service.name, url: service.url },
          })),
        }
      : undefined;
  return omitEmpty({
    '@context': 'https://schema.org',
    '@type': 'LandscapingBusiness',
    '@id': businessId(site),
    name: business.name,
    legalName: business.legalName,
    description: config.seo.defaultDescription,
    url: absoluteUrl('/', site),
    // TODO(Alex) values: omitted until filled in site.config.ts
    telephone: business.phone,
    email: business.email,
    openingHours: business.hours,
    sameAs,
    founder: { '@type': 'Person', name: business.operator },
    foundingDate: business.foundingDate,
    // Service-area business: city only, no street address and no coordinates.
    address: {
      '@type': 'PostalAddress',
      addressLocality: business.locality.city,
      addressRegion: business.locality.region,
      addressCountry: business.locality.country,
    },
    areaServed: areas.map((name) => ({ '@type': 'City', name })),
    image: absoluteUrl(config.seo.ogImage, site),
    hasOfferCatalog,
  });
}

export function serviceJsonLd(input: {
  name: string;
  description: string;
  url: string;
  areaServed: string[];
  /** When given, the provider is linked to the page's business node by @id (one graph, not two nodes). */
  site?: URL;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    description: input.description,
    url: input.url,
    serviceType: input.name,
    provider: omitEmpty({
      '@type': 'LandscapingBusiness',
      '@id': input.site ? businessId(input.site) : '',
      name: siteConfig.business.name,
    }),
    areaServed: input.areaServed.map((name) => ({ '@type': 'City', name })),
  };
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}

export function breadcrumbJsonLd(crumbs: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}
