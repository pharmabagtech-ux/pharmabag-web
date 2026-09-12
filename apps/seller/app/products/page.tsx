"use client";
import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Edit, Trash2, Eye, Upload, RefreshCw } from "lucide-react";
import { Button, Input, Badge, ApprovalBadge, Skeleton, Pagination } from "@/components/ui";
import { formatCurrency, calculatePricing, VALID_GST_PERCENTAGES } from "@pharmabag/utils";
import { cn } from "@/lib/utils";
import { useSellerProducts, useDeleteSellerProduct } from "@/hooks/useSeller";
import Link from "next/link";
import { FileText } from "lucide-react";

const EMOJI: Record<string,string> = {"eye-drops":"👁️",capsules:"🔴",tablets:"💊",syrups:"🧪",vitamins:"🌟",default:"💊"};
const PAGE_SIZE = 20;

/** The stored discount enum, in the shape the pricing helper expects. */
const BACKEND_TO_FORM_TYPE: Record<string, string> = {
  PTR_DISCOUNT: "ptr_discount",
  SAME_PRODUCT_BONUS: "same_product_bonus",
  PTR_PLUS_SAME_PRODUCT_BONUS: "ptr_discount_and_same_product_bonus",
  DIFFERENT_PRODUCT_BONUS: "different_product_bonus",
  PTR_PLUS_DIFFERENT_PRODUCT_BONUS: "ptr_discount_and_different_product_bonus",
  SPECIAL_PRICE: "special_price",
};

/**
 * What the seller actually sells at, per unit.
 *
 * This column read `p.sellingPrice`, which the API has never sent — the row is
 * a `Product`, and that table has no price column at all, only `mrp`,
 * `gstPercent`, `discountType` and `discountMeta`. The line therefore never
 * rendered, and a seller reviewing their catalogue under a heading marked
 * "Price" was reading the printed MRP rather than their own rate.
 *
 * Derived with the same helper the product form previews with, so the list and
 * the edit screen cannot disagree. Returns null when the inputs cannot support
 * a calculation, rather than inventing a number.
 */
function netRateFor(p: any): number | null {
  const mrp = Number(p?.mrp);
  const gst = Number(p?.gstPercent ?? p?.gst);
  if (!mrp || mrp <= 0) return null;
  if (!VALID_GST_PERCENTAGES.includes(gst as never)) return null;

  const meta = p?.discountMeta ?? {};
  try {
    return calculatePricing(mrp, gst as never, {
      type: (BACKEND_TO_FORM_TYPE[p?.discountType ?? ""] ?? "ptr_discount") as never,
      discountPercent: meta?.discountPercent,
      buy: meta?.buy,
      get: meta?.get,
      bonusProductName: meta?.bonusProductName,
      specialPrice: meta?.specialPrice,
    }).finalPtr;
  } catch {
    return null;
  }
}

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<"all"|"approved"|"pending"|"rejected">("all");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [filter, debouncedSearch]);

  const { data: productsData, isLoading } = useSellerProducts({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch,
    status: filter === "all" ? undefined : filter
  });

  const deleteProduct = useDeleteSellerProduct();
  
  const products = (productsData as any)?.data ?? [];
  const total = (productsData as any)?.meta?.total ?? 0;
  const totalPages = (productsData as any)?.meta?.totalPages ?? 1;

  return (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div><h1 className="font-semibold text-2xl text-foreground">Products</h1><p className="text-sm text-muted-foreground mt-0.5">Manage your product listings</p></div>
            <div className="flex items-center gap-3">
              <Link href="/products/sync">
                <Button variant="secondary" leftIcon={<RefreshCw className="h-4 w-4"/>}>Sync from ERP</Button>
              </Link>
              <Link href="/products/bulk-upload">
                <Button variant="secondary" leftIcon={<Upload className="h-4 w-4"/>}>Bulk Upload</Button>
              </Link>
              <Link href="/products/requests">
                <Button variant="secondary" leftIcon={<FileText className="h-4 w-4"/>}>Request Product</Button>
              </Link>
              <Link href="/products/new">
                <Button leftIcon={<Plus className="h-4 w-4"/>}>Add Product</Button>
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1"><Input placeholder="Search products…" value={search} onChange={e=>setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4"/>}/></div>
            <div className="flex gap-1.5" role="group">
              {(["all","approved","pending","rejected"] as const).map(f=>(
                <button key={f} onClick={()=>setFilter(f)}
                  className={cn("px-3 py-2 rounded-xl text-xs font-medium border transition-all capitalize", filter===f?"bg-primary text-white border-primary":"border-border text-muted-foreground hover:bg-accent/60")}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="glass-card rounded-2xl p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : (
          <>
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full" aria-label="Products">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/20">
                      {["Product","Category","Your rate / MRP","Stock","GST","SKU","Actions"].map(h=>(
                        <th key={h} scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {products.length===0 ? (
                      <tr><td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">No products found</td></tr>
                    ) : products.map((p: any, i: number)=>(
                      <motion.tr key={p.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}} className="hover:bg-accent/30 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {p.images && p.images.length > 0 ? (
                              <div className="h-10 w-10 rounded-xl overflow-hidden border border-border flex-shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0" aria-hidden>{EMOJI[p.category ?? "default"]??EMOJI.default}</div>
                            )}
                            <div><div className="text-sm font-semibold text-foreground">{p.name}</div><div className="text-xs text-muted-foreground font-mono">{p.genericName}</div></div>
                          </div>
                        </td>
                        <td className="px-5 py-4"><Badge className="capitalize">{p.category}</Badge></td>
                        <td className="px-5 py-4">
                          {(() => {
                            const net = netRateFor(p);
                            return (
                              <>
                                <div className="text-sm font-semibold text-foreground">
                                  {net != null ? formatCurrency(net) : formatCurrency(p.mrp ?? 0)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {net != null ? `MRP ${formatCurrency(p.mrp ?? 0)}` : "MRP — rate unavailable"}
                                </div>
                              </>
                            );
                          })()}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-sm font-medium ${(p.stock ?? 0)>100?"text-green-600":(p.stock ?? 0)>0?"text-yellow-600":"text-red-500"}`}>
                            {p.stock} units
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-muted-foreground">{p.gstPercent ?? p.gst ?? 0}%</td>
                        <td className="px-5 py-4 font-mono text-sm text-muted-foreground">{p.sku || "—"}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <Link href={`/products/${p.id}`} aria-label={`View ${p.name}`} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"><Eye className="h-3.5 w-3.5"/></Link>
                            <Link href={`/products/${p.id}/edit`} aria-label={`Edit ${p.name}`} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"><Edit className="h-3.5 w-3.5"/></Link>
                            <button onClick={() => deleteProduct.mutate(p.id)} aria-label={`Delete ${p.name}`} className="h-7 w-7 rounded-lg flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="h-3.5 w-3.5"/></button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="flex justify-between items-center bg-muted/10 px-6 py-4 rounded-2xl border border-border/50">
              <p className="text-xs text-muted-foreground">Showing {products.length} of {total} products</p>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
          )}
        </div>
  );
}
