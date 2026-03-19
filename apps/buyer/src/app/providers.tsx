'use client';

import { ReactQueryProvider } from '@/lib/react-query-provider';
import { AuthProvider } from '@pharmabag/api-client';
import { ToastProvider } from '@/components/shared/Toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProvider>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </ReactQueryProvider>
  );
}
