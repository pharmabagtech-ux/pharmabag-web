import {
  fetchCategories,
  fetchManufacturers,
  fetchProducts,
} from '../catalog';
import { facetSlug, routes } from '../url';
import { findMolecule, MOLECULES } from '../data/molecules';
import {
  ALL_CITIES,
  STATES,
  TIER_1_CITIES,
  findState,
  findCity,
} from '../data/locations';
import { categoryDefaults } from './category';
import { dosageFormDefaults } from './dosage-form';
import { moleculeDefaults } from './molecule';
import { stateDefaults } from './state';
import { cityDefaults } from './city';
import { brandDefaults, brandCityDefaults } from './brand';
import type { PageDefaults } from './types';

/**
 * Resolves a storefront path to the content that path generates.
 *
 * This is the piece that lets the admin panel show what a live page says
 * without anyone copying the templates into a second codebase. The page
 * renders these functions; the admin editor reads them through
 * `/api/seo/page-defaults`. One source, two consumers.
 */

export type PageType =
  | 'CATEGORY'
  | 'DOSAGE_FORM'
  | 'MOLECULE'
  | 'STATE'
  | 'CITY'
  | 'BRAND'
  | 'BRAND_CITY';

export interface ResolvedPage {
  pageType: PageType;
  /** Human label for the admin list, e.g. "Ayurvedic" or "Cipla in Kolkata". */
  label: string;
  path: string;
}

/** Splits a path into clean segments, tolerating a trailing slash. */
function segments(path: string): string[] {
  return path.split('?')[0].split('#')[0].split('/').filter(Boolean);
}

/**
 * Serialises a generated body block to HTML for the admin editor.
 *
 * The page renders the block as real components; the editor needs markup it
 * can drop into a rich-text field. Escaping matters — a stray `<` in
 * hand-written guidance would otherwise arrive as broken markup.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function bodyToHtml(body: PageDefaults['body']): string {
  if (!body) return '';
  return body.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n');
}

/**
 * The generated content for a path, or null when the path is not one of the
 * seven landing-page families.
 *
 * Deliberately read-only and side-effect free: it fetches the same catalogue
 * data the page fetches and returns strings.
 */
export async function resolvePageDefaults(
  path: string,
): Promise<({ defaults: PageDefaults } & ResolvedPage) | null> {
  const parts = segments(path);
  if (parts.length === 0) return null;

  if (parts[0] === 'categories' && parts.length >= 2) {
    const categories = await fetchCategories();
    const category = categories.find((c) => c.slug === parts[1]);
    if (!category) return null;

    if (parts.length === 2) {
      const { total } = await fetchProducts({
        categoryId: category.id,
        page: 1,
        limit: 1,
      });
      return {
        pageType: 'CATEGORY',
        label: category.name,
        path: routes.category(category.slug),
        defaults: categoryDefaults(category, total),
      };
    }

    const form = category.subCategories?.find((s) => s.slug === parts[2]);
    if (!form) return null;
    const { total } = await fetchProducts({
      categoryId: category.id,
      subCategoryId: form.id,
      page: 1,
      limit: 1,
    });
    return {
      pageType: 'DOSAGE_FORM',
      label: `${category.name} ${form.name}`,
      path: routes.dosageForm(category.slug, form.slug),
      defaults: dosageFormDefaults(category, form, total),
    };
  }

  if (parts[0] === 'generics' && parts.length === 2) {
    const molecule = findMolecule(parts[1]);
    if (!molecule) return null;
    const { total } = await fetchProducts({
      search: molecule.name,
      page: 1,
      limit: 1,
    });
    return {
      pageType: 'MOLECULE',
      label: molecule.name,
      path: routes.generic(molecule.slug),
      /*
        Price and brand figures are omitted, exactly as the page's own
        generateMetadata omits them: they need the full product list, and the
        editor is showing the head and intro, not the rate table.
      */
      defaults: moleculeDefaults(molecule, {
        total,
        minPrice: null,
        maxPrice: null,
        brands: [],
      }),
    };
  }

  if (parts[0] === 'wholesale-medicine-suppliers' && parts.length >= 2) {
    const { total } = await fetchProducts({ page: 1, limit: 1 });

    if (parts.length === 2) {
      const state = findState(parts[1]);
      if (!state) return null;
      return {
        pageType: 'STATE',
        label: state.name,
        path: routes.state(state.slug),
        defaults: stateDefaults(state, total),
      };
    }

    const found = findCity(parts[1], parts[2]);
    if (!found) return null;
    return {
      pageType: 'CITY',
      label: `${found.city.name}, ${found.state.name}`,
      path: routes.city(found.state.slug, found.city.slug),
      defaults: cityDefaults(found.city, found.state, total),
    };
  }

  if (parts[0] === 'brands' && parts.length >= 2) {
    const manufacturers = await fetchManufacturers();
    const matches = manufacturers.filter(
      (m) => m.name?.trim() && facetSlug(m.name) === parts[1],
    );
    if (matches.length === 0) return null;
    // Same rule as the page: several spellings of one company exist, so the
    // entry with the most products wins and there is one page per brand.
    const brand = matches.reduce((best, m) =>
      (m.productCount ?? 0) > (best.productCount ?? 0) ? m : best,
    );

    if (parts.length === 2) {
      return {
        pageType: 'BRAND',
        label: brand.name,
        path: routes.brand(parts[1]),
        defaults: brandDefaults(brand, brand.productCount ?? 0, []),
      };
    }

    const city = ALL_CITIES.find((c) => c.slug === parts[2]);
    if (!city || !TIER_1_CITIES.includes(city.slug)) return null;
    return {
      pageType: 'BRAND_CITY',
      label: `${brand.name} in ${city.name}`,
      path: routes.brandInCity(parts[1], city.slug),
      defaults: brandCityDefaults(brand, city, brand.productCount ?? 0),
    };
  }

  return null;
}

/**
 * Every landing page the storefront generates, as a flat list.
 *
 * The admin list needs this because the API only knows about pages someone has
 * already edited. Without it the panel could only ever show the handful of
 * rows that exist, which is the complaint that started this work.
 *
 * Brands are capped: with ~905 manufacturers and 434 brand-city combinations,
 * shipping every one would make this payload the largest thing the admin
 * loads. `brandLimit` keeps it to the brands worth tuning, ordered by
 * catalogue size, and the count of what was dropped is returned so the UI can
 * say so rather than implying the list is complete.
 */
export async function listLandingPages(
  brandLimit = 200,
  brandCityLimit = 20,
): Promise<{
  pages: ResolvedPage[];
  brandsOmitted: number;
  brandCityOmitted: number;
}> {
  const [categories, manufacturers] = await Promise.all([
    fetchCategories(),
    fetchManufacturers(),
  ]);

  const pages: ResolvedPage[] = [];

  for (const category of categories) {
    pages.push({
      pageType: 'CATEGORY',
      label: category.name,
      path: routes.category(category.slug),
    });
    for (const form of category.subCategories ?? []) {
      pages.push({
        pageType: 'DOSAGE_FORM',
        label: `${category.name} ${form.name}`,
        path: routes.dosageForm(category.slug, form.slug),
      });
    }
  }

  for (const molecule of MOLECULES) {
    pages.push({
      pageType: 'MOLECULE',
      label: molecule.name,
      path: routes.generic(molecule.slug),
    });
  }

  for (const state of STATES) {
    pages.push({
      pageType: 'STATE',
      label: state.name,
      path: routes.state(state.slug),
    });
    for (const city of state.cities) {
      pages.push({
        pageType: 'CITY',
        label: `${city.name}, ${state.name}`,
        path: routes.city(state.slug, city.slug),
      });
    }
  }

  /*
    The catalogue holds several spellings of the same company, and facetSlug
    collapses them to one page — so rank first, then dedupe by SLUG. Listing
    "Sun Pharma" and "Sun Pharmaceutical" as two editable pages would let an
    admin write two versions of one live page and wonder which won.
  */
  const ranked = manufacturers
    .filter((m) => m.name?.trim())
    .sort((a, b) => (b.productCount ?? 0) - (a.productCount ?? 0));

  const bySlug = new Map<string, { name: string; slug: string }>();
  for (const m of ranked) {
    const slug = facetSlug(m.name);
    if (!bySlug.has(slug)) bySlug.set(slug, { name: m.name, slug });
  }
  const uniqueBrands = Array.from(bySlug.values());
  const brands = uniqueBrands.slice(0, brandLimit);

  for (const brand of brands) {
    pages.push({
      pageType: 'BRAND',
      label: brand.name,
      path: routes.brand(brand.slug),
    });
  }

  /*
    Brand x city is a cross product: every brand added here multiplies by the
    tier-1 city count. Expanding all of them produced 2,800 rows nobody will
    ever hand-write, which buries the pages that matter. Only the largest
    brands are expanded, and the remainder is reported rather than hidden.
  */
  const cities = TIER_1_CITIES.map((slug) =>
    ALL_CITIES.find((c) => c.slug === slug),
  ).filter((c): c is (typeof ALL_CITIES)[number] => Boolean(c));

  for (const brand of brands.slice(0, brandCityLimit)) {
    for (const city of cities) {
      pages.push({
        pageType: 'BRAND_CITY',
        label: `${brand.name} in ${city.name}`,
        path: routes.brandInCity(brand.slug, city.slug),
      });
    }
  }

  return {
    pages,
    brandsOmitted: Math.max(0, uniqueBrands.length - brands.length),
    brandCityOmitted:
      Math.max(0, brands.length - brandCityLimit) * cities.length,
  };
}
