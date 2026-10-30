# SEO Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Launch-ready local SEO layer: service x area pages gated on content, linked schema graph, env-driven verification, and a dist audit in CI.

**Architecture:** Content stays in Astro collections; a new `local` collection drives `/services/[service]/[area]` pages. `src/lib/seo.ts` owns title rules, `src/lib/schema.ts` the JSON-LD graph. A second Vitest config (`vitest.seo.config.ts`) audits `dist/` after build; CI runs it for both live and HOLD_BACK builds.

**Tech Stack:** Astro 7, Tailwind 4, Vitest, Playwright, node-html-parser (new dev dep, for the audit).

**Spec:** docs/superpowers/specs/2026-10-29-seo-engine-design.md

## Global Constraints

- No fabricated business facts; empty config values stay omitted (site.config.ts rules).
- No prices, ratings, review counts, or "LawnStarter" in content (content-integrity test).
- Local pages only when a `src/content/local/<service>--<area>.md` exists; `localNote` >= 300 chars, distinct; `faqs` >= 2.
- Title 20-65 chars, description 70-160 chars, unique across indexable pages.
- Internal links go through `withBase()`.
- Playwright `--workers=1`; one full e2e run at the end.

## Review Focus

1. A local entry naming a service or area id that does not exist → build must fail loudly (Task 3 integrity test).
2. HOLD_BACK=1 with SITE_URL set → every page noindex, robots Disallow, sitemap still present (Task 6 audit, second CI run).
3. Service page with no local pages for some areas → link falls back to the area page, never a 404 (Task 4 e2e).
4. Title template overflow for the longest service + town ("Mulching & Planting Beds in Coral Gables, FL | Grizzly Lawn Care" = 65) → audit bound is 65 inclusive (Task 1 unit test pins the longest case).
5. Verification env unset → no empty `<meta name="google-site-verification">` emitted (Task 2 unit test).

---

### Task 1: Title rules

**Files:** Modify `src/lib/seo.ts`, `src/content/services/*.md` (none), Test `tests/unit/seo.test.ts`.
**Produces:** `serviceTitle(serviceTitle: string): string` → `<Service> in Miami-Dade, FL`; `localTitle(serviceTitle: string, town: string, state: string): string` → `<Service> in <Town>, <ST>`; `TITLE_MAX = 65`, `TITLE_MIN = 20`, `DESC_MIN = 70`, `DESC_MAX = 160` exported constants.

- [ ] Write failing tests: `serviceTitle('Tree & Plant Installation')` === `'Tree & Plant Installation in Miami-Dade, FL'`; `localTitle('Mulching & Planting Beds','Coral Gables','FL')` === `'Mulching & Planting Beds in Coral Gables, FL'`; `pageTitle(localTitle('Mulching & Planting Beds','Coral Gables','FL')).length <= TITLE_MAX`.
- [ ] Run `npx vitest run tests/unit/seo.test.ts` → FAIL (not exported).
- [ ] Implement in `src/lib/seo.ts`.
- [ ] Run → PASS. Use `serviceTitle` in `src/pages/services/[slug].astro` (`title={serviceTitle(service.data.title)}`).
- [ ] Commit `feat(seo): location-aware service titles`.

### Task 2: Verification meta

**Files:** Modify `site.config.ts` (type + value `site.verification: { google: string; bing: string }` from env `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`), `src/components/seo/Meta.astro`; Test `tests/unit/site-config.test.ts`, `tests/unit/smoke.test.ts`.

- [ ] Failing test: `siteConfig.site.verification` has keys `google`, `bing`, both `''` by default; `missingConfig` does NOT list them (optional). Smoke: `Meta.astro` source contains `google-site-verification` and `msvalidate.01` and both are wrapped in a truthiness guard (`&&`).
- [ ] Run → FAIL. Implement. Run → PASS. Update `tests/unit/site-config.test.ts` object literals to include `verification`.
- [ ] Commit `feat(seo): search console and bing verification via env`.

### Task 3: `local` collection + seeds

**Files:** Modify `src/lib/schemas.ts` (add `localSchema`), `src/content.config.ts` (add `local` collection, base `./src/content/local`); Create 6 seed files per spec table; Test `tests/unit/content-integrity.test.ts`, `tests/unit/content-schema.test.ts`.
**Produces:** `localSchema` zod: `{ service: string, area: string, headline: string, summary: string(min 20), localNote: string(min 300), faqs: {question, answer}[] (min 2), seoTitle?: string, seoDescription?: string }`. Also add optional `seoTitle`, `seoDescription` to `serviceSchema`.

- [ ] Failing tests in content-integrity: `ids('src/content/local')` length 6; every file name is `<service>--<area>` and both ids exist; `localNote`s >= 300 and distinct; no local file for a pair not listed in that area's `services`. In content-schema: `localSchema` rejects `faqs` of length 1 and `localNote` of 299 chars.
- [ ] Run → FAIL. Write schema, collection, 6 seeds (true, general, pair-specific; include body markdown of 2-3 paragraphs).
- [ ] Run unit → PASS. `npm run build` → 26 pages (20 + 6).
- [ ] Commit `feat(seo): content-gated local service pages collection with six seeds`.

### Task 4: Local page route + linking

**Files:** Create `src/pages/services/[service]/[area].astro`; Modify `src/pages/services/[slug].astro` (Where we do this work → local link when exists), `src/pages/areas/[slug].astro` (service cards → local link when exists), `src/lib/schema.ts` (`serviceJsonLd` provider `@id`, `localBusinessJsonLd` `hasOfferCatalog(services: {name,url}[])` param), `tests/e2e/routes.ts` (+6 routes); Test `tests/unit/schema.test.ts`, `tests/e2e/areas.spec.ts`.
**Produces:** `localBusinessJsonLd(site, config?, areas?, services?: {name: string; url: string}[])`; `serviceJsonLd(input & { site?: URL })` with `provider: { '@type': 'LandscapingBusiness', '@id': '<origin>/#business', name }`. `BaseLayout` passes services to `localBusinessJsonLd` (read `services` collection in layout).

- [ ] Failing unit tests: `localBusinessJsonLd(site, cfg, areas, [{name:'Lawn Mowing & Maintenance', url:'https://x/services/lawn-maintenance'}]).hasOfferCatalog.itemListElement[0].itemOffered.name` equals the name; without services → no `hasOfferCatalog` key; `serviceJsonLd({..., site}).provider['@id']` === `https://grizzly.example.test/#business`.
- [ ] Run → FAIL. Implement schema changes.
- [ ] Build the route: getStaticPaths from `local` collection, params `{ service, area }`, props `{ entry, service, area }`; title `entry.data.seoTitle ?? localTitle(service.title, area.town, area.state)`; description `entry.data.seoDescription ?? entry.data.summary`; JSON-LD `[serviceJsonLd({name: localTitle(...), description, url, areaServed:[town], site}), faqJsonLd(entry.data.faqs), breadcrumbJsonLd([Home, Services, Service, Town])]`; sections: PageHero, localNote, `<Content/>`, FAQs (same dl markup as service page), links to the service page, area page and other local pages in the same town; ClosingCTA.
- [ ] Linking: in `services/[slug].astro` build `localByArea = new Map(localEntries.filter(e => e.data.service === service.id).map(e => [e.data.area, e]))`; href = local page if present else area page. Same in `areas/[slug].astro` keyed by service.
- [ ] Add 6 routes to `tests/e2e/routes.ts`. e2e in `areas.spec.ts`: `/services/tree-plant-installation` has a link whose href ends `/services/tree-plant-installation/coral-gables`; `/services/pressure-washing` link for Coral Gables ends `/areas/coral-gables`.
- [ ] `npm run test:unit` PASS; `npm run build`; `npx playwright test --workers=1 tests/e2e/areas.spec.ts tests/e2e/routes.spec.ts` PASS.
- [ ] Commit `feat(seo): service-in-town landing pages, linked schema graph`.

### Task 5: SEO audit over dist

**Files:** Create `vitest.seo.config.ts` (include `tests/seo/**/*.test.ts`, environment node), `tests/seo/audit.test.ts`, `tests/seo/dist.ts` (helpers: `pages(): {path, html, url}[]`, `isIndexable(path)`); Modify `package.json` (`"test:seo": "vitest run --config vitest.seo.config.ts"`, add to `test` script after build, devDep `node-html-parser`), `.github/workflows/ci.yml` (step "SEO audit (live)" `npm run test:seo` after Build; step "Build + SEO audit (HOLD_BACK)" `HOLD_BACK=1 npm run build && HOLD_BACK=1 npm run test:seo`), README.
**Interfaces:** reads `process.env.SITE_URL`, `process.env.HOLD_BACK`; skips with a clear message if `dist/` missing.

- [ ] Write the audit tests exactly as the spec's bullet list (one `it` per bullet). Title/description bounds import `TITLE_MIN/MAX, DESC_MIN/MAX` from `src/lib/seo.ts`.
- [ ] Run against a stale/absent dist → FAIL ("dist/ missing: run npm run build").
- [ ] `SITE_URL=https://grizzlysite.andraewilliams.com npm run build && SITE_URL=... npm run test:seo` → PASS (fix any real finding it surfaces: duplicate descriptions, long titles, missing alt).
- [ ] `HOLD_BACK=1 SITE_URL=... npm run build && HOLD_BACK=1 SITE_URL=... npm run test:seo` → PASS.
- [ ] Commit `test(seo): build-output audit in CI for live and held-back builds`.

### Task 6: Launch runbook + docs

**Files:** Create `docs/seo-launch.md` (spec's runbook list as numbered steps with exact commands: `gh variable set SITE_URL ...`, `gh variable delete HOLD_BACK`, `gh api -X PUT repos/MistaJoka/grizzly-site/pages -f cname=<domain>`, Search Console URL-prefix property + sitemap `/sitemap-index.xml`, GBP website field, post-launch `site:` check); Modify README (SEO section: engine summary, how to add a local page, `npm run test:seo`).

- [ ] Write both. `npm run check:config` unaffected.
- [ ] Commit `docs(seo): launch runbook and engine notes`.

### Task 7: Full verification

- [ ] `npm run test:unit`; `SITE_URL=https://grizzlysite.andraewilliams.com npm run build`; `npm run test:seo`; `npx playwright test --workers=1` (full suite once); `npm run test:perf` (Lighthouse, SITE_URL set).
- [ ] Push; confirm CI and Pages deploy green; curl the live staging local page and confirm noindex still present.
