"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Package, Truck, CheckCircle, XCircle, Clock, CreditCard, FileText, User, MapPin, Phone } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Badge, Modal, Input, Skeleton } from "@/components/ui";
import { formatCurrency } from "@pharmabag/utils";
import { cn } from "@/lib/utils";
import { useOrderById, useUpdateAdminOrderStatus, useCancelOrder } from "@/hooks/useAdmin";
import toast from "react-hot-toast";

const ORDER_STATUSES = [
  { key: "PLACED", label: "Placed", icon: Clock, color: "bg-yellow-500" },
  { key: "ACCEPTED", label: "Accepted", icon: CheckCircle, color: "bg-blue-500" },
  { key: "SHIPPED", label: "Shipped", icon: Truck, color: "bg-indigo-500" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: Package, color: "bg-purple-500" },
  { key: "DELIVERED", label: "Delivered", icon: CheckCircle, color: "bg-green-500" },
];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: order, isLoading } = useOrderById(id);
  const updateStatus = useUpdateAdminOrderStatus();
  const cancelOrder = useCancelOrder();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const handleStatusUpdate = async (status: string) => {
    try {
      await updateStatus.mutateAsync({ orderId: id, status });
      toast.success(`Order updated to ${status}`);
    } catch {
      toast.error("Failed to update order status");
    }
  };

  const handleCancel = async () => {
    try {
      await cancelOrder.mutateAsync({ orderId: id, reason: cancelReason });
      toast.success("Order cancelled");
      setShowCancelModal(false);
    } catch {
      toast.error("Failed to cancel order");
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-48 lg:col-span-2" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold">Order not found</p>
            <Button variant="ghost" onClick={() => router.push("/orders")} className="mt-4">Back to Orders</Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Normalize legacy status values from backend
  const normalizeStatus = (s: string) => {
    const map: Record<string, string> = { CONFIRMED: "ACCEPTED", PROCESSING: "ACCEPTED", TRANSIT: "SHIPPED" };
    return map[s] ?? s;
  };
  const normalizedStatus = normalizeStatus(order.orderStatus);
  const currentStatusIdx = ORDER_STATUSES.findIndex(s => s.key === normalizedStatus);
  const items: any[] = order.items ?? order.orderItems ?? [];
  const isCancelled = order.orderStatus === "CANCELLED";

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/orders")} className="h-9 w-9 rounded-xl bg-accent/60 flex items-center justify-center hover:bg-accent transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="font-semibold text-2xl text-foreground">Order #{order.id?.slice(0, 8)}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isCancelled && order.orderStatus !== "DELIVERED" && (
              <Button size="sm" variant="danger" onClick={() => setShowCancelModal(true)} leftIcon={<XCircle className="h-4 w-4" />}>Cancel Order</Button>
            )}
          </div>
        </div>

        {/* Status Timeline */}
        {!isCancelled && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6">
            <h2 className="font-semibold text-foreground mb-6">Order Status</h2>
            <div className="flex items-center justify-between relative">
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" />
              <div className="absolute top-4 left-0 h-0.5 bg-primary transition-all" style={{ width: `${(currentStatusIdx / (ORDER_STATUSES.length - 1)) * 100}%` }} />
              {ORDER_STATUSES.map(({ key, label, icon: Icon, color }, idx) => {
                const done = idx <= currentStatusIdx;
                const isCurrent = idx === currentStatusIdx;
                const isNext = idx === currentStatusIdx + 1;
                return (
                  <div key={key} className="relative flex flex-col items-center z-10">
                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all",
                      done ? `${color} border-transparent text-white` : "bg-background border-border text-muted-foreground",
                      isNext && "cursor-pointer hover:border-primary hover:text-primary")}
                      onClick={isNext ? () => handleStatusUpdate(key) : undefined}
                      title={isNext ? `Advance to ${label}` : undefined}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className={cn("text-xs mt-2 font-medium", done ? "text-foreground" : "text-muted-foreground")}>{label}</span>
                    {isCurrent && <span className="text-[10px] text-primary font-semibold mt-0.5">Current</span>}
                    {isNext && <span className="text-[10px] text-primary font-semibold mt-0.5 cursor-pointer" onClick={() => handleStatusUpdate(key)}>Click to advance →</span>}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {isCancelled && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <XCircle className="h-6 w-6 text-red-500" />
              <div>
                <h2 className="font-semibold text-red-600 dark:text-red-400">Order Cancelled</h2>
                {order.cancelReason && <p className="text-sm text-muted-foreground mt-1">Reason: {order.cancelReason}</p>}
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl overflow-hidden lg:col-span-2">
            <div className="p-6 border-b border-border/50">
              <h2 className="font-semibold text-foreground">Items ({items.length})</h2>
            </div>
            <div className="divide-y divide-border/30">
              {items.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">No items</div>
              ) : items.map((item: any, i: number) => {
                const itemImage = item.product?.images?.[0] || item.image;
                return (
                <div key={item.id || i} className="px-6 py-4 flex items-center gap-4">
                  {itemImage ? (
                    <div className="h-12 w-12 rounded-xl overflow-hidden border border-border flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={itemImage} alt={item.product?.name ?? item.productName ?? "Product"} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-lg flex-shrink-0">💊</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{item.product?.name ?? item.productName ?? "Product"}</p>
                    <p className="text-xs text-muted-foreground">{item.product?.manufacturer ?? item.manufacturer ?? "—"} · Qty: {item.quantity ?? 1}</p>
                    {item.discountType && <p className="text-xs text-primary mt-0.5">Discount: {item.discountType} {item.discountValue ? `(${item.discountValue})` : ""}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(item.totalPrice ?? item.price ?? 0)}</p>
                    {item.mrp && item.totalPrice && item.mrp * (item.quantity ?? 1) > item.totalPrice && (
                      <p className="text-xs text-muted-foreground line-through">{formatCurrency(item.mrp * (item.quantity ?? 1))}</p>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
            <div className="p-6 border-t border-border/50 bg-muted/10">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-xl font-bold text-foreground">{formatCurrency(order.totalAmount ?? 0)}</span>
              </div>
            </div>
          </motion.div>

          {/* Sidebar - Buyer + Payment Info */}
          <div className="space-y-6">
            {/* Buyer Info */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-2xl p-6">
              <h2 className="font-semibold text-foreground mb-4">Buyer</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{order.buyer?.name ?? order.buyer?.businessName ?? "—"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-mono text-foreground">{order.buyer?.phone ?? "—"}</span>
                </div>
                {order.shippingAddress && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-sm text-muted-foreground">{typeof order.shippingAddress === "string" ? order.shippingAddress : [order.shippingAddress.address, order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.pincode].filter(Boolean).join(", ")}</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Payment Info */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-6">
              <h2 className="font-semibold text-foreground mb-4">Payment</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={order.paymentStatus === "PAID" ? "success" : order.paymentStatus === "PENDING" ? "warning" : "error"}>{order.paymentStatus ?? "—"}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Method</span>
                  <span className="text-sm font-medium text-foreground capitalize">{order.paymentMethod?.replace(/_/g, " ") ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="text-sm font-semibold text-foreground">{formatCurrency(order.totalAmount ?? 0)}</span>
                </div>
                {order.paymentReference && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Reference</span>
                    <span className="text-xs font-mono text-foreground">{order.paymentReference}</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Seller Info */}
            {order.seller && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card rounded-2xl p-6">
                <h2 className="font-semibold text-foreground mb-4">Seller</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{order.seller?.sellerProfile?.companyName ?? order.seller?.name ?? "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-mono text-foreground">{order.seller?.phone ?? "—"}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      <Modal open={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancel Order">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Are you sure you want to cancel this order? This action cannot be undone.</p>
          <Input label="Reason (optional)" value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="e.g. Customer requested cancellation" />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowCancelModal(false)}>Keep Order</Button>
            <Button variant="danger" onClick={handleCancel} loading={cancelOrder.isPending}>Cancel Order</Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
