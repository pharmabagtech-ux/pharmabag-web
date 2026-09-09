import { SITE_NAME, MIN_ORDER_VALUE_INR } from '../config';
import { inr } from '../content';
import type { PageDefaults } from './types';

/**
 * Generated content for `/generics/<molecule>`.
 *
 * Moved here verbatim from the page file. Unlike the category pages, several
 * sentences here quote live figures — the cheapest net rate, the brands
 * carrying the molecule — so the caller passes them in rather than this module
 * fetching anything.
 */

export interface MoleculeEntity {
  name: string;
  slug: string;
  therapeuticClass: string;
}

export interface MoleculeStats {
  total: number;
  minPrice: number | null;
  maxPrice: number | null;
  /** Manufacturer names on the current page, most products first. */
  brands: string[];
}

export function moleculeDefaults(
  molecule: MoleculeEntity,
  stats: MoleculeStats,
): PageDefaults {
  const { total, minPrice, maxPrice, brands } = stats;

  return {
    title: `${molecule.name} Medicines — Brands & Wholesale Price`,
    description: `${total.toLocaleString('en-IN')} ${molecule.name} medicines available at wholesale on ${SITE_NAME}. Compare brands, manufacturers, net rates and minimum order quantities for bulk purchase across India.`,
    keywords: [
      `${molecule.name} medicines`,
      `${molecule.name} brands India`,
      `${molecule.name} wholesale price`,
      `${molecule.name} generic supplier`,
      `${molecule.therapeuticClass} wholesale`,
    ],
    h1: `${molecule.name} medicines — brands and wholesale prices`,
    intro: `${molecule.name} is a ${molecule.therapeuticClass.toLowerCase()} molecule. ${SITE_NAME} lists ${total.toLocaleString('en-IN')} products containing ${molecule.name} from verified wholesale suppliers across India${
      minPrice
        ? `, with net rates starting from ${inr(minPrice)} per unit exclusive of GST`
        : ''
    }. Every listing shows the brand, manufacturer, wholesale rate and minimum order quantity so equivalent brands can be compared directly.`,
    faqs: [
      {
        question: `Which brands contain ${molecule.name}?`,
        answer: `${SITE_NAME} lists ${total.toLocaleString('en-IN')} products containing ${molecule.name}${
          brands.length
            ? `, from manufacturers including ${brands.slice(0, 6).join(', ')}`
            : ''
        }. Each brand is shown with its wholesale net rate so equivalents can be compared directly.`,
      },
      ...(minPrice
        ? [
            {
              question: `What is the wholesale price of ${molecule.name} medicines?`,
              answer: `${molecule.name} products on ${SITE_NAME} currently start from ${inr(minPrice)} per unit exclusive of GST${
                maxPrice && maxPrice !== minPrice
                  ? `, ranging up to ${inr(maxPrice)} per unit depending on brand, strength and pack size`
                  : ''
              }. Rates are set by verified wholesale suppliers and change with the schemes they offer.`,
            },
          ]
        : []),
      {
        question: `What therapeutic class does ${molecule.name} belong to?`,
        answer: `${molecule.name} is classified under ${molecule.therapeuticClass.toLowerCase()} products in the ${SITE_NAME} catalogue. Classification here is for trade and procurement navigation and is not a substitute for the prescribing information.`,
      },
      {
        question: `Can I buy ${molecule.name} medicines in bulk?`,
        answer: `Yes. ${SITE_NAME} supplies ${molecule.name} products in bulk to retail pharmacies, hospitals, clinics and distributors across India. Buyers verify once with a valid drug licence and GST or PAN details, after which orders are placed online with GST invoicing and pan-India delivery. Each order line must reach ${inr(MIN_ORDER_VALUE_INR)} including GST.`,
      },
    ],
  };
}
