import { SITE_NAME, MIN_ORDER_VALUE_INR } from '../config';
import { inr } from '../content';
import type { PageDefaults } from './types';

/**
 * Generated content for `/wholesale-medicine-suppliers/<state>`.
 *
 * Moved here verbatim from the page file. `state.note` is the hand-written
 * sentence per state that keeps these 24 pages from reading as one template
 * with the name swapped — it stays part of the generated intro, and an admin
 * override replaces the whole paragraph rather than editing around it.
 */

export interface StateEntity {
  name: string;
  slug: string;
  aka?: string;
  note?: string;
  cities: { name: string; slug: string }[];
}

export function stateDefaults(state: StateEntity, total: number): PageDefaults {
  const cityNames = state.cities.map((c) => c.name);

  return {
    title: `Wholesale Medicine Suppliers in ${state.name} — Bulk Distributors`,
    description: `Buy wholesale medicines in ${state.name} from verified suppliers on ${SITE_NAME}. ${total.toLocaleString('en-IN')} products at bulk rates, serving ${cityNames.slice(0, 4).join(', ')} and across the state with GST invoicing.`,
    keywords: [
      `wholesale medicine supplier ${state.name}`,
      `pharmaceutical distributor ${state.name}`,
      `bulk medicine ${state.name}`,
      `medicine wholesaler ${state.name}`,
      ...(state.aka ? [`medicine supplier ${state.aka}`] : []),
    ],
    h1: `Wholesale medicine suppliers in ${state.name}`,
    intro: `${SITE_NAME} connects licensed pharmacies, hospitals, clinics and distributors in ${state.name} with verified pharmaceutical wholesalers across India. ${
      state.note ? `${state.note} ` : ''
    }${total.toLocaleString('en-IN')} products are available at wholesale net rates, with GST invoicing and delivery to ${cityNames
      .slice(0, 4)
      .join(', ')} and the rest of the state.`,
    faqs: [
      {
        question: `How do I buy wholesale medicines in ${state.name}?`,
        answer: `Pharmacies, hospitals and distributors in ${state.name} register on ${SITE_NAME} with a valid drug licence and GST or PAN details. Once verified, they can order from ${total.toLocaleString('en-IN')} listed products at wholesale net rates, with delivery across ${state.name} and a GST invoice on every order.`,
      },
      {
        question: `What is the minimum order for wholesale medicines in ${state.name}?`,
        answer: `Each order line must reach ${inr(MIN_ORDER_VALUE_INR)} including GST. Individual products also carry their own minimum order quantity set by the supplying wholesaler, shown on every listing.`,
      },
      {
        question: `Which cities in ${state.name} does ${SITE_NAME} serve?`,
        answer: `${SITE_NAME} delivers throughout ${state.name}, including ${cityNames.join(', ')}. Because orders are dispatched to the buyer's registered address, any licensed buyer in the state can order regardless of city.`,
      },
      {
        question: `Do suppliers in ${state.name} provide a GST invoice?`,
        answer: `Yes. Every order placed on ${SITE_NAME} is invoiced with GST by the supplying wholesaler at the rate applicable to each product. Interstate supply is invoiced with IGST where relevant.`,
      },
    ],
  };
}
