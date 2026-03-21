"use client";
import React, { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCategories } from "@/hooks/useSeller";

interface Props {
  selectedCategoryIds: string[];
  onChangeCategories: (ids: string[]) => void;
  selectedSubcategoryIds: string[];
  onChangeSubcategories: (ids: string[]) => void;
  error?: string;
}

export function CategorySelector({ selectedCategoryIds, onChangeCategories, selectedSubcategoryIds, onChangeSubcategories, error }: Props) {
  const { data: categories, isLoading } = useCategories();
  
  // Safe default: assuming data is array of { id: string, name: string, subcategories?: ... }
  const safeCategories = Array.isArray(categories) ? categories : [];

  const toggleCategory = (id: string) => {
    if (selectedCategoryIds.includes(id)) {
      onChangeCategories(selectedCategoryIds.filter(x => x !== id));
    } else {
      onChangeCategories([...selectedCategoryIds, id]);
    }
  };

  const toggleSubcategory = (id: string) => {
    if (selectedSubcategoryIds.includes(id)) {
      onChangeSubcategories(selectedSubcategoryIds.filter(x => x !== id));
    } else {
      onChangeSubcategories([...selectedSubcategoryIds, id]);
    }
  };

  if (isLoading) {
    return <div className="h-20 flex items-center justify-center text-sm text-muted-foreground bg-muted/20 rounded-xl">Loading categories...</div>;
  }

  if (!safeCategories || safeCategories.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground border rounded-xl bg-orange-50/50 dark:bg-orange-900/10 border-orange-200">No categories found. Please configure them in Admin portal.</div>;
  }

  // Find subcategories belonging to selected categories
  const availableSubcats = safeCategories
    .filter((c: any) => selectedCategoryIds.includes(c.id))
    .flatMap((c: any) => c.subcategories || []);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">Categories</label>
        <div className="flex flex-wrap gap-2">
          {safeCategories.map((c: any) => {
            const isSelected = selectedCategoryIds.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCategory(c.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors flex items-center gap-1.5",
                  isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:bg-accent hover:text-foreground"
                )}
              >
                {isSelected && <Check className="h-3.5 w-3.5" />}
                {c.name}
              </button>
            );
          })}
        </div>
        {error && <p className="text-xs text-red-500" role="alert">{error}</p>}
      </div>

      {availableSubcats.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border/50">
          <label className="block text-sm font-medium text-foreground">Subcategories</label>
          <div className="flex flex-wrap gap-2">
            {availableSubcats.map((sc: any) => {
              const isSelected = selectedSubcategoryIds.includes(sc.id);
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => toggleSubcategory(sc.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5",
                    isSelected ? "bg-secondary text-secondary-foreground border-secondary" : "bg-background text-muted-foreground border-border hover:bg-accent hover:text-foreground"
                  )}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                  {sc.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
