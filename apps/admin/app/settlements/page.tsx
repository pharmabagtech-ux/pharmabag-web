"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Banknote, Loader2, CheckCircle2 } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Input, Badge } from "@/components/ui";
import { formatCurrency, formatDate } from "@pharmabag/utils";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useSettlements, useMarkSettlementPaid } from "@/hooks/useAdmin";

export default function AdminSettlementsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "PROCESSED" | "PAID">("ALL");
  
  const { data: settlementsData, isLoading } = useSettlements();
  const markPaid = useMarkSettlementPaid();

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [reference, setReference] = useState("");

  const settlements = Array.isArray(settlementsData) ? settlementsData : (settlementsData?.settlements ?? []);

  const filtered = settlements.filter((s: any) =>
    (filter === "ALL" || s.payoutStatus === filter) &&
    (!search || 
      (s.id || "").toLowerCase().includes(search.toLowerCase()) || 
      (s.seller?.companyName || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.payoutReference || "").toLowerCase().includes(search.toLowerCase())
    )
  );

  const openModal = (id: string) => {
    setSelectedId(id);
    setReference("");
    setModalOpen(true);
  };

  const handleMarkPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) return toast.error("Payout reference is required");
    
    try {
      await markPaid.mutateAsync({ settlementId: selectedId, payoutReference: reference });
      toast.success("Settlement marked as paid");
      setModalOpen(false);
    } catch {
      toast.error("Failed to update settlement");
    }
  };

  if (isLoading) {
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-semibold text-2xl text-foreground flex items-center gap-2">
              <Banknote className="h-6 w-6 text-primary" />
              Seller Settlements
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage and disburse payouts to sellers
            </p>
          </div>
          <div className="flex gap-6 text-right">
            <div>
              <p className="font-medium text-xl text-yellow-600 dark:text-yellow-500">{formatCurrency(pendingAmount)}</p>
              <p className="text-xs text-muted-foreground">Pending Payouts</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input placeholder="Search by ID, seller, or reference…" value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-sb pb-1 sm:pb-0" role="group" aria-label="Filter by status">
            {(["ALL", "PENDING", "PROCESSED", "PAID"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn("px-3 py-2 rounded-xl text-xs font-medium border transition-all whitespace-nowrap", filter === f ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:bg-accent/60")}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="Settlements">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Date</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Seller</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Order Item</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Amount</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">No settlements found</td></tr>
                ) : filtered.map((s: any, i: number) => (
                  <motion.tr key={s.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="hover:bg-accent/30 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">{formatDate(s.createdAt, "MMM d, yyyy")}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(s.createdAt, "h:mm a")}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium text-foreground truncate w-40" title={s.seller?.companyName}>{s.seller?.companyName ?? "Unknown Seller"}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">{s.sellerId?.substring(0, 8)}...</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-mono text-muted-foreground truncate w-24" title={s.orderItemId}>{s.orderItemId?.substring(0, 8)}...</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-semibold text-foreground">{formatCurrency(s.amount ?? 0)}</div>
                      {s.commission > 0 && <div className="text-xs text-red-500 mt-0.5">-{formatCurrency(s.commission)} (Fee)</div>}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={s.payoutStatus === "PAID" ? "success" : s.payoutStatus === "PENDING" ? "warning" : "info"}>
                        {s.payoutStatus}
                      </Badge>
                      {s.payoutReference && (
                        <div className="text-xs text-muted-foreground font-mono mt-1" title="Reference ID">Ref: {s.payoutReference}</div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {s.payoutStatus !== "PAID" ? (
                        <Button size="sm" variant="outline" onClick={() => openModal(s.id)} leftIcon={<CheckCircle2 className="h-4 w-4 text-green-500" />}>
                          Mark Paid
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground font-medium">Completed</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-card/60 glass-card rounded-2xl shadow-xl overflow-hidden border border-border">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-1">Confirm Payout</h2>
                <p className="text-sm text-muted-foreground mb-6">Enter the bank transaction or UPI reference number to mark this settlement as paid.</p>
                <form onSubmit={handleMarkPaid} className="space-y-4">
                  <Input label="Payout Reference ID" value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g. UTR123456789" required autoFocus />
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
