# SEO engine: design

**Intent.** Make the Grizzly Lawn Care site rank for local landscaping searches in Miami-Dade the day it
launches on Alex's own domain, while the staging copy at grizzlysite.andraewilliams.com stays hidden
(HOLD_BACK=1). "Engine" means: the machinery, guardrails and launch switch are built and tested now, and
content can keep being added without touching code.

Owner (2026-10-29): "keep it hidden for now. but i want to develope the SEO engine for the site. ready to
go for when we launch it on its own domain." Questions were skipped; every choice below is the builder's call.

## Who searches, what they type (builder's assumption)

1. Homeowners: "lawn service Kendall", "hedge trimming Coral Gables", "tree installation Miami".
2. HOA boards / property managers: "commercial landscaping Doral", "HOA landscape maintenance Miami-Dade".
3. General contractors: "landscape installation contractor Miami", "tree planting for new construction".

Search intent is service + place. The site already has 5 service pages and 6 area pages. The missing
layer is service-in-place pages, plus the checks that keep every page indexable and distinct.

## Goals

- Every indexable page has a unique, length-safe title and description that name the service and the place.
- Structured data forms one graph: business node with `@id`, services as an OfferCatalog, each Service page
  linking back to the business by `@id`, FAQ and BreadcrumbList where the page shows them.
- Service x area landing pages exist as a content-gated engine: a page is built only when a hand-written
  content entry exists for that pair, with a minimum of real local text and at least two FAQs. No templated
  doorway pages.
- A build-output audit runs in CI after every build and fails on SEO regressions.
- Search Console and Bing verification are one env var each, no code change at launch.
- A launch runbook lists the exact steps from staging to live on the final domain.

## Non-goals

- No Spanish version yet (big lever for Miami; separate project after launch).
- No blog, no per-page OG image generation, no review/rating markup (no permissioned reviews exist).
- No prices, ratings or review counts anywhere (existing rule).
- No change to the visual design.

## Anti-goals

- Fabricating business facts to fill schema (phone, hours, credentials stay omitted until Alex supplies them).
- Generating 30 near-identical service x area pages. Six seeded pairs, one per area, chosen for that area.
- Letting the staging domain get indexed. HOLD_BACK stays on; the audit asserts it.

## Decisions

**URLs.** Local pages live at `/services/<service>/<area>` (e.g. `/services/tree-plant-installation/coral-gables`).
Breadcrumb: Home > Services > Service > Town. Service pages link to local pages where they exist, else to
the area page; area pages link each service card to the local page where it exists.

**Content model.** New collection `local` at `src/content/local/<service>--<area>.md`:
`service` (service id), `area` (area id), `headline`, `summary` (20+), `localNote` (300+ chars, distinct
across entries), `faqs` (2+). Body markdown is the page's long-form text. Seeds (builder's picks, from
general horticultural and civic knowledge, no business claims):

| area | service | why |
|---|---|---|
| coral-gables | tree-plant-installation | mature canopy, tree ordinance culture |
| miami-beach | bush-hedge-trimming | salt wind, compact lots |
| doral | lawn-maintenance | HOA common areas and new commercial |
| kendall | lawn-maintenance | wide suburban lots |
| hialeah | pressure-washing | dense lots, small commercial frontage |
| miami | mulching-planting-beds | limestone soil, rain, hurricane season |

**Titles.** Service page title: `<Service> in Miami-Dade, FL`. Area page: existing headline. Local page:
`<Service> in <Town>, FL`. Template appends ` | Grizzly Lawn Care`. Audit bounds: title 20-65 chars,
description 70-160 chars, both unique across indexable pages. Content may override with `seoTitle` /
`seoDescription` frontmatter (optional, services + local).

**Schema.** `localBusinessJsonLd` gains `hasOfferCatalog` (OfferCatalog of Offer > Service, one per service,
with the service URL). `serviceJsonLd` provider becomes `{ '@id': '<origin>/#business' }`. Local pages emit
Service (areaServed one City) + FAQPage + BreadcrumbList. No new business facts.

**Verification.** `GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION` env vars → `site.verification`
in site.config → `<meta name="google-site-verification">` / `<meta name="msvalidate.01">` when set.

**Audit (`npm run test:seo`).** Vitest over `dist/` (separate config so `test:unit` stays fast):
- every HTML page (except 404 and /preview) has exactly one `<h1>`, one `<title>` within bounds, one
  description within bounds, one canonical equal to `SITE_URL + path` (no trailing slash except root);
- titles and descriptions unique across indexable pages;
- every JSON-LD block parses; every `Service` has `provider['@id']`; every `BreadcrumbList` has >= 2 items;
  every `FAQPage` has >= 1 question;
- every internal `href` resolves to a built page or file; every `<img>` has non-empty `alt`;
- sitemap lists exactly the indexable pages (excludes /preview and 404) and every listed URL is built;
- robots state matches the build: HOLD_BACK or no SITE_URL → `Disallow: /` and noindex on every page;
  otherwise `Allow: /` + sitemap line and no noindex except /preview.
CI runs it after Build with `SITE_URL` set and, in a second invocation, with `HOLD_BACK=1`.

**Launch runbook** `docs/seo-launch.md`: DNS + Pages custom domain swap, set SITE_URL, delete HOLD_BACK,
add verification vars, submit sitemap in Search Console + Bing, set the website on the Google Business
Profile, confirm NAP matches site.config, run `npm run test:seo` with the live values, check
`site:` query after a week. Also: drop staging domain from Pages so it cannot be indexed later.

## Left to the builder

Exact copy of seeded local pages (must be true, general, and specific to the pair). Markup of the local page
(reuse PageHero, Container, Eyebrow, ClosingCTA). Test file layout.
