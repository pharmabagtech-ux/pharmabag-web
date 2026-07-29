"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useSuggestionSearch } from "@/hooks/useSeller";
import type { Suggestion } from "@pharmabag/utils";

/**
 * "Bonus Product Name" used to be a plain text box, so a seller had to type the
 * free product's name from memory with no way to check it against the
 * catalogue.
 *
 * This searches the master catalogue as they type, using the same hook and
 * endpoint as the Quick Search box on the product form. Free text is still
 * accepted — a seller may be giving away something not yet in the catalogue —
 * so selecting a suggestion simply fills the field.
 */
export function BonusProductInput({
  value,
  onChange,
  label = "Bonus Product Name",
  placeholder = "e.g Cetirizine 10mg",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: suggestions = [] } = useSuggestionSearch(value, "master");

  useEffect(() => {
    setActiveIndex(-1);
  }, [suggestions]);

  // Close on outside click, matching the Quick Search behaviour.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (suggestion: Suggestion) => {
    onChange(suggestion.productName);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      // Only intercept Enter when a suggestion is highlighted, so a typed-only
      // value can still be submitted normally.
      if (activeIndex >= 0) {
        e.preventDefault();
        select(suggestions[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <Input
        label={label}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => value.length >= 2 && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
      />

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border border-primary/20 rounded-xl shadow-2xl max-h-64 overflow-y-auto backdrop-blur-xl">
          {suggestions.map((s: Suggestion, index: number) => (
            <button
              key={s.id}
              type="button"
              className={cn(
                "w-full text-left px-4 py-3 transition-colors border-b border-border/30 last:border-0 group",
                activeIndex === index ? "bg-primary/20" : "hover:bg-primary/10",
              )}
              onClick={() => select(s)}
            >
              <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                {s.productName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {s.companyName}
                {s.chemicalCombination ? ` | ${s.chemicalCombination}` : ""}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
