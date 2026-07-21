"use client";
import * as React from "react";
import { format, subDays, startOfMonth, endOfMonth, startOfYesterday, endOfYesterday, startOfDay, endOfDay } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { DateRange, DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "./index";
import { motion, AnimatePresence } from "framer-motion";

import "react-day-picker/style.css";

export interface DateRangePickerProps {
  className?: string;
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  align?: "start" | "center" | "end";
}

export function DateRangePicker({
  className,
  value,
  onChange,
  align = "start",
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [range, setRange] = React.useState<DateRange | undefined>(value);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setRange(value);
  }, [value]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleApply = () => {
    onChange?.(range);
    setOpen(false);
  };

  const handleCancel = () => {
    setRange(value);
    setOpen(false);
  };

  const quickRanges = [
    { label: "Today", getValue: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
    { label: "Yesterday", getValue: () => ({ from: startOfYesterday(), to: endOfYesterday() }) },
    { label: "Last 7 Days", getValue: () => ({ from: startOfDay(subDays(new Date(), 6)), to: endOfDay(new Date()) }) },
    { label: "Last 30 Days", getValue: () => ({ from: startOfDay(subDays(new Date(), 29)), to: endOfDay(new Date()) }) },
    { label: "This Month", getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
    { label: "All Time", getValue: () => ({ from: startOfDay(new Date(2000, 0, 1)), to: endOfDay(new Date()) }) },
  ];

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <Button
        variant="outline"
        size="md"
        className={cn(
          "justify-start text-left font-normal w-full sm:w-[280px] rounded-xl border-border bg-background",
          !range && "text-muted-foreground"
        )}
        onClick={() => setOpen(!open)}
        leftIcon={<CalendarIcon className="mr-2 h-4 w-4" />}
      >
        {range?.from ? (
          range.to ? (
            <>
              {format(range.from, "LLL dd, y")} - {format(range.to, "LLL dd, y")}
            </>
          ) : (
            format(range.from, "LLL dd, y")
          )
        ) : (
          <span>Pick a date range</span>
        )}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute z-[100] mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4",
              align === "end" ? "right-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "left-0"
            )}
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* Quick Ranges */}
              <div className="flex flex-col gap-1 border-r border-gray-50 pr-4 hidden md:flex min-w-[140px]">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> Quick Filter
                </div>
                {quickRanges.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => setRange(q.getValue())}
                    className="text-left px-3 py-2 text-sm rounded-lg hover:bg-primary/5 hover:text-primary transition-colors font-medium text-gray-600"
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2 px-1">
                   <div className="flex-1">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Start Date</div>
                      <div className="px-3 py-2 rounded-lg border border-gray-100 text-sm font-semibold text-gray-700 bg-gray-50/50">
                        {range?.from ? format(range.from, "PP") : "Select date"}
                      </div>
                   </div>
                   <ChevronRight className="w-4 h-4 text-gray-300 mt-4" />
                   <div className="flex-1">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">End Date</div>
                      <div className="px-3 py-2 rounded-lg border border-gray-100 text-sm font-semibold text-gray-700 bg-gray-50/50">
                        {range?.to ? format(range.to, "PP") : "Select date"}
                      </div>
                   </div>
                </div>

                <DayPicker
                  mode="range"
                  defaultMonth={range?.from}
                  selected={range}
                  onSelect={setRange}
                  numberOfMonths={2}
                  className="p-0 border-none m-0"
                  classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                    month: "space-y-4",
                    month_caption: "flex justify-center pt-1 relative items-center",
                    caption_label: "text-sm font-bold text-gray-900",
                    nav: "space-x-1 flex items-center",
                    button_previous: cn(
                      "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity rounded-md border border-gray-200 flex items-center justify-center absolute left-1 z-10"
                    ),
                    button_next: cn(
                      "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity rounded-md border border-gray-200 flex items-center justify-center absolute right-1 z-10"
                    ),
                    month_grid: "w-full border-collapse space-y-1",
                    weekdays: "flex",
                    weekday: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                    week: "flex w-full mt-2",
                    day: cn(
                      "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-gray-100 transition-colors"
                    ),
                    day_button: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md",
                    range_end: "day-range-end",
                    selected:
                      "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                    today: "bg-accent text-accent-foreground font-bold",
                    outside: "day-outside text-muted-foreground opacity-50",
                    disabled: "text-muted-foreground opacity-50",
                    range_middle:
                      "aria-selected:bg-accent aria-selected:text-accent-foreground",
                    hidden: "invisible",
                  }}
                  components={{
                    Chevron: ({ orientation }) => orientation === "left" ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />,
                  }}
                />

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-50">
                   <Button variant="ghost" size="sm" onClick={handleCancel}>Cancel</Button>
                   <Button variant="primary" size="sm" onClick={handleApply}>Apply Range</Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .rdp-day_selected:not(.rdp-day_outside) {
          background-color: hsl(var(--primary)) !important;
          color: white !important;
        }
        .rdp-day_selected:hover:not(.rdp-day_outside) {
          background-color: hsl(var(--primary)) !important;
          opacity: 0.9;
        }
        .rdp-day_range_middle:not(.rdp-day_outside) {
          background-color: rgba(var(--primary-rgb), 0.1) !important;
          color: hsl(var(--primary)) !important;
        }
      `}</style>
    </div>
  );
}
