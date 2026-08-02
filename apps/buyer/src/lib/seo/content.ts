/**
 * Content generation for SEO/AEO surfaces.
 *
 * Everything here is derived from catalogue data. Nothing is invented.
 *
 * That constraint is not squeamishness — it is the whole strategy. An answer
 * engine that quotes a fabricated dosage or a made-up price does real harm and
 * gets the source demoted. Sentences are only emitted when the underlying
 * field exists, so a sparse product yields a short page rather than a
 * confident wrong one.
 *
 * Style rules, chosen for how LLMs actually consume pages:
 *  - Lead with the answer. The first sentence must stand alone if quoted.
 *  - Name the entity in full rather than using "it" or "this product".
 *  - Prefer concrete numbers (price, MOQ, GST, pack size) over adjectives.
 */
import type { CatalogProduct, CatalogListing } from './catalog';
import { SITE_NAME, MIN_ORDER_VALUE_INR } from './config';

/** Formats rupees the way Indian buyers read them. */
export function inr(value: number): string {
  return `₹${Number(value).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;
}

/** The cheapest live listing, which is what a buyer and a crawler both care about. */
export function bestListing(p: CatalogProduct): CatalogListing | null {
  const listings = (p.listings ?? []).filter(
    (l) => typeof l?.price === 'number' && (l.price as number) > 0,
  );
  if (listings.length === 0) return null;
  return listings.reduce((best, l) =>
    (l.price as number) < (best.price as number) ? l : best,
  );
}

/** Dosage form ("Tablet", "Syrup") — the subcategory doubles as the form. */
export function dosageForm(p: CatalogProduct): string | null {
  return p.subCategory?.name?.trim() || null;
}

/**
 * The product page `<title>`.
 *
 * Shape: "<Name> — Wholesale Price, <Composition> | <Brand>". Front-loads the
 * brand name (what people search), then the commercial qualifier that
 * distinguishes this from the dozens of retail pharmacy pages ranking for the
 * same product.
 */
export function productTitle(p: CatalogProduct): string {
  const parts = [p.name.trim()];
  const form = dosageForm(p);
  if (form && !new RegExp(form, 'i').test(p.name)) parts.push(form);
  const base = parts.join(' ');
  const brand = p.manufacturer?.trim();
  return brand
    ? `${base} Wholesale Price — ${brand}`
    : `${base} — Wholesale Price & Bulk Supply`;
}

/**
 * The meta description.
 *
 * Packs the qualifying facts a B2B buyer screens on — composition,
 * manufacturer, wholesale rate, MOQ — because those are also exactly the
 * fields an assistant needs to answer "where can I buy X in bulk".
 */
export function productDescription(p: CatalogProduct): string {
  const listing = bestListing(p);
  const bits: string[] = [];

  bits.push(`Buy ${p.name} online at wholesale rates on ${SITE_NAME}.`);

  if (p.chemicalComposition?.trim()) {
    bits.push(`Composition: ${p.chemicalComposition.trim()}.`);
  }
  if (p.manufacturer?.trim()) {
    bits.push(`Marketed by ${p.manufacturer.trim()}.`);
  }
  if (listing?.price) {
    bits.push(`Net rate from ${inr(listing.price)} per unit.`);
  }
  if (listing?.moq) {
    bits.push(`MOQ ${listing.moq} units.`);
  }
  bits.push('Verified suppliers, GST invoice, pan-India delivery.');

  return bits.join(' ');
}

/**
 * A self-contained factual summary rendered at the top of the page.
 *
 * This is the block most likely to be lifted verbatim into an AI Overview or a
 * Perplexity answer, so it repeats the entity name instead of leaning on the
 * surrounding heading, and it never says "see below".
 */
export function productSummary(p: CatalogProduct): string {
  const listing = bestListing(p);
  const form = dosageForm(p);
  const sentences: string[] = [];

  const descriptor = [p.chemicalComposition?.trim() && `containing ${p.chemicalComposition.trim()}`]
    .filter(Boolean)
    .join(' ');

  sentences.push(
    `${p.name} is a ${form ? `${form.toLowerCase()} ` : ''}pharmaceutical product${
      p.manufacturer ? ` marketed by ${p.manufacturer}` : ''
    }${descriptor ? ` ${descriptor}` : ''}, available for wholesale and bulk purchase on ${SITE_NAME}.`,
  );

  if (listing?.price) {
    const mrpNote =
      listing.mrp && listing.mrp > listing.price
        ? ` against an MRP of ${inr(listing.mrp)}`
        : '';
    sentences.push(
      `The current wholesale net rate is ${inr(listing.price)} per unit${mrpNote}, exclusive of GST.`,
    );
  }

  if (listing?.moq) {
    sentences.push(
      `The minimum order quantity is ${listing.moq} units, and every order line must reach ${inr(
        MIN_ORDER_VALUE_INR,
      )} including GST.`,
    );
  }

  const sellerCount = (p.listings ?? []).length;
  if (sellerCount > 0) {
    sentences.push(
      `${sellerCount} verified ${sellerCount === 1 ? 'supplier is' : 'suppliers are'} currently offering ${p.name} on the platform.`,
    );
  }

  return sentences.join(' ');
}

export interface SpecRow {
  label: string;
  value: string;
}

/**
 * The specification table.
 *
 * Tables are disproportionately valuable for AEO: a model parsing a
 * label/value pair is far less likely to mis-attribute a fact than one
 * parsing it out of a paragraph. Empty fields are dropped rather than shown
 * as "N/A", which would otherwise teach a model that the value is literally
 * "N/A".
 */
export function productSpecs(p: CatalogProduct): SpecRow[] {
  const listing = bestListing(p);
  const rows: (SpecRow | null)[] = [
    { label: 'Product Name', value: p.name },
    p.chemicalComposition?.trim()
      ? { label: 'Salt Composition', value: p.chemicalComposition.trim() }
      : null,
    p.manufacturer?.trim()
      ? { label: 'Manufacturer / Marketer', value: p.manufacturer.trim() }
      : null,
    dosageForm(p) ? { label: 'Dosage Form', value: dosageForm(p) as string } : null,
    p.packSize?.trim() ? { label: 'Pack Size', value: p.packSize.trim() } : null,
    p.category?.name
      ? { label: 'Product Category', value: p.category.name }
      : null,
    p.therapeuticClass?.trim()
      ? { label: 'Therapeutic Class', value: p.therapeuticClass.trim() }
      : null,
    listing?.mrp ? { label: 'MRP', value: inr(listing.mrp) } : null,
    listing?.price
      ? { label: 'Wholesale Net Rate', value: `${inr(listing.price)} per unit (excl. GST)` }
      : null,
    typeof listing?.gstPercent === 'number'
      ? { label: 'GST', value: `${listing.gstPercent}%` }
      : null,
    listing?.moq
      ? { label: 'Minimum Order Quantity', value: `${listing.moq} units` }
      : null,
    p.storageAndHandling?.trim()
      ? { label: 'Storage', value: p.storageAndHandling.trim() }
      : null,
  ];
  return rows.filter(Boolean) as SpecRow[];
}

export interface Faq {
  question: string;
  answer: string;
}

/**
 * Product FAQs, generated only from known facts.
 *
 * Each answer is written to survive being quoted in isolation — it restates
 * the product name rather than saying "this medicine". That single habit is
 * what makes an FAQ answer usable as a citation instead of ambiguous filler.
 */
export function productFaqs(p: CatalogProduct): Faq[] {
  const listing = bestListing(p);
  const faqs: Faq[] = [];

  if (listing?.price) {
    faqs.push({
      question: `What is the wholesale price of ${p.name}?`,
      answer: `${p.name} is available on ${SITE_NAME} at a wholesale net rate starting from ${inr(
        listing.price,
      )} per unit, exclusive of GST${
        listing.mrp && listing.mrp > listing.price
          ? `, against a printed MRP of ${inr(listing.mrp)}`
          : ''
      }. Rates are set by verified suppliers and vary with order quantity and the scheme offered.`,
    });
  }

  if (listing?.moq) {
    faqs.push({
      question: `What is the minimum order quantity for ${p.name}?`,
      answer: `The minimum order quantity for ${p.name} is ${listing.moq} units. Every order line on ${SITE_NAME} must also reach a value of ${inr(
        MIN_ORDER_VALUE_INR,
      )} including GST, so the effective minimum may be higher for lower-priced items.`,
    });
  }

  if (p.chemicalComposition?.trim()) {
    faqs.push({
      question: `What is the salt composition of ${p.name}?`,
      answer: `${p.name} contains ${p.chemicalComposition.trim()}. Always confirm the composition and strength against the product pack and the prescribing information before dispensing.`,
    });
  }

  if (p.manufacturer?.trim()) {
    faqs.push({
      question: `Who manufactures ${p.name}?`,
      answer: `${p.name} is marketed by ${p.manufacturer.trim()}. ${SITE_NAME} sources it through verified wholesale suppliers who hold valid drug licences.`,
    });
  }

  faqs.push({
    question: `Can I buy ${p.name} in bulk for my pharmacy or hospital?`,
    answer: `Yes. ${SITE_NAME} is a B2B wholesale platform serving retail pharmacies, hospitals, clinics and distributors across India. Buyers complete a one-time verification with a drug licence and GST or PAN details, after which ${p.name} can be ordered in bulk with a GST invoice and pan-India delivery.`,
  });

  faqs.push({
    question: `Is a GST invoice provided for ${p.name}?`,
    answer: `Yes. Every order placed on ${SITE_NAME}, including ${p.name}, is billed with a GST invoice from the supplying wholesaler at the applicable GST rate${
      typeof listing?.gstPercent === 'number' ? ` of ${listing.gstPercent}%` : ''
    }.`,
  });

  return faqs;
}

/**
 * Whether a product is likely prescription-only.
 *
 * Conservative by design: "Ethical" is the Indian trade term for
 * prescription-promoted product, so it is treated as prescription-only.
 * Getting this wrong in the safe direction costs nothing; getting it wrong in
 * the unsafe direction tells an assistant a Schedule H drug is freely
 * purchasable.
 */
export function isPrescriptionOnly(p: CatalogProduct): boolean {
  const category = p.category?.name?.toLowerCase() ?? '';
  if (category.includes('nutraceutical') || category.includes('ayurvedic')) {
    return false;
  }
  return true;
}

/** Trimmed, single-spaced text for meta fields. */
export function squash(text: string, max = 300): string {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}
