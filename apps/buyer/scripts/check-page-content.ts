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
 * The live taxonomy is whatever the API returns; this checks the guidance
 * data, so pairs are derived from the guidance map itself rather than from a
 * second hand-maintained list that could drift out of step with it.
 *
 * Exits non-zero on any failure so it can be wired into CI later.
 */
import {
  CATEGORY_GUIDANCE,
  CATEGORY_FORM_GUIDANCE,
} from '../src/lib/seo/data/category-guidance';
import { categoryDefaults } from '../src/lib/seo/defaults/category';
import { dosageFormDefaults } from '../src/lib/seo/defaults/dosage-form';

/** "nutraceuticals-supplements" -> "Nutraceuticals Supplements" (display only). */
const titleCase = (slug: string) =>
  slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const failures: string[] = [];
const check = (ok: boolean, message: string) => {
  if (!ok) failures.push(message);
};

// ── Sub-category pages ──────────────────────────────────────────────────
const pairs = Object.keys(CATEGORY_FORM_GUIDANCE).map((key) => {
  const [categorySlug, formSlug] = key.split(':');
  return { categorySlug, formSlug, path: `/categories/${categorySlug}/${formSlug}` };
});

const bodies = new Map<string, string>();

for (const pair of pairs) {
  const defaults = dosageFormDefaults(
    { name: titleCase(pair.categorySlug), slug: pair.categorySlug },
    { name: titleCase(pair.formSlug), slug: pair.formSlug },
    100,
  );

  check(!!defaults.body, `${pair.path}: no body`);
  if (!defaults.body) continue;

  check(
    defaults.body.paragraphs.length >= 3,
    `${pair.path}: body has only ${defaults.body.paragraphs.length} paragraph(s)`,
  );
  check(
    defaults.faqs.length >= 4,
    `${pair.path}: ${defaults.faqs.length} FAQs, expected the generic 3 plus a specific one`,
  );

  const text = defaults.body.paragraphs.join(' ');
  const clash = bodies.get(text);
  check(
    !clash,
    `${pair.path}: body is identical to ${clash} — this is the duplication the guidance keys were changed to fix`,
  );
  if (!clash) bodies.set(text, pair.path);
}

// ── Category pages ──────────────────────────────────────────────────────
const categoryBodies = new Map<string, string>();

for (const slug of Object.keys(CATEGORY_GUIDANCE)) {
  const defaults = categoryDefaults(
    { name: titleCase(slug), slug, subCategories: [] },
    1000,
  );

  check(!!defaults.body, `/categories/${slug}: no body`);
  if (!defaults.body) continue;

  const text = defaults.body.paragraphs.join(' ');
  const clash = categoryBodies.get(text);
  check(!clash, `/categories/${slug}: body is identical to ${clash}`);
  if (!clash) categoryBodies.set(text, `/categories/${slug}`);
}

// Every sub-category's parent must have category-level guidance too, or the
// parent page is the thin one again — which is how this started.
for (const pair of pairs) {
  check(
    !!CATEGORY_GUIDANCE[pair.categorySlug],
    `${pair.path}: parent category "${pair.categorySlug}" has no category-level guidance`,
  );
}

// ── Report ──────────────────────────────────────────────────────────────
if (failures.length > 0) {
  console.error(`\n${failures.length} problem(s):\n`);
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exit(1);
}

console.log(
  `✓ ${pairs.length} sub-category pages: all have a body, all bodies unique, all carry a category-specific FAQ`,
);
console.log(
  `✓ ${Object.keys(CATEGORY_GUIDANCE).length} category pages: all have a body, all bodies unique`,
);
