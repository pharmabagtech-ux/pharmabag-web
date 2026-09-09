/**
 * Hand-written procurement guidance for category and sub-category pages.
 *
 * WHY THIS FILE EXISTS
 *
 * `FORM_GUIDANCE` in facet-guidance.ts is keyed by dosage form ALONE, so every
 * category that shares a form served byte-identical prose:
 * /categories/ayurvedic/tablet, /categories/ethical/tablet and
 * /categories/generic/tablet all returned the same 610 characters. 31
 * sub-category pages were backed by ~13 distinct bodies, differing otherwise
 * only by a product list — the thin/duplicate shape that gets facet pages
 * filtered out of the index, and a worse risk in a YMYL vertical.
 *
 * Category pages had the opposite problem: no body prose at all.
 *
 * Both are fixed here. Guidance is keyed by `category:form`, so "Ayurvedic
 * Tablet" talks about brand-led buying and unstandardised pack conventions
 * while "Ethical Tablet" talks about prescriber-led demand and price control.
 *
 * HARD RULE, same as facet-guidance.ts: COMMERCIAL content only. Storage,
 * breakage, pack conventions, licensing frameworks, margin structure,
 * movement. No indications, no dosing, no efficacy claims, and no invented
 * statistics. A sentence that would need a doctor to review does not belong
 * in this file.
 */

export interface GuidanceEntry {
  /** Rendered as the page's prose section, below the product grid. */
  paragraphs: string[];
  /** One FAQ specific to this page, appended to the generic set. */
  faq: { question: string; answer: string };
}

/** Guidance per trade category, keyed by category slug. */
export const CATEGORY_GUIDANCE: Record<string, string[]> = {
  ayurvedic: [
    'Ayurvedic buying is brand-led rather than molecule-led. There is no salt-level substitute to switch to, so comparing suppliers means comparing the same manufacturer’s product on rate, scheme and reliability rather than choosing between competing formulations.',
    'Formulations are licensed under the AYUSH framework rather than as allopathic drugs, and a manufacturer’s licence details are part of the supplier due-diligence a pharmacy should be able to produce on request.',
    'Movement is seasonal across much of the range and pack conventions are far less standardised than in medicine categories, so normalise every quote to a per-unit or per-weight basis before treating two rates as comparable.',
  ],
  ethical: [
    'Ethical demand is created by prescribers, so stocking follows the doctors around a pharmacy rather than the price list. A cheaper brand of the same molecule does not convert unless it is written.',
    'Trade margins are thinner and more fixed than in generics, and formulations under price control leave less room again. On most ethical lines the negotiable variable is the scheme, not the rate.',
    'Because demand is prescription-anchored, slow stock cannot be discounted away the way a generic can. Expiry discipline is a commercial control on this category, not just good housekeeping.',
  ],
  generic: [
    'Generics are where rate competition actually bites: the same salt is available from several suppliers, and switching between them is a commercial decision rather than a clinical one.',
    'That makes normalisation essential. Compare landed net rate per unit after scheme and GST, because headline discounts quoted across different pack conventions are not comparable.',
    'Continuity matters as much as price. A pharmacy that has put a generic brand in a customer’s hand does not want to explain a different pack next month, so a dependable second consignment is often worth a slightly worse first rate.',
  ],
  'nutraceuticals-supplements': [
    'Supplements are regulated as foods under the FSSAI framework rather than as drugs, which changes labelling, licensing and the questions a buyer should be asking a supplier.',
    'Demand is consumer-pull — advertising, season and shelf visibility — rather than prescription-led, so retail-proven SKUs are the only safe candidates for deep buying, and flavour or format variants move independently of each other.',
    'Shelf lives are typically shorter than in medicine ranges and pack sizes vary widely, so size scheme quantities against demonstrated movement and compare per unit or per kilogram rather than per pack.',
  ],
};

/**
 * Guidance per category AND dosage form, keyed `<category-slug>:<form-slug>`.
 * Covers all 31 live sub-category pages.
 */
export const CATEGORY_FORM_GUIDANCE: Record<string, GuidanceEntry> = {
  // ── Ayurvedic ──────────────────────────────────────────────────────────
  'ayurvedic:tablet': {
    paragraphs: [
      'Ayurvedic tablets and vati preparations move on brand recall rather than substitution. There is no salt-level equivalent to switch to, so a buyer comparing rates is comparing the same manufacturer’s product across suppliers, not competing products.',
      'Pack conventions are less standardised than allopathic tablets: bottles of 30, 60 and 100 sit alongside strips, and a per-bottle rate set against a per-strip rate is the most common comparison error in this category.',
      'Shelf life is usually generous, but herbal tablets are humidity-sensitive. Stock warehoused badly through a monsoon shows softening or discolouration long before the printed expiry date.',
    ],
    faq: {
      question: 'How should ayurvedic tablet rates be compared between suppliers?',
      answer:
        'Reduce every quote to a per-tablet rate before comparing. This range mixes bottles of 30, 60 and 100 with strip packs of the same product, so pack-level rates are not comparable on their own.',
    },
  },
  'ayurvedic:capsule': {
    paragraphs: [
      'Ayurvedic capsules are usually herbal extract fills, and the extract basis is part of the product identity. Two capsules carrying the same herb name are not automatically the same product, so match the full brand and presentation before treating two quotes as equivalent.',
      'Softgel and hard-shell versions of the same range are stocked as separate SKUs, and vegetarian-shell variants matter commercially in this category more than in most, given the buyer profile.',
      'Heat and humidity in transit affect capsules more than tablets. For summer despatch into warm zones, agree how deformed or stuck stock is handled before the order rather than after the claim.',
    ],
    faq: {
      question: 'Are two ayurvedic capsules with the same herb name interchangeable?',
      answer:
        'Not necessarily. Extract basis, presentation and shell type vary between manufacturers and are part of the SKU, so confirm the full brand name and pack before comparing rates.',
    },
  },
  'ayurvedic:syrup': {
    paragraphs: [
      'Ayurvedic syrups, tonics and liquid preparations are high-volume, moderate-value lines where transit breakage decides whether an order was profitable.',
      'Sugar-based tonics are heavy. Freight per case is a larger share of landed cost than in tablets, so a rate that looks better before freight frequently is not better after it.',
      'Some herbal preparations settle or separate by their nature, but retail returns it as damage regardless. Agree that standard with the supplier in advance rather than arguing it per consignment.',
    ],
    faq: {
      question: 'What drives the real cost of an ayurvedic syrup order?',
      answer:
        'Freight and breakage, more than the headline rate. These are heavy, fragile, moderate-value units, so packing standard and an agreed damage policy affect landed cost more than a small rate difference.',
    },
  },
  'ayurvedic:powder': {
    paragraphs: [
      'Churna and powdered preparations are sold by weight, and pack weights vary widely across 50g, 100g, 200g and 500g. Normalise to a per-100g or per-kilogram rate before comparing anything.',
      'Powders are the most moisture-sensitive line in the ayurvedic range. Caking is the usual complaint and it is almost always a storage and transit problem rather than a manufacturing one.',
      'Bulk packs carry a better rate but a shorter practical life once opened at retail. Fast-moving churnas justify them; slow ones rarely do.',
    ],
    faq: {
      question: 'How do you compare ayurvedic powder rates fairly?',
      answer:
        'By weight, not by pack. Convert every quote to a per-100g or per-kilogram rate, because the same product is commonly packed in four or more different weights.',
    },
  },
  'ayurvedic:lotion': {
    paragraphs: [
      'Ayurvedic lotions and medicated hair and skin oils move seasonally and on consumer pull rather than prescription, so stocking decisions follow retail demand rather than prescriber demand.',
      'Oil-based preparations leak. Carton quality and upright loading matter, and leakage claims are best settled as a standing policy with the supplier before the first large order.',
      'Compare per millilitre rather than per bottle: this range mixes 50ml, 100ml and 200ml packs of the same product more freely than any other in the catalogue.',
    ],
    faq: {
      question: 'Why compare ayurvedic lotions per millilitre?',
      answer:
        'Because the same product is routinely sold in several bottle sizes. A per-bottle rate tells you nothing until it is reduced to a per-millilitre basis.',
    },
  },
  'ayurvedic:paste': {
    paragraphs: [
      'Ayurvedic pastes — dental preparations, lepa and medicated balms — are consumer-pull lines that turn on retail visibility rather than clinical demand.',
      'Tube and jar formats of the same product carry different rates and different breakage profiles, and jars travel considerably worse.',
      'These are among the slower movers in the range, so scheme-heavy lots tie up working capital for longer than the discount is worth unless the SKU is already proven at retail.',
    ],
    faq: {
      question: 'Are large scheme lots worth it on ayurvedic pastes?',
      answer:
        'Only on SKUs with proven retail movement. This is a slower-moving group, and a scheme that ties up working capital for months can cost more than the discount returns.',
    },
  },
  'ayurvedic:others': {
    paragraphs: [
      'This group collects the ayurvedic formats that do not fit the standard forms — decoctions and kadha, medicated ghee preparations, bhasma and combination kits among them.',
      'Because the group is mixed, comparison has to be done SKU by SKU. There is no shared pack convention to normalise against the way there is for tablets or powders.',
      'Movement is uneven and often seasonal, so buy against demonstrated retail demand rather than against a scheme offer.',
    ],
    faq: {
      question: 'What is listed under ayurvedic "others"?',
      answer:
        'Formats outside the standard dosage forms — decoctions, medicated ghee preparations, bhasma and combination kits. Each carries its own pack convention, so compare them individually rather than against a category norm.',
    },
  },

  // ── Ethical ────────────────────────────────────────────────────────────
  'ethical:tablet': {
    paragraphs: [
      'Ethical tablets are branded prescription products, so demand follows the prescriber rather than the price. A cheaper alternative brand does not convert unless the doctor writes it.',
      'Trade margins are thinner and more fixed than in generics, and scheduled formulations under price control leave less room again. On most lines the negotiable variable is the scheme, not the rate.',
      'Expiry management carries a real commercial cost here, because slow ethical stock cannot be discounted away the way a generic can — the prescription base either exists or it does not.',
    ],
    faq: {
      question: 'Why do ethical tablet rates vary so little between suppliers?',
      answer:
        'Because these are branded products with fixed trade margins, and scheduled formulations are additionally subject to price control. Suppliers usually compete on scheme and availability rather than on the base rate.',
    },
  },
  'ethical:capsule': {
    paragraphs: [
      'Ethical capsules follow the same prescription-led demand as tablets, with the added constraint that many are modified-release presentations where the brand effectively is the product.',
      'Storage tolerance is lower than for tablets. Capsule shells soften in heat, and a heat-damaged carton of a branded product is a full-value loss rather than something to be cleared at a discount.',
      'Confirm the exact presentation on any quote. The same brand name across SR, ER and DR versions is several SKUs at several rates, and they are not interchangeable in a pharmacy.',
    ],
    faq: {
      question: 'Does the presentation matter when comparing ethical capsule rates?',
      answer:
        'Yes. SR, ER and DR versions of the same brand are separate SKUs at separate rates, so a quote is only comparable once the exact presentation is confirmed.',
    },
  },
  'ethical:syrup': {
    paragraphs: [
      'Ethical syrups are heavily paediatric, so demand is seasonal and prescription-driven, and shortages hurt more than overstock — a pharmacy that cannot fill a paediatric prescription usually loses the whole basket.',
      'Breakage is the dominant cost risk. Partitioned cartons and upright loading are worth more than a point of discount on this line.',
      'Dating deserves closer attention than on tablets. Liquid preparations carry shorter shelf lives and paediatric stock turns in bursts rather than steadily.',
    ],
    faq: {
      question: 'How much stock of ethical syrups should be held?',
      answer:
        'Enough to cover the seasonal peak, but no deeper. Demand arrives in bursts and shelf lives are shorter than for solid forms, so frequent reordering usually beats buying deep on a scheme.',
    },
  },
  'ethical:injection': {
    paragraphs: [
      'Injectables are institutional lines. Hospitals, nursing homes and clinics buy them, and the order pattern is scheduled and bulk rather than retail top-up.',
      'Cold-chain products are a different commercial commitment from ambient injectables. Confirm which a listing is before quoting, because the handling obligation and its cost sit with whoever ships it.',
      'Batch and expiry documentation is scrutinised harder here than anywhere else in the catalogue. Institutional buyers reject consignments on paperwork as readily as on product condition.',
    ],
    faq: {
      question: 'What should be confirmed before ordering injectables in bulk?',
      answer:
        'Whether the product requires cold-chain handling, and what batch and expiry documentation ships with it. Both determine the real cost and whether an institutional buyer will accept the consignment.',
    },
  },
  'ethical:vials': {
    paragraphs: [
      'Vials are ordered against institutional consumption, often in standing quantities, so continuity of supply matters more than a marginal improvement in rate.',
      'Glass breakage in transit is the routine loss on this line. Packing standard and claim policy should be settled before the first consignment rather than after it.',
      'Short-dated vials are a genuine hazard: institutional consumption is steady but rarely fast, and unlike retail there is no discount route to clear stock that is running out of dating.',
    ],
    faq: {
      question: 'Why is dating so important when buying vials?',
      answer:
        'Because institutional consumption is steady rather than fast, and there is no retail discount route to clear short-dated stock. Confirm remaining shelf life before accepting a large lot.',
    },
  },
  'ethical:drops': {
    paragraphs: [
      'Ophthalmic and otic drops are small-value, high-attention lines. Unit prices are low but tolerance for damaged or short-dated stock is effectively nil.',
      'Once-opened life is short for many preparations, which shapes what a pharmacy is willing to hold. Buyers order narrow and often rather than deep.',
      'Seals and secondary packaging are inspected on receipt more closely than in any other form, and dented or loose cartons are usually refused outright.',
    ],
    faq: {
      question: 'Why are drops ordered in small quantities?',
      answer:
        'Short once-opened life and low tolerance for damage. Pharmacies reorder frequently in small lots rather than holding depth, so scheme quantities on this line often go unsold.',
    },
  },
  'ethical:inhaler': {
    paragraphs: [
      'Inhalers are device-plus-formulation products, so substitution is effectively impossible in practice — a patient trained on one device stays with it.',
      'Demand is strongly seasonal and geographically uneven, tracking air quality and cold weather, which makes stocking a local judgement rather than a national one.',
      'Unit values are high relative to most retail lines, so expiry exposure on a slow-moving strength is expensive. Buy against the prescriptions a pharmacy actually sees.',
    ],
    faq: {
      question: 'Can one inhaler brand be substituted for another?',
      answer:
        'Rarely, in commercial terms. The device is part of the product and patients stay with the one they were trained on, so stocking follows the prescriptions written locally rather than the best available rate.',
    },
  },
  'ethical:gel': {
    paragraphs: [
      'Topical gels in the ethical range are mostly pain-management and dermatology lines, with steadier, prescription-anchored movement than most topicals.',
      'Tube sizes proliferate. 15g, 30g and 50g of the same brand are separate SKUs at different per-gram rates, and per-gram is the only honest basis for comparison.',
      'Gels tolerate transit well but not heat. Stock held against a warehouse roof through summer separates, and retail returns it.',
    ],
    faq: {
      question: 'How should gel rates be compared?',
      answer:
        'Per gram. The same brand commonly ships in 15g, 30g and 50g tubes, and a per-tube rate hides which of them is actually cheaper.',
    },
  },
  'ethical:lotion': {
    paragraphs: [
      'Ethical lotions are dermatology lines dispensed against prescription, so movement is specialist-led and concentrated around the practices that prescribe them.',
      'Larger bottle formats dominate the range, which makes freight and leakage a real share of landed cost rather than a rounding error.',
      'Compare per millilitre and confirm the pack on every quote, because the same brand commonly ships in two or three bottle sizes.',
    ],
    faq: {
      question: 'What determines demand for ethical lotions?',
      answer:
        'The prescribing base. These are specialist dermatology lines, so movement concentrates around the practices that write them rather than following general footfall.',
    },
  },
  'ethical:others': {
    paragraphs: [
      'This group holds ethical presentations outside the standard forms — sachets, transdermal products, kits and combination packs among them.',
      'There is no shared pack convention across the group, so each SKU has to be compared on its own terms rather than against a category norm.',
      'Many are specialist lines with a narrow prescriber base. Confirm that demand exists locally before committing to a scheme quantity.',
    ],
    faq: {
      question: 'What is listed under ethical "others"?',
      answer:
        'Branded prescription products in formats outside the standard dosage forms — sachets, transdermal presentations, kits and combination packs. Each is compared on its own pack economics.',
    },
  },

  // ── Generic ────────────────────────────────────────────────────────────
  'generic:tablet': {
    paragraphs: [
      'Generic tablets are where rate competition is sharpest. Several suppliers offer the same salt, and switching between them is a commercial decision rather than a clinical one.',
      'Because substitution is genuinely possible, compare on landed net rate per tablet after scheme and GST. Headline discounts quoted on different pack conventions are not comparable.',
      'Consistency of supply matters more than a one-off rate. A pharmacy that has stocked a generic brand does not want to explain a different pack to the same customer next month.',
    ],
    faq: {
      question: 'What is the right basis for comparing generic tablet rates?',
      answer:
        'Landed net rate per tablet, after scheme and GST. Strips of 10 and 15 coexist across suppliers, so per-strip quotes routinely mislead.',
    },
  },
  'generic:capsule': {
    paragraphs: [
      'Generic capsules compete on rate much as tablets do, but shell type is part of the offer and customers do notice a switch between gelatin and vegetarian variants.',
      'Heat sensitivity makes summer despatch a real cost. Agree damage terms before the order rather than negotiating them after a claim.',
      'Where several suppliers list the same salt and strength, the deciding factors in practice are pack convention and the reliability of the next consignment, not the first rate.',
    ],
    faq: {
      question: 'Beyond rate, what separates two generic capsule suppliers?',
      answer:
        'Pack convention, shell type and whether the second consignment arrives on time. On a substitutable salt those decide repeat business more often than the opening rate does.',
    },
  },
  'generic:syrup': {
    paragraphs: [
      'Generic syrups combine the sharpest price competition in the catalogue with its highest breakage risk, which makes packing quality part of the price rather than separate from it.',
      'Volume conventions vary — 60ml, 100ml and 200ml of the same salt are all common — so normalise to a per-millilitre rate before choosing between suppliers.',
      'Liquid stock ages faster than solid. On a competitive salt it is usually better to reorder more often than to buy deep against a scheme.',
    ],
    faq: {
      question: 'Should generic syrups be bought deep on a scheme?',
      answer:
        'Usually not. Shorter shelf lives and high breakage exposure mean frequent smaller orders normally beat a deep scheme buy, even at a better headline rate.',
    },
  },
  'generic:powder': {
    paragraphs: [
      'Generic powders — oral rehydration salts, reconstitutable preparations and sachet products — sell in high units at low value, so freight and handling matter disproportionately.',
      'Sachet counts per box differ between suppliers of the same product. A box rate means nothing until it has been reduced to a per-sachet rate.',
      'Moisture is the enemy. Caked or hardened sachets are rejected at retail even when comfortably within date.',
    ],
    faq: {
      question: 'How are generic powder rates compared?',
      answer:
        'Per sachet, or per gram for bulk packs. Box counts vary between suppliers, so box-level rates are not comparable.',
    },
  },
  'generic:cream': {
    paragraphs: [
      'Generic creams are dermatology staples with genuine substitution between suppliers, so the rate conversation is real here in a way it is not for branded topicals.',
      'Tube weights vary widely for the same formulation, and per-gram comparison is the only reliable basis.',
      'Creams separate in heat and the damage is visible to the customer, so summer storage and transit conditions are worth asking about explicitly before a large order.',
    ],
    faq: {
      question: 'Why compare generic creams per gram?',
      answer:
        'Because the same formulation ships in several tube weights across suppliers. Per-tube rates hide which is actually cheaper once weight is accounted for.',
    },
  },
  'generic:inhaler': {
    paragraphs: [
      'Generic inhalers face a harder substitution barrier than other generics, because the device rather than the formulation alone is what a patient is accustomed to.',
      'Demand is seasonal and local, so stocking should follow the prescriptions a pharmacy actually sees rather than a national pattern.',
      'Unit values are high, so expiry exposure on a slow strength costs more than the margin earned on several fast ones.',
    ],
    faq: {
      question: 'Do generic inhalers substitute as easily as generic tablets?',
      answer:
        'No. The device is part of the product, so switching is far less straightforward commercially than with an oral solid, even where the formulation is equivalent.',
    },
  },
  'generic:others': {
    paragraphs: [
      'This group covers generic presentations outside the standard forms — kits, sachets, combination packs and medical-use miscellany.',
      'Mixed formats mean there is no shared comparison basis, so each line is judged on its own pack economics.',
      'Movement ranges from staple to occasional, so treat scheme offers on unproven SKUs with more caution than on a known salt.',
    ],
    faq: {
      question: 'What is listed under generic "others"?',
      answer:
        'Generic products in formats outside the standard dosage forms, including kits, sachets and combination packs. Because formats are mixed, each is compared on its own pack economics.',
    },
  },

  // ── Nutraceuticals & Supplements ───────────────────────────────────────
  'nutraceuticals-supplements:tablet': {
    paragraphs: [
      'Supplement tablets are regulated as foods under the FSSAI framework rather than as drugs, which changes labelling and licensing expectations on both sides of the invoice.',
      'Demand is consumer-pull: it follows advertising, season and shelf visibility rather than prescriptions, so only retail-proven SKUs are safe candidates for deep buying.',
      'Bottle counts vary far more than in medicine ranges — 30, 60 and 90 of the same product are routine — so compare per tablet, never per bottle.',
    ],
    faq: {
      question: 'Are supplement tablets regulated like medicines?',
      answer:
        'No. They are regulated as food supplements under the FSSAI framework rather than as drugs, which changes labelling and the licence details a supplier should be able to provide.',
    },
  },
  'nutraceuticals-supplements:capsule': {
    paragraphs: [
      'Supplement capsules — omega, vitamin and herbal-extract softgels — are consumer-driven lines where the label claim is the product, and two similar-sounding SKUs are not interchangeable to a customer.',
      'Softgels are the most heat-sensitive stock in this range. Leakage and sticking in summer transit are common and should be covered by an agreed damage policy.',
      'Shelf lives are shorter than for medicine capsules, so scheme quantities have to be sized against demonstrated retail movement rather than optimism.',
    ],
    faq: {
      question: 'How should scheme quantities be sized on supplement capsules?',
      answer:
        'Against proven retail movement. Shelf lives are shorter than in medicine ranges, so a large scheme lot on an unproven SKU frequently expires before it sells.',
    },
  },
  'nutraceuticals-supplements:powder': {
    paragraphs: [
      'Protein and nutrition powders are the heaviest, highest-value units in the catalogue, and freight is a material part of landed cost rather than a rounding error.',
      'Flavours are separate SKUs with independent movement. A scheme on a slow flavour is not a saving, however good the headline rate looks.',
      'Tub weights differ between brands and packs, so reduce every quote to a per-kilogram rate before comparing suppliers.',
    ],
    faq: {
      question: 'What is the most common mistake when buying supplement powders?',
      answer:
        'Treating flavours as one SKU. They move independently, so a scheme quantity concentrated in a slow flavour ties up money that a per-kilogram rate comparison would have flagged.',
    },
  },
  'nutraceuticals-supplements:syrup': {
    paragraphs: [
      'Supplement syrups and tonics are consumer-pull, seasonally weighted lines, with demand concentrated into specific parts of the year.',
      'They carry the same transit-breakage exposure as medicine syrups but on higher-value units, so packing standards are worth agreeing explicitly.',
      'Dating tends to be tighter than in medicines. Check the manufacturing date and not only the expiry when accepting a large lot.',
    ],
    faq: {
      question: 'What should be checked on a large lot of supplement syrup?',
      answer:
        'The manufacturing date as well as the expiry. Dating is tighter than in medicine ranges, and a lot that is already months old leaves little retail life.',
    },
  },
  'nutraceuticals-supplements:drops': {
    paragraphs: [
      'Supplement drops are largely paediatric vitamin preparations, bought in small, frequent quantities rather than in depth.',
      'Unit values are low and tolerance for damage is nil. Dropper assemblies and seals are inspected on receipt and refused when loose.',
      'Once-opened life is short and customers ask about it, so retail consistently prefers fresh stock over a discounted older lot.',
    ],
    faq: {
      question: 'Why do supplement drops sell in small lots?',
      answer:
        'Short once-opened life and low damage tolerance. Retail buys fresh and often, so discounted older stock tends to sit rather than move.',
    },
  },
  'nutraceuticals-supplements:lotion': {
    paragraphs: [
      'Supplement and cosmeceutical lotions sit at the boundary of pharmacy and personal care, and move on retail visibility rather than on any prescription base.',
      'Pack sizes are consumer-led and vary widely, so per-millilitre comparison is the only meaningful basis.',
      'Leakage in transit is the routine loss on this line, and carton quality is worth more than a marginal improvement in rate.',
    ],
    faq: {
      question: 'What drives demand for supplement lotions?',
      answer:
        'Retail visibility and consumer demand rather than prescriptions, so shelf position and brand recognition matter more than the prescribing base around a pharmacy.',
    },
  },
  'nutraceuticals-supplements:others': {
    paragraphs: [
      'This group holds supplement formats outside the standard forms — effervescent tubes, gummies, sachets, bars and combination packs.',
      'Each carries its own pack economics, so comparison is SKU by SKU rather than against a category norm.',
      'These are the most trend-driven lines in the catalogue. Buy narrow until retail movement is proven, then scale.',
    ],
    faq: {
      question: 'What is listed under supplement "others"?',
      answer:
        'Formats outside the standard dosage forms, including effervescent tubes, gummies, bars, sachets and combination packs. They are the most trend-driven lines in the catalogue, so proven movement should lead the buying.',
    },
  },
};

/** Guidance for one sub-category page, or null when the pair is unknown. */
export function categoryFormGuidance(
  categorySlug: string,
  formSlug: string,
): GuidanceEntry | null {
  return (
    CATEGORY_FORM_GUIDANCE[
      `${categorySlug.toLowerCase()}:${formSlug.toLowerCase()}`
    ] ?? null
  );
}

/** Guidance for one category page, or null when the category is unknown. */
export function categoryGuidance(categorySlug: string): string[] | null {
  return CATEGORY_GUIDANCE[categorySlug.toLowerCase()] ?? null;
}
