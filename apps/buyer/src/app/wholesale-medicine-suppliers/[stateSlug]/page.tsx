import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/seo/JsonLd';
import CollectionShell from '@/components/seo/CollectionShell';
import { fetchProducts, fetchCategories } from '@/lib/seo/catalog';
import { buildMetadata } from '@/lib/seo/metadata';
import { routes, absoluteUrl } from '@/lib/seo/url';
import {
  graph,
  breadcrumbSchema,
  collectionPageSchema,
  faqSchema,
  localBusinessSchema,
} from '@/lib/seo/schema';
import { SITE_NAME, MIN_ORDER_VALUE_INR } from '@/lib/seo/config';
import { inr } from '@/lib/seo/content';
import { STATES, findState } from '@/lib/seo/data/locations';
import { MOLECULES } from '@/lib/seo/data/molecules';
import { stateDefaults } from '@/lib/seo/defaults/state';
import {
  applyTokens,
  fetchPageOverride,
  preferOverride,
  type PageTokens,
} from '@/lib/seo/page-seo';

/**
 * State supplier page — e.g. /wholesale-medicine-suppliers/maharashtra.
 *
 * Differentiation strategy: each state page carries its own trade note, its
 * own city list and its own onward links. Without those, 24 state pages would
 * be one template with a noun swapped — which is precisely the thin-content
 * pattern that gets programmatic SEO penalised rather than rewarded.
 */
export const revalidate = 86400;

const PAGE_SIZE = 24;

export async function generateStaticParams() {
  return STATES.map((s) => ({ stateSlug: s.slug }));
}

interface PageProps {
  params: { stateSlug: string };
}

/**
 * Values an admin-written string may interpolate, so an edited sentence keeps
 * the live catalogue count instead of freezing the number it was written with.
 */
function locationTokens(name: string, total: number): PageTokens {
  return {
    product_count: total.toLocaleString('en-IN'),
    name,
    min_order_value: inr(MIN_ORDER_VALUE_INR),
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const state = findState(params.stateSlug);
  if (!state) {
    return buildMetadata({
      title: 'Location not found',
      description: 'Browse wholesale medicine suppliers across India.',
      path: routes.state(params.stateSlug),
      index: false,
    });
  }

  const { total } = await fetchProducts({ page: 1, limit: 1 });
  const defaults = stateDefaults(state, total);
  const override = await fetchPageOverride(routes.state(state.slug));
  const tokens = locationTokens(state.name, total);

  return buildMetadata({
    title: preferOverride(override?.title, defaults.title, tokens),
    description: preferOverride(
      override?.description,
      defaults.description,
      tokens,
    ),
    path: routes.state(state.slug),
    keywords: defaults.keywords,
  });
}

export default async function StatePage({ params }: PageProps) {
  const state = findState(params.stateSlug);
  if (!state) notFound();

  const [{ products, total }, categories] = await Promise.all([
    fetchProducts({ page: 1, limit: PAGE_SIZE }),
    fetchCategories(),
  ]);

  const path = routes.state(state.slug);
  const url = absoluteUrl(path);

  const crumbs = [
    { name: 'Home', path: routes.home() },
    { name: 'Wholesale Medicine Suppliers', path: routes.locations() },
    { name: state.name, path },
  ];

  const defaults = stateDefaults(state, total);
  const override = await fetchPageOverride(path);
  const tokens = locationTokens(state.name, total);
  const faqs = override?.faq?.length ? override.faq : defaults.faqs;

  const description = `Verified wholesale medicine suppliers serving ${state.name}, with ${total.toLocaleString('en-IN')} pharmaceutical products available for bulk purchase.`;

  const jsonLd = graph(
    breadcrumbSchema(crumbs),
    localBusinessSchema({ state: state.name, url, description }),
    collectionPageSchema({
      name: `Wholesale Medicine Suppliers in ${state.name}`,
      url,
      description,
      totalItems: state.cities.length,
      items: state.cities.map((c) => ({
        name: `Wholesale medicine suppliers in ${c.name}`,
        url: absoluteUrl(routes.city(state.slug, c.slug)),
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
        body={
          override?.bodyHtml?.trim() ? (
            <div
              className="prose prose-slate max-w-3xl py-4"
              dangerouslySetInnerHTML={{
                __html: applyTokens(override.bodyHtml, tokens),
              }}
            />
          ) : undefined
        }
        crumbs={crumbs}
        products={products}
        totalProducts={total}
        basePath={path}
        page={1}
        totalPages={1}
        browseHref={routes.products()}
        browseLabel="Browse the full catalogue"
        faqs={faqs}
        linkSections={[
          {
            title: `Cities we serve in ${state.name}`,
            links: state.cities.map((c) => ({
              label: `Medicine suppliers in ${c.name}`,
              href: routes.city(state.slug, c.slug),
            })),
            columns: 3 as const,
          },
          {
            title: `Medicine categories supplied in ${state.name}`,
            links: categories.map((c) => ({
              label: `${c.name} medicines wholesale`,
              href: routes.category(c.slug),
            })),
          },
          {
            title: 'Popular generic molecules',
            links: MOLECULES.slice()
              .sort((a, b) => b.approxProducts - a.approxProducts)
              .slice(0, 16)
              .map((m) => ({
                label: `${m.name} suppliers`,
                href: routes.generic(m.slug),
              })),
            columns: 4 as const,
          },
          {
            title: 'Other states',
            links: STATES.filter((s) => s.slug !== state.slug)
              .slice(0, 16)
              .map((s) => ({
                label: `Suppliers in ${s.name}`,
                href: routes.state(s.slug),
              })),
            columns: 3 as const,
          },
        ]}
      />
    </>
  );
}
