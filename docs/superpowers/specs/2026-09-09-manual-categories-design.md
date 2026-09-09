# Manual categories — design

**Date:** 2026-09-09
**Status:** approved, implemented in api#49 + web (this branch)

## The ask

> "I don't want the category to be automated, make it manual, and a new tab where my current categories and sub-categories are, to create new ones. Nothing else should be affected. In product upload I already have an option to choose, so that part is perfect."

Two things: stop categories appearing on their own, and give the operator a place to make them.

## What was actually true

**The tab already existed.** `apps/admin/app/categories/page.tsx` is a complete manager — categories and sub-categories views, search, create with a parent picker, rename, delete, correct `AdminLayout` chrome. The API behind it is complete too: `POST/GET/PATCH/DELETE /admin/categories` and `/admin/subcategories`, ADMIN-guarded.

It was never linked in the sidebar. `FolderTree` was even already imported there and unused — the same fingerprint as the Analytics entry (web#81) and the Payments queue (web#75), both of which were working pages orphaned from the nav.

**Categories were created implicitly in three places:**

| Path | What it did |
|---|---|
| `master-products-bulk.service.ts` | `category.createMany` / `subCategory.createMany` with `skipDuplicates`, from whatever the CSV said |
| `admin.service.ts` `importSuggestions` | the same, row by row |
| the same importer | auto-created `Uncategorized` / `General` for rows naming no category |

One typo in one cell of a 26,000-row sheet minted a real category — and a category is not a lightweight record here: it gets a landing page, an H1, an FAQ block and a `categories.xml` entry, with nothing gating it.

## Decisions

**Unknown category on upload → skip the row and report it.** Chosen over parking the product under a holding category, and over rejecting the whole file. One bad row must not cost the other 25,999, and nothing should enter the catalogue that nobody created. The uploader already had this exact code path (`invalid category mapping`); it simply never fired, because the category was created a few lines earlier. Reworded to name the fix.

**Guard rename and delete before exposing the screen.** Linking the tab hands a real operator two destructive buttons.

- *Delete* was counting what used the category and then deleting regardless. `MasterProduct.category` has no cascade → Postgres restricts → raw foreign-key error. But `SubCategory.category` **is** `onDelete: Cascade` → an otherwise-empty category silently took its sub-categories with it. Both paths now refuse while anything is attached.
- *Rename* rewrites the slug, so `/categories/<old-slug>` starts 404ing. Renames now register a 301 — and because a category slug is the first segment of every sub-category URL beneath it, a category rename redirects each child page too.

**Counts are reported separately, not summed.** A seller listing points *at* a catalogue product; adding them double-counts the same shelf item and gives the operator a number matching nothing they can see.

**Redirect source is `MANUAL`.** A dedicated `CATEGORY_RENAME` enum value would need a migration, and Postgres cannot `ALTER TYPE ... ADD VALUE` inside the transaction Prisma wraps migrations in. Not worth the deploy risk for a label.

## Shape

**API (api#49)** — no migration, no data change.

- `master-products-bulk.service.ts`: look up categories and sub-categories, never create; actionable skip message.
- `admin.service.ts`: same for `importSuggestions`; `resolveDefaultCategory` / `resolveDefaultSubCategory` deleted.
- `categories.service.ts`: delete guards on both entities; rename registers 301s via `RedirectsService`, tolerant by contract.
- `categories.module.ts`: imports `RedirectsModule`.

**Web (this branch)** — one nav entry using the already-imported icon.

## Explicitly unchanged

The product-upload category picker, every existing category and sub-category, the SEO Page content tab, and the buyer storefront.

## The accepted trade-off

A CSV containing a genuinely new category skips those rows and lists them. Create the category in the tab, re-upload, they import.

## Testing

`categories.guards.spec.ts` (11 cases) and `master-products-bulk.manual-categories.spec.ts` (5 cases). Full API suite 323 passing; the 5 `products.sitemap.spec.ts` failures are pre-existing on `main`.

## Verification limits

The admin screen is OTP-gated, so the click-through — create a category, see it in the product-upload picker, try to delete a populated one — needs the operator. Everything else is verifiable from the API and the deployed bundle.
