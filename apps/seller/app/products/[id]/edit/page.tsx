"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { SellerSidebar } from "@/components/layout/sidebar";
import { ProductForm } from "@/components/products/ProductForm";
import { useSellerProduct } from "@/hooks/useSeller";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const { data: product, isLoading, error } = useSellerProduct(productId);

  return (
    <div className="min-h-screen bg-background">
      <SellerSidebar />
      <main className="lg:pl-64 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Loading product details...</p>
            </div>
          ) : error || !product ? (
            <div className="text-center py-12 p-6 glass-card rounded-2xl max-w-lg mx-auto mt-20">
              <h2 className="text-xl font-bold text-foreground mb-2">Product not found</h2>
              <p className="text-muted-foreground mb-6">The product you are trying to edit does not exist or you lack permission.</p>
              <Button onClick={() => router.push("/products")} leftIcon={<ArrowLeft className="h-4 w-4" />}>Go back to Products</Button>
            </div>
          ) : (
            <ProductForm 
              productId={product.id} 
              defaultValues={{
                product_name: product.name,
                product_price: product.price,
                company_name: product.manufacturer || "",
                chemical_combination: product.chemicalComposition || "",
                categories: product.categoryId ? [product.categoryId] : [],
                sub_categories: product.subCategoryId ? [product.subCategoryId] : [],
                stock: product.stock || 0,
                min_order_qty: product.minimumOrderQuantity || 1,
                max_order_qty: product.maximumOrderQuantity || 100,
                expire_date: product.expiryDate || "",
                bulk: false,
                image_list: product.images || [],
                custom_extra_fields: [], // Ideally parsed from extra_fields if present in product type
                discount_details: { type: "ptr_discount", discountPercent: product.discount },
              }} 
            />
          )}
        </div>
      </main>
    </div>
  );
}
