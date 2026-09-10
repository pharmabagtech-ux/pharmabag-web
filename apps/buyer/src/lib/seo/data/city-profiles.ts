/**
 * Pharmaceutical trade profiles for the cities that carry a landing page.
 *
 * WHY THIS FILE EXISTS
 *
 * The brand x city pages were measured at **90.8% identical** to their
 * siblings: `/brands/cipla/mumbai` and `/brands/cipla/kolkata` differed only by
 * the city name, the state name and one clause, over an otherwise identical
 * page — including an identical product list. The state x city pages were 92%
 * identical to each other. That is Google's definition of a doorway page:
 * substantially similar pages generated per location to funnel visitors.
 *
 * The fix has to be real substance, not more synonyms. Each profile below is
 * about the city's actual role in the Indian pharmaceutical trade — the market
 * its wholesalers trade from, the authority that licenses them, and the region
 * supplied onward from it. Those facts differ genuinely between Mumbai and
 * Kolkata, which is exactly what the old copy did not.
 *
 * WHAT IS DELIBERATELY NOT HERE
 *
 * Nothing about PharmaBag's own operations per city: no supplier counts, no
 * delivery-time promises, no local pricing. The platform does not hold
 * city-level inventory or city-level supplier data, so any such claim would be
 * invented — which is worse than a duplicate page, not better.
 *
 * 🚩 The market names are trade context and should be sanity-checked by
 * someone who knows the wholesale trade before this is treated as settled.
 * They are optional in the type precisely so a doubtful one can be dropped
 * without losing the rest of the profile.
 *
 * A city WITHOUT a profile gets `noindex` on its location page — see
 * `app/wholesale-medicine-suppliers/[stateSlug]/[citySlug]/page.tsx`. That is
 * the honest position: if there is nothing distinct to say about a city yet,
 * the page should not compete in the index. Adding a profile here re-indexes
 * it automatically, with no other change.
 */

export interface CityProfile {
  /**
   * The wholesale medicine market the city's trade is known for. Optional —
   * plenty of cities have no single named market, and inventing one would
   * defeat the point of this file.
   */
  market?: string;
  /** What the city does in the pharmaceutical trade. Used in the opening. */
  role: string;
  /** The territory typically supplied onward from this city. */
  serves?: string;
  /** The authority that issues wholesale drug licences to buyers here. */
  regulator: string;
  /** A true note on what local demand is shaped by. */
  demand?: string;
}

export const CITY_PROFILES: Record<string, CityProfile> = {
  mumbai: {
    market: 'the Princess Street and Bhuleshwar wholesale medicine market',
    role: "India's primary pharmaceutical trading and import gateway, and the head-office base for much of the listed pharma industry",
    serves: 'the Konkan belt and western Maharashtra',
    regulator: 'the Maharashtra Food and Drug Administration',
    demand:
      'a dense hospital and retail chain network, which keeps demand weighted towards fast-moving chronic and acute therapies',
  },
  'new-delhi': {
    market: 'Bhagirath Palace, one of Asia’s largest wholesale medicine markets',
    role: 'the pricing benchmark for wholesale medicine across northern India',
    serves: 'the NCR, western Uttar Pradesh, Haryana and Punjab',
    regulator: 'the Drugs Control Department, Government of NCT of Delhi',
    demand:
      'a very high concentration of institutional and government purchasing alongside the retail trade',
  },
  kolkata: {
    market: 'the Bagri Market and Canning Street wholesale drug trade',
    role: 'the distribution centre for eastern India and the gateway to the north-east',
    serves: 'West Bengal, Odisha, Bihar, Jharkhand and the north-eastern states',
    regulator: 'the Directorate of Drugs Control, West Bengal',
    demand:
      'a large share of onward redistribution, so order sizes skew towards full packs and bulk lots',
  },
  chennai: {
    market: 'the Broadway and Park Town wholesale drug market',
    role: 'the trade hub for Tamil Nadu and a major southern distribution centre',
    serves: 'Tamil Nadu, Puducherry and parts of Andhra Pradesh and Kerala',
    regulator: 'the Tamil Nadu Drugs Control Department',
    demand:
      'a strong multi-speciality hospital base, which lifts demand for injectables and hospital-use formulations',
  },
  bengaluru: {
    market: 'the Sultanpet and Avenue Road pharmaceutical market',
    role: "Karnataka's principal wholesale trading centre",
    serves: 'Karnataka and parts of Andhra Pradesh and Tamil Nadu',
    regulator: 'the Karnataka Drugs Control Department',
    demand:
      'a fast-growing organised pharmacy chain presence alongside the traditional wholesale trade',
  },
  hyderabad: {
    market: 'the Koti and Ranigunj wholesale medicine market',
    role: 'a major trading centre sitting next to one of India’s largest bulk-drug and API manufacturing clusters',
    serves: 'Telangana and parts of Andhra Pradesh, Karnataka and Maharashtra',
    regulator: 'the Telangana Drugs Control Administration',
    demand:
      'proximity to manufacturing, which shortens the supply chain for a wide range of molecules',
  },
  ahmedabad: {
    market: 'the Madhupura wholesale medicine market',
    role: 'the trade centre of a state that manufactures a substantial share of India’s formulations and APIs',
    serves: 'Gujarat, and onward into Rajasthan and Madhya Pradesh',
    regulator: 'the Gujarat Food and Drug Control Administration',
    demand:
      'a manufacturing base close at hand, so local buyers often source directly from producing units',
  },
  pune: {
    market: 'the Bhavani Peth wholesale drug market',
    role: 'a formulation manufacturing and institutional supply centre',
    serves: 'western Maharashtra and the Marathwada belt',
    regulator: 'the Maharashtra Food and Drug Administration',
    demand:
      'a heavy hospital, teaching-institution and corporate-clinic presence, which weights demand towards institutional packs',
  },
  lucknow: {
    market: 'the Aminabad wholesale drug market',
    role: 'the distribution centre for central and eastern Uttar Pradesh',
    serves: 'central and eastern Uttar Pradesh',
    regulator: 'the Uttar Pradesh Food Safety and Drug Administration',
    demand:
      'a wide rural retail catchment served through sub-distributors, so pack economics matter more than speed',
  },
  jaipur: {
    market: 'the Ramganj Bazaar wholesale drug trade',
    role: "Rajasthan's main wholesale medicine trading centre",
    serves: 'eastern Rajasthan and the Shekhawati region',
    regulator: 'the Rajasthan Drugs Control Organisation',
    demand:
      'long onward delivery distances across a large, thinly populated state, which favours consolidated bulk orders',
  },
  indore: {
    market: 'the Sitlamata Bazaar wholesale medicine market',
    role: 'the commercial and pharmaceutical distribution hub of Madhya Pradesh',
    serves: 'the Malwa region and much of western Madhya Pradesh',
    regulator: 'the Madhya Pradesh Food and Drug Administration',
    demand:
      'a redistribution role into smaller Madhya Pradesh towns, so full-case buying is common',
  },
  patna: {
    market: 'the Govind Mitra Road wholesale drug market',
    role: "Bihar's principal medicine trading centre",
    serves: 'most of Bihar and parts of eastern Uttar Pradesh',
    regulator: 'the Bihar Drugs Control Administration',
    demand:
      'a large rural pharmacy network supplied through district sub-stockists',
  },
  guwahati: {
    market: 'the Fancy Bazaar wholesale trade',
    role: 'the gateway through which most pharmaceutical supply reaches the north-eastern states',
    serves: 'Assam and the seven north-eastern states',
    regulator: 'the Assam Drugs Control Organisation',
    demand:
      'long, single-corridor logistics into the north-east, which makes order consolidation unusually important',
  },
  chandigarh: {
    market: 'the Sector 26 wholesale market',
    role: 'the trading centre serving the Punjab, Haryana and Himachal tri-state region',
    serves: 'Punjab, Haryana, Himachal Pradesh and Jammu',
    regulator: 'the Chandigarh Administration drugs control wing',
    demand:
      'a tri-state catchment, so buyers frequently hold licences valid in more than one jurisdiction',
  },

  /* Manufacturing clusters — traded differently from consumption markets. */
  baddi: {
    role: "one of India's largest formulation manufacturing clusters, built up under the hill-state excise incentives",
    serves: 'manufacturing supply outward to the whole country',
    regulator: 'the Himachal Pradesh Drugs Control Administration',
    demand:
      'proximity to production rather than local consumption, so buying here is usually about sourcing at origin',
  },
  haridwar: {
    role: 'a pharmaceutical manufacturing centre grown around the SIDCUL industrial estate',
    serves: 'Uttarakhand and western Uttar Pradesh, plus outward manufacturing supply',
    regulator: 'the Uttarakhand Food Safety and Drug Administration',
    demand: 'an industrial base that supplies national brands rather than only local retail',
  },
  ankleshwar: {
    role: 'a bulk drug and chemical manufacturing cluster in the Gujarat industrial belt',
    serves: 'API and intermediate supply into formulation units nationally',
    regulator: 'the Gujarat Food and Drug Control Administration',
    demand: 'industrial buyers and formulators rather than a retail pharmacy trade',
  },
  siliguri: {
    role: 'the corridor town through which supply passes into the north-east, Sikkim and the hill districts',
    serves: 'north Bengal, Sikkim, and onward to the north-eastern states',
    regulator: 'the Directorate of Drugs Control, West Bengal',
    demand: 'transit and redistribution, so stock turns quickly and in whole cases',
  },
  nagpur: {
    role: 'the distribution gateway for Vidarbha and central India',
    serves: 'Vidarbha, and parts of Madhya Pradesh, Chhattisgarh and Telangana',
    regulator: 'the Maharashtra Food and Drug Administration',
    demand:
      'a central position on the national road network, which makes it a natural consolidation point',
  },
};

/** The profile for a city slug, when one has been written. */
export function cityProfile(slug: string): CityProfile | undefined {
  return CITY_PROFILES[slug];
}
