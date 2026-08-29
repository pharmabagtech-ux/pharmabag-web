# Admin SEO Suite — Design Spec

**Date:** 2026-08-29
**Repos:** `pharmabag-api` + `pharmabag-web` (admin + buyer apps)
**Approved by:** Arko (design conversation, 2026-08-29)

## Goal

Give the admin panel full control over the platform's SEO surfaces, which today are
either developer-only or nonexistent:

1. **Blog tab** — the API has a complete admin blog backend (`/admin/blogs`) but the
   admin panel has NO blog UI at all; the live blog holds one "test" post created by
   raw API call. Publishing content is the platform's single biggest SEO gap.
2. **Site-wide SEO settings** — GSC/Bing verification, GA4, social links, org contact
   info and the default share image are hardcoded or build-time env vars; changing any
   of them requires a developer and a redeploy.
3. **Redirects & 404 manager** — product renames (especially bulk CSV uploads, which
   have renamed 1,500+ products in one run) orphan URLs; since the 2026-08-29 soft-404
   fix these now return real 404s, so dead URLs shed their equity unless redirected.
   There is no visibility into what is 404ing and no way to create a redirect.
4. **Product SEO overrides** — PDP titles/descriptions are auto-generated (good
   defaults); there is no way to hand-tune them for top products.

**Delivery order: 1 → 2 → 3 → 4.** Each part is an independent API-first → web PR
train, live-verified before the next starts (standing one-merge-at-a-time rule).

## Verified current state (2026-08-29)

- `blog-admin.controller.ts` → `@Controller('admin/blogs')`, `@Roles(ADMIN)`: full CRUD
  for posts (`POST/GET/GET:id/PUT:id/PATCH :id/status/DELETE:id`), authors, categories.
  `CreateBlogPostDto` carries title, slug?, excerpt?, `content: any`, featuredImage?,
  images?, authorId (required), **categoryId (required — but schema is `String?`; DTO
  must be relaxed, see Part 1)**, tags?, status? (`DRAFT|PUBLISHED`), metaTitle?,
  metaDescription?, metaKeywords?, canonicalUrl?, ogImage?.
- Public read: `@Controller('blog')` `GET blog/posts`, `GET blog/posts/:idOrSlug`
  (returns **HTTP 200 + empty body** for unknown slugs — web PR #91 handles it).
- Buyer renders post content via `dangerouslySetInnerHTML` → editor must output HTML.
  Buyer `blogs/[slug]/layout.tsx` already honours metaTitle/metaDescription/
  canonicalUrl/ogImage and suppresses the seeded "Unknown" author from Person schema.
- Storage module: `@Controller('storage')`, `POST storage/product-image`
  (`SELLER|ADMIN`) → S3 URL. No blog-image route.
- `GET /api/config/platform` **does not exist** (404 live); the web api-client
  silently falls back to hardcoded defaults. There is no settings store to reuse —
  Part 2 builds one.
- Buyer app has **no `middleware.ts` and no root `not-found.tsx`** — both new files.
- Master-product renames happen in `services/master-products-bulk.service.ts`
  (bulk upload + `propagateToSellerListings`) and in the admin master-product update
  path; slugs are `<name-slug>-<sku>` via `generateUniqueSlug`.
- Admin app deps: no rich-text editor anywhere in the monorepo. Admin uses
  react-query v5, react-hot-toast, lucide, tailwind; sidebar NAV is a flat array in
  `components/layout/sidebar.tsx`.
- API deploy runs `prisma migrate deploy` (since 2026-08-28) — schema changes ship
  without manual SQL.

---

## Part 1 — Blog tab (admin)

### API changes (small)

- `CreateBlogPostDto`/`UpdateBlogPostDto`: make `categoryId` optional (`@IsOptional`),
  matching the schema's nullable column and the existing live row.
- New `POST storage/blog-image` (`ADMIN`) in the storage module, mirroring
  `product-image` but writing under a `blog-images/` S3 prefix (the existing live
  post's featured image already lives under `blog-images/`, so this matches the
  established layout). Returns `{ url }`.

### Admin UI

**Nav:** "Blog" entry (icon: `Newspaper`) between Marketing and Settlements.

**`/blog` — posts list.** Table: title (+slug under it), author, category, status
badge (Draft grey / Published green), views, updatedAt. Controls: search box
(client-side over the fetched list is acceptable at expected volumes; the admin list
endpoint's own filters are used when present), All/Draft/Published tabs, "New post"
button. Row actions: Edit, Publish/Unpublish (PATCH status), Delete (confirm dialog).

**`/blog/new` + `/blog/[id]/edit` — one shared editor form** (same
component, create vs update mutation), three zones:

1. **Content zone**
   - Title input; slug field auto-derives from title (same slugify rules the API
     uses: lowercase, spaces→`-`, strip non `\w-`) and unlocks for manual edit;
     on EDIT, changing the slug shows the Part-3 redirect checkbox (see Part 3
     integration note).
   - **TipTap rich-text editor** (new deps in `apps/admin` only:
     `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`,
     `@tiptap/extension-image`). Toolbar: paragraph/H2/H3, bold, italic, bullet
     list, ordered list, blockquote, link, image (opens the blog-image uploader and
     inserts the returned URL), undo/redo. Output: HTML string.
   - **Content payload shape:** the DTO's `content` is `any` and the buyer renders
     `blog.content` directly through `dangerouslySetInnerHTML` — with the live test
     post storing `{text: "..."}`, the buyer page currently receives an object and
     renders `[object Object]`-ish garbage only avoided because the page also checks
     truthiness. The editor SAVES `content` as a **plain HTML string**. The buyer
     post page is updated to render `typeof content === 'string' ? content :
     content?.text ?? ''` so both shapes work (defensive; the old shape exists in
     one live row).
   - Excerpt textarea (shown on the blogs index cards + used as description
     fallback).
   - Featured image: upload via `storage/blog-image`, preview, remove.
   - Author select (+ "New author" inline modal: name, bio, avatar upload) — the
     seeded "Unknown" author is listed but flagged "(set a real author for SEO)".
   - Category select (+ "New category" inline modal: name), clearable (optional).
   - Tags: free-text chips.
2. **SEO panel** (collapsible card, shared `SeoFieldsPanel` component — reused by
   Part 4)
   - Meta title (counter, green ≤60 chars), meta description (counter, green
     50–160), keywords chips, canonical URL, OG image upload.
   - **Google-result preview**: renders title (meta title || title), URL
     (`pharmabag.in/blogs/<slug>`) and description (meta description || excerpt)
     in SERP styling, updating live.
   - Empty fields show placeholder text of the derived fallback so the editor sees
     exactly what will ship if they leave it blank.
3. **Publish bar** (sticky footer): status toggle Draft/Published, Save button,
   "View live" link when published.

### Data flow / errors

- All calls through the admin app's existing authenticated axios client to
  `/admin/blogs*`; react-query mutations with toast on error, list invalidation on
  success. No optimistic updates (low write volume, correctness first).
- Image uploads: multipart to `storage/blog-image`; failures toast and leave the
  form state untouched.

### Testing / verification

- API: DTO relaxation covered by an e2e-style controller spec asserting a post
  creates without categoryId; storage route spec mirrors the product-image spec.
- Web: `tsc` + full `next build`; live verify post-deploy by creating a DRAFT post
  via the new UI against production, confirming it does NOT appear on
  `pharmabag.in/blogs`, publishing it, confirming it renders + carries its meta
  tags + appears in `sitemaps/blogs.xml`, then deleting or keeping per Arko.

---

## Part 2 — Site SEO settings

### API — new `site-settings` module

- **Model `SiteSetting`**: single-row pattern — `id` (fixed `"site"`), `data Json`,
  `updatedAt`. One validated JSON document, no per-key rows.
- **Validated shape** (class-validator DTO):
  `gscVerification?`, `bingVerification?`, `ga4MeasurementId?` (format-checked
  `G-[A-Z0-9]+` when present), `socialProfiles?: string[]` (each a URL),
  `supportEmail?`, `addressLocality?`, `addressRegion?`, `defaultOgImage?` (URL).
- **Endpoints:**
  - `GET /site-settings/public` — public, no auth, returns ONLY the whitelisted
    shape above (never the raw row), `Cache-Control: public, s-maxage=300`.
  - `GET /admin/site-settings` + `PUT /admin/site-settings` — `ADMIN`. PUT
    validates, upserts the single row.
- Empty/absent row → `{}` (the storefront then uses its env/config fallbacks).

### Admin UI

**Nav:** "SEO Settings" (icon: `Globe`) next to Settings. One form page mirroring
the whitelisted shape: three grouped cards — *Search engine codes* (GSC token, Bing
token, GA4 ID, each with a one-line "where to find this" hint), *Brand profiles*
(social URL list, add/remove rows), *Organisation* (support email, city, state,
default share image upload via `storage/blog-image`). Save = PUT; loads current via
GET.

### Buyer consumption

- New `lib/seo/site-settings.ts`: `fetchSiteSettings()` — server-side fetch of
  `/site-settings/public` with `next: { revalidate: 300 }`, tolerant (returns `{}`
  on any failure; **never** throws — settings must never take the site down).
- Root `layout.tsx` (server): merge fetched settings over the existing env-var
  values (`NEXT_PUBLIC_GSC_VERIFICATION` etc. remain as fallback):
  - verification `<meta>` tags (google-site-verification / msvalidate.01),
  - GA4 `<Script>` afterInteractive when an ID exists,
  - pass `sameAs` array + email/locality into the Organization schema builder
    (`lib/seo/schema.ts` gains optional params; `SOCIAL_PROFILES` config constant
    becomes the fallback),
  - `DEFAULT_OG_IMAGE` prefers the uploaded image when set.
- 5-minute staleness is the accepted propagation delay ("live within ~5 minutes").

### Testing / verification

- API: spec for whitelist (a PUT with an unknown key is rejected; GET public never
  returns anything outside the shape), GA4 format guard.
- Web: `next build`; live verify by pasting a dummy-but-real-format GA4 id in the
  panel and grepping the served homepage HTML for it within 5 minutes, then
  clearing it. GSC/Bing: Arko pastes real tokens post-deploy (client action).

---

## Part 3 — Redirects & 404 manager

### API — new `redirects` module

- **Model `UrlRedirect`**: `id`, `fromPath` (unique, normalized: leading `/`,
  no trailing slash, lowercase, query string stripped), `toPath` (relative path or
  absolute URL), `statusCode` (default 301), `source` enum
  `MANUAL | PRODUCT_RENAME`, `hits Int @default(0)`, `lastHitAt?`, `createdAt`.
- **Model `NotFoundHit`**: `id`, `path` (unique, normalized as above), `hits`,
  `firstSeenAt`, `lastSeenAt`, `lastReferrer?`, `resolved Boolean @default(false)`.
- **Endpoints:**
  - `GET /redirects/map` — public, returns `[{from, to, status}]`,
    `Cache-Control: public, s-maxage=60`. The whole table (expected size:
    hundreds; hard cap the response at 5,000 rows, newest first, and log a warning
    at 4,000 so growth is noticed before truncation matters).
  - `POST /redirects/track-404` — public, body `{path, referrer?}`. Normalizes,
    **drops scanner noise** (path matches
    `\.php$|\.asp$|wp-|\.env|\.git|phpmyadmin|xmlrpc|\.sql$|\.bak$` or length >
    500) and paths already covered by a redirect; upserts hits counter.
    Rate-limited by the global throttler (it is a public write — the normalization
    + unique-path upsert bounds table growth to distinct real paths).
  - `POST /redirects/hit` — public, body `{from}`; increments a redirect's hit
    counter (fired async by middleware, fire-and-forget).
  - Admin (`ADMIN`): `GET /admin/redirects` (list + hit counts),
    `POST /admin/redirects` (create — validates `from != to`, collapses chains:
    if `to` matches another redirect's `from`, store that one's final target;
    rejects if `from` equals an existing LIVE route's path is NOT checked — the
    middleware only consults the map for requests, and a redirect shadowing a live
    page is visible and deletable in the UI), `PUT /admin/redirects/:id`,
    `DELETE /admin/redirects/:id`, `GET /admin/redirects/404s`
    (sort by hits desc, filter unresolved), `DELETE /admin/redirects/404s/:id`
    (dismiss).
  - Creating a redirect whose `from` matches a `NotFoundHit.path` marks that hit
    `resolved`.

- **Auto-redirect hooks (API):**
  - `master-products-bulk.service.ts`: where the bulk update rewrites a master's
    slug (and in `propagateToSellerListings`' slug regeneration), when
    `oldSlug !== newSlug` and the product was previously active, upsert
    `UrlRedirect { from: /products/<oldSlug>, to: /products/<newSlug>,
    source: PRODUCT_RENAME }`. Chain-collapse: an existing redirect pointing AT
    `/products/<oldSlug>` is re-pointed to the new target, so A→B→C flattens to
    A→C at write time. Upload summary gains `redirectsCreated: N`.
  - Admin single master-product update path: same hook; the request DTO gains
    optional `createRedirect?: boolean` (default `true`) so the admin UI checkbox
    can opt out.

### Buyer changes

- **`middleware.ts`** (new): matcher excludes `_next/*`, `api/*`, static file
  extensions. Logic: get the redirect map from a module-scoped cache (fetch
  `/redirects/map` when older than 60s; on fetch failure keep serving the stale
  map, or pass-through when none loaded yet — the middleware must NEVER block or
  break requests). Exact-match lookup on the normalized path → 301
  `NextResponse.redirect` (+ fire-and-forget hit ping). Also: stamp
  `x-pathname` request header on every request (for the 404 logger).
- **`app/not-found.tsx`** (new, root): renders the existing 404 visual style
  (match the facet 404 pages), and server-side fire-and-forget POSTs
  `track-404` with the path read from the `x-pathname` header + referrer.
  Logging failure must never affect rendering.

### Admin UI

**Nav:** "Redirects" (icon: `ArrowRightLeft`) next to SEO Settings.
Two tabs on one page:

- **404 Log**: table path / hits / last seen / came-from (referrer), sorted by
  hits desc, unresolved by default (toggle to show all). Row actions: **Create
  redirect** (opens dialog: target = product search box reusing the existing
  `/products/suggestions` autocomplete, OR free path/URL input; shows the
  resulting from→to before saving) and **Dismiss**.
- **Redirects**: table from → to / hits / source badge (auto/manual) / created.
  Edit + Delete. "New redirect" button opens the same dialog with `from` editable.

**Part 1 integration:** the blog editor's slug field and Part 4's product form use
the same behaviour — on slug change of an existing published entity, a pre-ticked
"Redirect old URL to the new one (recommended)" checkbox appears; unticking skips
redirect creation. (Blog edit calls `POST /admin/redirects` directly from the
admin app after a successful save; the product path uses the API-side hook via
`createRedirect`.)

### Testing / verification

- API specs: normalization, scanner-noise filter, chain collapse, self-target
  rejection, rename hook (slug change creates redirect; unchanged slug does not;
  A→B→C flattening), 404 upsert increments.
- Web: middleware unit-testable logic extracted to a pure helper
  (`resolveRedirect(map, path)`) with tests; `next build`.
- Live verify: create a manual redirect via the panel → old URL 301s within 60s
  and Location is correct; hit a garbage URL → appears in the 404 log; rename via
  the flow in a later part once product editing ships. The bulk-rename hook is
  verified by spec only (no staging environment exists); its first real-world
  confirmation is the `redirectsCreated` line in the next genuine client upload
  summary.

---

## Part 4 — Product SEO overrides

### API

- **Schema:** `MasterProduct` gains `metaTitle String?`, `metaDescription String?`,
  `ogImage String?` (migration; additive, no backfill — null means "use the
  generated defaults", which is the current behaviour for all 26,815 rows).
- Admin master-product update DTO/service: accept + persist the three fields, plus
  the `createRedirect` flag from Part 3. The public product detail response
  (`formatMasterDetail`) and `/products/sitemap` are unchanged; `findOne` includes
  the new fields.

### Admin UI

- Product edit page gains a collapsed **"SEO (optional)"** card using the shared
  `SeoFieldsPanel` from Part 1 (meta title, meta description, OG image, Google
  preview; keywords + canonical omitted — canonical stays the stored slug, always).
- The name/slug-change redirect checkbox (Part 3) lives directly above the save
  button whenever the loaded product's slug would change.

### Buyer

- PDP `generateMetadata`: `title: product.metaTitle?.trim() || productTitle(product)`,
  same pattern for description and OG image. Nothing else changes — H1, schema and
  on-page copy stay generated (overrides are head-only by design; the structured
  data must keep describing the actual page).

### Testing / verification

- API spec: update persists the fields; detail returns them.
- Web: `tsc` + build; live verify by setting an override on one real product via
  the panel and fetching the PDP head.

---

## Cross-cutting rules

- Every phase: API PR first, merged + deployed + verified, then the web PR
  (standing rule; deploy collisions documented). Migrations ride the API deploy.
- All new admin pages follow the existing admin conventions (react-query keys
  namespaced per page, toast errors, Skeleton loading, the sidebar NAV array).
- No fabricated SEO anywhere: overrides are editorial inputs, schema keeps
  describing real page content; no keywords meta emission (removed 2026-08-29).
- Out of scope (explicitly): bulk-CSV SEO columns (rejected — blast radius),
  scheduled publishing, blog comment system, generic key-value platform config,
  redirect regex/wildcard rules (exact-match only in v1), 404 email alerts.
