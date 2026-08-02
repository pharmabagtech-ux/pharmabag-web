import type { Metadata } from 'next';
import Navbar from '@/components/landing/Navbar';
import JsonLd from '@/components/seo/JsonLd';
import { Breadcrumbs, SeoSection, LinkGrid, FaqList } from '@/components/seo/SeoContent';
import { fetchCategories, fetchProducts } from '@/lib/seo/catalog';
import { buildMetadata } from '@/lib/seo/metadata';
import { routes, absoluteUrl } from '@/lib/seo/url';
import {
  graph,
  breadcrumbSchema,
  collectionPageSchema,
  faqSchema,
} from '@/lib/seo/schema';
import { SITE_NAME, MIN_ORDER_VALUE_INR } from '@/lib/seo/config';
import { inr } from '@/lib/seo/content';
import { moleculesByClass } from '@/lib/seo/data/molecules';

/**
 * Category hub.
 *
 * A hub page exists so the four top-level categories and their ~20 dosage
 * forms have one crawlable parent, rather than being reachable only through a
 * JavaScript-driven filter dropdown — which is how they were reachable before,
 * i.e. not at all for a non-JS crawler.
 */
export const revalidate = 86400;

const CROMBS = [
  { name: 'Home', path: routes.home() },
  { name: 'Categories', path: routes.categories() },
];

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: 'Medicine Categories — Wholesale Pharmaceutical Range',
    description: `Browse every wholesale medicine category on ${SITE_NAME}: ethical and generic medicines, nutraceuticals and ayurvedic products, organised by dosage form — tablets, syrups, injections, capsules and more.`,
    path: routes.categories(),
    keywords: [
      'medicine categories',
      'pharmaceutical categories wholesale',
      'generic medicines',
      'ethical medicines',
      'nutraceuticals wholesale',
      'ayurvedic products wholesale',
    ],
  });
}

export default async function CategoriesPage() {
  const [categories, { total }] = await Promise.all([
    fetchCategories(),
    fetchProducts({ page: 1, limit: 1 }),
  ]);

  const url = absoluteUrl(routes.categories());

  const faqs = [
    {
      question: `What medicine categories does ${SITE_NAME} supply at wholesale?`,
      answer: `${SITE_NAME} supplies ${categories.map((c) => c.name).join(', ')} products at wholesale rates, covering ${total.toLocaleString('en-IN')} listed items. Each category is further organised by dosage form such as tablets, capsules, syrups, injections, creams and drops.`,
    },
    {
      question: 'What is the difference between ethical and generic medicines?',
      answer:
        'In the Indian pharmaceutical trade, "ethical" refers to branded prescription products promoted to doctors, while "generic" refers to medicines sold primarily under their salt name or as a branded generic at a lower price point. Both are supplied on PharmaBag by verified wholesalers, and both require a valid drug licence to purchase.',
    },
    {
      question: `What is the minimum order value on ${SITE_NAME}?`,
      answer: `Every order line on ${SITE_NAME} must reach ${inr(MIN_ORDER_VALUE_INR)} including GST. The minimum applies per product line rather than per order, so a basket with several products has an independent minimum for each.`,
    },
  ];

  const jsonLd = graph(
    breadcrumbSchema(CROMBS),
    collectionPageSchema({
      name: 'Medicine Categories',
      url,
      description: `All wholesale medicine categories available on ${SITE_NAME}.`,
      items: categories.map((c) => ({
        name: c.name,
        url: absoluteUrl(routes.category(c.slug)),
      })),
    }),
    faqSchema(faqs),
  );

  const classLinks = moleculesByClass().map((group) => ({
    label: group.therapeuticClass,
    href: `${routes.generics()}#${group.therapeuticClass
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')}`,
    meta: `${group.molecules.length}`,
  }));

  return (
    <>
      <JsonLd json={jsonLd} />
      <Navbar showUserActions />
      <main className="w-full pb-16 pt-20 lg:pt-28">
        <Breadcrumbs crumbs={CROMBS} />

        <header className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Wholesale medicine categories
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-700">
            {SITE_NAME} lists {total.toLocaleString('en-IN')} pharmaceutical
            products across {categories.length} categories, supplied in bulk to
            retail pharmacies, hospitals, clinics and distributors throughout
            India. Select a category to see its dosage forms and the products
            available at wholesale rates.
          </p>
        </header>

        {categories.map((category) => (
          <SeoSection
            key={category.id}
            id={category.slug}
            title={`${category.name} medicines`}
          >
            <p className="mb-3 text-sm text-slate-600">
              <a
                href={routes.category(category.slug)}
                className="font-semibold text-teal-700 underline-offset-2 hover:underline"
              >
                View all {category.name} products →
              </a>
            </p>
            {(category.subCategories ?? []).length > 0 ? (
              <LinkGrid
                links={(category.subCategories ?? []).map((sub) => ({
                  label: `${category.name} — ${sub.name}`,
                  href: routes.dosageForm(category.slug, sub.slug),
                }))}
              />
            ) : null}
          </SeoSection>
        ))}

        {classLinks.length > 0 ? (
          <SeoSection title="Browse by therapeutic class">
            <LinkGrid links={classLinks} columns={3} />
          </SeoSection>
        ) : null}

        <SeoSection id="faq" title="Frequently asked questions">
          <FaqList faqs={faqs} />
        </SeoSection>
      </main>
    </>
  );
}
