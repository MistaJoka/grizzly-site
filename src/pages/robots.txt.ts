import type { APIRoute } from 'astro';
import siteConfig, { isLive } from '../../site.config';

export const GET: APIRoute = ({ site }) => {
  const headers = { 'content-type': 'text/plain; charset=utf-8' };
  // No real domain configured yet => keep crawlers out so a placeholder build is never indexed.
  if (!isLive(siteConfig)) {
    return new Response('User-agent: *\nDisallow: /\n', { headers });
  }
  const sitemap = new URL('sitemap-index.xml', site).href;
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, { headers });
};
