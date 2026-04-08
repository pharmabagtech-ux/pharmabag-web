"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Store, Building2, FileText, CheckCircle2, AlertCircle, MapPin, 
  ArrowRight, ArrowLeft, Loader2, Upload, Shield, Phone, Mail 
} from "lucide-react";
import { Button, Input } from "@/components/ui";
import { 
  useUpdateSellerProfile, 
  useVerifyPanGst, 
  useUploadDrugLicense,
  useSellerMe,
  useSellerProfile
} from "@/hooks/useSeller";
import { useSellerAuth } from "@/store";
import toast from "react-hot-toast";

type Step = 1 | 2;

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi", "Chandigarh", "Puducherry",
];

export default function SellerOnboardingPage() {
  const router = useRouter();
  const { user, logout } = useSellerAuth();
  const { data: serverUser, isLoading: isUserLoading } = useSellerMe(true);
  const { data: existingProfile, isLoading: isProfileLoading } = useSellerProfile(true);
  
  const updateProfile = useUpdateSellerProfile();
  const verifyPanGst = useVerifyPanGst();
  const uploadKyc = useUploadDrugLicense();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState({
    companyName: "",
    gstNumber: "",
    panNumber: "",
    drugLicenseNumber: "",
    drugLicenseUrl: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [verifyType, setVerifyType] = useState<"GST" | "PAN">("GST");
  const [gstVerified, setGstVerified] = useState(false);
  const [panVerified, setPanVerified] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");

  // Sync existing data if any (for resuming)
  useEffect(() => {
    if (existingProfile) {
      setFormData(prev => ({
        ...prev,
        companyName: (existingProfile.companyName === 'My Store' ? '' : existingProfile.companyName) || (existingProfile.businessName === 'My Store' ? '' : existingProfile.businessName) || prev.companyName,
        gstNumber: existingProfile.gstNumber || prev.gstNumber,
        panNumber: existingProfile.panNumber || prev.panNumber,
        drugLicenseNumber: existingProfile.drugLicenseNumber || prev.drugLicenseNumber,
        drugLicenseUrl: existingProfile.drugLicenseUrl || prev.drugLicenseUrl,
        address: existingProfile.address || prev.address,
        city: existingProfile.city || prev.city,
        state: existingProfile.state || prev.state,
        pincode: existingProfile.pincode || prev.pincode,
      }));
      if (existingProfile.gstNumber) setGstVerified(true);
      if (existingProfile.panNumber) setPanVerified(true);
    }
  }, [existingProfile]);

  const updateField = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!formData.companyName.trim()) e.companyName = "Business name is required";
    
    if (verifyType === "GST") {
      if (!formData.gstNumber.trim()) e.gstNumber = "GST number is required";
      if (!gstVerified) e.gstNumber = "Please verify your GST number";
    } else {
      if (!formData.panNumber.trim()) e.panNumber = "PAN number is required";
      if (!panVerified) e.panNumber = "Please verify your PAN number";
    }
    
    if (!formData.drugLicenseNumber.trim()) e.drugLicenseNumber = "Drug license is required";
    if (!formData.address.trim()) e.address = "Address is required";
    if (!formData.city.trim()) e.city = "City is required";
    if (!formData.state) e.state = "State is required";
    if (!formData.pincode.trim()) e.pincode = "Pincode is required";
    else if (!/^\d{6}$/.test(formData.pincode.trim())) e.pincode = "Invalid pincode";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleVerify = () => {
    const value = verifyType === "GST" ? formData.gstNumber.trim() : formData.panNumber.trim();
    if (!value) return toast.error(`Please enter a valid ${verifyType} number`);

    verifyPanGst.mutate(
      { type: verifyType, value: value.toUpperCase() },
      {
        onSuccess: (res) => {
          if (res.status) {
            if (verifyType === "GST") setGstVerified(true);
            else setPanVerified(true);
            
            setVerificationResult(res);
            updateField("companyName", res.legalName);
            if (res.address) updateField("address", res.address);
            
            toast.success(`${res.message}: ${res.legalName}`);
          } else {
            toast.error(res.message || `Invalid ${verifyType}`);
          }
        },
        onError: () => toast.error("Verification failed. Please try again."),
      }
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }
    
    const kycFormData = new FormData();
    kycFormData.append("file", file);
    
    setUploading(true);
    uploadKyc.mutate(kycFormData, {
      onSuccess: (res: any) => {
        updateField("drugLicenseUrl", res.url ?? res);
        setUploadedFileName(file.name);
        toast.success("Document uploaded successfully");
      },
      onError: () => toast.error("Upload failed"),
      onSettled: () => setUploading(false),
    });
  };

  const handleSubmit = async () => {
    // Construct payload ensuring we don't send empty strings for optional fields 
    // that have strict regex validation on the backend.
    const payload: any = {
      companyName: formData.companyName,
      businessName: formData.companyName,
      drugLicenseNumber: formData.drugLicenseNumber.toUpperCase(),
      drugLicenseUrl: formData.drugLicenseUrl,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      gstPanResponse: verificationResult,
    };

    if (formData.gstNumber?.trim()) {
      payload.gstNumber = formData.gstNumber.trim().toUpperCase();
    }
    
    if (formData.panNumber?.trim()) {
      payload.panNumber = formData.panNumber.trim().toUpperCase();
    }

    try {
      await updateProfile.mutateAsync(payload);
      toast.success("Application submitted successfully");
    } catch (error: any) {
      const msg = error?.response?.data?.message;
      const displayMsg = Array.isArray(msg) ? msg.join(", ") : msg;
      toast.error(displayMsg || "Failed to submit application");
    }
  };

  const steps = [
    { num: 1, label: "Business Details", icon: Building2 },
    { num: 2, label: "Review & Submit", icon: Shield },
  ];

  // ──── RENDER: APPLICATION UNDER REVIEW ────────
  const effectiveUser = serverUser || user;
  const profile = existingProfile;
  
  const isPending = effectiveUser?.status === "PENDING" && (
    (effectiveUser.businessName && effectiveUser.businessName !== 'My Store') || 
    (effectiveUser.companyName && effectiveUser.companyName !== 'My Store') || 
    (profile?.businessName && profile.businessName !== 'My Store') || 
    (profile?.companyName && profile.companyName !== 'My Store') ||
    profile?.gstNumber ||
    profile?.panNumber
  );
  const isRejected = effectiveUser?.status === "REJECTED" || profile?.verificationStatus === "REJECTED";

  if (isPending) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full bg-white rounded-3xl p-10 shadow-xl shadow-indigo-100/50 border border-indigo-50/50">
            <div className="mx-auto w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-8">
              <Shield className="w-10 h-10 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-4">Application Under Review</h1>
            <p className="text-slate-600 font-medium mb-8 leading-relaxed">
              Your seller profile has been submitted and is currently being reviewed by our team. You will be able to access the dashboard once verified.
            </p>
            <div className="bg-indigo-50/50 rounded-2xl p-4 mb-8">
              <p className="text-sm text-indigo-700 font-semibold flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Verification in progress
              </p>
              <p className="text-xs text-indigo-600/70 mt-1">Usually takes 24–48 hours</p>
            </div>
            <Button variant="ghost" className="w-full text-slate-500 hover:text-indigo-600" onClick={() => logout()}>
              Sign Out
            </Button>
          </motion.div>
      </div>
    );
  }

  // ──── RENDER: ONBOARDING FORM ────────
  return (
    <div className="min-h-screen bg-[#f8fafc] relative overflow-hidden">
      {/* Background blobs for premium feel */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-indigo-100 rounded-full mix-blend-multiply filter blur-[120px] opacity-40 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[35vw] h-[35vw] bg-blue-100 rounded-full mix-blend-multiply filter blur-[150px] opacity-30 pointer-events-none" />

      {/* Simplified Navbar */}
      <nav className="relative z-20 px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Store className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">PharmaBag <span className="text-primary">Seller</span></span>
        </div>
        <Button variant="outline" size="sm" onClick={() => logout()} className="rounded-xl border-slate-200">Sign Out</Button>
      </nav>

      <div className="relative z-10 pt-8 pb-20 px-4 w-full max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-slate-900 mb-2">Complete Your Profile</h1>
          <p className="text-slate-500 font-medium">Verify your business to start selling</p>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-4 mb-10">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.num;
            const isDone = step > s.num;
            return (
              <div key={s.num} className="flex items-center gap-2">
                {i > 0 && <div className={`w-12 h-0.5 ${isDone ? 'bg-primary' : 'bg-slate-200'}`} />}
                <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all ${
                  isDone ? 'bg-indigo-50 text-indigo-700' :
                  isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' :
                  'bg-white text-slate-400 border border-slate-100'
                }`}>
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-[32px] border border-white shadow-xl shadow-slate-200/50 overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 space-y-8">
                
                {isRejected && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-5 bg-red-50 border border-red-100 rounded-2xl flex gap-3 mb-6">
                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-black text-red-900 uppercase tracking-wider">Application Needs Correction</h3>
                      <p className="text-xs text-red-700 font-medium leading-relaxed mt-1">
                        Your previous application was not approved. Please review your business details and documents, then resubmit for verification.
                      </p>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-50 rounded-lg"><Building2 className="w-5 h-5 text-indigo-600" /></div>
                    <h2 className="text-xl font-bold text-slate-900">Business Information</h2>
                  </div>

                  {/* Verification Toggle */}
                  <div className="grid grid-cols-2 p-1 bg-slate-100/80 rounded-2xl">
                    {(["GST", "PAN"] as const).map((type) => (
                      <button key={type} onClick={() => { setVerifyType(type); setErrors({}); }} className={`py-2.5 text-sm font-bold rounded-xl transition-all ${verifyType === type ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                        {type} Verification
                      </button>
                    ))}
                  </div>

                  {verifyType === "GST" ? (
                    <div className="space-y-1.5">
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Input label="GST Number" value={formData.gstNumber} onChange={(e) => { updateField("gstNumber", e.target.value.toUpperCase()); setGstVerified(false); }} placeholder="e.g. 27AABCU9603R1ZM" maxLength={15} required className="uppercase h-14 rounded-2xl" error={errors.gstNumber} />
                        </div>
                        <Button type="button" variant="secondary" onClick={handleVerify} disabled={verifyPanGst.isPending || gstVerified} className="h-14 px-6 rounded-2xl font-bold mb-0">
                          {gstVerified ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : verifyPanGst.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Input label="PAN Number" value={formData.panNumber} onChange={(e) => { updateField("panNumber", e.target.value.toUpperCase()); setPanVerified(false); }} placeholder="e.g. ABCDE1234F" maxLength={10} required className="uppercase h-14 rounded-2xl" error={errors.panNumber} />
                        </div>
                        <Button type="button" variant="secondary" onClick={handleVerify} disabled={verifyPanGst.isPending || panVerified} className="h-14 px-6 rounded-2xl font-bold mb-0">
                          {panVerified ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : verifyPanGst.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {verificationResult?.status && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-3 items-start">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-emerald-800">Verified: {verificationResult.legalName}</p>
                        <p className="text-xs text-emerald-600/80 line-clamp-1">{verificationResult.address}</p>
                      </div>
                    </motion.div>
                  )}

                  <Input label="Business Legal Name" value={formData.companyName} onChange={(e) => updateField("companyName", e.target.value)} placeholder="Full registered company name" className="h-14 rounded-2xl" error={errors.companyName} />
                  
                  <div className="space-y-4 pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-3 mb-2">
                       <div className="p-2 bg-indigo-50 rounded-lg"><FileText className="w-5 h-5 text-indigo-600" /></div>
                       <h2 className="text-xl font-bold text-slate-900">Drug License</h2>
                    </div>
                    <Input label="Drug License Number" value={formData.drugLicenseNumber} onChange={(e) => updateField("drugLicenseNumber", e.target.value.toUpperCase())} placeholder="e.g. DL-MH-2024-005678" className="h-14 rounded-2xl uppercase" error={errors.drugLicenseNumber} />
                    
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Upload License Document (Optional)</label>
                      <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} className="hidden" />
                      <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-[24px] hover:border-primary/50 hover:bg-slate-50 transition-all text-slate-500 group">
                        {uploading ? (
                          <><Loader2 className="w-8 h-8 animate-spin mb-2 text-primary" /> <span className="font-bold">Uploading...</span></>
                        ) : uploadedFileName ? (
                          <><CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" /> <span className="font-bold text-slate-900">{uploadedFileName}</span></>
                        ) : (
                          <><Upload className="w-8 h-8 mb-2 group-hover:text-primary transition-colors" /> <span className="font-bold group-hover:text-slate-900">Click to upload document</span> <span className="text-xs mt-1">PDF, JPG, PNG up to 5MB</span></>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-3 mb-2">
                       <div className="p-2 bg-indigo-50 rounded-lg"><MapPin className="w-5 h-5 text-indigo-600" /></div>
                       <h2 className="text-xl font-bold text-slate-900">Registered Address</h2>
                    </div>
                    <Input label="Street Address" value={formData.address} onChange={(e) => updateField("address", e.target.value)} placeholder="Building No, Street, Landmark" className="h-14 rounded-2xl" error={errors.address} />
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="City" value={formData.city} onChange={(e) => updateField("city", e.target.value)} placeholder="City" className="h-14 rounded-2xl" error={errors.city} />
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">State</label>
                        <select value={formData.state} onChange={(e) => updateField("state", e.target.value)} className="w-full h-14 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-medium focus:border-primary outline-none transition-all">
                          <option value="">Select State</option>
                          {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {errors.state && <p className="text-xs text-red-500">{errors.state}</p>}
                      </div>
                    </div>
                    <Input label="Pincode" value={formData.pincode} onChange={(e) => updateField("pincode", e.target.value.replace(/\D/g, "").slice(0,6))} placeholder="400001" maxLength={6} className="h-14 rounded-2xl" error={errors.pincode} />
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100 flex justify-end">
                  <Button size="lg" className="h-14 px-10 rounded-2xl font-black text-lg shadow-xl shadow-primary/25" onClick={() => validateStep1() && setStep(2)}>
                    Continue <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 space-y-8">
                <div className="space-y-6">
                  <h2 className="text-2xl font-black text-slate-900">Review Your Application</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: "Business Name", value: formData.companyName },
                      { label: "GST Number", value: formData.gstNumber || "N/A" },
                      { label: "PAN Number", value: formData.panNumber || "N/A" },
                      { label: "Drug License", value: formData.drugLicenseNumber },
                      { label: "Location", value: `${formData.city}, ${formData.state} - ${formData.pincode}` },
                    ].map(item => (
                      <div key={item.label} className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100/50">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">{item.label}</p>
                        <p className="text-sm font-bold text-slate-800">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100/50">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Full Address</p>
                    <p className="text-sm font-bold text-slate-800">{formData.address}</p>
                  </div>

                  <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 font-medium leading-relaxed">
                      By submitting, you agree that the information provided is correct. Your profile will be verified by our compliance team. If any details are incorrect, your application may be rejected.
                    </p>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100 flex justify-between">
                  <Button variant="ghost" size="lg" className="h-14 px-8 rounded-2xl font-bold text-slate-500" onClick={() => setStep(1)}>
                    <ArrowLeft className="mr-2 w-5 h-5" /> Back
                  </Button>
                  <Button size="lg" className="h-14 px-10 rounded-2xl font-black text-lg shadow-xl shadow-primary/25" onClick={handleSubmit} loading={updateProfile.isPending}>
                    Submit Application <CheckCircle2 className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
