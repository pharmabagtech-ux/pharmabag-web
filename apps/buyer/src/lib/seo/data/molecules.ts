/**
 * Generic molecules (salt compositions) that get their own landing page.
 *
 * VALIDATED AGAINST LIVE DATA. Every entry was checked against
 * `GET /products?search=<molecule>` and returned at least 8 matching products
 * at authoring time. Molecules with fewer were dropped rather than shipped as
 * near-empty pages: a sitemap full of thin or 404 URLs devalues the whole
 * sitemap and wastes crawl budget on a 26,000-page site.
 *
 * `approxProducts` is a snapshot used only for ordering and for deciding
 * whether a molecule is worth linking prominently. Pages read their real
 * counts from the API at request time, so this number is never shown.
 *
 * Molecule pages are the highest-value answer-engine surface here: "which
 * brands contain <molecule>" and "<molecule> wholesale price" are exactly the
 * questions assistants field, and a page answering them with a real product
 * table is highly citable.
 */

export interface Molecule {
  /** Display name, e.g. "Amoxicillin and Clavulanic Acid". */
  name: string;
  /** URL segment. */
  slug: string;
  /** Therapeutic class, used for grouping, copy and internal linking. */
  therapeuticClass: string;
  /** Catalogue depth at authoring time. Ordering hint only. */
  approxProducts: number;
}

export const MOLECULES: Molecule[] = [
  { name: "Aceclofenac", slug: 'aceclofenac', therapeuticClass: "Analgesic and anti-inflammatory", approxProducts: 219 },
  { name: "Acyclovir", slug: 'acyclovir', therapeuticClass: "Antiviral", approxProducts: 51 },
  { name: "Albendazole", slug: 'albendazole', therapeuticClass: "Antifungal and antiparasitic", approxProducts: 50 },
  { name: "Allopurinol", slug: 'allopurinol', therapeuticClass: "Haematology and metabolic", approxProducts: 16 },
  { name: "Alprazolam", slug: 'alprazolam', therapeuticClass: "Central nervous system", approxProducts: 31 },
  { name: "Ambroxol", slug: 'ambroxol', therapeuticClass: "Respiratory", approxProducts: 262 },
  { name: "Amitriptyline", slug: 'amitriptyline', therapeuticClass: "Central nervous system", approxProducts: 57 },
  { name: "Amlodipine", slug: 'amlodipine', therapeuticClass: "Cardiovascular and antihypertensive", approxProducts: 880 },
  { name: "Amoxicillin", slug: 'amoxicillin', therapeuticClass: "Antibiotic", approxProducts: 445 },
  { name: "Amoxicillin and Clavulanic Acid", slug: 'amoxicillin-and-clavulanic-acid', therapeuticClass: "Antibiotic", approxProducts: 10 },
  { name: "Apixaban", slug: 'apixaban', therapeuticClass: "Lipid-lowering and antiplatelet", approxProducts: 44 },
  { name: "Artemether", slug: 'artemether', therapeuticClass: "Antifungal and antiparasitic", approxProducts: 28 },
  { name: "Aspirin", slug: 'aspirin', therapeuticClass: "Analgesic and anti-inflammatory", approxProducts: 236 },
  { name: "Atenolol", slug: 'atenolol', therapeuticClass: "Cardiovascular and antihypertensive", approxProducts: 338 },
  { name: "Atorvastatin", slug: 'atorvastatin', therapeuticClass: "Lipid-lowering and antiplatelet", approxProducts: 757 },
  { name: "Azithromycin", slug: 'azithromycin', therapeuticClass: "Antibiotic", approxProducts: 304 },
  { name: "Betahistine", slug: 'betahistine', therapeuticClass: "Central nervous system", approxProducts: 66 },
  { name: "Betamethasone", slug: 'betamethasone', therapeuticClass: "Corticosteroid", approxProducts: 19 },
  { name: "Bisacodyl", slug: 'bisacodyl', therapeuticClass: "Gastrointestinal", approxProducts: 12 },
  { name: "Bisoprolol", slug: 'bisoprolol', therapeuticClass: "Cardiovascular and antihypertensive", approxProducts: 170 },
  { name: "Budesonide", slug: 'budesonide', therapeuticClass: "Respiratory", approxProducts: 50 },
  { name: "Calcium and Vitamin D3", slug: 'calcium-and-vitamin-d3', therapeuticClass: "Nutraceutical and supplement", approxProducts: 13 },
  { name: "Carbamazepine", slug: 'carbamazepine', therapeuticClass: "Central nervous system", approxProducts: 40 },
  { name: "Carvedilol", slug: 'carvedilol', therapeuticClass: "Cardiovascular and antihypertensive", approxProducts: 69 },
  { name: "Cefixime", slug: 'cefixime', therapeuticClass: "Antibiotic", approxProducts: 614 },
  { name: "Cefpodoxime", slug: 'cefpodoxime', therapeuticClass: "Antibiotic", approxProducts: 80 },
  { name: "Cetirizine", slug: 'cetirizine', therapeuticClass: "Antihistamine and anti-allergic", approxProducts: 275 },
  { name: "Chlorzoxazone", slug: 'chlorzoxazone', therapeuticClass: "Muscle relaxant and antispasmodic", approxProducts: 63 },
  { name: "Cholecalciferol", slug: 'cholecalciferol', therapeuticClass: "Nutraceutical and supplement", approxProducts: 226 },
  { name: "Cinnarizine", slug: 'cinnarizine', therapeuticClass: "Central nervous system", approxProducts: 43 },
  { name: "Ciprofloxacin", slug: 'ciprofloxacin', therapeuticClass: "Antibiotic", approxProducts: 47 },
  { name: "Clarithromycin", slug: 'clarithromycin', therapeuticClass: "Antibiotic", approxProducts: 45 },
  { name: "Clonazepam", slug: 'clonazepam', therapeuticClass: "Central nervous system", approxProducts: 25 },
  { name: "Clopidogrel", slug: 'clopidogrel', therapeuticClass: "Lipid-lowering and antiplatelet", approxProducts: 238 },
  { name: "Clotrimazole", slug: 'clotrimazole', therapeuticClass: "Antifungal and antiparasitic", approxProducts: 10 },
  { name: "Cloxacillin", slug: 'cloxacillin', therapeuticClass: "Antibiotic", approxProducts: 10 },
  { name: "Dapagliflozin", slug: 'dapagliflozin', therapeuticClass: "Antidiabetic", approxProducts: 271 },
  { name: "Deflazacort", slug: 'deflazacort', therapeuticClass: "Corticosteroid", approxProducts: 36 },
  { name: "Dexamethasone", slug: 'dexamethasone', therapeuticClass: "Corticosteroid", approxProducts: 40 },
  { name: "Dextromethorphan", slug: 'dextromethorphan', therapeuticClass: "Respiratory", approxProducts: 221 },
  { name: "Diclofenac", slug: 'diclofenac', therapeuticClass: "Analgesic and anti-inflammatory", approxProducts: 125 },
  { name: "Dicyclomine", slug: 'dicyclomine', therapeuticClass: "Muscle relaxant and antispasmodic", approxProducts: 71 },
  { name: "Divalproex", slug: 'divalproex', therapeuticClass: "Central nervous system", approxProducts: 37 },
  { name: "Domperidone", slug: 'domperidone', therapeuticClass: "Gastrointestinal", approxProducts: 581 },
  { name: "Donepezil", slug: 'donepezil', therapeuticClass: "Central nervous system", approxProducts: 62 },
  { name: "Doxycycline", slug: 'doxycycline', therapeuticClass: "Antibiotic", approxProducts: 72 },
  { name: "Drotaverine", slug: 'drotaverine', therapeuticClass: "Muscle relaxant and antispasmodic", approxProducts: 14 },
  { name: "Dutasteride", slug: 'dutasteride', therapeuticClass: "Urology and hormone therapy", approxProducts: 56 },
  { name: "Empagliflozin", slug: 'empagliflozin', therapeuticClass: "Antidiabetic", approxProducts: 142 },
  { name: "Enalapril", slug: 'enalapril', therapeuticClass: "Cardiovascular and antihypertensive", approxProducts: 110 },
  { name: "Escitalopram", slug: 'escitalopram', therapeuticClass: "Central nervous system", approxProducts: 102 },
  { name: "Esomeprazole", slug: 'esomeprazole', therapeuticClass: "Gastrointestinal", approxProducts: 100 },
  { name: "Estradiol", slug: 'estradiol', therapeuticClass: "Urology and hormone therapy", approxProducts: 100 },
  { name: "Etizolam", slug: 'etizolam', therapeuticClass: "Central nervous system", approxProducts: 29 },
  { name: "Etoricoxib", slug: 'etoricoxib', therapeuticClass: "Analgesic and anti-inflammatory", approxProducts: 70 },
  { name: "Febuxostat", slug: 'febuxostat', therapeuticClass: "Haematology and metabolic", approxProducts: 63 },
  { name: "Fexofenadine", slug: 'fexofenadine', therapeuticClass: "Antihistamine and anti-allergic", approxProducts: 73 },
  { name: "Finasteride", slug: 'finasteride', therapeuticClass: "Urology and hormone therapy", approxProducts: 53 },
  { name: "Fluconazole", slug: 'fluconazole', therapeuticClass: "Antifungal and antiparasitic", approxProducts: 116 },
  { name: "Fluoxetine", slug: 'fluoxetine', therapeuticClass: "Central nervous system", approxProducts: 61 },
  { name: "Fluticasone", slug: 'fluticasone', therapeuticClass: "Corticosteroid", approxProducts: 64 },
  { name: "Folic Acid", slug: 'folic-acid', therapeuticClass: "Nutraceutical and supplement", approxProducts: 464 },
  { name: "Formoterol", slug: 'formoterol', therapeuticClass: "Respiratory", approxProducts: 43 },
  { name: "Furosemide", slug: 'furosemide', therapeuticClass: "Cardiovascular and antihypertensive", approxProducts: 16 },
  { name: "Gabapentin", slug: 'gabapentin', therapeuticClass: "Central nervous system", approxProducts: 178 },
  { name: "Gliclazide", slug: 'gliclazide', therapeuticClass: "Antidiabetic", approxProducts: 93 },
  { name: "Glimepiride", slug: 'glimepiride', therapeuticClass: "Antidiabetic", approxProducts: 933 },
  { name: "Griseofulvin", slug: 'griseofulvin', therapeuticClass: "Antifungal and antiparasitic", approxProducts: 11 },
  { name: "Guaifenesin", slug: 'guaifenesin', therapeuticClass: "Respiratory", approxProducts: 180 },
  { name: "Hydrochlorothiazide", slug: 'hydrochlorothiazide', therapeuticClass: "Cardiovascular and antihypertensive", approxProducts: 505 },
  { name: "Hydrocortisone", slug: 'hydrocortisone', therapeuticClass: "Corticosteroid", approxProducts: 14 },
  { name: "Hydroxychloroquine", slug: 'hydroxychloroquine', therapeuticClass: "Antifungal and antiparasitic", approxProducts: 9 },
  { name: "Hydroxyzine", slug: 'hydroxyzine', therapeuticClass: "Antihistamine and anti-allergic", approxProducts: 12 },
  { name: "Ibuprofen", slug: 'ibuprofen', therapeuticClass: "Analgesic and anti-inflammatory", approxProducts: 176 },
  { name: "Ipratropium", slug: 'ipratropium', therapeuticClass: "Respiratory", approxProducts: 44 },
  { name: "Iron and Folic Acid", slug: 'iron-and-folic-acid', therapeuticClass: "Nutraceutical and supplement", approxProducts: 16 },
  { name: "Itraconazole", slug: 'itraconazole', therapeuticClass: "Antifungal and antiparasitic", approxProducts: 137 },
  { name: "Ivermectin", slug: 'ivermectin', therapeuticClass: "Antifungal and antiparasitic", approxProducts: 38 },
  { name: "Ketoconazole", slug: 'ketoconazole', therapeuticClass: "Antifungal and antiparasitic", approxProducts: 28 },
  { name: "Lactulose", slug: 'lactulose', therapeuticClass: "Gastrointestinal", approxProducts: 73 },
  { name: "Letrozole", slug: 'letrozole', therapeuticClass: "Urology and hormone therapy", approxProducts: 17 },
  { name: "Levetiracetam", slug: 'levetiracetam', therapeuticClass: "Central nervous system", approxProducts: 123 },
  { name: "Levocetirizine", slug: 'levocetirizine', therapeuticClass: "Antihistamine and anti-allergic", approxProducts: 116 },
  { name: "Levofloxacin", slug: 'levofloxacin', therapeuticClass: "Antibiotic", approxProducts: 43 },
  { name: "Levosalbutamol", slug: 'levosalbutamol', therapeuticClass: "Respiratory", approxProducts: 100 },
  { name: "Levothyroxine", slug: 'levothyroxine', therapeuticClass: "Urology and hormone therapy", approxProducts: 125 },
  { name: "Linezolid", slug: 'linezolid', therapeuticClass: "Antibiotic", approxProducts: 86 },
  { name: "Loratadine", slug: 'loratadine', therapeuticClass: "Antihistamine and anti-allergic", approxProducts: 69 },
  { name: "Losartan", slug: 'losartan', therapeuticClass: "Cardiovascular and antihypertensive", approxProducts: 149 },
  { name: "Mefenamic Acid", slug: 'mefenamic-acid', therapeuticClass: "Analgesic and anti-inflammatory", approxProducts: 106 },
  { name: "Metformin", slug: 'metformin', therapeuticClass: "Antidiabetic", approxProducts: 2132 },
  { name: "Methotrexate", slug: 'methotrexate', therapeuticClass: "Haematology and metabolic", approxProducts: 31 },
  { name: "Methylcobalamin", slug: 'methylcobalamin', therapeuticClass: "Nutraceutical and supplement", approxProducts: 368 },
  { name: "Methylprednisolone", slug: 'methylprednisolone', therapeuticClass: "Corticosteroid", approxProducts: 30 },
  { name: "Metoclopramide", slug: 'metoclopramide', therapeuticClass: "Gastrointestinal", approxProducts: 26 },
  { name: "Metoprolol", slug: 'metoprolol', therapeuticClass: "Cardiovascular and antihypertensive", approxProducts: 331 },
  { name: "Metronidazole", slug: 'metronidazole', therapeuticClass: "Antibiotic", approxProducts: 51 },
  { name: "Mometasone", slug: 'mometasone', therapeuticClass: "Corticosteroid", approxProducts: 28 },
  { name: "Montelukast", slug: 'montelukast', therapeuticClass: "Antihistamine and anti-allergic", approxProducts: 303 },
  { name: "Multivitamin", slug: 'multivitamin', therapeuticClass: "Nutraceutical and supplement", approxProducts: 213 },
  { name: "Naproxen", slug: 'naproxen', therapeuticClass: "Analgesic and anti-inflammatory", approxProducts: 20 },
  { name: "Nebivolol", slug: 'nebivolol', therapeuticClass: "Cardiovascular and antihypertensive", approxProducts: 57 },
  { name: "Nimesulide", slug: 'nimesulide', therapeuticClass: "Analgesic and anti-inflammatory", approxProducts: 44 },
  { name: "Ofloxacin", slug: 'ofloxacin', therapeuticClass: "Antibiotic", approxProducts: 265 },
  { name: "Olanzapine", slug: 'olanzapine', therapeuticClass: "Central nervous system", approxProducts: 60 },
  { name: "Olmesartan", slug: 'olmesartan', therapeuticClass: "Cardiovascular and antihypertensive", approxProducts: 245 },
  { name: "Omeprazole", slug: 'omeprazole', therapeuticClass: "Gastrointestinal", approxProducts: 222 },
  { name: "Ondansetron", slug: 'ondansetron', therapeuticClass: "Gastrointestinal", approxProducts: 63 },
  { name: "Oseltamivir", slug: 'oseltamivir', therapeuticClass: "Antiviral", approxProducts: 16 },
  { name: "Pantoprazole", slug: 'pantoprazole', therapeuticClass: "Gastrointestinal", approxProducts: 292 },
  { name: "Paracetamol", slug: 'paracetamol', therapeuticClass: "Analgesic and anti-inflammatory", approxProducts: 951 },
  { name: "Paroxetine", slug: 'paroxetine', therapeuticClass: "Central nervous system", approxProducts: 55 },
  { name: "Phenytoin", slug: 'phenytoin', therapeuticClass: "Central nervous system", approxProducts: 20 },
  { name: "Pioglitazone", slug: 'pioglitazone', therapeuticClass: "Antidiabetic", approxProducts: 326 },
  { name: "Piracetam", slug: 'piracetam', therapeuticClass: "Central nervous system", approxProducts: 82 },
  { name: "Prednisolone", slug: 'prednisolone', therapeuticClass: "Corticosteroid", approxProducts: 85 },
  { name: "Pregabalin", slug: 'pregabalin', therapeuticClass: "Central nervous system", approxProducts: 326 },
  { name: "Progesterone", slug: 'progesterone', therapeuticClass: "Urology and hormone therapy", approxProducts: 60 },
  { name: "Quetiapine", slug: 'quetiapine', therapeuticClass: "Central nervous system", approxProducts: 98 },
  { name: "Rabeprazole", slug: 'rabeprazole', therapeuticClass: "Gastrointestinal", approxProducts: 194 },
  { name: "Ramipril", slug: 'ramipril', therapeuticClass: "Cardiovascular and antihypertensive", approxProducts: 187 },
  { name: "Ranitidine", slug: 'ranitidine', therapeuticClass: "Gastrointestinal", approxProducts: 42 },
  { name: "Risperidone", slug: 'risperidone', therapeuticClass: "Central nervous system", approxProducts: 65 },
  { name: "Rivaroxaban", slug: 'rivaroxaban', therapeuticClass: "Lipid-lowering and antiplatelet", approxProducts: 22 },
  { name: "Rosuvastatin", slug: 'rosuvastatin', therapeuticClass: "Lipid-lowering and antiplatelet", approxProducts: 423 },
  { name: "Salbutamol", slug: 'salbutamol', therapeuticClass: "Respiratory", approxProducts: 434 },
  { name: "Serratiopeptidase", slug: 'serratiopeptidase', therapeuticClass: "Analgesic and anti-inflammatory", approxProducts: 110 },
  { name: "Sertraline", slug: 'sertraline', therapeuticClass: "Central nervous system", approxProducts: 141 },
  { name: "Sildenafil", slug: 'sildenafil', therapeuticClass: "Urology and hormone therapy", approxProducts: 76 },
  { name: "Silodosin", slug: 'silodosin', therapeuticClass: "Urology and hormone therapy", approxProducts: 37 },
  { name: "Simvastatin", slug: 'simvastatin', therapeuticClass: "Lipid-lowering and antiplatelet", approxProducts: 11 },
  { name: "Sitagliptin", slug: 'sitagliptin', therapeuticClass: "Antidiabetic", approxProducts: 422 },
  { name: "Sodium Valproate", slug: 'sodium-valproate', therapeuticClass: "Central nervous system", approxProducts: 54 },
  { name: "Spironolactone", slug: 'spironolactone', therapeuticClass: "Cardiovascular and antihypertensive", approxProducts: 26 },
  { name: "Sucralfate", slug: 'sucralfate', therapeuticClass: "Gastrointestinal", approxProducts: 38 },
  { name: "Tadalafil", slug: 'tadalafil', therapeuticClass: "Urology and hormone therapy", approxProducts: 60 },
  { name: "Tamsulosin", slug: 'tamsulosin', therapeuticClass: "Urology and hormone therapy", approxProducts: 93 },
  { name: "Telmisartan", slug: 'telmisartan', therapeuticClass: "Cardiovascular and antihypertensive", approxProducts: 784 },
  { name: "Teneligliptin", slug: 'teneligliptin', therapeuticClass: "Antidiabetic", approxProducts: 70 },
  { name: "Tenofovir", slug: 'tenofovir', therapeuticClass: "Antiviral", approxProducts: 119 },
  { name: "Terbinafine", slug: 'terbinafine', therapeuticClass: "Antifungal and antiparasitic", approxProducts: 32 },
  { name: "Theophylline", slug: 'theophylline', therapeuticClass: "Respiratory", approxProducts: 46 },
  { name: "Thiocolchicoside", slug: 'thiocolchicoside', therapeuticClass: "Muscle relaxant and antispasmodic", approxProducts: 42 },
  { name: "Thyroxine", slug: 'thyroxine', therapeuticClass: "Urology and hormone therapy", approxProducts: 126 },
  { name: "Torsemide", slug: 'torsemide', therapeuticClass: "Cardiovascular and antihypertensive", approxProducts: 58 },
  { name: "Tramadol", slug: 'tramadol', therapeuticClass: "Analgesic and anti-inflammatory", approxProducts: 92 },
  { name: "Tranexamic Acid", slug: 'tranexamic-acid', therapeuticClass: "Haematology and metabolic", approxProducts: 21 },
  { name: "Ursodeoxycholic Acid", slug: 'ursodeoxycholic-acid', therapeuticClass: "Gastrointestinal", approxProducts: 80 },
  { name: "Valacyclovir", slug: 'valacyclovir', therapeuticClass: "Antiviral", approxProducts: 12 },
  { name: "Vildagliptin", slug: 'vildagliptin', therapeuticClass: "Antidiabetic", approxProducts: 183 },
  { name: "Vitamin B Complex", slug: 'vitamin-b-complex', therapeuticClass: "Nutraceutical and supplement", approxProducts: 248 },
  { name: "Vitamin C", slug: 'vitamin-c', therapeuticClass: "Nutraceutical and supplement", approxProducts: 1505 },
  { name: "Vitamin D3", slug: 'vitamin-d3', therapeuticClass: "Nutraceutical and supplement", approxProducts: 590 },
  { name: "Zinc", slug: 'zinc', therapeuticClass: "Nutraceutical and supplement", approxProducts: 327 },
];

export const MOLECULE_SLUGS = MOLECULES.map((m) => m.slug);

export function findMolecule(slug: string): Molecule | undefined {
  return MOLECULES.find((m) => m.slug === slug);
}

/** Therapeutic classes with their molecules, for the generics index and hubs. */
export function moleculesByClass(): {
  therapeuticClass: string;
  molecules: Molecule[];
}[] {
  const map = new Map<string, Molecule[]>();
  for (const m of MOLECULES) {
    const list = map.get(m.therapeuticClass) ?? [];
    list.push(m);
    map.set(m.therapeuticClass, list);
  }
  return Array.from(map.entries())
    .map(([therapeuticClass, molecules]) => ({
      therapeuticClass,
      molecules: [...molecules].sort((a, b) => b.approxProducts - a.approxProducts),
    }))
    .sort((a, b) => a.therapeuticClass.localeCompare(b.therapeuticClass));
}

/** Same-class siblings, used for "related molecules" internal links. */
export function relatedMolecules(slug: string, limit = 8): Molecule[] {
  const target = findMolecule(slug);
  if (!target) return [];
  return MOLECULES.filter(
    (m) => m.slug !== slug && m.therapeuticClass === target.therapeuticClass,
  )
    .sort((a, b) => b.approxProducts - a.approxProducts)
    .slice(0, limit);
}
