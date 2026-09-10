import { SITE_NAME, MIN_ORDER_VALUE_INR } from '../config';
import { inr } from '../content';
import type { CityProfile } from '../data/city-profiles';
import type { PageDefaults } from './types';

/**
 * Generated content for `/wholesale-medicine-suppliers/<state>/<city>`.
 *
 * `city.note` was one sentence, and it was never enough: measured live, Mumbai
 * and Pune read **92.1% identical**, and Mumbai and Kolkata 90.7%. A single
 * differing clause does not make a page distinct — it makes it a template with
 * the name swapped, which is what the comment here used to claim it prevented.
 *
 * Pages for cities with a `CityProfile` are now written from real trade facts
 * (market, licensing authority, territory served). Pages for cities without one
 * carry `noindex` — see the page file. Nothing is invented to fill the gap.
 */

export interface CityEntity {
  name: string;
  slug: string;
  note?: string;
}

export function cityDefaults(
  city: CityEntity,
  state: { name: string; slug: string },
  total: number,
  profile?: CityProfile,
): PageDefaults {
  /**
   * The intro and the body deliberately carry DIFFERENT facts.
   *
   * First attempt put `role` in both and read as repetition; removing it from
   * the body then pushed same-state siblings (Mumbai vs Pune, which share a
   * regulator and a product list) back up to 81.6% identical. Splitting the
   * profile — market and territory here, role and local demand below — keeps
   * every fact used exactly once and differentiates on the fields that
   * actually vary between two cities in the same state.
   */
  const opening = profile
    ? `${
        profile.market
          ? `Its wholesale trade runs through ${profile.market}, supplying `
          : `Buyers here supply `
      }${profile.serves ?? `${city.name} and the surrounding ${state.name} market`}.`
    : city.note ?? '';

  return {
    title: `Wholesale Medicine Suppliers in ${city.name} — Bulk Distributors`,
    description: profile
      ? `Buy medicines in bulk in ${city.name} — ${profile.role}. ${total.toLocaleString('en-IN')} products from verified wholesalers on ${SITE_NAME}, at net rates with GST invoicing.`
      : `Buy medicines in bulk in ${city.name}, ${state.name}. ${total.toLocaleString('en-IN')} products from verified wholesalers on ${SITE_NAME}, with wholesale net rates, GST invoicing and delivery across ${city.name}.`,
    keywords: [
      `wholesale medicine supplier ${city.name}`,
      `medicine distributor ${city.name}`,
      `pharmaceutical wholesaler ${city.name}`,
      `bulk medicine ${city.name}`,
      `medical distributor ${city.name} ${state.name}`,
    ],
    h1: `Wholesale medicine suppliers in ${city.name}, ${state.name}`,
    intro: `${SITE_NAME} connects pharmacies, hospitals, clinics and distributors in ${city.name} with verified pharmaceutical wholesalers across India. ${
      opening ? `${opening} ` : ''
    }Licensed buyers in ${city.name} can order from ${total.toLocaleString('en-IN')} products at wholesale net rates, with GST invoicing and delivery to their registered business address in ${state.name}.`,
    body: profile
      ? {
          title: `How wholesale supply reaches ${city.name}`,
          paragraphs: [
            `${city.name} is ${profile.role}${
              profile.demand ? `, and what moves through it is shaped by ${profile.demand}` : ''
            }.`,
            `Wholesale purchasing here requires a drug licence issued by ${profile.regulator}, alongside GST registration or a PAN. ${SITE_NAME} verifies both once during onboarding, after which net rates become visible.`,
            `Because ${SITE_NAME} is a national marketplace rather than a local depot, buyers in ${city.name} are not limited to stock held nearby — listings come from verified wholesalers anywhere in India and are invoiced with GST to the buyer's registered address.`,
          ],
        }
      : null,
    faqs: [
      /*
        The FAQs are the largest block of text on these pages, so leaving them
        generic left siblings ~88% identical even after the intro and body were
        rewritten — measured, not assumed. They now carry the city's own facts
        wherever a profile supplies them, which is what actually moves the
        number, while every answer stays true for the city it is on.
      */
      {
        question: `Who supplies wholesale medicines in ${city.name}?`,
        answer: `${SITE_NAME} lists verified pharmaceutical wholesalers supplying ${city.name} and the wider ${state.name} market, with ${total.toLocaleString('en-IN')} products available at wholesale net rates. Every supplier holds a valid drug licence and GST registration.${
          profile
            ? ` Buying here does not depend on a counter in the local market: ${city.name} is ${profile.role}, and stock can be sourced from verified wholesalers anywhere in India.`
            : ''
        }`,
      },
      {
        question: `How quickly can medicines be delivered in ${city.name}?`,
        answer: `Dispatch times depend on the supplying wholesaler and the destination. Orders to ${city.name} are shipped to the buyer's registered business address with a GST invoice, and the expected dispatch window is shown at checkout before the order is confirmed.${
          profile?.demand
            ? ` Buyers here often plan around ${profile.demand}, so ordering ahead of peak demand is worth doing.`
            : ''
        }`,
      },
      {
        question: `What licence do I need to buy wholesale medicines in ${city.name}?`,
        answer: `A valid drug licence issued by ${
          profile ? profile.regulator : `the ${state.name} drug control authority`
        } is required, along with GST registration or a PAN. ${SITE_NAME} verifies these once during onboarding, after which wholesale rates become visible and orders can be placed.`,
      },
      ...(profile?.serves
        ? [
            {
              question: `Which areas do wholesale buyers in ${city.name} usually supply?`,
              answer: `Buyers operating out of ${city.name} generally serve ${profile.serves}. Stock ordered through ${SITE_NAME} is invoiced to your registered business, so it can be moved onward under your own wholesale licence, subject to the conditions ${profile.regulator} sets.`,
            },
          ]
        : []),
      {
        question: `What is the minimum order value for buyers in ${city.name}?`,
        answer: `Each order line must reach ${inr(MIN_ORDER_VALUE_INR)} including GST, the same across India. Individual products also carry a minimum order quantity in units set by the supplying wholesaler.`,
      },
    ],
  };
}
