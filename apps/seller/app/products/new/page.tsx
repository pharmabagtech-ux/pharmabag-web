"use client";
import React from "react";
import { SellerSidebar } from "@/components/layout/sidebar";
import { ProductForm } from "@/components/products/ProductForm";

export default function AddProductPage() {
  return (
    <div className="min-h-screen bg-background">
      <SellerSidebar />
      <main className="lg:pl-64 p-6">
        <div className="max-w-7xl mx-auto">
          <ProductForm />
        </div>
      </main>
    </div>
  );
}
