"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, UserCheck, UserX, Eye, Ban, Unlock, ChevronDown, ChevronUp, Building2, FileText, MapPin, Palmtree, ExternalLink, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Input, Badge, Pagination } from "@/components/ui";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import Link from "next/link";
import { useAdminUsers, useAdminSellers, useAffirmUserStatus, useUserById, useUpdateGstPanStatus, useDeleteUser, usePresignedUrl } from "@/hooks/useAdmin";

type RoleFilter = "all" | "BUYER" | "SELLER" | "ADMIN";
type StatusFilter = "all" | "APPROVED" | "PENDING" | "BLOCKED" | "VACATION";

const getFullUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/api$/, "");
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
};

function SecureDocViewer({ url, label, number, expiry }: { url: string; label: string; number?: string; expiry?: string }) {
  const { data: presignedUrl, isLoading } = usePresignedUrl(url);
  const displayUrl = presignedUrl || getFullUrl(url);
  const isImage = /\.(jpe?g|png|webp)$/i.test(url);

  if (isLoading) return <div className="h-20 w-32 bg-muted/50 animate-pulse rounded-lg" />;

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase">
          <FileText className="h-3 w-3" /> {label}
        </div>
        <div className="flex flex-col">
          {number && <p className="text-sm font-mono font-bold text-foreground">{number}</p>}
          {expiry && (
            <p className="text-[10px] text-muted-foreground">
              Expires: <span className="font-semibold text-foreground">{new Date(expiry).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
            </p>
          )}
        </div>
      </div>
      {isImage ? (
        <a href={displayUrl} target="_blank" rel="noopener noreferrer" className="block w-fit">
          <img
            src={displayUrl}
            alt={label}
            className="max-w-[200px] max-h-32 rounded-lg border border-border object-contain hover:border-primary/50 transition-colors"
            onError={(e) => {
              console.error("Image load failed", displayUrl);
            }}
          />
        </a>
      ) : (
        <a href={displayUrl} target="_blank" rel="noopener noreferrer"
           className="inline-flex items-center gap-1.5 text-sm text-primary font-bold hover:underline">
          View {label} <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}


function BuyerDetails({ userId }: { userId: string }) {
  const { data: user, isLoading } = useUserById(userId);
  if (isLoading) return <div className="py-4 text-center text-sm text-muted-foreground">Loading buyer details…</div>;
  const bp = user?.buyerProfile;
  if (!bp) return <div className="py-4 text-center text-sm text-muted-foreground">No buyer profile submitted yet</div>;
  return (
    <div className="py-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase"><Building2 className="h-3 w-3" />Legal Name</div>
          <p className="text-sm font-medium text-foreground">{bp.legalName || bp.name || "—"}</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase"><FileText className="h-3 w-3" />GST Number</div>
          <p className="text-sm font-mono text-foreground">{bp.gstNumber || "—"}</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase"><FileText className="h-3 w-3" />PAN Number</div>
          <p className="text-sm font-mono text-foreground">{bp.panNumber || "—"}</p>
        </div>

        {bp.drugLicenseUrl && (
          <SecureDocViewer 
            url={typeof bp.drugLicenseUrl === 'object' ? bp.drugLicenseUrl.url : bp.drugLicenseUrl} 
            label="License 1 (20B)" 
            number={bp.drugLicenseNumber} 
            expiry={bp.drugLicenseExpiry}
          />
        )}
        {bp.drugLicenseUrl2 && (
          <SecureDocViewer 
            url={typeof bp.drugLicenseUrl2 === 'object' ? bp.drugLicenseUrl2.url : bp.drugLicenseUrl2} 
            label="License 2 (21B)" 
            number={bp.drugLicenseNumber2} 
            expiry={bp.drugLicenseExpiry2}
          />
        )}
        <div className="space-y-1 sm:col-span-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase"><MapPin className="h-3 w-3" />Address</div>
          <p className="text-sm text-foreground">{
            bp.address
              ? (typeof bp.address === 'object'
                ? [bp.address.street1, bp.address.city, bp.address.state, bp.address.pincode].filter(Boolean).join(", ")
                : [bp.address, bp.city, bp.state, bp.pincode].filter(Boolean).join(", "))
              : "—"
          }</p>
        </div>
        {bp.verificationStatus && (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-muted-foreground uppercase">Verification</div>
            <Badge variant={bp.verificationStatus === "VERIFIED" ? "success" : bp.verificationStatus === "PENDING" ? "warning" : "error"}>{bp.verificationStatus}</Badge>
          </div>
        )}
      </div>
      {(bp.gstPanResponse || user?.gstPanResponse) && (
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-foreground mb-2">
            <FileText className="h-4 w-4" /> IDFY Verification Response
          </div>
          <pre className="p-4 bg-muted/20 border border-border rounded-xl text-xs font-mono overflow-auto max-h-60">
            {JSON.stringify(bp.gstPanResponse ?? user?.gstPanResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function SellerDetails({ userId }: { userId: string }) {
  const { data: user, isLoading } = useUserById(userId);
  if (isLoading) return <div className="py-4 text-center text-sm text-muted-foreground">Loading seller details…</div>;
  const sp = user?.sellerProfile;
  if (!sp) return <div className="py-4 text-center text-sm text-muted-foreground">No seller profile submitted yet</div>;
  return (
    <div className="py-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase"><Building2 className="h-3 w-3" />Business</div>
          <p className="text-sm font-medium text-foreground">{sp.companyName || sp.businessName || "—"}</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase"><FileText className="h-3 w-3" />GST Number</div>
          <p className="text-sm font-mono text-foreground">{sp.gstNumber || "—"}</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase"><FileText className="h-3 w-3" />PAN Number</div>
          <p className="text-sm font-mono text-foreground">{sp.panNumber || "—"}</p>
        </div>

        {sp.drugLicenseUrl && (
          <SecureDocViewer 
            url={typeof sp.drugLicenseUrl === 'object' ? sp.drugLicenseUrl.url : sp.drugLicenseUrl} 
            label="License 1 (20B)" 
            number={sp.drugLicenseNumber} 
            expiry={sp.drugLicenseExpiry}
          />
        )}
        {sp.drugLicenseUrl2 && (
          <SecureDocViewer 
            url={typeof sp.drugLicenseUrl2 === 'object' ? sp.drugLicenseUrl2.url : sp.drugLicenseUrl2} 
            label="License 2 (21B)" 
            number={sp.drugLicenseNumber2} 
            expiry={sp.drugLicenseExpiry2}
          />
        )}

        <div className="space-y-1 sm:col-span-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase">
            <MapPin className="h-3 w-3" /> Address
          </div>
          <p className="text-sm text-foreground">
            {[sp.address, sp.city, sp.state, sp.pincode].filter(Boolean).join(", ") || "—"}
          </p>
        </div>
        {sp.verificationStatus && (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-muted-foreground uppercase">Verification</div>
            <Badge variant={sp.verificationStatus === "APPROVED" ? "success" : sp.verificationStatus === "PENDING" ? "warning" : "error"}>
              {sp.verificationStatus}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}

import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { subDays } from "date-fns";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  // Search and the role/status chips are filters the API already applies, and it
  // counts the filtered set for us. Applying them here instead only ever narrowed
  // the 20 rows already fetched, while the pager went on reporting every page of
  // every user — so searching a phone that belonged to someone on page 2 showed
  // nothing at all on page 1, and the match had to be hunted page by page.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Any narrowing shrinks the result set, so page 3 of the old set may not exist.
  useEffect(() => { setPage(1); }, [role, status]);

  // "VACATION" is ours, not the API's: it is derived from the sellers endpoint and
  // is not a UserStatus, so sending it would fail the enum check. It stays local.
  const { data: usersData, isLoading } = useAdminUsers({
    page,
    limit,
    search: debouncedSearch || undefined,
    role: role === "all" ? undefined : role,
    status: status === "all" || status === "VACATION" ? undefined : status,
    // A search is for one specific person, so it ignores the date window — which
    // defaults to the last 30 days and would otherwise hide anyone who registered
    // before that, making a perfectly good phone number look like no such user.
    dateFrom: debouncedSearch ? undefined : dateRange?.from?.toISOString(),
    dateTo: debouncedSearch ? undefined : dateRange?.to?.toISOString(),
  });
  const { data: sellersData } = useAdminSellers();
  const updateStatus = useAffirmUserStatus();
  const updateGstStatus = useUpdateGstPanStatus();
  const deleteUserMut = useDeleteUser();

  // Backend returns { data: [...], total: ... } inside data field
  const rawUsers: any[] = Array.isArray(usersData) ? usersData : (usersData?.data ?? []);
  const totalUsers = usersData?.total ?? rawUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalUsers / limit));

  // Merge vacation status from the sellers endpoint into the users list.
  //
  // The endpoint returns SELLER PROFILE rows: the user id lives on the related
  // `user`, and the flag is the schema's `isVacation` — this map was previously
  // keyed by the profile's own id and read a field (`isOnVacation`) that the
  // API has never had, so no user ever matched and the count sat at 0.
  const sellersList: any[] = Array.isArray(sellersData) ? sellersData : (sellersData?.data ?? []);
  const sellerVacationMap = new Map<string, boolean>();
  sellersList.forEach((s: any) => {
    const sellerUserId = s.user?.id ?? s.userId;
    if (sellerUserId) {
      sellerVacationMap.set(sellerUserId, !!s.isVacation);
    }
  });
  const users = rawUsers.map((u: any) => {
    if (u.role === "SELLER" && sellerVacationMap.has(u.id)) {
      return { ...u, isOnVacation: sellerVacationMap.get(u.id) };
    }
    return u;
  });

  // Counted across ALL sellers, not the visible page of users — a seller on
  // vacation who happens to sit on page 3 of User Management still counts.
  const vacationCount = sellersList.filter((s: any) => !!s.isVacation).length;

  // The VACATION tab lists every vacation seller regardless of which page of
  // the (server-paginated) users list they would fall on. Rows are shaped like
  // user rows so the table renders them unchanged; `id` is the USER id, which
  // the view link, delete action and expanded detail all key on.
  const vacationRows = sellersList
    .filter((s: any) => !!s.isVacation)
    .map((s: any) => ({
      id: s.user?.id ?? s.userId,
      phone: s.user?.phone,
      email: s.user?.email ?? s.email,
      role: "SELLER",
      status: s.user?.status,
      createdAt: s.user?.createdAt ?? s.createdAt,
      sellerProfile: s,
      isOnVacation: true,
    }));

  // The server has already applied all of this; kept as a harmless second pass so
  // the rows never contradict the box (it matches on a superset of the API's
  // fields). It reads the debounced term, not the raw one, so the list does not
  // blank out for half a second between the keystroke and the refetch.
  const filtered = (status === "VACATION" ? vacationRows : users).filter((u: any) => {
    const s = debouncedSearch.toLowerCase();
    const matchesId = (u.id ?? "").toLowerCase().includes(s);
    const matchesPhone = (u.phone ?? "").includes(debouncedSearch);
    const matchesEmail = (u.email || u.sellerProfile?.email || u.buyerProfile?.email || "").toLowerCase().includes(s);
    const matchesBiz = (
      (u.sellerProfile?.companyName ?? "").toLowerCase().includes(s) ||
      (u.sellerProfile?.businessName ?? "").toLowerCase().includes(s) ||
      (u.buyerProfile?.legalName ?? "").toLowerCase().includes(s) ||
      (u.businessName ?? "").toLowerCase().includes(s)
    );

    return (role === "all" || u.role === role) &&
      (status === "all" || status === "VACATION" || u.status === status) &&
      (!debouncedSearch || matchesId || matchesPhone || matchesEmail || matchesBiz);
  });

  const handleAction = async (id: string, phone: string, action: "approve" | "reject" | "block" | "unblock") => {
    try {
      await updateStatus.mutateAsync({ userId: id, action });
      toast.success(`User ${phone} — ${action}d successfully`);
    } catch {
      toast.error(`Failed to ${action} user ${phone}`);
    }
  };

  const handleDeleteUser = async (id: string, phone: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user ${phone}? This action cannot be undone.`)) return;
    try {
      await deleteUserMut.mutateAsync(id);
      toast.success(`User ${phone} deleted successfully`);
    } catch {
      toast.error(`Failed to delete user ${phone}`);
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-semibold text-2xl text-foreground">User Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{totalUsers} total users · {users.filter((u: any) => u.status === "PENDING").length} pending{vacationCount > 0 && <> · <span className="text-amber-600">{vacationCount} on vacation</span></>}{debouncedSearch && <> · <span className="text-muted-foreground">searching all dates</span></>}</p>
          </div>
          <DateRangePicker value={dateRange} onChange={setDateRange} align="end" />
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
                  {["Phone", "Unique ID", "Role", "Email", "Status", "Created", "Actions"].map(h => (
                    <th key={h} scope="col" className="px-5 py-3.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">No users found</td></tr>
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
                              {(u.sellerProfile?.companyName || u.sellerProfile?.businessName || u.buyerProfile?.legalName || u.businessName) && (
                                <p className="text-xs text-muted-foreground mt-0.5">{u.sellerProfile?.companyName || u.sellerProfile?.businessName || u.buyerProfile?.legalName || u.businessName}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 max-w-[120px] break-words">
                          <span className="font-mono text-xs text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">{(u.id ?? "—").slice(0, 8)}</span>
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={u.role === "BUYER" ? "success" : u.role === "SELLER" ? "info" : "orange"}>{u.role}</Badge>
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground text-center">{u.email || u.sellerProfile?.email || u.buyerProfile?.email || "—"}</td>
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
                              <button onClick={(e) => { e.stopPropagation(); void handleDeleteUser(u.id, u.phone); }} aria-label="Delete user" title="Delete user"
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                              {isSeller && (
                                <button onClick={(e) => { e.stopPropagation(); setExpandedUser(isExpanded ? null : u.id); }} aria-label="View details" title="View seller details"
                                  className="h-7 w-7 rounded-lg flex items-center justify-center text-primary hover:bg-primary/10 transition-colors">
                                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                </button>
                              )}

                              {(u.status === "PENDING" && (u.role === "ADMIN" || u.buyerProfile?.gstNumber || u.buyerProfile?.panNumber || u.sellerProfile?.gstNumber || u.sellerProfile?.panNumber || u.gstNumber || u.panNumber)) && (
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
                          <td colSpan={7} className="px-5 bg-muted/10">
                            {u.role === "SELLER" ? <SellerDetails userId={u.id} /> : <BuyerDetails userId={u.id} />}
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
