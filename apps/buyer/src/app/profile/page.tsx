'use client';

import { motion } from 'framer-motion';
import { User, ShieldCheck, MapPin, CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import { SkeletonProfileHeader } from '@/components/shared/LoaderSkeleton';
import { useBuyerProfile } from '@/hooks/useBuyerProfile';
import { useAuth } from '@pharmabag/api-client';
import { usePurchaseAccess } from '@/hooks/usePurchaseAccess';
import Link from 'next/link';
import AuthGuard from '@/components/shared/AuthGuard';

export default function ProfilePage() {
  const { data: profile, isLoading, isError } = useBuyerProfile();
  const { user } = useAuth();
  const { canPurchase, role } = usePurchaseAccess();

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50/50">
        <Navbar showUserActions={true} />
        <div className="pt-6 pb-28 lg:pt-32 lg:pb-20 w-full mx-auto px-[4vw] space-y-6 sm:space-y-8">
          <SkeletonProfileHeader />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            <div className="bg-white/40 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-white/40 shadow-xl animate-pulse">
              <div className="h-6 bg-gray-100 rounded-full w-40 mb-8" />
              <div className="space-y-6">
                <div className="h-5 bg-gray-100 rounded-full w-48" />
                <div className="h-5 bg-gray-100 rounded-full w-36" />
              </div>
            </div>
            <div className="bg-white/40 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-white/40 shadow-xl animate-pulse">
              <div className="h-6 bg-gray-100 rounded-full w-40 mb-8" />
              <div className="h-16 bg-gray-100 rounded-2xl" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (isError || !profile) {
    return (
      <main className="min-h-screen bg-gray-50/50">
        <Navbar showUserActions={true} />
        <div className="pt-6 pb-28 lg:pt-32 lg:pb-20 w-full mx-auto px-[4vw]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center py-20 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl gap-4"
          >
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            {/* A seller or admin signed into the storefront has no buyer profile
                and never will — /buyers/profile answers 403, not 404. Sending
                them to onboarding leads somewhere that cannot help them. */}
            {!canPurchase ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900">This page is for buyer accounts</h2>
                <p className="text-gray-500 text-center max-w-md">
                  {role === 'SELLER'
                    ? 'You are signed in as a seller, so there is no buyer profile to show. Your business details live in the Seller Portal.'
                    : 'You are signed in as an admin account, so there is no buyer profile to show.'}
                </p>
                {role === 'SELLER' && (
                  <a
                    href="https://seller.pharmabag.in"
                    className="px-8 py-3 bg-lime-300 text-gray-900 rounded-2xl font-bold hover:bg-lime-400 transition-colors shadow-lg"
                  >
                    Go to Seller Portal
                  </a>
                )}
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900">Profile Not Found</h2>
                <p className="text-gray-500">Please complete your onboarding to view your profile.</p>
                <Link href="/onboarding" className="px-8 py-3 bg-lime-300 text-gray-900 rounded-2xl font-bold hover:bg-lime-400 transition-colors shadow-lg">
                  Go to Onboarding
                </Link>
              </>
            )}
          </motion.div>
        </div>
      </main>
    );
  }

  const addr = typeof profile.address === 'object' ? profile.address : null;
  const street = (addr as any)?.street1 ?? (typeof profile.address === 'string' ? profile.address : '');
  const city = profile.city ?? (addr as any)?.city ?? '';
  const state = profile.state ?? (addr as any)?.state ?? '';
  const pincode = profile.pincode ?? (addr as any)?.pincode ?? '';
  const fullAddress = [street, city, state, pincode].filter(Boolean).join(', ');

  return (
    <AuthGuard>
      <main className="min-h-screen bg-gray-50/50">
        <Navbar showUserActions={true} />
        
        <div className="pt-6 pb-28 lg:pt-32 lg:pb-20 w-full mx-auto px-[4vw]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6 sm:space-y-8"
          >
            {/* Profile Header Card */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 bg-white/40 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-white/40 shadow-xl">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-lime-100 rounded-2xl sm:rounded-3xl flex items-center justify-center border border-lime-200 shadow-inner flex-shrink-0">
                  <User className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-gray-800" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">
                      {profile.name || profile.legalName || 'User'}
                    </h1>
                    {profile.isVerified && (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    )}
                  </div>
                  <p className="text-gray-500 font-medium tracking-tight">
                    {profile.email ?? ''} {profile.email && profile.phone ? '•' : ''} {profile.phone}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
              {/* KYC Information */}
              <motion.div
                whileHover={{ y: -5 }}
                className="bg-white/40 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-white/40 shadow-xl"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-100 rounded-xl">
                    <ShieldCheck className="w-6 h-6 text-purple-700" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">KYC Information</h2>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Legal Name</label>
                    <p className="text-lg font-bold text-gray-800">{profile.legalName || '—'}</p>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1">GST Number</label>
                    <p className="text-lg font-bold text-gray-800">{profile.gstNumber || '—'}</p>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1">PAN Number</label>
                    <p className="text-lg font-bold text-gray-800">{profile.panNumber || '—'}</p>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Drug License</label>
                    <p className="text-lg font-bold text-gray-800">{profile.drugLicenseNumber || '—'}</p>
                  </div>
                </div>
              </motion.div>

              {/* Delivery Address */}
              <motion.div
                whileHover={{ y: -5 }}
                className="bg-white/40 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-white/40 shadow-xl"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <MapPin className="w-6 h-6 text-blue-700" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Delivery Address</h2>
                </div>
                
                <div className="space-y-6">
                  <p className="text-gray-700 leading-relaxed font-semibold text-lg">
                    {fullAddress || 'No address saved yet.'}
                  </p>
                  <p className="text-sm text-gray-500 bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                    This address is linked to your verified business profile. To update this, please contact support.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Saved Payment Methods */}
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white/40 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-white/40 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-100 rounded-xl">
                  <CreditCard className="w-6 h-6 text-orange-700" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Saved Payment Methods</h2>
              </div>
              
              <div className="flex items-center justify-center h-24 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                <p className="text-gray-400 font-bold tracking-tight">Coming Soon</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </AuthGuard>
  );
}
