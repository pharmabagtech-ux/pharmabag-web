"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Package, ShoppingBag, TrendingUp, CreditCard, Star, AlertTriangle, Bell, BarChart3, Palmtree } from "lucide-react";
import { StatCard, Button, OrderStatusBadge } from "@/components/ui";
import { formatCurrency, formatDate } from "@pharmabag/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useSellerDashboard, useToggleVacationMode, useSellerProfile } from "@/hooks/useSeller";
import { useSellerAuth } from "@/store";
import toast from "react-hot-toast";

export default function SellerDashboard() {
  const { data: dashboardData, isLoading } = useSellerDashboard();
  const { user } = useSellerAuth();
  const { data: profile } = useSellerProfile();
  const toggleVacation = useToggleVacationMode();
  const isOnVacation = user?.isOnVacation || (profile as any)?.isOnVacation || false;
  const sellerOrders: any[] = dashboardData?.overview?.orders || [];
  const stats = dashboardData?.stats || {
    totalProducts: 0,
    activeListings: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    pendingPayouts: 0,
    avgRating: 0,
    lowStockItems: 0,
  };

  if (isLoading) {
    return <div className="min-h-screen p-6">Loading seller dashboard...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Vacation Mode Banner */}
      {isOnVacation && (
        <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="flex items-center justify-between gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-3">
            <Palmtree className="h-5 w-5 text-amber-600 flex-shrink-0" aria-hidden/>
            <div>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Vacation Mode is ON</p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">Your store is currently hidden from buyers. Turn off vacation mode to resume selling.</p>
            </div>
          </div>
          <Button size="sm" variant="outline" loading={toggleVacation.isPending} onClick={() => { toggleVacation.mutate(false, { onSuccess: () => toast.success("Vacation mode turned off. Your store is now visible!"), onError: () => toast.error("Failed to update vacation mode") }); }}>
            Deactivate
          </Button>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl text-foreground">Seller Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{user?.businessName || user?.name || "Seller"} · <span className="text-yellow-500">★ {stats.avgRating.toFixed(1)}</span></p>
        </div>
        <div className="flex gap-2">
          {!isOnVacation && (
            <Button size="sm" variant="outline" loading={toggleVacation.isPending}
              onClick={() => { toggleVacation.mutate(true, { onSuccess: () => toast.success("Vacation mode activated! Your store is now hidden from buyers."), onError: () => toast.error("Failed to update vacation mode") }); }}
              leftIcon={<Palmtree className="h-3.5 w-3.5"/>}>
              Vacation Mode
            </Button>
          )}
          <Link href="/notifications" aria-label="Notifications" className="relative h-9 w-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:bg-accent/60 transition-colors">
            <Bell className="h-4 w-4"/>
            <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center" aria-hidden>2</span>
          </Link>
          <Link href="/products"><Button size="sm" leftIcon={<Package className="h-3.5 w-3.5"/>}>Add Product</Button></Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} change="+0% this month" up icon={TrendingUp} iconClass="bg-green-50 text-green-600 dark:bg-green-900/20" delay={0} href="/payouts" />
        <StatCard title="Active Listings" value={`${stats.activeListings}/${stats.totalProducts}`} change="0 pending approval" icon={Package} iconClass="bg-blue-50 text-blue-600 dark:bg-blue-900/20" delay={0.07} href="/products" />
        <StatCard title="Orders" value={String(stats.totalOrders)} change={`${stats.pendingOrders} pending`} icon={ShoppingBag} iconClass="bg-purple-50 text-purple-600 dark:bg-purple-900/20" delay={0.14} href="/orders" />
        <StatCard title="Pending Payouts" value={formatCurrency(stats.pendingPayouts)} change="Scheduled" up={false} icon={CreditCard} iconClass="bg-orange-50 text-orange-600 dark:bg-orange-900/20" delay={0.21} href="/payouts" />
      </div>

      {/* Low stock alert */}
      {stats.lowStockItems > 0 && (
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="flex items-center gap-3 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" aria-hidden/>
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            <span className="font-semibold">{stats.lowStockItems} products</span> are running low on stock.{" "}
            <Link href="/inventory" className="underline font-medium">Update inventory →</Link>
          </p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* Revenue chart */}
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.3}} className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div><h2 className="font-semibold text-foreground">Revenue</h2><p className="text-xs text-muted-foreground mt-0.5">Monthly revenue this year</p></div>
              <BarChart3 className="h-5 w-5 text-muted-foreground" aria-hidden/>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData?.chartData || []} margin={{top:0,right:0,left:-20,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false}/>
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{fontSize:11,fill:"hsl(var(--muted-foreground))"}}/>
                  <YAxis tickLine={false} axisLine={false} tick={{fontSize:11,fill:"hsl(var(--muted-foreground))"}} tickFormatter={v=>`${(v/100000).toFixed(0)}L`}/>
                  <Tooltip contentStyle={{background:"hsl(var(--card))",border:"1px solid hsl(var(--border))",borderRadius:"12px",fontSize:"12px"}} formatter={(v:number)=>[formatCurrency(v),"Revenue"]}/>
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6,6,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Recent orders */}
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.35}} className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <div><h2 className="font-semibold text-foreground">Recent Orders</h2><p className="text-xs text-muted-foreground mt-0.5">Orders from your store</p></div>
              <Link href="/orders"><Button variant="ghost" size="sm">View all</Button></Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full" aria-label="Recent orders">
                <thead>
                  <tr className="border-b border-border/50">
                    {["Order #","Buyer","Amount","Status","Action"].map(h=>(
                      <th key={h} scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {sellerOrders.map(o=>(
                    <tr key={o.id} className="hover:bg-accent/30 transition-colors">
                      <td className="px-5 py-4"><span className="font-mono text-xs font-medium text-foreground">{o.orderNumber}</span></td>
                      <td className="px-5 py-4"><div className="text-sm font-medium text-foreground">{o.buyerName}</div><div className="text-xs text-muted-foreground">{o.buyerBusiness}</div></td>
                      <td className="px-5 py-4 text-sm font-semibold text-foreground">{formatCurrency(o.finalAmount ?? o.total ?? 0)}</td>
                      <td className="px-5 py-4"><OrderStatusBadge status={o.status}/></td>
                      <td className="px-5 py-4"><Link href={`/orders/${o.id}`}><Button variant="ghost" size="sm" className="text-xs h-7">Manage</Button></Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.25}} className="glass-card rounded-2xl p-5">
            <h3 className="font-semibold text-sm text-foreground mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {[{icon:Package,label:"Add New Product",href:"/products/new",c:"text-primary bg-primary/10"},{icon:ShoppingBag,label:"Manage Orders",href:"/orders",c:"text-blue-600 bg-blue-50 dark:bg-blue-900/20"},{icon:CreditCard,label:"Request Payout",href:"/payouts",c:"text-green-600 bg-green-50 dark:bg-green-900/20"},{icon:Bell,label:"Notifications",href:"/notifications",c:"text-orange-600 bg-orange-50 dark:bg-orange-900/20"}].map(({icon:Icon,label,href,c})=>(
                <Link key={label} href={href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/60 transition-colors fr">
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${c}`}><Icon className="h-4 w-4" aria-hidden/></div>
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Rating card */}
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.3}} className="glass-card rounded-2xl p-5 text-center">
            <div className="flex justify-center gap-1 mb-2" aria-label={`${stats.avgRating} star rating`}>
              {Array.from({length:5}).map((_,i)=><Star key={i} className={`h-5 w-5 ${i<Math.floor(stats.avgRating)?"fill-yellow-400 text-yellow-400":"text-muted-foreground/30"}`} aria-hidden/>)}
            </div>
            <div className="font-semibold text-3xl text-foreground">{stats.avgRating.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground mt-1">Seller Rating</div>
            <div className="text-xs text-muted-foreground mt-0.5">Based on {stats.totalOrders} orders</div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
