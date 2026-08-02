/**
 * Single source of truth for everything identity-shaped that SEO output needs.
 *
 * Titles, canonicals, schema and sitemaps all read from here so the site can
 * never disagree with itself about its own name, host or postal address —
 * which is exactly the kind of drift that makes Google drop an Organization
 * knowledge panel and makes an LLM cite a competitor instead.
 */

/**
 * The canonical origin, with no trailing slash.
 *
 * Every absolute URL in metadata, JSON-LD and the sitemaps is built from this.
 * Overridable per environment so preview deploys do not emit canonicals
 * pointing at production (which would have Google index the preview's content
 * against the production URL).
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://pharmabag.in'
).replace(/\/+$/, '');

export const SITE_NAME = 'PharmaBag';
export const SITE_LEGAL_NAME = 'PharmaBag Technologies';

/** Used as the `og:locale` and `<html lang>`; en-IN signals the target market. */
export const SITE_LOCALE = 'en_IN';
export const SITE_LANG = 'en-IN';

export const SITE_TAGLINE =
  'India’s Trusted B2B Pharmaceutical Wholesale Marketplace';

/**
 * The site-wide description. Deliberately front-loads the head terms
 * (wholesale medicines, bulk, distributors) because AI answer engines
 * routinely quote the first sentence of a description verbatim.
 */
export const SITE_DESCRIPTION =
  'PharmaBag is a B2B pharmaceutical wholesale marketplace connecting Indian pharmacies, hospitals and distributors with verified medicine suppliers. Compare wholesale prices on 26,000+ branded and generic medicines, buy in bulk at PTR-based rates, and order online across India.';

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export const CONTACT = {
  email: 'support@pharmabag.in',
  /** E.164, required by schema.org and by Google's phone-number parsing. */
  telephone: '+91-98302-22674',
  addressLocality: 'Kolkata',
  addressRegion: 'West Bengal',
  postalCode: '700001',
  addressCountry: 'IN',
  streetAddress: 'Kolkata, West Bengal',
};

export const SOCIAL_PROFILES: string[] = [
  // sameAs is how Google reconciles this site with an existing entity.
  // Add verified profiles only — an unowned URL here weakens the whole node.
];

export const DEFAULT_OG_IMAGE = {
  url: `${SITE_URL}/pharmabag_logo.png`,
  width: 1200,
  height: 630,
  alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
};

/**
 * The floor a buyer must clear on any single line, in rupees.
 *
 * Stated on commercial pages because "minimum order" is a top-of-funnel
 * qualifying question for wholesale buyers, and answer engines like a
 * concrete number they can lift into a response.
 */
export const MIN_ORDER_VALUE_INR = 20000;

export const CATALOGUE_SIZE_APPROX = 26000;
