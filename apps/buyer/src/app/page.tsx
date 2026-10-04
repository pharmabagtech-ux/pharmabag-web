import HomeShell from '@/components/landing/HomeShell';
import { fetchBanners } from '@/lib/seo/banners';

/**
 * A server component purely so the promo strip is present in the HTML rather
 * than appearing a beat after hydration. Everything interactive lives in
 * HomeShell, which is the previous contents of this file moved across
 * unchanged.
 */
export default async function HomePage() {
  const banners = await fetchBanners('homepage');
  return <HomeShell banners={banners} />;
}
