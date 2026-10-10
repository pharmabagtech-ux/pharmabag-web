"use client";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Badge, Skeleton } from "@/components/ui";
import { AnalyticsNav } from "@/components/analytics/analytics-nav";
import { AnalyticsRangePicker, lastNDays, toApiRange } from "@/components/analytics/analytics-range";
import { BarList, SectionCard } from "@/components/analytics/charts";
import { useWebAnalyticsAudience } from "@/hooks/useWebAnalytics";

export default function AudienceAnalyticsPage() {
  const [range, setRange] = useState<DateRange | undefined>(() => lastNDays(30));
  const { from, to } = useMemo(() => toApiRange(range), [range]);

  const audience = useWebAnalyticsAudience(from, to);
  const quality = audience.data?.quality;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-semibold text-2xl text-foreground">Audience</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Devices, browsers, and traffic quality</p>
        </div>

        <AnalyticsNav />

        {audience.isError && (
          <p className="text-sm text-red-600 dark:text-red-400">
            Couldn&apos;t load audience data. Retrying automatically — check back shortly.
          </p>
        )}

        <AnalyticsRangePicker value={range} onChange={setRange} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SectionCard title="Devices">
            {audience.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <BarList rows={(audience.data?.devices ?? []).map((d) => ({ label: d.deviceType, value: d.sessions }))} />
            )}
          </SectionCard>

          <SectionCard title="Operating systems">
            {audience.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <BarList rows={(audience.data?.os ?? []).map((o) => ({ label: o.os, value: o.sessions }))} />
            )}
          </SectionCard>

          <SectionCard title="Browsers">
            {audience.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <BarList rows={(audience.data?.browsers ?? []).map((b) => ({ label: b.browser, value: b.sessions }))} />
            )}
          </SectionCard>
        </div>

        <SectionCard title="Traffic quality" subtitle="Bots are stored but never mixed into the human breakdowns above">
          {audience.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : audience.isError ? (
            <Badge variant="error" size="md">Couldn&apos;t load</Badge>
          ) : (
            <div className="space-y-3">
              <Badge variant={(quality?.botSessions ?? 0) > (quality?.humanSessions ?? 0) ? "warning" : "success"} size="md">
                {quality?.humanSessions ?? 0} human / {quality?.botSessions ?? 0} bot
              </Badge>
              <p className="text-sm text-muted-foreground">
                {quality?.lowEngagementSessions ?? 0} human sessions ({quality?.lowEngagementPct ?? 0}%) bounced in under 5 seconds.
              </p>
            </div>
          )}
        </SectionCard>
      </div>
    </AdminLayout>
  );
}
