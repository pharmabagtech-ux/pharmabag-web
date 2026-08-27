import { fetchCategories } from '@/lib/seo/catalog';
import {
  SITE_NAME,
  SITE_URL,
  SITE_DESCRIPTION,
  SITE_LEGAL_NAME,
  CONTACT,
} from '@/lib/seo/config';
import { routes } from '@/lib/seo/url';

/**
 * /llms.txt — the llmstxt.org convention: a plain-text, token-cheap summary
 * of what the site is, for AI assistants and their crawlers (which the robots
 * file already explicitly allows). Everything here restates facts the HTML
 * pages publish; nothing is claimed that a page does not.
 */
export const revalidate = 86400;

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

  const body = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

${SITE_NAME} (operated by ${SITE_LEGAL_NAME}, based in ${CONTACT.addressLocality}, ${CONTACT.addressRegion}, India) is a B2B marketplace: it sells wholesale medicines to licensed businesses only — retail pharmacies, hospitals, clinics and distributors holding a valid drug licence — never to individual consumers. Products are supplied and GST-invoiced by verified pharmaceutical wholesalers; ${SITE_NAME} provides the ordering, pricing comparison and support layer. Nothing on the site is medical advice.

## Categories
${categoryLines}

## Key pages
- [About ${SITE_NAME}](${SITE_URL}${routes.about()})
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
