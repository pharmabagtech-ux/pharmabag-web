# Landing Page Content Manager — Design Spec

Date: 2026-09-08 (revised 2026-09-09)
Status: implemented — see the commits on `feat/landing-page-content` (web) and
`feat/page-seo-overrides` (api)
Repos: `pharmabag-api` (migration + module), `pharmabag-web` (storefront read
path, defaults endpoint, admin tab)

## Goal

Every word on the storefront's landing pages is a template literal in a page
file or computed at render. None of it is in the database, so none of it can be
changed without a deploy and none of it is visible in the admin panel.

This makes the content of every landing page readable and editable in admin,
without changing how any page behaves until somebody edits it.

## Correction to the first draft of this spec

The first version proposed a new `landing_page_content` table keyed by
`(pageType, pageKey)`. That was wrong in two ways, found by reading the repos
rather than the memory of them:

1. **An API for this already existed** — `feat/page-seo-overrides` (`b71b10f`),
   written 2026-09-01, committed and never pushed. 526 lines: migration, model,
   DTOs, service, specs, public and admin controllers, registered in
   `app.module.ts`. Building a second one would have been duplicate work
   against a better design.
2. **Path-keying beats entity-keying.** The existing table keys on the
   storefront PATH. Every page already knows its own path, so one lookup serves
   products, categories, dosage forms, brands, molecules, locations, blog posts
   AND static pages, with no per-type resolver. `entityType` is carried for
   admin filtering only, never for resolution.

The numbers in the first draft were also wrong. It said ~905 brands and ~1,640
landing pages, taken from the deduped `brands.xml` count. Measured against the
live API: **1,674 raw manufacturer rows, 1,338 unique brand slugs**, and the
admin list surfaces 1,063 pages.

## What was built

### API — extends the existing `page_seo` table

Migration `20260908120000_add_page_seo_content` adds three nullable columns to
the table `b71b10f` created:

- `h1` — the visible page heading
- `intro` — the opening paragraph above the product grid
- `bodyHtml` — rich text below the grid

The head fields (`title`, `description`, `canonicalUrl`, `robots`, OG/Twitter,
keywords, `faq`, `structuredData`, `imageAlts`) already existed. NULL means
"the storefront generates this". Empty string clears an override back to null,
which needs the explicit `undefined` vs `''` handling the service already
implements — a truthiness spread would swallow the clear.

### Tokens

`intro` and `bodyHtml` may carry `{{product_count}}`, `{{name}}` and
`{{min_order_value}}`, resolved by the storefront at render. Without them, an
edited sentence freezes a product count that changes whenever the catalogue
does. Unknown tokens render literally, so a typo is visible rather than leaving
a silent gap.

### Storefront — generated content extracted, overrides applied

Each of the seven families had its content computed inline in its page file.
That content now lives in `apps/buyer/src/lib/seo/defaults/`:

| Family | Route | Defaults module |
|---|---|---|
| Category | `categories/[categorySlug]` | `category.ts` |
| Dosage form | `categories/[categorySlug]/[formSlug]` | `dosage-form.ts` |
| Molecule | `generics/[moleculeSlug]` | `molecule.ts` |
| State | `wholesale-medicine-suppliers/[stateSlug]` | `state.ts` |
| City | `wholesale-medicine-suppliers/[stateSlug]/[citySlug]` | `city.ts` |
| Brand | `brands/[brandSlug]` | `brand.ts` |
| Brand × city | `brands/[brandSlug]/[citySlug]` | `brand.ts` |

`lib/seo/page-seo.ts` fetches the whole override map once per revalidation
window (300s) and applies it field by field. It **fails open**: any error
returns `{}` and every page renders exactly what it renders today.

One rule where a page carries live data: on molecule pages an admin body
replaces the hand-written prose block ONLY. The spec table and the live
wholesale-rate comparison are generated from real listings and are never
editable away.

### Storefront — `/api/seo/page-defaults`

Read-only. Returns what a path GENERATES (`?path=`), or every landing page
(`?list=1`). This is what lets the admin editor open showing the live wording
instead of a blank form. CORS is an explicit origin allowlist.

The list is honest about its own limits: it deduplicates brands by slug
(several spellings collapse to one URL), caps brands at 200 by catalogue size,
and RETURNS the number omitted so the UI can say so rather than implying
completeness.

### Admin — `/seo/pages`

Family tabs with counts, search, an Auto/Custom badge per row, a "view live"
link, and an editor that prefills every field's placeholder with the current
generated text. Fields: H1, intro, rich-text body, meta title/description via
the existing `SeoFieldsPanel`, robots visibility, and an FAQ list that can be
taken over or left generated. "Reset to auto" deletes the row.

## Verification

Every family was diffed before and after, rendered against the LIVE API — which
still 404s `/page-seo/map` because the API PR is unmerged, so this exercised the
real fail-open path:

```
/categories/ayurvedic                              identical
/categories/ayurvedic/syrup                        identical
/generics/paracetamol                              identical
/wholesale-medicine-suppliers/west-bengal          identical
/wholesale-medicine-suppliers/west-bengal/kolkata  identical (script tag order only)
/brands/cipla                                      identical
/brands/cipla/kolkata                              identical
```

Both app builds clean; the buyer route table is unchanged and the homepage is
still `○ Static`. API suite green apart from `products.sitemap.spec.ts`, which
fails 5 tests on `origin/main` already, before and after this work.

## Deliberately not done

- No backfill of stored rows. Prefill happens in the editor; saving creates the
  row. Snapshotting 1,000+ pages would freeze their product counts.
- Internal link blocks stay generated — they are how 26,815 products get
  discovered.
- No draft/publish or revision history. Save is live, matching the Blog and
  Site SEO panels.

## Still open

- **Category slug renames still 404.** `categories.service.ts` rewrites the slug
  when a category is renamed, with no redirect; the redirects manager only
  auto-301s product slugs. Agreed as in scope, not yet built.
- Nothing is pushed. The API PR must merge and deploy before the admin tab can
  read or write anything.
