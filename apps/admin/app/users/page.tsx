"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, UserCheck, UserX, Eye, Ban, Unlock, ChevronDown, ChevronUp, Building2, FileText, MapPin } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Input, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useAdminUsers, useAffirmUserStatus, useUserById } from "@/hooks/useAdmin";

type RoleFilter = "all" | "BUYER" | "SELLER" | "ADMIN";
type StatusFilter = "all" | "APPROVED" | "PENDING" | "BLOCKED";

function SellerDetails({ userId }: { userId: string }) {
  const { data: user, isLoading } = useUserById(userId);
  if (isLoading) return <div className="py-4 text-center text-sm text-muted-foreground">Loading seller details…</div>;
  const sp = user?.sellerProfile;
  if (!sp) return <div className="py-4 text-center text-sm text-muted-foreground">No seller profile submitted yet</div>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase"><Building2 className="h-3 w-3" />Business</div>
        <p className="text-sm font-medium text-foreground">{sp.companyName || "—"}</p>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase"><FileText className="h-3 w-3" />GST Number</div>
        <p className="text-sm font-mono text-foreground">{sp.gstNumber || "—"}</p>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase"><FileText className="h-3 w-3" />PAN Number</div>
        <p className="text-sm font-mono text-foreground">{sp.panNumber || "—"}</p>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase"><FileText className="h-3 w-3" />Drug License</div>
        <p className="text-sm font-mono text-foreground">{sp.drugLicenseNumber || "—"}</p>
      </div>
      <div className="space-y-1 sm:col-span-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase"><MapPin className="h-3 w-3" />Address</div>
        <p className="text-sm text-foreground">{[sp.address, sp.city, sp.state, sp.pincode].filter(Boolean).join(", ") || "—"}</p>
      </div>
      {sp.verificationStatus && (
        <div className="space-y-1">
          <div className="text-xs font-semibold text-muted-foreground uppercase">Verification</div>
          <Badge variant={sp.verificationStatus === "APPROVED" ? "success" : sp.verificationStatus === "PENDING" ? "warning" : "error"}>{sp.verificationStatus}</Badge>
        </div>
      )}
    </div>
  );
}

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const { data: usersData, isLoading } = useAdminUsers();
  const updateStatus = useAffirmUserStatus();

  // Backend returns { data: [...], total: ... } inside data field
  const users: any[] = Array.isArray(usersData) ? usersData : (usersData?.data ?? []);

  const filtered = users.filter((u: any) =>
    (role === "all" || u.role === role) &&
    (status === "all" || u.status === status) &&
    (!search || (u.phone ?? "").includes(search) || (u.email ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  const handleAction = async (id: string, phone: string, action: "approve" | "reject" | "block" | "unblock") => {
    try {
      await updateStatus.mutateAsync({ userId: id, action });
      toast.success(`User ${phone} — ${action}d successfully`);
    } catch {
      toast.error(`Failed to ${action} user ${phone}`);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading users…</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-2xl text-foreground">User Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{users.length} total users · {users.filter((u: any) => u.status === "PENDING").length} pending</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input placeholder="Search by phone or email…" value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
          </div>
          <div className="flex gap-1.5 flex-wrap" role="group" aria-label="Filter by role">
            {(["all", "BUYER", "SELLER", "ADMIN"] as RoleFilter[]).map(r => (
              <button key={r} onClick={() => setRole(r)}
                className={cn("px-3 py-2 rounded-xl text-xs font-medium border transition-all", role === r ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:bg-accent/60")}>{r === "all" ? "All" : r}</button>
            ))}
          </div>
          <div className="flex gap-1.5" role="group" aria-label="Filter by status">
            {(["all", "APPROVED", "PENDING", "BLOCKED"] as StatusFilter[]).map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className={cn("px-3 py-2 rounded-xl text-xs font-medium border transition-all", status === s ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:bg-accent/60")}>{s === "all" ? "All" : s}</button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="Users">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  {["Phone", "Role", "Email", "Status", "Created", "Actions"].map(h => (
                    <th key={h} scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">No users found</td></tr>
                ) : filtered.map((u: any, i: number) => {
                  const isSeller = u.role === "SELLER";
                  const isExpanded = isSeller && expandedUser === u.id;
                  return (
                    <React.Fragment key={u.id}>
                      <motion.tr initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                        className={cn("hover:bg-accent/30 transition-colors", isSeller && "cursor-pointer")}
                        onClick={() => isSeller && setExpandedUser(isExpanded ? null : u.id)}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-sm flex-shrink-0" aria-hidden>
                              {(u.phone ?? "?").slice(-2)}
                            </div>
                            <div>
                              <span className="font-mono text-sm text-foreground">{u.phone ?? "—"}</span>
                              {u.sellerProfile?.companyName && (
                                <p className="text-xs text-muted-foreground mt-0.5">{u.sellerProfile.companyName}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={u.role === "BUYER" ? "success" : u.role === "SELLER" ? "info" : "orange"}>{u.role}</Badge>
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">{u.email ?? "—"}</td>
                        <td className="px-5 py-4">
                          <Badge variant={u.status === "APPROVED" ? "success" : u.status === "PENDING" ? "warning" : "error"}>{u.status}</Badge>
                        </td>
                        <td className="px-5 py-4 text-xs text-muted-foreground">{u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            {isSeller && (
                              <button onClick={(e) => { e.stopPropagation(); setExpandedUser(isExpanded ? null : u.id); }} aria-label="View details" title="View seller details"
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-primary hover:bg-primary/10 transition-colors">
                                {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                              </button>
                            )}
                            {u.status === "PENDING" && (
                              <>
                                <button onClick={(e) => { e.stopPropagation(); void handleAction(u.id, u.phone, "approve"); }} aria-label="Approve" title="Approve"
                                  className="h-7 w-7 rounded-lg flex items-center justify-center text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                                  <UserCheck className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); void handleAction(u.id, u.phone, "reject"); }} aria-label="Reject" title="Reject"
                                  className="h-7 w-7 rounded-lg flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                  <UserX className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                            {u.status === "APPROVED" && (
                              <button onClick={(e) => { e.stopPropagation(); void handleAction(u.id, u.phone, "block"); }} aria-label="Block" title="Block user"
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-orange-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors">
                                <Ban className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {u.status === "BLOCKED" && (
                              <button onClick={(e) => { e.stopPropagation(); void handleAction(u.id, u.phone, "unblock"); }} aria-label="Unblock" title="Unblock user"
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-blue-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                <Unlock className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="px-5 bg-muted/10">
                            <SellerDetails userId={u.id} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
