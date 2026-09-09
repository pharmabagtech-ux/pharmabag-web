/**
 * Guards the category and sub-category page content.
 *
 * The buyer app has no test runner, so this is a script rather than a spec.
 * Run it from `apps/buyer` after touching anything under `lib/seo/defaults`
 * or `lib/seo/data/category-guidance.ts`:
 *
 *     npx tsx scripts/check-page-content.ts
 *
 * What it protects against, all of which was live before 2026-09-09:
 *
 *  - the 31 sub-category pages sharing bodies (they were backed by ~13
 *    distinct texts, because guidance was keyed by dosage form alone)
 *  - a category page shipping with no prose at all
 *  - a sub-category page shipping without its category-specific FAQ
 *
 * Exits non-zero on any failure so it can be wired into CI later.
 */
import { CATALOGUE_TAXONOMY, TAXONOMY_PAIRS } from '../src/lib/seo/data/catalogue-taxonomy';
import { categoryDefaults } from '../src/lib/seo/defaults/category';
import { dosageFormDefaults } from '../src/lib/seo/defaults/dosage-form';

const failures: string[] = [];
const check = (ok: boolean, message: string) => {
  if (!ok) failures.push(message);
};

// ── Sub-category pages ──────────────────────────────────────────────────
const bodies = new Map<string, string>();

for (const pair of TAXONOMY_PAIRS) {
  const defaults = dosageFormDefaults(
    { name: pair.categoryName, slug: pair.categorySlug },
    { name: pair.formName, slug: pair.formSlug },
    100,
  );

  check(!!defaults.body, `${pair.path}: no body`);
  if (!defaults.body) continue;

  const text = defaults.body.paragraphs.join(' ');
  check(
    defaults.body.paragraphs.length >= 3,
    `${pair.path}: body has only ${defaults.body.paragraphs.length} paragraph(s)`,
  );
  check(
    defaults.faqs.length >= 4,
    `${pair.path}: ${defaults.faqs.length} FAQs, expected the generic 3 plus a specific one`,
  );

  const clash = bodies.get(text);
  check(
    !clash,
    `${pair.path}: body is identical to ${clash} — this is the duplication the guidance keys were changed to fix`,
  );
  if (!clash) bodies.set(text, pair.path);
}

// ── Category pages ──────────────────────────────────────────────────────
const categoryBodies = new Map<string, string>();

for (const category of CATALOGUE_TAXONOMY) {
  const defaults = categoryDefaults(
    { name: category.name, slug: category.slug, subCategories: category.forms },
    1000,
  );

  check(!!defaults.body, `/categories/${category.slug}: no body`);
  if (!defaults.body) continue;

  const text = defaults.body.paragraphs.join(' ');
  const clash = categoryBodies.get(text);
  check(!clash, `/categories/${category.slug}: body is identical to ${clash}`);
  if (!clash) categoryBodies.set(text, `/categories/${category.slug}`);
}

// ── Report ──────────────────────────────────────────────────────────────
if (failures.length > 0) {
  console.error(`\n${failures.length} problem(s):\n`);
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exit(1);
}

console.log(
  `✓ ${TAXONOMY_PAIRS.length} sub-category pages: all have a body, all bodies unique, all carry a category-specific FAQ`,
);
console.log(
  `✓ ${CATALOGUE_TAXONOMY.length} category pages: all have a body, all bodies unique`,
);
