import type { Metadata } from 'next';
import { noIndexMetadata } from '@/lib/seo/metadata';

/**
 * Saved Products — excluded from search indexing.
 *
 * Personalised list; contents differ per user.
 *
 * The page itself is a client component and so cannot export `metadata`;
 * this server layout supplies it. Links are still followed so that any public
 * pages reachable from here keep their internal link equity.
 */
export const metadata: Metadata = noIndexMetadata('Saved Products', '/wishlist');

export default function WishlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
