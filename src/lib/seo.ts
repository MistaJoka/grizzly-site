import siteConfig from '../../site.config';

const FALLBACK_ORIGIN = 'http://localhost:4321';

function origin(site: URL | undefined): string {
  return (site?.origin ?? FALLBACK_ORIGIN).replace(/\/$/, '');
}

/** Route form of a pathname: no trailing slash, no .html (build.format 'file' puts it in Astro.url). */
export function canonical(pathname: string, site: URL | undefined): string {
  const path = pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/\/+$/, '');
  return `${origin(site)}${path === '' ? '/' : path}`;
}

export function absoluteUrl(path: string, site: URL | undefined): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${origin(site)}${path.startsWith('/') ? path : `/${path}`}`;
}

export function pageTitle(title?: string): string {
  if (!title) return siteConfig.seo.defaultTitle;
  return siteConfig.seo.titleTemplate.replace('%s', title);
}

/** Audit bounds (characters). Google shows roughly 60 title / 155 description chars on desktop. */
export const TITLE_MIN = 20;
export const TITLE_MAX = 65;
export const DESC_MIN = 70;
export const DESC_MAX = 160;

const COUNTY = 'Miami-Dade, FL';

/** `<Service> in Miami-Dade, FL`: the service page title before the site template. */
export function serviceTitle(service: string): string {
  return `${service} in ${COUNTY}`;
}

/** `<Service> in <Town>, <ST>`: the service-in-town page title before the site template. */
export function localTitle(service: string, town: string, state: string): string {
  return `${service} in ${town}, ${state}`;
}

/** `Lawn care & tree installs in <Town>, <ST>`: the area page title before the site template. */
export function areaTitle(town: string, state: string): string {
  return `Lawn care & tree installs in ${town}, ${state}`;
}
