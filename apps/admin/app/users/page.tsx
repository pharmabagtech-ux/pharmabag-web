"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, UserCheck, UserX, Eye, Ban, Unlock, ChevronDown, ChevronUp, Building2, FileText, MapPin, Palmtree } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Input, Badge, Pagination } from "@/components/ui";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import Link from "next/link";
import { useAdminUsers, useAffirmUserStatus, useUserById, useUpdateGstPanStatus } from "@/hooks/useAdmin";

type RoleFilter = "all" | "BUYER" | "SELLER" | "ADMIN";
type StatusFilter = "all" | "APPROVED" | "PENDING" | "BLOCKED" | "VACATION";

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
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data: usersData, isLoading } = useAdminUsers(page, limit);
  const updateStatus = useAffirmUserStatus();
  const updateGstStatus = useUpdateGstPanStatus();

  // Backend returns { data: [...], total: ... } inside data field
  const users: any[] = Array.isArray(usersData) ? usersData : (usersData?.data ?? []);
  const totalUsers = usersData?.total ?? users.length;
  const totalPages = Math.max(1, Math.ceil(totalUsers / limit));

  const vacationCount = users.filter((u: any) => u.role === "SELLER" && u.isOnVacation).length;

  const filtered = users.filter((u: any) =>
    (role === "all" || u.role === role) &&
    (status === "all" || (status === "VACATION" ? (u.role === "SELLER" && u.isOnVacation) : u.status === status)) &&
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
            <p className="text-sm text-muted-foreground mt-0.5">{users.length} total users · {users.filter((u: any) => u.status === "PENDING").length} pending{vacationCount > 0 && <> · <span className="text-amber-600">{vacationCount} on vacation</span></>}</p>
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
          <div className="flex gap-1.5 flex-wrap" role="group" aria-label="Filter by status">
            {(["all", "APPROVED", "PENDING", "BLOCKED", "VACATION"] as StatusFilter[]).map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className={cn("px-3 py-2 rounded-xl text-xs font-medium border transition-all",
                  status === s
                    ? (s === "VACATION" ? "bg-amber-500 text-white border-amber-500" : "bg-primary text-white border-primary")
                    : (s === "VACATION" ? "border-amber-200 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20" : "border-border text-muted-foreground hover:bg-accent/60")
                )}>{s === "all" ? "All" : s === "VACATION" ? `🏖 Vacation (${vacationCount})` : s}</button>
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
                  const isExpanded = (isSeller || u.role === "BUYER") && expandedUser === u.id;
                  return (
                    <React.Fragment key={u.id}>
                      <motion.tr initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                        className={cn("hover:bg-accent/30 transition-colors", (isSeller || u.role === "BUYER") && "cursor-pointer")}
                        onClick={() => (isSeller || u.role === "BUYER") && setExpandedUser(isExpanded ? null : u.id)}>
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
                          <div className="flex items-center gap-1.5">
                            <Badge variant={u.status === "APPROVED" ? "success" : u.status === "PENDING" ? "warning" : "error"}>{u.status}</Badge>
                            {u.role === "SELLER" && u.isOnVacation && (
                              <Badge variant="warning" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                                <Palmtree className="h-3 w-3" /> Vacation
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-muted-foreground">{u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-1">
                              <Link href={`/users/${u.id}`} onClick={(e) => e.stopPropagation()} aria-label="View user" title="View user details"
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-primary hover:bg-primary/10 transition-colors">
                                <Eye className="h-3.5 w-3.5" />
                              </Link>
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
                            </div>

                            {/* Legacy IDFY Actions */}
                            {u.role === 'BUYER' && u.gstPanResponse && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); updateGstStatus.mutate({ userId: u.id, role: 'BUYER', data: { verified: true, creditTier: 'PREPAID' } }); }}
                                  className="px-2 py-1 text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 rounded hover:bg-blue-100 transition-colors">
                                  Prepaid
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); updateGstStatus.mutate({ userId: u.id, role: 'BUYER', data: { verified: true, creditTier: 'EMI' } }); }}
                                  className="px-2 py-1 text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-100 rounded hover:bg-purple-100 transition-colors">
                                  EMI
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); updateGstStatus.mutate({ userId: u.id, role: 'BUYER', data: { verified: true, creditTier: 'FULLCREDIT' } }); }}
                                  className="px-2 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 rounded hover:bg-emerald-100 transition-colors">
                                  Full
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); updateGstStatus.mutate({ userId: u.id, role: 'BUYER', data: { verified: false } }); }}
                                  className="px-2 py-1 text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 rounded hover:bg-red-100 transition-colors">
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="px-5 bg-muted/10">
                            {u.role === "SELLER" ? <SellerDetails userId={u.id} /> : (
                              <div className="py-4 space-y-4">
                                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                  <FileText className="h-4 w-4" /> IDFY Verification Response
                                </div>
                                <pre className="p-4 bg-muted/20 border border-border rounded-xl text-xs font-mono overflow-auto max-h-60">
                                  {JSON.stringify(u.gstPanResponse, null, 2)}
                                </pre>
                              </div>
                            )}
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

        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
      </div>
    </AdminLayout>
  );
}
