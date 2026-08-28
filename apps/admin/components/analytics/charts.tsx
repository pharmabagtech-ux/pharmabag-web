"use client";
import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="mb-4">
        <h2 className="font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function BarList({
  rows,
  emptyText = "No data yet.",
}: {
  rows: Array<{ label: string; value: number }>;
  emptyText?: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">{emptyText}</p>;
  }
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-3">
          <span className="text-sm text-foreground truncate flex-1 min-w-0" title={row.label}>
            {row.label}
          </span>
          <div className="w-32 h-2 bg-muted/30 rounded-full overflow-hidden flex-shrink-0">
            <div
              className="h-full bg-primary/70 rounded-full"
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-foreground w-8 text-right flex-shrink-0">
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Categorical hues in FIXED order (never cycled) — for multi-series line
 * charts where color encodes series identity. Ranked breakdowns (BarList
 * above) use a single hue for magnitude instead, since rank ≠ identity.
 */
const LIGHT_SERIES = ["#7B2FBE", "#0891B2", "#D97706"];
const DARK_SERIES = ["#9D5CE6", "#0FA3B1", "#D97706"];

export function useChartPalette(): string[] {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    const update = () => setDark(el.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return dark ? DARK_SERIES : LIGHT_SERIES;
}

/** KPI with a comparison delta vs the previous period. */
export function KpiCard({
  label,
  value,
  previous,
  format,
}: {
  label: string;
  value: number | undefined;
  previous?: number;
  format?: (n: number) => string;
}) {
  const fmt = format ?? ((n: number) => n.toLocaleString());
  const hasDelta = previous !== undefined && previous > 0 && value !== undefined;
  const deltaPct = hasDelta ? ((value! - previous!) / previous!) * 100 : null;
  const Dir = deltaPct === null ? Minus : deltaPct >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="glass-card rounded-2xl p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold text-foreground mt-1">{value === undefined ? "…" : fmt(value)}</p>
      <p
        className={cn(
          "flex items-center gap-0.5 text-xs mt-0.5",
          deltaPct === null ? "text-muted-foreground" : deltaPct >= 0 ? "text-green-600" : "text-red-500",
        )}
      >
        <Dir className="h-3 w-3" aria-hidden />
        {deltaPct === null ? "no prior data" : `${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(1)}% vs previous`}
      </p>
    </div>
  );
}

interface TrendPoint {
  date: string;
  [key: string]: number | string;
}

/** Multi-series line chart: thin 2px lines, crosshair tooltip, legend (>=2 series). */
export function TrendChart({
  data,
  series,
  height = 260,
}: {
  data: TrendPoint[];
  series: Array<{ key: string; label: string }>;
  height?: number;
}) {
  const palette = useChartPalette();
  if (!data.length) {
    return <p className="text-sm text-muted-foreground py-10 text-center">No data yet for this period.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(d: string) => d.slice(5)}
          minTickGap={24}
        />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={44} allowDecimals={false} />
        <Tooltip
          cursor={{ stroke: "currentColor", strokeOpacity: 0.2 }}
          contentStyle={{ borderRadius: 12, border: "1px solid rgba(128,128,128,0.25)", background: "var(--card, #fff)", fontSize: 12 }}
        />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={palette[i % palette.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
