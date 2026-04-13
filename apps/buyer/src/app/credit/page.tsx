'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard, Download, FileText, TrendingUp, TrendingDown,
  AlertCircle, CheckCircle2, Clock, IndianRupee, ArrowRight, Calendar
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';
import LoginModal from '@/components/landing/LoginModal';
import AuthGuard from '@/components/shared/AuthGuard';
import EmptyState from '@/components/shared/EmptyState';
import { SkeletonCard } from '@/components/shared/LoaderSkeleton';
import { useBuyerInvoices } from '@/hooks/useBuyerProfile';
import { useToast } from '@/components/shared/Toast';
import { formatCurrency, formatDate } from '@pharmabag/utils';

export default function CreditPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [invoicePage, setInvoicePage] = useState(1);
  const { data: invoicesData, isLoading: invoicesLoading } = useBuyerInvoices({ page: invoicePage, limit: 10 });
  const { toast } = useToast();

  const invoices = invoicesData?.data ?? [];

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#f2fcf6] relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-violet-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-40 pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vw] bg-[#e6fa64] rounded-full mix-blend-multiply filter blur-[150px] opacity-30 pointer-events-none" />

        <Navbar showUserActions onLoginClick={() => setIsLoginOpen(true)} />

        <div className="pt-20 sm:pt-24 md:pt-28 pb-12 sm:pb-20 px-[4vw] w-full mx-auto relative z-10">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Invoices & Payments</h1>
            <p className="text-gray-500 mt-1">Manage your order invoices and payment history</p>
          </div>

          <div className="grid grid-cols-1 gap-8">
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
                        <p className="text-sm font-medium text-gray-900">Order #{invoice.orderId?.slice(0, 8).toUpperCase()}</p>
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
        </div>
        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      </main>
    </AuthGuard>
  );
}
