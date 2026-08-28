"use client";
import { useRouter } from "next/navigation";
import { Tabs } from "@/components/ui";

const TABS = [
  { value: "platform", label: "Platform" },
  { value: "realtime", label: "Real-time" },
];

export function AnalyticsNav({ active }: { active: "platform" | "realtime" }) {
  const router = useRouter();
  return (
    <Tabs
      tabs={TABS}
      active={active}
      onChange={(value) => router.push(value === "platform" ? "/analytics" : "/analytics/realtime")}
    />
  );
}
