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
  // Category and sub-category are catalogue identity, not seller data - the
  // same rule that locks the four text fields next to this component in
  // ProductForm. Without this, the only thing stopping an edit was the
  // toggles' incidental early-return once a selection already existed, so a
  // chip could look clickable and silently do nothing, and a legacy row with
  // an empty category array would have been wide open.
  disabled?: boolean;
}

export function CategorySelector({ selectedCategoryIds, onChangeCategories, selectedSubcategoryIds, onChangeSubcategories, error, disabled = false }: Props) {
  const { data: categories, isLoading } = useCategories();

  // Safe default: assuming data is array of { id: string, name: string, subcategories?: ... }
  const safeCategories = Array.isArray(categories)
    ? categories.filter(c => c && typeof c === 'object' && c.id && c.name)
    : [];

  const toggleCategory = (id: string) => {
    if (disabled) return;
    // If something is already selected, don't allow clicking anything else or toggling
    if (selectedCategoryIds.length > 0) return;
    onChangeCategories([...selectedCategoryIds, id]);
  };

  const toggleSubcategory = (id: string) => {
    if (disabled) return;
    // If something is already selected, don't allow clicking anything else or toggling
    if (selectedSubcategoryIds.length > 0) return;
    onChangeSubcategories([...selectedSubcategoryIds, id]);
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
    .flatMap((c: any) => {
      const subs = c.subCategories || c.subcategories || [];
      // Normalize subcategories to ensure they have id and name as strings
      return Array.isArray(subs) ? subs.map((sc: any) => {
        // Handle both direct properties and nested structures
        const id = sc?.id || sc?._id;
        let name: string = 'Unknown';
        if (typeof sc?.name === 'string') {
          name = sc.name;
        } else if (sc?.name && typeof sc.name === 'object' && sc.name.name) {
          name = String(sc.name.name);
        } else if (sc?.name) {
          name = String(sc.name);
        }
        return { id, name };  // Only return id and name to avoid rendering nested objects
      }).filter((sc: any) => sc && sc.id && sc.name) : [];
    });

  const subcatsToDisplay = selectedSubcategoryIds.length === 0
    ? availableSubcats 
    : availableSubcats.filter((sc: any) => selectedSubcategoryIds.includes(sc.id));

  const categoriesToDisplay = selectedCategoryIds.length === 0
    ? safeCategories
    : safeCategories.filter((c: any) => selectedCategoryIds.includes(c.id));

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="block text-sm font-medium text-foreground">Categories</label>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {categoriesToDisplay.map((c: any) => {
            const isSelected = selectedCategoryIds.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                disabled={disabled}
                onClick={() => { toggleCategory(c.id); }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors flex items-center gap-1.5",
                  isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:bg-accent hover:text-foreground",
                  disabled && !isSelected && "opacity-50 cursor-not-allowed hover:bg-background hover:text-muted-foreground"
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
        <div className="space-y-3 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
               <label className="block text-sm font-medium text-foreground">Subcategories</label>
             </div>
          </div>
          <div className="flex flex-wrap gap-2 transition-all duration-300">
            {subcatsToDisplay.map((sc: any) => {
              const subId = String(sc?.id || "");
              const isSelected = selectedSubcategoryIds.map(String).includes(subId);
              return (
                <button
                  key={subId}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleSubcategory(subId)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5",
                    isSelected
                      ? "bg-secondary text-secondary-foreground border-secondary shadow-sm scale-[1.02]"
                      : "bg-background text-muted-foreground border-border hover:bg-accent hover:text-foreground opacity-80 hover:opacity-100",
                    // twMerge resolves the hover:bg-*/hover:text-* conflicts against the
                    // unselected branch above, but hover:opacity-100 is its own group and
                    // nothing here overrode it, so a disabled chip still brightened to full
                    // opacity on hover even though clicking it was already blocked.
                    disabled && !isSelected && "opacity-50 cursor-not-allowed hover:opacity-50 hover:bg-background hover:text-muted-foreground"
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
