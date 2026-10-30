# SEO launch runbook

The site runs as hidden staging at <https://grizzlysite.andraewilliams.com> (`HOLD_BACK=1`: real URLs,
`noindex` on every page, `robots.txt: Disallow: /`). This is the order of operations when Alex's own domain
is ready. Replace `<domain>` with the bare final host (for example `grizzlylawncare.com`).

## 0. Before touching DNS

- [ ] Alex's facts are in `site.config.ts`: phone, email, hours, credentials, social links. `npm run check:config`
      lists what is still empty. The site omits blanks rather than faking them, but a launch with no phone number
      is a launch with no conversions.
- [ ] Groundwork is hosted and `GROUNDWORK_QUOTE_URL` is set, or the contact page will say "no form yet".
- [ ] `npm run test:unit && SITE_URL=https://<domain> npm run build && SITE_URL=https://<domain> npm run test:seo` is green locally.
- [ ] Google Business Profile exists for Grizzly Lawn Care with the same name, city and phone as `site.config.ts`
      (NAP consistency: Name, Address-as-city, Phone must match everywhere).

## 1. Point the domain at GitHub Pages

At the registrar for `<domain>`:

| Type | Name | Value |
|---|---|---|
| A | `@` | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (four records) |
| CNAME | `www` | `mistajoka.github.io` |

Then:

```bash
gh api -X PUT repos/MistaJoka/grizzly-site/pages -f cname=<domain>
gh variable set SITE_URL -R MistaJoka/grizzly-site -b "https://<domain>"
# wait for the certificate, then:
gh api -X PUT repos/MistaJoka/grizzly-site/pages -F https_enforced=true
```

GitHub Pages redirects `www.<domain>` to `<domain>` once the apex is the custom domain. Leave `BASE_PATH` unset.

Remove the staging host so it can never be indexed later: delete the `grizzlysite` CNAME at GoDaddy. (GitHub only
allows one custom domain per Pages site, so setting `<domain>` already drops `grizzlysite.andraewilliams.com`.)

## 2. Verify ownership (before going live, so it is instant)

- Search Console: add a **Domain** property for `<domain>` (DNS TXT record at the registrar), or a URL-prefix
  property with the HTML-tag method. For the HTML tag, copy the `content` value only:
  `gh variable set GOOGLE_SITE_VERIFICATION -R MistaJoka/grizzly-site -b "<token>"`.
- Bing Webmaster Tools: import from Search Console, or `gh variable set BING_SITE_VERIFICATION ... -b "<token>"`.

Either variable makes the next build emit the matching `<meta>` tag. Unset means no tag.

## 3. Go live

```bash
gh variable delete HOLD_BACK -R MistaJoka/grizzly-site
git commit --allow-empty -m "Launch on <domain>" && git push   # triggers the Pages deploy
```

Confirm, from a terminal:

```bash
curl -s https://<domain>/robots.txt        # Allow: /  and a Sitemap: line
curl -s https://<domain>/ | grep -c noindex   # 0
curl -sI https://<domain>/services | head -1  # HTTP/2 200 (no 301)
```

## 4. Tell the engines

- Search Console → Sitemaps → submit `https://<domain>/sitemap-index.xml`.
- Search Console → URL inspection on `/`, `/services`, `/commercial` → Request indexing.
- Bing Webmaster Tools → Sitemaps → same URL.
- Google Business Profile → Website → `https://<domain>`. Add the services as GBP services too, same names as
  the site's service pages.

## 5. Week one

- `site:<domain>` in Google shows pages appearing; Search Console → Pages shows "Indexed", not "Excluded by
  noindex" (if it does, HOLD_BACK is still set somewhere).
- Search Console → Enhancements: FAQ, Breadcrumb and LocalBusiness rich results are detected with no errors.
- Rich Results Test on one service-in-town page: <https://search.google.com/test/rich-results>.

## Adding SEO content later (no code)

- **New service-in-town page:** add `src/content/local/<service>--<area>.md` (copy an existing one). It appears
  at `/services/<service>/<area>`, in the sitemap, and in the links from the service and area pages. The schema
  rejects fewer than 300 characters of `localNote` or fewer than 2 FAQs, and `npm run test:seo` rejects duplicate
  titles or descriptions.
- **Title or description tweaks:** `seoTitle` / `seoDescription` in a service, area or local page's frontmatter.
- **New area:** add `src/content/areas/<slug>.md`, add the town to `SERVED_AREAS` in `src/lib/schema.ts`
  (the content-integrity test enforces this), and update the area count in `tests/unit/content-integrity.test.ts`.

## Not yet built (next SEO projects)

- Spanish-language pages (`/es/...` with `hreflang`): the biggest untapped lever in Miami-Dade.
- Review markup: only once real, permissioned reviews exist (`src/content/testimonials`).
- Per-page Open Graph images.
