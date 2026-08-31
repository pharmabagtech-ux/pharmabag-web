"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Globe,
  Link2,
  Newspaper,
  Package,
  Route,
  Settings2,
  TriangleAlert,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Badge, StatCard } from "@/components/ui";
import { useRedirects, use404s } from "@/hooks/useRedirects";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useBlogPosts } from "@/hooks/useBlog";

const SECTIONS = [
  {
    href: "/seo/settings",
    title: "Site settings",
    description:
      "Search Console and Bing verification, Google Analytics, and the default title and description the whole storefront falls back to.",
    icon: Settings2,
  },
  {
    href: "/seo/redirects",
    title: "Redirects & 404s",
    description:
      "301 redirects with hit tracking, and the log of every dead URL visitors and crawlers have hit — redirect them in one click.",
    icon: Route,
  },
  {
    href: "/csv-upload",
    title: "Product SEO",
    description:
      "Per-product title, description, share image and image alt text — edit any catalogue product to override its generated head.",
    icon: Package,
  },
];

export default function SeoOverviewPage() {
  const settings = useSiteSettings();
  const redirects = useRedirects();
  const notFound = use404s(false);
  const posts = useBlogPosts({ limit: 1 });
  const published = useBlogPosts({ status: "PUBLISHED", limit: 1 });

  const redirectCount = redirects.data?.length ?? 0;
  const openNotFound = notFound.data?.length ?? 0;
  const postCount = posts.data?.meta?.total ?? 0;
  const publishedCount = published.data?.meta?.total ?? 0;

  const s = settings.data ?? {};
  const verifications = [
    { label: "Google Search Console", key: "gscVerification" as const },
    { label: "Bing Webmaster Tools", key: "bingVerification" as const },
    { label: "Google Analytics (GA4)", key: "ga4MeasurementId" as const },
  ];
  const connected = verifications.filter((v) => (s as Record<string, unknown>)[v.key]).length;

  const fmt = (loading: boolean, n: number) => (loading ? "…" : String(n));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">SEO</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Search &amp; AI visibility management — overrides apply on top of the storefront&apos;s generated
            defaults.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Search tools connected"
            value={settings.isLoading ? "…" : `${connected}/3`}
            icon={Globe}
            delay={0}
            alert={!settings.isLoading && connected < 3}
            change={!settings.isLoading && connected < 3 ? "finish connecting in Site settings" : undefined}
            href="/seo/settings"
          />
          <StatCard
            title="Published posts"
            value={fmt(published.isLoading, publishedCount)}
            icon={Newspaper}
            delay={0.05}
            change={`${postCount} total including drafts`}
            href="/blogs"
          />
          <StatCard
            title="Redirects"
            value={fmt(redirects.isLoading, redirectCount)}
            icon={Link2}
            delay={0.1}
            href="/seo/redirects"
          />
          <StatCard
            title="Unresolved 404s"
            value={fmt(notFound.isLoading, openNotFound)}
            icon={TriangleAlert}
            delay={0.15}
            alert={openNotFound > 0}
            change={openNotFound > 0 ? "dead URLs waiting to be redirected" : undefined}
            href="/seo/redirects"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {SECTIONS.map(({ href, title, description, icon: Icon }, i) => (
            <motion.div
              key={href}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05, duration: 0.4 }}
            >
              <Link
                href={href}
                className="glass-card rounded-2xl p-5 flex flex-col gap-3 h-full hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              >
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground flex items-center gap-1.5">
                    {title} <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">{description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="glass-card rounded-2xl overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border/50">
              <h2 className="font-semibold text-foreground text-sm">Search engine connections</h2>
            </div>
            <div className="divide-y divide-border/40">
              {verifications.map((v) => {
                const on = Boolean((s as Record<string, unknown>)[v.key]);
                return (
                  <div key={v.key} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm text-foreground">{v.label}</span>
                    <Badge variant={on ? "success" : "warning"}>{on ? "Connected" : "Not connected"}</Badge>
                  </div>
                );
              })}
              <div className="px-4 py-3 text-xs text-muted-foreground">
                Verification codes are pasted in Site settings. Until Search Console is connected, no search
                performance data is reported back to you.
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="glass-card rounded-2xl overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border/50">
              <h2 className="font-semibold text-foreground text-sm">Coverage</h2>
            </div>
            <div className="divide-y divide-border/40">
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-foreground">Dead URLs awaiting a redirect</span>
                <Badge variant={openNotFound > 0 ? "warning" : "success"}>
                  {fmt(notFound.isLoading, openNotFound)}
                </Badge>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-foreground">Redirects in place</span>
                <Badge variant={redirectCount > 0 ? "purple" : "outline"}>
                  {fmt(redirects.isLoading, redirectCount)}
                </Badge>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-foreground">Draft posts not yet published</span>
                <Badge variant={postCount - publishedCount > 0 ? "warning" : "success"}>
                  {fmt(posts.isLoading || published.isLoading, Math.max(0, postCount - publishedCount))}
                </Badge>
              </div>
              <div className="px-4 py-3 text-xs text-muted-foreground">
                Pages without an override still get sensible generated metadata — overrides are only needed
                where you want to say something different.
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}
