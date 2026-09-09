/**
 * The catalogue's category → dosage-form taxonomy, for site-wide navigation.
 *
 * WHY THIS IS STATIC
 *
 * The footer renders on EVERY page, from the root layout. Fetching the
 * taxonomy there is exactly how the whole buyer app was forced out of static
 * rendering once before (a dynamic API in a root-level shared component makes
 * every route dynamic in Next 14). A static list keeps the footer free, the
 * same way `locations.ts` and `molecules.ts` already work.
 *
 * ⚠️ MAINTENANCE: categories are now created deliberately in Admin →
 * Categories rather than by a CSV upload, so this list changes only when
 * someone makes that decision. When a category or dosage form is added there,
 * add it here too — the page will exist and be in the sitemap either way, it
 * just will not be linked from the footer until this file is updated. The
 * `/categories` hub link in the footer is always current, so nothing is
 * unreachable in the meantime.
 *
 * Verified against the live catalogue on 2026-09-09: 4 categories, 31
 * category × form pages.
 */

export interface TaxonomyForm {
  name: string;
  slug: string;
}

export interface TaxonomyCategory {
  name: string;
  slug: string;
  forms: TaxonomyForm[];
}

export const CATALOGUE_TAXONOMY: TaxonomyCategory[] = [
  {
    name: 'Ayurvedic',
    slug: 'ayurvedic',
    forms: [
      { name: 'Tablet', slug: 'tablet' },
      { name: 'Capsule', slug: 'capsule' },
      { name: 'Syrup', slug: 'syrup' },
      { name: 'Powder', slug: 'powder' },
      { name: 'Lotion', slug: 'lotion' },
      { name: 'Paste', slug: 'paste' },
      { name: 'Others', slug: 'others' },
    ],
  },
  {
    name: 'Ethical',
    slug: 'ethical',
    forms: [
      { name: 'Tablet', slug: 'tablet' },
      { name: 'Capsule', slug: 'capsule' },
      { name: 'Syrup', slug: 'syrup' },
      { name: 'Injection', slug: 'injection' },
      { name: 'Vials', slug: 'vials' },
      { name: 'Drops', slug: 'drops' },
      { name: 'Inhaler', slug: 'inhaler' },
      { name: 'Gel', slug: 'gel' },
      { name: 'Lotion', slug: 'lotion' },
      { name: 'Others', slug: 'others' },
    ],
  },
  {
    name: 'Generic',
    slug: 'generic',
    forms: [
      { name: 'Tablet', slug: 'tablet' },
      { name: 'Capsule', slug: 'capsule' },
      { name: 'Syrup', slug: 'syrup' },
      { name: 'Powder', slug: 'powder' },
      { name: 'Cream', slug: 'cream' },
      { name: 'Inhaler', slug: 'inhaler' },
      { name: 'Others', slug: 'others' },
    ],
  },
  {
    name: 'Nutraceuticals & Supplements',
    slug: 'nutraceuticals-supplements',
    forms: [
      { name: 'Tablet', slug: 'tablet' },
      { name: 'Capsule', slug: 'capsule' },
      { name: 'Syrup', slug: 'syrup' },
      { name: 'Powder', slug: 'powder' },
      { name: 'Drops', slug: 'drops' },
      { name: 'Lotion', slug: 'lotion' },
      { name: 'Others', slug: 'others' },
    ],
  },
];

/** Every category × form pair, flattened — used by tests and link builders. */
export const TAXONOMY_PAIRS = CATALOGUE_TAXONOMY.flatMap((category) =>
  category.forms.map((form) => ({
    categorySlug: category.slug,
    categoryName: category.name,
    formSlug: form.slug,
    formName: form.name,
    path: `/categories/${category.slug}/${form.slug}`,
  })),
);
