"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Store, ArrowRight, Phone } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { useSendOtp, useVerifyOtp } from "@/hooks/useSeller";
import { useSellerAuth } from "@/store";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export default function SellerAuthPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone"|"otp">("phone");
  const { setUser } = useSellerAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const sendOtpMutation = useSendOtp();
  const verifyOtpMutation = useVerifyOtp();
  const loading = sendOtpMutation.isPending || verifyOtpMutation.isPending;

  const sendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) { toast.error("Enter valid phone number"); return; }

    try {
      await sendOtpMutation.mutateAsync({ phone });
      setStep("otp");
      toast.success("OTP sent successfully. Enter OTP to continue.");
    } catch (error: any) {
      toast.error("Could not send OTP. Please retry.");
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) { toast.error("Enter OTP"); return; }
    try {
      const data = await verifyOtpMutation.mutateAsync({ phone, otp, role: "SELLER" });
      // Backend wraps response in { data: { accessToken, user } } — handle both shapes
      const inner = (data as any).data ?? data;
      setUser(inner.user);

      // Force-refresh seller/me so the guard routes based on fresh server status
      await queryClient.invalidateQueries({ queryKey: ["seller", "me"] });

      toast.success("Logged in successfully");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error("Invalid OTP. Please retry.");
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 seller-gradient"/>
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-white/15 blur-3xl" aria-hidden/>
        <div className="relative z-10 max-w-md space-y-8 text-white">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center"><Store className="h-7 w-7"/></div>
            <span className="font-semibold text-3xl">Seller Portal</span>
          </div>
          <h1 className="font-semibold text-4xl leading-tight">Grow Your Pharma Business with PharmaBag</h1>
          <div className="space-y-3">
            {["List 50,000+ products in minutes","Reach 10,000+ verified buyers","Real-time inventory & order management","Weekly payouts to your bank account"].map(f=>(
              <div key={f} className="flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3">
                <span className="text-green-300">✓</span><span className="text-sm font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <motion.div initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-2.5 justify-center mb-6">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center"><Store className="h-5 w-5 text-white"/></div>
            <span className="font-semibold text-xl text-foreground">Seller Portal</span>
          </div>
          <div>
            <h2 className="font-semibold text-3xl text-foreground">{step==="phone"?"Sign in to sell":"Verify OTP"}</h2>
            <p className="text-muted-foreground text-sm mt-1">{step==="phone"?"Access your seller dashboard":"Enter the OTP sent to your phone"}</p>
          </div>
          {step==="phone" ? (
            <form onSubmit={sendOTP} className="space-y-4">
              <Input label="Phone Number" type="tel" inputMode="numeric" maxLength={10} value={phone}
                onChange={e=>setPhone(e.target.value.replace(/\D/g,""))} placeholder="98765 43210"
                leftIcon={<Phone className="h-4 w-4"/>} required/>
              <Button type="submit" className="w-full" size="lg" loading={loading} rightIcon={<ArrowRight className="h-4 w-4"/>}>Get OTP</Button>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-4">
              <Input label="Enter OTP" type="text" inputMode="numeric" maxLength={6}
                value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,""))} placeholder="••••••"/>
              <Button type="submit" className="w-full" size="lg" loading={loading} rightIcon={<ArrowRight className="h-4 w-4"/>}>Verify & Sign In</Button>
              <button type="button" onClick={()=>setStep("phone")} className="text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-center">← Change number</button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
