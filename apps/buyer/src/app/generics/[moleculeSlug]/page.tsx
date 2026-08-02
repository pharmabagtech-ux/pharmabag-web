import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/seo/JsonLd';
import CollectionShell from '@/components/seo/CollectionShell';
import { SeoSection, SpecTable } from '@/components/seo/SeoContent';
import { fetchProducts } from '@/lib/seo/catalog';
import { buildMetadata } from '@/lib/seo/metadata';
import { routes, absoluteUrl, facetSlug } from '@/lib/seo/url';
import {
  graph,
  breadcrumbSchema,
  collectionPageSchema,
  faqSchema,
  prune,
} from '@/lib/seo/schema';
import { SITE_NAME, MIN_ORDER_VALUE_INR } from '@/lib/seo/config';
import { inr, bestListing } from '@/lib/seo/content';
import {
  findMolecule,
  relatedMolecules,
  MOLECULES,
} from '@/lib/seo/data/molecules';

/**
 * Molecule landing page — e.g. /generics/amoxicillin.
 *
 * Answers, on one page: which brands contain this molecule, who makes them,
 * and what each costs at wholesale. That is the exact shape of the question
 * assistants receive, and it is why this page carries a price-range table and
 * a brand table rather than only a product grid.
 *
 * Deliberately contains NO clinical guidance — no indications, dosing or
 * contraindications. The catalogue holds no clinically reviewed copy, and
 * publishing unreviewed medical claims would be both an EEAT liability and a
 * genuine safety problem. Commercial facts only.
 */

const PAGE_SIZE = 48;

/**
 * Dynamic, not pre-built — this page reads `searchParams` for pagination.
 * See the note in `categories/[categorySlug]/page.tsx`: pairing
 * `generateStaticParams` with `searchParams` drops the route from the
 * prerender manifest and makes every molecule URL 404.
 *
 * No page-level `revalidate` export: `dynamic = 'force-dynamic'` below
 * overrides it anyway. Freshness is handled at the fetch layer instead --
 * `lib/seo/catalog.ts` caches catalogue reads for a day, so the API is not
 * re-queried on every crawl.
 */
export const dynamic = 'force-dynamic';

interface PageProps {
  params: { moleculeSlug: string };
  searchParams: { page?: string };
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const molecule = findMolecule(params.moleculeSlug);
  if (!molecule) {
    return buildMetadata({
      title: 'Molecule not found',
      description: 'Browse all generic molecules available at wholesale.',
      path: routes.generic(params.moleculeSlug),
      index: false,
    });
  }

  const page = Math.max(1, Number(searchParams?.page) || 1);
  const { total } = await fetchProducts({
    search: molecule.name,
    page: 1,
    limit: 1,
  });
  const path = routes.generic(molecule.slug);

  return buildMetadata({
    title: `${molecule.name} Medicines — Brands & Wholesale Price${page > 1 ? ` — Page ${page}` : ''}`,
    description: `${total.toLocaleString('en-IN')} ${molecule.name} medicines available at wholesale on ${SITE_NAME}. Compare brands, manufacturers, net rates and minimum order quantities for bulk purchase across India.`,
    path: page > 1 ? `${path}?page=${page}` : path,
    keywords: [
      `${molecule.name} medicines`,
      `${molecule.name} brands India`,
      `${molecule.name} wholesale price`,
      `${molecule.name} generic supplier`,
      `${molecule.therapeuticClass} wholesale`,
    ],
  });
}

export default async function MoleculePage({ params, searchParams }: PageProps) {
  const molecule = findMolecule(params.moleculeSlug);
  if (!molecule) notFound();

  const page = Math.max(1, Number(searchParams?.page) || 1);
  const { products, total, totalPages } = await fetchProducts({
    search: molecule.name,
    page,
    limit: PAGE_SIZE,
  });

  if (total === 0) notFound();

  const path = routes.generic(molecule.slug);
  const url = absoluteUrl(path);

  const crumbs = [
    { name: 'Home', path: routes.home() },
    { name: 'Generic Molecules', path: routes.generics() },
    { name: molecule.name, path },
  ];

  /** Price range across live listings — a concrete, quotable fact. */
  const prices = products
    .map((p) => bestListing(p)?.price ?? p.price ?? null)
    .filter((n): n is number => typeof n === 'number' && n > 0);
  const minPrice = prices.length ? Math.min(...prices) : null;
  const maxPrice = prices.length ? Math.max(...prices) : null;

  /** Brands carrying this molecule, ranked by how many products they list. */
  const brandCounts = new Map<string, number>();
  for (const p of products) {
    const m = p.manufacturer?.trim();
    if (m) brandCounts.set(m, (brandCounts.get(m) ?? 0) + 1);
  }
  const brands = Array.from(brandCounts.entries()).sort((a, b) => b[1] - a[1]);

  const formCounts = new Map<string, number>();
  for (const p of products) {
    const f = p.subCategory?.name;
    if (f) formCounts.set(f, (formCounts.get(f) ?? 0) + 1);
  }
  const forms = Array.from(formCounts.keys());

  const specRows = [
    { label: 'Molecule / Salt', value: molecule.name },
    { label: 'Therapeutic Class', value: molecule.therapeuticClass },
    { label: 'Products Listed', value: `${total.toLocaleString('en-IN')}` },
    ...(brands.length
      ? [{ label: 'Brands Available', value: `${brands.length}+ on this page` }]
      : []),
    ...(forms.length
      ? [{ label: 'Dosage Forms', value: forms.join(', ') }]
      : []),
    ...(minPrice && maxPrice
      ? [
          {
            label: 'Wholesale Rate Range',
            value:
              minPrice === maxPrice
                ? `${inr(minPrice)} per unit (excl. GST)`
                : `${inr(minPrice)} – ${inr(maxPrice)} per unit (excl. GST)`,
          },
        ]
      : []),
    { label: 'Minimum Order Value', value: `${inr(MIN_ORDER_VALUE_INR)} per order line, incl. GST` },
  ];

  const faqs = [
    {
      question: `Which brands contain ${molecule.name}?`,
      answer: `${SITE_NAME} lists ${total.toLocaleString('en-IN')} products containing ${molecule.name}${
        brands.length
          ? `, from manufacturers including ${brands.slice(0, 6).map(([b]) => b).join(', ')}`
          : ''
      }. Each brand is shown with its wholesale net rate so equivalents can be compared directly.`,
    },
    ...(minPrice
      ? [
          {
            question: `What is the wholesale price of ${molecule.name} medicines?`,
            answer: `${molecule.name} products on ${SITE_NAME} currently start from ${inr(minPrice)} per unit exclusive of GST${
              maxPrice && maxPrice !== minPrice
                ? `, ranging up to ${inr(maxPrice)} per unit depending on brand, strength and pack size`
                : ''
            }. Rates are set by verified wholesale suppliers and change with the schemes they offer.`,
          },
        ]
      : []),
    {
      question: `What therapeutic class does ${molecule.name} belong to?`,
      answer: `${molecule.name} is classified under ${molecule.therapeuticClass.toLowerCase()} products in the ${SITE_NAME} catalogue. Classification here is for trade and procurement navigation and is not a substitute for the prescribing information.`,
    },
    {
      question: `Can I buy ${molecule.name} medicines in bulk?`,
      answer: `Yes. ${SITE_NAME} supplies ${molecule.name} products in bulk to retail pharmacies, hospitals, clinics and distributors across India. Buyers verify once with a valid drug licence and GST or PAN details, after which orders are placed online with GST invoicing and pan-India delivery. Each order line must reach ${inr(MIN_ORDER_VALUE_INR)} including GST.`,
    },
  ];

  const jsonLd = graph(
    breadcrumbSchema(crumbs),
    /**
     * A `Drug` node for the molecule itself (not a specific pack), which is
     * what medical answer engines match on for "what is <molecule>" queries.
     * No dosing or indication is asserted — see the file header.
     */
    prune({
      '@type': ['Drug', 'MedicalEntity'],
      '@id': `${url}#molecule`,
      name: molecule.name,
      url,
      activeIngredient: molecule.name,
      drugClass: molecule.therapeuticClass,
      description: `${molecule.name} is a ${molecule.therapeuticClass.toLowerCase()} molecule. ${total.toLocaleString('en-IN')} products containing ${molecule.name} are available for wholesale purchase on ${SITE_NAME}.`,
    }),
    collectionPageSchema({
      name: `${molecule.name} Medicines — Brands and Wholesale Prices`,
      url,
      description: `Products containing ${molecule.name}, available for bulk purchase on ${SITE_NAME}.`,
      totalItems: total,
      items: products.slice(0, 40).map((p) => ({
        name: p.name,
        url: absoluteUrl(routes.product(p.slug ?? '')),
      })),
    }),
    faqSchema(faqs),
  );

  return (
    <>
      <JsonLd json={jsonLd} />
      <CollectionShell
        heading={`${molecule.name} medicines — brands and wholesale prices`}
        intro={`${molecule.name} is a ${molecule.therapeuticClass.toLowerCase()} molecule. ${SITE_NAME} lists ${total.toLocaleString('en-IN')} products containing ${molecule.name} from verified wholesale suppliers across India${
          minPrice ? `, with net rates starting from ${inr(minPrice)} per unit exclusive of GST` : ''
        }. Every listing shows the brand, manufacturer, wholesale rate and minimum order quantity so equivalent brands can be compared directly.`}
        crumbs={crumbs}
        products={products}
        totalProducts={total}
        basePath={path}
        page={page}
        totalPages={totalPages}
        browseHref={`${routes.products()}?search=${encodeURIComponent(molecule.name)}`}
        browseLabel="Open in catalogue"
        faqs={faqs}
        body={
          <>
            <SeoSection id="at-a-glance" title={`${molecule.name} at a glance`}>
              <SpecTable rows={specRows} />
              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                Information on this page is commercial and procurement-related.
                It is not medical advice and does not describe indications,
                dosage or contraindications. Refer to the approved prescribing
                information and consult a qualified medical practitioner.
              </p>
            </SeoSection>

            {brands.length > 0 ? (
              <SeoSection
                id="brands"
                title={`Brands supplying ${molecule.name}`}
              >
                <SpecTable
                  rows={brands.slice(0, 15).map(([name, count]) => ({
                    label: name,
                    value: `${count} product${count === 1 ? '' : 's'} on this page`,
                  }))}
                />
              </SeoSection>
            ) : null}
          </>
        }
        linkSections={[
          {
            title: `Other ${molecule.therapeuticClass.toLowerCase()} molecules`,
            links: relatedMolecules(molecule.slug, 12).map((m) => ({
              label: m.name,
              href: routes.generic(m.slug),
            })),
            columns: 3 as const,
          },
          ...(brands.length
            ? [
                {
                  title: `Manufacturers of ${molecule.name} products`,
                  links: brands.slice(0, 12).map(([name]) => ({
                    label: name,
                    href: routes.brand(facetSlug(name)),
                  })),
                  columns: 3 as const,
                },
              ]
            : []),
        ]}
      />
    </>
  );
}
