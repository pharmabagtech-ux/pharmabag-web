'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, AlertCircle, Filter, ShoppingBag } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import Navbar from '@/components/landing/Navbar';
import OrderCard from '@/components/shared/OrderCard';
import { SkeletonList } from '@/components/shared/LoaderSkeleton';
import Link from 'next/link';
import { useOrders } from '@/hooks/useOrders';
import AuthGuard from '@/components/shared/AuthGuard';

const STATUS_FILTERS = ['ALL', 'PLACED', 'ACCEPTED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useOrders({
    page,
    limit: 10,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  });

  const orders = (Array.isArray(data) ? data : data?.data) ?? [];
  const total = (data as any)?.total ?? (Array.isArray(data) ? data.length : 0);

  return (
    <AuthGuard>
    <main className="min-h-screen bg-gray-50/50">
      <Navbar showUserActions={true} />

      <div className="pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-12 sm:pb-20 w-full mx-auto px-[4vw]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg border border-gray-100">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">My Orders</h1>
            </div>
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {STATUS_FILTERS.map((s) => (
              <motion.button
                key={s}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  statusFilter === s
                    ? 'bg-gray-900 text-white shadow-lg'
                    : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-100'
                }`}
              >
                {s === 'ALL' ? 'All Orders' : s}
              </motion.button>
            ))}
          </div>

          {/* Order List */}
          <div className="space-y-4">
            {isLoading ? (
              <SkeletonList count={4} variant="order" />
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <AlertCircle className="w-12 h-12 text-red-300" />
                <p className="text-lg font-bold text-gray-400">Failed to load orders</p>
              </div>
            ) : orders.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title="No orders found"
                description="Your orders will appear here once you place one."
                actionLabel="Browse Products"
                actionHref="/"
              />
            ) : (
              orders.map((order: any, idx: number) => {
                const orderNumber = order.orderNumber ?? order.id.slice(-8);
                const totalAmount = order.totalAmount ?? order.total ?? order.amount ?? 0;
                const itemCount = order.items?.length ?? order.orderItems?.length ?? 0;
                const orderDate = order.createdAt
                  ? new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                  : '';
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Link href={`/orders/${order.id}`}>
                      <OrderCard
                        orderId={orderNumber}
                        date={orderDate}
                        status={order.status || 'PLACED'}
                        total={`₹${totalAmount.toLocaleString('en-IN')}`}
                        itemCount={itemCount}
                      />
                    </Link>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {total > (data?.limit || 10) && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-6 py-2 bg-white border border-gray-100 rounded-2xl font-bold text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-30"
              >
                Previous
              </motion.button>
              <span className="text-sm font-bold text-gray-400">Page {page}</span>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setPage((p) => p + 1)}
                disabled={orders.length < 10}
                className="px-6 py-2 bg-white border border-gray-100 rounded-2xl font-bold text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-30"
              >
                Next
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>
</main>
    </AuthGuard>
  );
}
