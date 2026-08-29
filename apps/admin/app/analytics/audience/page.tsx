"use client";
import { useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Badge, Skeleton } from "@/components/ui";
import { AnalyticsNav } from "@/components/analytics/analytics-nav";
import { BarList, SectionCard } from "@/components/analytics/charts";
import { useWebAnalyticsAudience } from "@/hooks/useWebAnalytics";

const PERIODS = [
  { k: "7d", l: "7 Days", days: 7 },
  { k: "30d", l: "30 Days", days: 30 },
  { k: "90d", l: "90 Days", days: 90 },
];

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function AudienceAnalyticsPage() {
  const [period, setPeriod] = useState("30d");
  const { from, to } = useMemo(() => {
    const days = PERIODS.find((p) => p.k === period)?.days ?? 30;
    const toDate = new Date();
    const fromDate = new Date(toDate.getTime() - days * 24 * 60 * 60 * 1000);
    return { from: isoDate(fromDate), to: isoDate(toDate) };
  }, [period]);

  const audience = useWebAnalyticsAudience(from, to);
  const quality = audience.data?.quality;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-semibold text-2xl text-foreground">Audience</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Devices, browsers, and traffic quality</p>
        </div>

        <AnalyticsNav active="audience" />

        {audience.isError && (
          <p className="text-sm text-red-600 dark:text-red-400">
            Couldn&apos;t load audience data. Retrying automatically — check back shortly.
          </p>
        )}

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Period:</span>
          {PERIODS.map(({ k, l }) => (
            <button
              key={k}
              onClick={() => setPeriod(k)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                period === k ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:bg-accent/60"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

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
