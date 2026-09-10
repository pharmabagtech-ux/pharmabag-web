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
 * COVERAGE
 *
 * All 90 cities in `data/locations.ts` are profiled — there is a test-free but
 * exact invariant here: every city slug in that file must have an entry, and
 * every entry must match a city. Nothing is deindexed for want of content.
 *
 * The index gate still exists (`Boolean(profile) || hasWrittenContent`) and
 * still works: it now simply never fires, because no city is missing. It stays
 * because adding a city to `locations.ts` without writing its profile should
 * not silently publish another duplicate — it should keep the new page out of
 * the index until someone writes it.
 *
 * 🚩 WHAT IS ACCURATE HERE, AND WHAT NEEDS CHECKING
 *
 * The state licensing authorities and the geography (which region a city
 * supplies) are the parts to trust most. The named markets are the parts to
 * verify — see the flag above. Note that the NCR entries deliberately do NOT
 * all name the Delhi regulator: Noida and Ghaziabad are licensed by Uttar
 * Pradesh, Gurugram and Faridabad by Haryana, and telling a buyer otherwise
 * would be a compliance error, not just a copy error.
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

  /* ---------------------------------------------------------------------
     Maharashtra
     --------------------------------------------------------------------- */
  nashik: {
    role: 'a formulation manufacturing centre and the trade hub for north Maharashtra',
    serves: 'Nashik, Dhule, Jalgaon and the Khandesh belt',
    regulator: 'the Maharashtra Food and Drug Administration',
    demand: 'a mix of resident district demand and large seasonal pilgrimage influxes',
  },
  aurangabad: {
    role: 'the commercial centre of Marathwada, with a pharmaceutical and engineering industrial belt around it',
    serves: 'the Marathwada districts',
    regulator: 'the Maharashtra Food and Drug Administration',
    demand: 'a district hospital network supplied from the city rather than from Mumbai',
  },
  thane: {
    role: 'a dense urban market immediately adjoining the Mumbai trade',
    serves: 'Thane district and the northern Mumbai metropolitan region',
    regulator: 'the Maharashtra Food and Drug Administration',
    demand: 'high-frequency retail pharmacy replenishment rather than long-haul redistribution',
  },

  /* ---------------------------------------------------------------------
     Delhi NCR — note the licensing authority is NOT Delhi's for all of these
     --------------------------------------------------------------------- */
  noida: {
    role: 'a planned industrial and corporate centre on the Uttar Pradesh side of the NCR',
    serves: 'Gautam Buddh Nagar and western Uttar Pradesh',
    regulator: 'the Uttar Pradesh Food Safety and Drug Administration',
    demand: 'corporate clinics and private hospital groups alongside the retail trade',
  },
  gurugram: {
    role: 'the NCR’s private healthcare concentration, with several of north India’s largest tertiary hospitals',
    serves: 'Gurugram and southern Haryana',
    regulator: 'the Haryana Food and Drug Administration',
    demand: 'tertiary hospital procurement, which weights demand towards specialist and injectable lines',
  },
  faridabad: {
    role: 'an industrial city on the Haryana edge of the NCR',
    serves: 'Faridabad and Palwal',
    regulator: 'the Haryana Food and Drug Administration',
    demand: 'a large industrial workforce served through employer and ESI-linked facilities',
  },
  ghaziabad: {
    role: 'a dense industrial and residential district on the Uttar Pradesh side of the NCR',
    serves: 'Ghaziabad, Hapur and the western Uttar Pradesh approach to Delhi',
    regulator: 'the Uttar Pradesh Food Safety and Drug Administration',
    demand: 'high-volume retail pharmacy demand feeding off the Delhi wholesale price benchmark',
  },

  /* ---------------------------------------------------------------------
     West Bengal
     --------------------------------------------------------------------- */
  howrah: {
    role: 'the industrial twin of Kolkata and one of the country’s major rail gateways',
    serves: 'Howrah and Hooghly',
    regulator: 'the Directorate of Drugs Control, West Bengal',
    demand: 'onward movement by rail as much as local consumption',
  },
  durgapur: {
    role: 'a steel and heavy-industry town in the Bardhaman industrial belt',
    serves: 'Paschim Bardhaman and the surrounding industrial townships',
    regulator: 'the Directorate of Drugs Control, West Bengal',
    demand: 'industrial township healthcare and company-run hospitals',
  },
  asansol: {
    role: 'the commercial centre of the coal and steel belt on the Jharkhand border',
    serves: 'the Asansol-Durgapur belt and adjoining Jharkhand districts',
    regulator: 'the Directorate of Drugs Control, West Bengal',
    demand: 'cross-border trade into Jharkhand alongside local retail',
  },

  /* ---------------------------------------------------------------------
     Gujarat
     --------------------------------------------------------------------- */
  surat: {
    role: 'a very large textile and diamond manufacturing city with a correspondingly dense retail pharmacy network',
    serves: 'south Gujarat',
    regulator: 'the Gujarat Food and Drug Control Administration',
    demand: 'a big migrant industrial workforce, which keeps volumes high and pack sizes small',
  },
  vadodara: {
    role: 'a chemical and petrochemical manufacturing centre in central Gujarat',
    serves: 'central Gujarat',
    regulator: 'the Gujarat Food and Drug Control Administration',
    demand: 'industrial occupational health provision alongside the ordinary retail trade',
  },
  rajkot: {
    role: 'the commercial and engineering hub of Saurashtra',
    serves: 'the Saurashtra districts',
    regulator: 'the Gujarat Food and Drug Control Administration',
    demand: 'redistribution into a wide belt of smaller Saurashtra towns',
  },

  /* ---------------------------------------------------------------------
     Tamil Nadu
     --------------------------------------------------------------------- */
  coimbatore: {
    role: 'the industrial capital of western Tamil Nadu and a major private hospital centre',
    serves: 'western Tamil Nadu and the Kerala border districts',
    regulator: 'the Tamil Nadu Drugs Control Department',
    demand: 'a large multi-speciality hospital base drawing patients from two states',
  },
  madurai: {
    role: 'the medical and commercial centre of southern Tamil Nadu',
    serves: 'the southern Tamil Nadu districts',
    regulator: 'the Tamil Nadu Drugs Control Department',
    demand: 'referral hospitals serving a wide rural catchment',
  },
  trichy: {
    role: 'a central Tamil Nadu trading and transport junction',
    serves: 'Tiruchirappalli and the Cauvery delta districts',
    regulator: 'the Tamil Nadu Drugs Control Department',
    demand: 'district-level redistribution across the delta',
  },
  salem: {
    role: 'a steel and textile centre in north-western Tamil Nadu',
    serves: 'Salem, Namakkal and Dharmapuri',
    regulator: 'the Tamil Nadu Drugs Control Department',
    demand: 'an industrial workforce and a dense network of small-town pharmacies',
  },

  /* ---------------------------------------------------------------------
     Karnataka
     --------------------------------------------------------------------- */
  mysuru: {
    role: 'a formulation manufacturing and institutional centre in southern Karnataka',
    serves: 'southern Karnataka',
    regulator: 'the Karnataka Drugs Control Department',
    demand: 'teaching hospitals and a manufacturing base within the district',
  },
  hubballi: {
    role: 'the commercial hub of north Karnataka',
    serves: 'the Dharwad, Haveri and Gadag belt',
    regulator: 'the Karnataka Drugs Control Department',
    demand: 'redistribution across north Karnataka, which is served from here rather than Bengaluru',
  },
  mangaluru: {
    role: 'a coastal port city and one of the region’s densest concentrations of medical education',
    serves: 'Dakshina Kannada, Udupi and the northern Kerala border',
    regulator: 'the Karnataka Drugs Control Department',
    demand: 'teaching hospitals and referral centres that draw patients across the state border',
  },
  belagavi: {
    role: 'a medical education centre on the Maharashtra border',
    serves: 'Belagavi and the adjoining Maharashtra border districts',
    regulator: 'the Karnataka Drugs Control Department',
    demand: 'referral hospitals serving patients from two states',
  },

  /* ---------------------------------------------------------------------
     Telangana
     --------------------------------------------------------------------- */
  warangal: {
    role: 'the second city of Telangana and the trade centre for its northern districts',
    serves: 'northern and eastern Telangana',
    regulator: 'the Telangana Drugs Control Administration',
    demand: 'a government medical college and a wide rural referral catchment',
  },
  nizamabad: {
    role: 'a district trading centre in northern Telangana',
    serves: 'Nizamabad and the Maharashtra border districts',
    regulator: 'the Telangana Drugs Control Administration',
    demand: 'agricultural-belt retail pharmacies supplied through district stockists',
  },

  /* ---------------------------------------------------------------------
     Uttar Pradesh
     --------------------------------------------------------------------- */
  kanpur: {
    role: 'the industrial centre of Uttar Pradesh and a long-established trading city',
    serves: 'central Uttar Pradesh',
    regulator: 'the Uttar Pradesh Food Safety and Drug Administration',
    demand: 'a large industrial population and a dense old-city retail trade',
  },
  varanasi: {
    role: 'the medical and commercial centre of eastern Uttar Pradesh',
    serves: 'eastern Uttar Pradesh and the Bihar border districts',
    regulator: 'the Uttar Pradesh Food Safety and Drug Administration',
    demand: 'a major teaching hospital drawing referrals from two states',
  },
  agra: {
    role: 'the trade centre of western Uttar Pradesh',
    serves: 'the Agra division and the Rajasthan border',
    regulator: 'the Uttar Pradesh Food Safety and Drug Administration',
    demand: 'district hospitals and a steady non-resident patient flow',
  },
  prayagraj: {
    role: 'an administrative and medical centre for central Uttar Pradesh',
    serves: 'the Prayagraj division',
    regulator: 'the Uttar Pradesh Food Safety and Drug Administration',
    demand: 'institutional purchasing and periodic very large pilgrimage influxes',
  },
  meerut: {
    role: 'a manufacturing and trading city in western Uttar Pradesh',
    serves: 'the Meerut division and the upper Doab',
    regulator: 'the Uttar Pradesh Food Safety and Drug Administration',
    demand: 'proximity to the Delhi wholesale market, against which local rates are benchmarked',
  },

  /* ---------------------------------------------------------------------
     Rajasthan
     --------------------------------------------------------------------- */
  jodhpur: {
    role: 'the trade and referral centre of western Rajasthan',
    serves: 'the Marwar region and the desert districts',
    regulator: 'the Rajasthan Drugs Control Organisation',
    demand: 'a tertiary referral hospital serving a very large, thinly populated catchment',
  },
  udaipur: {
    role: 'the commercial centre of southern Rajasthan',
    serves: 'the Mewar region and the Gujarat border districts',
    regulator: 'the Rajasthan Drugs Control Organisation',
    demand: 'referral hospitals serving tribal and hill districts with limited local supply',
  },
  kota: {
    role: 'the trading centre of south-eastern Rajasthan',
    serves: 'the Hadoti region',
    regulator: 'the Rajasthan Drugs Control Organisation',
    demand: 'an unusually large transient student population alongside district demand',
  },

  /* ---------------------------------------------------------------------
     Bihar
     --------------------------------------------------------------------- */
  gaya: {
    role: 'a district trading centre and a major pilgrimage destination in south Bihar',
    serves: 'the Magadh division',
    regulator: 'the Bihar Drugs Control Administration',
    demand: 'district retail supply plus seasonal international pilgrimage traffic',
  },
  muzaffarpur: {
    role: 'the commercial centre of north Bihar',
    serves: 'the Tirhut division and the districts towards the Nepal border',
    regulator: 'the Bihar Drugs Control Administration',
    demand: 'sub-stockist redistribution across a large rural catchment',
  },

  /* ---------------------------------------------------------------------
     Punjab
     --------------------------------------------------------------------- */
  ludhiana: {
    role: 'the largest industrial city in Punjab and a major medical referral centre',
    serves: 'the Malwa region of Punjab',
    regulator: 'the Punjab Food and Drug Administration',
    demand: 'a large industrial workforce and a long-established referral hospital',
  },
  amritsar: {
    role: 'a border trading city and pilgrimage centre in north-west Punjab',
    serves: 'the Majha region',
    regulator: 'the Punjab Food and Drug Administration',
    demand: 'a very high visitor footfall on top of resident district demand',
  },
  jalandhar: {
    role: 'a manufacturing and trading centre in the Doaba region',
    serves: 'the Doaba districts',
    regulator: 'the Punjab Food and Drug Administration',
    demand: 'sports-goods and light manufacturing employment alongside retail pharmacy',
  },
  mohali: {
    role: 'a pharmaceutical and biotech manufacturing cluster adjoining Chandigarh',
    serves: 'the Chandigarh tri-city region and adjoining Punjab districts',
    regulator: 'the Punjab Food and Drug Administration',
    demand: 'proximity to production, so buyers here often source close to origin',
  },

  /* ---------------------------------------------------------------------
     Haryana
     --------------------------------------------------------------------- */
  panchkula: {
    role: 'the Haryana corner of the Chandigarh tri-city region',
    serves: 'Panchkula and the Himachal border approach',
    regulator: 'the Haryana Food and Drug Administration',
    demand: 'a tri-city catchment shared with Chandigarh and Mohali',
  },
  karnal: {
    role: 'an agricultural trading centre on the main north Indian highway corridor',
    serves: 'Karnal, Kaithal and Kurukshetra',
    regulator: 'the Haryana Food and Drug Administration',
    demand: 'rural retail supplied through district stockists',
  },
  hisar: {
    role: 'the trade centre of western Haryana',
    serves: 'the Hisar division and the Rajasthan border districts',
    regulator: 'the Haryana Food and Drug Administration',
    demand: 'long delivery distances across a dispersed rural catchment',
  },
  ambala: {
    role: 'a long-established transport and wholesale junction in northern Haryana',
    serves: 'Ambala and the approaches to Punjab and Himachal Pradesh',
    regulator: 'the Haryana Food and Drug Administration',
    demand: 'transit trade as much as local consumption',
  },

  /* ---------------------------------------------------------------------
     Kerala
     --------------------------------------------------------------------- */
  kochi: {
    role: 'the commercial capital of Kerala and its main port city',
    serves: 'central Kerala',
    regulator: 'the Kerala Drugs Control Department',
    demand: 'a high private hospital concentration and one of India’s highest per-capita medicine consumption profiles',
  },
  thiruvananthapuram: {
    role: 'the state capital and a major medical education and referral centre',
    serves: 'southern Kerala',
    regulator: 'the Kerala Drugs Control Department',
    demand: 'government institutional purchasing alongside a strong private hospital sector',
  },
  kozhikode: {
    role: 'the commercial centre of the Malabar coast',
    serves: 'the northern Kerala districts',
    regulator: 'the Kerala Drugs Control Department',
    demand: 'referral hospitals serving Malabar and the Karnataka border',
  },
  thrissur: {
    role: 'a trading and medical education centre in central Kerala',
    serves: 'Thrissur and the adjoining central Kerala districts',
    regulator: 'the Kerala Drugs Control Department',
    demand: 'teaching hospitals and a dense co-operative pharmacy network',
  },

  /* ---------------------------------------------------------------------
     Andhra Pradesh
     --------------------------------------------------------------------- */
  visakhapatnam: {
    role: 'a port city sitting alongside one of India’s largest bulk drug manufacturing belts',
    serves: 'north coastal Andhra Pradesh and the Odisha border districts',
    regulator: 'the Andhra Pradesh Drugs Control Administration',
    demand: 'proximity to API manufacturing and a large port-linked industrial workforce',
  },
  vijayawada: {
    role: 'the commercial and distribution centre of coastal Andhra Pradesh',
    serves: 'the Krishna and Guntur delta districts',
    regulator: 'the Andhra Pradesh Drugs Control Administration',
    demand: 'redistribution across the delta, so stock moves in full cases',
  },
  guntur: {
    role: 'a major agricultural trading centre in the delta region',
    serves: 'Guntur, Palnadu and Bapatla',
    regulator: 'the Andhra Pradesh Drugs Control Administration',
    demand: 'a rural retail network supplied through town-level stockists',
  },
  tirupati: {
    role: 'a pilgrimage and medical education centre in Rayalaseema',
    serves: 'the Rayalaseema districts and the Tamil Nadu border',
    regulator: 'the Andhra Pradesh Drugs Control Administration',
    demand: 'very large visitor volumes on top of institutional hospital purchasing',
  },

  /* ---------------------------------------------------------------------
     Odisha
     --------------------------------------------------------------------- */
  bhubaneswar: {
    role: 'the state capital and Odisha’s principal medical and distribution centre',
    serves: 'central and coastal Odisha',
    regulator: 'the Odisha Drugs Control Administration',
    demand: 'a concentration of tertiary hospitals drawing referrals from across the state',
  },
  cuttack: {
    role: 'the historic commercial capital of Odisha and its oldest medical centre',
    serves: 'coastal Odisha',
    regulator: 'the Odisha Drugs Control Administration',
    demand: 'a large government referral hospital and an established wholesale trade',
  },
  rourkela: {
    role: 'a steel township in northern Odisha on the Jharkhand border',
    serves: 'Sundargarh and the adjoining Jharkhand districts',
    regulator: 'the Odisha Drugs Control Administration',
    demand: 'company-run industrial healthcare alongside district retail',
  },

  /* ---------------------------------------------------------------------
     Assam
     --------------------------------------------------------------------- */
  dibrugarh: {
    role: 'the commercial and medical centre of upper Assam',
    serves: 'upper Assam and the approaches to Arunachal Pradesh',
    regulator: 'the Assam Drugs Control Organisation',
    demand: 'a teaching hospital serving tea-belt districts with limited local supply',
  },
  silchar: {
    role: 'the trade centre of the Barak valley',
    serves: 'the Barak valley and the routes into Mizoram and Tripura',
    regulator: 'the Assam Drugs Control Organisation',
    demand: 'onward supply into hill states reached through a single road corridor',
  },

  /* ---------------------------------------------------------------------
     Jharkhand
     --------------------------------------------------------------------- */
  ranchi: {
    role: 'the state capital and Jharkhand’s main medical referral centre',
    serves: 'central Jharkhand',
    regulator: 'the Jharkhand drugs control directorate',
    demand: 'state referral hospitals serving a largely rural and tribal catchment',
  },
  jamshedpur: {
    role: 'a planned industrial city built around steel manufacturing',
    serves: 'eastern Jharkhand and the West Bengal border',
    regulator: 'the Jharkhand drugs control directorate',
    demand: 'company-run hospitals and an industrial workforce with employer healthcare',
  },
  dhanbad: {
    role: 'the commercial centre of the coal belt',
    serves: 'Dhanbad, Bokaro and the adjoining coalfield districts',
    regulator: 'the Jharkhand drugs control directorate',
    demand: 'occupational health provision across the coalfields',
  },

  /* ---------------------------------------------------------------------
     Chhattisgarh
     --------------------------------------------------------------------- */
  raipur: {
    role: 'the state capital and Chhattisgarh’s principal distribution and referral centre',
    serves: 'central Chhattisgarh and the districts towards Odisha',
    regulator: 'the Chhattisgarh Food and Drug Administration',
    demand: 'tertiary hospitals serving a wide and largely rural state',
  },
  bhilai: {
    role: 'a steel township adjoining Durg in central Chhattisgarh',
    serves: 'the Durg-Bhilai industrial belt',
    regulator: 'the Chhattisgarh Food and Drug Administration',
    demand: 'a company hospital system alongside township retail',
  },
  bilaspur: {
    role: 'a rail and administrative centre for northern Chhattisgarh',
    serves: 'the northern Chhattisgarh districts',
    regulator: 'the Chhattisgarh Food and Drug Administration',
    demand: 'district redistribution supported by a major rail junction',
  },

  /* ---------------------------------------------------------------------
     Madhya Pradesh
     --------------------------------------------------------------------- */
  bhopal: {
    role: 'the state capital and a medical referral centre for central Madhya Pradesh',
    serves: 'central Madhya Pradesh',
    regulator: 'the Madhya Pradesh Food and Drug Administration',
    demand: 'government institutional purchasing alongside a growing private hospital sector',
  },
  jabalpur: {
    role: 'the trade and referral centre for the Mahakoshal region',
    serves: 'Mahakoshal and the eastern Madhya Pradesh districts',
    regulator: 'the Madhya Pradesh Food and Drug Administration',
    demand: 'a medical college drawing referrals from a wide, largely rural catchment',
  },
  gwalior: {
    role: 'the commercial centre of northern Madhya Pradesh',
    serves: 'the Gwalior-Chambal region and the Uttar Pradesh border districts',
    regulator: 'the Madhya Pradesh Food and Drug Administration',
    demand: 'cross-border trade towards Uttar Pradesh alongside district retail',
  },

  /* ---------------------------------------------------------------------
     Uttarakhand
     --------------------------------------------------------------------- */
  dehradun: {
    role: 'the state capital and the trade centre for the Garhwal region',
    serves: 'Garhwal and the hill districts above it',
    regulator: 'the Uttarakhand Food Safety and Drug Administration',
    demand: 'hill-district supply that is consolidated here before moving upward',
  },
  haldwani: {
    role: 'the commercial gateway to the Kumaon hills',
    serves: 'Kumaon and the hill districts of eastern Uttarakhand',
    regulator: 'the Uttarakhand Food Safety and Drug Administration',
    demand: 'consolidation for onward movement into hill towns with difficult access',
  },

  /* ---------------------------------------------------------------------
     Himachal Pradesh
     --------------------------------------------------------------------- */
  solan: {
    role: 'the district that contains much of Himachal’s pharmaceutical manufacturing',
    serves: 'the Solan and Shimla belt, plus outward manufacturing supply',
    regulator: 'the Himachal Pradesh Drugs Control Administration',
    demand: 'a manufacturing base rather than a large local consumption market',
  },
  shimla: {
    role: 'the state capital and the referral centre for upper Himachal',
    serves: 'the upper Himachal hill districts',
    regulator: 'the Himachal Pradesh Drugs Control Administration',
    demand: 'a hill referral hospital and supply routes that are weather-dependent in winter',
  },

  /* ---------------------------------------------------------------------
     Goa
     --------------------------------------------------------------------- */
  panaji: {
    role: 'the state capital and the trade centre for north Goa',
    serves: 'north Goa',
    regulator: 'the Goa Food and Drugs Administration',
    demand: 'a resident population supplemented by very high seasonal visitor numbers',
  },
  verna: {
    role: 'an industrial estate with a significant pharmaceutical manufacturing presence',
    serves: 'south Goa, plus outward manufacturing supply',
    regulator: 'the Goa Food and Drugs Administration',
    demand: 'production rather than local consumption, so buying here is usually sourcing at origin',
  },

  /* ---------------------------------------------------------------------
     Jammu and Kashmir
     --------------------------------------------------------------------- */
  jammu: {
    role: 'the winter capital and the year-round supply gateway to the union territory',
    serves: 'the Jammu division and, seasonally, the Kashmir valley',
    regulator: 'the Jammu and Kashmir Drugs and Food Control Organisation',
    demand: 'stock building ahead of winter, when the routes north become unreliable',
  },
  srinagar: {
    role: 'the summer capital and the medical referral centre of the Kashmir valley',
    serves: 'the Kashmir valley',
    regulator: 'the Jammu and Kashmir Drugs and Food Control Organisation',
    demand: 'a valley catchment reached through a single highway corridor, which makes order consolidation critical',
  },
};

/** The profile for a city slug, when one has been written. */
export function cityProfile(slug: string): CityProfile | undefined {
  return CITY_PROFILES[slug];
}
