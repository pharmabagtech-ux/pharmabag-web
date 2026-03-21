"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import { Button, Input, Badge, ApprovalBadge } from "@/components/ui";
import { PRODUCTS, formatCurrency } from "@pharmabag/utils";
import { SellerSidebar } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";
import { useSellerProducts, useDeleteSellerProduct } from "@/hooks/useSeller";
import Link from "next/link";

const EMOJI: Record<string,string> = {"eye-drops":"👁️",capsules:"🔴",tablets:"💊",syrups:"🧪",vitamins:"🌟",default:"💊"};

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all"|"approved"|"pending"|"rejected">("all");
  const { data: productsData, isLoading } = useSellerProducts();
  const deleteProduct = useDeleteSellerProduct();
  const products = useMemo(() => {
    const all = productsData ?? PRODUCTS;
    return all.filter((p) => p.sellerId === "s1" && (filter === "all" || p.approvalStatus === filter) && (!search || p.name.toLowerCase().includes(search.toLowerCase())));
  }, [productsData, filter, search]);

  return (
    <div className="min-h-screen bg-background">
      <SellerSidebar/>
      <main className="lg:pl-64 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div><h1 className="font-semibold text-2xl text-foreground">Products</h1><p className="text-sm text-muted-foreground mt-0.5">Manage your product listings</p></div>
            <Link href="/products/new">
              <Button leftIcon={<Plus className="h-4 w-4"/>}>Add Product</Button>
            </Link>
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

          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" aria-label="Products">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20">
                    {["Product","Category","Price","Stock","Status","Actions"].map(h=>(
                      <th key={h} scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {products.length===0 ? (
                    <tr><td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">No products found</td></tr>
                  ) : products.map((p,i)=>(
                    <motion.tr key={p.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}} className="hover:bg-accent/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0" aria-hidden>{EMOJI[p.category ?? "default"]??EMOJI.default}</div>
                          <div><div className="text-sm font-semibold text-foreground">{p.name}</div><div className="text-xs text-muted-foreground font-mono">{p.genericName}</div></div>
                        </div>
                      </td>
                      <td className="px-5 py-4"><Badge className="capitalize">{p.category}</Badge></td>
                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-foreground">{formatCurrency(p.price)}</div>
                        {p.mrp != null && <div className="text-xs text-muted-foreground line-through">{formatCurrency(p.mrp)}</div>}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-sm font-medium ${(p.stock ?? 0)>100?"text-green-600":(p.stock ?? 0)>0?"text-yellow-600":"text-red-500"}`}>
                          {p.stock} units
                        </span>
                      </td>
                      <td className="px-5 py-4"><ApprovalBadge status={p.approvalStatus ?? "PENDING"}/></td>
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
        </div>
      </main>
    </div>
  );
}
