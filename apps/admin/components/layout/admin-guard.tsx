"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAdminAuth } from "@/store";
import { Loader2, ShieldAlert } from "lucide-react";

const ROUTE_PERMISSIONS: Record<string, string> = {
  "/users": "1",
  "/products": "3",
  "/categories": "3",
  "/orders": "5",
  "/payments": "7",
  "/settlements": "9",
  "/tickets": "b",
  "/admins": "x",
};

function hasPermission(permissions: string | undefined, route: string): boolean {
  if (!permissions) return false;
  if (permissions.includes("x")) return true; // Super admin has all access
  const requiredPerm = Object.entries(ROUTE_PERMISSIONS).find(
    ([prefix]) => route === prefix || route.startsWith(prefix + "/")
  );
  if (!requiredPerm) return true; // No specific permission required (dashboard, analytics, etc.)
  return permissions.includes(requiredPerm[1]);
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuth } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Super admin check or we use their permissions
  // To reach here they must have role ADMIN and status APPROVED because the backend handles that during login
  const isMasterAdmin = user?.role === "ADMIN";
  const permissions = isMasterAdmin ? "x" : (user as any)?.permissions as string | undefined;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Redirect to auth if not authenticated and trying to access protected page
    if (!isAuth && pathname !== "/auth") {
      router.replace("/auth");
    }
    
    // Redirect to dashboard if already authenticated and trying to access auth page
    if (isAuth && pathname === "/auth") {
      router.replace("/");
    }
  }, [isAuth, pathname, mounted, router]);

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

  // Check route-level permissions
  if (!hasPermission(permissions, pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="text-sm text-muted-foreground">You don&apos;t have permission to access this page.</p>
          <button onClick={() => router.replace("/dashboard")} className="text-sm text-primary underline">Go to Dashboard</button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
