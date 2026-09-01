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

/**
 * The actual trading entity, confirmed by the owner 2026-09-01.
 *
 * This previously read "PharmaBag Technologies", which is not a real entity —
 * and it was being published in the Organization JSON-LD, i.e. told to Google
 * as the company's legal name. PharmaBag is a brand operated by the sole
 * proprietorship Jaiswal Pharma.
 */
export const SITE_LEGAL_NAME = 'Jaiswal Pharma';

/**
 * Year the business started trading, per the owner (2026-09-01).
 *
 * The footer renders FOUNDED_YEAR-currentYear rather than just the current
 * year: a copyright line showing only "2024" on a site being read in a later
 * year reads as abandoned, and one showing only the current year says nothing
 * about how long the business has existed.
 */
export const FOUNDED_YEAR = 2024;

/** Shown wherever the trading entity has to be named in full. */
export const ENTITY_LINE = 'PharmaBag — A Unit of Jaiswal Pharma';

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

/**
 * Public business contact details.
 *
 * ⚠️ These feed the Organization/MedicalBusiness JSON-LD, the ContactPoint
 * node and the visible /about and /contact pages. Search engines treat them
 * as the company's identity, so an unverified value here is not a cosmetic
 * placeholder — it publishes a false fact about the business and undermines
 * the trust signals the schema exists to provide.
 *
 * Rule for this object: leave a field EMPTY unless the value has been
 * confirmed by the business. Every consumer omits empty fields (`prune()` in
 * schema.ts, conditional rows on the contact page), so an empty string
 * degrades cleanly to "not stated" — which is honest — whereas a plausible
 * guess degrades to "stated and wrong".
 */
export const CONTACT = {
  /** CONFIRMED 2026-08-02: real, monitored mailbox. */
  email: 'support@pharmabag.in',

  /**
   * Customer-care line, supplied by the owner 2026-09-01 for publication.
   * (It was deliberately blank before — no business number had been cleared
   * for indexing.) Flows automatically into the Organization node, the
   * ContactPoint, LocalBusiness on every city page, and the /about, /contact
   * and policy pages.
   */
  telephone: '+91-98302-22674',

  /**
   * Registered address of the proprietorship, supplied by the owner
   * 2026-09-01. India's e-commerce rules require an operator to publish its
   * principal geographic address, so this is no longer optional.
   *
   * ⚠️ Transcribed from the owner's message; "Word, 4" was read as "Ward 4".
   * Have this confirmed against the GST registration before treating it as
   * final — a wrong postal address is worse than none, because Google can
   * match it to the wrong place entity.
   */
  addressLocality: 'Kolkata',
  addressRegion: 'West Bengal',
  addressCountry: 'IN',
  streetAddress: 'No. 13, 13A, Ground Floor, Ward 4, Ariff Road, Muchibazar, Daspara, Ultadanga',
  postalCode: '700067',
};

export const SOCIAL_PROFILES: string[] = [
  // sameAs is how Google reconciles this site with an existing entity.
  // Add verified profiles only — an unowned URL here weakens the whole node.
];

/**
 * The default social share card — a true 1200x630 branded card, shown when a
 * page without its own image is shared on WhatsApp/LinkedIn/social or
 * rendered as an AI-chat link preview. Regenerate via the SVG->sharp script
 * if the branding changes. Distinct from SITE_LOGO_URL on purpose: a share
 * card and a logo are different jobs.
 */
export const DEFAULT_OG_IMAGE = {
  url: `${SITE_URL}/og-card.png`,
  width: 1200,
  height: 630,
  alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
};

/** The actual logo mark, used by the Organization schema node. */
export const SITE_LOGO_URL = `${SITE_URL}/pharmabag_logo.png`;

/**
 * The floor a buyer must clear on any single line, in rupees.
 *
 * Stated on commercial pages because "minimum order" is a top-of-funnel
 * qualifying question for wholesale buyers, and answer engines like a
 * concrete number they can lift into a response.
 */
export const MIN_ORDER_VALUE_INR = 20000;

export const CATALOGUE_SIZE_APPROX = 26000;
