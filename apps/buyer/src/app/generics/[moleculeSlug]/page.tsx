import type { Metadata } from 'next';
import Link from 'next/link';
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
import { CLASS_GUIDANCE } from '@/lib/seo/data/facet-guidance';
import { moleculeDefaults } from '@/lib/seo/defaults/molecule';
import {
  applyTokens,
  fetchPageOverride,
  preferOverride,
  type PageTokens,
} from '@/lib/seo/page-seo';

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

/**
 * Values an admin-written string may interpolate, so an edited sentence keeps
 * the live product count instead of freezing the number it was written with.
 */
function moleculeTokens(name: string, total: number): PageTokens {
  return {
    product_count: total.toLocaleString('en-IN'),
    name,
    min_order_value: inr(MIN_ORDER_VALUE_INR),
  };
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
  /*
    Head-only stats. The title and description quote nothing but the total, so
    the price and brand figures the body uses are not fetched here — this
    request deliberately reads one row.
  */
  const defaults = moleculeDefaults(molecule, {
    total,
    minPrice: null,
    maxPrice: null,
    brands: [],
  });
  const override = await fetchPageOverride(path);
  const tokens = moleculeTokens(molecule.name, total);

  return buildMetadata({
    title: `${preferOverride(override?.title, defaults.title, tokens)}${page > 1 ? ` — Page ${page}` : ''}`,
    description: preferOverride(
      override?.description,
      defaults.description,
      tokens,
    ),
    path: page > 1 ? `${path}?page=${page}` : path,
    keywords: defaults.keywords,
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
  // Matches the canonical: on page 2+ this node describes THAT page, not
  // page 1. They disagreed before, so the schema claimed every paginated
  // view was the first one.
  const url = absoluteUrl(page > 1 ? `${path}?page=${page}` : path);

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

  /**
   * Live wholesale-rate comparison — products on this page that currently
   * have a priced seller, cheapest net rate first. This table exists only
   * where the data does (>= 2 priced rows), and it is the one piece of
   * content on this page no competitor can reproduce: real net rates from
   * live listings, not scraped price guesses.
   */
  const pricedRows = products
    .filter((p) => p.hasSellers && typeof p.price === 'number' && p.price > 0 && p.slug)
    .sort((a, b) => (a.price as number) - (b.price as number))
    .slice(0, 10);

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

  const defaults = moleculeDefaults(molecule, {
    total,
    minPrice,
    maxPrice,
    brands: brands.map(([b]) => b),
  });
  const override = await fetchPageOverride(path);
  const tokens = moleculeTokens(molecule.name, total);
  const faqs = override?.faq?.length ? override.faq : defaults.faqs;

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
        heading={preferOverride(override?.h1, defaults.h1, tokens)}
        intro={preferOverride(override?.intro, defaults.intro, tokens)}
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

            {/*
              Class-level procurement guidance — hand-written per therapeutic
              class (see facet-guidance.ts), so 154 molecule pages stop
              sharing one template intro. Commercial observations only: how
              the class TRADES, never how it treats.
            */}
            {override?.bodyHtml?.trim() ? (
              /*
                An admin-written body replaces this hand-written prose block
                and nothing else. The spec table above and the live-rate
                comparison below are generated from real listings, so they
                stay whatever anyone types here — losing them to an edit would
                cost the page the one thing no competitor can reproduce.
              */
              <SeoSection id="stocking-notes" title={`About ${molecule.name}`}>
                <div
                  className="prose prose-slate max-w-3xl text-sm"
                  dangerouslySetInnerHTML={{
                    __html: applyTokens(override.bodyHtml, tokens),
                  }}
                />
              </SeoSection>
            ) : CLASS_GUIDANCE[molecule.therapeuticClass] ? (
              <SeoSection
                id="stocking-notes"
                title={`Stocking ${molecule.therapeuticClass.toLowerCase()} products`}
              >
                <p className="text-sm leading-relaxed text-slate-700">
                  {CLASS_GUIDANCE[molecule.therapeuticClass]}
                </p>
              </SeoSection>
            ) : null}

            {/*
              The live-rate comparison. Rendered only when at least two
              products carry a priced seller — a "comparison" of one row is
              noise, and most long-tail molecules have no live offer yet.
              Rates come straight from the same listings the checkout bills.
            */}
            {pricedRows.length >= 2 ? (
              <SeoSection
                id="rate-comparison"
                title={`${molecule.name} brands compared — live wholesale rates`}
              >
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                        <th className="py-2 pr-3">Brand</th>
                        <th className="py-2 pr-3">Manufacturer</th>
                        <th className="py-2 pr-3">MRP</th>
                        <th className="py-2 pr-3">Net rate / unit</th>
                        <th className="py-2">Below MRP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pricedRows.map((p) => {
                        const net = p.price as number;
                        const mrp =
                          typeof p.mrp === 'number' && p.mrp > net ? p.mrp : null;
                        const saving = mrp
                          ? Math.round(((mrp - net) / mrp) * 100)
                          : null;
                        return (
                          <tr
                            key={p.id}
                            className="border-b border-slate-100 last:border-0"
                          >
                            <td className="py-2 pr-3">
                              <Link
                                href={routes.product(p.slug as string)}
                                className="font-semibold text-teal-700 underline-offset-2 hover:underline"
                              >
                                {p.name}
                              </Link>
                            </td>
                            <td className="py-2 pr-3 text-slate-600">
                              {p.manufacturer ?? '—'}
                            </td>
                            <td className="py-2 pr-3 text-slate-600">
                              {mrp ? inr(mrp) : '—'}
                            </td>
                            <td className="py-2 pr-3 font-semibold text-slate-900">
                              {inr(net)}
                            </td>
                            <td className="py-2 text-slate-600">
                              {saving !== null ? `${saving}%` : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-500">
                  Net rates are live wholesale offers from verified suppliers,
                  exclusive of GST, and move with seller schemes. Rates shown
                  are per unit received after scheme and discount — the amount
                  a verified buyer is actually billed.
                </p>
              </SeoSection>
            ) : null}

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
