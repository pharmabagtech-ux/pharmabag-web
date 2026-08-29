"use client";
import { useRouter } from "next/navigation";
import { Tabs } from "@/components/ui";

const TABS = [
  { value: "platform", label: "Platform" },
  { value: "realtime", label: "Real-time" },
  { value: "traffic", label: "Traffic" },
  { value: "audience", label: "Audience" },
];

const ROUTES: Record<string, string> = {
  platform: "/analytics",
  realtime: "/analytics/realtime",
  traffic: "/analytics/traffic",
  audience: "/analytics/audience",
};

export function AnalyticsNav({ active }: { active: "platform" | "realtime" | "traffic" | "audience" }) {
  const router = useRouter();
  return (
    <Tabs
      tabs={TABS}
      active={active}
      onChange={(value) => router.push(ROUTES[value] ?? "/analytics")}
    />
  );
}
