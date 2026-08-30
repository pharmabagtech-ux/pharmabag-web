/**
 * Indian states and their major pharmaceutical trading cities.
 *
 * Scope decision worth recording: location pages are generated at
 * STATE and CITY level only, and are then crossed with *facets* (category,
 * dosage form, brand) — never with individual products.
 *
 * 26,815 products x 60 cities would be ~1.6M pages that differ by a single
 * noun. That is the definition of scaled content abuse under Google's spam
 * policy, and it puts the whole domain at risk rather than just the thin
 * pages. Facet x city keeps the same commercial intent ("antibiotics
 * wholesaler in Pune") on pages that can carry genuinely distinct content:
 * local supplier counts, regional demand notes, and a real product list.
 *
 * Cities are chosen for pharmaceutical trade relevance (distribution hubs,
 * manufacturing clusters, major consumption markets), not raw population.
 */

export interface City {
  name: string;
  slug: string;
  /** Short, factual note used to differentiate the page's opening copy. */
  note?: string;
}

export interface State {
  name: string;
  slug: string;
  /** Common alternate name searchers use; folded into keywords. */
  aka?: string;
  note?: string;
  cities: City[];
}

export const STATES: State[] = [
  {
    name: 'Maharashtra',
    slug: 'maharashtra',
    note: 'India’s largest pharmaceutical manufacturing and distribution state, anchored by the Mumbai and Pune clusters.',
    cities: [
      { name: 'Mumbai', slug: 'mumbai', note: 'The country’s primary pharmaceutical trading and import hub.' },
      { name: 'Pune', slug: 'pune', note: 'A major formulation manufacturing and institutional supply centre.' },
      { name: 'Nagpur', slug: 'nagpur', note: 'The distribution gateway for Vidarbha and central India.' },
      { name: 'Nashik', slug: 'nashik' },
      { name: 'Aurangabad', slug: 'aurangabad' },
      { name: 'Thane', slug: 'thane' },
    ],
  },
  {
    name: 'Delhi',
    slug: 'delhi',
    aka: 'New Delhi / NCR',
    note: 'Bhagirath Palace remains one of Asia’s largest wholesale medicine markets.',
    cities: [
      { name: 'New Delhi', slug: 'new-delhi', note: 'Home to Bhagirath Palace, a benchmark market for wholesale medicine pricing.' },
      { name: 'Noida', slug: 'noida' },
      { name: 'Gurugram', slug: 'gurugram' },
      { name: 'Faridabad', slug: 'faridabad' },
      { name: 'Ghaziabad', slug: 'ghaziabad' },
    ],
  },
  {
    name: 'West Bengal',
    slug: 'west-bengal',
    note: 'Kolkata’s Bagree Market serves as the wholesale pharmaceutical hub for eastern and north-eastern India.',
    cities: [
      { name: 'Kolkata', slug: 'kolkata', note: 'The distribution centre for eastern India and the north-east.' },
      { name: 'Howrah', slug: 'howrah' },
      { name: 'Siliguri', slug: 'siliguri', note: 'The trade gateway to north Bengal, Sikkim and the north-east.' },
      { name: 'Durgapur', slug: 'durgapur' },
      { name: 'Asansol', slug: 'asansol' },
    ],
  },
  {
    name: 'Gujarat',
    slug: 'gujarat',
    note: 'Accounts for roughly a third of India’s pharmaceutical production by value.',
    cities: [
      { name: 'Ahmedabad', slug: 'ahmedabad', note: 'A leading formulation manufacturing and export centre.' },
      { name: 'Surat', slug: 'surat' },
      { name: 'Vadodara', slug: 'vadodara' },
      { name: 'Rajkot', slug: 'rajkot' },
      { name: 'Ankleshwar', slug: 'ankleshwar', note: 'A major bulk drug and API manufacturing belt.' },
    ],
  },
  {
    name: 'Tamil Nadu',
    slug: 'tamil-nadu',
    cities: [
      { name: 'Chennai', slug: 'chennai', note: 'The principal pharmaceutical distribution hub for south India.' },
      { name: 'Coimbatore', slug: 'coimbatore' },
      { name: 'Madurai', slug: 'madurai' },
      { name: 'Trichy', slug: 'trichy' },
      { name: 'Salem', slug: 'salem' },
    ],
  },
  {
    name: 'Karnataka',
    slug: 'karnataka',
    cities: [
      { name: 'Bengaluru', slug: 'bengaluru', note: 'A large institutional and hospital procurement market.' },
      { name: 'Mysuru', slug: 'mysuru' },
      { name: 'Hubballi', slug: 'hubballi' },
      { name: 'Mangaluru', slug: 'mangaluru' },
      { name: 'Belagavi', slug: 'belagavi' },
    ],
  },
  {
    name: 'Telangana',
    slug: 'telangana',
    note: 'Hyderabad is widely described as India’s bulk drug capital.',
    cities: [
      { name: 'Hyderabad', slug: 'hyderabad', note: 'A global centre for API and bulk drug manufacturing.' },
      { name: 'Warangal', slug: 'warangal' },
      { name: 'Nizamabad', slug: 'nizamabad' },
    ],
  },
  {
    name: 'Uttar Pradesh',
    slug: 'uttar-pradesh',
    aka: 'UP',
    cities: [
      { name: 'Lucknow', slug: 'lucknow' },
      { name: 'Kanpur', slug: 'kanpur' },
      { name: 'Varanasi', slug: 'varanasi' },
      { name: 'Agra', slug: 'agra' },
      { name: 'Prayagraj', slug: 'prayagraj' },
      { name: 'Meerut', slug: 'meerut' },
    ],
  },
  {
    name: 'Rajasthan',
    slug: 'rajasthan',
    note: 'Jaipur leads the wholesale trade, with long secondary routes serving one of India’s most geographically spread pharmacy networks.',
    cities: [
      { name: 'Jaipur', slug: 'jaipur' },
      { name: 'Jodhpur', slug: 'jodhpur' },
      { name: 'Udaipur', slug: 'udaipur' },
      { name: 'Kota', slug: 'kota' },
    ],
  },
  {
    name: 'Madhya Pradesh',
    slug: 'madhya-pradesh',
    note: 'Indore is the state’s wholesale centre and one of central India’s major distribution markets, with Bhopal serving the east.',
    aka: 'MP',
    cities: [
      { name: 'Indore', slug: 'indore', note: 'The largest wholesale medicine market in central India.' },
      { name: 'Bhopal', slug: 'bhopal' },
      { name: 'Jabalpur', slug: 'jabalpur' },
      { name: 'Gwalior', slug: 'gwalior' },
    ],
  },
  {
    name: 'Bihar',
    slug: 'bihar',
    cities: [
      { name: 'Patna', slug: 'patna', note: 'The distribution centre for Bihar and parts of Jharkhand.' },
      { name: 'Gaya', slug: 'gaya' },
      { name: 'Muzaffarpur', slug: 'muzaffarpur' },
    ],
  },
  {
    name: 'Punjab',
    slug: 'punjab',
    cities: [
      { name: 'Ludhiana', slug: 'ludhiana' },
      { name: 'Amritsar', slug: 'amritsar' },
      { name: 'Jalandhar', slug: 'jalandhar' },
      { name: 'Mohali', slug: 'mohali' },
    ],
  },
  {
    name: 'Haryana',
    slug: 'haryana',
    note: 'Combines NCR-driven distribution through Gurugram and Faridabad with a growing formulation-manufacturing footprint.',
    cities: [
      { name: 'Panchkula', slug: 'panchkula' },
      { name: 'Karnal', slug: 'karnal' },
      { name: 'Hisar', slug: 'hisar' },
      { name: 'Ambala', slug: 'ambala' },
    ],
  },
  {
    name: 'Kerala',
    slug: 'kerala',
    note: 'One of India’s strongest per-capita medicine markets, with a dense pharmacy network supplied mainly through Ernakulam and Kozhikode.',
    cities: [
      { name: 'Kochi', slug: 'kochi' },
      { name: 'Thiruvananthapuram', slug: 'thiruvananthapuram' },
      { name: 'Kozhikode', slug: 'kozhikode' },
      { name: 'Thrissur', slug: 'thrissur' },
    ],
  },
  {
    name: 'Andhra Pradesh',
    slug: 'andhra-pradesh',
    note: 'Home to the Visakhapatnam pharma-industrial belt, with strong distribution through Vijayawada and Guntur.',
    cities: [
      { name: 'Visakhapatnam', slug: 'visakhapatnam' },
      { name: 'Vijayawada', slug: 'vijayawada' },
      { name: 'Guntur', slug: 'guntur' },
      { name: 'Tirupati', slug: 'tirupati' },
    ],
  },
  {
    name: 'Odisha',
    slug: 'odisha',
    note: 'Cuttack’s wholesale market historically anchors the state’s medicine trade, alongside Bhubaneswar’s institutional demand.',
    cities: [
      { name: 'Bhubaneswar', slug: 'bhubaneswar' },
      { name: 'Cuttack', slug: 'cuttack' },
      { name: 'Rourkela', slug: 'rourkela' },
    ],
  },
  {
    name: 'Assam',
    slug: 'assam',
    note: 'Guwahati is the pharmaceutical distribution gateway for the entire Northeast, supplying the neighbouring states onward.',
    cities: [
      { name: 'Guwahati', slug: 'guwahati', note: 'The primary distribution point for the north-eastern states.' },
      { name: 'Dibrugarh', slug: 'dibrugarh' },
      { name: 'Silchar', slug: 'silchar' },
    ],
  },
  {
    name: 'Jharkhand',
    slug: 'jharkhand',
    cities: [
      { name: 'Ranchi', slug: 'ranchi' },
      { name: 'Jamshedpur', slug: 'jamshedpur' },
      { name: 'Dhanbad', slug: 'dhanbad' },
    ],
  },
  {
    name: 'Chhattisgarh',
    slug: 'chhattisgarh',
    note: 'Raipur anchors the state’s wholesale trade, supplying a largely tier-2 and rural pharmacy network.',
    cities: [
      { name: 'Raipur', slug: 'raipur' },
      { name: 'Bhilai', slug: 'bhilai' },
      { name: 'Bilaspur', slug: 'bilaspur' },
    ],
  },
  {
    name: 'Uttarakhand',
    slug: 'uttarakhand',
    note: 'The Haridwar–Roorkee belt hosts a large concentration of formulation units.',
    cities: [
      { name: 'Dehradun', slug: 'dehradun' },
      { name: 'Haridwar', slug: 'haridwar', note: 'A major excise-benefit manufacturing cluster.' },
      { name: 'Haldwani', slug: 'haldwani' },
    ],
  },
  {
    name: 'Himachal Pradesh',
    slug: 'himachal-pradesh',
    note: 'The Baddi–Barotiwala belt is one of Asia’s densest pharmaceutical manufacturing zones.',
    cities: [
      { name: 'Baddi', slug: 'baddi', note: 'Among the highest concentrations of drug manufacturing units in Asia.' },
      { name: 'Solan', slug: 'solan' },
      { name: 'Shimla', slug: 'shimla' },
    ],
  },
  {
    name: 'Goa',
    slug: 'goa',
    cities: [{ name: 'Panaji', slug: 'panaji' }, { name: 'Verna', slug: 'verna' }],
  },
  {
    name: 'Jammu and Kashmir',
    slug: 'jammu-and-kashmir',
    note: 'Jammu is the region’s primary stocking point, with supply planned around longer, weather-dependent transit into the valley.',
    cities: [{ name: 'Jammu', slug: 'jammu' }, { name: 'Srinagar', slug: 'srinagar' }],
  },
  {
    name: 'Chandigarh',
    slug: 'chandigarh',
    note: 'A compact, high-throughput trade hub serving Punjab, Haryana and Himachal, close to the Baddi manufacturing belt.',
    cities: [{ name: 'Chandigarh', slug: 'chandigarh' }],
  },
];

/** Flat city list with the parent state attached, for sitemaps and link hubs. */
export const ALL_CITIES: (City & { state: State })[] = STATES.flatMap((state) =>
  state.cities.map((city) => ({ ...city, state })),
);

export function findState(slug: string): State | undefined {
  return STATES.find((s) => s.slug === slug);
}

export function findCity(
  stateSlug: string,
  citySlug: string,
): { state: State; city: City } | undefined {
  const state = findState(stateSlug);
  const city = state?.cities.find((c) => c.slug === citySlug);
  return state && city ? { state, city } : undefined;
}

/** The subset used for brand-in-city pages, kept small to avoid thin output. */
export const TIER_1_CITIES = [
  'mumbai',
  'new-delhi',
  'kolkata',
  'chennai',
  'bengaluru',
  'hyderabad',
  'ahmedabad',
  'pune',
  'lucknow',
  'jaipur',
  'indore',
  'patna',
  'guwahati',
  'chandigarh',
];
