/**
 * Product URL slugs.
 *
 * These have to agree with the slug the API stored, or the product page 404s.
 * The API deletes punctuation when it builds a slug, so "Budecort 0.5mg
 * Respule" is stored as "budecort-05mg-respule-pb24820". This file used to turn
 * every run of non-alphanumerics into a hyphen instead, asking for
 * "budecort-0-5mg-respule" — a slug no row could ever hold. Decimal strengths
 * and combination ratios ("2.5mg", "50/1000mg") name about 12% of the
 * catalogue, so roughly 3,200 products could not be opened at all.
 */

/**
 * Slugifies exactly the way the API does.
 *
 * Keep in step with `slugify` in pharmabag-api
 * (src/modules/products/services/master-products-bulk.service.ts). The two
 * halves must agree on what a slug is, and they have already drifted once.
 */
function slugifyLikeApi(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')      // spaces become hyphens
    .replace(/[^\w\-]+/g, '')  // everything else is DELETED, not hyphenated
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Generates a URL-friendly slug from a product name and ID
 *
 * Prefer `productSlug()` when the product object is to hand — it uses the slug
 * the API actually stored, which needs no guessing at all.
 */
export function generateProductSlug(name: string, id: string): string {
  if (!name) return id;
  return slugifyLikeApi(name) || id;
}

/**
 * The slug to put in a product's URL.
 *
 * Uses the one the API stored whenever the payload carries it: that is the
 * exact value `findOne` matches on, so the lookup hits directly instead of
 * leaning on the SKU-suffix fallback, and no rule has to be mirrored to get it
 * right. Falls back to deriving one for the payloads that carry no slug.
 */
export function productSlug(
  product:
    | { slug?: string | null; name?: string | null; id?: string | null }
    | null
    | undefined,
): string {
  const stored = product?.slug;
  if (typeof stored === 'string' && stored.trim()) return stored.trim();
  return generateProductSlug(product?.name ?? '', product?.id ?? '');
}

/**
 * Extracts the product ID from a slug
 * Assumes the ID is the part after the last hyphen and follows UUID or similar ID format
 */
export function parseProductIdFromSlug(slug: string): string {
  if (!slug) return '';
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(slug)) return slug;

  const parts = slug.split('-');
  
  if (parts.length >= 5) {
    const potentialId = parts.slice(-5).join('-');
    if (uuidRegex.test(potentialId)) {
      return potentialId;
    }
  }
  
  // If no UUID is found at the end, return the full slug for backend lookup
  return slug;
}
