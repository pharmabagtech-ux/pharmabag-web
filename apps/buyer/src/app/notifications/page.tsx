'use client';

import { motion } from 'framer-motion';
import { Bell, CheckCircle2, AlertCircle, Info, ChevronRight, Inbox, ShieldCheck } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import Navbar from '@/components/landing/Navbar';
import { SkeletonList } from '@/components/shared/LoaderSkeleton';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';
import AuthGuard from '@/components/shared/AuthGuard';
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

export default function NotificationsPage() {
  const { data, isLoading, isError } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const router = useRouter();

  const typeRoutes: Record<string, string> = {
    order: '/orders',
    payment: '/payments',
    promotion: '/products',
    verification: '/profile',
  };

  const notifications = data?.data ?? [];
  const unreadCount = data?.unreadCount ?? 0;



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
                <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Notifications</h1>
                {unreadCount > 0 && (
                  <p className="text-sm font-medium text-gray-400">{unreadCount} unread</p>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
                className="text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors disabled:opacity-50"
              >
                {markAllAsRead.isPending ? 'Marking...' : 'Mark all as read'}
              </button>
            )}
          </div>

          {isLoading ? (
            <SkeletonList count={5} variant="notification" />
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <AlertCircle className="w-10 h-10 text-gray-300" />
              <p className="text-lg font-bold text-gray-400">Failed to load notifications</p>
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No notifications yet"
              description="You'll see order updates, payment confirmations, and more here."
            />
          ) : (
            <div className="space-y-4">
              {notifications.map((notif: any, idx: number) => {
                const config = typeConfig[notif.type ?? 'system'] ?? typeConfig.system;
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ x: 5 }}
                    onClick={() => {
                      if (!notif.isRead) markAsRead.mutate(notif.id);
                      const route = typeRoutes[notif.type ?? ''];
                      if (route) router.push(route);
                    }}
                    className={`group flex items-center gap-3 sm:gap-6 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all duration-300 cursor-pointer ${
                      notif.isRead 
                        ? 'bg-white/40 border-gray-100 hover:bg-white/60 shadow-sm' 
                        : 'bg-white border-lime-100 shadow-xl shadow-lime-900/5 hover:border-lime-200'
                    }`}
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                      {config.icon}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <h3 className={`font-bold text-lg ${notif.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                          {notif.title}
                        </h3>
                        <span className="text-xs font-bold text-gray-400 tabular-nums whitespace-nowrap">
                          {formatTimeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <p className={`text-sm leading-relaxed ${notif.isRead ? 'text-gray-400' : 'text-gray-600 font-medium'}`}>
                        {notif.message}
                      </p>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
</main>
    </AuthGuard>
  );
}
