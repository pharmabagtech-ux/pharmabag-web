'use client';

import { ReactQueryProvider } from '@/lib/react-query-provider';
import { AuthProvider } from '@pharmabag/api-client';
import { ToastProvider } from '@/components/shared/Toast';
import { useApiEventHandler } from '@/hooks/useApiEventHandler';
import LoginModal from '@/components/landing/LoginModal';

function ApiEventBridge({ children }: { children: React.ReactNode }) {
  useApiEventHandler();
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProvider>
      <AuthProvider baseURL={process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL}>
        <ToastProvider>
          <ApiEventBridge>{children}</ApiEventBridge>
          <LoginModal />
        </ToastProvider>
      </AuthProvider>
    </ReactQueryProvider>
  );
}
