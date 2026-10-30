# Grizzly Lawn Care website

Public marketing site for **Grizzly Lawn Care, LLC** (owner Alex Bermudez, Miami, FL; Sunbiz L21000330992).
Forked from the owner's polished landscape template (Astro 7, Tailwind 4, content collections, JSON-LD,
Vitest, Playwright + axe, Lighthouse CI). Fully static: no server code, no database.

Business facts come only from `~/Work/grizzly-growth/` (plan, capability statement, Alex questions) and the
2026-10-15 research context. Anything not found there is an **empty placeholder in `site.config.ts`**; the
site omits it instead of faking it.

## Run, test, build

```bash
npm install
npm run dev            # http://localhost:4321
npm run check:config   # lists what Alex still has to fill in
npm run test:unit      # Vitest
npm run build          # static site in dist/ (one .html per route: build.format 'file')
npm run test:seo       # audits dist/: titles, descriptions, canonicals, JSON-LD graph, links, sitemap, robots (needs SITE_URL)
npm run test:e2e       # Playwright (desktop + mobile, incl. axe a11y); use: npx playwright test --workers=1
npm run test:perf      # Lighthouse CI against dist/ (set SITE_URL for the build first; SEO must be indexable)
```

`npm run build` and `npm run dev` first generate illustrated placeholder images (flat vector scenes, clearly not
photos) into `src/assets/images` (`scripts/generate-placeholders.mjs`, drawn by `src/lib/art.mjs`). It never
overwrites a file that already exists. To redraw one, delete it and run `npm run placeholders`.

## Design

Layered Miami yard: sage sky, St. Augustine greens, bougainvillea (`--bloom`) for actions, Gloock display and
Hanken Grotesk text (tokens in `src/styles/tokens.css`). The home hero is an inline SVG scene in five depth layers
(`heroLayers()` in `src/lib/art.mjs`) that drift at different speeds with a CSS scroll timeline; reduced motion
turns that off. Sections are `.sheet`s that overlap the one before, and the mowed-lawn `.stripes` pattern is the
one repeated motif. The hero stays illustrated even after real photos arrive; the service images get replaced.

## The quote form: how it works

**Approach: a plain HTML form that posts straight to the hosted Groundwork request-a-quote route.**

Groundwork (`~/Work/groundwork`, not modified) has no JSON API and no server action for this. It has a normal
route handler, `src/app/r/[slug]/send/route.ts`, behind the public page `/r/<slug>`:

- `POST /r/<slug>/send`, `multipart/form-data`, answers with a **303 redirect** to `/r/<slug>?m=sent`
  (or `?e=<message>` on a validation error). The visitor lands on the hosted confirmation page.
- Fields: `name` (required, max 120), `phone` and/or `email` (at least one required; phone needs 7+ digits),
  `address`, `service`, `message` (max 2000), `preferred_dates`, `photos` (max 3, JPEG/PNG/WebP, 5 MB each).
- Honeypot: field `website`. If it is filled, Groundwork answers "sent" and stores nothing. The form keeps it
  off-screen, `aria-hidden`, `tabindex=-1`.
- Rate limit: 5 requests per hour per connection (`RATE_LIMIT` / `RATE_WINDOW_SECONDS`).

So `src/pages/contact.astro` renders that form with `action = GROUNDWORK_QUOTE_URL + '/send'`
(`src/lib/quote.ts` holds the field names and limits). No JavaScript, no CORS. The page also links to the hosted form.

Set `GROUNDWORK_QUOTE_URL` (env var, read in `site.config.ts` as `quote.groundworkQuoteUrl`) to the hosted page,
e.g. `https://<groundwork-host>/r/<slug>`. If it is empty, the contact page shows "The online quote form is being
set up" and no form. The Groundwork profile must have that slug, and the slug has to be public.

Verified from the Groundwork source and by Playwright (request intercepted, field names, multipart, honeypot).
**Not yet tested against a live Groundwork deployment**, since none is hosted. Test one real submission after
deploying.

## Deploy

Live on **GitHub Pages** at <https://grizzlysite.andraewilliams.com> (staging while the site is being worked on).
Every push to `main` runs `.github/workflows/pages.yml`, which builds `dist/` and publishes it. Repository variables
(Settings > Secrets and variables > Actions > Variables) drive the build:

| Variable | Now | Meaning |
|---|---|---|
| `SITE_URL` | `https://grizzlysite.andraewilliams.com` | Canonical, OG and sitemap URLs. Unset => noindex + `robots.txt: Disallow: /`. |
| `HOLD_BACK` | `1` | Staging switch: real URLs but still noindex + Disallow. **Delete it to go live.** |
| `GROUNDWORK_QUOTE_URL` | unset | Hosted Groundwork `/r/<slug>` page; unset => contact page shows no form. |
| `BASE_PATH` | unset | Only for a `github.io/<repo>` URL. Must stay unset on the custom domain. |

DNS: `grizzlysite` is a CNAME at GoDaddy (andraewilliams.com's DNS) pointing at `mistajoka.github.io`; the custom
domain is set in the repo's Pages settings, so no `CNAME` file is needed in the build.

Moving to Alex's own domain later: change the DNS CNAME and the Pages custom domain, set `SITE_URL` to it, delete
`HOLD_BACK`. (**Vercel** also works: import the repo, framework preset Astro, same env vars. No adapter needed.)

## Design

Brand palette (tokens in `src/styles/tokens.css`): deep bark brown ink, forest green accent, cream paper.
Fonts and layout are unchanged from the template. Pages: Home, Services (5) + detail, Commercial & HOA
(capability statement), Work (+ detail), About, Contact, Areas (6), 404.

## SEO engine

Built 2026-10-29 so the site is ready to rank the day it launches on Alex's domain. See `docs/seo-launch.md`
for the launch order and `docs/superpowers/specs/2026-10-29-seo-engine-design.md` for the reasoning.

- **Service-in-town pages** at `/services/<service>/<area>`, built only from a hand-written
  `src/content/local/<service>--<area>.md` (300+ characters of real local text, 2+ FAQs). Six are seeded, one per
  town. Service pages link each town to its local page when one exists, area pages link each service likewise.
- **One schema graph:** the `LandscapingBusiness` node carries an `@id` and an `OfferCatalog` of the services;
  every `Service` node points its `provider` at that `@id`; FAQ and BreadcrumbList where the page shows them.
- **Title rules** in `src/lib/seo.ts`: `serviceTitle`, `areaTitle`, `localTitle`, bounded by `TITLE_MAX`;
  `seoTitle` / `seoDescription` frontmatter overrides on services, areas and local pages.
- **Verification tokens** from `GOOGLE_SITE_VERIFICATION` / `BING_SITE_VERIFICATION` env vars.
- **Audit** (`npm run test:seo`, `tests/seo/`) runs in CI on the indexable build and on a `HOLD_BACK=1` build:
  one h1, title 20-65, description 70-160, canonical = `SITE_URL` + route, og:url, unique titles and
  descriptions, JSON-LD parses and links, internal hrefs resolve, alt text, sitemap = indexable pages, robots and
  `noindex` agree with the build.
- **Staging stays hidden:** `HOLD_BACK=1` keeps `noindex` + `Disallow: /` while URLs are already final-form.

## Alex must fill in

`/preview` is a private walkthrough for Alex (search result, shared link, phone, business profile, and this list,
read live from `site.config.ts`). It is noindex, not in the nav or sitemap. **Delete `src/pages/preview.astro` at launch**
(and drop `/preview` from `tests/e2e/routes.ts`).

All of these are empty in `site.config.ts` (or are env vars) and are hidden from visitors until supplied:

- [ ] Phone number (`business.phone`, `business.phoneHref`)
- [ ] Public email (`business.email`)
- [ ] Business hours (`business.hours`)
- [ ] Final domain: `SITE_URL` (also unlocks indexing and the sitemap)
- [ ] Hosted quote page: `GROUNDWORK_QUOTE_URL`
- [ ] Credentials (each shown only if filled): general liability (carrier, limit), commercial auto, workers' comp or exemption,
      FDACS fertilizer license (LF), UF/IFAS Basic Tree Trimmer card, Miami-Dade/city business tax receipt, SBE number
- [ ] Social / Google Business Profile links (`social`)
- [ ] **Service area**: the six cities (Miami, Miami Beach, Hialeah, Coral Gables, Doral, Kendall) and their
      neighborhoods in `src/content/areas/` are a starting list, not confirmed by Alex (question 12 in `alex-questions.md`).
      Edit `SERVED_AREAS` in `src/lib/schema.ts` as well.
- [ ] **Services**: confirm what he really takes on. Sod, irrigation repair and tree/palm trimming are deliberately NOT
      listed (capability statement says list only what he will take on).
- [ ] Service prices: none published. Add only if he wants them (the schema has no price field today).
- [ ] The 40-tree project: species, site type, schedule, photos (`src/content/projects/forty-tree-installation.md`)
- [ ] **Photos**: replace the placeholder images in `src/assets/images/` (hero, 5 service images) with his own photos,
      and update the `heroAlt` text in each service file. No LawnStarter photos, reviews or ratings.
- [ ] Own reviews: `src/content/testimonials/` ships empty. Each entry needs `source` and `permission: true`. Never invent them.
- [ ] Review the copy for anything that does not sound like him (about page, FAQs, process steps).
- [ ] Confirm "Grizzly Lawn Care" is the brand he wants (he has also said "Grizzly Landscaping"; not a confirmed DBA).

## Safety rules baked in

No home address, ZIP or coordinates (service-area business, city only). JSON-LD (`LandscapingBusiness`) omits every empty value.
Tests fail if prices, ratings, review counts or "LawnStarter" appear in content, or if a testimonial lacks a source.
