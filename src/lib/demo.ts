// Demo mode (DEMO_DATA=1): stand-in values for the facts Alex has not supplied yet, so the staging
// site can be shown complete. Every value here is a labelled sample:
//  - the phone is in 555-0100..0199, the range NANPA reserves for fiction, so nobody gets a stray call;
//  - the email is on `.example`, reserved by RFC 2606;
//  - reviews are attributed "Sample review"; the before/after pair is drawn, not photographed.
// Nothing in this file is ever rendered unless DEMO_DATA is set, and a demo build must also be held
// back from search (see assertDemoSafe in site.config.ts).
import type { SiteConfig } from '../../site.config';

export const SAMPLE = {
  phone: '(305) 555-0188',
  phoneHref: 'tel:+13055550188',
  email: 'quotes@grizzlylawncare.example',
  hours: ['Mon–Sat, 7:00 am – 6:00 pm'],
  // Generic wording only, each labelled inline: credentials appear in the trust strip as proof, where
  // the page-top notice may be out of view. Licences, certifications and exemptions are never sampled.
  credentials: {
    generalLiability: 'General liability insured (sample)',
    commercialAuto: 'Commercial auto insured (sample)',
    businessTaxReceipt: 'Miami-Dade business tax receipt (sample)',
  },
} as const;

/** Fill only the values that are still empty. Confirmed facts, social links and the quote URL are never touched. */
export function applyDemo(config: SiteConfig): SiteConfig {
  const out = structuredClone(config);
  const b = out.business;
  if (!b.phone && !b.phoneHref) {
    b.phone = SAMPLE.phone;
    b.phoneHref = SAMPLE.phoneHref;
  }
  if (!b.email) b.email = SAMPLE.email;
  if (b.hours.length === 0) b.hours = [...SAMPLE.hours];
  for (const [key, value] of Object.entries(SAMPLE.credentials) as [keyof typeof SAMPLE.credentials, string][]) {
    if (!b.credentials[key]) b.credentials[key] = value;
  }
  return out;
}

export interface SampleTestimonial {
  quote: string;
  attribution: string;
  town: string;
}

export const SAMPLE_TESTIMONIALS: SampleTestimonial[] = [
  {
    quote: 'Alex quoted the hedges on Tuesday and had them squared off by Friday. He swept the walk before he left.',
    attribution: 'Sample review from a homeowner',
    town: 'Kendall',
  },
  {
    quote: 'Same person every visit, which is why our board kept him for the common areas.',
    attribution: 'Sample review from an HOA treasurer',
    town: 'Doral',
  },
  {
    quote: 'He moved the sprinkler heads out of the way before mulching and put every one back. Small thing, nobody else did it.',
    attribution: 'Sample review from a homeowner',
    town: 'Coral Gables',
  },
];

/** Illustrated stand-in for the 40-tree job until Alex shares photos. Rendered only in demo. */
export const DEMO_BEFORE_AFTER = {
  title: 'Forty-tree installation',
  town: 'Miami-Dade',
  beforeImage: '/images/demo/forty-trees-before.jpg',
  beforeAlt: 'Illustration: a bare lot with patchy grass, open ground and a few overgrown shrubs.',
  afterImage: '/images/demo/forty-trees-after.jpg',
  afterAlt: 'Illustration: a row of staked young palms planted along a freshly mowed, striped lawn.',
} as const;
