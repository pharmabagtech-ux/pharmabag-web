"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";

export type OrderItemSeller = {
  id: string;
  companyName?: string | null;
  city?: string | null;
  state?: string | null;
  user?: { phone?: string | null } | null;
  phone?: string | null;
};

/**
 * Wraps an order line item; on hover it shows the seller behind that item —
 * company name, contact number and seller id — so an admin can identify and
 * reach the seller without leaving the order.
 *
 * Rendered in a portal with fixed positioning so it is never clipped by the
 * surrounding card, and the data is already loaded with the order, so the panel
 * appears instantly with no extra request. Mirrors SellersHoverCell on the
 * products page.
 */
export function SellerHoverCard({
  seller,
  children,
}: {
  seller?: OrderItemSeller | null;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - 340));
    const top = Math.max(8, Math.min(r.bottom + 6, window.innerHeight - 210));
    setPos({ top, left });
  };

  const phone = seller?.user?.phone ?? seller?.phone ?? null;
  const location = [seller?.city, seller?.state].filter(Boolean).join(", ");

  return (
    <div
      ref={ref}
      className={seller ? "cursor-help" : undefined}
      onMouseEnter={show}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {pos &&
        seller &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999 }}
            className="w-[320px] rounded-xl border border-border bg-background shadow-2xl p-3 text-left"
          >
            <div className="text-xs font-semibold text-muted-foreground mb-2">
              Seller
            </div>
            <div className="text-sm font-semibold text-foreground break-words">
              {seller.companyName || "—"}
            </div>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              <div>
                Phone:{" "}
                <span className="text-foreground font-medium font-mono">
                  {phone || "—"}
                </span>
              </div>
              <div className="break-all">
                Seller ID:{" "}
                <span className="text-foreground font-medium font-mono">
                  {seller.id}
                </span>
              </div>
              {location && <div>{location}</div>}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
