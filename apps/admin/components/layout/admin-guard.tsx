"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAdminAuth } from "@/store";
import { Loader2 } from "lucide-react";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuth } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

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

  return <>{children}</>;
}
