import { SITE_NAME, MIN_ORDER_VALUE_INR } from '../config';
import { inr } from '../content';
import { categoryGuidance } from '../data/category-guidance';
import type { PageDefaults } from './types';

/**
 * Generated content for `/categories/<slug>`.
 *
 * Moved here verbatim from the page file so the admin panel can show an editor
 * prefilled with what the page currently says. The strings must not drift while
 * moving: the page is live and indexed, and a reworded H1 or intro is a real
 * ranking change made by accident.
 */

export interface CategoryEntity {
  name: string;
  slug: string;
  subCategories?: { name: string; slug: string }[];
}

/** Short, honest description of what each trade category means. */
export function categoryBlurb(name: string): string {
  const key = name.toLowerCase();
  if (key.includes('ethical')) {
    return 'Ethical products are branded prescription medicines promoted to doctors and dispensed against a prescription.';
  }
  if (key.includes('generic')) {
    return 'Generic products are medicines sold under their salt name or as branded generics, typically at a lower price point than the originator brand.';
  }
  if (key.includes('nutraceutical')) {
    return 'Nutraceuticals cover food-supplement products such as vitamins, minerals, protein supplements and health tonics.';
  }
  if (key.includes('ayurvedic')) {
    return 'Ayurvedic products are traditional medicine formulations licensed under the AYUSH framework.';
  }
  return `${name} products supplied at wholesale rates.`;
}

export function categoryDefaults(
  category: CategoryEntity,
  total: number,
): PageDefaults {
  const subs = category.subCategories ?? [];
  const guidance = categoryGuidance(category.slug);

  return {
    title: `${category.name} Medicines Wholesale Supplier`,
    description: `Buy ${category.name.toLowerCase()} medicines in bulk from verified Indian wholesalers on ${SITE_NAME}. ${total.toLocaleString('en-IN')} products with wholesale net rates, GST invoicing and pan-India delivery.`,
    keywords: [
      `${category.name} medicines wholesale`,
      `${category.name} medicine distributor`,
      `bulk ${category.name.toLowerCase()} medicine supplier India`,
      'pharmaceutical wholesaler',
    ],
    h1: `${category.name} medicines — wholesale suppliers in India`,
    intro: `${SITE_NAME} lists ${total.toLocaleString('en-IN')} ${category.name.toLowerCase()} medicines for wholesale and bulk purchase across India. ${categoryBlurb(category.name)} Every listing is placed by a verified supplier and shows the wholesale net rate, minimum order quantity and applicable GST.`,
    faqs: [
      {
        question: `How many ${category.name.toLowerCase()} medicines are available on ${SITE_NAME}?`,
        answer: `${SITE_NAME} lists ${total.toLocaleString('en-IN')} ${category.name.toLowerCase()} products from verified wholesale suppliers across India, spanning ${subs.length} dosage forms including ${subs.slice(0, 5).map((s) => s.name.toLowerCase()).join(', ')}.`,
      },
      {
        question: `What is the minimum order for ${category.name.toLowerCase()} medicines?`,
        answer: `Each order line must reach ${inr(MIN_ORDER_VALUE_INR)} including GST. The per-unit minimum order quantity is set by the supplying wholesaler and is shown on every product page.`,
      },
      {
        question: `Who can buy ${category.name.toLowerCase()} medicines in bulk on ${SITE_NAME}?`,
        answer: `${SITE_NAME} sells only to businesses: retail pharmacies, hospitals, clinics, nursing homes and distributors. Buyers complete a one-time verification with a valid drug licence and GST or PAN details before they can place an order.`,
      },
      {
        question: `Is GST included in the wholesale rates shown?`,
        answer: `No. Wholesale net rates on ${SITE_NAME} are shown exclusive of GST. GST is applied at the rate applicable to each product and appears on the invoice issued by the supplying wholesaler.`,
      },
    ],
    /*
      Category pages carried an intro and FAQs but NO prose at all, while the
      sub-category pages beneath them each had a body — the parent was the
      thinner page of the two. This is the trade view of the category: how
      buying decisions are actually made in it.
    */
    body: guidance
      ? { title: `Buying ${category.name.toLowerCase()} at wholesale`, paragraphs: guidance }
      : null,
  };
}
