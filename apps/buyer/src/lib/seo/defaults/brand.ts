import { SITE_NAME, MIN_ORDER_VALUE_INR } from '../config';
import { inr } from '../content';
import type { CityProfile } from '../data/city-profiles';
import type { PageDefaults } from './types';

/**
 * Generated content for `/brands/<brand>` and `/brands/<brand>/<city>`.
 *
 * Moved here verbatim from the page files. These are the two largest families
 * — roughly 905 brand pages and 434 brand-in-city pages — so nobody will
 * hand-write most of them. They are here anyway because the admin panel should
 * be able to show what any of them says, and because a handful of large brands
 * are worth tuning by hand.
 */

export interface BrandEntity {
  name: string;
  productCount?: number | null;
}

/**
 * The head is built from the manufacturer's own product count rather than the
 * paged total, which is what the page does today: `generateMetadata` never
 * fetches the product list.
 */
export function brandDefaults(
  brand: BrandEntity,
  total: number,
  forms: string[],
): PageDefaults {
  return {
    title: `${brand.name} — Wholesale Price List`,
    description: `Buy ${brand.name} medicines at wholesale rates on ${SITE_NAME}. ${(brand.productCount ?? 0).toLocaleString('en-IN')} products from verified distributors, with net rates, MOQ, GST invoicing and pan-India delivery.`,
    keywords: [
      `${brand.name} wholesale`,
      `${brand.name} distributor`,
      `${brand.name} price list`,
      `${brand.name} bulk supplier India`,
      `${brand.name} products`,
    ],
    h1: `${brand.name} — wholesale price list and bulk supply`,
    intro: `${SITE_NAME} lists ${total.toLocaleString('en-IN')} ${brand.name} products available for wholesale and bulk purchase across India${
      forms.length
        ? `, spanning ${forms.slice(0, 4).join(', ').toLowerCase()} and other dosage forms`
        : ''
    }. Rates are set by verified wholesale suppliers holding valid drug licences, shown as net rates exclusive of GST, with the minimum order quantity stated on every listing.`,
    faqs: [
      {
        question: `How many ${brand.name} products are available at wholesale on ${SITE_NAME}?`,
        answer: `${SITE_NAME} lists ${total.toLocaleString('en-IN')} ${brand.name} products from verified wholesale suppliers${
          forms.length
            ? `, covering dosage forms such as ${forms.slice(0, 4).join(', ').toLowerCase()}`
            : ''
        }. Each listing shows the supplier's wholesale net rate and minimum order quantity.`,
      },
      {
        question: `How do I become a ${brand.name} distributor or buy in bulk?`,
        answer: `${SITE_NAME} is a B2B marketplace, so ${brand.name} products are bought from verified wholesale suppliers rather than through a direct distributorship. Register as a buyer with a valid drug licence and GST or PAN details to see wholesale rates and place bulk orders.`,
      },
      {
        question: `What is the minimum order value for ${brand.name} products?`,
        answer: `Each order line must reach ${inr(MIN_ORDER_VALUE_INR)} including GST. Individual ${brand.name} listings also carry their own minimum order quantity in units, shown on the product page.`,
      },
      {
        question: `Are ${brand.name} products genuine and licence-verified?`,
        answer: `Every supplier listing ${brand.name} products on ${SITE_NAME} is verified with a valid drug licence and GST registration before being permitted to sell. Orders are invoiced with GST by the supplying wholesaler.`,
      },
    ],
  };
}

export interface BrandCityEntity {
  name: string;
  slug: string;
  note?: string;
  state: { name: string; slug: string };
}

/**
 * `/brands/<brand>/<city>` — 560 pages, 40 brands x 14 cities.
 *
 * These were measured at **90.8% identical** to their siblings: the only
 * differences between the Mumbai and the Kolkata page were the city name, the
 * state name, and one clause. Same product list, same everything else. That is
 * a doorway page by Google's definition, and it was 520 of the 560.
 *
 * The city half of the page is now written from `CITY_PROFILES` — the market
 * the local trade runs through, the authority that licenses buyers there, and
 * the territory supplied onward. Those genuinely differ city to city, which
 * synonyms of "wholesale supplier" never did.
 *
 * Note what is NOT claimed: no supplier count, delivery time or price for the
 * city. The platform holds no city-level data of that kind, so stating any
 * would be inventing facts to dodge a duplicate-content problem — a worse
 * outcome than the problem.
 */
export function brandCityDefaults(
  brand: BrandEntity,
  city: BrandCityEntity,
  total: number,
  profile?: CityProfile,
): PageDefaults {
  const listings = total.toLocaleString('en-IN');

  /**
   * Intro and body carry DIFFERENT facts — market and territory here, role and
   * local demand below. Using the same fact twice read as repetition; using it
   * only once, but splitting which half of the profile goes where, is what
   * separates two cities that share a state and a regulator.
   */
  const opening = profile
    ? `${
        profile.market
          ? `The city's wholesale trade runs through ${profile.market}, supplying `
          : `Buyers here supply `
      }${profile.serves ?? `${city.name} and the surrounding ${city.state.name} market`}.`
    : city.note ?? '';

  return {
    title: `${brand.name} Distributor in ${city.name} — Wholesale Price`,
    description: `Buy ${brand.name} products at wholesale rates in ${city.name}, ${city.state.name}. ${(brand.productCount ?? 0).toLocaleString('en-IN')} listings from verified distributors on ${SITE_NAME}, with GST invoicing and delivery across ${city.name}.`,
    keywords: [
      `${brand.name} distributor ${city.name}`,
      `${brand.name} wholesale ${city.name}`,
      `${brand.name} stockist ${city.name}`,
      `${brand.name} supplier ${city.state.name}`,
    ],
    h1: `${brand.name} distributor in ${city.name} — wholesale supply`,
    intro: `Licensed pharmacies, hospitals and distributors in ${city.name}, ${city.state.name} can buy ${brand.name} products in bulk through ${SITE_NAME}. ${
      opening ? `${opening} ` : ''
    }${listings} ${brand.name} listings are available at wholesale net rates from verified suppliers, invoiced with GST and delivered to your registered business address.`,
    body: profile
      ? {
          title: `Buying ${brand.name} wholesale in ${city.name}`,
          paragraphs: [
            `${city.name} is ${profile.role}${
              profile.demand ? `, and demand for brands like ${brand.name} here is shaped by ${profile.demand}` : ''
            }.`,
            `To buy ${brand.name} at wholesale rates in ${city.name} you need a drug licence issued by ${profile.regulator}, together with GST registration or a PAN. ${SITE_NAME} verifies both once during onboarding.`,
            `Ordering through ${SITE_NAME} does not require a distributorship or a local stockist relationship: ${brand.name} listings are supplied by verified wholesalers anywhere in India and shipped to your registered ${city.name} address with a GST invoice.`,
          ],
        }
      : null,
    faqs: [
      {
        question: `How do I buy ${brand.name} products wholesale in ${city.name}?`,
        answer: `Register on ${SITE_NAME} as a business buyer with a valid drug licence${
          profile ? ` issued by ${profile.regulator}` : ''
        } and GST or PAN details. Once verified, ${listings} ${brand.name} products become available at wholesale net rates, with delivery to your registered address in ${city.name}, ${city.state.name}.`,
      },
      {
        question: `Is there a ${brand.name} stockist in ${city.name}?`,
        answer: `${SITE_NAME} is an online B2B marketplace rather than a physical stockist${
          profile?.market ? `, so you do not need a counter at ${profile.market}` : ''
        }. ${brand.name} products are supplied by verified wholesalers on the platform and shipped to buyers in ${city.name}, so a local stockist relationship is not required to order.`,
      },
      ...(profile?.serves
        ? [
            {
              question: `Can I redistribute ${brand.name} stock bought in ${city.name}?`,
              answer: `Yes, within the scope of your own licence. Buyers ordering into ${city.name} commonly supply ${profile.serves}, and stock is invoiced to your registered business so it can be moved on under your wholesale licence. Onward sale is your responsibility to keep compliant with the conditions ${profile.regulator} sets.`,
            },
          ]
        : []),
      {
        question: `What is the minimum order for ${brand.name} products in ${city.name}?`,
        answer: `Each order line must reach ${inr(MIN_ORDER_VALUE_INR)} including GST. Individual ${brand.name} listings also carry their own minimum order quantity in units, shown on each product page.`,
      },
    ],
  };
}
