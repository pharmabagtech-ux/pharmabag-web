"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatCurrency } from "@pharmabag/utils";
import { cn } from "@/lib/utils";

export type SellerRow = {
  id: string;
  companyName: string;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  mrp?: number | null;
  stock?: number;
  isActive?: boolean;
  approvalStatus?: string | null;
};

/**
 * Wraps any trigger element; on hover it shows a floating panel listing every
 * seller that sells the product (name, phone, price, stock, status). Rendered
 * in a portal with fixed positioning so it is never clipped by the table's
 * horizontal scroll container. Data is passed in (already loaded with the list),
 * so the panel appears instantly with no extra request.
 */
export function SellersHoverCell({
  sellers,
  children,
}: {
  sellers: SellerRow[];
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - 448));
    const top = Math.max(8, Math.min(r.bottom + 6, window.innerHeight - 340));
    setPos({ top, left });
  };

  return (
    <span
      ref={ref}
      className="cursor-help"
      onMouseEnter={show}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {pos &&
        sellers.length > 0 &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999 }}
            className="w-[430px] max-h-[320px] overflow-auto rounded-xl border border-border bg-background shadow-2xl p-3 text-left"
          >
            <div className="text-xs font-semibold text-muted-foreground mb-2">
              {sellers.length} seller{sellers.length > 1 ? "s" : ""} selling this product
            </div>
            <div className="space-y-2">
              {sellers.map((s) => (
                <div key={s.id} className="rounded-lg border border-border/60 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground truncate" title={s.companyName}>
                      {s.companyName || "—"}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap",
                        s.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
                      )}
                    >
                      {s.isActive ? "Active" : "Disabled"}
                    </span>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span>Phone: <span className="text-foreground font-medium">{s.phone || "—"}</span></span>
                    <span>MRP: <span className="text-foreground font-medium">{formatCurrency(s.mrp ?? 0)}</span></span>
                    <span>Stock: <span className="text-foreground font-medium">{s.stock ?? 0}</span></span>
                    <span className="capitalize">
                      {(s.approvalStatus || "").toLowerCase() || "—"}
                    </span>
                  </div>
                  {(s.city || s.state) && (
                    <div className="mt-0.5 text-[11px] text-muted-foreground/80">
                      {[s.city, s.state].filter(Boolean).join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </span>
  );
}
