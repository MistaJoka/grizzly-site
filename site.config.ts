// THE ONE PLACE for every fact about the business that is not yet confirmed.
//
// Rules:
//  - A value of '' (or []) means "Alex has not supplied this yet". Pages and
//    JSON-LD then OMIT it. Nothing is faked and nothing is shown as TODO to visitors.
//  - Fill the TODO(Alex) values below, then run `npm run check:config` to see
//    what is still missing. The README "Alex must fill in" list mirrors this file.
//  - Only put facts here that Alex has confirmed. Do not copy third-party marketplace
//    photos, reviews or ratings (non-solicit / marketing rule in the growth plan).

export interface NavItem { label: string; href: string; }

export interface SiteConfig {
  business: {
    name: string;
    legalName: string;
    operator: string;
    tagline: string;
    /** Public record: Sunbiz document number. Shown as a verifiable credential. */
    floridaDocNumber: string;
    /** ISO date, effective date per Sunbiz (filed 2021-07-21, effective 2021-07-20). */
    foundingDate: string;
    foundedYear: number;
    /** Public city only. A service-area business: no street address is published. */
    locality: { city: string; region: string; country: string };
    // --- TODO(Alex): not known yet ---
    phone: string; // e.g. '(305) 555-0100'
    phoneHref: string; // e.g. 'tel:+13055550100'
    email: string;
    hours: string[]; // e.g. ['Mon-Sat 7:00-18:00']
    /** Credentials: only filled ones are displayed. Wording is shown as-is. */
    credentials: {
      generalLiability: string; // e.g. 'General liability, $1,000,000 per occurrence'
      commercialAuto: string; // e.g. 'Commercial auto, $1,000,000'
      workersComp: string; // e.g. 'Workers compensation / exemption on file'
      fertilizerLicense: string; // FDACS "LF" license number or wording
      treeTrimmerCert: string; // UF/IFAS Basic Tree Trimmer card wording
      businessTaxReceipt: string; // Miami-Dade / city receipt wording
      sbeCertification: string; // Miami-Dade SBE wording
    };
  };
  site: {
    /** TODO(Alex): final public URL (domain). Empty => robots.txt blocks crawlers + noindex. Env: SITE_URL */
    url: string;
    /** Optional sub-path for GitHub Pages project sites, e.g. '/grizzly-site'. Env: BASE_PATH */
    basePath: string;
    /**
     * Staging switch. Set HOLD_BACK=1 on a build that has a real SITE_URL (so canonical, OG and sitemap
     * URLs are correct) but must still stay out of search: robots.txt Disallow + noindex on every page.
     * Delete the variable to go live. Env: HOLD_BACK
     */
    holdBack: string;
    /**
     * Optional search-engine ownership tokens, emitted as <meta> tags only when set.
     * Env: GOOGLE_SITE_VERIFICATION (Search Console, HTML-tag method), BING_SITE_VERIFICATION (Webmaster Tools).
     */
    verification: { google: string; bing: string };
  };
  quote: {
    /**
     * TODO(Alex/owner): hosted Groundwork request-a-quote page, e.g.
     * 'https://<groundwork-host>/r/<slug>'. Env: GROUNDWORK_QUOTE_URL.
     * Empty => the contact page shows no form and says so; phone/email show if set.
     */
    groundworkQuoteUrl: string;
  };
  nav: NavItem[];
  /** TODO(Alex): real profile links only (Google Business Profile, Facebook, Instagram). */
  social: { label: string; href: string }[];
  seo: { defaultTitle: string; titleTemplate: string; defaultDescription: string; ogImage: string };
}

const env = (key: string): string =>
  (typeof process !== 'undefined' && process.env?.[key] ? String(process.env[key]) : '').trim();

const siteConfig: SiteConfig = {
  business: {
    name: 'Grizzly Lawn Care',
    legalName: 'Grizzly Lawn Care, LLC',
    operator: 'Alex Bermudez',
    tagline: 'Lawn care, trimming, and tree and plant installs in Miami-Dade.',
    floridaDocNumber: 'L21000330992',
    foundingDate: '2021-07-20',
    foundedYear: 2021,
    locality: { city: 'Miami', region: 'FL', country: 'US' },
    phone: '', // TODO(Alex)
    phoneHref: '', // TODO(Alex)
    email: '', // TODO(Alex)
    hours: [], // TODO(Alex)
    credentials: {
      generalLiability: '', // TODO(Alex)
      commercialAuto: '', // TODO(Alex)
      workersComp: '', // TODO(Alex)
      fertilizerLicense: '', // TODO(Alex)
      treeTrimmerCert: '', // TODO(Alex)
      businessTaxReceipt: '', // TODO(Alex)
      sbeCertification: '', // TODO(Alex)
    },
  },
  site: {
    url: env('SITE_URL'), // TODO(Alex): set the real domain
    basePath: env('BASE_PATH'),
    holdBack: env('HOLD_BACK'),
    verification: { google: env('GOOGLE_SITE_VERIFICATION'), bing: env('BING_SITE_VERIFICATION') },
  },
  quote: {
    groundworkQuoteUrl: env('GROUNDWORK_QUOTE_URL'), // TODO: hosted /r/<slug> URL
  },
  nav: [
    { label: 'Services', href: '/services' },
    { label: 'Commercial', href: '/commercial' },
    { label: 'Work', href: '/work' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
  social: [], // TODO(Alex)
  seo: {
    defaultTitle: 'Grizzly Lawn Care | Lawn care and tree installs in Miami-Dade',
    titleTemplate: '%s | Grizzly Lawn Care',
    defaultDescription:
      'Miami landscaping company run by Alex Bermudez: lawn maintenance, hedge trimming, mulching, pressure washing, and tree and plant installs across Miami-Dade.',
    ogImage: '/og/default.jpg',
  },
};

export default siteConfig;

/** Dotted paths of every still-empty TODO value. Used by `npm run check:config`. */
export function missingConfig(config: SiteConfig = siteConfig): string[] {
  const missing: string[] = [];
  const { business: b } = config;
  for (const key of ['phone', 'phoneHref', 'email'] as const) if (!b[key]) missing.push(`business.${key}`);
  if (b.hours.length === 0) missing.push('business.hours');
  for (const [k, v] of Object.entries(b.credentials)) if (!v) missing.push(`business.credentials.${k}`);
  if (!config.site.url) missing.push('site.url (SITE_URL)');
  if (!config.quote.groundworkQuoteUrl) missing.push('quote.groundworkQuoteUrl (GROUNDWORK_QUOTE_URL)');
  if (config.social.length === 0) missing.push('social');
  return missing;
}

/** Credentials Alex has actually supplied, plus the public Sunbiz record. */
export function credentialList(config: SiteConfig = siteConfig): string[] {
  const { business: b } = config;
  return [
    `Florida LLC, active since ${b.foundedYear} (document ${b.floridaDocNumber})`,
    'Owner on every job: one point of contact',
    ...Object.values(b.credentials).filter(Boolean),
  ];
}

/** Indexable: a real URL is configured and the staging hold-back is off. */
export function isLive(config: SiteConfig = siteConfig): boolean {
  return config.site.url.length > 0 && !config.site.holdBack;
}
