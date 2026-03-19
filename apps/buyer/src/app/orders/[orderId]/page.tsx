'use client';

import { motion } from 'framer-motion';
import { Package, Truck, ChevronLeft, Calendar, FileText, Loader2, AlertCircle, XCircle } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import Timeline from '@/components/shared/Timeline';
import { useToast } from '@/components/shared/Toast';
import Link from 'next/link';
import { useOrderById, useCancelOrder } from '@/hooks/useOrders';

const STATUS_ORDER = ['PLACED', 'ACCEPTED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

function buildTimelineSteps(status: string) {
  const labels = ['Order Placed', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered'];
  const currentIdx = STATUS_ORDER.indexOf(status.toUpperCase());
  return labels.map((label, idx) => ({
    label,
    description: idx <= currentIdx ? '' : 'Pending',
    isCompleted: idx < currentIdx,
    isActive: idx === currentIdx,
  }));
}

function getStatusBadge(status: string) {
  const s = status.toUpperCase();
  if (s === 'DELIVERED') return { label: 'Delivered', cls: 'bg-green-100 text-green-700' };
  if (s === 'SHIPPED') return { label: 'In Transit', cls: 'bg-blue-100 text-blue-700' };
  if (s === 'CANCELLED') return { label: 'Cancelled', cls: 'bg-red-100 text-red-700' };
  if (s === 'ACCEPTED') return { label: 'Confirmed', cls: 'bg-lime-100 text-lime-700' };
  return { label: s, cls: 'bg-yellow-100 text-yellow-700' };
}

export default function OrderIdPage({ params }: { params: { orderId: string } }) {
  const { data: order, isLoading, isError } = useOrderById(params.orderId);
  const cancelMutation = useCancelOrder();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50/50">
        <Navbar />
        <div className="pt-32 pb-20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
        </div>
        <Footer />
      </main>
    );
  }

  if (isError || !order) {
    return (
      <main className="min-h-screen bg-gray-50/50">
        <Navbar />
        <div className="pt-32 pb-20 flex flex-col items-center justify-center gap-4">
          <AlertCircle className="w-12 h-12 text-red-300" />
          <p className="text-lg font-bold text-gray-400">Order not found</p>
          <Link href="/orders" className="text-sm font-bold text-gray-500 hover:text-gray-900 underline">
            Back to Orders
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const badge = getStatusBadge(order.status);
  const steps = order.status.toUpperCase() !== 'CANCELLED' ? buildTimelineSteps(order.status) : [];
  const orderItems = order.items ?? [];
  const totalAmount = order.total ?? order.amount ?? 0;
  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
  const shippingAddress = [order.address, order.city, order.state, order.pincode].filter(Boolean).join(', ');
  const isCancellable = !['DELIVERED', 'CANCELLED', 'SHIPPED'].includes(order.status.toUpperCase());

  return (
    <main className="min-h-screen bg-gray-50/50">
      <Navbar />
      
      <div className="pt-32 pb-20 max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="flex items-center justify-between">
            <Link href="/orders" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-bold">
              <ChevronLeft className="w-5 h-5" />
              Back to Orders
            </Link>
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${badge.cls}`}>
              {badge.label}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white/40 backdrop-blur-xl p-8 rounded-[40px] border border-white/40 shadow-xl">
                <div className="flex items-center justify-between mb-8">
                  <h1 className="text-3xl font-bold text-gray-900">Order #{order.orderNumber ?? order.id.slice(-8)}</h1>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-bold">{orderDate}</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-2xl shadow-sm">
                        <Package className="w-6 h-6 text-gray-800" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{orderItems.length} Items</p>
                        {order.name && <p className="text-xs text-gray-400 font-bold">{order.name}</p>}
                      </div>
                    </div>
                    <p className="text-xl font-bold text-gray-900">₹{totalAmount.toLocaleString('en-IN')}</p>
                  </div>

                  {shippingAddress && (
                    <div className="p-6 bg-white/40 rounded-3xl border border-white shadow-sm">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Ship to</p>
                      <p className="text-sm font-bold text-gray-800 leading-relaxed">{shippingAddress}</p>
                    </div>
                  )}
                </div>
              </div>

              {orderItems.length > 0 && (
                <div className="bg-white/40 backdrop-blur-xl p-8 rounded-[40px] border border-white/40 shadow-xl">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Order Items</h2>
                  <div className="space-y-4">
                    {orderItems.map((item) => {
                      const itemName = item.product?.name ?? item.productName ?? item.name ?? 'Product';
                      const itemTotal = item.total ?? item.price * item.quantity;
                      return (
                        <div key={item.id} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-xl" />
                            <div>
                              <p className="font-bold text-gray-900">{itemName}</p>
                              <p className="text-xs text-gray-400 font-bold">Qty: {item.quantity}</p>
                            </div>
                          </div>
                          <p className="font-bold text-gray-900 tracking-tight">₹{itemTotal.toLocaleString('en-IN')}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {isCancellable && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => cancelMutation.mutate(order.id, {
                    onSuccess: () => toast('Order cancelled successfully', 'success'),
                    onError: () => toast('Failed to cancel order', 'error'),
                  })}
                  disabled={cancelMutation.isPending}
                  className="flex items-center gap-2 px-6 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-full font-bold transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
                </motion.button>
              )}
            </div>

            {/* Right Col: Timeline */}
            {steps.length > 0 && (
              <div className="bg-white/40 backdrop-blur-xl p-8 rounded-[40px] border border-white/40 shadow-xl h-fit sticky top-32">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-lime-100 rounded-xl">
                    <Truck className="w-5 h-5 text-gray-900" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Live Tracking</h2>
                </div>
                <Timeline steps={steps} />

                <Link
                  href={`/payments/${order.id}`}
                  className="w-full mt-8 py-4 bg-lime-300 hover:bg-lime-400 text-gray-900 rounded-full font-bold transition-all shadow-lg shadow-lime-200/50 flex items-center justify-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  View Payment
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <Footer />
    </main>
  );
}
