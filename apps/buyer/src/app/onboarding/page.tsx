'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, FileText, Upload, CheckCircle2, AlertCircle, ArrowRight,
  ArrowLeft, Loader2, Shield, MapPin, Phone, Mail, User
} from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import LoginModal from '@/components/landing/LoginModal';
import AuthGuard from '@/components/shared/AuthGuard';
import { useCreateBuyerProfile, useUpdateBuyerProfile, useVerifyPanGst, useBuyerProfile } from '@/hooks/useBuyerProfile';
import { useUploadKycDocument } from '@/hooks/useStorage';
import { useToast } from '@/components/shared/Toast';
import { useAuth } from '@pharmabag/api-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Step = 1 | 2 | 3;

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Delhi', 'Chandigarh', 'Puducherry',
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const createProfile = useCreateBuyerProfile();
  const updateProfile = useUpdateBuyerProfile();
  const verifyPanGst = useVerifyPanGst();
  const uploadKyc = useUploadKycDocument();
  const { data: existingProfile, isLoading: isProfileLoading } = useBuyerProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState({
    legalName: '',
    email: '',
    gstNumber: '',
    panNumber: '',
    drugLicenseNumber: '',
    drugLicenseUrl: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [gstVerified, setGstVerified] = useState(false);
  const [panVerified, setPanVerified] = useState(false);
  const [verifyType, setVerifyType] = useState<'GST' | 'PAN'>('GST');
  const [verificationResult, setVerificationResult] = useState<{ legalName?: string; address?: string; status?: boolean; message?: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => { const next = { ...prev }; delete next[key]; return next; });
    }
  };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!form.legalName.trim()) e.legalName = 'Legal business name is required';
    
    if (verifyType === 'GST') {
      if (!form.gstNumber.trim()) e.gstNumber = 'GST number is required';
      else if (!/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}\d[Z]{1}[A-Z\d]{1}$/i.test(form.gstNumber.trim())) e.gstNumber = 'Invalid GST number format';
      if (!gstVerified) e.gstNumber = 'Please verify your GST number first';
    } else {
      if (!form.panNumber.trim()) e.panNumber = 'PAN number is required';
      else if (!/^[A-Z]{5}\d{4}[A-Z]{1}$/i.test(form.panNumber.trim())) e.panNumber = 'Invalid PAN number format';
      if (!panVerified) e.panNumber = 'Please verify your PAN number first';
    }
    
    if (!form.drugLicenseNumber.trim()) e.drugLicenseNumber = 'Drug license number is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!form.address.trim()) e.address = 'Address is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.state) e.state = 'State is required';
    if (!form.pincode.trim()) e.pincode = 'Pincode is required';
    else if (!/^\d{6}$/.test(form.pincode.trim())) e.pincode = 'Invalid 6-digit pincode';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleVerify = () => {
    const value = verifyType === 'GST' ? form.gstNumber.trim() : form.panNumber.trim();
    if (!value) return;

    verifyPanGst.mutate({ 
      type: verifyType, 
      value: value.toUpperCase() 
    }, {
      onSuccess: (res) => {
        if (res.status) {
          if (verifyType === 'GST') setGstVerified(true);
          else setPanVerified(true);
          
          setVerificationResult(res);
          updateField('legalName', res.legalName);
          if (res.address) updateField('address', res.address);
          
          toast(`${res.message}: ${res.legalName}`, 'success');
        } else {
          toast(res.message || `Invalid ${verifyType}`, 'error');
        }
      },
      onError: () => toast('Verification failed - retry', 'error'),
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast('File size must be less than 5MB', 'error');
      return;
    }
    setUploading(true);
    uploadKyc.mutate(file, {
      onSuccess: (res: any) => {
        updateField('drugLicenseUrl', res.url ?? res);
        setUploadedFileName(file.name);
        setUploading(false);
        toast('Document uploaded', 'success');
      },
      onError: () => {
        setUploading(false);
        toast('Upload failed', 'error');
      },
    });
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = () => {
    const payload = {
      legalName: form.legalName.trim(),
      gstNumber: form.gstNumber.trim().toUpperCase(),
      panNumber: form.panNumber.trim().toUpperCase(),
      drugLicenseNumber: form.drugLicenseNumber.trim(),
      drugLicenseUrl: form.drugLicenseUrl || undefined,
      address: {
        street1: form.address.trim(),
        street2: '',
        city: form.city.trim(),
        state: form.state,
        pincode: form.pincode.trim(),
      },
      licence: form.drugLicenseNumber.trim() ? [
        {
          type: 'DL20B',
          number: form.drugLicenseNumber.trim(),
          expiry: '',
          imgUrl: form.drugLicenseUrl || undefined,
        }
      ] : undefined,
      gstPanResponse: verificationResult || undefined,
    };

    const onSuccess = () => {
      toast('Profile submitted successfully! Verification in progress.', 'success');
      // Refresh auth to pick up the new status
      refresh();
      router.push('/profile');
    };

    // Try create first (backend converts empty stub to real profile), fallback to update
    createProfile.mutate(payload, {
      onSuccess,
      onError: () => {
        // If create fails (profile already has data), try update
        updateProfile.mutate(payload as any, {
          onSuccess,
          onError: () => toast('Failed to submit profile. Please try again.', 'error'),
        });
      },
    });
  };

  const steps = [
    { num: 1, label: 'Business Details', icon: Building2 },
    { num: 2, label: 'Address', icon: MapPin },
    { num: 3, label: 'Review & Submit', icon: Shield },
  ];

  // Check if buyer is already approved — redirect to products
  const isApproved = user?.status === 'APPROVED' || user?.verificationStatus === 'VERIFIED';
  if (isApproved) {
    router.replace('/products');
    return null;
  }

  // Check if buyer has actually completed the onboarding form (not just an empty stub)
  // Backend auto-creates an empty stub at registration (legalName is empty)
  // A completed profile has legalName filled + verificationStatus is PENDING or VERIFIED
  const profile = existingProfile as any;
  const bp = user?.buyerProfile as any;
  const hasCompletedOnboarding = !isProfileLoading && (
    (profile?.legalName && profile.legalName.trim() !== '') ||
    (bp?.legalName && bp.legalName.trim() !== '') ||
    (profile?.verificationStatus === 'PENDING' && profile?.legalName) ||
    (profile?.verificationStatus === 'VERIFIED') ||
    (bp?.verificationStatus === 'PENDING' && bp?.legalName) ||
    (bp?.verificationStatus === 'VERIFIED')
  );
  const isRejected = user?.status === 'REJECTED' || user?.verificationStatus === 'REJECTED' || profile?.verificationStatus === 'REJECTED';

  if (hasCompletedOnboarding && !isRejected) {
    return (
      <AuthGuard>
        <main className="min-h-screen bg-[#f2fcf6] relative overflow-hidden">
          <Navbar showUserActions onLoginClick={() => setIsLoginOpen(true)} />
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center" style={{ minHeight: 'calc(100vh - 80px)', paddingTop: '120px' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl p-8 shadow-xl">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-yellow-600" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 mb-4">Application Under Review</h1>
              <p className="text-gray-600 font-medium mb-6">
                Your business profile has been submitted and is currently being reviewed by our team. You will receive a notification once your account is verified.
              </p>
              <p className="text-sm text-gray-400 mb-8">
                Verification typically takes 24–48 hours.
              </p>
              <Link href="/products" className="inline-flex items-center justify-center w-full h-14 bg-gray-900 text-white rounded-xl font-bold transition-all hover:bg-gray-800">
                Continue Browsing
              </Link>
            </motion.div>
          </div>
          <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        </main>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#f2fcf6] relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-emerald-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-40 pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vw] bg-[#e6fa64] rounded-full mix-blend-multiply filter blur-[150px] opacity-30 pointer-events-none" />

        <Navbar showUserActions onLoginClick={() => setIsLoginOpen(true)} />

        <div className="pt-20 sm:pt-24 md:pt-28 pb-12 sm:pb-20 px-[4vw] w-full mx-auto relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Complete Your Profile</h1>
            <p className="text-gray-500 mt-2">Set up your business details to start ordering</p>
          </div>

          {/* Step Indicators */}
          <div className="flex items-center justify-center gap-4 mb-10">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.num;
              const isDone = step > s.num;
              return (
                <div key={s.num} className="flex items-center gap-2">
                  {i > 0 && <div className={`w-12 h-0.5 ${isDone ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isDone ? 'bg-emerald-100 text-emerald-700' :
                    isActive ? 'bg-emerald-500 text-white' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Form Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-6 md:p-8">
            <AnimatePresence mode="wait">
              {/* Step 1: Business Details */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Business Details</h2>

                  {/* Verification Type Toggle */}
                  <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
                    {(['GST', 'PAN'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => { setVerifyType(type); setErrors({}); }}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                          verifyType === type ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {type} Verification
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Legal Business Name</label>
                    <input
                      type="text"
                      value={form.legalName}
                      onChange={(e) => updateField('legalName', e.target.value)}
                      placeholder="Enter your registered business name"
                      className={`w-full px-4 py-3 rounded-xl border ${errors.legalName ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50/50'} focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none transition-colors`}
                    />
                    {errors.legalName && <p className="text-xs text-red-500 mt-1">{errors.legalName}</p>}
                  </div>

                  {verifyType === 'GST' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={form.gstNumber}
                          onChange={(e) => { updateField('gstNumber', e.target.value.toUpperCase()); setGstVerified(false); }}
                          placeholder="22AAAAA0000A1Z5"
                          maxLength={15}
                          className={`flex-1 px-4 py-3 rounded-xl border ${errors.gstNumber ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50/50'} focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none transition-colors uppercase`}
                        />
                        <button
                          type="button"
                          onClick={handleVerify}
                          disabled={verifyPanGst.isPending || gstVerified}
                          className={`px-4 py-3 rounded-xl font-medium text-sm transition-colors ${
                            gstVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500 text-white hover:bg-emerald-600'
                          } disabled:opacity-60`}
                        >
                          {gstVerified ? <CheckCircle2 className="w-4 h-4" /> : verifyPanGst.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                        </button>
                      </div>
                      {errors.gstNumber && <p className="text-xs text-red-500 mt-1">{errors.gstNumber}</p>}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={form.panNumber}
                          onChange={(e) => { updateField('panNumber', e.target.value.toUpperCase()); setPanVerified(false); }}
                          placeholder="ABCDE1234F"
                          maxLength={10}
                          className={`flex-1 px-4 py-3 rounded-xl border ${errors.panNumber ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50/50'} focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none transition-colors uppercase`}
                        />
                        <button
                          type="button"
                          onClick={handleVerify}
                          disabled={verifyPanGst.isPending || panVerified}
                          className={`px-4 py-3 rounded-xl font-medium text-sm transition-colors ${
                            panVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500 text-white hover:bg-emerald-600'
                          } disabled:opacity-60`}
                        >
                          {panVerified ? <CheckCircle2 className="w-4 h-4" /> : verifyPanGst.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                        </button>
                      </div>
                      {errors.panNumber && <p className="text-xs text-red-500 mt-1">{errors.panNumber}</p>}
                    </div>
                  )}

                  {/* Success Banner */}
                  {verificationResult && verificationResult.status && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl space-y-2"
                    >
                      <div className="flex items-center gap-2 text-emerald-700 font-bold">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>✅ Valid: {verificationResult.legalName}</span>
                      </div>
                      <p className="text-sm text-emerald-600 ml-7">{verificationResult.address}</p>
                      <div className="ml-7 pt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-700">
                          Pending Admin Approval
                        </span>
                      </div>
                    </motion.div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Drug License Number</label>
                    <input
                      type="text"
                      value={form.drugLicenseNumber}
                      onChange={(e) => updateField('drugLicenseNumber', e.target.value)}
                      placeholder="Enter your drug license number"
                      className={`w-full px-4 py-3 rounded-xl border ${errors.drugLicenseNumber ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50/50'} focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none transition-colors`}
                    />
                    {errors.drugLicenseNumber && <p className="text-xs text-red-500 mt-1">{errors.drugLicenseNumber}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Drug License Document (Optional)</label>
                    <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} className="hidden" />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-gray-200 rounded-xl hover:border-emerald-400 transition-colors text-gray-500 hover:text-emerald-600"
                    >
                      {uploading ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</>
                      ) : uploadedFileName ? (
                        <><CheckCircle2 className="w-5 h-5 text-emerald-500" /> {uploadedFileName}</>
                      ) : (
                        <><Upload className="w-5 h-5" /> Upload Drug License (PDF, JPG, PNG - Max 5MB)</>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Address */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Business Address</h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                    <textarea
                      value={form.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      placeholder="Enter your complete business address"
                      rows={3}
                      className={`w-full px-4 py-3 rounded-xl border ${errors.address ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50/50'} focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none transition-colors resize-none`}
                    />
                    {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => updateField('city', e.target.value)}
                        placeholder="City"
                        className={`w-full px-4 py-3 rounded-xl border ${errors.city ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50/50'} focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none transition-colors`}
                      />
                      {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <select
                        value={form.state}
                        onChange={(e) => updateField('state', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border ${errors.state ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50/50'} focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none transition-colors`}
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={form.pincode}
                      onChange={(e) => updateField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6-digit pincode"
                      maxLength={6}
                      className={`w-full px-4 py-3 rounded-xl border ${errors.pincode ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50/50'} focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none transition-colors`}
                    />
                    {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode}</p>}
                  </div>
                </motion.div>
              )}

              {/* Step 3: Review */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Review Your Details</h2>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: 'Business Name', value: form.legalName },
                        { label: 'GST Number', value: form.gstNumber, verified: gstVerified },
                        { label: 'PAN Number', value: form.panNumber, verified: panVerified },
                        { label: 'Drug License', value: form.drugLicenseNumber },
                        { label: 'City', value: form.city },
                        { label: 'State', value: form.state },
                        { label: 'Pincode', value: form.pincode },
                      ].map((item) => (
                        <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                          <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                            {item.value || '—'}
                            {item.verified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500 mb-0.5">Address</p>
                      <p className="text-sm font-medium text-gray-900">{form.address || '—'}</p>
                    </div>
                    {uploadedFileName && (
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-0.5">Drug License Document</p>
                        <p className="text-sm font-medium text-emerald-700 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" /> {uploadedFileName}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-700">
                      Your profile will be verified by our team. You&apos;ll receive a notification once approved.
                      Verification typically takes 24-48 hours.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              {step > 1 ? (
                <button
                  onClick={() => setStep((step - 1) as Step)}
                  className="flex items-center gap-2 px-5 py-2.5 text-gray-600 hover:text-gray-900 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={createProfile.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 disabled:opacity-60 transition-colors"
                >
                  {createProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Submit for Verification
                </button>
              )}
            </div>
          </div>
        </div>
<LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      </main>
    </AuthGuard>
  );
}
