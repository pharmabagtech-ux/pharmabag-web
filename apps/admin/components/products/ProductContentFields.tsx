"use client";
import { Plus, Trash2 } from "lucide-react";
import { Input, Textarea } from "@/components/ui";
import type { FaqPair, PageDefaults } from "@/api/page-seo.api";

/**
 * The content a product page actually shows, editable in one place.
 *
 * Six of these columns already existed and were already rendered — directions
 * and safety advice in the "About" block, therapeutic class, side effects,
 * pack size and storage in the specifications table — but only a CSV import
 * could write them, so the words on a live product page could not be corrected
 * by hand.
 *
 * The intro and FAQs are generated when left blank. Their placeholders show
 * the live wording, so an editor can read what the page says before deciding
 * to override it.
 */

export interface ProductContent {
  pageIntro: string;
  directionsForUse: string;
  safetyAdvice: string;
  therapeuticClass: string;
  sideEffects: string;
  packSize: string;
  storageAndHandling: string;
}

export const EMPTY_PRODUCT_CONTENT: ProductContent = {
  pageIntro: "",
  directionsForUse: "",
  safetyAdvice: "",
  therapeuticClass: "",
  sideEffects: "",
  packSize: "",
  storageAndHandling: "",
};

const TOKENS = ["{{price}}", "{{mrp}}", "{{moq}}", "{{name}}", "{{manufacturer}}", "{{composition}}"];

interface Props {
  value: ProductContent;
  onChange: (v: ProductContent) => void;
  faq: FaqPair[];
  onFaqChange: (f: FaqPair[]) => void;
  useCustomFaq: boolean;
  onUseCustomFaqChange: (v: boolean) => void;
  /** What the live page says now. Absent for a product being created. */
  defaults?: PageDefaults;
  defaultsLoading?: boolean;
  defaultsError?: boolean;
}

export default function ProductContentFields({
  value,
  onChange,
  faq,
  onFaqChange,
  useCustomFaq,
  onUseCustomFaqChange,
  defaults,
  defaultsLoading,
  defaultsError,
}: Props) {
  const set = (k: keyof ProductContent) => (v: string) => onChange({ ...value, [k]: v });
  const rows = useCustomFaq ? faq : (defaults?.faq ?? []);

  return (
    <div className="col-span-2 space-y-4 rounded-xl border border-border p-4">
      <div>
        <p className="text-sm font-semibold">Product page content</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {defaultsLoading
            ? "Reading what this page says now…"
            : defaultsError
              ? "Could not read the live page, so the placeholders below are empty. Saving still works."
              : "Blank fields are generated automatically. Placeholders show what the live page says today."}
        </p>
      </div>

      <Textarea
        label="About this product (intro paragraph)"
        rows={4}
        value={value.pageIntro}
        onChange={(e) => set("pageIntro")(e.target.value)}
        placeholder={defaults?.intro ?? ""}
      />
      <p className="-mt-2 text-xs text-muted-foreground">
        Keep live figures with{" "}
        {TOKENS.map((t) => (
          <code key={t} className="mx-0.5 rounded bg-muted px-1 py-0.5">
            {t}
          </code>
        ))}
        — a typed-in rate stops updating when a supplier changes theirs.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Therapeutic class"
          value={value.therapeuticClass}
          onChange={(e) => set("therapeuticClass")(e.target.value)}
          placeholder="e.g. Analgesic"
        />
        <Input
          label="Pack size"
          value={value.packSize}
          onChange={(e) => set("packSize")(e.target.value)}
          placeholder="e.g. 15 tablets"
        />
      </div>

      <Textarea
        label="Directions for use"
        rows={2}
        value={value.directionsForUse}
        onChange={(e) => set("directionsForUse")(e.target.value)}
        placeholder="Shown in the About block. Leave blank to omit the section."
      />
      <Textarea
        label="Safety advice"
        rows={2}
        value={value.safetyAdvice}
        onChange={(e) => set("safetyAdvice")(e.target.value)}
        placeholder="Shown in the About block. Leave blank to omit the section."
      />
      <Textarea
        label="Side effects"
        rows={2}
        value={value.sideEffects}
        onChange={(e) => set("sideEffects")(e.target.value)}
        placeholder="Shown in the specifications table."
      />
      <Textarea
        label="Storage and handling"
        rows={2}
        value={value.storageAndHandling}
        onChange={(e) => set("storageAndHandling")(e.target.value)}
        placeholder="Shown in the specifications table."
      />

      <div className="space-y-2 border-t border-border/60 pt-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-foreground">
            FAQs
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              also published as FAQ structured data
            </span>
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={useCustomFaq}
              onChange={(e) => {
                onUseCustomFaqChange(e.target.checked);
                if (e.target.checked && faq.length === 0) onFaqChange(defaults?.faq ?? []);
              }}
            />
            Write my own
          </label>
        </div>

        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {defaults
              ? "This page has no FAQs yet."
              : "FAQs are generated once the product is saved and has a live page."}
          </p>
        ) : null}

        {rows.map((row, i) => (
          <div key={i} className="space-y-1.5 rounded-lg border border-border/60 p-3">
            <Input
              value={row.question}
              disabled={!useCustomFaq}
              placeholder="Question"
              onChange={(e) =>
                onFaqChange(faq.map((r, j) => (j === i ? { ...r, question: e.target.value } : r)))
              }
            />
            <Textarea
              rows={2}
              value={row.answer}
              disabled={!useCustomFaq}
              placeholder="Answer"
              onChange={(e) =>
                onFaqChange(faq.map((r, j) => (j === i ? { ...r, answer: e.target.value } : r)))
              }
            />
            {useCustomFaq ? (
              <button
                type="button"
                onClick={() => onFaqChange(faq.filter((_, j) => j !== i))}
                className="flex items-center gap-1 text-xs text-red-500 hover:underline"
              >
                <Trash2 className="h-3 w-3" /> Remove
              </button>
            ) : null}
          </div>
        ))}

        {useCustomFaq ? (
          <button
            type="button"
            onClick={() => onFaqChange([...faq, { question: "", answer: "" }])}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> Add question
          </button>
        ) : (
          <p className="text-xs text-muted-foreground">
            Generated from the product&apos;s price, MOQ, composition and manufacturer.
            Tick “Write my own” to take over.
          </p>
        )}
      </div>
    </div>
  );
}
