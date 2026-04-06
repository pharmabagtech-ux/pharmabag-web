"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Loader2 } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Input, Badge, Pagination, Modal } from "@/components/ui";
import { formatCurrency } from "@pharmabag/utils";
import { cn } from "@/lib/utils";
import { useAdminOrders, useUpdateAdminOrderStatus } from "@/hooks/useAdmin";
import { getPresignedUrl } from "@pharmabag/api-client";
import toast from "react-hot-toast";

const STATUS_FILTERS = [
  { label: "All", v: "all" },
  { label: "Placed", v: "PLACED" },
  { label: "Accepted", v: "ACCEPTED" },
  { label: "Paid", v: "PAYMENT_RECEIVED" },
  { label: "Dispatched", v: "DISPATCHED_FROM_SELLER" },
  { label: "At Warehouse", v: "RECEIVED_AT_WAREHOUSE" },
  { label: "Shipped", v: "SHIPPED" },
  { label: "Delivered", v: "DELIVERED" },
  { label: "Cancelled", v: "CANCELLED" },
] as const;

export default function AdminOrdersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const PAGE_LIMIT = 20;

  const { data: ordersData, isLoading } = useAdminOrders(page, PAGE_LIMIT);
  const updateStatus = useUpdateAdminOrderStatus();

  // Backend returns { data: [...], total: ... }
  const allOrders: any[] = Array.isArray(ordersData) ? ordersData : (ordersData?.data ?? []);
  const totalOrders = ordersData?.total ?? allOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalOrders / PAGE_LIMIT));

  const filtered = allOrders.filter((o: any) => {
    const s = search.toLowerCase();
    const sellerId = o.items?.[0]?.product?.seller?.id || o.items?.[0]?.seller?.id || o.sellerId || "";
    const buyerId = o.buyer?.id || o.buyerId || "";
    return (filter === "all" || o.orderStatus === filter) &&
      (!search || 
        (o.id ?? "").toLowerCase().includes(s) || 
        (o.orderId ?? "").toLowerCase().includes(s) ||
        (o.buyer?.phone ?? "").includes(search) ||
        sellerId.toLowerCase().includes(s) ||
        buyerId.toLowerCase().includes(s)
      );
  });

  const handleOverride = async (e: React.MouseEvent, orderId: string, currentStatus: string) => {
    e.stopPropagation();
    const nextMap: Record<string, string> = {
      PLACED: "ACCEPTED",
      ACCEPTED: "PAYMENT_RECEIVED",
      PAYMENT_RECEIVED: "DISPATCHED_FROM_SELLER",
      DISPATCHED_FROM_SELLER: "RECEIVED_AT_WAREHOUSE",
      RECEIVED_AT_WAREHOUSE: "SHIPPED",
      SHIPPED: "OUT_FOR_DELIVERY",
      OUT_FOR_DELIVERY: "DELIVERED",
    };
    const next = nextMap[currentStatus];
    if (!next) { toast.error("No next status available"); return; }
    try {
      await updateStatus.mutateAsync({ orderId, status: next });
      toast.success(`Order updated to ${next}`);
    } catch {
      toast.error("Failed to update order status");
    }
  };

  const [proofModal, setProofModal] = useState<{ open: boolean; key?: string; url?: string }>({ open: false });

  const handleOpenProof = async (e: React.MouseEvent, key?: string) => {
    e.stopPropagation();
    if (!key) return;
    
    setProofModal({ open: true, key });
    
    // If it's already a full URL, use it directly
    if (key.startsWith('http')) {
      setProofModal({ open: true, key, url: key });
      return;
    }

    try {
      const url = await getPresignedUrl(key);
      setProofModal({ open: true, key, url });
    } catch {
      toast.error("Failed to generate viewing link");
      setProofModal({ open: false });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading orders…</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-semibold text-2xl text-foreground">Order Monitoring</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{allOrders.length} total orders · {allOrders.filter((o: any) => o.orderStatus === "PLACED").length} pending</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input placeholder="Search by order ID or buyer phone…" value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
          </div>
          <div className="flex gap-1.5 flex-wrap" role="group">
            {STATUS_FILTERS.map(({ label, v }) => (
              <button key={v} onClick={() => setFilter(v)}
                className={cn("px-3 py-2 rounded-xl text-xs font-medium border transition-all", filter === v ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:bg-accent/60")}>{label}</button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="Orders">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  {["Order ID", "Buyer", "Seller ID", "Buyer ID", "Items", "Amount", "Payment", "Status", "Action", "Date"].map(h => (
                    <th key={h} scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.length === 0 ? (
                  <tr><td colSpan={10} className="py-12 text-center text-sm text-muted-foreground">No orders found</td></tr>
                ) : filtered.map((o: any, i: number) => (
                  <motion.tr 
                    key={o.id} 
                    initial={{ opacity: 0, y: 6 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: i * 0.03 }} 
                    className="hover:bg-accent/30 transition-colors cursor-pointer group"
                    onClick={() => router.push(`/orders/${o.id}`)}
                  >
                    <td className="px-5 py-4 max-w-[120px] break-words"><span className="font-mono text-xs font-medium text-foreground group-hover:text-primary transition-colors">{(o.orderId || o.id || o._id || "").slice(0, 8)}…</span></td>
                    <td className="px-5 py-4 max-w-[150px] break-words text-sm text-muted-foreground">{o.buyer?.phone || o.address?.phone || "—"}</td>
                    <td className="px-5 py-4 whitespace-nowrap"><span className="font-mono text-xs text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">{(o.items?.[0]?.product?.seller?.id || o.items?.[0]?.seller?.id || o.sellerId || "—").slice(0, 8)}</span></td>
                    <td className="px-5 py-4 whitespace-nowrap"><span className="font-mono text-xs text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">{(o.buyer?.id || o.buyerId || "—").slice(0, 8)}</span></td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">{o.items?.length ?? o._count?.items ?? 0}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-foreground">{formatCurrency(o.totalAmount ?? 0)}</td>
                    <td className="px-5 py-4">
                      <div 
                        onClick={(e) => handleOpenProof(e, o.payments?.[0]?.proofUrl)}
                        className={cn(o.payments?.[0]?.proofUrl ? "cursor-pointer hover:opacity-80 transition-opacity" : "cursor-default")}
                      >
                        <Badge variant={o.paymentStatus === "SUCCESS" || o.paymentStatus === "PAID" ? "success" : o.paymentStatus === "PENDING" ? "warning" : "error"}>
                          {o.paymentStatus === "SUCCESS" ? "PAID" : (o.paymentStatus ?? "—")}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-5 py-4"><Badge variant={o.orderStatus === "DELIVERED" ? "success" : o.orderStatus === "PLACED" ? "warning" : o.orderStatus === "CANCELLED" ? "error" : "info"}>{o.orderStatus ?? "—"}</Badge></td>
                    <td className="px-5 py-4">
                      {["PLACED", "ACCEPTED", "PAYMENT_RECEIVED", "DISPATCHED_FROM_SELLER", "RECEIVED_AT_WAREHOUSE", "SHIPPED", "OUT_FOR_DELIVERY"].includes(o.orderStatus) && (
                        <button onClick={(e) => void handleOverride(e, o.id, o.orderStatus)} className="text-xs text-primary underline hover:text-primary/80">
                          → {o.orderStatus === "PLACED" ? "Accept" : o.orderStatus === "ACCEPTED" ? "Mark Paid" : o.orderStatus === "PAYMENT_RECEIVED" ? "Dispatch" : o.orderStatus === "DISPATCHED_FROM_SELLER" ? "Recv at Wh" : o.orderStatus === "RECEIVED_AT_WAREHOUSE" ? "Ship" : o.orderStatus === "SHIPPED" ? "Out for Delivery" : "Deliver"}
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">{o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
      </div>

      <Modal open={proofModal.open} onClose={() => setProofModal({ open: false })} title="Payment Proof Verification">
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
          {proofModal.url ? (
            <div className="w-full space-y-4">
              <div className="aspect-auto max-h-[60vh] overflow-auto rounded-xl border border-border/50 bg-muted/10 p-2">
                <img src={proofModal.url} alt="Payment Proof" className="max-w-full h-auto rounded-lg mx-auto" />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" size="sm" onClick={() => window.open(proofModal.url, '_blank')}>Open in New Tab</Button>
                <Button variant="primary" size="sm" onClick={() => setProofModal({ open: false })}>Close</Button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Fetching secure image link...</p>
            </div>
          )}
        </div>
      </Modal>
    </AdminLayout>
  );
}
