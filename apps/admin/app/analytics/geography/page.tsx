"use client";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Badge, Skeleton } from "@/components/ui";
import { AnalyticsNav } from "@/components/analytics/analytics-nav";
import { BarList, SectionCard } from "@/components/analytics/charts";
import { AnalyticsRangePicker, lastNDays, toApiRange } from "@/components/analytics/analytics-range";
import { useWebAnalyticsGeography } from "@/hooks/useWebAnalytics";

/**
 * Where visitors are, by country, Indian state and Indian city.
 *
 * India-first: the buyer base is licensed Indian pharmacies and hospitals, so
 * states and cities are the actionable dimensions and are scoped to India by
 * the API. Other countries appear in the country list only — mixing Gujarat
 * and Dubai into one "regions" ranking would make neither readable.
 *
 * Ranked by VISITORS, not sessions: one buyer refreshing a page many times
 * would otherwise look like a whole city of demand.
 */
export default function GeographyAnalyticsPage() {
  const [range, setRange] = useState<DateRange | undefined>(() => lastNDays(30));
  const { from, to } = useMemo(() => toApiRange(range), [range]);
  const geo = useWebAnalyticsGeography(from, to);

  const coverage = geo.data?.coverage;
  // Read straight off `geo.data` so these keep a stable identity between
  // renders; a `?? []` fallback would allocate a new array every render and
  // invalidate anything memoised on it.
  const countries = geo.data?.countries;
  const states = geo.data?.states;
  const cities = geo.data?.cities;

  // Non-India traffic collapsed into one comparison row, so a handful of
  // international sessions cannot push Indian states off the chart.
  const international = useMemo(
    () => (countries ?? []).filter((c) => c.code !== "IN" && c.name !== "Unknown"),
    [countries],
  );
  const internationalVisitors = international.reduce((sum, c) => sum + c.visitors, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-semibold text-2xl text-foreground">Geography</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Which countries, states and cities your visitors come from
          </p>
        </div>

        <AnalyticsNav />

        {geo.isError && (
          <p className="text-sm text-red-600 dark:text-red-400">
            Couldn&apos;t load geography data. Retrying automatically — check back shortly.
          </p>
        )}

        <AnalyticsRangePicker value={range} onChange={setRange} />

        {/*
          Coverage is shown before the breakdowns on purpose. Without it, a
          report full of "Unknown" reads as "nobody visited", when the real
          cause is an unset GEOIP_CITY_DB_PATH.
        */}
        {!geo.isLoading && coverage && coverage.resolvedPct < 80 && (
          <SectionCard
            title="Location coverage"
            subtitle="Sessions whose IP could be resolved to a place"
          >
            <div className="space-y-2">
              <Badge variant={coverage.resolvedPct === 0 ? "error" : "warning"} size="md">
                {coverage.resolvedPct}% located
              </Badge>
              <p className="text-sm text-muted-foreground">
                {coverage.resolvedSessions} of {coverage.resolvedSessions + coverage.unresolvedSessions} sessions
                have a location.{" "}
                {coverage.resolvedPct === 0
                  ? "None do — the GeoLite2 database is probably not installed on the API server (GEOIP_CITY_DB_PATH). Sessions recorded before it is installed stay unlocated."
                  : "Sessions recorded before location tracking was enabled stay unlocated, so older ranges read lower."}
              </p>
            </div>
          </SectionCard>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard title="Indian states" subtitle="Ranked by unique visitors">
            {geo.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <BarList
                rows={(states ?? []).map((s) => ({ label: s.name, value: s.visitors }))}
                emptyText="No located Indian traffic in this period yet."
              />
            )}
          </SectionCard>

          <SectionCard title="Indian cities" subtitle="Ranked by unique visitors">
            {geo.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <BarList
                rows={(cities ?? []).map((c) => ({
                  label: c.region ? `${c.name}, ${c.region}` : c.name,
                  value: c.visitors,
                }))}
                emptyText="No city-level data in this period yet. City resolution is less reliable than state for Indian mobile networks."
              />
            )}
          </SectionCard>
        </div>

        <SectionCard
          title="Countries"
          subtitle={
            internationalVisitors > 0
              ? `${internationalVisitors} visitors from outside India across ${international.length} countries`
              : "All located traffic is domestic"
          }
        >
          {geo.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <BarList
              rows={(countries ?? []).map((c) => ({ label: c.name, value: c.visitors }))}
              emptyText="No located traffic in this period yet."
            />
          )}
        </SectionCard>
      </div>
    </AdminLayout>
  );
}
