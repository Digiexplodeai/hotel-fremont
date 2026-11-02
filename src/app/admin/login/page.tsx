"use client";

import React, { useState, useTransition, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signInAction } from "@/actions/auth";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/admin";

  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    startTransition(async () => {
      const result = await signInAction(formData);
      if (result.success) {
        router.push(nextUrl);
        router.refresh();
      } else {
        setError(result.error || "Invalid email or password.");
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
          <Link href="/" className="inline-block mb-3" aria-label="Hotel Fremont">
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

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label
              htmlFor="admin-email"
              className="block text-xs font-medium uppercase tracking-wider text-[#A8A59E] mb-1.5"
            >
              Email Address
            </label>
            <div className="relative">
              <input
                id="admin-email"
                type="email"
                name="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@hotelfremont.com"
                className="w-full bg-[#0E0E10] border border-white/10 rounded-lg pl-4 pr-10 py-3 text-sm text-white placeholder-[#A8A59E]/40 focus:outline-none focus:border-[#E02B1D] transition"
                required
                autoFocus
                disabled={isPending}
              />
              <Mail className="absolute right-3.5 top-3.5 w-4 h-4 text-[#A8A59E]/50 pointer-events-none" />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-xs font-medium uppercase tracking-wider text-[#A8A59E] mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#0E0E10] border border-white/10 rounded-lg pl-4 pr-11 py-3 text-sm text-white placeholder-[#A8A59E]/40 focus:outline-none focus:border-[#E02B1D] transition"
                required
                disabled={isPending}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-3 p-0.5 text-[#A8A59E]/60 hover:text-white transition cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3.5 bg-red-950/40 border border-red-800/60 rounded-lg text-xs text-red-300 animate-in fade-in duration-200"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span className="leading-relaxed">{error}</span>
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

        {/* Clean Back to Website Link */}
        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center text-xs text-[#A8A59E]">
          <Link
            href="/"
            className="hover:text-white transition flex items-center gap-1.5 text-xs text-[#A8A59E] hover:underline underline-offset-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Website</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0E0E10] flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-[#E02B1D]" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
