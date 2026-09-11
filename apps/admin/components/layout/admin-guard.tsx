"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAdminAuth } from "@/store";
import { useAdminMe } from "@/hooks/useAdmin";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import { areaForPath, canAccessArea, firstAllowedPath, AREA_LABELS } from "@/lib/admin-areas";
import { Loader2, ShieldAlert } from "lucide-react";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuth, logout } = useAdminAuth();
  const { isLoading: isLoadingMe } = useAdminMe();
  const { capabilities } = useAdminPermissions();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  /**
   * The area this URL belongs to, and whether this admin holds it.
   *
   * The old check allowed any route it had no entry for, which quietly opened
   * CSV upload, Blogs and SEO to every admin. Now an unrecognised admin route
   * is treated as one nobody has been granted — the same direction the API
   * takes, so the screen and the server agree.
   */
  const area = areaForPath(pathname);
  const allowed = area !== null && canAccessArea(capabilities, area);
  const fallbackPath = firstAllowedPath(capabilities);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Auto-logout if pending
    if (isAuth && user?.status === "PENDING" && pathname !== "/auth") {
      logout();
      router.replace("/auth");
      return;
    }

    // Redirect to auth if not authenticated and trying to access protected page
    if (!isAuth && pathname !== "/auth") {
      router.replace("/auth");
    }
    
    // Redirect to dashboard if already authenticated and trying to access auth page
    if (isAuth && pathname === "/auth") {
      router.replace("/");
    }
  }, [isAuth, user?.status, pathname, mounted, router, logout]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Allow auth page regardless
  if (pathname === "/auth") {
    return <>{children}</>;
  }

  // If not authenticated, still show loading while redirect happens
  if (!isAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If loading the latest profile/permissions, wait for it
  if (isLoadingMe && !(user as any)?.adminProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check route-level permissions
  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4 p-6 glass-card max-w-sm rounded-2xl border border-destructive/20 shadow-2xl">
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto animate-pulse" />
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="text-sm text-muted-foreground">
            {area
              ? <>Your admin account does not include <strong>{AREA_LABELS[area]}</strong>.</>
              : <>You don&apos;t have permission to access <strong>{pathname}</strong>.</>}
          </p>
          <div className="pt-2 space-y-2">
            {/* Sends them somewhere they can actually go, rather than bouncing
                an admin without a dashboard grant into another wall. */}
            {fallbackPath ? (
              <button onClick={() => router.replace(fallbackPath)} className="text-sm text-primary underline block w-full">
                Go to {AREA_LABELS[areaForPath(fallbackPath)!]}
              </button>
            ) : (
              <p className="text-xs text-muted-foreground">
                No areas have been assigned to your account yet. Ask a super admin to grant you access.
              </p>
            )}
            <button onClick={() => { logout(); router.replace("/auth"); }} className="text-xs text-muted-foreground hover:text-foreground block w-full mt-2 transition-colors">Logout &amp; Login again</button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
