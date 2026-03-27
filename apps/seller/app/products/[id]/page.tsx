"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useSellerProduct, useDeleteSellerProduct } from "@/hooks/useSeller";
import { ArrowLeft, Loader2, Edit, Trash2 } from "lucide-react";
import { Button, Badge, ApprovalBadge } from "@/components/ui";
import { formatCurrency, formatDate } from "@pharmabag/utils";
import toast from "react-hot-toast";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const { data: product, isLoading, error } = useSellerProduct(productId);
  const deleteProduct = useDeleteSellerProduct();

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct.mutateAsync(productId);
      toast.success("Product deleted successfully");
      router.push("/products");
    } catch {
      toast.error("Failed to delete product");
    }
  };

  return (
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push("/products")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-semibold text-2xl text-foreground">Product Details</h1>
                <p className="text-sm text-muted-foreground mt-0.5">View your product information</p>
              </div>
            </div>
            {product && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.push(`/products/${productId}/edit`)} leftIcon={<Edit className="h-4 w-4" />}>Edit</Button>
                <Button variant="danger" onClick={handleDelete} leftIcon={<Trash2 className="h-4 w-4" />}>Delete</Button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Loading product details...</p>
            </div>
          ) : error || !product ? (
            <div className="text-center py-12 p-6 glass-card rounded-2xl max-w-lg mx-auto mt-20">
              <h2 className="text-xl font-bold text-foreground mb-2">Product not found</h2>
              <p className="text-muted-foreground mb-6">The product you are looking for does not exist or you lack permission.</p>
              <Button onClick={() => router.push("/products")}>Go back to Products</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="md:col-span-2 space-y-6">
                 {/* Basic Info */}
                 <div className="glass-card p-6 rounded-2xl space-y-4">
                   <div className="flex justify-between items-start">
                     <div>
                       <h2 className="text-2xl font-bold text-foreground">{product.name}</h2>
                       <p className="text-muted-foreground font-mono text-sm mt-1">{product.genericName || product.chemicalComposition}</p>
                     </div>
                     <ApprovalBadge status={product.approvalStatus || "PENDING"} />
                   </div>
                   <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                     <div><p className="text-xs text-muted-foreground font-medium uppercase">MRP</p><p className="font-semibold text-lg">{formatCurrency(product.mrp ?? product.price ?? 0)}</p></div>
                     <div><p className="text-xs text-muted-foreground font-medium uppercase">Manufacturer</p><p className="font-medium">{product.manufacturer || "-"}</p></div>
                     <div><p className="text-xs text-muted-foreground font-medium uppercase">Category</p><Badge className="uppercase mt-1">{product.category || product.categoryId || "-"}</Badge></div>
                     <div><p className="text-xs text-muted-foreground font-medium uppercase">Expiry Date</p><p className="font-medium">{product.expiryDate ? formatDate(product.expiryDate) : "-"}</p></div>
                   </div>
                 </div>

                 {/* Stock & Ordering */}
                 <div className="glass-card p-6 rounded-2xl space-y-4">
                   <h3 className="font-semibold text-lg border-b border-border/50 pb-2">Inventory & Ordering</h3>
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                     <div><p className="text-xs text-muted-foreground font-medium uppercase">Current Stock</p><p className={`font-semibold text-lg ${product.stock && product.stock > 0 ? "text-green-600" : "text-red-500"}`}>{product.stock || 0} units</p></div>
                     <div><p className="text-xs text-muted-foreground font-medium uppercase">Min Order</p><p className="font-medium">{product.minimumOrderQuantity || 1}</p></div>
                     <div><p className="text-xs text-muted-foreground font-medium uppercase">Max Order</p><p className="font-medium">{product.maximumOrderQuantity || "-"}</p></div>
                   </div>
                 </div>
               </div>

               {/* Right column: Images */}
               <div className="space-y-6">
                 <div className="glass-card p-6 rounded-2xl space-y-4">
                   <h3 className="font-semibold text-lg border-b border-border/50 pb-2">Images</h3>
                   {product.images && product.images.length > 0 ? (
                     <div className="grid grid-cols-2 gap-3">
                       {product.images.map((img, i) => (
                         <div key={i} className="aspect-square rounded-xl overflow-hidden border border-border">
                           {/* eslint-disable-next-line @next/next/no-img-element */}
                           <img src={img} alt={`${product.name} - ${i}`} className="w-full h-full object-cover" />
                         </div>
                       ))}
                     </div>
                   ) : (
                     <p className="text-sm text-muted-foreground text-center py-6">No images provided</p>
                   )}
                 </div>
                 
                 <div className="glass-card p-6 rounded-2xl space-y-4">
                   <h3 className="font-semibold text-lg border-b border-border/50 pb-2">Discounts</h3>
                   {!product.discountType ? (
                     <p className="text-sm text-muted-foreground text-center py-4">No active discounts configured</p>
                   ) : (
                     <div className="space-y-3">
                       {product.discountType === "PTR_DISCOUNT" && (
                         <div><p className="text-xs text-muted-foreground font-medium uppercase">PTR Discount</p><p className="font-bold text-green-600 text-xl">{product.discountMeta?.discountPercent}% OFF</p></div>
                       )}
                       {product.discountType === "SAME_PRODUCT_BONUS" && (
                         <div><p className="text-xs text-muted-foreground font-medium uppercase">Same Product Bonus</p><p className="font-bold text-blue-600 text-xl">Buy {product.discountMeta?.buy}, Get {product.discountMeta?.get} Free</p></div>
                       )}
                       {product.discountType === "DIFFERENT_PRODUCT_BONUS" && (
                         <div><p className="text-xs text-muted-foreground font-medium uppercase">Different Product Bonus</p><p className="font-bold text-blue-600 text-lg">Buy {product.discountMeta?.buy}, Get {product.discountMeta?.get} {product.discountMeta?.bonusProductName} Free</p></div>
                       )}
                       {product.discountType === "PTR_PLUS_SAME_PRODUCT_BONUS" && (
                         <div><p className="text-xs text-muted-foreground font-medium uppercase">Combo Discount</p><p className="font-bold text-purple-600 text-lg">{product.discountMeta?.discountPercent}% OFF + Buy {product.discountMeta?.buy} Get {product.discountMeta?.get}</p></div>
                       )}
                       {product.discountType === "PTR_PLUS_DIFFERENT_PRODUCT_BONUS" && (
                         <div><p className="text-xs text-muted-foreground font-medium uppercase">Combo Discount (Diff Product)</p><p className="font-bold text-purple-600 text-lg">{product.discountMeta?.discountPercent}% OFF + Buy {product.discountMeta?.buy} Get {product.discountMeta?.get} {product.discountMeta?.bonusProductName}</p></div>
                       )}
                       {product.discountType === "SPECIAL_PRICE" && (
                         <div><p className="text-xs text-muted-foreground font-medium uppercase">Special Price</p><p className="font-bold text-orange-600 text-xl">₹{product.discountMeta?.specialPrice}</p></div>
                       )}
                     </div>
                   )}
                 </div>
               </div>
            </div>
          )}
        </div>
  );
}
