import type { Metadata } from 'next';
import { noIndexMetadata } from '@/lib/seo/metadata';

/**
 * Support — excluded from search indexing.
 *
 * Account-private ticket threads.
 *
 * The page itself is a client component and so cannot export `metadata`;
 * this server layout supplies it. Links are still followed so that any public
 * pages reachable from here keep their internal link equity.
 */
export const metadata: Metadata = noIndexMetadata('Support', '/support');

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
