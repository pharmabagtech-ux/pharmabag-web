'use client';

import { Plus, Clock, Loader2 } from 'lucide-react';

export type StockStatus = 'good' | 'selling-fast' | 'low' | 'out-of-stock';

interface StockBasedButtonProps {
  stock: number;
  onAddToCart?: () => void;
  onNotifyStockAlert?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  moq?: number;
}

export function StockBasedButton({
  stock,
  onAddToCart,
  onNotifyStockAlert,
  isLoading = false,
  disabled = false,
  moq = 1,
}: StockBasedButtonProps) {
  // Determine stock status
  let status: StockStatus;
  if (stock === 0) {
    status = 'out-of-stock';
  } else if (stock > 100) {
    status = 'good';
  } else if (stock > 20) {
    status = 'selling-fast';
  } else {
    status = 'low';
  }

  // Icon color mapping (no fill, just icon color)
  const iconColorMap = {
    'good': 'text-black hover:text-gray-700',
    'selling-fast': 'text-yellow-500 hover:text-yellow-600',
    'low': 'text-red-500 hover:text-red-600',
    'out-of-stock': 'text-red-500 cursor-not-allowed',
  };

  // Badge text mapping
  const badgeMap = {
    'good': '',
    'selling-fast': 'SELLING FAST',
    'low': '',
    'out-of-stock': '',
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (status === 'out-of-stock') {
      onNotifyStockAlert?.();
    } else {
      onAddToCart?.();
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={disabled || isLoading || status === 'out-of-stock'}
        onClick={handleClick}
        className={`
          p-1 transition-all duration-150 active:scale-90
          ${iconColorMap[status]}
          ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        title={status === 'out-of-stock' ? 'Notify when back in stock' : `Add ${moq} to cart`}
      >
        {isLoading ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : status === 'out-of-stock' ? (
          <Clock className="w-6 h-6 text-red-500" strokeWidth={2.5} />
        ) : (
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        )}
      </button>

      {/* Stock Status Badge */}
      {badgeMap[status] && (
        <div className={`text-[8px] font-bold text-center truncate px-1 ${
          status === 'selling-fast' ? 'text-yellow-700' :
          status === 'low' ? 'text-red-600' :
          'text-gray-500'
        }`}>
          {badgeMap[status]}
        </div>
      )}
    </div>
  );
}
