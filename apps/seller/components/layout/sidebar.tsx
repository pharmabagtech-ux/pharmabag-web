"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Package, ClipboardList, BarChart3, Warehouse, CreditCard, LogOut, ChevronLeft, Store, Palmtree, LifeBuoy, Bell, User, FileText, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSellerAuth } from "@/store";
import { useSidebar } from "@/context/sidebar-context";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Package, label: "Products", href: "/products" },
  { icon: ClipboardList, label: "Orders", href: "/orders" },
  { icon: Warehouse, label: "Inventory", href: "/inventory" },
  { icon: Users, label: "Buyers", href: "/buyers" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: CreditCard, label: "Payouts", href: "/payouts" },
  { icon: Bell, label: "Notifications", href: "/notifications" },
  { icon: LifeBuoy, label: "Support", href: "/support" },
  { icon: User, label: "Profile", href: "/profile" },
];

export function SellerSidebar() {
  const pathname = usePathname();
  const { user, logout } = useSellerAuth();
  const router = useRouter();
  const { open, setOpen } = useSidebar();

  return (
    <aside className={cn("fixed top-0 left-0 h-full z-40 flex flex-col glass border-r border-white/30 dark:border-white/10 transition-all duration-300", open ? "w-64" : "w-20")} aria-label="Seller navigation">
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/20 flex-shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0"><Store className="h-4 w-4 text-white"/></div>
          <AnimatePresence>{open&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="min-w-0"><div className="font-semibold text-sm text-foreground truncate">Seller Portal</div><div className="text-xs text-muted-foreground truncate">{user?.storeName ?? "PharmaBag"}</div></motion.div>}</AnimatePresence>
        </Link>
        <button onClick={()=>setOpen(!open)} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent/60 transition-colors flex-shrink-0" aria-label={open?"Collapse":"Expand"}>
          <motion.div animate={{rotate:open?0:180}} transition={{duration:0.2}}><ChevronLeft className="h-4 w-4"/></motion.div>
        </button>
      </div>
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto no-sb">
        {NAV.map(({icon:Icon,label,href})=>{
          const active=pathname===href||(href!=="/dashboard"&&pathname.startsWith(href));
          return (
            <Link key={href} href={href} aria-current={active?"page":undefined}
              className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all fr relative overflow-hidden",
                active?"bg-primary/10 text-primary":"text-muted-foreground hover:text-foreground hover:bg-accent/60")}>
              {active&&<motion.div layoutId="seller-active" className="absolute inset-0 bg-primary/10 rounded-xl" transition={{duration:0.2}}/>}
              <Icon className={cn("h-4 w-4 flex-shrink-0 relative z-10",active&&"text-primary")} aria-hidden/>
              <AnimatePresence>{open&&<motion.span initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="whitespace-nowrap relative z-10">{label}</motion.span>}</AnimatePresence>
            </Link>
          );
        })}
      </nav>
      {user?.isOnVacation && (
        <div className="px-2 pb-1">
          <div className={cn("flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 transition-all", open ? "px-3 py-2" : "justify-center py-2")}>
            <Palmtree className="h-4 w-4 text-amber-600 flex-shrink-0" aria-hidden/>
            <AnimatePresence>{open && <motion.span initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-xs font-medium text-amber-700 dark:text-amber-400 truncate">Vacation Mode</motion.span>}</AnimatePresence>
          </div>
        </div>
      )}
      <div className="p-2 border-t border-white/20">
        {user&&open&&<div className="px-3 py-2 mb-1"><div className="text-sm font-medium text-foreground truncate">{user.name}</div><div className="text-xs text-muted-foreground truncate">{user.email}</div></div>}
        <button onClick={()=>{logout();router.push("/auth");}} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all fr">
          <LogOut className="h-4 w-4 flex-shrink-0" aria-hidden/>
          <AnimatePresence>{open&&<motion.span initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>Logout</motion.span>}</AnimatePresence>
        </button>
      </div>
    </aside>
  );
}
