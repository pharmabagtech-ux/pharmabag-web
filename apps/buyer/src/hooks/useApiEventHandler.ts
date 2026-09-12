'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onApiEvent } from '@pharmabag/api-client';
import { useToast } from '@/components/shared/Toast';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Subscribes to global API events and shows toast notifications / handles redirects.
 * Mount this once in the app layout.
 */
export function useApiEventHandler() {
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubs = [
      onApiEvent('auth:expired', () => {
        /**
         * The session ended — sign the buyer out, but do NOT touch their bag.
         *
         * This used to call `localCart.clear()`. A pharmacy that had spent an
         * hour assembling a ₹20,000 order came back from a break — or hit one
         * flaky moment during a token refresh — to an empty bag, with no
         * message, no warning and no prompt to sign in again. Every other
         * handler in this file tells the buyer what happened; the one that
         * destroyed their work was the only silent one.
         *
         * The bag lives in localStorage and belongs to the browser, not the
         * session. It is the buyer's own list until checkout, and nothing
         * about an expired token makes it wrong.
         */
        if (typeof window !== 'undefined') {
          localStorage.removeItem('pb_access_token');
          localStorage.removeItem('pb_refresh_token');
        }

        // The bag survives; anything fetched as that user does not.
        queryClient.invalidateQueries({ queryKey: ['cart'] });

        toast('Your session expired. Please sign in again — your bag is safe.', 'info');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('open-login'));
        }
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
