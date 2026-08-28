"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { AdminLayout } from "@/components/layout/admin-layout";
import { StatCard, Badge, Tabs } from "@/components/ui";
import { AnalyticsNav } from "@/components/analytics/analytics-nav";
import { formatCurrency, formatCompact } from "@pharmabag/utils";
import { TrendingUp, Users, ShoppingBag, Package, CreditCard, AlertTriangle, Flag, CheckCircle, BarChart3, Trophy } from "lucide-react";
import { useAdminDashboard, useRevenueChart, useOrdersChart, useTopProducts, useTopSellers } from "@/hooks/useAdmin";

export default function AdminAnalyticsPage() {
  const { data: d, isLoading } = useAdminDashboard();
  const [period, setPeriod] = useState("30d");
  const { data: revenueData } = useRevenueChart(period);
  const { data: ordersData } = useOrdersChart(period);
  const { data: topProductsData } = useTopProducts(10);
  const { data: topSellersData } = useTopSellers(10);

  const topProducts: any[] = Array.isArray(topProductsData) ? topProductsData : (topProductsData?.data ?? []);
  const topSellers: any[] = Array.isArray(topSellersData) ? topSellersData : (topSellersData?.data ?? []);

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

        <AnalyticsNav active="platform" />

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

        {/* Period Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Period:</span>
          {[{ k: "7d", l: "7 Days" }, { k: "30d", l: "30 Days" }, { k: "90d", l: "90 Days" }, { k: "1y", l: "1 Year" }].map(({ k, l }) => (
            <button key={k} onClick={() => setPeriod(k)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${period === k ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:bg-accent/60"}`}>{l}</button>
          ))}
        </div>

        {/* Chart Placeholders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card rounded-2xl p-6">
            <h2 className="font-semibold text-foreground mb-4">Revenue Trend</h2>
            <div className="h-48 flex items-center justify-center border border-dashed border-border rounded-xl bg-muted/10">
              {revenueData ? (
                <div className="w-full px-4">
                  {(Array.isArray(revenueData) ? revenueData : (revenueData as any)?.data ?? []).slice(0, 7).map((point: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground w-16">{point.date ?? point.label ?? `Day ${i + 1}`}</span>
                      <div className="flex-1 h-4 bg-muted/20 rounded-full overflow-hidden">
                        <div className="h-full bg-primary/60 rounded-full" style={{ width: `${Math.min(100, ((point.value ?? point.amount ?? 0) / Math.max(1, ...((Array.isArray(revenueData) ? revenueData : []).map((p: any) => p.value ?? p.amount ?? 1)))) * 100)}%` }} />
                      </div>
                      <span className="text-xs font-mono text-foreground w-20 text-right">{formatCurrency(point.value ?? point.amount ?? 0)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center">
                  <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">Revenue chart data will appear here</p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card rounded-2xl p-6">
            <h2 className="font-semibold text-foreground mb-4">Orders Trend</h2>
            <div className="h-48 flex items-center justify-center border border-dashed border-border rounded-xl bg-muted/10">
              {ordersData ? (
                <div className="w-full px-4">
                  {(Array.isArray(ordersData) ? ordersData : (ordersData as any)?.data ?? []).slice(0, 7).map((point: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground w-16">{point.date ?? point.label ?? `Day ${i + 1}`}</span>
                      <div className="flex-1 h-4 bg-muted/20 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500/60 rounded-full" style={{ width: `${Math.min(100, ((point.value ?? point.count ?? 0) / Math.max(1, ...((Array.isArray(ordersData) ? ordersData : []).map((p: any) => p.value ?? p.count ?? 1)))) * 100)}%` }} />
                      </div>
                      <span className="text-xs font-mono text-foreground w-12 text-right">{point.value ?? point.count ?? 0}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center">
                  <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">Orders chart data will appear here</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Top Products & Sellers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="glass-card rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-border/50">
              <h2 className="font-semibold text-foreground flex items-center gap-2"><Trophy className="h-4 w-4 text-yellow-500" /> Top Products</h2>
            </div>
            <div className="divide-y divide-border/30">
              {topProducts.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No data yet</div>
              ) : topProducts.map((p: any, i: number) => (
                <div key={p.id || i} className="px-6 py-3 flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.name ?? "Product"}</p>
                    <p className="text-xs text-muted-foreground">{p.manufacturer ?? "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{p.totalSold ?? p.orderCount ?? 0} sold</p>
                    {p.revenue != null && <p className="text-xs text-muted-foreground">{formatCurrency(p.revenue)}</p>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-border/50">
              <h2 className="font-semibold text-foreground flex items-center gap-2"><Trophy className="h-4 w-4 text-yellow-500" /> Top Sellers</h2>
            </div>
            <div className="divide-y divide-border/30">
              {topSellers.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No data yet</div>
              ) : topSellers.map((s: any, i: number) => (
                <div key={s.id || i} className="px-6 py-3 flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.sellerProfile?.companyName ?? s.name ?? "Seller"}</p>
                    <p className="text-xs text-muted-foreground">{s.phone ?? "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(s.revenue ?? s.totalSales ?? 0)}</p>
                    <p className="text-xs text-muted-foreground">{s.orderCount ?? 0} orders</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}
