import type { Metadata } from 'next';
import Navbar from '@/components/landing/Navbar';
import JsonLd from '@/components/seo/JsonLd';
import { Breadcrumbs, SeoSection, LinkGrid, FaqList } from '@/components/seo/SeoContent';
import { buildMetadata } from '@/lib/seo/metadata';
import { routes, absoluteUrl } from '@/lib/seo/url';
import {
  graph,
  breadcrumbSchema,
  collectionPageSchema,
  faqSchema,
} from '@/lib/seo/schema';
import { SITE_NAME } from '@/lib/seo/config';
import { MOLECULES, moleculesByClass } from '@/lib/seo/data/molecules';

/**
 * Generic molecule hub, grouped by therapeutic class.
 *
 * Molecule and therapeutic-class pages are the strongest answer-engine
 * surface on the site. Assistants are asked "which brands contain
 * amoxicillin" or "cheapest generic for atorvastatin" constantly, and a page
 * that answers with a real, priced product list is far more citable than a
 * brand page.
 */
export const revalidate = 86400;

const CRUMBS = [
  { name: 'Home', path: routes.home() },
  { name: 'Generic Molecules', path: routes.generics() },
];

function classId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: 'Generic Medicines by Molecule — Salt Composition Wholesale',
    description: `Browse ${MOLECULES.length} generic molecules and salt compositions available at wholesale on ${SITE_NAME} — paracetamol, amoxicillin, metformin, atorvastatin, pantoprazole and more, grouped by therapeutic class.`,
    path: routes.generics(),
    keywords: [
      'generic medicines wholesale',
      'salt composition medicines',
      'molecule wise medicine list',
      'generic medicine supplier India',
      'therapeutic class medicines',
    ],
  });
}

export default async function GenericsPage() {
  const groups = moleculesByClass();
  const url = absoluteUrl(routes.generics());

  const faqs = [
    {
      question: 'What is a generic molecule or salt composition?',
      answer:
        'The molecule, or salt composition, is the active pharmaceutical ingredient in a medicine — for example paracetamol, amoxicillin or metformin. Several brands may contain the same molecule at the same strength, which is what allows a pharmacy to substitute one brand for another therapeutic equivalent.',
    },
    {
      question: `How do I find all brands containing a molecule on ${SITE_NAME}?`,
      answer: `Open the molecule page from the list on this page. Each molecule page shows every product in the ${SITE_NAME} catalogue containing that salt, along with the brand, manufacturer, wholesale net rate and minimum order quantity, so brands can be compared directly on price.`,
    },
    {
      question: 'Are generic medicines cheaper than branded equivalents?',
      answer:
        'Generic and branded-generic medicines are usually priced below the originator brand, though the exact difference varies by molecule and manufacturer. On PharmaBag the wholesale net rate for every listed brand of a molecule is shown side by side, so the actual difference can be compared rather than assumed.',
    },
    {
      question: 'Do I need a licence to buy generic medicines in bulk?',
      answer: `Yes. ${SITE_NAME} supplies only to verified businesses — retail pharmacies, hospitals, clinics and distributors — and buyers must complete a one-time verification with a valid drug licence and GST or PAN details before ordering.`,
    },
  ];

  const jsonLd = graph(
    breadcrumbSchema(CRUMBS),
    collectionPageSchema({
      name: 'Generic Medicines by Molecule',
      url,
      description: `Generic molecules and salt compositions available at wholesale on ${SITE_NAME}.`,
      totalItems: MOLECULES.length,
      items: MOLECULES.slice(0, 100).map((m) => ({
        name: m.name,
        url: absoluteUrl(routes.generic(m.slug)),
      })),
    }),
    faqSchema(faqs),
  );

  return (
    <>
      <JsonLd json={jsonLd} />
      <Navbar showUserActions />
      <main className="w-full pb-28 pt-6 lg:pb-16 lg:pt-28">
        <Breadcrumbs crumbs={CRUMBS} />

        <header className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Generic medicines by molecule and salt composition
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-700">
            {SITE_NAME} organises its wholesale catalogue by active molecule as
            well as by brand, so a pharmacy or hospital can compare every
            available brand of the same salt composition on price, pack and
            minimum order quantity. {MOLECULES.length} molecules are listed
            below, grouped into {groups.length} therapeutic classes.
          </p>
        </header>

        {groups.map((group) => (
          <SeoSection
            key={group.therapeuticClass}
            id={classId(group.therapeuticClass)}
            title={group.therapeuticClass}
          >
            <LinkGrid
              links={group.molecules.map((m) => ({
                label: m.name,
                href: routes.generic(m.slug),
              }))}
            />
          </SeoSection>
        ))}

        <SeoSection id="faq" title="Frequently asked questions">
          <FaqList faqs={faqs} />
        </SeoSection>
      </main>
    </>
  );
}
