'use client';

import { useAuth } from '@pharmabag/api-client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [showRedirect, setShowRedirect] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setShowRedirect(true);
      const timeout = setTimeout(() => {
        router.push('/login');
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2fcf6]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (showRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2fcf6]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <Shield className="w-12 h-12 text-emerald-500 mx-auto" />
          <p className="text-gray-600 font-medium">Please log in to continue</p>
          <p className="text-sm text-gray-400">Redirecting to login...</p>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
