// ─── Orders Page ─────────────────────────────────────────────────────────────
"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { formatCurrency, formatDate } from "@pharmabag/utils";
import { OrderStatusBadge, Button, Badge, StatCard } from "@/components/ui";
import { Package, Warehouse, CreditCard, TrendingUp, AlertTriangle, CheckCircle, Clock, Eye } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from "recharts";
import { 
  useSellerOrders, 
  useUpdateSellerOrderStatus, 
  useSellerProducts, 
  useSellerSettlements, 
  useSellerSettlementSummary,
  useRequestPayout,
  useSellerCustomOrders,
  useSellerCancelledOrders,
  useSellerDashboard,
  useSellerAnalytics,
} from "@/hooks/useSeller";
import Link from "next/link";
import { cn } from "@/lib/utils";

const ORDER_TABS = [
  { key: "all", label: "All Orders" },
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "dispatched", label: "Dispatched" },
  { key: "warehouse", label: "At Warehouse" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
] as const;

type OrderTab = typeof ORDER_TABS[number]["key"];

function OrderTable({ orders, showConfirm = false, updateFn }: { orders: any[]; showConfirm?: boolean; updateFn?: any }) {
  if (orders.length === 0) {
    return <div className="p-8 text-center text-muted-foreground text-sm">No orders found</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full" aria-label="Seller orders">
        <thead><tr className="border-b border-border/50 bg-muted/20">{["Order #","Buyer","Items","Amount","Payment","Status","Action"].map(h=><th key={h} scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-border/30">
          {orders.map((o: any, i: number) => (
            <motion.tr key={o.orderId || o.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}} className="hover:bg-accent/30 transition-colors">
              {(() => {
                const order = o.order || o.data || o;
                const displayId = (order.orderId || order.id || order._id || "").toString().slice(0, 8).toUpperCase() || "—";
                const displayBuyerName = order.address?.name || order.buyerName || order.buyer?.name || "—";
                const displayBuyerContact = order.address?.phone || order.buyerPhone || order.buyer?.phone || "";
                
                return (
                  <>
                    <td className="px-5 py-4"><span className="font-mono text-xs text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">{displayId}</span></td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium text-foreground">{displayBuyerName}</div>
                      <div className="text-xs text-muted-foreground">{displayBuyerContact}</div>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">{order.items?.length ?? 0} items</td>
                    <td className="px-5 py-4 text-sm font-semibold text-foreground">{formatCurrency(order.sellerTotal ?? order.totalAmount ?? order.total ?? 0)}</td>
                    <td className="px-5 py-4"><Badge variant={String(order.paymentStatus || "PENDING").toUpperCase()==="PAID"||String(order.paymentStatus).toUpperCase()==="SUCCESS"?"success":String(order.paymentStatus).toUpperCase()==="PENDING"?"warning":"error"}>{order.paymentStatus||"PENDING"}</Badge></td>
                    <td className="px-5 py-4"><OrderStatusBadge status={order.orderStatus || order.status}/></td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2 items-center">
                        <Link href={`/orders/${order.orderId || order.id}`} title="View Order">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10 transition-colors">
                            <Eye className="h-4.5 w-4.5" />
                          </Button>
                        </Link>
                        {showConfirm && (order.orderStatus==="PLACED" || order.status==="PLACED") && updateFn && (
                          <Button size="sm" className="text-xs h-7 px-3" onClick={()=>updateFn.mutate({orderId:order.orderId || order.id,status:"ACCEPTED"})}>Confirm</Button>
                        )}
                        {showConfirm && (order.orderStatus==="ACCEPTED" || order.status==="ACCEPTED" || order.orderStatus==="PAYMENT_RECEIVED" || order.status==="PAYMENT_RECEIVED") && updateFn && (
                          <Button size="sm" variant="info" className="text-xs h-7 px-3" onClick={()=>updateFn.mutate({orderId:order.orderId || order.id,status:"DISPATCHED_FROM_SELLER"})}>Dispatch</Button>
                        )}
                      </div>
                    </td>
                  </>
                );
              })()}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function OrdersContent() {
  const [tab, setTab] = useState<OrderTab>("all");
  const { data: orders, isLoading } = useSellerOrders();
  const updateOrderStatus = useUpdateSellerOrderStatus();
  const allOrders: any[] = (Array.isArray(orders) ? orders : (orders as any)?.orders || (orders as any)?.data || []);

  const filtered = tab === "all" ? allOrders :
    allOrders.filter((o) => {
      const s = o.status?.toUpperCase();
      switch(tab) {
        case "pending": return s === "PLACED" || s === "PENDING";
        case "accepted": return s === "ACCEPTED" || s === "CONFIRMED" || s === "PROCESSING";
        case "dispatched": return s === "DISPATCHED_FROM_SELLER";
        case "warehouse": return s === "RECEIVED_AT_WAREHOUSE" || s === "WAREHOUSE";
        case "shipped": return s === "SHIPPED" || s === "TRANSIT";
        case "delivered": return s === "DELIVERED";
        case "cancelled": return s === "CANCELLED";
        default: return true;
      }
    });

  const pendingCount = allOrders.filter(o => { const s = o.status?.toUpperCase(); return s === "PLACED" || s === "PENDING"; }).length;

  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground">Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="font-semibold text-2xl text-foreground">Orders</h1><p className="text-sm text-muted-foreground mt-0.5">Manage orders from your store</p></div>
        {pendingCount > 0 && <Badge variant="warning">{pendingCount} pending</Badge>}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto no-sb pb-1">
        {ORDER_TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap",
              tab === t.key ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-accent"
            )}>
            {t.label}
            {t.key === "pending" && pendingCount > 0 && <span className="ml-1.5 bg-white/20 text-white px-1.5 py-0.5 rounded-full text-[10px]">{pendingCount}</span>}
          </button>
        ))}
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <OrderTable orders={filtered} showConfirm={tab === "all" || tab === "pending"} updateFn={updateOrderStatus} />
      </div>
    </div>
  );
}



export function InventoryContent() {
  const { data: products, isLoading } = useSellerProducts();
  const inventoryItems = products || [];

  if (isLoading) return <div className="p-6 text-center text-muted-foreground">Loading inventory...</div>;

  return (
    <div className="space-y-6">
      <div><h1 className="font-semibold text-2xl text-foreground">Inventory</h1><p className="text-sm text-muted-foreground mt-0.5">Track and manage your stock levels</p></div>
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" aria-label="Inventory">
            <thead><tr className="border-b border-border/50 bg-muted/20">{["Product","SKU","Current Stock","Min Order Qty","Status"].map(h=><th key={h} scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-border/30">
              {inventoryItems.map((item,i)=>(
                <motion.tr key={item.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.07}} className="hover:bg-accent/30 transition-colors">
                  <td className="px-5 py-4 text-sm font-medium text-foreground">{item.name}</td>
                  <td className="px-5 py-4"><span className="font-mono text-xs text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">{item.id.slice(0, 8)}</span></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${typeof item.stock === 'number' && item.stock === 0 ? "text-red-500" : typeof item.stock === 'number' && item.stock < 10 ? "text-yellow-600" : "text-green-600"}`}>{item.stock ?? 0}</span>
                      {item.stock === 0 && <AlertTriangle className="h-3.5 w-3.5 text-red-500" aria-label="Out of stock"/>}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{item.minimumOrderQuantity ?? 1}</td>
                  <td className="px-5 py-4">
                    <Badge variant={item.isActive ? "success" : "error"}>
                      {item.isActive ? "Active" : "Disabled"}
                    </Badge>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsContent() {
  const { data: dashboardData, isLoading: loadingDashboard } = useSellerDashboard();
  const { data: analyticsData, isLoading: loadingAnalytics } = useSellerAnalytics();

  const analytics = analyticsData ?? {};
  const chartData: { month: string; revenue: number; orders: number }[] = dashboardData?.chartData ?? analytics?.chartData ?? [];
  const stats = dashboardData?.stats ?? analytics?.stats ?? { totalRevenue: 0, totalOrders: 0, activeListings: 0, avgRating: 0 };
  const isLoading = loadingDashboard || loadingAnalytics;

  if (isLoading) return <div className="p-6 text-center text-muted-foreground">Loading analytics...</div>;

  return (
    <div className="space-y-6">
      <div><h1 className="font-semibold text-2xl text-foreground">Analytics</h1><p className="text-sm text-muted-foreground mt-0.5">Track your store performance</p></div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue ?? 0)} icon={TrendingUp} iconClass="bg-green-50 text-green-600 dark:bg-green-900/20" delay={0} />
        <StatCard title="Total Orders" value={String(stats.totalOrders ?? 0)} icon={Package} iconClass="bg-blue-50 text-blue-600 dark:bg-blue-900/20" delay={0.07} />
        <StatCard title="Active Products" value={String(stats.activeListings ?? 0)} icon={Warehouse} iconClass="bg-purple-50 text-purple-600 dark:bg-purple-900/20" delay={0.14} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-semibold text-foreground mb-4">Monthly Revenue</h2>
          <div className="h-56">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{top:0,right:0,left:-20,bottom:0}}>
                  <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false}/>
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{fontSize:11,fill:"hsl(var(--muted-foreground))"}}/>
                  <YAxis tickLine={false} axisLine={false} tick={{fontSize:11,fill:"hsl(var(--muted-foreground))"}} tickFormatter={v=>`₹${(v/1000).toFixed(0)}K`}/>
                  <Tooltip contentStyle={{background:"hsl(var(--card))",border:"1px solid hsl(var(--border))",borderRadius:"12px",fontSize:"12px"}} formatter={(v:number)=>[formatCurrency(v),"Revenue"]}/>
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#sg)" dot={{r:3,fill:"hsl(var(--primary))"}}/>
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm border border-dashed border-border rounded-xl">No revenue data available yet</div>
            )}
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-semibold text-foreground mb-4">Orders per Month</h2>
          <div className="h-56">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{top:0,right:0,left:-20,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false}/>
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{fontSize:11,fill:"hsl(var(--muted-foreground))"}}/>
                  <YAxis tickLine={false} axisLine={false} tick={{fontSize:11,fill:"hsl(var(--muted-foreground))"}}/>
                  <Tooltip contentStyle={{background:"hsl(var(--card))",border:"1px solid hsl(var(--border))",borderRadius:"12px",fontSize:"12px"}}/>
                  <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[6,6,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm border border-dashed border-border rounded-xl">No order data available yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PayoutsContent() {
  const { data: payouts, isLoading: loadingPayouts } = useSellerSettlements();
  const { data: summary, isLoading: loadingSummary } = useSellerSettlementSummary();
  const requestPayout = useRequestPayout();
  
  const payoutHistory: any[] = payouts || [];
  const stats = summary || { balance: 0, paid: 0, pending: 0 };

  if (loadingPayouts || loadingSummary) return <div className="p-6 text-center text-muted-foreground">Loading payouts...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="font-semibold text-2xl text-foreground">Payouts</h1><p className="text-sm text-muted-foreground mt-0.5">Track your earnings and payouts</p></div>
        <Button leftIcon={<CreditCard className="h-4 w-4"/>} disabled={requestPayout.isPending || (stats.balance || 0) <= 0} onClick={() => { requestPayout.mutate(undefined, { onSuccess: () => { import("react-hot-toast").then(({default: toast}) => toast.success("Payout request submitted! You will receive it within 3-5 business days.")); }, onError: (err: any) => { import("react-hot-toast").then(({default: toast}) => toast.error(err?.response?.data?.message || "Failed to request payout")); } }); }}>{requestPayout.isPending ? "Requesting..." : "Request Payout"}</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Available Balance" value={formatCurrency(stats.balance || 0)} change="Ready to withdraw" up icon={CreditCard} iconClass="bg-green-50 text-green-600 dark:bg-green-900/20" delay={0}/>
        <StatCard title="Total Paid Out" value={formatCurrency(stats.paid || 0)} change="Lifetime earnings" up icon={CheckCircle} iconClass="bg-blue-50 text-blue-600 dark:bg-blue-900/20" delay={0.07}/>
        <StatCard title="Pending" value={formatCurrency(stats.pending || 0)} change="Processing" icon={Clock} iconClass="bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20" delay={0.14}/>
      </div>
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border/50"><h2 className="font-semibold text-foreground">Payout History</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full" aria-label="Payout history">
            <thead><tr className="border-b border-border/50">{["Date","Amount","Reference","Status"].map(h=><th key={h} scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-border/30">
              {payoutHistory.map((p,i)=>(
                <motion.tr key={p.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.07}} className="hover:bg-accent/30 transition-colors">
                  <td className="px-5 py-4 text-sm text-muted-foreground">{formatDate(p.paidAt || p.createdAt)}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-foreground">{formatCurrency(p.amount)}</td>
                  <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{p.reference || p.utr || "-"}</td>
                  <td className="px-5 py-4"><Badge variant={p.status==="paid" || p.status==="PAID" ?"success":p.status==="processing"?"info":p.status==="pending" || p.status==="PENDING" ?"warning":"error"}>{p.status}</Badge></td>
                </motion.tr>
              ))}
              {payoutHistory.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground text-sm">No payout history found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
