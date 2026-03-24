"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSellerAuth } from "@/store";
import { useSellerMe } from "@/hooks/useSeller";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldAlert, Store } from "lucide-react";
import { SellerSidebar } from "./sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { SidebarProvider, useSidebar } from "@/context/sidebar-context";

/**
 * Single source of truth: User.status
 * Values: NEW | PENDING | APPROVED | REJECTED | BLOCKED
 *
 * The guard NEVER mutates status. It only reads from the server.
 */
function getUserStatus(user: any): string {
  if (!user) return "NEW";
  return String(user.status || "NEW").toUpperCase();
}

export function SellerGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuth, setUser } = useSellerAuth();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Always fetch the LATEST user from the server on mount.
  const {
    data: serverUser,
    isLoading: isLoadingProfile,
  } = useSellerMe(mounted && isAuth);

  // Sync server data into the local Zustand store (for offline/cache use only)
  useEffect(() => {
    if (serverUser) {
      setUser(serverUser as any);
    }
  }, [serverUser, setUser]);

  // Redirect to /auth if not authenticated
  useEffect(() => {
    if (!mounted) return;
    if (!isAuth && pathname !== "/auth") {
      router.replace("/auth");
    }
  }, [isAuth, pathname, mounted, router]);

  // ──── STEP 6: Auto-poll for PENDING sellers ────────
  // When status is PENDING, poll every 5s so the seller
  // automatically transitions to dashboard once admin approves.
  const effectiveUser = serverUser ?? user;
  const currentStatus = getUserStatus(effectiveUser);

  useEffect(() => {
    if (currentStatus !== "PENDING") return;

    const interval = setInterval(() => {
      void queryClient.invalidateQueries({ queryKey: ["seller", "me"] });
    }, 5000);

    return () => clearInterval(interval);
  }, [currentStatus, queryClient]);

  // SSR / hydration guard
  if (!mounted) return null;

  // Auth page — render directly without layout
  if (pathname === "/auth") {
    return <>{children}</>;
  }

  // Not authenticated — show spinner while redirect fires
  if (!user || !isAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // CRITICAL: Wait for the server profile before making routing decisions.
  if (isLoadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ──── STATE MACHINE ROUTING (strict switch) ────────

  // On /onboarding page
  if (pathname === "/onboarding") {
    if (currentStatus !== "NEW") {
      router.replace("/dashboard");
      return null;
    }
    return <>{children}</>;
  }

  switch (currentStatus) {
    case "NEW":
      router.replace("/onboarding");
      return null;

    case "PENDING":
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full glass-card rounded-2xl p-8 text-center space-y-4">
            <div className="mx-auto h-16 w-16 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 rounded-full flex items-center justify-center mb-6">
              <Store className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Application Under Review</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your seller profile is currently being reviewed. We will notify you once your account is verified.
            </p>
            <div className="pt-4">
              <button onClick={() => useSellerAuth.getState().logout()} className="text-sm font-medium text-primary hover:underline">
                Sign Out
              </button>
            </div>
          </motion.div>
        </div>
      );

    case "REJECTED":
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full glass-card rounded-2xl p-8 text-center space-y-4 border-red-200 dark:border-red-900/30">
            <div className="mx-auto h-16 w-16 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center mb-6">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Application Rejected</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We could not verify your business details. Please contact support to resolve this.
            </p>
            <div className="pt-4">
              <button onClick={() => useSellerAuth.getState().logout()} className="text-sm font-medium text-red-600 hover:underline">
                Sign Out
              </button>
            </div>
          </motion.div>
        </div>
      );

    case "APPROVED":
    default:
      // APPROVED or any other status → full dashboard
      return (
        <SidebarProvider>
          <DashboardLayout pathname={pathname}>{children}</DashboardLayout>
        </SidebarProvider>
      );
  }
}

function DashboardLayout({ children, pathname }: { children: React.ReactNode; pathname: string }) {
  const { open } = useSidebar();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SellerSidebar />
      <main className={`flex-1 overflow-y-auto no-sb relative transition-all duration-300 ${open ? 'ml-64' : 'ml-20'}`}>
        <div className="p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
