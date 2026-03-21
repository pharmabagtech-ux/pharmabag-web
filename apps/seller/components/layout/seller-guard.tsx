"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSellerAuth } from "@/store";
import { Loader2, ShieldAlert, Store } from "lucide-react";
import { SellerSidebar } from "./sidebar";
import { motion } from "framer-motion";

export function SellerGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuth } = useSellerAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuth && pathname !== "/auth") {
      router.replace("/auth");
    }
  }, [isAuth, pathname, mounted, router]);

  if (!mounted) return null; // Avoid hydration mismatch

  if (!isAuth && pathname === "/auth") {
    return <>{children}</>;
  }

  if (!user || !isAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check verification status
  const verificationStatus = user.sellerProfile?.verificationStatus || "UNVERIFIED";

  if (verificationStatus === "UNVERIFIED" && pathname !== "/onboarding" && pathname !== "/auth") {
    router.replace("/onboarding");
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (verificationStatus === "PENDING" && pathname !== "/onboarding") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full glass-card rounded-2xl p-8 text-center space-y-4">
          <div className="mx-auto h-16 w-16 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 rounded-full flex items-center justify-center mb-6">
            <Store className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Application Under Review</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Thank you for registering with PharmaBag. Your seller profile is currently being reviewed by our administration team.
            We will notify you once your account is verified and ready to sell.
          </p>
          <div className="pt-4">
            <button onClick={() => useSellerAuth.getState().logout()} className="text-sm font-medium text-primary hover:underline">
              Sign Out
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (verificationStatus === "REJECTED" && pathname !== "/onboarding") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full glass-card rounded-2xl p-8 text-center space-y-4 border-red-200 dark:border-red-900/30">
          <div className="mx-auto h-16 w-16 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center mb-6">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Application Rejected</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Unfortunately, we could not verify your business details. Please contact our support team to resolve this issue and reactivate your account.
          </p>
          <div className="pt-4">
            <button onClick={() => useSellerAuth.getState().logout()} className="text-sm font-medium text-red-600 hover:underline">
              Sign Out
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Allow through to auth and onboarding layouts as is
  if (pathname === "/auth" || pathname === "/onboarding") {
    return <>{children}</>;
  }

  // Fully verified users get the main dashboard layout
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SellerSidebar />
      <main className="flex-1 overflow-y-auto no-sb relative">
        <div className="p-4 sm:p-6 lg:p-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full">
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
