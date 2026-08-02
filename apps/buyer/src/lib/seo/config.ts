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
   * DELIBERATELY BLANK (decision taken 2026-08-02).
   *
   * The only number to hand was the account owner's personal mobile, and
   * publishing that as the company's indexed sales line was declined. This is
   * a considered omission, not an oversight — do not "helpfully" fill it with
   * an admin's number.
   *
   * To add a real business line later: set it here in E.164 form
   * (e.g. '+91-33-XXXXXXXX'). It flows automatically into the Organization
   * node, the ContactPoint, LocalBusiness on every city page, and the /about
   * and /contact tables — no other file needs touching.
   */
  telephone: '',

  /**
   * City and state only, by decision (2026-08-02).
   *
   * PharmaBag is a marketplace with no walk-in premises, so a street address
   * adds nothing a buyer can use. Street and postcode stay blank rather than
   * approximated: a wrong postal address is worse than none because Google
   * can match it to the wrong place entity.
   *
   * Populate `streetAddress` + `postalCode` only if a Google Business Profile
   * is ever wanted — that is the case where the full address earns its keep.
   */
  addressLocality: 'Kolkata',
  addressRegion: 'West Bengal',
  addressCountry: 'IN',
  streetAddress: '',
  postalCode: '',
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
