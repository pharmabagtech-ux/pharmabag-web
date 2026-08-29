import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';
import JsonLd from '@/components/seo/JsonLd';
import {
  SeoSection,
  SpecTable,
  FaqList,
  LinkGrid,
  type SeoLink,
} from '@/components/seo/SeoContent';
import { fetchProduct, fetchProducts } from '@/lib/seo/catalog';
import { buildMetadata } from '@/lib/seo/metadata';
import { routes, absoluteUrl, facetSlug } from '@/lib/seo/url';
import {
  graph,
  productSchema,
  drugSchema,
  breadcrumbSchema,
  faqSchema,
  webPageSchema,
} from '@/lib/seo/schema';
import {
  productTitle,
  productDescription,
  productSummary,
  productSpecs,
  productFaqs,
  bestListing,
  dosageForm,
  isPrescriptionOnly,
} from '@/lib/seo/content';
import { MOLECULES } from '@/lib/seo/data/molecules';

/**
 * Product page — server shell.
 *
 * This route was `'use client'`, which meant it could not export
 * `generateMetadata`. The consequence was severe and site-wide: all 26,815
 * product pages returned the same `<title>`, the same meta description, no
 * canonical, no H1, no OpenGraph and no structured data. To Google they were
 * mutual duplicates; to Bing and every AI crawler they were an empty shell,
 * because none of them execute the JavaScript that draws the real page.
 *
 * The interactive UI is untouched — it now lives in `ProductDetailClient` and
 * is rendered below. What is new is everything a machine reads.
 */

/** Product data changes with seller edits; hourly regeneration is ample. */
export const revalidate = 3600;

/**
 * Renders unknown slugs on demand rather than 404ing them, so the long tail of
 * the catalogue is served without pre-building 26,815 pages at deploy time.
 */
export const dynamicParams = true;

interface PageProps {
  params: { productSlug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await fetchProduct(params.productSlug);

  if (!product) {
    /**
     * The API confirmed this slug does not exist (`fetchProduct` throws on
     * blips, so a null here is a real 404). The page function below returns
     * the actual 404 status; this metadata only dresses the not-found page.
     */
    return buildMetadata({
      title: 'Product not found',
      description:
        'This product is no longer listed. Browse the full wholesale medicine catalogue instead.',
      path: routes.product(params.productSlug),
      index: false,
    });
  }

  const canonicalSlug = product.slug?.trim() || params.productSlug;
  const listing = bestListing(product);

  const keywords = [
    product.name,
    `${product.name} wholesale price`,
    `${product.name} bulk`,
    product.chemicalComposition ?? '',
    product.manufacturer ?? '',
    dosageForm(product) ?? '',
    'wholesale medicine supplier India',
  ].filter(Boolean);

  return buildMetadata({
    title: productTitle(product),
    description: productDescription(product),
    /**
     * Canonical always uses the slug the API stored, never the requested one.
     * Old punctuation-style links and SKU-suffixed variants both resolve to
     * this page, and without this they would each register as a separate URL
     * competing for the same content.
     */
    path: routes.product(canonicalSlug),
    image: product.images?.[0] ?? listing?.images?.[0] ?? null,
    keywords,
  });
}

export default async function ProductPage({ params }: PageProps) {
  const product = await fetchProduct(params.productSlug);

  /**
   * A null product is now a CONFIRMED "does not exist" — `fetchProduct`
   * throws `CatalogUnavailableError` on transient API failures instead of
   * returning null, so a blip renders the error page (a 500 Google retries),
   * never a 404 it would drop. The previous fall-through to the client shell
   * served unknown slugs as HTTP 200 "Product not found" — a soft-404 that
   * wasted crawl budget across every dead link ever shared.
   */
  if (!product) notFound();

  const canonicalSlug = product.slug?.trim() || params.productSlug;
  const url = absoluteUrl(routes.product(canonicalSlug));
  const listing = bestListing(product);
  const form = dosageForm(product);
  const specs = productSpecs(product);
  const faqs = productFaqs(product);
  const summary = productSummary(product);

  const crumbs = [
    { name: 'Home', path: routes.home() },
    { name: 'Medicines', path: routes.products() },
    ...(product.category
      ? [{ name: product.category.name, path: routes.category(product.category.slug) }]
      : []),
    ...(product.category && product.subCategory
      ? [
          {
            name: product.subCategory.name,
            path: routes.dosageForm(product.category.slug, product.subCategory.slug),
          },
        ]
      : []),
    { name: product.name, path: routes.product(canonicalSlug) },
  ];

  /**
   * Related products, fetched by salt composition so the rail is genuinely
   * therapeutic alternatives rather than alphabetical neighbours. This is the
   * "alternatives" surface buyers ask for, and it gives crawlers a dense,
   * relevant link cluster around each molecule.
   */
  const relatedQuery = product.chemicalComposition?.split(/[+,/]/)[0]?.trim();
  const related = relatedQuery
    ? (await fetchProducts({ search: relatedQuery, limit: 12 })).products.filter(
        (r) => r.id !== product.id && r.slug,
      )
    : [];

  const brandSiblings = product.manufacturer
    ? (
        await fetchProducts({ manufacturer: product.manufacturer, limit: 12 })
      ).products.filter((r) => r.id !== product.id && r.slug)
    : [];

  /** Molecule pages that mention this product's composition, for cross-linking. */
  const moleculeLinks: SeoLink[] = (product.chemicalComposition ?? '')
    .split(/[+,/]/)
    .map((token) => token.trim().split(/\s+/)[0])
    .filter(Boolean)
    .map((token) =>
      MOLECULES.find(
        (m) =>
          m.slug === facetSlug(token) ||
          m.name.toLowerCase().startsWith(token.toLowerCase()),
      ),
    )
    .filter((m): m is NonNullable<typeof m> => Boolean(m))
    .filter((m, i, arr) => arr.findIndex((x) => x.slug === m.slug) === i)
    .slice(0, 4)
    .map((m) => ({
      label: `${m.name} medicines`,
      href: routes.generic(m.slug),
    }));

  const jsonLd = graph(
    webPageSchema({
      name: productTitle(product),
      url,
      description: productDescription(product),
    }),
    breadcrumbSchema(crumbs),
    productSchema({
      name: product.name,
      url,
      description: summary,
      sku: product.sku ?? null,
      image: product.images?.[0] ?? listing?.images?.[0] ?? null,
      brand: product.manufacturer ?? null,
      category: product.category?.name ?? null,
      activeIngredient: product.chemicalComposition ?? null,
      dosageForm: form,
      price: listing?.price ?? null,
      mrp: listing?.mrp ?? null,
      inStock: (listing?.stock ?? 0) > 0,
      sellerCount: product.listings?.length ?? 0,
      minOrderQuantity: listing?.moq ?? null,
    }),
    /**
     * `Drug` alongside `Product`: they win different surfaces. Product ranks
     * shopping and price queries; Drug is what medical answer engines look for
     * on "what is X / what does X contain" questions.
     */
    drugSchema({
      name: product.name,
      url,
      description: summary,
      activeIngredient: product.chemicalComposition ?? null,
      manufacturer: product.manufacturer ?? null,
      dosageForm: form,
      prescriptionOnly: isPrescriptionOnly(product),
    }),
    faqSchema(faqs),
  );

  return (
    <>
      <JsonLd json={jsonLd} />

      {/*
        The page's one and only <h1>, rendered on the server.

        It is visually hidden because the interactive component already shows
        the product name prominently once its data resolves — but that heading
        is client-rendered, so before this existed the server HTML contained no
        h1 at all. Screen readers and crawlers both get a correct document
        heading; sighted users see no change.
      */}
      <h1 className="sr-only">
        {product.name}
        {product.manufacturer ? ` by ${product.manufacturer}` : ''} — wholesale
        price and bulk supply
      </h1>

      {/* The full interactive experience, unchanged. */}
      <ProductDetailClient params={params} />

      {/*
        Crawlable content, server-rendered below the interactive UI.
        Everything here is derived from catalogue data — see lib/seo/content.ts
        for the no-fabrication rule these sections follow.
      */}
      <div className="w-full bg-white/70 pb-12 pt-4 backdrop-blur-sm">
        <SeoSection id="about" title={`About ${product.name}`}>
          {/*
            The page's H1 lives in the client component's visual header. This
            block leads with an H2 so the document keeps a single H1 and a
            clean heading hierarchy.
          */}
          <p className="text-base leading-relaxed text-slate-700">{summary}</p>

          {product.description?.trim() ? (
            <p className="mt-3 text-base leading-relaxed text-slate-700">
              {product.description.trim()}
            </p>
          ) : null}

          {product.directionsForUse?.trim() ? (
            <div className="mt-4">
              <h3 className="mb-1 text-base font-semibold text-slate-900">
                Directions for use
              </h3>
              <p className="text-sm leading-relaxed text-slate-700">
                {product.directionsForUse.trim()}
              </p>
            </div>
          ) : null}

          {product.safetyAdvice?.trim() ? (
            <div className="mt-4">
              <h3 className="mb-1 text-base font-semibold text-slate-900">
                Safety advice
              </h3>
              <p className="text-sm leading-relaxed text-slate-700">
                {product.safetyAdvice.trim()}
              </p>
            </div>
          ) : null}
        </SeoSection>

        <SeoSection id="specifications" title={`${product.name} specifications`}>
          <SpecTable rows={specs} />
          {/*
            A visible, honest disclaimer. This is an EEAT signal as much as a
            compliance one: pages that state their limits are treated as more
            trustworthy by both reviewers and models.
          */}
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Prices are wholesale rates offered by verified suppliers and exclude
            GST unless stated. Product information is provided for trade
            reference only and is not medical advice. Always verify the pack,
            batch and prescribing information before dispensing.
          </p>
        </SeoSection>

        {faqs.length > 0 ? (
          <SeoSection
            id="faq"
            title={`Frequently asked questions about ${product.name}`}
          >
            <FaqList faqs={faqs} />
          </SeoSection>
        ) : null}

        {related.length > 0 ? (
          <SeoSection
            id="alternatives"
            title={`Alternatives to ${product.name}`}
          >
            <p className="mb-3 text-sm text-slate-600">
              Other wholesale medicines with a comparable salt composition
              {relatedQuery ? ` (${relatedQuery})` : ''}.
            </p>
            <LinkGrid
              links={related.slice(0, 12).map((r) => ({
                label: r.name,
                href: routes.product(r.slug as string),
                meta: r.manufacturer ?? undefined,
              }))}
            />
          </SeoSection>
        ) : null}

        {brandSiblings.length > 0 && product.manufacturer ? (
          <SeoSection
            id="same-brand"
            title={`More from ${product.manufacturer}`}
          >
            <LinkGrid
              links={brandSiblings.slice(0, 12).map((r) => ({
                label: r.name,
                href: routes.product(r.slug as string),
              }))}
            />
            <p className="mt-3 text-sm">
              <Link
                href={routes.brand(facetSlug(product.manufacturer))}
                className="font-semibold text-teal-700 underline-offset-2 hover:underline"
              >
                View all {product.manufacturer} products →
              </Link>
            </p>
          </SeoSection>
        ) : null}

        {moleculeLinks.length > 0 ? (
          <SeoSection id="molecules" title="Browse by generic molecule">
            <LinkGrid links={moleculeLinks} columns={4} />
          </SeoSection>
        ) : null}
      </div>
    </>
  );
}
