import type { Metadata } from 'next';
import { noIndexMetadata } from '@/lib/seo/metadata';

/**
 * Credit — excluded from search indexing.
 *
 * Account-private credit facility details.
 *
 * The page itself is a client component and so cannot export `metadata`;
 * this server layout supplies it. Links are still followed so that any public
 * pages reachable from here keep their internal link equity.
 */
export const metadata: Metadata = noIndexMetadata('Credit', '/credit');

export default function CreditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
