/**
 * Generates a URL-friendly slug from a product name and ID
 */
export function generateProductSlug(name: string, id: string): string {
  if (!name) return id;
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
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
