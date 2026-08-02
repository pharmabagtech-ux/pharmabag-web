import type { Metadata } from 'next';
import { noIndexMetadata } from '@/lib/seo/metadata';

/**
 * Your Bag — excluded from search indexing.
 *
 * Personalised basket contents; nothing to index and no two users see the same page.
 *
 * The page itself is a client component and so cannot export `metadata`;
 * this server layout supplies it. Links are still followed so that any public
 * pages reachable from here keep their internal link equity.
 */
export const metadata: Metadata = noIndexMetadata('Your Bag', '/cart');

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
