"use client";
import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Banknote, Loader2, CheckCircle2, CreditCard, Clock, TrendingUp, RefreshCw, Image as ImageIcon, ExternalLink, Upload, X } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Input, Badge, Pagination, StatCard } from "@/components/ui";
import { formatCurrency, formatDate } from "@pharmabag/utils";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useSettlements, useMarkSettlementPaid, useSyncSettlements, useAdminOrdersFiltered, useUploadSettlementProof } from "@/hooks/useAdmin";

import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { subDays } from "date-fns";
import { getSettlements } from "@/api/admin.api";


export default function AdminSettlementsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "PROCESSED" | "PAID">("ALL");
  const [page, setPage] = useState(1);
  const limit = 20;

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const { data: settlementsData, isLoading: isLoadingSettlements } = useSettlements({
    page,
    limit,
    dateFrom: dateRange?.from?.toISOString(),
    dateTo: dateRange?.to?.toISOString(),
  });
  const { data: deliveredData, isLoading: loadingOrders } = useAdminOrdersFiltered({ status: "DELIVERED", limit: 50 });
  const markPaid = useMarkSettlementPaid();
  const syncSettlements = useSyncSettlements();

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const uploadProof = useUploadSettlementProof();
  const fileInputRef = useState<HTMLInputElement | null>(null); // Actually I'll use useRef below

  const settlements = Array.isArray(settlementsData) ? settlementsData : (settlementsData?.data ?? []);
  const deliveredOrders = Array.isArray(deliveredData) ? deliveredData : (deliveredData?.data ?? []);

  // Merge Settlements and Unsettled Orders for display
  const displayItems = useMemo(() => {
    // Start with already ledgered settlements
    const items = settlements.map((s: any) => ({ ...s, viewType: "LEDGERED" }));

    // Find delivered orders that don't have settlements for their items yet
    deliveredOrders.forEach((order: any) => {
      const orderItems = order.items || order.orderItems || [];
      orderItems.forEach((item: any) => {
          // Check if this item is already in the settlements ledger
          const alreadyInLedger = settlements.some((s: any) => s.orderItemId === item.id);
          if (!alreadyInLedger) {
            items.push({
              id: `pending::${item.id}::${order.id}::${item.sellerId || item.seller?.id || order.sellerId}`,
              createdAt: order.createdAt,
              orderItem: { ...item, orderId: order.id },
              seller: item.seller || order.seller,
              amount: item.totalPrice,
              commission: 0,
              payoutStatus: "PENDING_ENTRY",
              viewType: "READY"
            });
          }
        });
      });

      return items.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [settlements, deliveredOrders]);

  const totalSettlements = settlementsData?.total ?? displayItems.length;
  const totalPages = Math.max(1, Math.ceil(totalSettlements / limit));

  const filtered = displayItems.filter((s: any) =>
    (filter === "ALL" || (filter === "PENDING" && s.payoutStatus !== "PAID") || s.payoutStatus === filter) &&
    (!search || 
      (s.orderItem?.orderId || "").toLowerCase().includes(search.toLowerCase()) || 
      (s.seller?.companyName || s.seller?.businessName || "").toLowerCase().includes(search.toLowerCase())
    )
  );

  const openModal = (id: string) => {
    setSelectedId(id);
    setProofUrl("");
    setModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadProof.mutateAsync(file);
      setProofUrl(url);
      toast.success("Proof uploaded successfully");
    } catch {
      toast.error("Failed to upload proof to S3");
    }
  };

  const handleMarkPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofUrl) return toast.error("Please upload payout proof");
    
    const loadingId = toast.loading(selectedId.startsWith("pending::") ? "Finalizing entry & payment..." : "Processing payment...");
    
    try {
      let settlementId = selectedId;

      // Handle automatic sync and payment for items NOT in ledger yet
      if (selectedId.startsWith("pending::")) {
        // ID format: pending::orderItemId::orderId::sellerId
        const parts = selectedId.split("::");
        const orderItemId = parts[1];
        const orderId = parts[2];
        const sellerId = parts[3];
        
        // 1. Trigger sync to create the record - handles wrapped or direct array responses
        const response = await syncSettlements.mutateAsync();
        const syncedItems = Array.isArray(response) ? response : (response?.data || response || []);
        
        if (!Array.isArray(syncedItems)) {
           console.error("[Settlement] Sync response is not an array:", syncedItems);
           throw new Error("Invalid response form server. Please refresh and try again.");
        }

        // Match by orderItemId (scalar) OR by orderItem.id (relation)
        let newRecord = syncedItems.find((s: any) => 
          String(s.orderItemId) === String(orderItemId) || 
          String(s.orderItem?.id) === String(orderItemId)
        );

        // Fallback: If not in sync response, fetch directly by orderItemId (handles cases where it was already ledgered)
        if (!newRecord) {
          try {
            const fallbackResponse = await getSettlements({ orderItemId });
            const foundItems = Array.isArray(fallbackResponse) ? fallbackResponse : (fallbackResponse?.data || []);
            newRecord = foundItems.find((s: any) => String(s.orderItemId) === String(orderItemId));
          } catch (e) {
            console.warn("[Settlement] Fallback lookup failed:", e);
          }
        }

        if (!newRecord) {
           throw new Error("Target ledger entry was created but is still propagating. Please wait a moment and click 'Paid' again.");
        }
        settlementId = newRecord.id;
      }

      // 3. Mark the record as PAID
      await markPaid.mutateAsync({ 
        settlementId, 
        payoutReference: "S3_UPLOAD_" + Date.now(),
        paymentProofUrl: proofUrl 
      });
      
      toast.success("Settlement completed successfully!", { id: loadingId });
      setModalOpen(false);
    } catch (err: any) {
      console.error("[Settlement] Finalize error:", err);
      // Prefer the server's explanation. err.message on an axios error is only
      // "Request failed with status code 400", which told the admin nothing —
      // the real reason ("Settlement is already paid") is in the response body.
      // The plain err.message is kept last so locally thrown errors still show.
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to complete settlement transaction",
        { id: loadingId },
      );
    }
  };

  const handleEnterSettlement = async (orderItemId: string) => {
    try {
      await syncSettlements.mutateAsync();
      toast.success("Order entered into ledger");
    } catch {
      toast.error("Failed to enter settlement");
    }
  };

  if (isLoadingSettlements || loadingOrders) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center space-y-2">
            <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading settlements…</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const pendingAmount = settlements.filter((s: any) => s.payoutStatus === "PENDING").reduce((sum: number, s: any) => sum + (s.amount ?? 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-semibold text-2xl text-foreground flex items-center gap-2">
              <Banknote className="h-6 w-6 text-primary" />
              Seller Settlements
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage and disburse payouts to sellers
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DateRangePicker value={dateRange} onChange={setDateRange} align="end" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Transactions" value={String(totalSettlements)} icon={CreditCard} iconClass="bg-blue-50 text-blue-600 dark:bg-blue-900/20" delay={0} />
          <StatCard title="Gross Settlement Volume" value={formatCurrency(settlements.reduce((sum: number, s: any) => sum + (s.amount ?? 0), 0))} icon={TrendingUp} iconClass="bg-purple-50 text-purple-600 dark:bg-purple-900/20" delay={0.05} />
          <StatCard title="Pending Payouts" value={formatCurrency(pendingAmount)} icon={Clock} iconClass="bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20" delay={0.1} />
          <StatCard title="Total Settled" value={formatCurrency(settlements.filter((s: any) => s.payoutStatus === "PAID").reduce((sum: number, s: any) => sum + (s.amount ?? 0), 0))} icon={CheckCircle2} iconClass="bg-green-50 text-green-600 dark:bg-green-900/20" delay={0.15} />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border/40">
          <div className="flex-1">
            <Input placeholder="Search by ID, seller, or reference…" value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-sb pb-1 sm:pb-0">
            {(["ALL", "PENDING", "PAID"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn("px-3 py-2 rounded-xl text-xs font-medium border transition-all whitespace-nowrap", filter === f ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:bg-accent/60")}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border/50 bg-muted/5 flex items-center justify-between">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Settlement Ledger
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="Settlements">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Date</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Seller Detail</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Order Details</th>
                  <th scope="col" className="px-5 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Amount</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th scope="col" className="px-5 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">No orders or settlements found</td></tr>
                ) : filtered.map((s: any, i: number) => (
                  <motion.tr key={s.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="hover:bg-accent/30 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">{formatDate(s.createdAt)}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(s.createdAt, { hour: "numeric", minute: "2-digit", hour12: true })}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground truncate w-48" title={s.seller?.companyName}>{s.seller?.companyName || "Unknown Seller"}</span>
                        <span className="text-[10px] font-mono text-muted-foreground mt-0.5">ID: {(s.seller?.userId || s.sellerId || s.seller?.id)?.substring(0,8)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-mono text-foreground font-semibold">#{s.orderItem?.orderId?.substring(0, 8).toUpperCase() || s.id.substring(0, 8)}</span>
                        <div className="text-[11px] text-primary/80 font-medium mt-1 truncate w-48" title={s.orderItem?.product?.name}>
                          📦 {s.orderItem?.product?.name ?? "Product Details Unavailable"}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="text-sm font-bold text-primary">{formatCurrency(s.amount)}</div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={s.payoutStatus === "PAID" ? "success" : (s.payoutStatus === "PENDING" || s.payoutStatus === "PENDING_ENTRY") ? "warning" : "info"}>
                        {s.payoutStatus === "PENDING_ENTRY" ? "PENDING" : s.payoutStatus}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {s.payoutStatus !== "PAID" ? (
                        <Button 
                          size="sm" 
                          variant="primary" 
                          onClick={() => openModal(s.id)} 
                          className="h-9 px-4 rounded-xl shadow-sm"
                          leftIcon={<CheckCircle2 className="h-4 w-4" />}>
                          Paid
                        </Button>
                      ) : (
                        <div className="flex flex-col items-end gap-1">
                          <a 
                            href={s.paymentProofUrl || s.proofUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1.5 text-green-600 hover:text-green-700 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg border border-green-200/50 dark:border-green-800/30 text-xs font-bold transition-all hover:shadow-sm"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            View Receipt
                          </a>
                          <span className="text-[10px] text-muted-foreground font-medium pr-1">
                            {formatDate(s.payoutDate || s.updatedAt)}
                          </span>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-card/60 glass-card rounded-2xl shadow-xl overflow-hidden border border-border">
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold">Confirm Payout</h2>
                  <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)} className="h-8 w-8 p-0 rounded-full">&times;</Button>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Upload payment proof to confirm the payout.</p>
                
                <form onSubmit={handleMarkPaid} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-foreground">Payout Proof (S3 Upload)</label>
                    <div className={cn(
                      "border-2 border-dashed rounded-xl p-4 transition-all flex flex-col items-center justify-center gap-2",
                      proofUrl ? "border-green-500/50 bg-green-50/10" : "border-border hover:border-primary/50 hover:bg-accent/50"
                    )}>
                      {proofUrl ? (
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2 truncate">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-xs text-muted-foreground truncate">Proof Uploaded</span>
                          </div>
                          <Button type="button" variant="ghost" size="xs" onClick={() => setProofUrl("")} className="h-6 w-6 p-0 rounded-full">
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => document.getElementById('proof-upload')?.click()}>
                          <Upload className="h-5 w-5 text-muted-foreground" />
                          <span className="text-xs font-medium">Click to upload transaction receipt</span>
                          <span className="text-[10px] text-muted-foreground">JPG, PNG or PDF (Max 5MB)</span>
                        </div>
                      )}
                      <input 
                        id="proof-upload"
                        type="file" 
                        accept="image/*,application/pdf"
                        className="hidden" 
                        onChange={handleFileUpload}
                        disabled={uploadProof.isPending}
                      />
                      {uploadProof.isPending && (
                        <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-xl z-10">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                    <Button type="submit" loading={markPaid.isPending} leftIcon={<CheckCircle2 className="h-4 w-4" />}>Confirm Paid</Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
