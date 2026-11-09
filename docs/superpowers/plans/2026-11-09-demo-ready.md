# Demo-ready site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `DEMO_DATA=1` build fills Alex's blanks with labelled sample values and adds an attention layer (trust strip, mobile sticky bar, sample proof, working demo form, a "why it works" pitch section), while default builds stay exactly as honest as today.

**Architecture:** One demo overlay module (`src/lib/demo.ts`) merged into `site.config.ts` behind `env('DEMO_DATA')`; components keep reading `siteConfig` only. New layout pieces (`SampleNotice`, `MobileActionBar`, `TrustStrip`) are config-driven and render wherever their data exists. Demo-only behaviour is verified by a second Playwright config on port 4322.

**Tech Stack:** Astro 7, Tailwind 4 tokens, Vitest, Playwright + axe, sharp for the before/after drawings.

**Spec:** `docs/superpowers/specs/2026-11-09-demo-ready-design.md` (including its "Builder-check answers").

## Global Constraints

- Default build facts do not change: no tel:/mailto:, no blockquote, no before/after section (`tests/e2e/home.spec.ts`, `contact.spec.ts` stay green; only the narrative-order list may gain the new region).
- Sample values live only in `src/lib/demo.ts`; `src/content/testimonials` stays empty; no `$`, ratings or review counts anywhere.
- Every `env('X')` key in `site.config.ts` is forwarded in `.github/workflows/pages.yml` (`vars.X`).
- `DEMO_DATA` + indexable build throws at config load unless `DEMO_ALLOW_INDEXABLE=1`.
- Playwright `--workers=1`; demo config on port 4322; kill own servers by PID.
- Colors via tokens only; bloom only for the primary action; the notice uses `--haze`.
- axe clean on every route in default mode and on `/`, `/about`, `/contact` in demo; Lighthouse budget holds on the demo build.

## Review Focus

1. Demo build with `GROUNDWORK_QUOTE_URL` also set: the hosted form must win (Task 5 unit test on `quoteMode`).
2. Sticky bar over the footer on a short phone: the copyright line stays reachable (Task 2 e2e scrolls to the bottom and compares boxes).
3. Notice + transparent header on `/`: header below the notice, h1 above the fold (Task 2 e2e).
4. `/preview` default mode: "Why it works" shows no sample review text and no phone (Task 6 e2e).
5. `/work/forty-tree-installation` in demo: before/after alts contain "illustration" (Task 4 e2e).

---

### Task 1: Demo overlay in config

**Files:**
- Create: `src/lib/demo.ts`
- Modify: `site.config.ts`, `.github/workflows/pages.yml`, `scripts/check-config.mjs`
- Test: `tests/unit/demo.test.ts`, `tests/unit/site-config.test.ts`

**Interfaces:**
- Produces (demo.ts): `SAMPLE` = `{ phone: '(305) 555-0188', phoneHref: 'tel:+13055550188', email: 'quotes@grizzlylawncare.example', hours: ['Mon–Sat, 7:00 am – 6:00 pm'], credentials: { generalLiability: 'General liability insured', commercialAuto: 'Commercial auto insured', businessTaxReceipt: 'Miami-Dade business tax receipt' } }`; `applyDemo(config: SiteConfig): SiteConfig` (fills only empty values; never social, never quote URL, never the four unlisted credentials); `SAMPLE_TESTIMONIALS: { quote: string; attribution: string; town: string }[]` (3, each attribution begins "Sample review"); `DEMO_BEFORE_AFTER = { title: 'Forty-tree installation', town: 'Miami-Dade', beforeImage: '/images/demo/forty-trees-before.jpg', beforeAlt: 'Illustration: a bare lot ...', afterImage: '/images/demo/forty-trees-after.jpg', afterAlt: 'Illustration: a row of staked young palms ...' }`.
- Produces (site.config.ts): `site.demo: env('DEMO_DATA')`, `site.demoAllowIndexable: env('DEMO_ALLOW_INDEXABLE')`; `export const realConfig`; default export = overlay when demo; `isDemo(config = siteConfig): boolean`; `missingConfig(config = realConfig)`; guard: `if (isDemo(real) && isLive(real) && !real.site.demoAllowIndexable) throw new Error('DEMO_DATA on an indexable build ...')`.

- [ ] **Step 1: Write `tests/unit/demo.test.ts`**: applyDemo fills phone, phoneHref, email, hours and exactly 3 credentials; keeps name/legalName/floridaDocNumber; leaves fertilizerLicense, treeTrimmerCert, workersComp, sbeCertification, social, groundworkQuoteUrl empty; does not overwrite a supplied phone; every SAMPLE_TESTIMONIALS attribution starts with "Sample review"; `JSON.stringify(SAMPLE) + testimonials` has no `/\$\d|\b4\.\d\b|\d+ reviews/`; DEMO_BEFORE_AFTER alts contain "Illustration".
- [ ] **Step 2: Run** `npx vitest run tests/unit/demo.test.ts` → FAIL (cannot find module).
- [ ] **Step 3: Implement** `src/lib/demo.ts` and the `site.config.ts` changes; add `DEMO_DATA: ${{ vars.DEMO_DATA }}` and `DEMO_ALLOW_INDEXABLE: ${{ vars.DEMO_ALLOW_INDEXABLE }}` to pages.yml; `check-config.mjs` prints a "DEMO_DATA is set: sample values stand in for these" line when demo.
- [ ] **Step 4: Add to `site-config.test.ts`**: `missingConfig()` returns the same list with and without the overlay; the guard throws for `{ demo: '1', url: 'https://x', holdBack: '' }` and not for `holdBack: '1'` or `demoAllowIndexable: '1'` (expose `assertDemoSafe(config)` to test it without env).
- [ ] **Step 5: Run** `npx vitest run tests/unit` → PASS, all files.
- [ ] **Step 6: Commit** `feat(demo): DEMO_DATA overlay with labelled sample values`.

### Task 2: Sample notice + mobile action bar + demo Playwright config

**Files:**
- Create: `src/components/layout/SampleNotice.astro`, `src/components/layout/MobileActionBar.astro`, `playwright.demo.config.ts`, `tests/e2e-demo/demo.spec.ts`
- Modify: `src/layouts/BaseLayout.astro`, `src/components/layout/Header.astro`, `src/components/layout/Footer.astro`, `package.json`

**Interfaces:**
- `BaseLayout` prop `actionBar?: boolean` (default true; `/preview` and `/404` pass false).
- `SampleNotice` renders only when `isDemo()`: `<p data-testid="sample-notice">` with text "Preview with sample details. Phone, email, hours, insurance wording and reviews are placeholders until Alex confirms them." and link "What Alex supplies" → `/preview#needs`. `<html>` gets `data-demo` and style `--notice-h: 2.75rem` (set via inline style on the notice's wrapper + a CSS var consumed by Header: `top-[var(--notice-h,0px)]` when transparent).
- `MobileActionBar`: `<nav aria-label="Quick actions" data-testid="action-bar" class="fixed inset-x-0 bottom-0 z-40 md:hidden">`; links: Call (`phoneHref`), Text (`smsHref`), Quote (`/contact`, or `#quote-form` when prop `onContact`), Quote styled bloom; one full-width Quote when no phone. Footer: `pb-[4.75rem] md:pb-0` on its last block.
- `playwright.demo.config.ts`: port 4322, `testDir: './tests/e2e-demo'`, env `DEMO_DATA: '1'`, `SITE_URL: origin`, `ASTRO_DEV_BACKGROUND: '1'`, same desktop + mobile projects. Script `"test:e2e:demo": "playwright test -c playwright.demo.config.ts"`.

- [ ] **Step 1: Write `tests/e2e-demo/demo.spec.ts`** (first batch): notice visible on `/` and `/services/lawn-maintenance`, text matches /sample/i, link href ends `/preview#needs`; hero region has link `[href="tel:+13055550188"]`; action bar: `test.skip(isDesktop)` style split: on mobile project visible with 3 links named Call/Text/Quote, on desktop `toBeHidden()`; after `page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))` the `text=/All rights reserved/` box bottom ≤ action bar box top; on `/` header box top ≥ notice box bottom and h1 box y < viewport height; `/preview` has no action bar.
- [ ] **Step 2: Run** `npm run test:e2e:demo -- --workers=1` → FAIL (missing config/testids).
- [ ] **Step 3: Implement** components, config, script, layout wiring, header offset, footer padding.
- [ ] **Step 4: Run** `npm run test:e2e:demo -- --workers=1` → PASS; `npx playwright test --workers=1 tests/e2e/home.spec.ts tests/e2e/navigation.spec.ts tests/e2e/contact.spec.ts` → PASS.
- [ ] **Step 5: Commit** `feat(demo): sample notice, mobile action bar, demo e2e config`.

### Task 3: Trust strip under the hero

**Files:**
- Create: `src/components/sections/TrustStrip.astro`
- Modify: `src/pages/index.astro`, `tests/e2e/home.spec.ts`, `tests/e2e-demo/demo.spec.ts`

**Interfaces:**
- Props `items: string[]`. `<section aria-label="Proof at a glance">` → `<ul>` of chips, each with an inline check SVG (`aria-hidden`). Items built in index.astro: `` `Florida LLC since ${foundedYear} · ${floridaDocNumber}` ``, `'Owner on every job'`, `Object.values(credentials).find(Boolean)` (if any), `` `${areas.length} towns in Miami-Dade` ``.

- [ ] **Step 1: Tests**: home.spec adds "shows verifiable proof directly under the hero": region exists, its y < "What we do" region y, 3 listitems, contains `L21000330992`; narrative-order list gains `/proof at a glance/i` after `/hero/i`. demo.spec adds: 4 listitems, one contains /insured/i.
- [ ] **Step 2: Run** `npx playwright test --workers=1 tests/e2e/home.spec.ts` → FAIL.
- [ ] **Step 3: Implement** (compact: one flex-wrap row, `py-5`, paper-raised band inside the first sheet). Place between `<Hero>` and `<OfferingStrip>`.
- [ ] **Step 4: Run** home.spec + demo spec → PASS (including "lists all five services within the second viewport").
- [ ] **Step 5: Commit** `feat(home): trust strip of verifiable proof under the hero`.

### Task 4: Sample proof: reviews and before/after

**Files:**
- Modify: `src/lib/art.mjs` (`DEMO_ART`), `scripts/generate-placeholders.mjs` (`DEMO_FILES`), `tests/unit/images.test.ts`, `src/pages/index.astro`, `src/pages/about.astro`, `src/pages/work/[slug].astro`, `src/components/sections/BeforeAfter.astro` (optional `note` prop → eyebrow text), `tests/e2e-demo/demo.spec.ts`

**Interfaces:**
- `DEMO_FILES = [['demo/forty-trees-before.jpg', 1600, 1000], ['demo/forty-trees-after.jpg', 1600, 1000]]`, generated like FILES (never overwrite). `DEMO_ART = { 'forty-trees-before': (W,H) => svg, 'forty-trees-after': (W,H) => svg }`.
- BeforeAfter prop `note?: string` replaces the eyebrow text ("Illustrated sample" in demo).

- [ ] **Step 1: Tests**: images.test: manifest also covers `DEMO_BEFORE_AFTER` image paths and the orphan check treats `DEMO_FILES` as referenced by `src/lib/demo.ts`. demo.spec: `/` has one blockquote and a figcaption starting "Sample review"; region "Before and after" exists with 2 `img` whose alt matches /illustration/i and an eyebrow "Illustrated sample"; `/about` has 3 blockquotes; `/work/forty-tree-installation` has 2 figures captioned Before/After.
- [ ] **Step 2: Run** `npx vitest run tests/unit/images.test.ts` → FAIL; demo spec → FAIL.
- [ ] **Step 3: Implement** drawings (before: mulch/dirt ground, 3 `shrub`s, lawnDark patches, hazy backdrop; after: 7 `palm`s with stakes on `lawnStripes`), generator, wiring (`isDemo()` branches), run `npm run placeholders`.
- [ ] **Step 4: Run** unit + demo spec + `tests/e2e/home.spec.ts` → PASS.
- [ ] **Step 5: Commit** `feat(demo): sample reviews and illustrated before/after`.

### Task 5: Contact form in demo + goal-gradient hint

**Files:**
- Modify: `src/lib/quote.ts`, `src/pages/contact.astro`, `tests/unit/quote.test.ts`, `tests/e2e/contact.spec.ts`, `tests/e2e-demo/demo.spec.ts`

**Interfaces:**
- `quoteMode(groundworkUrl: string, demo: boolean): 'hosted' | 'sample' | 'none'`.
- Sample mode: same form markup, `action="#quote-form"`, `data-demo`, no "hosted form" sentence; inline script on submit → `preventDefault`, hide form, show `<div role="status" data-testid="quote-sample-sent">` "Request received (sample). On the live site this goes straight to Alex's phone and email." All modes: `<p data-testid="form-hint">About a minute. Your name plus a phone or email is all we need.</p>` above the form.

- [ ] **Step 1: Tests**: quote.test: `quoteMode('https://q.example/r/x', true) === 'hosted'`, `quoteMode('', true) === 'sample'`, `quoteMode('', false) === 'none'`. contact.spec: hint visible. demo.spec: form has `data-demo`; intercept `**/quotes.**` and `**/send` → count 0; fill name + email, click Send → status visible with /sample/i.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** quote.test, contact.spec, demo spec → PASS.
- [ ] **Step 5: Commit** `feat(contact): sample confirmation in demo, one-minute hint`.

### Task 6: "Why it works" on /preview

**Files:**
- Modify: `src/pages/preview.astro`
- Create: `tests/e2e/preview.spec.ts`; modify `tests/e2e-demo/demo.spec.ts`

**Interfaces:**
- `<section aria-labelledby="why-h">` with `<ol>` of 8 `<li>`: `<h3>` name, one plain sentence, "Where:" link, `<cite>` source. Needs list `<section id="needs">`. Items: Front-loaded headline (NN/g F-pattern, reviewed 2026-08-19; where `/#main`), Proof right under the promise (moda.app 2026-09-02; `/#proof`), One accent, one action (Von Restorff, lawsofux.com; `/contact`), Thumb-zone actions (Fitts, lawsofux.com; mobile bar), Two ways in (Hick; `/contact`), Five things, not fifteen (Miller / common region; `/services`), Real photos beat stock (NN/g 2010, reviewed 2026-08-13; `/work`), End on the ask (peak-end; `/#get-started`). Add `id="proof"` to TrustStrip section and `id="get-started"` to ClosingCTA.

- [ ] **Step 1: Tests**: preview.spec (default): section with 8 listitems; every "Where" link → `page.request.get` status 200; no /sample review/i text. demo.spec: `#needs` exists.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS. **Step 5: Commit** `feat(preview): why-it-works pitch section`.

### Task 7: CI, docs, deploy, verify

**Files:**
- Modify: `.github/workflows/ci.yml`, `README.md`, `docs/seo-launch.md`, memory file

- [ ] **Step 1:** ci.yml: "Demo e2e" step (`npm run test:e2e:demo -- --workers=1`); Lighthouse step builds `DEMO_DATA=1 DEMO_ALLOW_INDEXABLE=1` first; held-back audit uses `HOLD_BACK=1 DEMO_DATA=1`. README "Demo mode" paragraph; seo-launch.md adds `gh variable delete DEMO_DATA` before `HOLD_BACK`.
- [ ] **Step 2:** Full local verification, read full output: unit; default build + SEO audit; demo+held-back build + audit; e2e (workers=1); demo e2e; perf on demo build.
- [ ] **Step 3:** Merge to main, `gh variable set DEMO_DATA --body 1`, push, wait for Pages + CI; curl-probe `/`, `/contact`, `/about` for the notice, tel link and sample review; browser QA at phone and desktop widths (frontend-visual-qa).
- [ ] **Step 4:** Update `project_grizzly_site.md` memory; delete the plan workspace.
