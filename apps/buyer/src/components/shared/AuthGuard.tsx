'use client';

import { useAuth } from '@pharmabag/api-client';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Loader2 } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, refresh } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showRedirect, setShowRedirect] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setShowRedirect(true);
      const timeout = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('open-login'));
      }, 1500);
      return () => clearTimeout(timeout);
    }

    if (!isLoading && isAuthenticated && user) {
      // Check if buyer is verified: admin sets user.status = 'APPROVED' and buyerProfile.verificationStatus = 'VERIFIED'
      const bp = user.buyerProfile as any;
      const isApproved = user.status === 'APPROVED';
      const isBuyerProfileVerified = bp?.verificationStatus === 'VERIFIED';
      const isLegacyVerified = user.verificationStatus === 'VERIFIED';
      const isVerified = isApproved || isBuyerProfileVerified || isLegacyVerified;

      const allowedPaths = ['/onboarding', '/profile', '/support', '/products', '/cart', '/blogs', '/notifications', '/wishlist'];
      if (!isVerified && !allowedPaths.some(p => pathname.startsWith(p))) {
        router.push('/onboarding');
      }
    }
  }, [isLoading, isAuthenticated, user, router, pathname]);

  // Status Polling — poll every 10s while buyer is pending so approval reflects automatically
  useEffect(() => {
    const isPending = user?.status === 'PENDING' || user?.verificationStatus === 'PENDING';
    if (!isPending) return;

    const interval = setInterval(() => {
      refresh();
    }, 10000);
    return () => clearInterval(interval);
  }, [user?.status, user?.verificationStatus, refresh]);

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
          < Shield className="w-12 h-12 text-emerald-500 mx-auto" />
          <p className="text-gray-600 font-medium">Please log in to continue</p>
          <p className="text-sm text-gray-400">Redirecting to login...</p>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // If pending approval and not on onboarding, show pending view?
  // User wants "Disable orders until status=1+".
  // For now, redirecting to onboarding is fine, as onboarding can show "Awaiting approval".

  return <>{children}</>;
}
