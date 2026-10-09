"use client";
import { endOfDay, startOfDay, subDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { DateRangePicker } from "@/components/ui/date-range-picker";

/**
 * Shared date-range control for the analytics screens.
 *
 * Replaces the fixed 7/30/90 button trio each page had hard-coded, so an
 * arbitrary window can be picked. The quick presets remain, since they are what
 * gets used day to day.
 *
 * TWO BUGS THIS FIXES, both from the old `isoDate(new Date())` approach:
 *
 *  1. Today was always missing. Report queries bound the window with
 *     `startedAt < to`, and the pages sent `to` as today's date at midnight, so
 *     everything that happened today fell outside every range. "Last 7 days"
 *     really meant "the 7 days ending last midnight".
 *  2. The window was an hour short or long around DST/timezone boundaries,
 *     because a `YYYY-MM-DD` string is parsed as midnight *UTC* while the
 *     dates were built in local time.
 *
 * Both are handled by sending full ISO timestamps built from local
 * `startOfDay`/`endOfDay`: the end bound lands at 23:59:59.999 of the chosen
 * final day, which an exclusive `<` comparison includes in full.
 */

export const ANALYTICS_PRESETS = [
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
] as const;

/** A window covering the last `days` days, inclusive of today. */
export function lastNDays(days: number): DateRange {
  return {
    from: startOfDay(subDays(new Date(), days - 1)),
    to: endOfDay(new Date()),
  };
}

/**
 * Converts a picked range into the `from`/`to` the API expects.
 *
 * `to` is exclusive server-side, so passing end-of-day includes the final day.
 * Falls back to a 30-day window if the picker is mid-selection with only a
 * `from`, which keeps the query valid instead of sending `to=undefined`.
 */
export function toApiRange(range: DateRange | undefined): { from: string; to: string } {
  const from = range?.from ?? lastNDays(30).from!;
  const to = range?.to ?? endOfDay(new Date());
  return { from: startOfDay(from).toISOString(), to: endOfDay(to).toISOString() };
}

/** True when `range` is exactly the last-N-days preset window. */
function matchesPreset(range: DateRange | undefined, days: number): boolean {
  if (!range?.from || !range?.to) return false;
  const preset = lastNDays(days);
  return (
    startOfDay(range.from).getTime() === preset.from!.getTime() &&
    endOfDay(range.to).getTime() === preset.to!.getTime()
  );
}

export function AnalyticsRangePicker({
  value,
  onChange,
  className,
}: {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="flex gap-1" role="group" aria-label="Quick date ranges">
        {ANALYTICS_PRESETS.map((preset) => {
          const active = matchesPreset(value, preset.days);
          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => onChange(lastNDays(preset.days))}
              aria-pressed={active}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                active
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      <DateRangePicker value={value} onChange={onChange} align="end" />
    </div>
  );
}
