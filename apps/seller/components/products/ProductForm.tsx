"use client";
import React, { useEffect, useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { Button, Input, Textarea, Select } from "@/components/ui";
import { ImageUploader } from "./ImageUploader";
import { DiscountSelector } from "./DiscountSelector";
import { CategorySelector } from "./CategorySelector";
import { ProductPayload, DiscountDetails } from "@pharmabag/utils";
import { useCreateSellerProduct, useUpdateSellerProduct } from "@/hooks/useSeller";

const formSchema = z.object({
  product_name: z.string().min(2, "Name must be at least 2 characters"),
  product_price: z.number().min(0.01, "Price must be greater than 0"),
  company_name: z.string().min(2, "Company name is required"),
  chemical_combination: z.string().optional(),
  categories: z.array(z.string()).min(1, "Select at least one category"),
  sub_categories: z.array(z.string()).optional(),
  stock: z.number().min(0, "Stock cannot be negative"),
  min_order_qty: z.number().min(1, "Minimum 1 required"),
  max_order_qty: z.number().min(1, "Minimum 1 required"),
  expire_date: z.string().refine((val) => new Date(val) > new Date(), {
    message: "Expiry date must be in the future",
  }),
  bulk: z.boolean(),
  image_list: z.array(z.string()).optional().default([]),
  custom_extra_fields: z.array(z.object({ key: z.string().min(1), value: z.string().min(1) })),
  discount_details: z.object({
    type: z.enum([
      "ptr_discount",
      "same_product_bonus",
      "ptr_discount_and_same_product_bonus",
      "different_product_bonus",
      "different_ptr_discount_and_same_product_bonus",
    ]),
    discountPercent: z.number().optional(),
    buy: z.number().optional(),
    get: z.number().optional(),
  }).optional(),
}).refine((data) => data.min_order_qty <= data.max_order_qty, {
  message: "Max order qty must be >= min order qty",
  path: ["max_order_qty"],
});

type FormValues = z.infer<typeof formSchema>;

export function ProductForm({ defaultValues, productId }: { defaultValues?: Partial<FormValues>; productId?: string }) {
  const router = useRouter();
  const createProduct = useCreateSellerProduct();
  const updateProduct = useUpdateSellerProduct();
  const isEditing = !!productId;

  const { register, control, handleSubmit, formState: { errors, isSubmitting, isDirty }, watch } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: defaultValues || {
      product_name: "",
      product_price: 0,
      company_name: "",
      chemical_combination: "",
      categories: [],
      sub_categories: [],
      stock: 0,
      min_order_qty: 1,
      max_order_qty: 100,
      expire_date: "",
      bulk: false,
      image_list: [],
      custom_extra_fields: [],
      discount_details: { type: "ptr_discount" } as DiscountDetails,
    },
  });

  const { fields: extraFields, append: appendExtra, remove: removeExtra } = useFieldArray({ control, name: "custom_extra_fields" });

  // Confimation before leaving unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const onSubmit = async (data: FormValues) => {
    try {
      const extra_fields = data.custom_extra_fields.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
      
      // Map discount type from legacy naming to backend enum
      const discountTypeMap: Record<string, string> = {
        ptr_discount: "PTR_DISCOUNT",
        same_product_bonus: "SAME_PRODUCT_BONUS",
        ptr_discount_and_same_product_bonus: "PTR_PLUS_SAME_PRODUCT_BONUS",
        different_product_bonus: "DIFFERENT_PRODUCT_BONUS",
        different_ptr_discount_and_same_product_bonus: "PTR_PLUS_DIFFERENT_PRODUCT_BONUS",
      };

      // Build the backend-compatible payload
      // Filter out data URLs (base64) — only send real URLs. If no real URLs, omit images.
      const realImages = (data.image_list || []).filter((url) => url.startsWith("http"));

      const backendPayload: Record<string, any> = {
        name: data.product_name,
        mrp: data.product_price,
        manufacturer: data.company_name,
        chemicalComposition: data.chemical_combination || "N/A",
        categoryId: data.categories[0],         // Backend expects a single category ID
        subCategoryId: data.sub_categories?.[0] || data.categories[0], // Fallback
        stock: data.stock,
        expiryDate: new Date(data.expire_date).toISOString(),
        minimumOrderQuantity: data.min_order_qty,
        maximumOrderQuantity: data.max_order_qty,
        bulk: data.bulk,
        ...(realImages.length > 0 && { images: realImages }),
        ...(Object.keys(extra_fields).length > 0 && { extraFields: extra_fields }),
        ...(data.discount_details?.type && {
          discountType: discountTypeMap[data.discount_details.type] || undefined,
        }),
        ...(data.discount_details && (data.discount_details.discountPercent || data.discount_details.buy) && {
          discountMeta: {
            discountPercent: data.discount_details.discountPercent,
            buy: data.discount_details.buy,
            get: data.discount_details.get,
          },
        }),
      };

      if (isEditing) {
        await updateProduct.mutateAsync({ productId: productId!, input: backendPayload as any });
        toast.success("Product updated successfully");
      } else {
        await createProduct.mutateAsync(backendPayload as any);
        toast.success("Product added successfully");
      }
      router.push("/products");
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err.message || "Something went wrong saving the product";
      toast.error(Array.isArray(errorMsg) ? errorMsg.join(", ") : errorMsg);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => {
          if (isDirty && !window.confirm("You have unsaved changes. Discard?")) return;
          router.push("/products");
        }}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-semibold text-2xl text-foreground">{isEditing ? "Edit Product" : "Add New Product"}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Please fill in the product details carefully.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit, (validationErrors) => {
        console.error("Form validation errors:", validationErrors);
        const firstError = Object.values(validationErrors)[0];
        const msg = (firstError as any)?.message || "Please fix the form errors";
        toast.error(String(msg));
      })} className="space-y-6">
        {/* Basic Info */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-lg text-foreground border-b border-border/50 pb-2">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Product Name *" error={errors.product_name?.message} {...register("product_name")} />
            <Input label="Company Name *" error={errors.company_name?.message} {...register("company_name")} />
            <div className="md:col-span-2">
              <Textarea label="Chemical Combination" error={errors.chemical_combination?.message} {...register("chemical_combination")} />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-lg text-foreground border-b border-border/50 pb-2">Categorization</h2>
          <Controller
            control={control}
            name="categories"
            render={({ field: { value: cats, onChange: setCats } }: any) => (
              <Controller
                control={control}
                name="sub_categories"
                render={({ field: { value: subcats, onChange: setSubcats } }: any) => (
                  <CategorySelector 
                    selectedCategoryIds={cats} 
                    onChangeCategories={setCats} 
                    selectedSubcategoryIds={subcats || []} 
                    onChangeSubcategories={setSubcats} 
                    error={errors.categories?.message} 
                  />
                )}
              />
            )}
          />
        </div>

        {/* Pricing & Stock */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-lg text-foreground border-b border-border/50 pb-2">Pricing & Stock</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Product Price (₹) *" type="number" step="0.01" error={errors.product_price?.message} {...register("product_price", { valueAsNumber: true })} />
            <Input label="Current Stock *" type="number" error={errors.stock?.message} {...register("stock", { valueAsNumber: true })} />
            <Input label="Expiry Date *" type="date" error={errors.expire_date?.message} {...register("expire_date")} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Input label="Minimum Order Qty *" type="number" error={errors.min_order_qty?.message} {...register("min_order_qty", { valueAsNumber: true })} />
            <Input label="Maximum Order Qty *" type="number" error={errors.max_order_qty?.message} {...register("max_order_qty", { valueAsNumber: true })} />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <label className="text-sm font-medium text-foreground cursor-pointer flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary" {...register("bulk")} />
              Bulk Order Available
            </label>
          </div>
        </div>

        {/* Discounts */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-lg text-foreground border-b border-border/50 pb-2">Discount & Bonuses</h2>
          <Controller
            control={control}
            name="discount_details"
            render={({ field }: any) => (
              <DiscountSelector value={field.value} onChange={field.onChange} error={errors.discount_details?.message} />
            )}
          />
        </div>

        {/* Images */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-lg text-foreground border-b border-border/50 pb-2">Product Images</h2>
          <Controller
            control={control}
            name="image_list"
            render={({ field }: any) => (
              <ImageUploader value={field.value} onChange={field.onChange} error={errors.image_list?.message} maxFiles={5} />
            )}
          />
        </div>

        {/* Extra Fields */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <h2 className="font-semibold text-lg text-foreground">Extra Fields (Optional)</h2>
            <Button type="button" variant="outline" size="sm" onClick={() => appendExtra({ key: "", value: "" })} leftIcon={<Plus className="h-4 w-4" />}>Add Field</Button>
          </div>
          {extraFields.length === 0 ? (
            <p className="text-sm text-muted-foreground">No extra fields defined. Use this for additional specifications.</p>
          ) : (
            <div className="space-y-3">
              {extraFields.map((field: any, index: number) => (
                <div key={field.id} className="flex items-start gap-3">
                  <div className="flex-1"><Input placeholder="Key (e.g. Storage)" error={errors.custom_extra_fields?.[index]?.key?.message} {...register(`custom_extra_fields.${index}.key` as const)} /></div>
                  <div className="flex-1"><Input placeholder="Value (e.g. Store below 25°C)" error={errors.custom_extra_fields?.[index]?.value?.message} {...register(`custom_extra_fields.${index}.value` as const)} /></div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeExtra(index)} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 sticky bottom-6 z-10 p-4 bg-background/80 backdrop-blur-xl border border-border rounded-2xl shadow-lg">
          <Button type="button" variant="outline" onClick={() => router.push("/products")} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>{isEditing ? "Update Product" : "Publish Product"}</Button>
        </div>
      </form>
    </div>
  );
}
