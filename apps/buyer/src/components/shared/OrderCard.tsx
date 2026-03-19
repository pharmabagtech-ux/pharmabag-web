'use client';

import { motion } from 'framer-motion';
import { Package, ChevronRight } from 'lucide-react';

interface OrderCardProps {
  orderId: string;
  date: string;
  status: string;
  total: string;
  itemCount: number;
}

export default function OrderCard({ orderId, date, status, total, itemCount }: OrderCardProps) {
  const getStatusColor = (s: string) => {
    switch (s.toUpperCase()) {
      case 'DELIVERED': return 'bg-green-100 text-green-700';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'SHIPPED': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="bg-white/40 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer flex items-center justify-between"
    >
      <div className="flex items-center gap-6">
        <div className="w-14 h-14 bg-lime-100 rounded-2xl flex items-center justify-center">
          <Package className="w-6 h-6 text-gray-800" />
        </div>
        <div className="flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 leading-tight">Order #{orderId}</h3>
          <p className="text-sm text-gray-500 font-medium mt-1">{date} • {itemCount} Items</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right hidden sm:flex flex-col">
          <span className="text-lg font-bold text-gray-900">{total}</span>
          <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 ${getStatusColor(status)}`}>
            {status}
          </span>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </motion.div>
  );
}
