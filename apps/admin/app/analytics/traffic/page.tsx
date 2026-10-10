"use client";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Skeleton } from "@/components/ui";
import { AnalyticsNav } from "@/components/analytics/analytics-nav";
import { AnalyticsRangePicker, lastNDays, toApiRange } from "@/components/analytics/analytics-range";
import { BarList, KpiCard, SectionCard, TrendChart } from "@/components/analytics/charts";
import { useWebAnalyticsTraffic } from "@/hooks/useWebAnalytics";

const CATEGORY_LABELS: Record<string, string> = {
  ORGANIC_SEARCH: "Organic search",
  AI: "AI assistants",
  SOCIAL: "Social",
  VIDEO: "Video",
  REFERRAL: "Referral",
  DIRECT: "Direct",
  PAID: "Paid",
  EMAIL: "Email",
  MESSAGING: "Messaging",
  UNKNOWN: "Unknown",
};

export default function TrafficAnalyticsPage() {
  const [range, setRange] = useState<DateRange | undefined>(() => lastNDays(30));
  const { from, to } = useMemo(() => toApiRange(range), [range]);

  const traffic = useWebAnalyticsTraffic(from, to);
  const current = traffic.data?.current;
  const previous = traffic.data?.previous;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-semibold text-2xl text-foreground">Traffic</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Visitor and session trends, bots excluded</p>
        </div>

        <AnalyticsNav />

        {traffic.isError && (
          <p className="text-sm text-red-600 dark:text-red-400">
            Couldn&apos;t load traffic data. Retrying automatically — check back shortly.
          </p>
        )}

        <AnalyticsRangePicker value={range} onChange={setRange} />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Visitors" value={current?.visitors} previous={previous?.visitors} />
          <KpiCard label="New visitors" value={current?.newVisitors} previous={previous?.newVisitors} />
          <KpiCard label="Sessions" value={current?.sessions} previous={previous?.sessions} />
          <KpiCard label="Page views" value={current?.pageviews} previous={previous?.pageviews} />
        </div>

        <SectionCard title="Daily trend" subtitle="Visitors and sessions per day">
          {traffic.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <TrendChart
              data={traffic.data?.daily ?? []}
              series={[
                { key: "visitors", label: "Visitors" },
                { key: "sessions", label: "Sessions" },
              ]}
            />
          )}
        </SectionCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard title="Acquisition channels" subtitle="Sessions by channel">
            {traffic.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <BarList
                rows={(traffic.data?.channels ?? []).map((c) => ({
                  label: CATEGORY_LABELS[c.category] ?? c.category,
                  value: c.sessions,
                }))}
              />
            )}
          </SectionCard>

          <SectionCard title="Top referrer domains" subtitle="Real domains that sent traffic">
            {traffic.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <BarList
                rows={(traffic.data?.referrers ?? []).map((r) => ({ label: r.domain, value: r.sessions }))}
              />
            )}
          </SectionCard>
        </div>
      </div>
    </AdminLayout>
  );
}
