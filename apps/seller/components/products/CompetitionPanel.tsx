"use client";

import { Loader2, Store, TrendingDown } from "lucide-react";
import { formatCurrency, formatSchemeTag } from "@pharmabag/utils";
import { cn } from "@/lib/utils";
import { useMasterProductWithListings } from "@/hooks/useSeller";

/**
 * Shows what other sellers already offer for the same product, so a seller can
 * price against the market while adding or editing their listing.
 *
 * Reads the same public product endpoint the buyer storefront uses, so the
 * figures are exactly what a buyer sees. `price` is the net (PTR less any
 * scheme, GST-exclusive); `mrp` is the printed price.
 */
export function CompetitionPanel({
  masterProductId,
  currentProductId,
}: {
  masterProductId?: string | null;
  /** The listing being edited, so the seller's own row is marked rather than read as a rival. */
  currentProductId?: string;
}) {
  const { data, isLoading, isError } = useMasterProductWithListings(masterProductId);

  if (!masterProductId) return null;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/60 bg-muted/30 p-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking what other sellers offer...
      </div>
    );
  }

  // Never block the form over this — it is advisory information.
  if (isError) return null;

  const listings: any[] = data?.listings ?? [];
  const others = listings.filter((l) => l.id !== currentProductId);

  if (others.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
        <p className="text-sm font-semibold text-emerald-800">
          No other seller is offering this product yet
        </p>
        <p className="text-xs text-emerald-700/80 mt-0.5">
          You would be the first listing buyers see.
        </p>
      </div>
    );
  }

  const prices = others.map((l) => Number(l.price) || 0).filter((p) => p > 0);
  const lowest = prices.length ? Math.min(...prices) : null;

  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background/60">
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            {others.length} other seller{others.length > 1 ? "s" : ""} offer this
          </h3>
        </div>
        {lowest !== null && (
          <span className="text-xs font-semibold text-muted-foreground">
            lowest net <span className="text-foreground">{formatCurrency(lowest)}</span>
          </span>
        )}
      </div>

      <div className="divide-y divide-border/40">
        {others.map((l, index) => {
          const scheme = formatSchemeTag(l.discountType, l.discountMeta);
          const mrp = Number(l.mrp) || 0;
          const net = Number(l.price) || 0;
          const isLowest = lowest !== null && net === lowest;

          return (
            <div key={l.id} className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-2 items-center">
              <div className="col-span-2 sm:col-span-1 min-w-0">
                {/* Competitors are shown as Seller 1, Seller 2 and so on. The
                    prices are the point of this panel; who is charging them is
                    not a seller's business, and the trading name and city
                    together identify a rival outright. */}
                <p className="text-sm font-semibold text-foreground truncate">
                  Seller {index + 1}
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Net</p>
                <p className={cn("text-sm font-bold", isLowest ? "text-emerald-600" : "text-foreground")}>
                  {formatCurrency(net)}
                  {isLowest && others.length > 1 && (
                    <TrendingDown className="inline h-3 w-3 ml-1 text-emerald-600" />
                  )}
                </p>
                {mrp > net && (
                  <p className="text-[11px] text-muted-foreground line-through">{formatCurrency(mrp)}</p>
                )}
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Stock / MOQ</p>
                <p className="text-sm font-medium text-foreground">
                  {l.stock ?? 0}
                  <span className="text-muted-foreground"> / {l.moq ?? 1}</span>
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Offer</p>
                {scheme ? (
                  <p className="text-xs font-semibold text-teal-700 leading-tight">{scheme}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">—</p>
                )}
                {l.expiryDate && (
                  <p className="text-[11px] text-muted-foreground">
                    exp {new Date(l.expiryDate).toLocaleDateString("en-GB", { month: "2-digit", year: "2-digit" })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
