# Seller Bulk CSV Upload — Design Spec

**Date:** 2026-06-28  
**Status:** Approved  
**Scope:** PharmaBag seller portal + NestJS API

---

## Problem

Sellers currently add products one at a time via a form. There is no way to list multiple products at once. The admin has a CSV bulk upload for the master catalog, but sellers have nothing equivalent.

---

## Solution

A dedicated bulk upload page in the seller portal. Seller downloads a template CSV pre-filled with all master catalog product names, fills in Stock and Price, uploads it back. Each row is matched by product name against the master catalog — matched rows are created as seller listings, unmatched rows are skipped and reported.

---

## Matching Rule

- Match is **name-only**: exact match, case-insensitive, whitespace-trimmed.
- No fuzzy matching. If the name doesn't exist verbatim in `MasterProduct`, the row is skipped.
- Skipped rows are reported back to the seller (row number + name they typed).

---

## CSV Format

```
Product Name,Stock,Price
Dolo 650,100,28.00
Calpol 500mg,50,42.00
```

- `Product Name` — must match a MasterProduct name exactly (case-insensitive, trimmed)
- `Stock` — integer, required; blank → row skipped with reason "missing stock or price"
- `Price` — seller's selling price (float), required; blank → row skipped with reason "missing stock or price"
- All other product fields (MRP, GST%, category, subcategory, composition, description) are pulled from the matched MasterProduct

---

## Architecture

### Backend — `pharmabag-api-fix`

**New files:**
- `src/modules/products/seller-bulk-csv.controller.ts`
- `src/modules/products/services/seller-bulk-csv.service.ts`

**Wired into:** `src/modules/products/products.module.ts`

**Endpoints (both require JWT + SELLER role):**

#### `GET /products/bulk-csv/template`
- Queries all active, non-deleted `MasterProduct` records (name only)
- Streams a CSV response with headers `Product Name,Stock,Price`
- Each row: `<masterProduct.name>,,` (Stock and Price left blank)
- Response headers: `Content-Type: text/csv`, `Content-Disposition: attachment; filename=pharmabag-product-template.csv`

#### `POST /products/bulk-csv/upload`
- Accepts `multipart/form-data` with a single `file` field (CSV)
- Parses CSV row by row using a lightweight parser (csv-parse or papaparse — whichever is already in the project; fall back to manual split on comma+newline if neither present)
- For each data row:
  1. Trim name, parse stock (int), parse price (float)
  2. If name blank or stock/price missing → skip with reason "missing stock or price"
  3. Lookup: `prisma.masterProduct.findFirst({ where: { name: { equals: name, mode: 'insensitive' }, isActive: true, deletedAt: null } })`
  4. If no match → skip with reason "product not in catalog"
  5. If seller already has a non-deleted listing for this masterProductId (any approval status) → skip with reason "already listed"
  6. If match → call existing `productsService.create(userId, payload)` with fields from master + seller-supplied stock/price
- Returns:
```json
{
  "successCount": 45,
  "skippedCount": 5,
  "skipped": [
    { "row": 3, "name": "Dolo 65", "reason": "product not in catalog" },
    { "row": 7, "name": "Calpol 500mg", "reason": "already listed" }
  ]
}
```

### Frontend — `pharmabag-web/apps/seller`

**New files:**
- `app/products/bulk-upload/page.tsx` — the bulk upload page
- `hooks/useSellerBulkUpload.ts` — two mutations

**Modified files:**
- `api/seller.api.ts` — two new API functions
- `app/products/page.tsx` — add "Bulk Upload" button in the header

#### `api/seller.api.ts` additions

```ts
export async function downloadBulkTemplate(): Promise<Blob>
export async function uploadBulkCsv(file: File): Promise<BulkUploadResult>
```

`downloadBulkTemplate` fetches `GET /products/bulk-csv/template` as a blob, then triggers a browser download via a temporary `<a>` element.

#### `hooks/useSellerBulkUpload.ts`

```ts
export function useDownloadTemplate()   // useMutation wrapping downloadBulkTemplate
export function useUploadBulkCsv()      // useMutation wrapping uploadBulkCsv, invalidates ["seller","products"] on success
```

#### `app/products/bulk-upload/page.tsx`

Layout (top to bottom):
1. Page header: "Bulk Upload Products" + back link to `/products`
2. **Step 1 — Download Template** card: explains the format, "Download Template" button
3. **Step 2 — Upload CSV** card: drag-and-drop file picker (CSV only), selected filename shown, "Upload" button
4. **Results panel** (shown after upload):
   - Green card: "X products uploaded successfully"
   - Orange card: "Y rows skipped" (only shown if skippedCount > 0)
   - Skipped rows table: columns Row #, Product Name, Reason — rendered if skipped array is non-empty
   - "Upload Another" button resets state

#### `app/products/page.tsx` change

Add a "Bulk Upload" button in the header `div` (left of the existing "Add Product" button):
```tsx
<Link href="/products/bulk-upload">
  <Button variant="secondary" leftIcon={<Upload className="h-4 w-4"/>}>Bulk Upload</Button>
</Link>
```

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Non-CSV file selected | Client rejects before upload; toast "Please select a CSV file" |
| File is empty / no data rows | API returns 400; toast shows error |
| Name column blank on a row | Row skipped, reason: "missing stock or price" |
| Stock or Price blank/non-numeric | Row skipped, reason: "missing stock or price" |
| Name not in master catalog | Row skipped, reason: "product not in catalog" |
| Seller already lists this product | Row skipped, reason: "already listed" |
| Network/server failure | Toast error; results panel not shown |

---

## Out of Scope

- Updating existing seller listings via CSV (update flow is a separate feature)
- Deleting listings via CSV
- Fuzzy/partial name matching
- Admin bulk CSV (already exists at `/master-products/bulk/*`)
- Image upload via CSV

---

## Files to Create / Modify

| File | Action |
|---|---|
| `pharmabag-api-fix/src/modules/products/seller-bulk-csv.controller.ts` | Create |
| `pharmabag-api-fix/src/modules/products/services/seller-bulk-csv.service.ts` | Create |
| `pharmabag-api-fix/src/modules/products/products.module.ts` | Modify — wire new controller + service |
| `pharmabag-web/apps/seller/app/products/bulk-upload/page.tsx` | Create |
| `pharmabag-web/apps/seller/hooks/useSellerBulkUpload.ts` | Create |
| `pharmabag-web/apps/seller/api/seller.api.ts` | Modify — add 2 API functions |
| `pharmabag-web/apps/seller/app/products/page.tsx` | Modify — add Bulk Upload button |
