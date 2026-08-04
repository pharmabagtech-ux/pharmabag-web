"use client";
import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpiryPickerProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  className?: string;
  required?: boolean;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Height to assume before the panel has been measured, for the flip decision. */
const ESTIMATED_PANEL_HEIGHT = 300;
const PANEL_MIN_WIDTH = 320;
const VIEWPORT_MARGIN = 8;

export function ExpiryPicker({ value, onChange, label, error, className, required }: ExpiryPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  // The panel is rendered into document.body rather than beside the field.
  // The Pricing & Stock card it sits in is `relative z-[42]`, which opens a
  // stacking context - so no z-index on the panel can lift it above the sticky
  // Cancel / Add Product bar (a sibling of that card at z-[100]). The bar was
  // covering the lower half of the panel and swallowing its clicks. Same fix,
  // and same reason, as the admin SellersHoverCell.
  const place = useCallback(() => {
    const r = fieldRef.current?.getBoundingClientRect();
    if (!r) return;

    const width = Math.min(Math.max(r.width, PANEL_MIN_WIDTH), window.innerWidth - VIEWPORT_MARGIN * 2);
    const left = Math.max(VIEWPORT_MARGIN, Math.min(r.left, window.innerWidth - width - VIEWPORT_MARGIN));

    const height = panelRef.current?.offsetHeight ?? ESTIMATED_PANEL_HEIGHT;
    const below = r.bottom + VIEWPORT_MARGIN;
    // Drop below the field unless that would run past the fold, in which case
    // open upwards.
    const top =
      below + height > window.innerHeight - VIEWPORT_MARGIN
        ? Math.max(VIEWPORT_MARGIN, r.top - height - VIEWPORT_MARGIN)
        : below;

    setPos({ top, left, width });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) {
      setPos(null);
      return;
    }
    place();
    // Re-place once the panel exists, so the flip uses its real height.
    const frame = requestAnimationFrame(place);
    // `true` for capture: the form scrolls inside a container, not the window.
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [isOpen, place]);

  // Helper to get initial date (this time next year if empty)
  const getInitialDate = () => {
    const now = new Date();
    const nextYear = new Date(now.getFullYear() + 1, now.getMonth(), 1);
    
    if (!value) return nextYear;
    
    // Support YYYY-MM or ISO string
    const date = new Date(value);
    return isNaN(date.getTime()) ? nextYear : date;
  };

  const [internalDate, setInternalDate] = useState(getInitialDate());
  const [typedMonth, setTypedMonth] = useState(SHORT_MONTHS[internalDate.getMonth()]);
  const [typedYear, setTypedYear] = useState(internalDate.getFullYear().toString());

  // Update typed values when internalDate changes (e.g. via scroll or external value change)
  useEffect(() => {
    setTypedMonth(SHORT_MONTHS[internalDate.getMonth()]);
    setTypedYear(internalDate.getFullYear().toString());
  }, [internalDate]);

  // Update internal date if value changes from outside (e.g. form reset or initial load)
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setInternalDate(d);
      }
    }
  }, [value]);

  const updateDate = (newMonth: number, newYear: number) => {
    const d = new Date(newYear, newMonth, 1);
    setInternalDate(d);
    // Format as YYYY-MM for backend compatibility and better input handling
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    onChange(`${yyyy}-${mm}`);
  };

  const handleWheelMonth = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1 : -1;
    let newMonth = internalDate.getMonth() + delta;
    let newYear = internalDate.getFullYear();
    
    if (newMonth > 11) { newMonth = 0; newYear++; }
    if (newMonth < 0) { newMonth = 11; newYear--; }
    
    updateDate(newMonth, newYear);
  };

  const handleWheelYear = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1 : -1;
    updateDate(internalDate.getMonth(), internalDate.getFullYear() + delta);
  };

  // Close on outside click. The panel is portalled out of this subtree, so it
  // has to be checked separately or every click inside it would close it.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const monthLabel = SHORT_MONTHS[internalDate.getMonth()];
  const yearLabel = internalDate.getFullYear();

  return (
    <div className={cn("space-y-1.5 relative", isOpen ? "z-[100]" : "z-10", className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div
        ref={fieldRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full h-14 rounded-2xl border bg-white dark:bg-slate-900 px-4 py-2 cursor-pointer transition-all duration-200 shadow-sm",
          isOpen ? "border-primary ring-4 ring-primary/10" : "border-slate-200 dark:border-slate-800 hover:border-primary/50",
          error ? "border-red-400 bg-red-50/30 ring-red-100" : ""
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-xl transition-colors",
            isOpen ? "bg-primary/10 text-primary" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
          )}>
            <Calendar className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className={cn(
              "text-sm font-bold tracking-tight",
              !value ? "text-slate-400" : "text-slate-900 dark:text-slate-100"
            )}>
              {value ? `${MONTHS[internalDate.getMonth()]} ${yearLabel}` : "Pick Expiry Date"}
            </span>
            {value && (
              <span className="text-[10px] text-primary font-bold uppercase tracking-wider leading-none mt-0.5">
                Expiry Set
              </span>
            )}
          </div>
        </div>
        <ChevronsUpDown className="h-4 w-4 text-slate-400" />
      </div>

      {typeof document !== "undefined" && createPortal(
      <AnimatePresence>
        {isOpen && pos && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 2, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: 2 }}
            style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
            className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6"
          >
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                {/* Month Picker */}
                <div 
                  onWheel={handleWheelMonth}
                  className="group flex flex-col items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors hover:border-primary/30"
                >
                  <button
                    type="button"
                    onClick={() => updateDate(internalDate.getMonth() - 1 < 0 ? 11 : internalDate.getMonth() - 1, internalDate.getMonth() - 1 < 0 ? internalDate.getFullYear() - 1 : internalDate.getFullYear())}
                    className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm group-hover:shadow-md"
                  >
                    <ChevronUp className="h-4 w-4 text-slate-400 group-hover:text-primary" />
                  </button>
                  <div className="flex flex-col items-center select-none">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={typedMonth}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTypedMonth(val);
                        
                        // Try to parse as name
                        const monthIdx = SHORT_MONTHS.findIndex(m => m.toLowerCase() === val.toLowerCase());
                        if (monthIdx !== -1) {
                          updateDate(monthIdx, internalDate.getFullYear());
                          return;
                        }

                        // Try to parse as number
                        const num = parseInt(val);
                        if (!isNaN(num) && num >= 1 && num <= 12) {
                          updateDate(num - 1, internalDate.getFullYear());
                        }
                      }}
                      onBlur={() => {
                        setTypedMonth(SHORT_MONTHS[internalDate.getMonth()]);
                      }}
                      className="w-20 bg-transparent text-center text-2xl font-black text-slate-900 dark:text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg transition-all"
                    />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Month</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateDate(internalDate.getMonth() + 1 > 11 ? 0 : internalDate.getMonth() + 1, internalDate.getMonth() + 1 > 11 ? internalDate.getFullYear() + 1 : internalDate.getFullYear())}
                    className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm group-hover:shadow-md"
                  >
                    <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-primary" />
                  </button>
                </div>

                {/* Year Picker */}
                <div 
                  onWheel={handleWheelYear}
                  className="group flex flex-col items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors hover:border-primary/30"
                >
                  <button
                    type="button"
                    onClick={() => updateDate(internalDate.getMonth(), internalDate.getFullYear() - 1)}
                    className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm group-hover:shadow-md"
                  >
                    <ChevronUp className="h-4 w-4 text-slate-400 group-hover:text-primary" />
                  </button>
                  <div className="flex flex-col items-center select-none">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={typedYear}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTypedYear(val);
                        
                        if (val.length === 4) {
                          const num = parseInt(val);
                          if (!isNaN(num)) {
                            updateDate(internalDate.getMonth(), num);
                          }
                        }
                      }}
                      onBlur={() => {
                        setTypedYear(internalDate.getFullYear().toString());
                      }}
                      className="w-24 bg-transparent text-center text-2xl font-black text-slate-900 dark:text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg transition-all"
                    />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Year</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateDate(internalDate.getMonth(), internalDate.getFullYear() + 1)}
                    className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm group-hover:shadow-md"
                  >
                    <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-primary" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100/50 dark:border-blue-800/30 flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 animate-pulse" />
                     <p className="text-[10px] font-medium text-blue-700 dark:text-blue-400 leading-tight">
                    <span className="font-black">PRO TIP:</span> Use your mouse wheel over the cards to rapidly change values.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body)}

      {error && (
        <motion.p 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xs text-red-500 font-bold mt-1 ml-1"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
