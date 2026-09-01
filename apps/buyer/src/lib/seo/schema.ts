/**
 * schema.org JSON-LD builders.
 *
 * Why this matters twice over:
 *  - Search engines use it for rich results (product cards, breadcrumbs,
 *    FAQ accordions, sitelinks search box).
 *  - Answer engines (AI Overviews, Copilot, Perplexity, ChatGPT browsing)
 *    lean on it far harder than on prose, because it is unambiguous. A page
 *    that states its facts in JSON-LD is dramatically more likely to be quoted
 *    correctly than one that only implies them in marketing copy.
 *
 * Rules held throughout this file:
 *  - Never assert a fact that is not in the data. Fabricated ratings or prices
 *    are a manual-action risk and, worse, teach an LLM something false.
 *  - Use `@id` so nodes reference one shared Organization/WebSite entity
 *    instead of redefining a slightly different company on every page.
 *  - Emit `undefined` for missing fields and strip them, rather than emitting
 *    nulls, which several validators treat as malformed.
 */
import {
  SITE_URL,
  SITE_NAME,
  SITE_LEGAL_NAME,
  SITE_DESCRIPTION,
  SITE_LANG,
  ORGANIZATION_ID,
  WEBSITE_ID,
  CONTACT,
  SOCIAL_PROFILES,
  DEFAULT_OG_IMAGE,
  SITE_LOGO_URL,
  MIN_ORDER_VALUE_INR,
} from './config';
import { absoluteUrl } from './url';

type Json = Record<string, unknown>;

/** Recursively drops undefined/null/empty-array values so output stays valid. */
export function prune<T extends Json>(obj: T): T {
  const out: Json = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v)) {
      const arr = v
        .filter((x) => x !== undefined && x !== null && x !== '')
        .map((x) =>
          x && typeof x === 'object' && !Array.isArray(x)
            ? prune(x as Json)
            : x,
        );
      if (arr.length === 0) continue;
      out[k] = arr;
      continue;
    }
    if (typeof v === 'object') {
      const nested = prune(v as Json);
      if (Object.keys(nested).length === 0) continue;
      out[k] = nested;
      continue;
    }
    out[k] = v;
  }
  return out as T;
}

/* ------------------------------------------------------------------ *
 * Site-wide entities
 * ------------------------------------------------------------------ */

/**
 * The company node. Typed as both Organization and MedicalBusiness so it
 * satisfies generic Organization consumers while also declaring the
 * pharmaceutical vertical that medical-intent queries are matched against.
 *
 * `overrides` carries the admin-panel site settings (SEO Settings page);
 * every field falls back to the code-level config, so callers that pass
 * nothing get exactly the historical output.
 */
export function organizationSchema(
  overrides: {
    sameAs?: string[];
    email?: string;
    addressLocality?: string;
    addressRegion?: string;
  } = {},
): Json {
  const email = overrides.email || CONTACT.email;
  const sameAs = overrides.sameAs?.length ? overrides.sameAs : SOCIAL_PROFILES;

  return prune({
    '@type': ['Organization', 'MedicalBusiness', 'WholesaleStore'],
    '@id': ORGANIZATION_ID,
    name: SITE_NAME,
    legalName: SITE_LEGAL_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    // The Organization's logo is the LOGO, not the share card — Google's
    // knowledge panel and AI engines pull this as the brand mark.
    logo: {
      '@type': 'ImageObject',
      url: SITE_LOGO_URL,
      caption: SITE_NAME,
    },
    image: SITE_LOGO_URL,
    email,
    telephone: CONTACT.telephone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: CONTACT.streetAddress,
      addressLocality: overrides.addressLocality || CONTACT.addressLocality,
      addressRegion: overrides.addressRegion || CONTACT.addressRegion,
      postalCode: CONTACT.postalCode,
      addressCountry: CONTACT.addressCountry,
    },
    /** The service footprint, so "supplier in <state>" queries can match. */
    areaServed: {
      '@type': 'Country',
      name: 'India',
    },
    knowsAbout: [
      'Wholesale medicine supply',
      'Pharmaceutical distribution',
      'Generic medicines',
      'Branded pharmaceuticals',
      'Bulk medicine procurement',
      'PCD pharma franchise',
      'Hospital and pharmacy supply chain',
    ],
    sameAs: sameAs.length ? sameAs : undefined,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      email,
      telephone: CONTACT.telephone,
      areaServed: 'IN',
      availableLanguage: ['en', 'hi'],
    },
  });
}

/**
 * The WebSite node, including the SearchAction that makes Google render a
 * sitelinks search box under the brand result.
 */
export function websiteSchema(): Json {
  return prune({
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    inLanguage: SITE_LANG,
    publisher: { '@id': ORGANIZATION_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/products?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  });
}

/* ------------------------------------------------------------------ *
 * Per-page entities
 * ------------------------------------------------------------------ */

export interface Crumb {
  name: string;
  /** Site-root-relative path; converted to absolute here. */
  path: string;
}

/**
 * Breadcrumbs. Rendered as the crumb trail in search results, and — more
 * usefully for AEO — they tell a model where a page sits in the taxonomy,
 * which is how it decides the page is about a category rather than a product.
 */
export function breadcrumbSchema(crumbs: Crumb[]): Json {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

export interface FaqEntry {
  question: string;
  answer: string;
}

/**
 * FAQPage. The single highest-leverage schema for answer engines: the
 * question/answer pairing is exactly the shape a model wants to lift.
 *
 * Answers are kept self-contained (no "as mentioned above") because a quoted
 * answer is read with none of its surrounding page.
 */
export function faqSchema(entries: FaqEntry[]): Json | null {
  const valid = entries.filter((e) => e.question?.trim() && e.answer?.trim());
  if (valid.length === 0) return null;
  return {
    '@type': 'FAQPage',
    mainEntity: valid.map((e) => ({
      '@type': 'Question',
      name: e.question,
      acceptedAnswer: { '@type': 'Answer', text: e.answer },
    })),
  };
}

export interface ProductSchemaInput {
  name: string;
  url: string;
  description: string;
  sku?: string | null;
  image?: string | null;
  brand?: string | null;
  category?: string | null;
  activeIngredient?: string | null;
  dosageForm?: string | null;
  price?: number | null;
  mrp?: number | null;
  currency?: string;
  inStock?: boolean;
  sellerCount?: number | null;
  minOrderQuantity?: number | null;
  ratingValue?: number | null;
  reviewCount?: number | null;
  /**
   * Net rates of ALL priced listings on the product. With two or more, the
   * offers node becomes an AggregateOffer (lowPrice/highPrice/offerCount) —
   * the markup price-range rich results are built from, and honest by
   * construction because the numbers are the live listings themselves.
   */
  offerPrices?: number[];
}

/**
 * The ₹20,000 order floor, expressed as schema.org means it.
 *
 * This used to be emitted as `priceSpecification.minPrice`, which states "the
 * lowest price for this item" — so a product priced at ₹178.16 also declared a
 * minimum price of ₹20,000, a node contradicting itself 112-fold and readable
 * as the product costing ₹20,000. `eligibleTransactionVolume` is the field for
 * a minimum spend that qualifies an offer, which is what this actually is.
 *
 * VAT-inclusive because the minimum is assessed on the GST-inclusive line
 * total, matching how checkout applies it.
 */
function minOrderVolume(currency: string): Json {
  return {
    '@type': 'PriceSpecification',
    minPrice: MIN_ORDER_VALUE_INR,
    priceCurrency: currency,
    valueAddedTaxIncluded: true,
  };
}

/**
 * Product + Offer.
 *
 * `priceValidUntil` is deliberately omitted rather than invented: wholesale
 * rates here move with seller schemes, and a stale hardcoded date causes
 * Google to demote the offer.
 *
 * AggregateRating is emitted ONLY with a real review count. Emitting a
 * fabricated 5.0 is the most common structured-data manual action there is.
 */
export function productSchema(p: ProductSchemaInput): Json {
  const currency = p.currency ?? 'INR';
  const hasOffer = typeof p.price === 'number' && p.price > 0;
  const validPrices = (p.offerPrices ?? []).filter(
    (n) => typeof n === 'number' && n > 0,
  );
  const isAggregate = validPrices.length >= 2;
  const hasRating =
    typeof p.ratingValue === 'number' &&
    typeof p.reviewCount === 'number' &&
    p.reviewCount > 0;

  return prune({
    '@type': 'Product',
    '@id': `${p.url}#product`,
    name: p.name,
    url: p.url,
    description: p.description,
    sku: p.sku ?? undefined,
    image: p.image ?? DEFAULT_OG_IMAGE.url,
    category: p.category ?? undefined,
    brand: p.brand
      ? { '@type': 'Brand', name: p.brand }
      : undefined,
    manufacturer: p.brand
      ? { '@type': 'Organization', name: p.brand }
      : undefined,
    /**
     * Additional properties carry the pharma-specific facts that `Product`
     * has no first-class field for. Answer engines read these directly, and
     * they are what let the page match "composition of X" style questions.
     */
    additionalProperty: [
      p.activeIngredient
        ? {
            '@type': 'PropertyValue',
            name: 'Salt Composition',
            value: p.activeIngredient,
          }
        : undefined,
      p.dosageForm
        ? {
            '@type': 'PropertyValue',
            name: 'Dosage Form',
            value: p.dosageForm,
          }
        : undefined,
      typeof p.minOrderQuantity === 'number' && p.minOrderQuantity > 0
        ? {
            '@type': 'PropertyValue',
            name: 'Minimum Order Quantity',
            value: `${p.minOrderQuantity} units`,
          }
        : undefined,
    ].filter(Boolean) as Json[],
    /**
     * Two or more priced sellers → AggregateOffer with the real range, the
     * shape price-range rich results are built from. A single seller keeps
     * the plain Offer, byte-identical to what shipped before this existed.
     */
    offers: isAggregate
      ? prune({
          '@type': 'AggregateOffer',
          '@id': `${p.url}#offers`,
          url: p.url,
          lowPrice: Math.min(...validPrices).toFixed(2),
          highPrice: Math.max(...validPrices).toFixed(2),
          offerCount: validPrices.length,
          priceCurrency: currency,
          availability: p.inStock
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
          seller: { '@id': ORGANIZATION_ID },
          /** Signals B2B intent, which is the qualifying fact for this site. */
          eligibleCustomerType: 'https://schema.org/BusinessCustomer',
          /** Same MOQ the single-Offer branch carries; it was missing here. */
          eligibleQuantity:
            typeof p.minOrderQuantity === 'number' && p.minOrderQuantity > 0
              ? {
                  '@type': 'QuantitativeValue',
                  minValue: p.minOrderQuantity,
                  unitCode: 'C62',
                }
              : undefined,
          eligibleTransactionVolume: minOrderVolume(currency),
        })
      : hasOffer
      ? prune({
          '@type': 'Offer',
          '@id': `${p.url}#offer`,
          url: p.url,
          price: Number(p.price).toFixed(2),
          priceCurrency: currency,
          availability: p.inStock
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
          seller: { '@id': ORGANIZATION_ID },
          /** Signals B2B intent, which is the qualifying fact for this site. */
          eligibleCustomerType: 'https://schema.org/BusinessCustomer',
          eligibleQuantity:
            typeof p.minOrderQuantity === 'number' && p.minOrderQuantity > 0
              ? {
                  '@type': 'QuantitativeValue',
                  minValue: p.minOrderQuantity,
                  unitCode: 'C62', // UN/CEFACT code for "one"/unit
                }
              : undefined,
          priceSpecification: {
            '@type': 'PriceSpecification',
            price: Number(p.price).toFixed(2),
            priceCurrency: currency,
            valueAddedTaxIncluded: false,
          },
          eligibleTransactionVolume: minOrderVolume(currency),
        })
      : undefined,
    aggregateRating: hasRating
      ? {
          '@type': 'AggregateRating',
          ratingValue: Number(p.ratingValue).toFixed(1),
          reviewCount: p.reviewCount,
        }
      : undefined,
  });
}

/**
 * `Drug` node for a medicine.
 *
 * This is the schema type that medical answer engines actually look for. It
 * is emitted alongside `Product` (commercial intent) rather than instead of
 * it, because the two answer different questions: Product wins shopping
 * surfaces, Drug wins "what is X / what is X used for" surfaces.
 *
 * Deliberately conservative: no dosage, indication or warning text is
 * asserted, because the catalogue does not hold clinically reviewed copy and
 * publishing unverified medical claims would be both an EEAT and a real-world
 * safety problem.
 */
export function drugSchema(input: {
  name: string;
  url: string;
  description: string;
  activeIngredient?: string | null;
  manufacturer?: string | null;
  dosageForm?: string | null;
  prescriptionOnly?: boolean;
}): Json {
  return prune({
    '@type': 'Drug',
    '@id': `${input.url}#drug`,
    name: input.name,
    url: input.url,
    description: input.description,
    activeIngredient: input.activeIngredient ?? undefined,
    dosageForm: input.dosageForm ?? undefined,
    manufacturer: input.manufacturer
      ? { '@type': 'Organization', name: input.manufacturer }
      : undefined,
    /**
     * Most of this catalogue is ethical/prescription product. Stating the
     * category is a trust signal, and it stops an assistant presenting a
     * prescription medicine as freely purchasable.
     */
    prescriptionStatus: input.prescriptionOnly
      ? 'https://schema.org/PrescriptionOnly'
      : undefined,
  });
}

/**
 * CollectionPage + ItemList for listing pages.
 *
 * The ItemList is what lets a model answer "which X does this site carry"
 * without crawling every child page.
 */
export function collectionPageSchema(input: {
  name: string;
  url: string;
  description: string;
  items: { name: string; url: string; position?: number }[];
  totalItems?: number;
}): Json {
  return prune({
    '@type': 'CollectionPage',
    '@id': `${input.url}#collection`,
    name: input.name,
    url: input.url,
    description: input.description,
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': ORGANIZATION_ID },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: input.totalItems ?? input.items.length,
      itemListElement: input.items.map((it, i) => ({
        '@type': 'ListItem',
        position: it.position ?? i + 1,
        name: it.name,
        url: it.url,
      })),
    },
  });
}

/** Generic WebPage node, used to bind a page to the site and org entities. */
export function webPageSchema(input: {
  name: string;
  url: string;
  description: string;
  type?: 'WebPage' | 'AboutPage' | 'ContactPage' | 'FAQPage';
  datePublished?: string;
  dateModified?: string;
}): Json {
  return prune({
    '@type': input.type ?? 'WebPage',
    '@id': `${input.url}#webpage`,
    url: input.url,
    name: input.name,
    description: input.description,
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': ORGANIZATION_ID },
    inLanguage: SITE_LANG,
    datePublished: input.datePublished,
    dateModified: input.dateModified,
  });
}

/**
 * LocalBusiness node for a city/state supplier page.
 *
 * Uses `areaServed` rather than a fake local address: PharmaBag serves these
 * cities but does not have a branch in each one, and inventing a local
 * postal address is both a Google violation and a trust problem.
 */
export function localBusinessSchema(input: {
  city?: string;
  state: string;
  url: string;
  description: string;
}): Json {
  const placeName = input.city
    ? `${SITE_NAME} — Wholesale Medicine Supplier in ${input.city}`
    : `${SITE_NAME} — Wholesale Medicine Supplier in ${input.state}`;
  return prune({
    '@type': ['MedicalBusiness', 'WholesaleStore'],
    '@id': `${input.url}#business`,
    name: placeName,
    url: input.url,
    description: input.description,
    parentOrganization: { '@id': ORGANIZATION_ID },
    image: DEFAULT_OG_IMAGE.url,
    email: CONTACT.email,
    telephone: CONTACT.telephone,
    priceRange: '₹₹',
    areaServed: prune({
      '@type': input.city ? 'City' : 'State',
      name: input.city ?? input.state,
      containedInPlace: input.city
        ? { '@type': 'State', name: input.state }
        : { '@type': 'Country', name: 'India' },
    }),
  });
}

export function articleSchema(input: {
  headline: string;
  url: string;
  description: string;
  image?: string | null;
  datePublished?: string;
  dateModified?: string;
  authorName?: string | null;
  /**
   * Plain-text article body.
   *
   * The post page is a client component, so the article text is fetched in the
   * browser and never appears in the served HTML. Crawlers that do not execute
   * JavaScript — which includes most AI crawlers this site deliberately
   * welcomes in robots.txt — saw a headline and nothing else. Carrying the
   * body here puts the actual content in the response in a field both search
   * engines and answer engines read.
   */
  articleBody?: string | null;
}): Json {
  const body = input.articleBody?.trim();
  return prune({
    '@type': 'Article',
    '@id': `${input.url}#article`,
    headline: input.headline.slice(0, 110),
    url: input.url,
    description: input.description,
    articleBody: body || undefined,
    wordCount: body ? body.split(/\s+/).length : undefined,
    image: input.image ?? DEFAULT_OG_IMAGE.url,
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    inLanguage: SITE_LANG,
    author: {
      '@type': input.authorName ? 'Person' : 'Organization',
      name: input.authorName || SITE_NAME,
    },
    publisher: { '@id': ORGANIZATION_ID },
    isPartOf: { '@id': WEBSITE_ID },
  });
}

/**
 * Wraps nodes into a single `@graph` document.
 *
 * One graph per page beats several separate <script> tags: nodes can
 * cross-reference by `@id`, and validators resolve the relationships instead
 * of seeing disconnected islands.
 */
export function graph(...nodes: (Json | null | undefined)[]): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': nodes.filter(Boolean),
  });
}
