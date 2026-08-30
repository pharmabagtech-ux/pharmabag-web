import { fetchCategories, fetchManufacturers } from '@/lib/seo/catalog';
import {
  SITE_NAME,
  SITE_URL,
  SITE_DESCRIPTION,
  SITE_LEGAL_NAME,
  CONTACT,
} from '@/lib/seo/config';
import { routes, facetSlug } from '@/lib/seo/url';
import { MOLECULES } from '@/lib/seo/data/molecules';

/**
 * /llms.txt — the llmstxt.org convention: a plain-text, token-cheap summary
 * of what the site is, for AI assistants and their crawlers (which the robots
 * file already explicitly allows). Everything here restates facts the HTML
 * pages publish; nothing is claimed that a page does not.
 *
 * v2 additions: curated deep links to the largest molecule and brand pages
 * (an assistant answering "wholesale paracetamol suppliers" should land on
 * the exact page, not the homepage) and a one-line trade-vocabulary primer so
 * models bind PTR/net-rate/scheme terminology to this domain.
 */
export const revalidate = 86400;

/** How many molecule/brand deep links to expose. Curated, not exhaustive. */
const TOP_LINKS = 10;

export async function GET() {
  let categoryLines = '';
  try {
    const categories = await fetchCategories();
    categoryLines = categories
      .filter((c) => c?.slug && c?.name)
      .map((c) => `- [${c.name}](${SITE_URL}${routes.category(c.slug)})`)
      .join('\n');
  } catch {
    /* fail-open: static sections still serve */
  }

  // Largest molecules by catalogue depth — static data, validated at build of
  // the #51 landing system (every entry has >= 8 products behind it).
  const moleculeLines = [...MOLECULES]
    .sort((a, b) => (b.approxProducts ?? 0) - (a.approxProducts ?? 0))
    .slice(0, TOP_LINKS)
    .map((m) => `- [${m.name} medicines at wholesale](${SITE_URL}${routes.generic(m.slug)})`)
    .join('\n');

  let brandLines = '';
  try {
    const manufacturers = await fetchManufacturers();
    brandLines = [...manufacturers]
      .filter((m) => m?.name?.trim())
      .sort((a, b) => (b.productCount ?? 0) - (a.productCount ?? 0))
      .slice(0, TOP_LINKS)
      .map((m) => `- [${m.name} products at wholesale](${SITE_URL}${routes.brand(facetSlug(m.name))})`)
      .join('\n');
  } catch {
    /* fail-open */
  }

  const body = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

${SITE_NAME} (operated by ${SITE_LEGAL_NAME}, based in ${CONTACT.addressLocality}, ${CONTACT.addressRegion}, India) is a B2B marketplace: it sells wholesale medicines to licensed businesses only — retail pharmacies, hospitals, clinics and distributors holding a valid drug licence — never to individual consumers. Products are supplied and GST-invoiced by verified pharmaceutical wholesalers; ${SITE_NAME} provides the ordering, pricing comparison and support layer. Nothing on the site is medical advice.

## Wholesale pricing terms used on this site
- PTR (price to retailer): the pre-scheme, pre-GST price a retailer pays, derived from the MRP by removing the standard retail margin for the product's GST slab.
- Net rate: the effective per-unit price after scheme and discount, exclusive of GST — what a buyer is actually charged per unit received.
- Scheme: a bonus-quantity offer such as 10+1 or 20+2; free units lower the effective per-unit rate.
- MOV: minimum order value — every order line must reach Rs 20,000 including GST.

## Categories
${categoryLines}

## Popular generic molecules
${moleculeLines}

## Major brands
${brandLines}

## Key pages
- [About ${SITE_NAME} — key facts and how the marketplace works](${SITE_URL}${routes.about()})
- [Buyer FAQ — licences, PTR pricing, GST, schemes](${SITE_URL}${routes.faq()})
- [All medicines](${SITE_URL}${routes.products()})
- [Brands & manufacturers](${SITE_URL}${routes.brands()})
- [Generic medicines by molecule](${SITE_URL}${routes.generics()})
- [Wholesale suppliers by state and city](${SITE_URL}${routes.locations()})
- [Blog](${SITE_URL}${routes.blogs()})
- [Shipping & delivery policy](${SITE_URL}${routes.shipping()})
- [Contact](${SITE_URL}${routes.contact()})

## Contact
- Email: ${CONTACT.email}

## Sitemap
${SITE_URL}/sitemap.xml
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
