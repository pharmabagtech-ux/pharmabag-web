"use client";
import React from "react";
import { Select, Input } from "@/components/ui";
import { DiscountType, DiscountDetails } from "@pharmabag/utils";

interface Props {
  value: DiscountDetails;
  onChange: (value: DiscountDetails) => void;
  error?: string;
}

const DISCOUNT_OPTIONS = [
  { label: "PTR Discount", value: "ptr_discount" },
  { label: "Same Product Bonus", value: "same_product_bonus" },
  { label: "PTR + Same Product Bonus", value: "ptr_discount_and_same_product_bonus" },
  { label: "Different Product Bonus", value: "different_product_bonus" },
  { label: "PTR + Different Product Bonus", value: "different_ptr_discount_and_same_product_bonus" },
];

export function DiscountSelector({ value, onChange, error }: Props) {
  const showPercent = value.type.includes("ptr_discount") || value.type === "different_ptr_discount_and_same_product_bonus";
  const showBonus = value.type.includes("bonus");

  return (
    <div className="space-y-4 rounded-xl border p-4 bg-muted/10">
      <Select
        label="Discount Type"
        options={DISCOUNT_OPTIONS}
        value={value.type}
        onChange={(e) => onChange({ type: e.target.value as DiscountType, discountPercent: undefined, buy: undefined, get: undefined })}
        error={error}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {showPercent && (
          <Input
            label="PTR Discount %"
            type="number"
            min={0}
            max={100}
            value={value.discountPercent ?? ""}
            onChange={(e) => onChange({ ...value, discountPercent: Number(e.target.value) })}
            placeholder="e.g 10"
          />
        )}
        {showBonus && (
          <>
            <Input
              label="Buy Amount"
              type="number"
              min={1}
              value={value.buy ?? ""}
              onChange={(e) => onChange({ ...value, buy: Number(e.target.value) })}
              placeholder="e.g 10"
            />
            <Input
              label="Get Amount"
              type="number"
              min={1}
              value={value.get ?? ""}
              onChange={(e) => onChange({ ...value, get: Number(e.target.value) })}
              placeholder="e.g 2"
            />
          </>
        )}
      </div>
    </div>
  );
}
