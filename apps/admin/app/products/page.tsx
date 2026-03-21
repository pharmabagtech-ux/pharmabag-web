"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, CheckCircle, XCircle, Trash2, Eye } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Input, Badge } from "@/components/ui";
import { formatCurrency } from "@pharmabag/utils";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useAdminProducts, useUpdateProductStatus, useDeleteProduct } from "@/hooks/useAdmin";

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const { data: productsData, isLoading } = useAdminProducts();
  const productToggle = useUpdateProductStatus();
  const productDelete = useDeleteProduct();

  // Backend returns { data: [...], total: ... }
  const products: any[] = Array.isArray(productsData) ? productsData : (productsData?.data ?? []);

  const filtered = products.filter((p: any) =>
    (filter === "all" || (filter === "active" ? p.isActive : !p.isActive)) &&
    (!search || (p.name ?? "").toLowerCase().includes(search.toLowerCase()) || (p.manufacturer ?? "").toLowerCase().includes(search.toLowerCase()))
  );

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
          <p className="text-sm text-muted-foreground mt-0.5">{products.length} total products · {products.filter((p: any) => p.isActive).length} active</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
          </div>
          <div className="flex gap-1.5" role="group" aria-label="Filter by status">
            {(["all", "active", "inactive"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn("px-3 py-2 rounded-xl text-xs font-medium border transition-all capitalize", filter === f ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:bg-accent/60")}>{f}</button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="Products">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  {["Product", "Manufacturer", "Category", "MRP", "Stock", "Status", "Actions"].map(h => (
                    <th key={h} scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">No products found</td></tr>
                ) : filtered.map((p: any, i: number) => (
                  <motion.tr key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="hover:bg-accent/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0" aria-hidden>💊</div>
                        <div>
                          <div className="text-sm font-semibold text-foreground">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.chemicalComposition ?? "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{p.manufacturer ?? "—"}</td>
                    <td className="px-5 py-4"><Badge className="capitalize">{p.category?.name ?? "—"}</Badge></td>
                    <td className="px-5 py-4 text-sm font-semibold text-foreground">{formatCurrency(p.mrp ?? 0)}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{p.stock ?? 0}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
