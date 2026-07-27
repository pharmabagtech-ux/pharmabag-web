"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, CheckCircle, XCircle, Trash2, Eye } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Input, Badge, Pagination } from "@/components/ui";
import { formatCurrency, calculatePricing } from "@pharmabag/utils";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useAdminProductsFiltered, useUpdateProductStatus, useDeleteProduct } from "@/hooks/useAdmin";
import { SellersHoverCell, type SellerRow } from "@/components/products/SellersHoverCell";

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive" | "pending">("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const queryParams: any = { page, limit };
  if (debouncedSearch) queryParams.search = debouncedSearch;

  const { data: productsData, isLoading } = useAdminProductsFiltered(queryParams);
  const productToggle = useUpdateProductStatus();
  const productDelete = useDeleteProduct();

  // Backend returns { data: [...], total: ... }
  const products: any[] = Array.isArray(productsData) ? productsData : (productsData?.data ?? []);
  const totalProducts = productsData?.total ?? products.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / limit));

  const groupedProducts: any[] = [];
  const seenMaster = new Set();
  for (const p of products) {
    if (p.masterProduct) {
      if (seenMaster.has(p.masterProduct.id)) continue;
      seenMaster.add(p.masterProduct.id);
    }
    groupedProducts.push(p);
  }

  const filtered = groupedProducts.filter((p: any) => {
    // We can still keep the client-side search just in case
    const matchesSearch = !debouncedSearch || (p.name ?? "").toLowerCase().includes(debouncedSearch.toLowerCase()) || (p.manufacturer ?? "").toLowerCase().includes(debouncedSearch.toLowerCase());
    if (!matchesSearch) return false;

    if (filter === "all") return true;
    if (filter === "pending") return p.approvalStatus === "PENDING" || p.approvalStatus === "pending";
    if (filter === "active") return p.isActive;
    return !p.isActive;
  });



  const toggleStatus = async (id: string, name: string, isActive: boolean) => {
    try {
      await productToggle.mutateAsync({ productId: id, action: isActive ? "disable" : "enable" });
      toast.success(`"${name}" ${isActive ? "disabled" : "enabled"}`);
    } catch {
      toast.error(`Failed to update "${name}"`);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Permanently delete "${name}"?`)) return;
    try {
      await productDelete.mutateAsync(id);
      toast.success(`"${name}" deleted`);
    } catch {
      toast.error(`Failed to delete "${name}"`);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading products…</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-semibold text-2xl text-foreground">Product Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} unique products shown · {filtered.filter((p: any) => p.isActive).length} active</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
          </div>
          <div className="flex gap-1.5" role="group" aria-label="Filter by status">
            {(["all", "pending", "active", "inactive"] as const).map(f => (
              <button key={f} onClick={() => { setFilter(f); setPage(1); }}
                className={cn("px-3 py-2 rounded-xl text-xs font-medium border transition-all capitalize", filter === f ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:bg-accent/60")}>{f === "pending" ? "Pending Approval" : f}</button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="Products">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  {["Product", "Manufacturer", "Category", "MRP", "Pricing", "Stock", "Expiry", "Min Qty", "Max Qty", "Sellers", "Status", "Actions"].map(h => (
                    <th key={h} scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.length === 0 ? (
                  <tr><td colSpan={12} className="py-12 text-center text-sm text-muted-foreground">No products found</td></tr>
                ) : filtered.map((p: any, i: number) => {
                  // Build the seller list for this catalog product (loaded inline
                  // with the row, so the hover panel is instant). Falls back to the
                  // row's own seller for products without a master-catalog link.
                  const sellers: SellerRow[] = (p.masterProduct?.products ?? []).map((sp: any) => ({
                    id: sp.id,
                    companyName: sp.seller?.companyName ?? "—",
                    phone: sp.seller?.user?.phone ?? null,
                    city: sp.seller?.city ?? null,
                    state: sp.seller?.state ?? null,
                    mrp: sp.mrp,
                    stock: (sp.batches ?? []).reduce((s: number, b: any) => s + (b.stock ?? 0), 0),
                    isActive: sp.isActive,
                    approvalStatus: sp.approvalStatus,
                  }));
                  if (sellers.length === 0 && p.seller) {
                    sellers.push({
                      id: p.id,
                      companyName: p.seller.companyName ?? "—",
                      phone: null, city: null, state: null,
                      mrp: p.mrp,
                      stock: (p.batches ?? []).reduce((s: number, b: any) => s + (b.stock ?? 0), 0),
                      isActive: p.isActive,
                      approvalStatus: p.approvalStatus,
                    });
                  }
                  const sku = p.masterProduct?.sku ?? p.sku ?? null;
                  return (
                  <motion.tr key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="hover:bg-accent/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {p.images && p.images.length > 0 ? (
                          <div className="h-10 w-10 rounded-xl overflow-hidden border border-border flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl font-bold flex-shrink-0 text-primary" aria-hidden>{p.name?.[0]?.toUpperCase() ?? 'P'}</div>
                        )}
                          <SellersHoverCell sellers={sellers}>
                            <div className="max-w-[200px] min-w-[120px]">
                              <div className="text-sm font-semibold text-foreground truncate" title={p.name}>{p.name}</div>
                              {sku && <div className="text-[11px] font-mono text-muted-foreground/70 truncate" title={sku}>SKU: {sku}</div>}
                              <div className="text-xs text-muted-foreground truncate" title={p.chemicalComposition ?? ""}>{p.chemicalComposition ?? "—"}</div>
                            </div>
                          </SellersHoverCell>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{p.manufacturer ?? "—"}</td>
                    <td className="px-5 py-4"><Badge className="capitalize">{p.category?.name ?? "—"}</Badge></td>
                    <td className="px-5 py-4 text-sm font-semibold text-foreground">{formatCurrency(p.mrp ?? p.price ?? 0)}</td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">
                      {(() => {
                        const dd = p.discountDetails || p.discountFormDetails;
                        if (!dd || !p.gstPercent) return <span className="text-muted-foreground/50">—</span>;
                        try {
                          const pr = calculatePricing(p.mrp ?? 0, p.gstPercent, dd);
                          return (
                            <div className="space-y-0.5">
                              <div>PTR: <span className="font-medium">{formatCurrency(pr.ptr)}</span></div>
                              {pr.discountPercent > 0 && <div className="text-green-600">-{pr.discountPercent}%</div>}
                              <div>Sell: <span className="font-semibold text-foreground">{formatCurrency(pr.perPtrWithGst)}</span></div>
                              {pr.get > 0 && <div><Badge variant="info">B{pr.buy}G{pr.get}</Badge></div>}
                            </div>
                          );
                        } catch { return <span className="text-muted-foreground/50">—</span>; }
                      })()}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{p.batches?.reduce((s: number, b: any) => s + (b.stock ?? 0), 0) ?? p.stock ?? 0}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground whitespace-nowrap">
                      {(() => {
                        const nearest = p.batches?.filter((b: any) => b.expiryDate)?.sort((a: any, b: any) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())?.[0];
                        if (!nearest) return "—";
                        const d = new Date(nearest.expiryDate);
                        const isExpired = d < new Date();
                        return <span className={isExpired ? "text-red-500 font-medium" : ""}>{d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}{isExpired ? " ⚠" : ""}</span>;
                      })()}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{p.minimumOrderQuantity ?? 1}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{p.maximumOrderQuantity ?? "—"}</td>
                    <td className="px-5 py-4 text-sm font-medium text-foreground">
                      <SellersHoverCell sellers={sellers}>
                        <span className="underline decoration-dotted underline-offset-2">{Math.max(1, sellers.length)}</span>
                      </SellersHoverCell>
                    </td>

                    <td className="px-5 py-4">
                      <Badge variant={p.isActive ? "success" : "error"}>{p.isActive ? "Active" : "Disabled"}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => void toggleStatus(p.id, p.name, p.isActive)} aria-label={p.isActive ? "Disable" : "Enable"} title={p.isActive ? "Disable" : "Enable"}
                          className={cn("h-7 w-7 rounded-lg flex items-center justify-center transition-colors", p.isActive ? "text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" : "text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20")}>
                          {p.isActive ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={() => void handleDelete(p.id, p.name)} aria-label="Delete" title="Delete"
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
      </div>
    </AdminLayout>
  );
}
