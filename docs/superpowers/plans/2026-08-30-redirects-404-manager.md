# Redirects & 404 Manager Implementation Plan (Admin SEO Suite — Part 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 301-redirect management with a 404 log in the admin panel, plus automatic redirects when bulk uploads rename product slugs — so renames and dead links stop shedding SEO equity.

**Architecture:** Two new tables (`url_redirects`, `not_found_hits`) + a `redirects` API module (throttle-exempt public map, public 404/hit trackers, admin CRUD with chain-collapse). The buyer gains a `middleware.ts` (60s-cached in-memory map → exact-match 301; stamps `x-pathname`) and a root `not-found.tsx` that logs 404s server-side. The bulk master-upload service upserts `PRODUCT_RENAME` redirects whenever it rewrites a slug. Admin gets a "Redirects" page: 404 log (sorted by hits, create-redirect dialog with product autocomplete) + redirects list.

**Spec deviation (verified in code):** the admin single-product update (`updateSuggestion`) never rewrites `slug` — single renames don't orphan URLs, so the spec's per-edit redirect checkbox has nothing to attach to. Auto-redirects apply to the BULK path only; the manual creator covers every other case. Blog slug edits likewise stay on the manual path (the editor already warns).

**Verified facts (recon 2026-08-30):**
- Bulk path: `master-products-bulk.service.ts` — `existingProducts` fetched with `select: { sku, id }` (~line 174; will add `slug`); new slugs computed per-row via `generateUniqueSlug(name, sku)` into `productData.slug`; `bulkUpdateMasterProducts(toUpdate)` writes them; `propagateToSellerListings` separately rewrites LISTING slugs (listing pages aren't canonical URLs — only `/products/<master-slug>` needs redirects).
- Public suggestions autocomplete (`type=master`) returns `{ id, sku, productName, slug, … }` — enough for the admin picker to build `/products/<slug>`.
- Learned-rule guards: admin literal routes (`404s`) MUST precede `:id` routes; `$queryRaw` template literals must avoid `\`-escapes; migration SQL style as in `20260829200000_add_site_settings`.
- Buyer has NO middleware.ts and NO root not-found.tsx (both new). `headers()` works in not-found.tsx when middleware stamps `x-pathname`. `NextFetchEvent.waitUntil` is available for fire-and-forget hit pings.
- Repos/branches: api `feat/redirects-api`, web `feat/redirects-web` — same push/PR mechanics as Parts 1–2 (network via PowerShell; one-at-a-time merges, API first).

---

## API TRAIN (branch `feat/redirects-api`)

### Task 1: Models + migration

Append to `prisma/schema.prisma`:

```prisma
enum RedirectSource {
  MANUAL
  PRODUCT_RENAME
}

/// 301 redirects served by the storefront middleware. fromPath is normalized
/// (leading slash, no trailing slash, lowercase, no query) and unique.
model UrlRedirect {
  id         String         @id @default(uuid())
  fromPath   String         @unique
  toPath     String
  statusCode Int            @default(301)
  source     RedirectSource @default(MANUAL)
  hits       Int            @default(0)
  lastHitAt  DateTime?
  createdAt  DateTime       @default(now())
  updatedAt  DateTime       @updatedAt

  @@map("url_redirects")
}

/// Distinct 404 paths seen by the storefront, with hit counts. Scanner noise
/// is filtered before it ever reaches this table.
model NotFoundHit {
  id           String   @id @default(uuid())
  path         String   @unique
  hits         Int      @default(1)
  firstSeenAt  DateTime @default(now())
  lastSeenAt   DateTime @default(now())
  lastReferrer String?
  resolved     Boolean  @default(false)

  @@index([resolved, hits])
  @@map("not_found_hits")
}
```

Migration `prisma/migrations/20260830020000_add_redirects/migration.sql` (repo SQL style: CreateEnum, CreateTable with quoted camelCase, unique indexes). `npx prisma generate`, commit.

### Task 2: Path utility (TDD)

`src/modules/redirects/redirect-path.util.ts` + spec. Contract:
- `normalizePath(raw)`: returns normalized path or `null` when unusable. Lowercase; strip query/hash; ensure leading `/`; collapse `//+`; strip trailing `/` (except root, which returns `null` — never redirect or log the homepage); reject length > 500 or non-path input.
- `isNoisePath(path)`: true for scanner probes — `/\.(php|asp|aspx|env|sql|bak|git)($|\?)/`, `wp-`, `phpmyadmin`, `xmlrpc`, `/cgi-bin`, `.well-known/…` EXCEPT keep `/.well-known` logging? No — drop all dotfile paths.
Spec cases: query stripped, trailing slash, double slash, root → null, >500 → null, `/products/Old-Slug` lowercased, each noise pattern true, `/products/real-slug` false.

### Task 3: Service (TDD) + controllers + module

`redirects.service.ts` (mock-prisma specs first):
- `getMap()`: all redirects `{ from, to, status }`, `orderBy createdAt desc`, `take 5000`; log a warning when count ≥ 4000.
- `track404({ path, referrer })`: normalize (null → ignore), noise → ignore, covered by an existing redirect → ignore; else upsert by path: increment hits, set lastSeenAt/lastReferrer (create with hits 1). Cap referrer at 300 chars.
- `recordHit(from)`: normalize; `updateMany({ where: { fromPath } , data: { hits: { increment: 1 }, lastHitAt: now } })` — silent no-op when unknown.
- `create({ from, to, source })`: normalize from (reject null); `to` = internal path (normalized, but PRESERVE case for internal? Product slugs are lowercase; normalize internal targets too) or absolute http(s) URL (kept verbatim); reject `from === to`; **chain-collapse forward**: if `to` (internal) equals another redirect's `fromPath`, store that row's `toPath` instead (single hop — the map is exact-match, chains would 404… actually chains would work via a second request round-trip, but collapapse anyway for one-hop latency); **repoint backward**: existing rows whose `toPath === from` get `toPath = to` (keeps A→B, B→C flat as A→C); upsert on fromPath (rename twice = latest wins); mark matching `NotFoundHit` resolved.
- `update(id, { to })`, `remove(id)`, `list()` (hits desc), `list404s({ unresolvedOnly })` (hits desc, take 500), `dismiss404(id)`.
- `createFromRename(pairs: {oldSlug, newSlug}[])`: batch helper for the bulk hook — builds `/products/<old>` → `/products/<new>`, skips old===new, delegates to create() semantics but tolerant (a single bad pair must not fail the upload; collect count).

Controllers (one file):
- Public `@Controller('redirects')`: `@SkipThrottle() @Get('map')` with `Cache-Control: public, s-maxage=60` (the storefront box polls it; must never be throttled into an empty map); `@Post('track-404')` body `{path, referrer?}` → 204-style `{message}`; `@Post('hit')` body `{from}`. Both POSTs stay throttled (public writes).
- Admin `@Controller('admin/redirects')` ADMIN: **`GET 404s` + `DELETE 404s/:id` DECLARED FIRST**, then `GET /`, `POST /`, `PUT :id`, `DELETE :id`.
- DTOs: `CreateRedirectDto { from: string; to: string }` (IsString, MaxLength 500/1000), `Track404Dto { path: string; referrer?: string }`.
- `redirects.module.ts` exports `RedirectsService`; register in `app.module.ts`; `ProductsModule` imports `RedirectsModule` for the bulk hook.

### Task 4: Bulk-rename hook (TDD)

In `master-products-bulk.service.ts`:
- Extend the `existingProducts` select with `slug` and build `oldSlugBySku = Map(sku → slug)`.
- After `bulkUpdateMasterProducts(toUpdate)` succeeds: `const renamePairs = toUpdate.filter(p => oldSlugBySku.get(p.sku) && oldSlugBySku.get(p.sku) !== p.slug).map(p => ({ oldSlug: oldSlugBySku.get(p.sku)!, newSlug: p.slug }))`; `redirectsCreated = await this.redirectsService.createFromRename(renamePairs)` (inject service); add `redirectsCreated` to the returned summary object (find its shape and extend).
- Spec: mock service; slug change → pair passed; unchanged slug → no pair; createFromRename failure → upload still succeeds with redirectsCreated 0 (tolerant).

### Task 5: suite + build + push + PR (body: what/why, safety = additive tables + endpoints + a summary field, the bulk hook only ADDS redirect rows, merge order API first).

---

## WEB TRAIN (branch `feat/redirects-web`)

### Task 6: Buyer middleware

`apps/buyer/src/middleware.ts` (new):

```ts
import { NextResponse } from 'next/server';
import type { NextFetchEvent, NextRequest } from 'next/server';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.pharmabag.in/api').replace(/\/+$/, '');

let map: Map<string, { to: string; status: number }> | null = null;
let fetchedAt = 0;
const TTL_MS = 60_000;

async function refreshMap(): Promise<void> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 2_000);
    const res = await fetch(`${API_BASE}/redirects/map`, { signal: controller.signal, headers: { accept: 'application/json' } });
    clearTimeout(t);
    if (!res.ok) return; // keep stale map
    const body = await res.json();
    const rows: { from: string; to: string; status?: number }[] = body?.data ?? [];
    if (Array.isArray(rows)) {
      map = new Map(rows.map((r) => [r.from, { to: r.to, status: r.status ?? 301 }]));
    }
  } catch { /* keep stale map — redirects are enhancement, never a blocker */ }
  finally { fetchedAt = Date.now(); }
}

function normalize(pathname: string): string {
  let p = pathname.toLowerCase();
  if (p.length > 1 && p.endsWith('/')) p = p.replace(/\/+$/, '');
  return p;
}

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  // Always: expose the requested path to the not-found page for 404 logging.
  const headers = new Headers(request.headers);
  headers.set('x-pathname', request.nextUrl.pathname);

  if (Date.now() - fetchedAt > TTL_MS) {
    // First request after expiry pays the (2s-capped) refresh; everyone else
    // rides the cached map. No map yet + fetch fails → pass through untouched.
    await refreshMap();
  }

  const hit = map?.get(normalize(request.nextUrl.pathname));
  if (hit) {
    const target = hit.to.startsWith('http') ? hit.to : new URL(hit.to, request.url);
    event.waitUntil(
      fetch(`${API_BASE}/redirects/hit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ from: normalize(request.nextUrl.pathname) }),
      }).catch(() => {}),
    );
    return NextResponse.redirect(target, hit.status);
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Skip assets and API proxying; everything page-like flows through.
  matcher: ['/((?!_next/|api/|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|avif|svg|ico|css|js|txt|xml|json|map)$).*)'],
};
```

CAUTION: verify `sitemap.xml`/`robots.txt` are NOT excluded by the extension filter in a way that breaks them — they end in .xml/.txt and are excluded from middleware, which is fine (no redirects wanted there) but confirm they still serve (they're route handlers, middleware exclusion just bypasses the map — harmless).

### Task 7: Buyer root not-found + 404 logging

`apps/buyer/src/app/not-found.tsx` (new, server component): reads `headers()` for `x-pathname` + `referer`; fire-and-forget logs to `${API_BASE}/redirects/track-404` (1.5s abort, full try/catch — logging must NEVER affect rendering; skip when no x-pathname); renders a branded 404 (Navbar-free simple layout matching facet 404s: headline "Page not found", copy, links to `/products` and `/`). Metadata: `noIndexMetadata('Page not found')`.

### Task 8: Admin — api client, hooks, Redirects page, nav

- `apps/admin/api/redirects.api.ts`: `getRedirects()`, `createRedirect({from,to})`, `updateRedirect(id,{to})`, `deleteRedirect(id)`, `get404s(unresolvedOnly)`, `dismiss404(id)` — all under `/admin/redirects*`; types `UrlRedirect`, `NotFoundEntry`.
- `hooks/useRedirects.ts`: queries + invalidating mutations, keys `["admin","redirects",…]`.
- `app/redirects/page.tsx`: value-based `Tabs` — **404 Log** (unresolved default, toggle-all; table path/hits/last seen/came-from; row: Create redirect, Dismiss) and **Redirects** (from→to/hits/source badge/created; edit target inline via Modal, delete w/ confirm; "New redirect" button).
- Create dialog (`Modal`): `from` (prefilled from 404 row, editable in new-mode), target = EITHER product search (input → debounced `GET /products/suggestions?search=&type=master` via apiClient — public endpoint, returns `{productName, slug}`; picking sets `to=/products/<slug>`) OR free path/URL input; preview line "from → to"; save → createRedirect → toasts + invalidate.
- Sidebar: `ArrowRightLeft` icon, "Redirects", after SEO Settings.

### Task 9: tsc both apps + full builds (jest-worker guard per next version; retry once) + push + PR (body: what/why, middleware safety — pass-through on ANY failure, 2s cap, assets excluded; 404 logging fire-and-forget; merge order api first; post-deploy verify listed below).

### Post-merge live verification
1. `GET /api/redirects/map` → 200 `[]`-shaped.
2. Hit `https://pharmabag.in/definitely-not-a-page-xyz` → 404; within a minute `GET /admin/…/404s` shows it (or verify via psql-over-SSH if no admin token; acceptable: check again after Arko's first panel visit).
3. Create a manual redirect via API/panel (`/old-test-path` → `/products`); within 60s `curl -I https://pharmabag.in/old-test-path` → 301 Location /products; delete it after.
4. Chunk-grep admin `/redirects` page markers.
5. Bulk-hook verification deferred to the next real client CSV upload (`redirectsCreated` in the summary) — spec-tested only, no staging exists.
