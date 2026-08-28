"use client";
import { useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { AnalyticsNav } from "@/components/analytics/analytics-nav";
import { BarList, KpiCard, SectionCard, TrendChart } from "@/components/analytics/charts";
import { useWebAnalyticsTraffic } from "@/hooks/useWebAnalytics";

const PERIODS = [
  { k: "7d", l: "7 Days", days: 7 },
  { k: "30d", l: "30 Days", days: 30 },
  { k: "90d", l: "90 Days", days: 90 },
];

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

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function TrafficAnalyticsPage() {
  const [period, setPeriod] = useState("30d");
  const { from, to } = useMemo(() => {
    const days = PERIODS.find((p) => p.k === period)?.days ?? 30;
    const toDate = new Date();
    const fromDate = new Date(toDate.getTime() - days * 24 * 60 * 60 * 1000);
    return { from: isoDate(fromDate), to: isoDate(toDate) };
  }, [period]);

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

        <AnalyticsNav active="traffic" />

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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Visitors" value={current?.visitors} previous={previous?.visitors} />
          <KpiCard label="New visitors" value={current?.newVisitors} previous={previous?.newVisitors} />
          <KpiCard label="Sessions" value={current?.sessions} previous={previous?.sessions} />
          <KpiCard label="Page views" value={current?.pageviews} previous={previous?.pageviews} />
        </div>

        <SectionCard title="Daily trend" subtitle="Visitors and sessions per day">
          <TrendChart
            data={traffic.data?.daily ?? []}
            series={[
              { key: "visitors", label: "Visitors" },
              { key: "sessions", label: "Sessions" },
            ]}
          />
        </SectionCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard title="Acquisition channels" subtitle="Sessions by channel">
            <BarList
              rows={(traffic.data?.channels ?? []).map((c) => ({
                label: CATEGORY_LABELS[c.category] ?? c.category,
                value: c.sessions,
              }))}
            />
          </SectionCard>

          <SectionCard title="Top referrer domains" subtitle="Real domains that sent traffic">
            <BarList
              rows={(traffic.data?.referrers ?? []).map((r) => ({ label: r.domain, value: r.sessions }))}
            />
          </SectionCard>
        </div>
      </div>
    </AdminLayout>
  );
}
