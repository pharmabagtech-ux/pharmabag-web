'use client';

import { motion } from 'framer-motion';
import { Package, ChevronRight, Clock, CheckCircle2, Truck, AlertCircle } from 'lucide-react';

interface OrderCardProps {
  orderId: string;
  date: string;
  status: string;
  total: string;
  itemCount: number;
}

export default function OrderCard({ orderId, date, status, total, itemCount }: OrderCardProps) {
  const getStatusConfig = (s: string) => {
    switch (s.toUpperCase()) {
      case 'DELIVERED': 
        return { cls: 'bg-lime-100 text-lime-700 border-lime-200', icon: CheckCircle2 };
      case 'PENDING': 
      case 'PLACED':
        return { cls: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock };
      case 'SHIPPED': 
        return { cls: 'bg-sky-100 text-sky-700 border-sky-200', icon: Truck };
      case 'CANCELLED':
        return { cls: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle };
      default: 
        return { cls: 'bg-gray-100 text-gray-700 border-gray-200', icon: Package };
    }
  };

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.01 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-7 shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] transition-all duration-500 cursor-pointer group"
    >
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 md:gap-6 flex-1 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500 flex-shrink-0">
            <Package className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-gray-900 stroke-[1.5px]" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
              <h3 className="text-base sm:text-lg md:text-xl font-black text-gray-900 tracking-tight truncate">Order #{orderId}</h3>
              <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border ${statusConfig.cls} flex items-center gap-1 sm:gap-1.5 flex-shrink-0`}>
                <StatusIcon className="w-3 h-3" />
                {status}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 font-bold tracking-tight">
              {date} • <span className="text-gray-900">{itemCount} items</span>
            </p>
            {/* Show total on mobile below text */}
            <p className="text-lg font-black text-gray-950 tracking-tighter mt-1 sm:hidden">{total}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 md:gap-8 flex-shrink-0">
          <div className="text-right hidden sm:flex flex-col">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 font-sans">Total Bill</p>
            <span className="text-lg sm:text-xl md:text-2xl font-black text-gray-950 tracking-tighter">{total}</span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-50 group-hover:bg-lime-300 rounded-lg sm:rounded-xl flex items-center justify-center transition-colors">
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
