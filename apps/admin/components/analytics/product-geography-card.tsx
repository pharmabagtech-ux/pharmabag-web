"use client";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui";
import { BarList } from "@/components/analytics/charts";
import { AnalyticsRangePicker, lastNDays, toApiRange } from "@/components/analytics/analytics-range";
import { useWebAnalyticsProductGeography } from "@/hooks/useWebAnalytics";

/**
 * "Where are the people looking at this product?" — dropped onto the admin
 * product page.
 *
 * Takes both identifiers on purpose: `productId` matches product-tagged
 * events, `path` matches plain views of the product's own detail page. The API
 * ORs them, which is what makes historical traffic (recorded before events
 * carried a product) visible at all. See `productGeography` in the API.
 *
 * Everything is ranked by VISITORS rather than views, since the question being
 * asked is "which city has the most demand", and one buyer reloading a page
 * twenty times is not twenty buyers.
 */
export function ProductGeographyCard({
  productId,
  path,
  productName,
}: {
  productId: string | undefined;
  path?: string;
  productName?: string;
}) {
  const [range, setRange] = useState<DateRange | undefined>(() => lastNDays(30));
  const { from, to } = useMemo(() => toApiRange(range), [range]);
  const geo = useWebAnalyticsProductGeography(productId, from, to, path);

  const totals = geo.data?.totals;
  const states = geo.data?.states ?? [];
  const cities = geo.data?.cities ?? [];
  const countries = geo.data?.countries ?? [];

  const topCity = cities[0];
  const topState = states[0];

  return (
    <div className="glass-card rounded-2xl p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Where viewers are
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {productName ? `Locations of visitors who viewed ${productName}` : "Locations of visitors who viewed this product"}
          </p>
        </div>
        <AnalyticsRangePicker value={range} onChange={setRange} />
      </div>

      {geo.isError ? (
        <p className="text-sm text-red-600 dark:text-red-400">
          Couldn&apos;t load location data for this product.
        </p>
      ) : geo.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (totals?.views ?? 0) === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          No views recorded for this product in this period.
        </p>
      ) : (
        <>
          {/* The headline answer, so it does not have to be read off a chart. */}
          <div className="flex flex-wrap gap-6">
            <Stat label="Views" value={String(totals?.views ?? 0)} />
            <Stat label="Unique visitors" value={String(totals?.visitors ?? 0)} />
            {topState && <Stat label="Top state" value={`${topState.name} (${topState.visitors})`} />}
            {topCity && <Stat label="Top city" value={`${topCity.name} (${topCity.visitors})`} />}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                States
              </h3>
              <BarList
                rows={states.map((s) => ({ label: s.name, value: s.visitors }))}
                emptyText="No located Indian views in this period."
              />
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Cities
              </h3>
              <BarList
                rows={cities.map((c) => ({
                  label: c.region ? `${c.name}, ${c.region}` : c.name,
                  value: c.visitors,
                }))}
                emptyText="No city-level data in this period."
              />
            </div>
          </div>

          {/* Only worth the space when some traffic is actually international. */}
          {countries.filter((c) => c.name !== "India" && c.name !== "Unknown").length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Countries
              </h3>
              <BarList rows={countries.map((c) => ({ label: c.name, value: c.visitors }))} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold text-foreground mt-0.5">{value}</div>
    </div>
  );
}
