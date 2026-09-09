import { SITE_NAME, MIN_ORDER_VALUE_INR } from '../config';
import { inr } from '../content';
import type { PageDefaults } from './types';

/**
 * Generated content for `/wholesale-medicine-suppliers/<state>/<city>`.
 *
 * Moved here verbatim from the page file. As with the state pages, `city.note`
 * is the hand-written trade sentence that keeps 90 city pages from reading as
 * one template with the name swapped.
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
): PageDefaults {
  return {
    title: `Wholesale Medicine Suppliers in ${city.name} — Bulk Distributors`,
    description: `Buy medicines in bulk in ${city.name}, ${state.name}. ${total.toLocaleString('en-IN')} products from verified wholesalers on ${SITE_NAME}, with wholesale net rates, GST invoicing and delivery across ${city.name}.`,
    keywords: [
      `wholesale medicine supplier ${city.name}`,
      `medicine distributor ${city.name}`,
      `pharmaceutical wholesaler ${city.name}`,
      `bulk medicine ${city.name}`,
      `medical distributor ${city.name} ${state.name}`,
    ],
    h1: `Wholesale medicine suppliers in ${city.name}, ${state.name}`,
    intro: `${SITE_NAME} connects pharmacies, hospitals, clinics and distributors in ${city.name} with verified pharmaceutical wholesalers across India. ${
      city.note ? `${city.note} ` : ''
    }Licensed buyers in ${city.name} can order from ${total.toLocaleString('en-IN')} products at wholesale net rates, with GST invoicing and delivery to their registered business address in ${state.name}.`,
    faqs: [
      {
        question: `Who supplies wholesale medicines in ${city.name}?`,
        answer: `${SITE_NAME} lists verified pharmaceutical wholesalers supplying ${city.name} and the wider ${state.name} market, with ${total.toLocaleString('en-IN')} products available at wholesale net rates. Every supplier holds a valid drug licence and GST registration.`,
      },
      {
        question: `How quickly can medicines be delivered in ${city.name}?`,
        answer: `Dispatch times depend on the supplying wholesaler and the destination. Orders to ${city.name} are shipped to the buyer's registered business address with a GST invoice, and the expected dispatch window is shown at checkout before the order is confirmed.`,
      },
      {
        question: `What licence do I need to buy wholesale medicines in ${city.name}?`,
        answer: `A valid drug licence issued by the ${state.name} drug control authority is required, along with GST registration or a PAN. ${SITE_NAME} verifies these once during onboarding, after which wholesale rates become visible and orders can be placed.`,
      },
      {
        question: `What is the minimum order value for buyers in ${city.name}?`,
        answer: `Each order line must reach ${inr(MIN_ORDER_VALUE_INR)} including GST, the same across India. Individual products also carry a minimum order quantity in units set by the supplying wholesaler.`,
      },
    ],
  };
}
