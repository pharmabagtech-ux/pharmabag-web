/**
 * Product-image alt text convention.
 *
 * Automatic default everywhere: "<product name> - PharmaBag" — the product
 * name carries the search terms, the brand suffix ties every image back to
 * the marketplace in image search. A per-image override written in the admin
 * panel (master_product_images.altText) wins when present.
 */
export function productImageAlt(
  productName: string | null | undefined,
  altText?: string | null,
): string {
  const override = altText?.trim();
  if (override) return override;
  const name = productName?.trim();
  return name ? `${name} - PharmaBag` : 'PharmaBag product image';
}
