"use client";
import { motion } from "framer-motion";
import { AdminLayout } from "@/components/layout/admin-layout";
import { StatCard } from "@/components/ui";
import { formatCurrency, formatCompact } from "@pharmabag/utils";
import { TrendingUp, Users, ShoppingBag, Package, CreditCard, AlertTriangle, Flag, CheckCircle } from "lucide-react";
import { useAdminDashboard } from "@/hooks/useAdmin";

export default function AdminAnalyticsPage() {
  const { data: d, isLoading } = useAdminDashboard();

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading analytics…</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const stats = {
    totalUsers: d?.totalUsers ?? 0,
    totalBuyers: d?.totalBuyers ?? 0,
    totalSellers: d?.totalSellers ?? 0,
    totalOrders: d?.totalOrders ?? 0,
    totalRevenue: d?.totalRevenue ?? 0,
    totalProducts: d?.totalProducts ?? 0,
    pendingOrders: d?.pendingOrders ?? 0,
    pendingPayments: d?.pendingPayments ?? 0,
    pendingSettlements: d?.pendingSettlements ?? 0,
    openTickets: d?.openTickets ?? 0,
    blockedUsers: d?.blockedUsers ?? 0,
  };

  const avgOrderValue = stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders) : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-semibold text-2xl text-foreground">Platform Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Comprehensive performance metrics from live data</p>
        </div>

        {/* Top-level stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="GMV (All Time)" value={`₹${formatCompact(stats.totalRevenue)}`} icon={TrendingUp} iconClass="bg-green-50 text-green-600 dark:bg-green-900/20" delay={0} />
          <StatCard title="Total Users" value={formatCompact(stats.totalUsers)} change={`${stats.totalBuyers} buyers · ${stats.totalSellers} sellers`} icon={Users} iconClass="bg-blue-50 text-blue-600 dark:bg-blue-900/20" delay={0.07} />
          <StatCard title="Total Orders" value={formatCompact(stats.totalOrders)} change={`Avg: ${formatCurrency(avgOrderValue)}`} icon={ShoppingBag} iconClass="bg-purple-50 text-purple-600 dark:bg-purple-900/20" delay={0.14} />
          <StatCard title="Catalogue Size" value={formatCompact(stats.totalProducts)} icon={Package} iconClass="bg-orange-50 text-orange-600 dark:bg-orange-900/20" delay={0.21} />
        </div>

        {/* Operational stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Pending Orders" value={String(stats.pendingOrders)} change="Awaiting processing" icon={ShoppingBag} iconClass="bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20" alert delay={0.28} />
          <StatCard title="Pending Payments" value={String(stats.pendingPayments)} change="Awaiting verification" icon={CreditCard} iconClass="bg-red-50 text-red-500 dark:bg-red-900/20" alert delay={0.35} />
          <StatCard title="Pending Settlements" value={String(stats.pendingSettlements)} change="Seller payouts pending" icon={AlertTriangle} iconClass="bg-orange-50 text-orange-500 dark:bg-orange-900/20" alert delay={0.42} />
          <StatCard title="Open Tickets" value={String(stats.openTickets)} change="Support tickets" icon={Flag} iconClass="bg-pink-50 text-pink-600 dark:bg-pink-900/20" alert delay={0.49} />
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-6">
            <h2 className="font-semibold text-foreground mb-4">User Breakdown</h2>
            <div className="space-y-3">
              {[
                { label: "Buyers", value: stats.totalBuyers, color: "bg-green-500" },
                { label: "Sellers", value: stats.totalSellers, color: "bg-blue-500" },
                { label: "Blocked", value: stats.blockedUsers, color: "bg-red-500" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                    <span className="text-sm text-muted-foreground">{label}</span>
                  </div>
                  <span className="font-semibold text-foreground">{formatCompact(value)}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card rounded-2xl p-6">
            <h2 className="font-semibold text-foreground mb-4">Revenue Summary</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Gross Revenue</span>
                <span className="font-semibold text-foreground">{formatCurrency(stats.totalRevenue)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Orders</span>
                <span className="font-semibold text-foreground">{stats.totalOrders}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg Order Value</span>
                <span className="font-semibold text-foreground">{formatCurrency(avgOrderValue)}</span>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-2xl p-6">
            <h2 className="font-semibold text-foreground mb-4">Platform Health</h2>
            <div className="space-y-3">
              {[
                { label: "Products", value: stats.totalProducts, icon: Package },
                { label: "Pending Settlements", value: stats.pendingSettlements, icon: CreditCard },
                { label: "Open Tickets", value: stats.openTickets, icon: Flag },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{label}</span>
                  </div>
                  <span className="font-semibold text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}
