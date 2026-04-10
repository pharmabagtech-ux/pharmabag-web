'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle2, AlertCircle, Info, ShieldCheck, Loader2, Inbox } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';
import { useAuth } from '@pharmabag/api-client';
import { useRouter } from 'next/navigation';

function formatTimeAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}

const typeConfig: Record<string, { bg: string; icon: React.ReactNode }> = {
  payment: { bg: 'bg-green-50', icon: <CheckCircle2 className="w-5 h-5 text-green-600" /> },
  order: { bg: 'bg-orange-50', icon: <AlertCircle className="w-5 h-5 text-orange-600" /> },
  system: { bg: 'bg-blue-50', icon: <Info className="w-5 h-5 text-blue-600" /> },
  promotion: { bg: 'bg-purple-50', icon: <Info className="w-5 h-5 text-purple-600" /> },
  verification: { bg: 'bg-emerald-50', icon: <ShieldCheck className="w-5 h-5 text-emerald-600" /> },
};

export default function NotificationDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data, isLoading, isError } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const typeRoutes: Record<string, string> = {
    order: '/orders',
    payment: '/payments',
    promotion: '/products',
    verification: '/profile',
  };

  const notifications = data?.data ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const handleNotificationClick = (notif: any) => {
    if (!notif.isRead) {
      markAsRead.mutate(notif.id);
    }
    const route = typeRoutes[notif.type ?? ''];
    if (route) {
      router.push(route);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-[280px] sm:w-[320px] md:w-[400px] bg-white shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 md:p-8 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Mark All as Read Button */}
            {unreadCount > 0 && (
              <div className="px-4 sm:px-6 md:px-8 py-3 border-b border-gray-100 bg-gray-50/50">
                <button
                  onClick={() => markAllAsRead.mutate()}
                  disabled={markAllAsRead.isPending}
                  className="text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
                >
                  {markAllAsRead.isPending ? 'Marking...' : 'Mark all as read'}
                </button>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-3">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
                  <p className="text-sm font-medium text-gray-400">Loading notifications...</p>
                </div>
              ) : isError ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <p className="text-sm font-medium text-red-400">Failed to load notifications</p>
                </div>
              ) : notifications.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="No notifications yet"
                  description="You'll see order updates, payment confirmations, and more here."
                />
              ) : (
                notifications.map((notif: any, idx: number) => {
                  const config = typeConfig[notif.type ?? 'system'] ?? typeConfig.system;
                  return (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => handleNotificationClick(notif)}
                      className={`group flex items-start gap-3 p-3 sm:p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                        notif.isRead 
                          ? 'bg-white/40 border-gray-100 hover:bg-white/60' 
                          : 'bg-white border-lime-100 shadow-lg shadow-lime-900/5 hover:border-lime-200'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                        {config.icon}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className={`font-bold text-sm sm:text-base ${notif.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                            {notif.title}
                          </h3>
                          <span className="text-xs font-bold text-gray-400 tabular-nums whitespace-nowrap flex-shrink-0">
                            {formatTimeAgo(notif.createdAt)}
                          </span>
                        </div>
                        <p className={`text-xs sm:text-sm leading-relaxed ${notif.isRead ? 'text-gray-400' : 'text-gray-600 font-medium'}`}>
                          {notif.message || notif.body || notif.msg}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
