"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInAction } from "@/actions/auth";
import { Key, Mail, Lock, ShieldCheck, ArrowLeft, RefreshCw, AlertCircle, Database } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<"credentials" | "masterKey">("masterKey");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [masterKey, setMasterKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    if (tab === "masterKey") {
      formData.append("masterKey", masterKey);
    } else {
      formData.append("email", email);
      formData.append("password", password);
    }

    startTransition(async () => {
      const result = await signInAction(formData);
      if (result.success) {
        router.push("/admin");
        router.refresh();
      } else {
        setError(result.error || "Login failed. Please verify credentials.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#0E0E10] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#E02B1D]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#C9A96E]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-[#151518] border border-white/10 rounded-2xl p-8 sm:p-10 shadow-[0_25px_70px_rgba(0,0,0,0.8)] relative z-10">
        {/* Top Gold & Red Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C9A96E]/30 via-[#E02B1D] to-[#C9A96E]/30 rounded-t-2xl" />

        {/* Brand Lockup */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-3">
            <Image
              src="/assets/logo.png"
              alt="Hotel Fremont"
              width={200}
              height={36}
              className="h-8 w-auto mx-auto object-contain"
              priority
            />
          </Link>
          <h1 className="text-xl font-serif font-bold text-[#F7F3EC] mt-2">
            Management Portal
          </h1>
          <p className="text-xs text-[#A8A59E] font-sans mt-1">
            Airport Road, Sector 80, Mohali · 12 Luxury Keys
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-lg bg-[#0E0E10] p-1 mb-6 border border-white/5">
          <button
            type="button"
            onClick={() => {
              setTab("masterKey");
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === "masterKey"
                ? "bg-[#1E1E22] text-[#F7F3EC] shadow"
                : "text-[#A8A59E] hover:text-white"
            }`}
          >
            <Key className="w-3.5 h-3.5 text-[#E02B1D]" />
            <span>Master Key</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("credentials");
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === "credentials"
                ? "bg-[#1E1E22] text-[#F7F3EC] shadow"
                : "text-[#A8A59E] hover:text-white"
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-[#C9A96E]" />
            <span>Staff Account</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === "masterKey" ? (
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[#A8A59E] mb-1.5">
                Master Security Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={masterKey}
                  onChange={(e) => setMasterKey(e.target.value)}
                  placeholder="Enter master admin key..."
                  className="w-full bg-[#0E0E10] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-[#A8A59E]/40 focus:outline-none focus:border-[#E02B1D] transition"
                  autoFocus
                  required
                />
                <Key className="absolute right-3.5 top-3.5 w-4 h-4 text-[#A8A59E]/50" />
              </div>
              <p className="text-[11px] text-[#A8A59E]/70 mt-1.5">
                Default: <code className="text-[#C9A96E]">fremont-admin-2026</code>
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-[#A8A59E] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@hotelfremont.com"
                    className="w-full bg-[#0E0E10] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-[#A8A59E]/40 focus:outline-none focus:border-[#E02B1D] transition"
                    required
                  />
                  <Mail className="absolute right-3.5 top-3.5 w-4 h-4 text-[#A8A59E]/50" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-[#A8A59E] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#0E0E10] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-[#A8A59E]/40 focus:outline-none focus:border-[#E02B1D] transition"
                    required
                  />
                  <Lock className="absolute right-3.5 top-3.5 w-4 h-4 text-[#A8A59E]/50" />
                </div>
                <p className="text-[11px] text-[#A8A59E]/70 mt-1.5">
                  Demo Password: <code className="text-[#C9A96E]">fremont-admin-2026</code>
                </p>
              </div>
            </>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-[#E02B1D] hover:bg-[#c42215] text-white font-medium py-3 px-4 rounded-lg text-sm tracking-wide transition flex items-center justify-center gap-2 shadow-lg shadow-red-950/50 disabled:opacity-60 cursor-pointer"
          >
            {isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Sign In to Dashboard</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-xs text-[#A8A59E]">
          <span className="flex items-center gap-1.5 text-[11px]">
            <Database className="w-3.5 h-3.5 text-[#C9A96E]" />
            <span>Supabase + Cloudflare R2</span>
          </span>
          <Link
            href="/"
            className="hover:text-white transition flex items-center gap-1 text-[11px]"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Back to Website</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

