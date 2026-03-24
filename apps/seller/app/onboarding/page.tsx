"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Store, Building2, FileText, CheckCircle2, MapPin, ArrowRight } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { useUpdateSellerProfile } from "@/hooks/useSeller";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export default function SellerOnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const updateProfile = useUpdateSellerProfile();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    companyName: "",
    gstNumber: "",
    panNumber: "",
    drugLicenseNumber: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-uppercase inputs that require it
    const payload = {
      ...formData,
      gstNumber: formData.gstNumber.toUpperCase(),
      panNumber: formData.panNumber.toUpperCase(),
      drugLicenseNumber: formData.drugLicenseNumber.toUpperCase(),
    };

    if (payload.gstNumber.length !== 15) return toast.error("GST number must be 15 characters");
    if (payload.panNumber.length !== 10) return toast.error("PAN number must be 10 characters");

    setLoading(true);
    try {
      await updateProfile.mutateAsync(payload);
      
      // Backend sets User.status = PENDING. Refetch from server so guard picks it up.
      // Do NOT mutate status locally — backend is the single source of truth.
      await queryClient.invalidateQueries({ queryKey: ["seller", "me"] });
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
            
            {/* Section 1: Business Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/50 pb-2 mb-4">
                <Building2 className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Business Information</h2>
              </div>
              <Input label="Business Legal Name / Company Name" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="e.g. PharmaCorp Medicine Distributors" required />
            </div>

            {/* Section 2: Legal Documents */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/50 pb-2 mb-4">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">KYC & Licenses</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="GST Number" name="gstNumber" value={formData.gstNumber} onChange={handleChange} placeholder="e.g. 27AABCU9603R1ZM" maxLength={15} required className="uppercase" />
                <Input label="PAN Number" name="panNumber" value={formData.panNumber} onChange={handleChange} placeholder="e.g. ABCDE1234F" maxLength={10} required className="uppercase" />
              </div>
              <Input label="Drug License Number" name="drugLicenseNumber" value={formData.drugLicenseNumber} onChange={handleChange} placeholder="e.g. DL-MH-2024-005678" required className="uppercase" />
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
