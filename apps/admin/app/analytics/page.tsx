import { redirect } from "next/navigation";

/**
 * The Analytics overview was a second copy of the Dashboard - same
 * useAdminDashboard hook, seven of eleven cards identical. The business view
 * now lives on /dashboard as its Business tab; this keeps old links and
 * bookmarks working.
 */
export default function AnalyticsIndexPage() {
  redirect("/dashboard");
}
