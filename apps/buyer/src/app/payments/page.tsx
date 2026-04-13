'use client';

import { motion } from 'framer-motion';
import { CreditCard, ChevronRight, Clock, AlertCircle, Wallet } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import Navbar from '@/components/landing/Navbar';
import { SkeletonList } from '@/components/shared/LoaderSkeleton';
import Link from 'next/link';
import { usePaymentHistory } from '@/hooks/usePayments';
import AuthGuard from '@/components/shared/AuthGuard';

function getPaymentStatusBadge(status: string) {
  const s = status.toUpperCase();
  if (['CONFIRMED', 'COMPLETED', 'VERIFIED'].includes(s)) return { cls: 'bg-green-100 text-green-700' };
  if (['PENDING', 'PROCESSING'].includes(s)) return { cls: 'bg-yellow-100 text-yellow-700' };
  return { cls: 'bg-red-100 text-red-700' };
}

export default function PaymentsPage() {
  const { data, isLoading, isError } = usePaymentHistory();
  const payments = data?.data ?? [];

  const totalPending = payments
    .filter((p) => ['PENDING', 'PROCESSING'].includes(p.status.toUpperCase()))
    .reduce((acc, p) => acc + p.amount, 0);
  const pendingCount = payments.filter((p) => ['PENDING', 'PROCESSING'].includes(p.status.toUpperCase())).length;

  return (
    <AuthGuard>
    <main className="min-h-screen bg-gray-50/50">
      <Navbar showUserActions={true} />
      
      <div className="pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-12 sm:pb-20 w-full mx-auto px-[4vw]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6 sm:space-y-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg border border-gray-100">
                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Payments</h1>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -3 }}
              className="bg-white/60 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white shadow-lg"
            >
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Total Outstanding</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">₹{totalPending.toLocaleString('en-IN')}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -3 }}
              className="bg-white/60 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white shadow-lg"
            >
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Pending Count</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{pendingCount} Orders</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -3 }}
              className="bg-lime-300 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-lg shadow-lime-200"
            >
              <p className="text-sm font-bold text-gray-900/60 uppercase tracking-wider mb-2">Total Payments</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{payments.length}</p>
            </motion.div>
          </div>

          {/* Transaction List */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 ml-2">Recent Payments</h2>

            {isLoading ? (
              <SkeletonList count={4} variant="payment" />
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <AlertCircle className="w-12 h-12 text-red-300" />
                <p className="text-lg font-bold text-gray-400">Failed to load payments</p>
              </div>
            ) : payments.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="No payments yet"
                description="Payment records will appear here once you make a purchase."
                actionLabel="View Orders"
                actionHref="/orders"
              />
            ) : (
              payments.map((payment, idx) => {
                const badge = getPaymentStatusBadge(payment.status);
                const paymentDate = payment.createdAt
                  ? new Date(payment.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                  : '';
                return (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ y: -3 }}
                    className="bg-white/40 backdrop-blur-xl border border-white/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl hover:shadow-2xl transition-all duration-300"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 lg:gap-8">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-widest text-[#800080]">
                            Order #{payment.orderId?.slice(0, 8).toUpperCase()}
                          </span>
                          <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${badge.cls}`}>
                            {payment.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          {payment.method && (
                            <span className="text-sm font-bold text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                              {payment.method}
                            </span>
                          )}
                          {payment.referenceNumber && (
                            <span className="text-xs text-gray-400">Ref: {payment.referenceNumber}</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 font-medium">{paymentDate}</p>
                      </div>

                      <div className="flex items-center gap-6 sm:gap-8 lg:gap-12 lg:border-l lg:pl-12 border-gray-100">
                        <div className="space-y-2 min-w-[120px]">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Amount</p>
                          <p className="text-2xl font-bold text-gray-900">₹{payment.amount.toLocaleString('en-IN')}</p>
                        </div>

                        <Link
                          href={`/payments/${payment.orderId}`}
                          className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center hover:bg-black transition-colors shadow-lg shadow-black/10 text-white"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
</main>
    </AuthGuard>
  );
}
