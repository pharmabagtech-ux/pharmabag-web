'use client';

import { Suspense, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@pharmabag/api-client';
import {
  startTracker,
  pageView,
  pageLeft,
  reportScroll,
  onVisibilityChange,
  identify,
} from '@/lib/analytics/tracker';

function AnalyticsRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    const fullPath = searchParams?.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
    if (previousPath.current && previousPath.current !== fullPath) {
      pageLeft(previousPath.current);
    }
    if (fullPath) {
      pageView(fullPath);
      previousPath.current = fullPath;
    }
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  useEffect(() => {
    startTracker();
    document.addEventListener('visibilitychange', onVisibilityChange);
    const handleScroll = () => {
      const doc = document.documentElement;
      const scrolled = doc.scrollTop;
      const max = doc.scrollHeight - doc.clientHeight;
      if (max > 0) reportScroll((scrolled / max) * 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    const handlePageHide = () => pageLeft(window.location.pathname, true);
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  useEffect(() => {
    identify(user?.id && user.id !== 'unknown' ? user.id : null);
  }, [user?.id]);

  return (
    <>
      <Suspense fallback={null}>
        <AnalyticsRouteTracker />
      </Suspense>
      {children}
    </>
  );
}
