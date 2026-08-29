import ProductsPageClient from './ProductsPageClient';

/**
 * Catalogue listing — server shell.
 *
 * The listing UI is a client component (search params, filters, react-query),
 * which meant the server HTML for /products contained NO h1 at all — the most
 * important listing page on the site had no machine-readable heading. This
 * shell exists to own that heading; everything interactive is unchanged in
 * `ProductsPageClient`.
 *
 * The h1 is visually hidden because the page's design carries its identity
 * through the breadcrumb and the grid itself; crawlers and screen readers get
 * a correct document heading, sighted users see no change.
 */
export default function ProductsPage() {
  return (
    <>
      <h1 className="sr-only">
        Wholesale medicines — bulk price list from verified Indian suppliers
      </h1>
      <ProductsPageClient />
    </>
  );
}
