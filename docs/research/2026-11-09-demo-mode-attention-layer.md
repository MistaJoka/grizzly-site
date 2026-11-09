# Research brief: demo mode + attention layer (2026-11-09)

**TLDR.** Keep the existing Astro 7 / Tailwind 4 token system and the illustrated theme. Add a build-time
`DEMO_DATA` overlay with clearly labelled sample values, a trust strip under the hero, a mobile sticky
action bar, sample proof, an in-page demo form, and a "why it works" pitch section on `/preview`.
Every pattern traces to a dated source; nothing new is installed.

**ELI5.** The site already knows how to hide what Alex has not told us. For the demo we hand it
stand-in facts, stamp "sample" on them, and add the few layout pieces that landscaping sites with the
best lead flow all share: proof right under the promise, a call button under the thumb, one obvious
next step.

## What exists and gets reused
- `site.config.ts` single source of facts with `env()` and `missingConfig()`; `isLive()` + `HOLD_BACK`.
- Tokens in `src/styles/tokens.css` (bloom = only accent, haze = cream), `Button` primitive, `sheet`
  layering, `stripes` pattern, code-drawn art in `src/lib/art.mjs` + `scripts/generate-placeholders.mjs`.
- Test stack: Vitest, Playwright + axe (`--workers=1`), `tests/seo` dist audit, Lighthouse CI budget.
- Versions: Astro 7, Tailwind 4, Playwright per `package.json` lockfile (no upgrades proposed).

## Per vertical
| Vertical | Decision | Why | Source |
|---|---|---|---|
| Frontend / UX | Trust strip under hero; sticky call/text/quote bar on mobile; two intake paths; proof threaded through the page | 2+ independent 2026 sources per pattern | `~/.claude/design/trend-scans/2026-11-09-landscaping-homepage-persuasion.md` (moda.app 2026-09-02, smartsites 2026-04-30, HVAC scan 2026-11-01) |
| Perception science | Front-loaded headings, bold facts, chunking; one accent for one action; first/last positions carry the key facts | NN/g F-pattern (2017, reviewed 2026-08-19); lawsofux.com (Fitts, Hick, Von Restorff, serial position, peak-end) | same scan |
| Accessibility | Sticky bar targets ≥ 44px tall, ≥ 24×24 CSS px minimum; notice text meets AA on haze; axe runs in demo too | WCAG 2.2 SC 2.5.8 Target Size (Minimum), Level AA | w3.org/WAI/WCAG22/Understanding/target-size-minimum.html (fetched 2026-11-09) |
| Legal / honesty | Sample phone in 555-0100…0199; sample email on `.example` | Reserved fictional ranges: nobody receives a stray call or mail | Wikipedia "555 (North American Numbering Plan)" (NANPA inventory, 2016 note); RFC 2606 (June 1999) |
| Security | No new endpoints; demo form never posts anywhere (`preventDefault`, no fetch); hosted URL still wins when set | Keeps the zero-backend static model | project convention (`src/lib/quote.ts`) |
| Performance | No new scripts beyond ~20 lines inline; sticky bar is CSS; drawings rasterised at build like the others | Lighthouse budget: perf ≥ 0.95, LCP ≤ 1.8 s, CLS ≤ 0.05 | `lighthouserc.json` |
| Testing | Unit tests for the overlay and guard; second Playwright config (port 4322) for demo-only behaviour; default suites unchanged | Default build must stay provably honest | existing `tests/` layout |
| Ops / cost | Repo variable `DEMO_DATA=1` on staging; `gh variable delete DEMO_DATA` at launch; build guard against indexable demo | One switch, same as `HOLD_BACK` | `docs/seo-launch.md` |

**UNVERIFIED:** the faces/gaze-direction cue (no primary NN/g source found). Not used.

## Rejected
- Putting sample values into the content collections or markdown: leaks into production, breaks the
  "testimonials folder ships empty" guarantee.
- Hard-coding `DEMO_DATA: 1` in `pages.yml`: harder to see and remove than a repo variable.
- A blog: weak lever for local service search; service-in-town pages already cover content growth.

## Risks and how we know it works
- Sample value shown as real → notice on every page (e2e), guard throws on indexable demo (unit).
- Sticky bar covers content → e2e compares footer copyright box to bar box after full scroll.
- Default build changes → existing `home.spec` / `contact.spec` assertions on no tel:/blockquote stay.
