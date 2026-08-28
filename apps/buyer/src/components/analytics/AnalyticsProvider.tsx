'use client';

import { useEffect, useRef } from 'react';
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

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const previousPath = useRef<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    startTracker();
    document.addEventListener('visibilitychange', onVisibilityChange);
    const handleScroll = () => {
      const doc = document.documentElement;
      const scrolled = doc.scrollTop;
      const max = doc.scrollHeight - doc.clientHeight;
      if (max > 0) reportScroll((scrolled / max) * 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('pagehide', () => pageLeft(window.location.pathname, true));
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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

  useEffect(() => {
    if (user?.id && user.id !== 'unknown') identify(user.id);
  }, [user?.id]);

  return <>{children}</>;
}
