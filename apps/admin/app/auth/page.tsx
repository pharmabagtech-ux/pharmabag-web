"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, ArrowRight, Phone } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { useAdminAuth } from "@/store";
import { useSendAdminOtp, useVerifyAdminOtp } from "@/hooks/useAdmin";
import toast from "react-hot-toast";

export default function AdminAuthPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone"|"otp">("phone");
  const { setUser } = useAdminAuth();
  const router = useRouter();
  const sendOtpMutation = useSendAdminOtp();
  const verifyOtpMutation = useVerifyAdminOtp();
  const loading = sendOtpMutation.isPending || verifyOtpMutation.isPending;

  const sendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10 || !/^[6-9]/.test(phone)) {
      toast.error("Enter a valid 10-digit Indian mobile number");
      return;
    }
    try {
      await sendOtpMutation.mutateAsync({ phone });
      setStep("otp");
      toast.success("OTP sent successfully");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not send OTP. Retry.");
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) { toast.error("Enter the 6-digit OTP"); return; }
    try {
      const res = await verifyOtpMutation.mutateAsync({ phone, otp, role: "ADMIN" });
      const inner = (res as any).data ?? res;
      const user = inner.user;
      const role = user?.role?.toUpperCase?.() ?? "";
      if (role !== "ADMIN") {
        toast.error("Access denied. This portal is for admins only.");
        localStorage.removeItem("pb_token");
        return;
      }
      setUser(user);
      toast.success("Admin signed in");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Invalid OTP. Retry.");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 admin-gradient" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-white/20 blur-3xl" aria-hidden />
        <div className="relative z-10 max-w-md space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-white/30 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <Shield className="h-8 w-8 text-amber-800" />
            </div>
            <div>
              <div className="font-semibold text-3xl text-amber-900">Admin Panel</div>
              <div className="text-amber-700 text-sm">PharmaBag Platform</div>
            </div>
          </div>
          <h1 className="font-semibold text-4xl text-amber-900 leading-tight">Manage the Entire PharmaBag Ecosystem</h1>
          <div className="space-y-3">
            {[
              "Verify sellers and manage approvals",
              "Monitor all platform orders",
              "Manage products & inventory",
              "View platform analytics & revenue",
              "Manage buyer & seller accounts",
            ].map(f => (
              <div key={f} className="flex items-center gap-3 bg-white/30 backdrop-blur-sm rounded-xl px-4 py-3">
                <span className="text-amber-600 font-bold">✓</span>
                <span className="text-sm font-medium text-amber-900">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md space-y-8">
          <div className="flex items-center gap-3 lg:hidden justify-center mb-4">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-xl text-foreground">Admin Panel</span>
          </div>
          <div>
            <h2 className="font-semibold text-3xl text-foreground">Admin Sign In</h2>
            <p className="text-muted-foreground text-sm mt-1">One-time password login for admin access</p>
          </div>
          {step === "phone" ? (
            <form onSubmit={sendOTP} className="space-y-4">
              <Input label="Phone Number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter your phone number" leftIcon={<Phone className="h-4 w-4" />} required maxLength={10} />
              <Button type="submit" className="w-full" size="lg" loading={loading} rightIcon={<ArrowRight className="h-4 w-4" />}>
                Send OTP
              </Button>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-4">
              <Input label="OTP" type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 6-digit OTP" leftIcon={<Shield className="h-4 w-4" />} required maxLength={6} />
              <Button type="submit" className="w-full" size="lg" loading={loading} rightIcon={<ArrowRight className="h-4 w-4" />}>
                Verify & Sign In
              </Button>
              <button type="button" onClick={() => setStep("phone")} className="text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-center">← Change phone</button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
