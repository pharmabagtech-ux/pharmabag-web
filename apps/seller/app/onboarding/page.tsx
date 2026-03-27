"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Store, Building2, FileText, CheckCircle2, MapPin, ArrowRight, Loader2, Upload } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { useUpdateSellerProfile, useVerifyPanGst, useUploadKycDocument } from "@/hooks/useSeller";
import { useQueryClient } from "@tanstack/react-query";
import { useSellerAuth } from "@/store";
import toast from "react-hot-toast";
import { useEffect } from "react";

export default function SellerOnboardingPage() {
  const router = useRouter();
  const { user } = useSellerAuth();
  
  const queryClient = useQueryClient();
  const updateProfile = useUpdateSellerProfile();
  const verifyPanGst = useVerifyPanGst();
  const uploadKyc = useUploadKycDocument();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [verifyType, setVerifyType] = useState<"GST" | "PAN">("GST");
  const [gstVerified, setGstVerified] = useState(false);
  const [panVerified, setPanVerified] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const updateField = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (verifyType === "GST" && !gstVerified) return toast.error("Please verify your GST number first");
    if (verifyType === "PAN" && !panVerified) return toast.error("Please verify your PAN number first");

    const payload = {
      ...formData,
      gstNumber: formData.gstNumber.toUpperCase(),
      panNumber: formData.panNumber.toUpperCase(),
      drugLicenseNumber: formData.drugLicenseNumber.toUpperCase(),
      gst_pan_response: verificationResult,
    };

    setLoading(true);
    try {
      await updateProfile.mutateAsync(payload);
      
      await queryClient.invalidateQueries({ queryKey: ["seller", "me"] });
      await queryClient.invalidateQueries({ queryKey: ["seller", "profile"] });
      await queryClient.refetchQueries({ queryKey: ["seller", "me"] });
      
      toast.success("Application submitted successfully");
      router.replace("/dashboard");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 bg-primary text-white rounded-xl flex items-center justify-center mb-4">
            <Store className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Complete Your Seller Profile</h1>
          <p className="text-muted-foreground text-sm">
            Please provide your business and legal details to start selling on PharmaBag.
          </p>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Verification Type Toggle */}
            <div className="flex p-1 bg-accent/50 rounded-xl mb-6">
              {(["GST", "PAN"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setVerifyType(type)}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                    verifyType === type ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {type} Verification
                </button>
              ))}
            </div>

            {/* Section 1: Business Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/50 pb-2 mb-4">
                <Building2 className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Business Information</h2>
              </div>
              
              {verifyType === "GST" ? (
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input label="GST Number" name="gstNumber" value={formData.gstNumber} onChange={(e) => { handleChange(e); setGstVerified(false); }} placeholder="e.g. 27AABCU9603R1ZM" maxLength={15} required className="uppercase" />
                  </div>
                  <Button type="button" variant="secondary" onClick={handleVerify} disabled={verifyPanGst.isPending || gstVerified} className="mb-0 h-[42px]">
                    {gstVerified ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : verifyPanGst.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify GST"}
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input label="PAN Number" name="panNumber" value={formData.panNumber} onChange={(e) => { handleChange(e); setPanVerified(false); }} placeholder="e.g. ABCDE1234F" maxLength={10} required className="uppercase" />
                  </div>
                  <Button type="button" variant="secondary" onClick={handleVerify} disabled={verifyPanGst.isPending || panVerified} className="mb-0 h-[42px]">
                    {panVerified ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : verifyPanGst.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify PAN"}
                  </Button>
                </div>
              )}

              {/* Success Banner */}
              {verificationResult && verificationResult.status && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-green-600 font-bold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Valid: {verificationResult.legalName}</span>
                  </div>
                  <p className="text-sm text-green-600/80 ml-6">{verificationResult.address}</p>
                </motion.div>
              )}

              <Input label="Business Legal Name / Company Name" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="e.g. PharmaCorp Medicine Distributors" required />
            </div>

            {/* Section 2: Legal Documents */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/50 pb-2 mb-4">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Drug License</h2>
              </div>
              <Input label="Drug License Number" name="drugLicenseNumber" value={formData.drugLicenseNumber} onChange={handleChange} placeholder="e.g. DL-MH-2024-005678" required className="uppercase" />
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Drug License Document (Optional)</label>
                <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-border rounded-xl hover:border-primary transition-colors text-muted-foreground hover:text-foreground">
                  {uploading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</>
                  ) : uploadedFileName ? (
                    <><CheckCircle2 className="w-5 h-5 text-green-500" /> {uploadedFileName}</>
                  ) : (
                    <><Upload className="w-5 h-5" /> Upload Drug License (PDF, JPG, PNG - Max 5MB)</>
                  )}
                </button>
              </div>
            </div>

            {/* Section 3: Address Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/50 pb-2 mb-4">
                <MapPin className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Registered Address</h2>
              </div>
              <Input label="Street Address" name="address" value={formData.address} onChange={handleChange} placeholder="123 Industrial Estate, Phase 1" required />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="City" name="city" value={formData.city} onChange={handleChange} placeholder="Mumbai" required />
                <Input label="State" name="state" value={formData.state} onChange={handleChange} placeholder="Maharashtra" required />
                <Input label="Pincode" name="pincode" value={formData.pincode} onChange={handleChange} placeholder="400001" maxLength={6} required />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-6 border-t border-border/50 flex items-center justify-between">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Secure 256-bit encryption</p>
              <Button type="submit" size="lg" loading={loading} rightIcon={<ArrowRight className="h-4 w-4" />}>
                Submit for Verification
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
