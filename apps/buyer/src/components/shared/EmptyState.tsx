'use client';

import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  compact?: boolean;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  compact = false,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`flex flex-col items-center justify-center gap-4 ${compact ? 'py-12' : 'py-20'}`}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }}
        className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center"
      >
        <Icon className="w-9 h-9 text-gray-300" />
      </motion.div>

      <div className="text-center space-y-1.5">
        <p className="text-lg font-bold text-gray-400">{title}</p>
        {description && (
          <p className="text-sm text-gray-400 max-w-xs mx-auto">{description}</p>
        )}
      </div>

      {actionLabel && (actionHref || onAction) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors shadow-md"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors shadow-md"
            >
              {actionLabel}
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
