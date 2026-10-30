import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// Fully static site: deploys to GitHub Pages, Vercel, Netlify or any static host.
// The quote form posts straight to the hosted Groundwork page, so there is no server code here.
//   SITE_URL   final public URL (leave unset => robots.txt blocks crawlers, pages are noindex)
//   BASE_PATH  sub-path for GitHub Pages project sites, e.g. /grizzly-site
const siteUrl = (process.env.SITE_URL ?? '').trim();
const basePath = (process.env.BASE_PATH ?? '').trim();

export default defineConfig({
  site: siteUrl || 'http://localhost:4321',
  base: basePath || undefined,
  output: 'static',
  // One .html file per route (/services -> dist/services.html). GitHub Pages serves /services from it
  // directly, so the canonical, the sitemap entry and the URL visitors land on are the same string;
  // the default directory format made every extensionless link a 301 to its trailing-slash twin.
  build: { format: 'file' },
  // /preview is a private walkthrough for Alex, never listed.
  integrations: [sitemap({ filter: (page) => !page.includes('/preview') })],
  // The dev toolbar injects its own UI (including a button labelled "Menu") that would collide
  // with real selectors in tests. Humans keep it in `npm run dev`.
  devToolbar: { enabled: process.env.PLAYWRIGHT !== '1' },
  vite: { plugins: [tailwindcss()] },
});
