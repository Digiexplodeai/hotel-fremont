import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCurrentUser, signOutAction } from "@/actions/auth";
import ImageManager from "@/components/admin/ImageManager";
import { getImageSlotsMap } from "@/lib/data/siteData";
import {
  ExternalLink,
  LogOut,
  Cloud,
  ImageIcon,
  BedDouble,
  MessageSquare,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Website Images Manager | Hotel Fremont",
  description: "Manage, crop, replace, and reorder all website imagery on Cloudflare R2",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminImagesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  const initialSlotsMap = await getImageSlotsMap();

  return (
    <div className="min-h-screen bg-[#0E0E10] text-[#F7F3EC] flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#151518]/95 backdrop-blur-md border-b border-white/10 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-2 group">
              <Image
                src="/assets/logo.png"
                alt="Hotel Fremont"
                width={150}
                height={28}
                className="h-7 w-auto object-contain"
                priority
              />
            </Link>
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-black/40 border border-white/10 rounded-full text-xs">
              <Cloud className="w-3.5 h-3.5 text-[#E02B1D]" />
              <span className="text-[#C9A96E] font-serif text-[11px] font-semibold tracking-wider uppercase">
                R2 Media Vault
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-xs text-[#A8A59E] hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#C9A96E]" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            <Link
              href="/"
              target="_blank"
              className="text-xs text-[#A8A59E] hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#C9A96E]" />
              <span className="hidden sm:inline">Live Site</span>
            </Link>

            <form action={signOutAction}>
              <button
                type="submit"
                className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg border border-red-900/40 hover:bg-red-950/30 transition flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Sub-navigation bar */}
      <nav className="bg-[#121215] border-b border-white/5 px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto text-xs">
          <Link
            href="/admin"
            className="px-3 py-1.5 rounded-lg text-[#A8A59E] hover:text-white transition flex items-center gap-1.5 shrink-0"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Overview</span>
          </Link>
          <Link
            href="/admin/images"
            className="px-3 py-1.5 rounded-lg bg-[#E02B1D]/15 text-[#E02B1D] border border-[#E02B1D]/30 font-semibold flex items-center gap-1.5 shrink-0"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Image Manager</span>
          </Link>
          <Link
            href="/admin/rooms"
            className="px-3 py-1.5 rounded-lg text-[#A8A59E] hover:text-white transition flex items-center gap-1.5 shrink-0"
          >
            <BedDouble className="w-3.5 h-3.5" />
            <span>12 Keys &amp; Availability</span>
          </Link>
          <Link
            href="/admin/enquiries"
            className="px-3 py-1.5 rounded-lg text-[#A8A59E] hover:text-white transition flex items-center gap-1.5 shrink-0"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Enquiries &amp; Leads</span>
          </Link>
          <Link
            href="/admin/content"
            className="px-3 py-1.5 rounded-lg text-[#A8A59E] hover:text-white transition flex items-center gap-1.5 shrink-0"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Website CMS</span>
          </Link>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Module Header */}
        <div className="bg-[#151518] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#E02B1D]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-[#E02B1D]/10 text-[#E02B1D] border border-[#E02B1D]/30 text-[10px] font-bold uppercase tracking-widest">
                  Live Media Architecture
                </span>
                <span className="text-xs text-[#A8A59E]">· Direct-to-R2 Presigned Uploads</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F7F3EC]">
                Website Image Manager
              </h1>
              <p className="text-xs sm:text-sm text-[#A8A59E] max-w-2xl leading-relaxed">
                Replace, crop, focal-align, reorder, or purge every single photograph on the Hotel Fremont website without writing code. Direct browser-to-R2 uploads bypass Netlify function limits.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="px-3.5 py-2 rounded-xl bg-black/40 border border-white/10">
                <span className="text-[10px] uppercase font-mono text-[#A8A59E] block">Storage Engine</span>
                <span className="text-emerald-400 font-mono font-bold text-xs">hotel-fremont-media</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-black/40 border border-white/10">
                <span className="text-[10px] uppercase font-mono text-[#A8A59E] block">CDN Edge</span>
                <span className="text-[#C9A96E] font-mono text-xs">pub-583d...r2.dev</span>
              </div>
            </div>
          </div>
        </div>

        {/* The Image Manager UI */}
        <ImageManager initialSlotsMap={initialSlotsMap} />
      </main>
    </div>
  );
}
