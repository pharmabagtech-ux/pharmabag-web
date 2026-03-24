'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard, Download, FileText, TrendingUp, TrendingDown,
  AlertCircle, CheckCircle2, Clock, IndianRupee, ArrowRight, Calendar
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import LoginModal from '@/components/landing/LoginModal';
import AuthGuard from '@/components/shared/AuthGuard';
import EmptyState from '@/components/shared/EmptyState';
import { SkeletonCard } from '@/components/shared/LoaderSkeleton';
import { useBuyerCreditDetails, useBuyerInvoices } from '@/hooks/useBuyerProfile';
import { useToast } from '@/components/shared/Toast';
import { formatCurrency, formatDate } from '@pharmabag/utils';

export default function CreditPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [invoicePage, setInvoicePage] = useState(1);
  const { data: credit, isLoading: creditLoading, isError: creditError } = useBuyerCreditDetails();
  const { data: invoicesData, isLoading: invoicesLoading } = useBuyerInvoices({ page: invoicePage, limit: 10 });
  const { toast } = useToast();

  const invoices = invoicesData?.data ?? [];
  const usagePercent = credit ? Math.round((credit.usedCredit / credit.creditLimit) * 100) : 0;

  const milestoneStatusConfig: Record<string, { color: string; icon: typeof CheckCircle2; label: string }> = {
    paid: { color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle2, label: 'Paid' },
    pending: { color: 'text-amber-600 bg-amber-50', icon: Clock, label: 'Pending' },
    overdue: { color: 'text-red-600 bg-red-50', icon: AlertCircle, label: 'Overdue' },
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#f2fcf6] relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-violet-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-40 pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vw] bg-[#e6fa64] rounded-full mix-blend-multiply filter blur-[150px] opacity-30 pointer-events-none" />

        <Navbar showUserActions onLoginClick={() => setIsLoginOpen(true)} />

        <div className="pt-28 pb-20 px-4 md:px-8 max-w-[1200px] mx-auto relative z-10">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Credit & Payments</h1>
            <p className="text-gray-500 mt-1">Manage your credit line, milestones, and invoices</p>
          </div>

          {creditLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : creditError ? (
            <EmptyState
              icon={CreditCard}
              title="Unable to load credit details"
              description="Please try again later"
            />
          ) : credit ? (
            <>
              {/* Credit Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-100 rounded-xl">
                      <IndianRupee className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">Credit Limit</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(credit.creditLimit)}</p>
                  <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${usagePercent > 80 ? 'bg-red-500' : usagePercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, usagePercent)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{usagePercent}% used</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 rounded-xl">
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">Used Credit</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(credit.usedCredit)}</p>
                  <p className="text-xs text-gray-400 mt-1">Outstanding amount</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">Available Credit</p>
                  </div>
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(credit.availableCredit)}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Status: <span className="capitalize font-medium text-gray-600">{credit.status}</span>
                  </p>
                </motion.div>
              </div>

              {/* Milestones */}
              {credit.milestones && credit.milestones.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Milestones</h2>
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Order</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Amount</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Due Date</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                            <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {credit.milestones.map((milestone) => {
                            const config = milestoneStatusConfig[milestone.status] ?? milestoneStatusConfig.pending;
                            const StatusIcon = config.icon;
                            return (
                              <tr key={milestone.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                  <Link href={`/orders/${milestone.orderId}`} className="text-sm font-medium text-emerald-600 hover:underline">
                                    #{milestone.orderId.slice(-8)}
                                  </Link>
                                </td>
                                <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatCurrency(milestone.amount)}</td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {formatDate(milestone.dueDate)}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${config.color}`}>
                                    <StatusIcon className="w-3 h-3" />
                                    {config.label}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  {milestone.status !== 'paid' && (
                                    <Link
                                      href={`/payments/${milestone.orderId}`}
                                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                                    >
                                      Pay Now
                                    </Link>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Invoices */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Invoices</h2>
                {invoicesLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-8 text-center">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No invoices yet</p>
                  </div>
                ) : (
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm overflow-hidden">
                    {invoices.map((invoice, i) => (
                      <div key={invoice.id} className={`flex items-center justify-between px-6 py-4 ${i < invoices.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-gray-50/50 transition-colors`}>
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <FileText className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Order #{invoice.orderId.slice(-8)}</p>
                            <p className="text-xs text-gray-500">{formatDate(invoice.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-sm font-semibold text-gray-900">{formatCurrency(invoice.amount)}</p>
                          <a
                            href={invoice.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Download Invoice"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ))}

                    {invoicesData && invoicesData.total > invoices.length && (
                      <div className="px-6 py-3 border-t border-gray-100 flex justify-center">
                        <button
                          onClick={() => setInvoicePage(p => p + 1)}
                          className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                        >
                          Load More
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <EmptyState
              icon={CreditCard}
              title="No credit account"
              description="Complete your profile verification to access credit features"
              actionLabel="Complete Profile"
              actionHref="/onboarding"
            />
          )}
        </div>

        <Footer />
        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      </main>
    </AuthGuard>
  );
}
