import type { Metadata } from 'next';
import { buildSegmentMetadata } from '@/lib/seo/metadata';
import { routes } from '@/lib/seo/url';
import { SITE_NAME } from '@/lib/seo/config';

/**
 * Blog index metadata.
 *
 * Editorial content is the topical-authority half of the strategy: product and
 * category pages prove commercial relevance, while explanatory articles are
 * what earn citations from answer engines on "how does X work" questions that
 * a catalogue page cannot satisfy.
 *
 * Individual posts set their own metadata in `blogs/[slug]/layout.tsx`.
 */
export const metadata: Metadata = buildSegmentMetadata({
  title: 'Pharma Industry Insights & Buying Guides',
  description: `Articles, buying guides and industry updates for pharmacy owners, hospital procurement teams and pharmaceutical distributors from ${SITE_NAME}.`,
  path: routes.blogs(),
  keywords: [
    'pharmaceutical industry news India',
    'pharmacy buying guide',
    'medicine wholesale tips',
    'pharma distribution insights',
  ],
});

export default function BlogsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
