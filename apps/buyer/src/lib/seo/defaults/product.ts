import type { CatalogProduct } from '../catalog';
import {
  bestListing,
  inr,
  productDescription,
  productFaqs,
  productSummary,
  productTitle,
} from '../content';
import { dosageForm } from '../content';
import type { PageDefaults } from './types';

/**
 * Generated content for `/products/<slug>`.
 *
 * Unlike the facet families, the product page's copy already lived in
 * `lib/seo/content.ts` as reusable functions — nothing needed moving. This
 * module exists to present them in the same `PageDefaults` shape the admin
 * editor consumes, so a product prefills exactly like a category does.
 *
 * `h1` is reported for the editor's benefit but the product page does NOT
 * render it: the visible H1 lives inside the client component's product
 * header, which is not part of the crawlable server block. Overriding it here
 * would silently do nothing, so the editor hides that field for products.
 */
export function productDefaults(product: CatalogProduct): PageDefaults {
  return {
    title: productTitle(product),
    description: productDescription(product),
    keywords: [
      product.name,
      `${product.name} wholesale price`,
      `${product.name} bulk`,
      product.chemicalComposition ?? '',
      product.manufacturer ?? '',
      dosageForm(product) ?? '',
      'wholesale medicine supplier India',
    ].filter(Boolean),
    h1: product.name,
    intro: productSummary(product),
    faqs: productFaqs(product),
  };
}

/**
 * Values an admin-written product string may interpolate.
 *
 * Product copy quotes live commercial figures — the net rate and the minimum
 * order quantity both come from whichever seller listing currently wins. A
 * hand-written FAQ answer with the number typed in would be wrong the next
 * time a supplier changed a rate, and nobody would go back through 26,815
 * products to fix it.
 */
export function productTokens(product: CatalogProduct): Record<string, string> {
  const listing = bestListing(product);
  const tokens: Record<string, string> = { name: product.name };

  if (listing?.price) tokens.price = inr(listing.price);
  if (listing?.mrp) tokens.mrp = inr(listing.mrp);
  if (listing?.moq) tokens.moq = String(listing.moq);
  if (product.manufacturer?.trim()) tokens.manufacturer = product.manufacturer.trim();
  if (product.chemicalComposition?.trim()) {
    tokens.composition = product.chemicalComposition.trim();
  }

  return tokens;
}
