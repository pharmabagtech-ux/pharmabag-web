"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithSimplePassword } from "@pharmabag/api-client";
import { Lock, Loader2, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await loginWithSimplePassword(password);
      router.push("/admin");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid Admin Password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen premium-gradient text-foreground flex items-center justify-center p-6">
      <div className="max-w-md w-full glass-card p-10 border-white/60 animate-fade-in shadow-2xl shadow-primary/5">
        <div className="mb-10 text-center">
          <Link href="/" className="inline-block mb-10">
            <Image
              src="/pharmabag_logo.png"
              alt="PharmaBag Logo"
              width={180}
              height={50}
              className="h-10 w-auto mx-auto"
            />
          </Link>
          
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/10 border border-primary/20">
            <Lock className="text-primary" size={36} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 leading-tight">Admin Portal</h1>
          <p className="text-gray-500 mt-2 font-medium">Authentication Required</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Access Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-lg font-medium text-gray-900"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm font-semibold border border-red-100 animate-shake">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                Verifying...
              </>
            ) : (
              <>
                Sign In 
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-gray-200/50 text-center">
          <Link href="/" className="text-sm font-bold text-gray-400 hover:text-primary transition-colors flex items-center justify-center gap-2">
             Return to Public Blog
          </Link>
        </div>
      </div>
    </div>
  );
}
