"use client";
import Link from "next/link";
import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderStatus, ApprovalStatus, ProductStatus } from "@pharmabag/utils";

/* Button */
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary"|"secondary"|"ghost"|"outline"|"danger"; size?: "xs"|"sm"|"md"|"lg"|"icon"; loading?: boolean; leftIcon?: React.ReactNode; rightIcon?: React.ReactNode;
}
export const Button = forwardRef<HTMLButtonElement, BtnProps>(({ variant="primary", size="md", loading, leftIcon, rightIcon, children, className, disabled, ...p }, ref) => (
  <motion.button ref={ref} whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.01 }} transition={{ duration: 0.12 }} disabled={disabled||loading}
    className={cn("inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      size==="xs"&&"h-7 px-2.5 text-xs", size==="sm"&&"h-8 px-3 text-sm", size==="md"&&"h-10 px-4 text-sm", size==="lg"&&"h-12 px-6 text-base", size==="icon"&&"h-10 w-10",
      variant==="primary"&&"bg-primary text-white hover:bg-primary/90 shadow-sm", variant==="secondary"&&"bg-secondary text-secondary-foreground hover:bg-secondary/80",
      variant==="ghost"&&"hover:bg-accent text-foreground", variant==="outline"&&"border border-border bg-transparent hover:bg-accent text-foreground",
      variant==="danger"&&"bg-red-500 text-white hover:bg-red-600", className)} {...(p as any)}>
    {loading?<Loader2 className="h-4 w-4 animate-spin"/>:leftIcon}{children}{!loading&&rightIcon}
  </motion.button>
));
Button.displayName = "Button";

/* Badge */
interface BadgeProps { variant?: "default"|"success"|"warning"|"error"|"info"|"purple"; size?: "sm"|"md"; children: React.ReactNode; className?: string; }
export function Badge({ variant="default", size="sm", children, className }: BadgeProps) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full font-medium border", size==="sm"&&"px-2.5 py-0.5 text-xs", size==="md"&&"px-3 py-1 text-sm",
    variant==="default"&&"bg-muted text-muted-foreground border-border",
    variant==="success"&&"bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
    variant==="warning"&&"bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400",
    variant==="error"&&"bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400",
    variant==="info"&&"bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400",
    variant==="purple"&&"bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400",
    className)}>{children}</span>;
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const m: Partial<Record<OrderStatus,{label:string;variant:BadgeProps["variant"]}>> = {
    pending:{label:"Pending",variant:"warning"}, confirmed:{label:"Confirmed",variant:"info"},
    processing:{label:"Processing",variant:"purple"}, shipped:{label:"Shipped",variant:"info"},
    delivered:{label:"Delivered",variant:"success"}, cancelled:{label:"Cancelled",variant:"error"},
    PLACED:{label:"Placed",variant:"warning"}, ACCEPTED:{label:"Accepted",variant:"info"},
    SHIPPED:{label:"Shipped",variant:"info"}, OUT_FOR_DELIVERY:{label:"Out for Delivery",variant:"purple"},
    DELIVERED:{label:"Delivered",variant:"success"},
    CANCELLED:{label:"Cancelled",variant:"error"}, RETURNED:{label:"Returned",variant:"error"},
  };
  const { label, variant } = m[status] ?? { label: status, variant: "default" as const };
  return <Badge variant={variant}><span className="h-1.5 w-1.5 rounded-full bg-current"/>{label}</Badge>;
}

export function ApprovalBadge({ status }: { status: ApprovalStatus | ProductStatus }) {
  const m: Partial<Record<string,{label:string;variant:BadgeProps["variant"]}>> = {
    pending:{label:"Pending Review",variant:"warning"}, approved:{label:"Approved",variant:"success"}, rejected:{label:"Rejected",variant:"error"},
    PENDING:{label:"Pending Review",variant:"warning"}, APPROVED:{label:"Approved",variant:"success"}, REJECTED:{label:"Rejected",variant:"error"},
    DRAFT:{label:"Draft",variant:"default"},
  };
  const { label, variant } = m[status] ?? { label: status, variant: "default" as const };
  return <Badge variant={variant}><span className="h-1.5 w-1.5 rounded-full bg-current"/>{label}</Badge>;
}

/* Skeleton */
export function Skeleton({ className }: { className?: string }) { return <div className={cn("rounded-lg bg-muted shimmer", className)} aria-hidden/>; }
export function StatSkeleton() {
  return <div className="glass-card rounded-2xl p-5 space-y-3"><div className="flex justify-between"><Skeleton className="h-4 w-24"/><Skeleton className="h-9 w-9 rounded-xl"/></div><Skeleton className="h-8 w-32"/><Skeleton className="h-3 w-20"/></div>;
}

/* Input */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; leftIcon?: React.ReactNode; rightIcon?: React.ReactNode; }
export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, leftIcon, rightIcon, className, id, ...p }, ref) => {
  const iid = id ?? label?.toLowerCase().replace(/\s+/g,"-");
  return (
    <div className="space-y-1.5">
      {label&&<label htmlFor={iid} className="block text-sm font-medium text-foreground">{label}</label>}
      <div className="relative">
        {leftIcon&&<div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{leftIcon}</div>}
        <input ref={ref} id={iid} className={cn("w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 disabled:opacity-50 transition-all", leftIcon&&"pl-9", rightIcon&&"pr-9", error&&"border-red-400", className)} aria-invalid={!!error} {...p}/>
        {rightIcon&&<div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{rightIcon}</div>}
      </div>
      {error&&<p className="text-xs text-red-500" role="alert">{error}</p>}
    </div>
  );
});
Input.displayName = "Input";

/* Textarea */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; error?: string; }
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, error, className, id, ...p }, ref) => {
  const iid = id ?? label?.toLowerCase().replace(/\s+/g,"-");
  return (
    <div className="space-y-1.5">
      {label&&<label htmlFor={iid} className="block text-sm font-medium text-foreground">{label}</label>}
      <textarea ref={ref} id={iid} className={cn("w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 disabled:opacity-50 transition-all min-h-[80px]", error&&"border-red-400", className)} aria-invalid={!!error} {...p}/>
      {error&&<p className="text-xs text-red-500" role="alert">{error}</p>}
    </div>
  );
});
Textarea.displayName = "Textarea";

/* Select */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { label?: string; error?: string; options: {label:string; value:string}[]; }
export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, options, className, id, ...p }, ref) => {
  const iid = id ?? label?.toLowerCase().replace(/\s+/g,"-");
  return (
    <div className="space-y-1.5">
      {label&&<label htmlFor={iid} className="block text-sm font-medium text-foreground">{label}</label>}
      <select ref={ref} id={iid} className={cn("w-full appearance-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 disabled:opacity-50 transition-all", error&&"border-red-400", className)} aria-invalid={!!error} {...p}>
        <option value="" disabled hidden>Select an option</option>
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error&&<p className="text-xs text-red-500" role="alert">{error}</p>}
    </div>
  );
});
Select.displayName = "Select";

/* Stat Card */
interface StatProps { title: string; value: string; change?: string; up?: boolean; icon: React.ElementType; iconClass?: string; delay?: number; href?: string; }
export function StatCard({ title, value, change, up, icon: Icon, iconClass="bg-primary/10 text-primary", delay=0, href }: StatProps) {
  const cardContent = (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay, duration:0.4 }}>
      <div className="glass-card rounded-2xl p-5 h-full transition hover:shadow-xl hover:-translate-y-0.5">
        <div className="flex items-start justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", iconClass)}><Icon className="h-4.5 w-4.5" aria-hidden/></div>
        </div>
        <p className="font-semibold text-2xl text-foreground">{value}</p>
        {change&&<p className={cn("text-xs font-medium mt-1", up?"text-green-600":"text-muted-foreground")}>{up?"↑ ":""}{change}</p>}
      </div>
    </motion.div>
  );

  return href ? <Link href={href} className="block">{cardContent}</Link> : cardContent;
}
