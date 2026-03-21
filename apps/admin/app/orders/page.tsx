"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Input, Badge } from "@/components/ui";
import { formatCurrency } from "@pharmabag/utils";
import { cn } from "@/lib/utils";
import { useAdminOrders, useUpdateAdminOrderStatus } from "@/hooks/useAdmin";
import toast from "react-hot-toast";

const STATUS_FILTERS = [
  { label: "All", v: "all" },
  { label: "Placed", v: "PLACED" },
  { label: "Confirmed", v: "CONFIRMED" },
  { label: "Shipped", v: "SHIPPED" },
  { label: "Delivered", v: "DELIVERED" },
  { label: "Cancelled", v: "CANCELLED" },
] as const;

export default function AdminOrdersPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const { data: ordersData, isLoading } = useAdminOrders();
  const updateStatus = useUpdateAdminOrderStatus();

  // Backend returns { data: [...], total: ... }
  const allOrders: any[] = Array.isArray(ordersData) ? ordersData : (ordersData?.data ?? []);

  const filtered = allOrders.filter((o: any) =>
    (filter === "all" || o.orderStatus === filter) &&
    (!search || (o.id ?? "").toLowerCase().includes(search.toLowerCase()) || (o.buyer?.phone ?? "").includes(search))
  );

  const handleOverride = async (orderId: string, currentStatus: string) => {
    const nextMap: Record<string, string> = {
      PLACED: "CONFIRMED",
      CONFIRMED: "SHIPPED",
      SHIPPED: "DELIVERED",
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
                  {["Order ID", "Buyer", "Items", "Amount", "Payment", "Status", "Action", "Date"].map(h => (
                    <th key={h} scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">No orders found</td></tr>
                ) : filtered.map((o: any, i: number) => (
                  <motion.tr key={o.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="hover:bg-accent/30 transition-colors">
                    <td className="px-5 py-4"><span className="font-mono text-xs font-medium text-foreground">{o.id?.slice(0, 8)}…</span></td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{o.buyer?.phone ?? "—"}</td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">{o.items?.length ?? o._count?.items ?? 0}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-foreground">{formatCurrency(o.totalAmount ?? 0)}</td>
                    <td className="px-5 py-4"><Badge variant={o.paymentStatus === "PAID" ? "success" : o.paymentStatus === "PENDING" ? "warning" : "error"}>{o.paymentStatus ?? "—"}</Badge></td>
                    <td className="px-5 py-4"><Badge variant={o.orderStatus === "DELIVERED" ? "success" : o.orderStatus === "PLACED" ? "warning" : o.orderStatus === "CANCELLED" ? "error" : "info"}>{o.orderStatus ?? "—"}</Badge></td>
                    <td className="px-5 py-4">
                      {["PLACED", "CONFIRMED", "SHIPPED"].includes(o.orderStatus) && (
                        <button onClick={() => void handleOverride(o.id, o.orderStatus)} className="text-xs text-primary underline hover:text-primary/80">
                          → {o.orderStatus === "PLACED" ? "Confirm" : o.orderStatus === "CONFIRMED" ? "Ship" : "Deliver"}
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
      </div>
    </AdminLayout>
  );
}
