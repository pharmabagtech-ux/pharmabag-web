/**
 * Hand-written procurement guidance for the facet landing pages.
 *
 * Purpose: the dosage-form and molecule pages shared near-identical template
 * intros, which reads as thin/manufactured content to search quality systems.
 * Every entry here is genuinely distinct TRADE knowledge — storage, expiry,
 * breakage, pack conventions, movement patterns — the procurement angle this
 * platform is authoritative on.
 *
 * Hard rule, same as everywhere on this site: COMMERCIAL content only. No
 * indications, no dosing, no efficacy claims. A sentence that would need a
 * doctor to review does not belong in this file.
 */

/**
 * Buying guidance per dosage form, keyed by the lowercase form name.
 * Each entry renders as its own "Buying <form> at wholesale" section.
 */
export const FORM_GUIDANCE: Record<string, string[]> = {
  tablet: [
    'Tablets are the workhorse of wholesale pharmacy: long shelf lives, dense packing, and the widest brand competition of any form — which is why net-rate differences between suppliers are usually largest here and worth comparing line by line.',
    'Check the pack convention before comparing rates: strips of 10 and 15 coexist for many brands, and a per-strip quote against a per-tablet quote is the oldest confusion in the trade.',
    'Expiry pressure is lowest in this category, so scheme-heavy large lots are usually safe on fast movers — the working-capital question matters more than the dating.',
  ],
  capsule: [
    'Capsules trade much like tablets but are more sensitive to heat and humidity in storage and transit — softgel fills especially. Reject cartons that arrive deformed or stuck.',
    'Vegetarian-shell variants of common products are increasingly stocked alongside gelatin ones as separate SKUs; confirm which variant a rate refers to before comparing suppliers.',
  ],
  syrup: [
    'Syrups carry the highest transit-breakage risk in the catalogue. Packing quality — partitioned cartons, upright loading — is worth more than a percent of discount, and breakage terms should be agreed before the first large order.',
    'Bottles are heavy relative to value, so freight economics favour consolidated orders; small top-up orders of syrups are disproportionately expensive to ship.',
    'Watch expiry dating more closely than with solids: paediatric movement is seasonal, and a monsoon-season stock decision looks different from a summer one.',
  ],
  injection: [
    'Injections are institutional products first — hospitals, nursing homes and clinics drive the volume — and many require cold-chain handling from the supplier through to your storage.',
    'Confirm cold-chain capability explicitly for any temperature-sensitive item: how it ships, what it ships with, and what condition-on-arrival terms apply. A cheap rate with a broken chain is a written-off carton.',
    'Batch documentation matters more here than anywhere else; keep supplier invoices batch-mapped for recall readiness.',
  ],
  vials: [
    'Vials follow injection economics: institutional demand, sterile handling, and in many cases cold-chain requirements. Order in the multiples your institutional buyers actually indent, not round numbers.',
    'Glass breakage in transit is a real cost — the same packing and condition-on-arrival diligence as syrups applies, with higher unit values at stake.',
  ],
  drops: [
    'Drops span ophthalmic, otic and paediatric oral preparations — small, high-value-per-gram packs where counterfeiting pressure is historically higher, making verified sourcing worth more than in bulk categories.',
    'Multi-dose ophthalmic packs have short in-use lives after opening, which keeps retail demand steady and repeat-driven; they reward reliable re-supply more than deep one-time lots.',
  ],
  cream: [
    'Creams are steady dermatology movers with forgiving storage, but tubes are crush-prone — carton condition on arrival is the main receiving check.',
    'Seasonality is real in this category (fungal preparations peak in humid months); time larger scheme lots to the season rather than the calendar quarter.',
  ],
  ointment: [
    'Ointments store well and move steadily; the procurement questions are pack-size mix (small dispensing tubes vs bulk hospital packs) and tube integrity on receipt.',
  ],
  gel: [
    'Pain-management gels are among the most brand-competitive topicals, with frequent scheme activity — converting each scheme to its effective rate matters more here than list-price comparison.',
  ],
  lotion: [
    'Lotions combine syrup-like breakage risk with topical-category seasonality; prefer suppliers whose packing has proven itself on liquids before committing large lots.',
  ],
  powder: [
    'Powders range from ORS to protein supplements to reconstitutable antibiotics — three different movement patterns in one form. ORS is sharply seasonal, supplements are steady, reconstitutables follow prescription demand.',
    'Moisture is the enemy in storage and transit; damaged outer cartons are grounds to check every inner pack.',
  ],
  inhaler: [
    'Inhalers are pressurised devices with specific storage and transport considerations, and device-plus-refill economics: buyers often standardise on device brands, making refill continuity more valuable than one-off rate wins.',
    'Count-per-device and dose-strength variants multiply SKUs quickly; confirm the exact variant behind every quoted rate.',
  ],
  insulin: [
    'Insulin is the strictest cold-chain category in the general trade: 2–8°C from supplier to your refrigerator, no exceptions, with transit time and packing method confirmed before ordering.',
    'Order sizes should follow your verified cold-storage capacity, not scheme incentives — an MOV-sized lot that exceeds your fridge space is a loss, not a discount.',
    'Pen, cartridge and vial presentations of the same product are distinct SKUs with distinct demand; stock to your prescriber base, not to the rate list.',
  ],
  soap: [
    'Medicated soaps behave like FMCG with a pharmacy channel: high unit volumes, low unit values, and freight-sensitive economics that reward consolidated ordering.',
  ],
  lozenges: [
    'Lozenges are sharply seasonal around winter and monsoon coughs; the trade discipline is buying ahead of the season at scheme rates and avoiding deep stock in the off-season.',
  ],
  suppository: [
    'Suppositories are heat-sensitive — softening in transit is the classic complaint — so summer shipments deserve the same condition-on-arrival scrutiny as cold-chain items.',
  ],
  paste: [
    'Dental and dermatological pastes are low-velocity, steady lines; the procurement question is usually pack-size mix rather than rate, since brand competition is thinner than in mainstream topicals.',
  ],
  pfs: [
    'Pre-filled syringes are premium institutional items: sterile, often cold-chain, and ordered against specific institutional demand rather than shelf stock. Verify handling capability end-to-end before first purchase.',
  ],
  shampoo: [
    'Medicated shampoos straddle pharmacy and personal-care demand; movement is steady and storage forgiving, making them safe candidates for scheme-lot buying when the rate is right.',
  ],
};

/**
 * Procurement-angle copy per therapeutic class, for the molecule pages.
 * One entry per distinct `therapeuticClass` in the MOLECULES data. These are
 * COMMERCIAL observations about how the class trades — never clinical ones.
 */
export const CLASS_GUIDANCE: Record<string, string> = {
  'Analgesic and anti-inflammatory':
    'Analgesics are the highest-rotation category in most retail pharmacies, with intense brand competition and near-continuous scheme activity. That makes them the category where converting every scheme to an effective net rate — and re-checking your primary supplier against the market regularly — pays off most.',
  Antibiotic:
    'Antibiotics are prescription-driven with demand that tracks seasons and local prescribing patterns. Most are Schedule H, so dispensing records matter — and on the buying side, expiry discipline is critical because demand for a specific molecule can shift with prescriber preference faster than a deep lot clears.',
  'Cardiovascular and antihypertensive':
    'Cardiac and antihypertensive therapy is chronic, repeat-purchase demand — the steadiest volume in the trade. Patients stay on specific brands for years, so continuity of a brand at a stable rate is worth more than switching suppliers for a short-term discount.',
  Antidiabetic:
    'Antidiabetics share the chronic-therapy pattern: predictable monthly volumes and strong brand loyalty. This is a category to concentrate with a reliable supplier and buy on schemes confidently, because movement is the most forecastable in the pharmacy.',
  'Central nervous system':
    'CNS products are tightly prescription-bound, and several molecules in the class fall under Schedule H1 with its register requirements. Buy strictly to prescriber demand; this is not a category for speculative scheme lots.',
  Gastrointestinal:
    'Gastrointestinal products mix chronic therapy (acid suppressants) with acute demand (antidiarrhoeals, antiemetics). The chronic half behaves like cardiac — steady and forecastable; the acute half is seasonal and rewards pre-season stocking.',
  Respiratory:
    'Respiratory demand is the most weather-driven in the catalogue, peaking with winters, monsoons and pollution episodes. The trade discipline is anticipating the season at scheme rates without carrying deep stock through the trough.',
  'Antifungal and antiparasitic':
    'Antifungals surge in humid months and antiparasitics follow deworming cycles and regional patterns. Both reward calendar-aware buying over steady-state replenishment.',
  'Antihistamine and anti-allergic':
    'Anti-allergics carry two demand curves: perennial baseline plus seasonal spikes. Fast-moving OTC-adjacent brands in this class are frequent scheme vehicles, so effective-rate comparison across suppliers is usually fruitful.',
  Corticosteroid:
    'Corticosteroids span oral, topical and inhaled presentations with very different movement patterns — treat each form as its own stocking decision rather than a single class. Prescription discipline applies throughout.',
  'Lipid-lowering and antiplatelet':
    'Statins and antiplatelets are lifelong-therapy products: high repeat rates, strong brand stickiness, and steady volumes that justify concentrating purchases to earn better schemes.',
  'Urology and hormone therapy':
    'Urology and hormone products are specialist-prescription driven with narrower but loyal demand. Stock follows your local prescriber base; broad speculative stocking rarely pays.',
  'Haematology and metabolic':
    'Haematinics and metabolic products include both prescription therapy and supplement-adjacent demand. The supplement-adjacent half trades on schemes like nutraceuticals; the therapy half follows prescriber demand.',
  Antiviral:
    'Antiviral demand is episodic — outbreak- and season-linked — which makes expiry dating the first check before any large lot, and supplier re-supply speed more valuable than deep stock.',
  'Muscle relaxant and antispasmodic':
    'Often co-prescribed with analgesics, this class rides the same high-rotation dynamics: frequent schemes, wide brand fields, and real gains from systematic net-rate comparison.',
  'Nutraceutical and supplement':
    'Nutraceuticals carry the widest margins and the most aggressive schemes in the catalogue — and correspondingly wide net-rate spreads between suppliers. This is the class where marketplace comparison consistently finds the biggest differences.',
};

// State supply-landscape notes live directly in `data/locations.ts` (the
// `note` field) — every state now has one; this file covers forms + classes.
