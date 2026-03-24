"use client";

import { motion } from "framer-motion";
import {
  User, Building2, FileText, CreditCard, MapPin, Phone, Mail,
  Shield, CheckCircle2, Clock, XCircle, AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui";
import { useSellerFullProfile } from "@/hooks/useSeller";
import { useSellerAuth } from "@/store";
import { cn } from "@/lib/utils";

function InfoRow({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-3 border-b border-border/30 last:border-0">
      <span className="text-sm text-muted-foreground sm:w-40 flex-shrink-0">{label}</span>
      <span className={cn("text-sm text-foreground", mono && "font-mono")}>{value || "—"}</span>
    </div>
  );
}

function VerificationBadge({ status }: { status?: string }) {
  const map: Record<string, { label: string; variant: "success" | "warning" | "error"; icon: React.ElementType }> = {
    APPROVED: { label: "Verified", variant: "success", icon: CheckCircle2 },
    PENDING: { label: "Pending Verification", variant: "warning", icon: Clock },
    REJECTED: { label: "Rejected", variant: "error", icon: XCircle },
    NEW: { label: "Unverified", variant: "error", icon: AlertTriangle },
  };
  const key = status?.toUpperCase() ?? "NEW";
  const { label, variant, icon: Icon } = map[key] ?? map.NEW;
  return <Badge variant={variant}><Icon className="h-3 w-3" />{label}</Badge>;
}

export default function ProfilePage() {
  const { user } = useSellerAuth();
  const { data: profileData, isLoading } = useSellerFullProfile();
  const profile = profileData ?? user;

  if (isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading profile...</div>;
  }

  const p: any = profile || {};
  const sellerProfile = p.sellerProfile ?? p;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold text-foreground">Seller Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your business and verification details</p>
      </motion.div>

      {/* Profile Overview Card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-2xl p-6">
        <div className="flex items-start gap-5">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-semibold text-foreground">{p.name || p.businessName || sellerProfile.businessName || "Seller"}</h2>
              <VerificationBadge status={p.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{sellerProfile.businessName || p.storeName || ""}</p>
            {p.email && <p className="text-xs text-muted-foreground mt-1">{p.email}</p>}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Info */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" />Business Information</h3>
          <div>
            <InfoRow label="Business Name" value={sellerProfile.businessName || p.storeName} />
            <InfoRow label="Owner Name" value={p.name} />
            <InfoRow label="Phone" value={p.phone} mono />
            <InfoRow label="Email" value={p.email} />
            <InfoRow label="Registration Date" value={p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : undefined} />
          </div>
        </motion.div>

        {/* KYC Details */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Shield className="h-4 w-4 text-primary" />KYC & Compliance</h3>
          <div>
            <InfoRow label="GST Number" value={sellerProfile.gstNumber || sellerProfile.gst} mono />
            <InfoRow label="PAN Number" value={sellerProfile.panNumber || sellerProfile.pan} mono />
            <InfoRow label="Drug License" value={sellerProfile.drugLicenseNumber || sellerProfile.drugLicense} mono />
            <InfoRow label="FSSAI Number" value={sellerProfile.fssaiNumber} mono />
            <InfoRow label="Verification" value={undefined} />
            <div className="pl-0 sm:pl-44 -mt-3 pb-2">
              <VerificationBadge status={p.status} />
            </div>
          </div>
        </motion.div>

        {/* Address */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />Business Address</h3>
          <div>
            <InfoRow label="Street" value={sellerProfile.address?.street || sellerProfile.streetAddress} />
            <InfoRow label="City" value={sellerProfile.address?.city || sellerProfile.city} />
            <InfoRow label="State" value={sellerProfile.address?.state || sellerProfile.state} />
            <InfoRow label="Pincode" value={sellerProfile.address?.pincode || sellerProfile.pincode} mono />
          </div>
        </motion.div>

        {/* Bank Details */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" />Bank Details</h3>
          <div>
            <InfoRow label="Account Holder" value={sellerProfile.bankDetails?.accountHolder || sellerProfile.accountHolderName} />
            <InfoRow label="Account Number" value={sellerProfile.bankDetails?.accountNumber} mono />
            <InfoRow label="Bank Name" value={sellerProfile.bankDetails?.bankName} />
            <InfoRow label="IFSC Code" value={sellerProfile.bankDetails?.ifsc || sellerProfile.bankDetails?.ifscCode} mono />
            <InfoRow label="Branch" value={sellerProfile.bankDetails?.branch} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
