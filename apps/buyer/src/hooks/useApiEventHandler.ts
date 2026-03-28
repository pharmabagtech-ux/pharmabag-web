'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onApiEvent } from '@pharmabag/api-client';
import { useToast } from '@/components/shared/Toast';

/**
 * Subscribes to global API events and shows toast notifications / handles redirects.
 * Mount this once in the app layout.
 */
export function useApiEventHandler() {
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubs = [
      onApiEvent('auth:expired', (detail) => {
        toast(detail?.message || 'Session expired. Please log in again.', 'error');
        // Clear token and redirect
        if (typeof window !== 'undefined') {
          localStorage.removeItem('pb_access_token');
          localStorage.removeItem('pb_refresh_token');
        }
        window.dispatchEvent(new CustomEvent('open-login'));
      }),
      onApiEvent('error:forbidden', (detail) => {
        toast(detail?.message || 'You do not have permission to perform this action.', 'error');
      }),
      onApiEvent('error:server', (detail) => {
        toast(detail?.message || 'Something went wrong. Please try again.', 'error');
      }),
      onApiEvent('error:network', (detail) => {
        toast(detail?.message || 'Network error. Please check your connection.', 'error');
      }),
    ];

    return () => unsubs.forEach(fn => fn());
  }, [toast, router]);
}
