import type { Metadata } from 'next';
import { noIndexMetadata } from '@/lib/seo/metadata';

/**
 * Payments — excluded from search indexing.
 *
 * Transactional and account-private.
 *
 * The page itself is a client component and so cannot export `metadata`;
 * this server layout supplies it. Links are still followed so that any public
 * pages reachable from here keep their internal link equity.
 */
export const metadata: Metadata = noIndexMetadata('Payments', '/payments');

export default function PaymentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
