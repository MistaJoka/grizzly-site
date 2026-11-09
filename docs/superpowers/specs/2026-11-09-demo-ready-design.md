# Demo-ready Grizzly site: sample data + attention layer

Date: 2026-11-09. Repo: grizzly-site (Astro 7, Tailwind 4, static, GitHub Pages staging at
https://grizzlysite.andraewilliams.com, HOLD_BACK=1 so it stays out of search).

## Intent and why

The owner wants to show Alex Bermudez a live, complete-looking site and explain how its layout uses
attention and persuasion science to turn a visitor into a quote request. Alex has not yet supplied 13
facts (phone, email, hours, 7 credentials, quote URL, social links), so the real site hides those
sections. A demo needs them filled, visibly as samples, without weakening the rule that production
builds never fake a fact.

Sources for the patterns: `~/.claude/design/trend-scans/2026-11-09-landscaping-homepage-persuasion.md`
(trust strip under hero, sticky call bar, two intake paths, proof threaded through the page: moda.app
2026-09-02, smartsites 2026-04-30, HVAC scan 2026-11-01; F-pattern: NN/g reviewed 2026-08-19; Fitts,
Hick, Von Restorff, serial position, peak-end, goal gradient: lawsofux.com).

## Goals

1. **Demo mode.** `DEMO_DATA=1` at build time fills every empty config value with a clearly-sample
   value and shows a slim "sample details" notice on every page. Without the variable nothing changes.
2. **Attention layer, all modes.** Trust strip of verifiable proof directly under the home hero; a
   mobile sticky action bar (Call / Text / Quote) in the thumb zone; a goal-gradient hint on the quote
   form; bloom stays the only accent and is used only for the primary action.
3. **Social proof in demo.** Sample reviews labelled as samples on the home Proof section and the About
   page; an illustrated before/after pair for the 40-tree project so the existing wipe component shows.
4. **Quote form works in demo.** With no Groundwork host, the form confirms in-page ("sample") instead
   of posting anywhere.
5. **The pitch page.** `/preview` gains a "Why it works" section: each principle in plain English, where
   it lives on the site, and its source. Also explains the sample data and links to what Alex supplies.
6. **Shipped.** Staging builds with `DEMO_DATA=1`; CI audits the demo + held-back combination; a demo
   e2e spec covers the demo-only behaviour; the README and launch runbook say how to turn demo off.

## Non-goals

Spanish pages, real photos, a blog, Google Business Profile, Groundwork hosting, a new domain,
replacing the illustrated theme, any change to SEO titles/descriptions.

## Anti-goals (failure even if it works)

- A sample value that could be read as a real claim without the notice in view.
- Stock or AI photos, emoji icons, a banner that fights the design.
- A production (non-demo) build rendering any sample value.
- Inventing a licence or certification. Sample credentials are limited to generic insurance and tax
  receipt wording; fertilizer licence, tree-trimmer card, workers comp and SBE stay empty.

## Constraints

- Tests already assert: no tel:/mailto: links and no blockquote in the default dev server
  (`tests/e2e/home.spec.ts`, `contact.spec.ts`), testimonials folder ships empty, brand strings live in
  config not components, every `env('X')` key is forwarded by `pages.yml`, no `$`/ratings/review
  counts in content. All stay green; demo behaviour is tested by a separate Playwright config.
- Machine: Playwright `--workers=1`, at most two heavy processes, kill own servers by PID.
- Accessibility (axe), Lighthouse budget and the SEO audit must pass on the demo build too.

## Decisions (owner's are marked; the rest are mine)

- **Owner:** mock data is allowed; the demo can live on staging; not on Alex's domain yet.
- Sample values (mine): phone `(305) 555-0188` / `tel:+13055550188` (555-01xx is the reserved
  fictional range), email `quotes@grizzlylawncare.example` (RFC 2606 TLD), hours
  `Mon–Sat, 7:00 am – 6:00 pm`, credentials `General liability insured`, `Commercial auto insured`,
  `Miami-Dade business tax receipt`. Social stays empty (no links to nowhere). Quote URL stays empty;
  the form switches to the in-page sample confirmation.
- Sample reviews (mine): three, first-name-plus-initial attributions, each figcaption begins
  "Sample review". They live in `src/lib/demo.ts`, never in the content collection.
- Notice (mine): one line, haze background (cream = "not final" signal), ink text, link to
  `/preview#needs`. Sits above the header; the transparent home header is offset by its height.
- Sticky bar (mine): `md:hidden`, fixed bottom, three equal segments when a phone exists
  (Call, Text, Quote), one full-width Quote otherwise; Quote is bloom; z-index below the menu dialog;
  the footer gets bottom padding so nothing is covered.
- Trust strip (mine): up to four chips: Florida LLC since 2021 with the Sunbiz document number, owner
  on every job, first supplied credential, "6 towns in Miami-Dade". Rendered in all modes from config.
- `missingConfig` keeps reporting against the real (pre-demo) values so `/preview` and
  `check:config` still list what Alex owes.

## Left to the builder

Exact copy of the "Why it works" entries, the before/after drawings, chip styling, and the
in-page confirmation wording, within the tokens in `src/styles/tokens.css`.

## Builder-check answers (2026-11-09)

1. The overlay is applied to the exported config at load time, so JSON-LD, meta and UI all see the same
   sample values. Staging is held back (noindex, robots Disallow), so a sample phone in structured data
   never reaches an index. A build guard enforces that: `DEMO_DATA` with an indexable build
   (`isLive`) throws at config load, unless `DEMO_ALLOW_INDEXABLE=1` (CI's Lighthouse step only).
2. Production = `DEMO_DATA` unset. The guard above plus a unit test cover the boundary.
3. A configured `GROUNDWORK_QUOTE_URL` always wins over the in-page sample form, demo or not.
4. The before/after pair is injected from `demo.ts`; the two drawings are generated by the placeholder
   script into `src/assets/images/demo/` and exist in every checkout but are only rendered in demo. The
   section carries a visible "Illustrated sample" eyebrow and alt text saying illustration.
5. The trust strip is one compact row of chips. The order assertion in `home.spec.ts` gains the new
   region; the "services within two viewports" assertion must still hold unchanged.
6. The "6 towns" count comes from the areas collection. Repeating the owner/LLC facts in the Proof
   section is intended (proof threaded through the page).
7. The sticky bar renders on every page except `/preview` and `/404`. Quote goes to `/contact`, or to
   `#quote-form` on the contact page itself. With no phone configured it is a lone Quote bar.
8. One featured sample review on the home Proof section, all three on About. Blockquotes are banned in
   the default build only.
9. The demo Playwright config has its own spec folder and port 4322 and runs axe on `/`, `/about`,
   `/contact`. CI's Lighthouse step runs against the demo build (with `DEMO_ALLOW_INDEXABLE=1`) since that
   is what staging serves; the SEO audit runs on both the indexable default build and the demo+held-back
   build.
10. `DEMO_DATA` is a repository variable forwarded like the others (`vars.DEMO_DATA`); the runbook adds
    `gh variable delete DEMO_DATA` to the launch steps.
