"use client";
import React, { useMemo } from "react";
import { Select, Input, Badge } from "@/components/ui";
import { BonusProductInput } from "./BonusProductInput";
import type { DiscountFormDetails, DiscountType } from "@pharmabag/utils";
import {
  calculatePricing,
  requiresDiscountPercent,
  requiresBuyGet,
  requiresBonusProductName,
  isSpecialPriceType,
  formatCurrency,
} from "@pharmabag/utils";

interface Props {
  value: DiscountFormDetails;
  onChange: (value: DiscountFormDetails) => void;
  mrp: number;
  gstPercent: number;
  error?: string;
}

// The three "different product" / bonus-only schemes were removed on request.
// No listing used them: of 279 listings, all were PTR_DISCOUNT (197) or
// PTR_PLUS_SAME_PRODUCT_BONUS (82), so nothing is left holding a value that can
// no longer be selected. The pricing engine still understands them, so they can
// be reinstated by restoring the lines below.
const DISCOUNT_OPTIONS: { label: string; value: string }[] = [
  { label: "PTR Discount Only", value: "ptr_discount" },
  { label: "PTR Discount + Same Product Bonus", value: "ptr_discount_and_same_product_bonus" },
  { label: "Special / Fixed Price", value: "special_price" },
];

export function DiscountSelector({ value, onChange, mrp, gstPercent, error }: Props) {
  const showPercent = requiresDiscountPercent(value.type);
  const showBonus = requiresBuyGet(value.type);
  const showBonusName = requiresBonusProductName(value.type);
  const showSpecialPrice = isSpecialPriceType(value.type);

  // Real-time pricing preview
  const pricing = useMemo(() => {
    if (mrp <= 0 || ![0, 5, 12, 18].includes(gstPercent)) return null;
    try {
      return calculatePricing(mrp, gstPercent, {
        type: value.type,
        discountPercent: value.discountPercent,
        buy: value.buy,
        get: value.get,
        bonusProductName: value.bonusProductName,
        specialPrice: value.specialPrice,
      });
    } catch {
      return null;
    }
  }, [mrp, gstPercent, value]);

  const handleTypeChange = (newType: DiscountType) => {
    onChange({
      type: newType,
      discountPercent: undefined,
      buy: undefined,
      get: undefined,
      bonusProductName: undefined,
      specialPrice: undefined,
    });
  };

  return (
    <div className="space-y-4 rounded-xl border p-4 bg-muted/10">
      <Select
        label="Discount Type"
        options={DISCOUNT_OPTIONS}
        value={value.type}
        onChange={(e) => handleTypeChange(e.target.value as DiscountType)}
        error={error}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {showPercent && (
          <Input
            label="PTR Discount %"
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={value.discountPercent ?? ""}
            onChange={(e) => onChange({ ...value, discountPercent: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="e.g 10"
          />
        )}

        {showBonus && (
          <div className="grid grid-cols-2 gap-4 sm:col-span-2">
            <Input
              label="Buy Quantity"
              type="number"
              min={1}
              step={1}
              value={value.buy ?? ""}
              onChange={(e) => onChange({ ...value, buy: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="e.g 10"
            />
            <Input
              label="Get Quantity (Free)"
              type="number"
              min={1}
              step={1}
              value={value.get ?? ""}
              onChange={(e) => onChange({ ...value, get: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="e.g 2"
            />
          </div>
        )}

        {showBonusName && (
          <div className="sm:col-span-2">
            <BonusProductInput
              value={value.bonusProductName ?? ""}
              onChange={(bonusProductName) => onChange({ ...value, bonusProductName })}
            />
          </div>
        )}

        {showSpecialPrice && (
          <Input
            label="Special Price (₹)"
            type="number"
            min={0}
            step={0.01}
            value={value.specialPrice ?? ""}
            onChange={(e) => onChange({ ...value, specialPrice: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="Fixed selling price"
          />
        )}
      </div>

      {/* Real-time Pricing Preview */}
      {pricing && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1.5">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider">Pricing Preview</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">PTR:</span>
              <span className="font-medium">{formatCurrency(pricing.ptr)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Final PTR:</span>
              <span className="font-medium">{formatCurrency(pricing.finalPtr)}</span>
            </div>
            {pricing.discountPercent > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount:</span>
                <span className="font-medium text-green-600">{pricing.discountPercent}% ({formatCurrency(pricing.discountValue)})</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST ({pricing.gstPercent}%):</span>
              <span className="font-medium">{formatCurrency(pricing.gstValue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Per Billed Unit:</span>
              <span className="font-semibold">{formatCurrency(pricing.perPtrWithGst)}</span>
            </div>
            {pricing.get > 0 && (
              <div className="flex justify-between col-span-2 sm:col-span-1">
                <span className="text-muted-foreground">Scheme:</span>
                <Badge variant="info">Buy {pricing.buy} Get {pricing.get}</Badge>
              </div>
            )}
            <div className="flex justify-between col-span-2 sm:col-span-3 border-t border-primary/10 pt-1 mt-1">
              <span className="text-muted-foreground font-medium">Buyer Pays:</span>
              <span className="font-bold text-primary">{formatCurrency(pricing.effectivePerUnit)} per unit</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
