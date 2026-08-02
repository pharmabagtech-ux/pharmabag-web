import type { Metadata } from 'next';
import { noIndexMetadata } from '@/lib/seo/metadata';

/**
 * Sign In — excluded from search indexing.
 *
 * Auth surface. Kept out of the index so it cannot outrank real landing pages for brand queries.
 *
 * The page itself is a client component and so cannot export `metadata`;
 * this server layout supplies it. Links are still followed so that any public
 * pages reachable from here keep their internal link equity.
 */
export const metadata: Metadata = noIndexMetadata('Sign In', '/login');

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
