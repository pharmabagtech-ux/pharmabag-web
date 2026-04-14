"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

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

export function ExpiryPicker({ value, onChange, label, error, className, required }: ExpiryPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getInitialDate = () => {
    const now = new Date();
    const nextYear = new Date(now.getFullYear() + 1, now.getMonth(), 1);
    
    if (!value) return nextYear;
    const date = new Date(value);
    return isNaN(date.getTime()) ? nextYear : date;
  };

  const [internalDate, setInternalDate] = useState(getInitialDate());
  const [typedMonth, setTypedMonth] = useState(SHORT_MONTHS[internalDate.getMonth()]);
  const [typedYear, setTypedYear] = useState(internalDate.getFullYear().toString());

  useEffect(() => {
    setTypedMonth(SHORT_MONTHS[internalDate.getMonth()]);
    setTypedYear(internalDate.getFullYear().toString());
  }, [internalDate]);

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) setInternalDate(d);
    }
  }, [value]);

  const updateDate = (newMonth: number, newYear: number) => {
    const d = new Date(newYear, newMonth, 1);
    setInternalDate(d);
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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const monthLabel = SHORT_MONTHS[internalDate.getMonth()];
  const yearLabel = internalDate.getFullYear();

  return (
    <div className={`space-y-1 relative ${isOpen ? 'z-50' : 'z-10'} ${className || ''}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full h-12 rounded-xl border bg-white px-4 py-2 cursor-pointer transition-all duration-200 ${
          isOpen ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-gray-200 hover:border-emerald-400'
        } ${error ? 'border-red-300 bg-red-50' : ''}`}
      >
        <div className="flex items-center gap-3">
          <Calendar className={`h-4 w-4 ${isOpen ? 'text-emerald-500' : 'text-gray-400'}`} />
          <span className={`text-sm font-medium ${!value ? 'text-gray-400' : 'text-gray-900'}`}>
            {value ? `${MONTHS[internalDate.getMonth()]} ${yearLabel}` : "Pick Expiry Date"}
          </span>
        </div>
        <ChevronsUpDown className="h-4 w-4 text-gray-400" />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 5 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute z-50 left-0 right-0 md:w-72 bg-white border border-gray-200 rounded-2xl shadow-xl p-4"
          >
            <div className="grid grid-cols-2 gap-3">
              {/* Month */}
              <div 
                onWheel={handleWheelMonth}
                className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-emerald-200 transition-colors"
              >
                <button type="button" onClick={() => updateDate(internalDate.getMonth() - 1 < 0 ? 11 : internalDate.getMonth() - 1, internalDate.getMonth() - 1 < 0 ? internalDate.getFullYear() - 1 : internalDate.getFullYear())} className="p-1 hover:bg-white rounded-lg shadow-sm">
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  value={typedMonth}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTypedMonth(val);
                    const monthIdx = SHORT_MONTHS.findIndex(m => m.toLowerCase() === val.toLowerCase());
                    if (monthIdx !== -1) {
                      updateDate(monthIdx, internalDate.getFullYear());
                      return;
                    }
                    const num = parseInt(val);
                    if (!isNaN(num) && num >= 1 && num <= 12) {
                      updateDate(num - 1, internalDate.getFullYear());
                    }
                  }}
                  onBlur={() => setTypedMonth(SHORT_MONTHS[internalDate.getMonth()])}
                  className="w-16 bg-transparent text-center text-lg font-bold text-gray-900 focus:outline-none tabular-nums"
                />
                <button type="button" onClick={() => updateDate(internalDate.getMonth() + 1 > 11 ? 0 : internalDate.getMonth() + 1, internalDate.getMonth() + 1 > 11 ? internalDate.getFullYear() + 1 : internalDate.getFullYear())} className="p-1 hover:bg-white rounded-lg shadow-sm">
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
              </div>

              {/* Year */}
              <div 
                onWheel={handleWheelYear}
                className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-emerald-200 transition-colors"
              >
                <button type="button" onClick={() => updateDate(internalDate.getMonth(), internalDate.getFullYear() - 1)} className="p-1 hover:bg-white rounded-lg shadow-sm">
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                </button>
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
                  onBlur={() => setTypedYear(internalDate.getFullYear().toString())}
                  className="w-20 bg-transparent text-center text-lg font-bold text-gray-900 focus:outline-none tabular-nums"
                />
                <button type="button" onClick={() => updateDate(internalDate.getMonth(), internalDate.getFullYear() + 1)} className="p-1 hover:bg-white rounded-lg shadow-sm">
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-3 uppercase tracking-widest font-bold">Scroll over cards to change</p>
            <button
               type="button"
               onClick={() => {
                 const nextYear = new Date();
                 nextYear.setFullYear(nextYear.getFullYear() + 1);
                 updateDate(nextYear.getMonth(), nextYear.getFullYear());
               }}
               className="w-full mt-3 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 transition-colors"
            >
              Set to Next Year
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
