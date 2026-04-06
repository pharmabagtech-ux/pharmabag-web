"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Phone, Mail, Building2, FileText, MapPin, Calendar, ShieldCheck, Edit, Trash2, Ban, Unlock, UserCheck, UserX, ExternalLink, Image } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Badge, Input, Modal, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useUserById, useAffirmUserStatus, useDeleteUser, useUpdateUserStatus } from "@/hooks/useAdmin";
import toast from "react-hot-toast";

const STATUS_LEVELS = [
  { level: 0, label: "Pending", desc: "New registration, cannot order", color: "warning" as const },
  { level: 1, label: "Approved", desc: "Can place orders with advance payment", color: "success" as const },
  { level: 2, label: "EMI Enabled", desc: "Can place milestone/EMI orders", color: "info" as const },
  { level: 3, label: "Full Credit", desc: "30-day credit line enabled", color: "purple" as const },
];

const getFullUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/api$/, "");
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
};

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: user, isLoading } = useUserById(id);
  const updateStatus = useAffirmUserStatus();
  const deleteUserMutation = useDeleteUser();
  const updateStatusLevel = useUpdateUserStatus();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleAction = async (action: "approve" | "reject" | "block" | "unblock") => {
    try {
      await updateStatus.mutateAsync({ userId: id, action });
      toast.success(`User ${action}d successfully`);
    } catch {
      toast.error(`Failed to ${action} user`);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUserMutation.mutateAsync(id);
      toast.success("User deleted");
      router.push("/users");
    } catch {
      toast.error("Failed to delete user");
    }
  };

  const handleStatusLevel = async (level: number) => {
    try {
      await updateStatusLevel.mutateAsync({ userId: id, statusLevel: level });
      toast.success(`Status updated to level ${level}`);
    } catch {
      toast.error("Failed to update status level");
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64 lg:col-span-2" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground">User not found</p>
            <Button variant="ghost" onClick={() => router.push("/users")} className="mt-4">Back to Users</Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const sp = user.sellerProfile;
  const bp = user.buyerProfile;
  const isSeller = user.role === "SELLER";
  const isBuyer = user.role === "BUYER";

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/users")} className="h-9 w-9 rounded-xl bg-accent/60 flex items-center justify-center hover:bg-accent transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="font-semibold text-2xl text-foreground">{sp?.companyName || bp?.legalName || user.businessName || user.name || user.phone}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={user.role === "BUYER" ? "success" : user.role === "SELLER" ? "info" : "orange"}>{user.role}</Badge>
                <Badge variant={user.status === "APPROVED" ? "success" : user.status === "PENDING" ? "warning" : "error"}>{user.status}</Badge>
                {isSeller && user.isOnVacation && <Badge variant="warning">🏖 Vacation</Badge>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user.status === "PENDING" && (
              <>
                <Button size="sm" variant="primary" onClick={() => handleAction("approve")} leftIcon={<UserCheck className="h-4 w-4" />}>Approve</Button>
                <Button size="sm" variant="danger" onClick={() => handleAction("reject")} leftIcon={<UserX className="h-4 w-4" />}>Reject</Button>
              </>
            )}
            {user.status === "APPROVED" && (
              <Button size="sm" variant="warning" onClick={() => handleAction("block")} leftIcon={<Ban className="h-4 w-4" />}>Block</Button>
            )}
            {user.status === "BLOCKED" && (
              <Button size="sm" variant="outline" onClick={() => handleAction("unblock")} leftIcon={<Unlock className="h-4 w-4" />}>Unblock</Button>
            )}
            <Button size="sm" variant="danger" onClick={() => setShowDeleteModal(true)} leftIcon={<Trash2 className="h-4 w-4" />}>Delete</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Info Card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6">
            <h2 className="font-semibold text-foreground mb-4">Contact Information</h2>
            <div className="space-y-4">
              <InfoRow icon={Phone} label="Phone" value={user.phone ?? "—"} />
              <InfoRow icon={Mail} label="Email" value={user.email ?? "—"} />
              <InfoRow icon={Calendar} label="Joined" value={user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "—"} />
              {user.lastLoginAt && <InfoRow icon={Calendar} label="Last Login" value={new Date(user.lastLoginAt).toLocaleDateString("en-IN")} />}
            </div>
          </motion.div>

          {/* Seller/Buyer Profile */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6 lg:col-span-2">
            <h2 className="font-semibold text-foreground mb-4">{isSeller ? "Seller Profile" : "Buyer Profile"}</h2>
            {isSeller && sp ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={Building2} label="Company" value={sp.companyName ?? sp.businessName ?? "—"} />
                <InfoRow icon={FileText} label="GST Number" value={sp.gstNumber ?? "—"} mono />
                <InfoRow icon={FileText} label="PAN Number" value={sp.panNumber ?? "—"} mono />
                <InfoRow icon={FileText} label="Drug License" value={sp.drugLicenseNumber ?? "—"} mono />
                {sp.drugLicenseUrl && (
                  <div className="space-y-1 sm:col-span-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase">
                      <Image className="h-3 w-3" />Drug License Document
                    </div>
                    <div className="mt-2">
                      {/\.(jpe?g|png|webp)$/i.test(sp.drugLicenseUrl) ? (
                        <a href={getFullUrl(sp.drugLicenseUrl)} target="_blank" rel="noopener noreferrer" className="block">
                          <img src={getFullUrl(sp.drugLicenseUrl)} alt="Drug License" className="max-w-xs max-h-48 rounded-xl border border-border object-contain" />
                        </a>
                      ) : (
                        <a href={getFullUrl(sp.drugLicenseUrl)} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-accent/30 text-sm font-medium text-foreground hover:bg-accent transition-colors">
                          <FileText className="h-4 w-4" />View Drug License Document<ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
                <InfoRow icon={MapPin} label="Address" value={[sp.address, sp.city, sp.state, sp.pincode].filter(Boolean).join(", ") || "—"} className="sm:col-span-2" />
                {sp.bankAccountNumber && <InfoRow icon={Building2} label="Bank Account" value={`${sp.bankName ?? ""} — ${sp.bankAccountNumber}`} mono />}
                {sp.ifscCode && <InfoRow icon={FileText} label="IFSC" value={sp.ifscCode} mono />}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={Building2} label="Legal / Business Name" value={bp?.legalName ?? user.businessName ?? user.name ?? "—"} />
                <InfoRow icon={FileText} label="GST Number" value={bp?.gstNumber ?? user.gstNumber ?? "—"} mono />
                <InfoRow icon={FileText} label="PAN Number" value={bp?.panNumber ?? user.panNumber ?? "—"} mono />
                <InfoRow icon={FileText} label="Drug License No." value={bp?.drugLicenseNumber ?? user.drugLicenseNumber ?? "—"} mono />
                {(bp?.drugLicenseUrl ?? user.drugLicenseUrl) && (
                  <div className="space-y-1 sm:col-span-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase">
                      <Image className="h-3 w-3" />Drug License Document
                    </div>
                    <div className="mt-2">
                      {/\.(jpe?g|png|webp)$/i.test(bp?.drugLicenseUrl ?? user.drugLicenseUrl ?? '') ? (
                        <a href={getFullUrl(bp?.drugLicenseUrl ?? user.drugLicenseUrl ?? "")} target="_blank" rel="noopener noreferrer" className="block">
                          <img src={getFullUrl(bp?.drugLicenseUrl ?? user.drugLicenseUrl ?? "")} alt="Drug License" className="max-w-xs max-h-48 rounded-xl border border-border object-contain" />
                        </a>
                      ) : (
                        <a href={getFullUrl(bp?.drugLicenseUrl ?? user.drugLicenseUrl ?? "")} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-accent/30 text-sm font-medium text-foreground hover:bg-accent transition-colors">
                          <FileText className="h-4 w-4" />View Drug License Document<ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
                <InfoRow icon={MapPin} label="Address" value={
                  bp?.address
                    ? (typeof bp.address === 'object'
                        ? [bp.address.street1, bp.address.city, bp.address.state, bp.address.pincode].filter(Boolean).join(", ")
                        : [bp.address, bp.city, bp.state, bp.pincode].filter(Boolean).join(", "))
                    : ([user.address, user.city, user.state, user.pincode].filter(Boolean).join(", ") || "—")
                } className="sm:col-span-2" />
                {bp?.email && <InfoRow icon={Mail} label="Email" value={bp.email} />}
                {bp?.phone && <InfoRow icon={Phone} label="Phone" value={bp.phone} mono />}
              </div>
            )}
          </motion.div>
        </div>

        {/* Status Level Management (for Buyers) */}
        {(isBuyer || isSeller) && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-6">
            <h2 className="font-semibold text-foreground mb-4">Trust / Status Level</h2>
            <p className="text-sm text-muted-foreground mb-4">Controls what payment methods and credit lines this user can access.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {STATUS_LEVELS.map(({ level, label, desc, color }) => {
                const current = user.statusLevel === level;
                return (
                  <button key={level} onClick={() => handleStatusLevel(level)}
                    className={cn("p-4 rounded-xl border-2 text-left transition-all",
                      current ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={color}>{label}</Badge>
                      <span className="text-xs font-mono text-muted-foreground">Lv.{level}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                    {current && <p className="text-xs font-semibold text-primary mt-2">✓ Current Level</p>}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* KYC Documents - Seller */}
        {isSeller && sp && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-6">
            <h2 className="font-semibold text-foreground mb-4">KYC Verification</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KycCard label="PAN Verification" status={sp.panVerified ? "verified" : "pending"} value={sp.panNumber} />
              <KycCard label="GST Verification" status={sp.gstVerified ? "verified" : "pending"} value={sp.gstNumber} />
              <KycCard label="Drug License" status={sp.drugLicenseVerified ? "verified" : "pending"} value={sp.drugLicenseNumber} />
            </div>
          </motion.div>
        )}

        {/* KYC Documents - Buyer */}
        {isBuyer && bp && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-6">
            <h2 className="font-semibold text-foreground mb-4">Buyer Verification</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KycCard label="GST Verification" status={bp.verificationStatus === "VERIFIED" ? "verified" : "pending"} value={bp.gstNumber} />
              <KycCard label="PAN" status={bp.panNumber ? "verified" : "pending"} value={bp.panNumber} />
              <KycCard label="Drug License" status={bp.drugLicenseNumber ? "verified" : "pending"} value={bp.drugLicenseNumber} />
            </div>
            {(bp.gstPanResponse || user.gstPanResponse) && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">IDFY Verification Response</p>
                <pre className="p-4 bg-muted/20 border border-border rounded-xl text-xs font-mono overflow-auto max-h-48">
                  {JSON.stringify(bp.gstPanResponse ?? user.gstPanResponse, null, 2)}
                </pre>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete User">
        <p className="text-sm text-muted-foreground mb-4">Are you sure you want to delete this user? This action will cascade-delete all associated orders, payments, and data. This cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} loading={deleteUserMutation.isPending}>Delete User</Button>
        </div>
      </Modal>
    </AdminLayout>
  );
}

function InfoRow({ icon: Icon, label, value, mono, className }: { icon: React.ElementType; label: string; value: string; mono?: boolean; className?: string }) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase">
        <Icon className="h-3 w-3" />{label}
      </div>
      <p className={cn("text-sm text-foreground", mono && "font-mono")}>{value}</p>
    </div>
  );
}

function KycCard({ label, status, value }: { label: string; status: "verified" | "pending"; value?: string }) {
  return (
    <div className={cn("p-4 rounded-xl border", status === "verified" ? "border-green-200 bg-green-50/50 dark:bg-green-900/10 dark:border-green-800" : "border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10 dark:border-yellow-800")}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <Badge variant={status === "verified" ? "success" : "warning"}>{status === "verified" ? "Verified" : "Pending"}</Badge>
      </div>
      {value && <p className="text-xs font-mono text-muted-foreground">{value}</p>}
    </div>
  );
}
