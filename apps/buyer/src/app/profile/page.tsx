'use client';

import { motion } from 'framer-motion';
import { User, ShieldCheck, MapPin, Edit3, CreditCard, AlertCircle, Save, X, CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import { SkeletonProfileHeader } from '@/components/shared/LoaderSkeleton';
import { useToast } from '@/components/shared/Toast';
import { useBuyerProfile, useUpdateBuyerProfile, useCreateBuyerProfile } from '@/hooks/useBuyerProfile';
import { useAuth } from '@pharmabag/api-client';
import { useState } from 'react';
import AuthGuard from '@/components/shared/AuthGuard';

export default function ProfilePage() {
  const { data: profile, isLoading, isError } = useBuyerProfile();
  const updateProfile = useUpdateBuyerProfile();
  const createProfile = useCreateBuyerProfile();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const startEditing = () => {
    const addr = typeof profile?.address === 'object' ? profile.address : null;
    setForm({
      name: profile?.name ?? profile?.legalName ?? '',
      legalName: profile?.legalName ?? '',
      email: profile?.email ?? '',
      phone: profile?.phone ?? '',
      gstNumber: profile?.gstNumber ?? '',
      panNumber: profile?.panNumber ?? '',
      drugLicenseNumber: profile?.drugLicenseNumber ?? '',
      address: (profile?.address as any)?.street1 ?? (typeof profile?.address === 'string' ? profile.address : ''),
      city: profile?.city ?? (addr as any)?.city ?? '',
      state: profile?.state ?? (addr as any)?.state ?? '',
      pincode: profile?.pincode ?? (addr as any)?.pincode ?? '',
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateProfile.mutate({
      ...form,
      address: {
        street1: form.address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
      }
    } as any, {
      onSuccess: () => {
        setIsEditing(false);
        toast('Profile updated successfully!', 'success');
      },
      onError: () => toast('Failed to update profile', 'error'),
    });
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50/50">
        <Navbar showUserActions={true} />
        <div className="pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-12 sm:pb-20 w-full mx-auto px-[4vw] space-y-6 sm:space-y-8">
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
        <div className="pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-12 sm:pb-20 w-full mx-auto px-[4vw]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6 sm:space-y-8"
          >
            <div className="flex items-center gap-4 sm:gap-6 bg-white/40 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-white/40 shadow-xl">
              <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-lime-100 rounded-2xl sm:rounded-3xl flex items-center justify-center border border-lime-200 shadow-inner flex-shrink-0">
                <User className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-gray-800" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Welcome!</h1>
                <p className="text-gray-500 font-medium">{user?.phone ?? ''}</p>
              </div>
            </div>

            <div className="bg-white/40 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-white/40 shadow-xl space-y-4 sm:space-y-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Complete Your Profile</h2>
              <p className="text-gray-500 text-sm">Fill in your details to get started with ordering.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {[
                  { key: 'legalName', label: 'Business / Legal Name' },
                  { key: 'gstNumber', label: 'GST Number' },
                  { key: 'panNumber', label: 'PAN Number' },
                  { key: 'drugLicenseNumber', label: 'Drug License No.' },
                  { key: 'pincode', label: 'Pincode' },
                  { key: 'city', label: 'City' },
                  { key: 'state', label: 'State' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">{label}</label>
                    <input
                      value={form[key] ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-5 py-3 bg-white/60 rounded-2xl border border-gray-200 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-lime-300 focus:border-transparent"
                    />
                  </div>
                ))}
                <div className="md:col-span-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Address</label>
                  <textarea
                    value={form.address ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    rows={2}
                    className="w-full px-5 py-3 bg-white/60 rounded-2xl border border-gray-200 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-lime-300 focus:border-transparent resize-none"
                  />
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  createProfile.mutate({
                    ...form,
                    address: {
                      street1: form.address,
                      city: form.city,
                      state: form.state,
                      pincode: form.pincode,
                    }
                  } as any, {
                    onSuccess: () => toast('Profile created successfully!', 'success'),
                    onError: () => toast('Failed to create profile. Please fill all required fields.', 'error'),
                  });
                }}
                disabled={createProfile.isPending}
                className="px-8 py-3 bg-lime-300 text-gray-900 rounded-2xl font-bold flex items-center gap-2 hover:bg-lime-400 transition-colors shadow-lg disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {createProfile.isPending ? 'Saving...' : 'Save Profile'}
              </motion.button>
            </div>
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
      
      <div className="pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-12 sm:pb-20 w-full mx-auto px-[4vw]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6 sm:space-y-8"
        >
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
                <p className="text-gray-500 font-medium">{profile.email ?? ''} {profile.email && profile.phone ? '•' : ''} {profile.phone}</p>
              </div>
            </div>
            {!isEditing ? (
              <button
                onClick={startEditing}
                className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-black transition-colors shadow-lg"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  disabled={updateProfile.isPending}
                  className="px-6 py-3 bg-lime-300 text-gray-900 rounded-2xl font-bold flex items-center gap-2 hover:bg-lime-400 transition-colors shadow-lg disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {updateProfile.isPending ? 'Saving...' : 'Save'}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-3 bg-white border border-gray-200 rounded-2xl font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            )}
          </div>

          {isEditing ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/40 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-white/40 shadow-xl space-y-4 sm:space-y-6"
            >
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-4">Edit Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {[
                  { key: 'name', label: 'Full Name' },
                  { key: 'email', label: 'Email Address' },
                  { key: 'phone', label: 'Phone Number' },
                  { key: 'gstNumber', label: 'GST Number' },
                  { key: 'drugLicenseNumber', label: 'Drug License No.' },
                  { key: 'pincode', label: 'Pincode' },
                  { key: 'city', label: 'City' },
                  { key: 'state', label: 'State' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">{label}</label>
                    <input
                      value={form[key] ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-5 py-3 bg-white/60 rounded-2xl border border-gray-200 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-lime-300 focus:border-transparent"
                    />
                  </div>
                ))}
                <div className="md:col-span-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Address</label>
                  <textarea
                    value={form.address ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    rows={2}
                    className="w-full px-5 py-3 bg-white/60 rounded-2xl border border-gray-200 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-lime-300 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-white/40 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-white/40 shadow-xl"
                >
                  <div className="flex items-center gap-3 mb-4 sm:mb-6 md:mb-8">
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

                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-white/40 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-white/40 shadow-xl"
                >
                  <div className="flex items-center gap-3 mb-4 sm:mb-6 md:mb-8">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <MapPin className="w-6 h-6 text-blue-700" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Delivery Address</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <p className="text-gray-700 leading-relaxed font-medium">
                      {fullAddress || 'No address saved yet.'}
                    </p>
                    <button
                      onClick={startEditing}
                      className="text-blue-600 font-bold hover:text-blue-700 underline underline-offset-4 decoration-2"
                    >
                      Change Address
                    </button>
                  </div>
                </motion.div>
              </div>

              <motion.div
                whileHover={{ y: -5 }}
                className="bg-white/40 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-white/40 shadow-xl"
              >
                <div className="flex items-center gap-3 mb-4 sm:mb-6 md:mb-8">
                  <div className="p-2 bg-orange-100 rounded-xl">
                    <CreditCard className="w-6 h-6 text-orange-700" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Saved Payment Methods</h2>
                </div>
                
                <div className="flex items-center justify-center h-20 border-2 border-dashed border-gray-200 rounded-3xl">
                  <button className="text-gray-400 font-bold hover:text-gray-600 transition-colors">
                    + Add New Card or UPI
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
</main>
    </AuthGuard>
  );
}
