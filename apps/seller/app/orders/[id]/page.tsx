"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, Package,
  Upload, FileText, CreditCard, AlertTriangle,
} from "lucide-react";
import { Button, Badge, OrderStatusBadge } from "@/components/ui";
import { formatCurrency, formatDate } from "@pharmabag/utils";
import {
  useSellerOrder, useAcceptSellerOrder, useRejectSellerOrder, useUploadOrderInvoice, useUpdateSellerOrderStatus,
} from "@/hooks/useSeller";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";



export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: order, isLoading } = useSellerOrder(id);
  const acceptOrder = useAcceptSellerOrder();
  const rejectOrder = useRejectSellerOrder();
  const uploadInvoice = useUploadOrderInvoice();
  const updateStatus = useUpdateSellerOrderStatus();
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  if (isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading order details...</div>;
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-muted-foreground mb-4">Order not found</p>
        <button onClick={() => router.push("/orders")} className="text-sm text-primary underline">Back to Orders</button>
      </div>
    );
  }

  const mainOrder = order.order || order.data || order;
  const items: any[] = mainOrder.items ?? mainOrder.products ?? [];

  const handleAccept = () => {
    acceptOrder.mutate(id, {
      onSuccess: () => toast.success("Order accepted"),
      onError: () => toast.error("Failed to accept order"),
    });
  };

  const handleReject = () => {
    if (!rejectReason.trim()) { toast.error("Please provide a reason"); return; }
    rejectOrder.mutate({ orderId: id, reason: rejectReason.trim() }, {
      onSuccess: () => { toast.success("Order rejected"); setShowRejectModal(false); },
      onError: () => toast.error("Failed to reject order"),
    });
  };

  const handleInvoiceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("invoice", file);
    uploadInvoice.mutate({ orderId: id, formData }, {
      onSuccess: () => toast.success("Invoice uploaded — stock will be deducted"),
      onError: () => toast.error("Failed to upload invoice"),
    });
  };

  const handleMarkAsShipped = () => {
    updateStatus.mutate({ orderId: id, status: "SHIPPED" }, {
      onSuccess: () => toast.success("Order marked as shipped"),
      onError: () => toast.error("Failed to update order status"),
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back */}
      <button onClick={() => router.push("/orders")} className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
      </button>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Order #{mainOrder.orderNumber || id?.slice(0, 8).toUpperCase()}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Placed {formatDate(mainOrder.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          {/* Order Action Buttons hidden as requested */}
          {(mainOrder.orderStatus === "ACCEPTED" || mainOrder.status === "ACCEPTED" || mainOrder.status === "confirmed" || mainOrder.status === "AWAITING_INVOICE") && (
            <label>
              <Button size="sm" variant="outline" leftIcon={<Upload className="h-3.5 w-3.5" />} loading={uploadInvoice.isPending} onClick={() => document.getElementById("invoice-upload")?.click()}>
                Upload Invoice
              </Button>
              <input id="invoice-upload" type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleInvoiceUpload} />
            </label>
          )}
        </div>
      </motion.div>



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="lg:col-span-2 glass-card rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-border/50">
            <h2 className="font-semibold text-foreground">Items ({items.length})</h2>
          </div>
          <div className="divide-y divide-border/30">
            {items.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-4 p-5">
                <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  {item.product?.images?.[0]?.url || item.image ? (
                    <img src={item.product?.images?.[0]?.url || item.image} alt={item.product?.name || item.name || item.productName} className="h-14 w-14 rounded-xl object-cover" />
                  ) : (
                    <Package className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.product?.name || item.name || item.productName}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity} × {formatCurrency(item.unitPrice || item.price || 0)}</p>
                  {item.discount && <p className="text-xs text-green-600">Discount: {item.discount}</p>}
                </div>
                <p className="text-sm font-semibold text-foreground">{formatCurrency((item.quantity || 1) * (item.unitPrice || item.price || 0))}</p>
              </div>
            ))}
            {items.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">No items found</div>
            )}
          </div>
          {/* Totals */}
          <div className="p-5 border-t border-border/50 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground">{formatCurrency(mainOrder.totalAmount || mainOrder.subtotal ?? mainOrder.total ?? 0)}</span></div>
            {mainOrder.gstAmount != null && <div className="flex justify-between text-sm"><span className="text-muted-foreground">GST</span><span className="text-foreground">{formatCurrency(mainOrder.gstAmount)}</span></div>}
            {mainOrder.shippingAmount != null && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Shipping</span><span className="text-foreground">{formatCurrency(mainOrder.shippingAmount)}</span></div>}
            <div className="flex justify-between text-base font-semibold pt-2 border-t border-border/30"><span>Total</span><span>{formatCurrency(mainOrder.totalAmount || mainOrder.finalAmount ?? mainOrder.total ?? 0)}</span></div>
          </div>
        </motion.div>

        {/* Sidebar Info */}
        <div className="space-y-4">



          {/* Payment Info */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-5 space-y-3">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" />Payment</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={String(mainOrder.paymentStatus || "PENDING").toUpperCase() === "PAID" || String(mainOrder.paymentStatus).toUpperCase() === "SUCCESS" ? "success" : String(mainOrder.paymentStatus).toUpperCase() === "PENDING" ? "warning" : "error"}>
                  {mainOrder.paymentStatus || "PENDING"}
                </Badge>
              </div>

              {mainOrder.payments?.[0]?.proofUrl && (
                <div className="pt-2 border-t border-border/10 mt-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 leading-none font-sans">Verification Proof</p>
                  <a 
                    href={mainOrder.payments[0].proofUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-primary underline hover:text-primary/80 flex items-center gap-1.5 font-medium"
                  >
                    <FileText className="h-3 w-3" />
                    View Buyer's Proof
                  </a>
                </div>
              )}
              {mainOrder.paymentMethod && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Method</span>
                  <span className="text-foreground">{mainOrder.paymentMethod}</span>
                </div>
              )}
              {mainOrder.paidAmount != null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="text-foreground font-medium">{formatCurrency(mainOrder.paidAmount)}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Invoice */}
          {mainOrder.invoiceUrl && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />Invoice</h3>
              <a href={mainOrder.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline hover:no-underline">View Invoice</a>
            </motion.div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowRejectModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md glass-card rounded-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-red-500" /></div>
              <div><h3 className="font-semibold text-foreground">Reject Order</h3><p className="text-xs text-muted-foreground">This action cannot be undone</p></div>
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowRejectModal(false)}>Cancel</Button>
              <Button variant="danger" size="sm" loading={rejectOrder.isPending} onClick={handleReject}>Reject Order</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
