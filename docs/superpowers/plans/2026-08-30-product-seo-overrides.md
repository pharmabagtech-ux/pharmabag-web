# Product SEO Overrides Implementation Plan (Admin SEO Suite — Part 4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optional per-product SEO overrides (meta title, meta description, share image) editable on the admin catalogue edit modal; the buyer PDP prefers them over its auto-generated head. Null = today's behaviour for all 26,815 products.

**Verified facts (recon 2026-08-30):**
- Admin catalogue editing = the "Edit Catalog Product" `Modal` in `apps/admin/app/csv-upload/page.tsx` (`openEdit`/`handleSave` → `PATCH /admin/suggestions/:id`, `UpdateSuggestionDto`). The list endpoint returns FULL master rows (`include`, no `select`) so new columns arrive with no list change.
- `updateSuggestion` (admin.service.ts ~1824) spreads with TRUTHINESS (`dto.name && {…}`) — the new fields must use `!== undefined` so an empty string can CLEAR an override (stored as null).
- Buyer PDP head = `apps/buyer/src/app/products/[productSlug]/page.tsx` `generateMetadata` via `productTitle(product)` / `productDescription(product)`; detail payload comes from `formatMasterDetail` (products.service.ts ~1053) which must return the 3 new fields; `CatalogProduct` type in `lib/seo/catalog.ts` gains them.
- Shared `SeoFieldsPanel` (Part 1) takes `showKeywords={false} showCanonical={false}` for products (canonical stays the stored slug, always).
- Migration style/`prisma generate`/branch mechanics identical to Parts 2–3. Branches: api `feat/product-seo-overrides-api`, web `feat/product-seo-overrides-web`.

## API train
1. **Schema**: `MasterProduct` += `metaTitle String?`, `metaDescription String?`, `ogImage String?`; migration `20260830040000_add_master_product_seo_overrides` = three `ALTER TABLE "master_products" ADD COLUMN … TEXT;`. `npx prisma generate`. Commit.
2. **DTO** (`update-suggestion.dto.ts`): three optional `@IsString()` fields, `@MaxLength(200/320/1000)`. Spec: accepts all three, accepts empty payload, rejects >max lengths.
3. **Service**: in `updateSuggestion`'s data object add
   `...(dto.metaTitle !== undefined && { metaTitle: dto.metaTitle.trim() || null }),` (same for the other two). Spec (mock prisma): persists values; empty string clears to null; omitting leaves untouched.
4. **Detail payload**: `formatMasterDetail` returns `metaTitle: m.metaTitle, metaDescription: m.metaDescription, ogImage: m.ogImage`.
5. Full suite + build; push (Coder); PR (safety: 3 nullable columns, additive; DTO/service additive; merge first).

## Web train
1. **Admin modal** (`csv-upload/page.tsx`): form state += the 3 fields (loaded in `openEdit` from the item, blank in `openCreate`); payload sends them ALWAYS when editing (empty string = clear); embed `SeoFieldsPanel` in the modal below Description with `showKeywords={false} showCanonical={false}`, `fallbackTitle` = `` `${form.name} Wholesale Price — ${form.manufacturer}` `` (mirrors the buyer's generated shape), `fallbackDescription` = a trimmed description/name-derived line, `previewUrl` = `pharmabag.in/products/<item.slug>`. Wire the panel's `SeoFieldsValue` (metaKeywords/canonicalUrl unused, keep empty arrays/strings).
2. **Buyer**: `CatalogProduct` += 3 optional fields; PDP `generateMetadata`: `title: product.metaTitle?.trim() || productTitle(product)`, same for description; `image: product.ogImage || product.images?.[0] || listing?.images?.[0] || null`. Nothing else changes — H1/schema/on-page copy stay generated (overrides are head-only by design).
3. tsc + full builds (jest-worker guard per next version); push (Server fork); PR; merge AFTER api deploy.

## Post-merge live verification
Detail endpoint returns the null fields (`metaTitle":null` present in `/api/products/<slug>` payload); PDP head unchanged for an un-overridden product; admin chunk carries the SEO panel in the csv-upload page bundle. Full save-an-override round-trip needs Arko's OTP login (documented limitation) — click-path: Upload CSV File → catalog table → Edit → SEO card → set meta title → Save → PDP head shows it within the hour (PDP revalidate 3600; note to Arko).
