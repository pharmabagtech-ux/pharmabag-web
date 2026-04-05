'use client';

import { motion } from 'framer-motion';
import { Package, Truck, ChevronLeft, Calendar, FileText, Loader2, AlertCircle, XCircle } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import Timeline from '@/components/shared/Timeline';
import { useToast } from '@/components/shared/Toast';
import Link from 'next/link';
import { useOrderById, useCancelOrder } from '@/hooks/useOrders';
import { useClearCart } from '@/hooks/useCart';
import AuthGuard from '@/components/shared/AuthGuard';

const STATUS_ORDER = ['PLACED', 'ACCEPTED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

function normalizeStatus(s: string | undefined): string {
  const status = (s || '').toUpperCase();
  const map: Record<string, string> = {
    CONFIRMED: 'ACCEPTED',
    PROCESSING: 'ACCEPTED',
    TRANSIT: 'SHIPPED',
    READY_FOR_PICKUP: 'SHIPPED',
    OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
    COMPLETED: 'DELIVERED',
  };
  return map[status] ?? status;
}

function formatImageUrl(url: any): string | undefined {
  if (!url) return undefined;
  
  // If it's an object with a url property, use that
  const path = typeof url === 'string' ? url : url.url || url.path || (Array.isArray(url) ? url[0] : undefined);
  
  if (!path || typeof path !== 'string') return undefined;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  
  // Try to get base URL from env
  const env = (typeof process !== 'undefined' ? process.env : {}) as any;
  const baseURL = env.NEXT_PUBLIC_API_BASE_URL || env.NEXT_PUBLIC_API_URL || '';
  
  // Remove /api if present at the end of baseURL for image paths
  const cleanBase = baseURL.replace(/\/api\/?$/, '');
  
  const separator = path.startsWith('/') ? '' : '/';
  return `${cleanBase}${separator}${path}`;
}

function buildTimelineSteps(status: string | undefined) {
  const normalized = normalizeStatus(status);
  const labels = ['Order Placed', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered'];
  const currentIdx = STATUS_ORDER.indexOf(normalized);
  
  // Also handle cases where status might be slightly ahead/behind
  // or use the first step as fallback if not matched
  const activeIdx = currentIdx === -1 ? 0 : currentIdx;

  return labels.map((label, idx) => ({
    label,
    description: idx <= activeIdx ? '' : 'Pending',
    isCompleted: idx < activeIdx,
    isActive: idx === activeIdx,
  }));
}

function getStatusBadge(status: string | undefined) {
  const s = normalizeStatus(status);
  if (s === 'DELIVERED') return { label: 'Delivered', cls: 'bg-green-100 text-green-700 font-bold' };
  if (s === 'SHIPPED') return { label: 'In Transit', cls: 'bg-blue-100 text-blue-700 font-bold' };
  if (s === 'OUT_FOR_DELIVERY') return { label: 'Out for Delivery', cls: 'bg-purple-100 text-purple-700 font-bold' };
  if (s === 'CANCELLED') return { label: 'Cancelled', cls: 'bg-red-100 text-red-700 font-bold' };
  if (s === 'ACCEPTED') return { label: 'Confirmed', cls: 'bg-lime-100 text-lime-700 font-bold' };
  if (s === 'PLACED') return { label: 'Order Placed', cls: 'bg-yellow-100 text-yellow-700 font-bold' };
  return { label: s || 'Unknown', cls: 'bg-gray-100 text-gray-700 font-bold' };
}

export default function OrderIdPage({ params }: { params: { orderId: string } }) {
  const { data: order, isLoading, isError } = useOrderById(params.orderId);
  const cancelMutation = useCancelOrder();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50/50">
        <Navbar showUserActions={true} />
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
        <Navbar showUserActions={true} />
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

  const status = order.orderStatus || order.status;
  const badge = getStatusBadge(status);
  const steps = (status || '').toUpperCase() !== 'CANCELLED' ? buildTimelineSteps(status) : [];
  const orderItems = order.items ?? [];
  const totalAmount = order.totalAmount ?? order.total ?? order.amount ?? 0;
  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
  const ship = order.shippingAddress || {};
  const flattenStr = (val: any) => {
    if (typeof val === 'string') return val;
    if (!val) return '';
    return val.street || val.address || val.name || val.city || val.state || val.pincode || '';
  };
  
  const shippingAddress = typeof order.shippingAddress === 'string' 
    ? order.shippingAddress 
    : [
        flattenStr(ship.address || order.address), 
        flattenStr(ship.city || order.city), 
        flattenStr(ship.state || order.state), 
        flattenStr(ship.pincode || order.pincode)
      ].filter(Boolean).join(', ');
  const isCancellable = !['DELIVERED', 'CANCELLED', 'SHIPPED'].includes(normalizeStatus(status));

  return (
    <AuthGuard>
    <main className="min-h-screen bg-gray-50/50">
      <Navbar showUserActions={true} />
      
      <div className="pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-12 sm:pb-20 w-full mx-auto px-[4vw]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 sm:space-y-8"
        >
          <div className="flex items-center justify-between">
            <Link href="/orders" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-bold">
              <ChevronLeft className="w-5 h-5" />
              Back to Orders
            </Link>
            <span className={`px-4 py-1.5 rounded-2xl text-xs font-bold uppercase tracking-wider ${badge.cls}`}>
              {badge.label}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white/40 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[40px] border border-white/40 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-6 sm:mb-8">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Order #{order.orderNumber ?? order.id.slice(-8)}</h1>
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
                <div className="bg-white/40 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[40px] border border-white/40 shadow-xl">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Order Items</h2>
                  <div className="space-y-4">
                    {orderItems.map((item: any) => {
                      const itemName = item.product?.name ?? item.productName ?? item.name ?? 'Product';
                      const itemTotal = item.totalPrice ?? item.total ?? (item.price || item.unitPrice || 0) * (item.quantity || 1);
                      
                      // Find best candidate for product image
                      const rawImage = 
                        item.product?.images?.[0] || 
                        item.product?.imageList?.[0] || 
                        item.product?.image_list?.[0] || 
                        item.productData?.images?.[0] || 
                        item.productData?.image_list?.[0] || 
                        item.image || 
                        item.productImage || 
                        item.product?.image;
                      
                      const itemImage = formatImageUrl(rawImage);

                      return (
                        <div key={item.id} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex-shrink-0 overflow-hidden flex items-center justify-center border border-gray-100">
                              {itemImage ? (
                                <img src={itemImage} alt={itemName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="p-3 bg-lime-50 rounded-xl">
                                  <Package className="w-6 h-6 text-lime-600" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 line-clamp-1">{itemName}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-gray-400 font-bold">Qty: {item.quantity || 1}</span>
                                <span className="text-[10px] text-gray-300">•</span>
                                <span className="text-xs text-gray-400 font-bold">₹{(item.price || item.unitPrice || (itemTotal / (item.quantity || 1))).toLocaleString('en-IN')}/unit</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900 tracking-tight">₹{itemTotal.toLocaleString('en-IN')}</p>
                          </div>
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
                  className="flex items-center gap-2 px-6 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl font-bold transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
                </motion.button>
              )}
            </div>

            {/* Right Col: Timeline */}
            {steps.length > 0 && (
              <div className="bg-white/40 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[40px] border border-white/40 shadow-xl h-fit sticky top-24 sm:top-32">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-lime-100 rounded-xl">
                    <Truck className="w-5 h-5 text-gray-900" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Live Tracking</h2>
                </div>
                <Timeline steps={steps} />

                <Link
                  href={`/payments/${order.id}`}
                  className="w-full mt-8 py-4 bg-lime-300 hover:bg-lime-400 text-gray-900 rounded-2xl font-bold transition-all shadow-lg shadow-lime-200/50 flex items-center justify-center gap-2"
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
    </AuthGuard>
  );
}
