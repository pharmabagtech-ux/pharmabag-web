import { SITE_NAME, MIN_ORDER_VALUE_INR } from '../config';
import { inr } from '../content';
import { FORM_GUIDANCE } from '../data/facet-guidance';
import { categoryFormGuidance } from '../data/category-guidance';
import type { PageDefaults } from './types';

/**
 * Generated content for `/categories/<category>/<form>`.
 *
 * Moved here verbatim from the page file. The strings must not drift while
 * moving: these 31 pages are live and indexed.
 */

export interface FormEntity {
  name: string;
  slug: string;
}

/** Factual note on what each dosage form is, used to differentiate the copy. */
export function formBlurb(form: string): string {
  const key = form.toLowerCase();
  const map: Record<string, string> = {
    tablet: 'Tablets are solid oral dosage forms and the highest-volume category in Indian wholesale pharmacy, with long shelf life and simple storage.',
    capsule: 'Capsules enclose powder or liquid fill in a gelatin or vegetarian shell, and are commonly used where taste masking or delayed release is needed.',
    syrup: 'Syrups are liquid oral preparations, widely dispensed in paediatrics, and require attention to expiry dating and storage conditions in transit.',
    injection: 'Injections are sterile parenteral preparations supplied to hospitals and clinics, and many require cold-chain handling.',
    vials: 'Vials are sealed sterile containers for injectable preparations, typically ordered by hospitals and nursing homes.',
    drops: 'Drops cover ophthalmic, otic and paediatric oral preparations dispensed in small measured volumes.',
    cream: 'Creams are semi-solid topical preparations used across dermatology and general practice.',
    ointment: 'Ointments are occlusive semi-solid topical preparations with an oil base.',
    gel: 'Gels are semi-solid topical preparations with rapid absorption, common in pain management and dermatology.',
    lotion: 'Lotions are low-viscosity topical preparations for application over larger skin areas.',
    powder: 'Powders include oral rehydration salts, protein supplements and reconstitutable preparations.',
    inhaler: 'Inhalers deliver metered doses to the respiratory tract and are central to asthma and COPD management.',
    insulin: 'Insulin products require strict cold-chain storage and are supplied to pharmacies and hospitals under controlled conditions.',
    soap: 'Medicated soaps and bathing bars are dermatological products dispensed through pharmacy channels.',
    lozenges: 'Lozenges are slow-dissolving oral preparations used mainly for throat and cough indications.',
    suppository: 'Suppositories are solid dosage forms for rectal or vaginal administration.',
    paste: 'Pastes are stiff semi-solid preparations, commonly dental or dermatological.',
    pfs: 'Pre-filled syringes are ready-to-administer sterile injectables that reduce preparation error.',
    shampoo: 'Medicated shampoos are dermatological preparations for scalp conditions.',
  };
  return map[key] ?? `${form} preparations supplied at wholesale rates.`;
}

/**
 * "Tablet" -> "Tablets"; already-plural names and acronyms (Drops, Lozenges,
 * PFS) stay as they are.
 */
export function formGuidanceTitle(formName: string, categoryName?: string): string {
  const plural = /s$/i.test(formName) ? formName : `${formName}s`;
  return `Buying ${categoryName ? `${categoryName} ${plural}` : plural} at wholesale`;
}

export function dosageFormDefaults(
  category: { name: string; slug: string },
  form: FormEntity,
  total: number,
): PageDefaults {
  /*
    Category-specific guidance first. FORM_GUIDANCE is keyed by form ALONE, so
    every category stocking a form served byte-identical prose — the three
    /tablet pages returned the same 610 characters, which is what a search
    quality system reads as duplicate. The per-form text stays as a fallback so
    a category added in the admin panel still gets a body rather than a bare
    product list.
  */
  const combo = categoryFormGuidance(category.slug, form.slug);
  const paragraphs = combo?.paragraphs ?? FORM_GUIDANCE[form.name.toLowerCase()];

  return {
    title: `${category.name} ${form.name} — Wholesale Price & Bulk Supply`,
    description: `Buy ${category.name.toLowerCase()} ${form.name.toLowerCase()} products in bulk on ${SITE_NAME}. ${total.toLocaleString('en-IN')} listings from verified Indian wholesalers with net rates, MOQ and GST invoicing.`,
    keywords: [
      `${form.name.toLowerCase()} wholesale`,
      `${category.name} ${form.name} supplier`,
      `bulk ${form.name.toLowerCase()} distributor India`,
    ],
    h1: `${category.name} ${form.name} — wholesale suppliers in India`,
    intro: `${SITE_NAME} lists ${total.toLocaleString('en-IN')} ${category.name.toLowerCase()} products supplied in ${form.name.toLowerCase()} form. ${formBlurb(form.name)} Each listing shows the wholesale net rate, minimum order quantity and applicable GST, and is placed by a licensed supplier.`,
    faqs: [
      {
        question: `How many ${category.name.toLowerCase()} ${form.name.toLowerCase()} products are listed?`,
        answer: `${SITE_NAME} currently lists ${total.toLocaleString('en-IN')} ${category.name.toLowerCase()} products in ${form.name.toLowerCase()} form from verified wholesale suppliers across India.`,
      },
      {
        question: `What is the minimum order for ${form.name.toLowerCase()} products?`,
        answer: `Every order line must reach ${inr(MIN_ORDER_VALUE_INR)} including GST. Each listing also carries its own minimum order quantity in units, set by the supplying wholesaler and shown on the product page.`,
      },
      {
        question: `Are ${form.name.toLowerCase()} orders delivered across India?`,
        answer: `Yes. ${SITE_NAME} suppliers dispatch ${form.name.toLowerCase()} products to pharmacies, hospitals and distributors across all Indian states, with GST invoicing on every order.`,
      },
      // The fourth question is specific to this category and form, so these
      // pages stop sharing an identical FAQ set as well as identical prose.
      ...(combo ? [combo.faq] : []),
    ],
    /*
      Hand-written procurement guidance per dosage form — the content that
      makes 31 form pages genuinely distinct rather than one template with a
      swapped noun. Commercial knowledge only (storage, breakage, pack
      conventions, movement); nothing clinical.
    */
    body: paragraphs
      ? {
          title: formGuidanceTitle(form.name, combo ? category.name : undefined),
          paragraphs,
        }
      : null,
  };
}
