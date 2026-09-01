"use client";
import { Activity } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Badge, Skeleton } from "@/components/ui";
import { AnalyticsNav } from "@/components/analytics/analytics-nav";
import { BarList, SectionCard } from "@/components/analytics/charts";
import { useWebAnalyticsRealtime } from "@/hooks/useWebAnalytics";

export default function RealtimeAnalyticsPage() {
  const realtime = useWebAnalyticsRealtime();
  const active = realtime.data?.activeVisitors ?? 0;

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Real-time</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Activity in the last 5 minutes · refreshes every 10 seconds · no personal data shown
            </p>
          </div>
          {realtime.isError ? (
            <Badge variant="error" size="md">
              <Activity className="h-3.5 w-3.5" /> Couldn&apos;t load
            </Badge>
          ) : (
            <Badge variant={active > 0 ? "success" : "default"} size="md">
              <Activity className="h-3.5 w-3.5" /> {active} active now
            </Badge>
          )}
        </div>

        <AnalyticsNav />

        {realtime.isError && (
          <p className="text-sm text-red-600 dark:text-red-400">
            Couldn&apos;t load real-time data. Retrying automatically — check back shortly.
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard title="Pages being viewed">
            {realtime.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <BarList
                rows={(realtime.data?.topPages ?? []).map((p) => ({ label: p.page, value: p.visitors }))}
                emptyText="Nobody on the site right now."
              />
            )}
          </SectionCard>

          <SectionCard title="Recent events" subtitle="Newest first">
            {realtime.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (realtime.data?.recentEvents ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No events in the last 5 minutes.</p>
            ) : (
              <div className="max-h-80 overflow-y-auto divide-y divide-border/40">
                {(realtime.data?.recentEvents ?? []).map((e, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 text-sm">
                    <Badge variant={e.name === "page_view" ? "default" : "purple"}>{e.name}</Badge>
                    <span className="truncate text-muted-foreground flex-1">{e.page ?? ""}</span>
                    <span className="flex-shrink-0 text-xs text-muted-foreground tabular-nums">
                      {new Date(e.ts).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </AdminLayout>
  );
}
