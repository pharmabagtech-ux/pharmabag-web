"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Package, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Badge, Input, Textarea, Select, Skeleton, Modal } from "@/components/ui";
import { formatCurrency, productSlug } from "@pharmabag/utils";
import { ProductGeographyCard } from "@/components/analytics/product-geography-card";
import { cn } from "@/lib/utils";
import { useProductById, useUpdateProduct, useDeleteProduct, useCategories } from "@/hooks/useAdmin";
import toast from "react-hot-toast";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: product, isLoading } = useProductById(id);
  const { data: categoriesData } = useCategories();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const [editing, setEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  const categories: any[] = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.data ?? []);

  const startEdit = () => {
    setForm({
      name: product?.name ?? "",
      manufacturer: product?.manufacturer ?? "",
      chemicalComposition: product?.chemicalComposition ?? "",
      mrp: product?.mrp ?? "",
      ptr: product?.ptr ?? "",
      minimumOrderQuantity: product?.minimumOrderQuantity ?? 1,
      maximumOrderQuantity: product?.maximumOrderQuantity ?? "",
      categoryId: product?.category?.id ?? product?.categoryId ?? "",
      description: product?.description ?? "",
      hsnCode: product?.hsnCode ?? "",
      gstPercent: product?.gstPercent ?? "",
    });
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateProduct.mutateAsync({ productId: id, payload: form });
      toast.success("Product updated");
      setEditing(false);
    } catch {
      toast.error("Failed to update product");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProduct.mutateAsync(id);
      toast.success("Product deleted");
      router.push("/products");
    } catch {
      toast.error("Failed to delete product");
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64 lg:col-span-2" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!product) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold">Product not found</p>
            <Button variant="ghost" onClick={() => router.push("/products")} className="mt-4">Back to Products</Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const batches: any[] = product.batches ?? [];
  const totalStock = batches.reduce((s: number, b: any) => s + (b.stock ?? 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/products")} className="h-9 w-9 rounded-xl bg-accent/60 flex items-center justify-center hover:bg-accent transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="font-semibold text-2xl text-foreground">{product.name}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{product.manufacturer ?? "Unknown manufacturer"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                <Button onClick={handleSave} loading={updateProduct.isPending} leftIcon={<Save className="h-4 w-4" />}>Save</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={startEdit}>Edit Product</Button>
                <Button variant="danger" size="icon" onClick={() => setShowDeleteModal(true)}><Trash2 className="h-4 w-4" /></Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Details */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6 lg:col-span-2 space-y-6">
            <h2 className="font-semibold text-foreground">Product Information</h2>

            {editing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Product Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                <Input label="Manufacturer" value={form.manufacturer} onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))} />
                <Input label="Chemical Composition" value={form.chemicalComposition} onChange={e => setForm(f => ({ ...f, chemicalComposition: e.target.value }))} />
                <Input label="MRP (₹)" type="number" value={form.mrp} onChange={e => setForm(f => ({ ...f, mrp: e.target.value }))} />
                <Input label="PTR (₹)" type="number" value={form.ptr} onChange={e => setForm(f => ({ ...f, ptr: e.target.value }))} />
                <Input label="HSN Code" value={form.hsnCode} onChange={e => setForm(f => ({ ...f, hsnCode: e.target.value }))} />
                <Input label="GST (%)" type="number" value={form.gstPercent} onChange={e => setForm(f => ({ ...f, gstPercent: e.target.value }))} />
                <Select label="Category" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                  <option value="">Select category</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
                <Input label="Min Order Qty" type="number" value={form.minimumOrderQuantity} onChange={e => setForm(f => ({ ...f, minimumOrderQuantity: e.target.value }))} />
                <Input label="Max Order Qty" type="number" value={form.maximumOrderQuantity} onChange={e => setForm(f => ({ ...f, maximumOrderQuantity: e.target.value }))} />
                <div className="sm:col-span-2">
                  <Textarea label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                <InfoRow label="Name" value={product.name} />
                <InfoRow label="Manufacturer" value={product.manufacturer} />
                <InfoRow label="Chemical Composition" value={product.chemicalComposition} />
                <InfoRow label="MRP" value={formatCurrency(product.mrp ?? 0)} />
                <InfoRow label="PTR" value={product.ptr ? formatCurrency(product.ptr) : "—"} />
                <InfoRow label="Category" value={product.category?.name ?? "—"} />
                <InfoRow label="HSN Code" value={product.hsnCode ?? "—"} />
                <InfoRow label="GST" value={product.gstPercent ? `${product.gstPercent}%` : "—"} />
                <InfoRow label="Min Order Qty" value={String(product.minimumOrderQuantity ?? 1)} />
                <InfoRow label="Max Order Qty" value={String(product.maximumOrderQuantity ?? "—")} />
                <div className="sm:col-span-2">
                  <InfoRow label="Description" value={product.description ?? "No description"} />
                </div>
              </div>
            )}
          </motion.div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Images */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass-card rounded-2xl p-6">
              <h2 className="font-semibold text-foreground mb-4">Images</h2>
              {product.images && product.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {product.images.map((img: string, i: number) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={`${product.name} - ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No images uploaded</p>
              )}
            </motion.div>

            {/* Status */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6">
              <h2 className="font-semibold text-foreground mb-4">Status</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active</span>
                  <Badge variant={product.isActive ? "success" : "error"}>{product.isActive ? "Active" : "Disabled"}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Stock</span>
                  <span className="text-sm font-semibold text-foreground">{totalStock}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Batches</span>
                  <span className="text-sm font-semibold text-foreground">{batches.length}</span>
                </div>
              </div>
            </motion.div>

            {/* Seller */}
            {product.seller && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-2xl p-6">
                <h2 className="font-semibold text-foreground mb-4">Listed By</h2>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">{product.seller?.sellerProfile?.companyName ?? product.seller?.name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{product.seller?.phone ?? "—"}</p>
                </div>
              </motion.div>
            )}

            {/* Discount */}
            {product.discountType && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-6">
                <h2 className="font-semibold text-foreground mb-4">Discount</h2>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Type</span>
                    <Badge variant="purple">{product.discountType}</Badge>
                  </div>
                  {product.discountValue && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Value</span>
                      <span className="text-sm font-semibold text-foreground">{product.discountValue}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Batches */}
        {batches.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-border/50">
              <h2 className="font-semibold text-foreground">Batches ({batches.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20">
                    {["Batch No", "Stock", "MRP", "PTR", "Expiry", "Mfg Date"].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {batches.map((b: any, i: number) => {
                    const expiry = b.expiryDate ? new Date(b.expiryDate) : null;
                    const isExpired = expiry && expiry < new Date();
                    return (
                      <tr key={b.id || i} className="hover:bg-accent/30 transition-colors">
                        <td className="px-5 py-4 text-sm font-mono font-medium text-foreground">{b.batchNumber ?? "—"}</td>
                        <td className="px-5 py-4 text-sm text-foreground">{b.stock ?? 0}</td>
                        <td className="px-5 py-4 text-sm text-foreground">{formatCurrency(b.mrp ?? 0)}</td>
                        <td className="px-5 py-4 text-sm text-foreground">{b.ptr ? formatCurrency(b.ptr) : "—"}</td>
                        <td className={cn("px-5 py-4 text-sm", isExpired ? "text-red-500 font-medium" : "text-muted-foreground")}>
                          {expiry ? expiry.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                          {isExpired && " ⚠"}
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">
                          {b.mfgDate ? new Date(b.mfgDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/*
          Visitor locations for this product. Passed both the id and the
          product's storefront path, because the API matches either — the path
          is what surfaces views recorded before events carried a product id.
        */}
        <ProductGeographyCard
          productId={id}
          path={`/products/${productSlug(product)}`}
          productName={product.name}
        />
      </div>

      {/* Delete Modal */}
      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Product">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Are you sure you want to permanently delete <strong>{product.name}</strong>? This cannot be undone.</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleteProduct.isPending}>Delete Product</Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground mt-0.5">{value || "—"}</dd>
    </div>
  );
}
