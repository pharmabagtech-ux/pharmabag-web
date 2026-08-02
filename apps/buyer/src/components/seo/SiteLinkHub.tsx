import Link from 'next/link';
import { fetchCategories, fetchManufacturers } from '@/lib/seo/catalog';
import { routes, facetSlug } from '@/lib/seo/url';
import { SITE_NAME } from '@/lib/seo/config';
import { MOLECULES } from '@/lib/seo/data/molecules';
import { STATES, ALL_CITIES, TIER_1_CITIES } from '@/lib/seo/data/locations';

/**
 * Site-wide internal link hub, rendered above the footer on every page.
 *
 * This is the structural fix for the site's discovery problem. With 26,815
 * products behind a JavaScript-rendered catalogue and no sitemap, most of the
 * catalogue had no crawlable path to it at all. Sitemaps solve *discovery*;
 * internal links are what distribute authority, and a page with no incoming
 * internal links tends to be crawled once and then largely ignored.
 *
 * A server component, so the links are in the initial HTML for crawlers that
 * do not run JavaScript. Data is cached for a day, so this costs one taxonomy
 * fetch per revalidation window rather than one per page render.
 */
export default async function SiteLinkHub() {
  const [categories, manufacturers] = await Promise.all([
    fetchCategories(),
    fetchManufacturers(),
  ]);

  const topBrands = manufacturers
    .filter((m) => m.name?.trim() && (m.productCount ?? 0) >= 50)
    .sort((a, b) => (b.productCount ?? 0) - (a.productCount ?? 0))
    .slice(0, 18);

  const topMolecules = [...MOLECULES]
    .sort((a, b) => b.approxProducts - a.approxProducts)
    .slice(0, 18);

  const topCities = ALL_CITIES.filter((c) => TIER_1_CITIES.includes(c.slug));

  const columns: { title: string; links: { label: string; href: string }[] }[] = [
    {
      title: 'Shop by category',
      links: [
        ...categories.map((c) => ({
          label: `${c.name} medicines`,
          href: routes.category(c.slug),
        })),
        { label: 'All categories', href: routes.categories() },
      ],
    },
    {
      title: 'Top pharma brands',
      links: [
        ...topBrands.map((m) => ({
          label: m.name,
          href: routes.brand(facetSlug(m.name)),
        })),
        { label: 'All brands', href: routes.brands() },
      ],
    },
    {
      title: 'Popular molecules',
      links: [
        ...topMolecules.map((m) => ({
          label: m.name,
          href: routes.generic(m.slug),
        })),
        { label: 'All molecules', href: routes.generics() },
      ],
    },
    {
      title: 'Suppliers by city',
      links: [
        ...topCities.map((c) => ({
          label: c.name,
          href: routes.city(c.state.slug, c.slug),
        })),
        { label: 'All states and cities', href: routes.locations() },
      ],
    },
    {
      title: 'Suppliers by state',
      links: STATES.slice(0, 14).map((s) => ({
        label: s.name,
        href: routes.state(s.slug),
      })),
    },
    {
      title: `About ${SITE_NAME}`,
      links: [
        { label: 'About us', href: routes.about() },
        { label: 'Contact', href: routes.contact() },
        { label: 'Buying FAQ', href: routes.faq() },
        { label: 'Articles', href: routes.blogs() },
        { label: 'All medicines', href: routes.products() },
      ],
    },
  ];

  return (
    <nav
      aria-label="Site directory"
      className="border-t border-slate-200 bg-slate-50/80"
    >
      <div className="mx-auto w-full max-w-7xl px-[4vw] py-10">
        <h2 className="mb-6 text-sm font-bold uppercase tracking-wider text-slate-500">
          Browse {SITE_NAME}
        </h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-700">
                {column.title}
              </h3>
              <ul className="space-y-1.5">
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-xs leading-snug text-slate-500 transition hover:text-teal-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
