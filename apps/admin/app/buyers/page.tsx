"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Eye, ChevronDown, ChevronUp, FileText, MapPin, CheckCircle2, Clock, XCircle } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Input, Badge, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import Link from "next/link";
import { useUpdateGstPanStatus } from "@/hooks/useAdmin";
import { getBuyersList } from "@/api/admin.api";
import { useQuery } from "@tanstack/react-query";

type VerificationFilter = "all" | "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
type TierFilter = "all" | "PREPAID" | "EMI" | "FULLCREDIT" | "none";

interface BuyerProfile {
  id: string;
  userId: string;
  phone: string;
  name: string;
  email?: string;
  legalName: string;
  gstNumber?: string;
  panNumber?: string;
  city: string;
  state: string;
  pincode: string;
  address?: any;
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  creditTier: "PREPAID" | "EMI" | "FULLCREDIT" | null;
  gstPanResponse?: any;
  licence?: any[];
  bankAccount?: any;
  cancelCheck?: string;
  document?: string;
  createdAt: string;
  user?: {
    id: string;
    phone: string;
    email?: string;
    status: string;
  };
}

export default function BuyersPage() {
  const [search, setSearch] = useState("");
  const [verification, setVerification] = useState<VerificationFilter>("all");
  const [tier, setTier] = useState<TierFilter>("all");
  const [expandedBuyer, setExpandedBuyer] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: buyersData, isLoading } = useQuery({
    queryKey: ["admin", "buyers", page, limit],
    queryFn: () => getBuyersList(page, limit),
  });

  const buyers: BuyerProfile[] = buyersData?.data ?? [];
  const totalBuyers = buyersData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalBuyers / limit));

  const updateGstStatus = useUpdateGstPanStatus();

  const filtered = buyers.filter((b: BuyerProfile) =>
    (verification === "all" || b.verificationStatus === verification) &&
    (tier === "all" || (tier === "none" ? !b.creditTier : b.creditTier === tier)) &&
    (!search ||
      (b.phone ?? "").includes(search) ||
      (b.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (b.email ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
      case "PENDING":
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400";
      case "REJECTED":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return <CheckCircle2 className="h-3.5 w-3.5" />;
      case "PENDING":
        return <Clock className="h-3.5 w-3.5" />;
      case "REJECTED":
        return <XCircle className="h-3.5 w-3.5" />;
      default:
        return null;
    }
  };

  const handleTierUpdate = async (buyerId: string, verified: boolean, tier?: string) => {
    try {
      const payload = {
        verified,
        creditTier: verified ? (tier as "PREPAID" | "EMI" | "FULLCREDIT") : undefined,
      };

      await updateGstStatus.mutateAsync({
        userId: buyerId,
        role: "BUYER",
        data: payload,
      });

      toast.success(verified ? `Tier updated to ${tier}` : "Buyer rejected");
    } catch (error) {
      toast.error("Failed to update buyer tier");
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading buyers…</p>
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
            <h1 className="font-semibold text-2xl text-foreground">Buyer Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalBuyers} total buyers · {buyers.filter((b: BuyerProfile) => b.verificationStatus === "PENDING").length} pending verification
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by phone, name, or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="flex gap-1.5 flex-wrap" role="group" aria-label="Filter by verification">
            {(["all", "UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"] as VerificationFilter[]).map((v) => (
              <button
                key={v}
                onClick={() => setVerification(v)}
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-medium border transition-all",
                  verification === v
                    ? "bg-primary text-white border-primary"
                    : "border-border text-muted-foreground hover:bg-accent/60"
                )}
              >
                {v === "all" ? "All" : v}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap" role="group" aria-label="Filter by tier">
            {(["all", "PREPAID", "EMI", "FULLCREDIT", "none"] as TierFilter[]).map((t) => (
              <button
                key={t}
                onClick={() => setTier(t)}
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-medium border transition-all",
                  tier === t
                    ? "bg-primary text-white border-primary"
                    : "border-border text-muted-foreground hover:bg-accent/60"
                )}
              >
                {t === "all" ? "All" : t === "none" ? "No Tier" : t}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="Buyers">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  {["Buyer", "Contact", "Location", "Verification", "Tier", "Actions"].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                      No buyers found
                    </td>
                  </tr>
                ) : (
                  filtered.map((buyer: BuyerProfile, i: number) => {
                    const isExpanded = expandedBuyer === buyer.id;
                    return (
                      <React.Fragment key={buyer.id}>
                        <motion.tr
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="hover:bg-accent/30 transition-colors cursor-pointer"
                          onClick={() => setExpandedBuyer(isExpanded ? null : buyer.id)}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-sm flex-shrink-0">
                                {(buyer.name ?? "?").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{buyer.name}</p>
                                <p className="text-xs text-muted-foreground">{buyer.legalName}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="text-sm">
                              <p className="font-mono text-foreground">{buyer.phone}</p>
                              {buyer.email && <p className="text-xs text-muted-foreground">{buyer.email}</p>}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm">
                            <div className="flex items-center gap-1 text-foreground">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>
                                {buyer.city}, {buyer.state.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <Badge className={`flex items-center gap-1.5 w-fit ${getStatusColor(buyer.verificationStatus)}`}>
                              {getStatusIcon(buyer.verificationStatus)}
                              {buyer.verificationStatus}
                            </Badge>
                          </td>
                          <td className="px-5 py-4">
                            {buyer.creditTier ? (
                              <Badge className="capitalize">
                                {buyer.creditTier.toLowerCase()}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1">
                              <Link
                                href={`/users/${buyer.userId}`}
                                onClick={(e) => e.stopPropagation()}
                                aria-label="View user"
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Link>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedBuyer(isExpanded ? null : buyer.id);
                                }}
                                aria-label="View details"
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
                              >
                                {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={6} className="px-5 bg-muted/10">
                              <div className="py-6 space-y-6">
                                {/* Buyer Details Grid */}
                                <div>
                                  <h3 className="font-semibold text-sm text-foreground mb-4">Profile Details</h3>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                      <p className="text-xs font-semibold text-muted-foreground uppercase">Name</p>
                                      <p className="text-sm font-medium text-foreground">{buyer.name}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-xs font-semibold text-muted-foreground uppercase">Legal Name</p>
                                      <p className="text-sm font-medium text-foreground">{buyer.legalName}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-xs font-semibold text-muted-foreground uppercase">Phone</p>
                                      <p className="text-sm font-mono text-foreground">{buyer.phone}</p>
                                    </div>
                                    {buyer.gstNumber && (
                                      <div className="space-y-1">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase">GST Number</p>
                                        <p className="text-sm font-mono text-foreground">{buyer.gstNumber}</p>
                                      </div>
                                    )}
                                    {buyer.panNumber && (
                                      <div className="space-y-1">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase">PAN Number</p>
                                        <p className="text-sm font-mono text-foreground">{buyer.panNumber}</p>
                                      </div>
                                    )}
                                    <div className="space-y-1">
                                      <p className="text-xs font-semibold text-muted-foreground uppercase">Location</p>
                                      <p className="text-sm text-foreground">{buyer.city}, {buyer.state}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* IDFY Verification Response */}
                                {buyer.gstPanResponse && (
                                  <div>
                                    <div className="flex items-center gap-2 mb-3">
                                      <FileText className="h-4 w-4 text-primary" />
                                      <h3 className="font-semibold text-sm text-foreground">IDFY Verification Response</h3>
                                    </div>
                                    <pre className="p-4 bg-muted/20 border border-border rounded-lg text-xs font-mono overflow-auto max-h-64">
                                      {JSON.stringify(buyer.gstPanResponse, null, 2)}
                                    </pre>
                                  </div>
                                )}

                                {/* Tier Selection Buttons */}
                                <div>
                                  <h3 className="font-semibold text-sm text-foreground mb-3">Assign Credit Tier</h3>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTierUpdate(buyer.id, true, "PREPAID");
                                      }}
                                      disabled={updateGstStatus.isPending}
                                      className="px-4 py-2 text-sm font-semibold bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                                    >
                                      Prepaid
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTierUpdate(buyer.id, true, "EMI");
                                      }}
                                      disabled={updateGstStatus.isPending}
                                      className="px-4 py-2 text-sm font-semibold bg-purple-50 text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
                                    >
                                      EMI
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTierUpdate(buyer.id, true, "FULLCREDIT");
                                      }}
                                      disabled={updateGstStatus.isPending}
                                      className="px-4 py-2 text-sm font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
                                    >
                                      Full Credit
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTierUpdate(buyer.id, false);
                                      }}
                                      disabled={updateGstStatus.isPending}
                                      className="px-4 py-2 text-sm font-semibold bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-border/50 px-5 py-4 flex items-center justify-between bg-muted/20">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
