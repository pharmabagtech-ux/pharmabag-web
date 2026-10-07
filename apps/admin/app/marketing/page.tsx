"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Search, Plus, Trash2, Layout, Star, ArrowUp, Image as ImageIcon } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Input, Badge, Pagination } from "@/components/ui";
import { formatCurrency } from "@pharmabag/utils";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { 
  useMarketingProducts, 
  useAddMarketingProduct, 
  useRemoveMarketingProduct,
  useAdminProductsFiltered 
} from "@/hooks/useAdmin";

export default function MarketingPage() {
  const [slot, setSlot] = useState<"HOMEPAGE_CAROUSEL" | "LOGIN_CAROUSEL">("HOMEPAGE_CAROUSEL");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  const { data: marketingProducts, isLoading: loadingMarketing } = useMarketingProducts(slot);
  const addMarketing = useAddMarketingProduct();
  const removeMarketing = useRemoveMarketingProduct();
  
  // For searching products to add
  const { data: productsData } = useAdminProductsFiltered({ 
    search: productSearch, 
    limit: 10
  });

  const featuredList = Array.isArray(marketingProducts) ? marketingProducts : (marketingProducts?.data ?? []);
  const searchResults = productsData?.data ?? [];

  const handleAddProduct = async (productId: string) => {
    try {
      await addMarketing.mutateAsync({ 
        productId, 
        slot, 
        priority: (featuredList.length > 0 ? Math.max(...featuredList.map((p: any) => p.priority ?? 0)) + 1 : 0)
      });
      toast.success("Product added to carousel");
      setProductSearch("");
      setShowAddModal(false);
    } catch {
      toast.error("Failed to add product");
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeMarketing.mutateAsync(id);
      toast.success("Product removed");
    } catch {
      toast.error("Failed to remove");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-semibold text-2xl text-foreground flex items-center gap-2">
              <Layout className="h-6 w-6 text-primary" />
              Marketing Management
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5"> Manage featured products for carousels</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/marketing/banners">
              <Button variant="secondary" leftIcon={<ImageIcon className="h-4 w-4" />}>
                Banners
              </Button>
            </Link>
            <Button onClick={() => setShowAddModal(true)} leftIcon={<Plus className="h-4 w-4" />}>
              Add Featured Product
            </Button>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-sb pb-1" role="group">
          {(["HOMEPAGE_CAROUSEL", "LOGIN_CAROUSEL"] as const).map(f => (
            <button key={f} onClick={() => setSlot(f)}
              className={cn("px-4 py-2 rounded-xl text-sm font-medium border transition-all whitespace-nowrap", 
                slot === f ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "border-border text-muted-foreground hover:bg-accent/60")}>
              {f.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Seller</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Priority</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {loadingMarketing ? (
                  <tr><td colSpan={4} className="py-12 text-center text-sm text-muted-foreground">Loading...</td></tr>
                ) : featuredList.length === 0 ? (
                  <tr><td colSpan={4} className="py-12 text-center text-sm text-muted-foreground">No featured products in this slot</td></tr>
                ) : featuredList.map((item: any, i: number) => (
                  <motion.tr key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="hover:bg-accent/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl">💊</div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{item.product?.name}</p>
                          <p className="text-xs text-muted-foreground">{item.product?.manufacturer}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {item.product?.seller?.companyName}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="info" className="flex items-center gap-1 w-fit">
                        <ArrowUp className="h-3 w-3" />
                        {item.priority}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleRemove(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} 
            className="relative w-full max-w-4xl bg-card glass-card rounded-2xl shadow-xl p-6 border border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                Add Product to {slot === "HOMEPAGE_CAROUSEL" ? "Homepage" : "Login"}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground transition-colors text-xl">&times;</button>
            </div>
            
            <div className="space-y-4">
              <div className="max-w-md">
                <Input 
                  placeholder="Search products by name or manufacturer..." 
                  value={productSearch} 
                  onChange={e => setProductSearch(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                  autoFocus
                />
              </div>

              <div className="glass-card rounded-xl overflow-hidden border border-border/50">
                <div className="max-h-[400px] overflow-y-auto no-sb">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/90 backdrop-blur-md z-10">
                      <tr className="border-b border-border/50 text-left">
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</th>
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Manufacturer</th>
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Verified</th>
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Posted</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {searchResults.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-muted-foreground">
                            {productSearch.length < 2 ? "Type at least 2 characters to search" : "No products found"}
                          </td>
                        </tr>
                      ) : searchResults.map((p: any) => {
                        const isApproved = (p.approvalStatus ?? "").toUpperCase() === "APPROVED";
                        const isPosted = !!p.isActive;
                        return (
                          <tr key={p.id} className="hover:bg-accent/30 transition-colors group">
                            <td className="px-4 py-3">
                              <div className="font-medium text-foreground">{p.name}</div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{p.manufacturer ?? "—"}</td>
                            <td className="px-4 py-3">
                              <Badge variant={isApproved ? "success" : "warning"} className="text-[10px] h-5">
                                {isApproved ? "Verified" : "Pending"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={isPosted ? "success" : "error"} className="text-[10px] h-5">
                                {isPosted ? "Posted" : "Hidden"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button 
                                size="xs" 
                                disabled={!isApproved || !isPosted}
                                onClick={() => handleAddProduct(p.id)} 
                                loading={addMarketing.isPending}
                              >
                                Add
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <p className="text-xs text-muted-foreground">Only verified and posted products can be featured in carousels.</p>
                <Button variant="ghost" onClick={() => setShowAddModal(false)}>Close</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AdminLayout>
  );
}
