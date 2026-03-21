"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Users, Package, ShoppingBag, TrendingUp, AlertTriangle, CheckCircle, Clock, Flag, Bell, Search } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { StatCard, Badge, StatusBadge, Button } from "@/components/ui";
import { formatCurrency, formatCompact } from "@pharmabag/utils";
import { useAdminDashboard } from "@/hooks/useAdmin";

export default function AdminDashboardPage() {
  const { data: d, isLoading } = useAdminDashboard();

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading dashboard…</p>
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
  const recentOrders = d?.recentOrders ?? [];

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-semibold text-2xl text-foreground">Platform Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Monitor the entire PharmaBag ecosystem</p>
        </div>
      </div>

      {/* Critical alerts */}
      {(stats.pendingOrders > 0 || stats.openTickets > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {stats.pendingOrders > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-400">{stats.pendingOrders} Pending Orders</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-500">Orders awaiting processing</p>
                </div>
              </div>
              <Link href="/orders"><Button size="xs" variant="warning">Review</Button></Link>
            </motion.div>
          )}
          {stats.openTickets > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="flex items-center justify-between p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3">
                <Flag className="h-5 w-5 text-red-500 flex-shrink-0" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">{stats.openTickets} Open Tickets</p>
                  <p className="text-xs text-red-500">Support tickets need attention</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Users" value={formatCompact(stats.totalUsers)} change={`${stats.totalBuyers} buyers · ${stats.totalSellers} sellers`} icon={Users} iconClass="bg-blue-50 text-blue-600 dark:bg-blue-900/20" delay={0} />
        <StatCard title="Total Sellers" value={String(stats.totalSellers)} change={`${stats.blockedUsers} blocked`} icon={CheckCircle} iconClass="bg-green-50 text-green-600 dark:bg-green-900/20" delay={0.07} />
        <StatCard title="Total Orders" value={formatCompact(stats.totalOrders)} change={`${stats.pendingOrders} pending`} icon={ShoppingBag} iconClass="bg-purple-50 text-purple-600 dark:bg-purple-900/20" delay={0.14} />
        <StatCard title="Platform Revenue" value={`₹${formatCompact(stats.totalRevenue)}`} change={`${stats.pendingPayments} pending payments`} icon={TrendingUp} iconClass="bg-orange-50 text-orange-600 dark:bg-orange-900/20" delay={0.21} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Products" value={formatCompact(stats.totalProducts)} icon={Package} iconClass="bg-teal-50 text-teal-600 dark:bg-teal-900/20" delay={0.28} />
        <StatCard title="Pending Orders" value={String(stats.pendingOrders)} change="Need processing" icon={Clock} iconClass="bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20" alert delay={0.35} />
        <StatCard title="Pending Payments" value={String(stats.pendingPayments)} change="Awaiting verification" icon={AlertTriangle} iconClass="bg-red-50 text-red-500 dark:bg-red-900/20" alert delay={0.42} />
        <StatCard title="Open Tickets" value={String(stats.openTickets)} change="Unresolved" icon={Flag} iconClass="bg-pink-50 text-pink-600 dark:bg-pink-900/20" alert delay={0.49} />
      </div>

      {/* Recent orders table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div><h2 className="font-semibold text-foreground">Recent Platform Orders</h2><p className="text-xs text-muted-foreground mt-0.5">Latest orders across the platform</p></div>
          <Link href="/orders"><Button variant="ghost" size="sm">View all</Button></Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" aria-label="Platform orders">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                {["Order ID", "Buyer Phone", "Amount", "Payment", "Status", "Date"].map(h => (
                  <th key={h} scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {recentOrders.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">No orders yet</td></tr>
              ) : recentOrders.map((o: any, i: number) => (
                <motion.tr key={o.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="hover:bg-accent/30 transition-colors">
                  <td className="px-5 py-4"><span className="font-mono text-xs font-medium text-foreground">{o.id?.slice(0, 8)}…</span></td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{o.buyer?.phone ?? "—"}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-foreground">{formatCurrency(o.totalAmount ?? 0)}</td>
                  <td className="px-5 py-4"><Badge variant={o.paymentStatus === "PAID" ? "success" : o.paymentStatus === "PENDING" ? "warning" : "error"}>{o.paymentStatus ?? "—"}</Badge></td>
                  <td className="px-5 py-4"><Badge variant={o.orderStatus === "DELIVERED" ? "success" : o.orderStatus === "PLACED" ? "warning" : "info"}>{o.orderStatus ?? "—"}</Badge></td>
                  <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">{o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </AdminLayout>
  );
}
