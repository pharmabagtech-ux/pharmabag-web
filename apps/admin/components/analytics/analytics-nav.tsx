"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * The single tab strip across the top of the platform overview.
 *
 * Dashboard and Analytics used to be two sidebar entries showing the same
 * numbers from the same `useAdminDashboard` hook — seven of eleven cards were
 * duplicated. They are now one page with these tabs: "Business" is the trading
 * view, the rest are the website-visitor views.
 *
 * Only tabs whose pages exist are listed. A tab that 404s is worse than a tab
 * that is missing.
 */
const SECTIONS = [
  { label: "Business", href: "/dashboard" },
  { label: "Traffic", href: "/analytics/traffic" },
  { label: "Audience", href: "/analytics/audience" },
  { label: "Real-Time", href: "/analytics/realtime" },
];

export function AnalyticsNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto" aria-label="Overview sections">
      {SECTIONS.map(({ label, href }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
