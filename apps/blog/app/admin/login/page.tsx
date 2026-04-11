"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithSimplePassword } from "@pharmabag/api-client";
import { Lock, Loader2 } from "lucide-react";
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
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full glass-card p-8 border-white/10 animate-fade-in">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
            <Lock className="text-black" size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Admin PortaL</h1>
          <p className="text-gray-400 mt-2">Enter secret password to access dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Secret Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-10 pr-4 focus:outline-none focus:border-green-500/50 transition-colors text-lg"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-3 rounded-xl transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-green-500 transition-colors">
            Return to Public Blog
          </Link>
        </div>
      </div>
    </div>
  );
}
