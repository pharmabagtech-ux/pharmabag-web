"use client";
import { forwardRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderStatus, ApprovalStatus } from "@pharmabag/utils";

export const Button = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary"|"secondary"|"ghost"|"outline"|"danger"|"warning";
  size?: "xs"|"sm"|"md"|"lg"|"icon"; loading?: boolean; leftIcon?: React.ReactNode; rightIcon?: React.ReactNode;
}>(({ variant="primary", size="md", loading, leftIcon, rightIcon, children, className, disabled, ...p }, ref) => (
  <motion.button ref={ref} whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.01 }} transition={{ duration: 0.12 }} disabled={disabled||loading}
    className={cn("inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      size==="xs"&&"h-7 px-2.5 text-xs", size==="sm"&&"h-8 px-3 text-sm", size==="md"&&"h-10 px-4 text-sm", size==="lg"&&"h-12 px-6 text-base", size==="icon"&&"h-9 w-9",
      variant==="primary"&&"bg-primary text-white hover:bg-primary/90 shadow-sm",
      variant==="secondary"&&"bg-secondary text-secondary-foreground hover:bg-secondary/80",
      variant==="ghost"&&"hover:bg-accent text-foreground",
      variant==="outline"&&"border border-border bg-transparent hover:bg-accent text-foreground",
      variant==="danger"&&"bg-red-500 text-white hover:bg-red-600",
      variant==="warning"&&"bg-yellow-500 text-white hover:bg-yellow-600",
      className)} {...(p as any)}>
    {loading?<Loader2 className="h-4 w-4 animate-spin"/>:leftIcon}{children}{!loading&&rightIcon}
  </motion.button>
));
Button.displayName = "Button";

interface BadgeProps { variant?: "default"|"success"|"warning"|"error"|"info"|"purple"|"orange"; size?: "sm"|"md"; children: React.ReactNode; className?: string; }
export function Badge({ variant="default", size="sm", children, className }: BadgeProps) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full font-medium border",
    size==="sm"&&"px-2.5 py-0.5 text-xs", size==="md"&&"px-3 py-1 text-sm",
    variant==="default"&&"bg-muted text-muted-foreground border-border",
    variant==="success"&&"bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
    variant==="warning"&&"bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400",
    variant==="error"&&"bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400",
    variant==="info"&&"bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400",
    variant==="purple"&&"bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400",
    variant==="orange"&&"bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400",
    className)}>{children}</span>;
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const m: Partial<Record<OrderStatus,{l:string;v:BadgeProps["variant"]}>> = {
    pending:{l:"Pending",v:"warning"}, confirmed:{l:"Confirmed",v:"info"}, processing:{l:"Processing",v:"purple"},
    shipped:{l:"Shipped",v:"info"}, delivered:{l:"Delivered",v:"success"}, cancelled:{l:"Cancelled",v:"error"},
    PLACED:{l:"Placed",v:"warning"}, ACCEPTED:{l:"Accepted",v:"info"},
    SHIPPED:{l:"Shipped",v:"info"}, OUT_FOR_DELIVERY:{l:"Out for Delivery",v:"purple"},
    DELIVERED:{l:"Delivered",v:"success"},
    CANCELLED:{l:"Cancelled",v:"error"}, RETURNED:{l:"Returned",v:"error"},
  };
  const entry = m[status] ?? { l: status, v: "default" as const };
  return <Badge variant={entry.v}><span className="h-1.5 w-1.5 rounded-full bg-current"/>{entry.l}</Badge>;
}

export function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  const m: Partial<Record<ApprovalStatus,{l:string;v:BadgeProps["variant"]}>> = {
    pending:{l:"Pending Review",v:"warning"}, approved:{l:"Approved",v:"success"}, rejected:{l:"Rejected",v:"error"},
    PENDING:{l:"Pending Review",v:"warning"}, APPROVED:{l:"Approved",v:"success"}, REJECTED:{l:"Rejected",v:"error"},
  };
  const entry = m[status] ?? { l: status, v: "default" as const };
  return <Badge variant={entry.v}><span className="h-1.5 w-1.5 rounded-full bg-current"/>{entry.l}</Badge>;
}

export function Skeleton({ className }: { className?: string }) { return <div className={cn("rounded-lg bg-muted shimmer", className)} aria-hidden/>; }

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string; error?: string; leftIcon?: React.ReactNode; rightIcon?: React.ReactNode;
}>(({ label, error, leftIcon, rightIcon, className, id, ...p }, ref) => {
  const iid = id ?? label?.toLowerCase().replace(/\s+/g,"-");
  return (
    <div className="space-y-1.5">
      {label&&<label htmlFor={iid} className="block text-sm font-medium text-foreground">{label}</label>}
      <div className="relative">
        {leftIcon&&<div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{leftIcon}</div>}
        <input ref={ref} id={iid} className={cn("w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all disabled:opacity-50", leftIcon&&"pl-9", rightIcon&&"pr-9", error&&"border-red-400", className)} {...p}/>
        {rightIcon&&<div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{rightIcon}</div>}
      </div>
      {error&&<p className="text-xs text-red-500" role="alert">{error}</p>}
    </div>
  );
});
Input.displayName = "Input";

interface StatProps { title: string; value: string; change?: string; up?: boolean; icon: React.ElementType; iconClass?: string; delay?: number; alert?: boolean; }
export function StatCard({ title, value, change, up, icon: Icon, iconClass="bg-primary/10 text-primary", delay=0, alert }: StatProps) {
  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay, duration:0.4 }}>
      <div className={cn("glass-card rounded-2xl p-5 h-full", alert&&"border-red-200 dark:border-red-800")}>
        <div className="flex items-start justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", iconClass)}><Icon className="h-4.5 w-4.5" aria-hidden/></div>
        </div>
        <p className="font-semibold text-2xl text-foreground">{value}</p>
        {change&&<p className={cn("text-xs font-medium mt-1", up?"text-green-600":alert?"text-red-500":"text-muted-foreground")}>{change}</p>}
      </div>
    </motion.div>
  );
}

// ─── Pagination ──────────────────────────────────────
interface PaginationProps { page: number; totalPages: number; onPageChange: (page: number) => void; }
export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
  else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }
  return (
    <div className="flex items-center justify-center gap-1 py-4">
      <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition-colors" aria-label="Previous page">
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p, i) => p === "..." ? <span key={`e${i}`} className="px-1 text-muted-foreground">…</span> : (
        <button key={p} onClick={() => onPageChange(p)} className={cn("h-8 min-w-[2rem] rounded-lg text-xs font-medium transition-colors",
          p === page ? "bg-primary text-white" : "text-muted-foreground hover:bg-accent")}>{p}</button>
      ))}
      <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition-colors" aria-label="Next page">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────
interface ModalProps { open: boolean; onClose: () => void; title?: string; children: React.ReactNode; maxWidth?: string; }
export function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={cn("relative w-full bg-card/60 glass-card rounded-2xl shadow-xl overflow-hidden border border-border", maxWidth)}>
            {title && (
              <div className="flex items-center justify-between p-6 border-b border-border/50">
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors"><X className="h-4 w-4" /></button>
              </div>
            )}
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Tabs ────────────────────────────────────────────
interface TabsProps { tabs: { label: string; value: string; count?: number }[]; active: string; onChange: (v: string) => void; }
export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 border-b border-border/50 overflow-x-auto no-sb">
      {tabs.map(({ label, value, count }) => (
        <button key={value} onClick={() => onChange(value)}
          className={cn("relative px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap",
            active === value ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
          {label}{count !== undefined && <span className="ml-1.5 text-xs opacity-70">({count})</span>}
          {active === value && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
        </button>
      ))}
    </div>
  );
}

// ─── Select ──────────────────────────────────────────
export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }>(
  ({ label, error, className, id, children, ...p }, ref) => {
    const iid = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1.5">
        {label && <label htmlFor={iid} className="block text-sm font-medium text-foreground">{label}</label>}
        <select ref={ref} id={iid}
          className={cn("w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all disabled:opacity-50 appearance-none", error && "border-red-400", className)} {...p}>
          {children}
        </select>
        {error && <p className="text-xs text-red-500" role="alert">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";

// ─── Textarea ────────────────────────────────────────
export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }>(
  ({ label, error, className, id, ...p }, ref) => {
    const iid = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1.5">
        {label && <label htmlFor={iid} className="block text-sm font-medium text-foreground">{label}</label>}
        <textarea ref={ref} id={iid}
          className={cn("w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all disabled:opacity-50 resize-none", error && "border-red-400", className)} {...p} />
        {error && <p className="text-xs text-red-500" role="alert">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

// ─── EmptyState ──────────────────────────────────────
export function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mb-4"><Icon className="h-6 w-6 text-muted-foreground" /></div>
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-sm">{description}</p>}
    </div>
  );
}
