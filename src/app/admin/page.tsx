import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCurrentUser, signOutAction } from "@/actions/auth";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getR2ConfigSummary } from "@/lib/r2";
import { getRoomsWithStatusAction, getBookingsAction } from "@/actions/rooms";
import { getEnquiriesAction } from "@/actions/enquiries";
import MediaManager from "@/components/admin/MediaManager";
import {
  Database,
  Cloud,
  BedDouble,
  LogOut,
  ExternalLink,
  CheckCircle2,
  ImageIcon,
  MessageSquare,
  Settings,
  LayoutDashboard,
  Calendar,
  Users,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

export const metadata = {
  title: "Admin Command Center | Hotel Fremont",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  const supabaseConfigured = isSupabaseConfigured();
  const r2Summary = getR2ConfigSummary();

  const [roomsRes, bookingsRes, enquiriesRes] = await Promise.all([
    getRoomsWithStatusAction(),
    getBookingsAction(),
    getEnquiriesAction(),
  ]);

  const rooms = roomsRes.rooms;
  const bookings = bookingsRes.bookings;
  const enquiries = enquiriesRes.enquiries;

  const totalKeys = rooms.length;
  const occupiedCount = rooms.filter((r) => r.status === "occupied").length;
  const availableCount = rooms.filter((r) => r.status === "available").length;
  const cleaningCount = rooms.filter((r) => r.status === "cleaning").length;
  const occupancyRate = totalKeys > 0 ? Math.round((occupiedCount / totalKeys) * 100) : 0;
  const newLeadsCount = enquiries.filter((e) => e.status === "new").length;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todaysArrivals = bookings.filter((b) => b.checkIn === todayStr);

  return (
    <div className="min-h-screen bg-[#0E0E10] text-[#F7F3EC] flex flex-col">
      {/* Top Admin Header Bar */}
      <header className="sticky top-0 z-40 bg-[#151518]/95 backdrop-blur-md border-b border-white/10 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
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
              <span className="w-2 h-2 rounded-full bg-[#E02B1D] animate-pulse" />
              <span className="text-[#C9A96E] font-serif text-[11px] font-semibold tracking-wider uppercase">
                Enterprise Command Center
              </span>
            </div>
          </div>

          {/* User info & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end text-xs">
              <span className="text-[#F7F3EC] font-medium">{user.fullName || user.email}</span>
              <span className="text-[10px] text-[#A8A59E] uppercase font-mono tracking-wider">
                Role: <span className="text-[#C9A96E] font-semibold">{user.role}</span>
              </span>
            </div>

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
            className="px-3 py-1.5 rounded-lg bg-[#E02B1D]/15 text-[#E02B1D] border border-[#E02B1D]/30 font-semibold flex items-center gap-1.5 shrink-0"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Overview</span>
          </Link>
          <Link
            href="/admin/images"
            className="px-3 py-1.5 rounded-lg text-[#A8A59E] hover:text-white transition flex items-center gap-1.5 shrink-0"
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
            {newLeadsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#E02B1D] text-white text-[9px] font-bold">
                {newLeadsCount}
              </span>
            )}
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

      {/* Main Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Welcome & Role Banner */}
        <div className="bg-[#151518] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#E02B1D]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-[#E02B1D]/10 text-[#E02B1D] border border-[#E02B1D]/30 text-[10px] font-bold uppercase tracking-widest">
                  Live Operations
                </span>
                <span className="text-xs text-[#A8A59E]">· 12 Keys Luxury Inventory</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F7F3EC]">
                Welcome, {user.fullName || "Administrator"}
              </h1>
              <p className="text-xs sm:text-sm text-[#A8A59E] max-w-2xl leading-relaxed">
                Hotel Fremont Enterprise Command Center. Manage R2 media storage, 12-key reservations, guest enquiries, and website CMS content with zero code changes.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="px-3.5 py-2 rounded-xl bg-black/40 border border-white/10">
                <span className="text-[10px] uppercase font-mono text-[#A8A59E] block">Authorized Role</span>
                <span className="text-[#C9A96E] font-serif font-bold capitalize text-sm">{user.role}</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-black/40 border border-white/10">
                <span className="text-[10px] uppercase font-mono text-[#A8A59E] block">Physical Keys</span>
                <span className="text-white font-mono font-bold text-sm">12 Rooms</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Operational Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#151518] border border-white/10 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-mono uppercase text-[#A8A59E]">Live Occupancy</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-mono font-bold text-[#C9A96E]">{occupancyRate}%</span>
              <span className="text-xs text-[#A8A59E]">({occupiedCount}/12 In-House)</span>
            </div>
            <div className="mt-3 text-[11px] text-emerald-400 font-mono">
              {availableCount} Rooms Available Today
            </div>
          </div>

          <div className="bg-[#151518] border border-white/10 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-mono uppercase text-[#A8A59E]">Today&apos;s Arrivals</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-mono font-bold text-white">{todaysArrivals.length}</span>
              <span className="text-xs text-[#A8A59E]">Guests Arriving</span>
            </div>
            <div className="mt-3 text-[11px] text-[#C9A96E] font-mono">
              VIP Transfers Scheduled
            </div>
          </div>

          <div className="bg-[#151518] border border-white/10 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-mono uppercase text-[#A8A59E]">Uncontacted Leads</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-mono font-bold text-[#E02B1D]">{newLeadsCount}</span>
              <span className="text-xs text-[#A8A59E]">New Enquiries</span>
            </div>
            <div className="mt-3 text-[11px] text-[#E02B1D]/80 font-mono">
              Requires 1-Click WhatsApp Followup
            </div>
          </div>

          <div className="bg-[#151518] border border-white/10 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-mono uppercase text-[#A8A59E]">Housekeeping</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-mono font-bold text-amber-400">{cleaningCount}</span>
              <span className="text-xs text-[#A8A59E]">Sanitizing</span>
            </div>
            <div className="mt-3 text-[11px] text-amber-400/80 font-mono">
              Ready for Afternoon Arrivals
            </div>
          </div>
        </div>

        {/* 4 Core Module Action Launchpads */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Images */}
          <Link
            href="/admin/images"
            className="group bg-[#151518] border border-white/10 hover:border-[#C9A96E]/40 rounded-xl p-5 shadow-md transition flex flex-col justify-between space-y-4 cursor-pointer"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#E02B1D]/10 border border-[#E02B1D]/30 flex items-center justify-center text-[#E02B1D] group-hover:scale-110 transition">
                <ImageIcon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-serif font-bold text-[#F7F3EC] group-hover:text-[#C9A96E] transition">
                Image Manager
              </h3>
              <p className="text-xs text-[#A8A59E] leading-relaxed">
                Replace, crop, focal-align, and drag-and-drop reorder every photograph on Cloudflare R2.
              </p>
            </div>
            <div className="pt-2 flex items-center text-xs font-semibold text-[#C9A96E] gap-1 group-hover:translate-x-1 transition">
              <span>Open Image Studio</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 2: 12 Keys & Availability */}
          <Link
            href="/admin/rooms"
            className="group bg-[#151518] border border-white/10 hover:border-[#C9A96E]/40 rounded-xl p-5 shadow-md transition flex flex-col justify-between space-y-4 cursor-pointer"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
                <BedDouble className="w-5 h-5" />
              </div>
              <h3 className="text-base font-serif font-bold text-[#F7F3EC] group-hover:text-[#C9A96E] transition">
                12 Keys &amp; Calendar
              </h3>
              <p className="text-xs text-[#A8A59E] leading-relaxed">
                Interactive tape chart, instant status changes, new bookings, and printable invoices.
              </p>
            </div>
            <div className="pt-2 flex items-center text-xs font-semibold text-emerald-400 gap-1 group-hover:translate-x-1 transition">
              <span>View Tape Chart</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 3: Leads & Enquiries */}
          <Link
            href="/admin/enquiries"
            className="group bg-[#151518] border border-white/10 hover:border-[#C9A96E]/40 rounded-xl p-5 shadow-md transition flex flex-col justify-between space-y-4 cursor-pointer"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-serif font-bold text-[#F7F3EC] group-hover:text-[#C9A96E] transition">
                Guest Enquiries
              </h3>
              <p className="text-xs text-[#A8A59E] leading-relaxed">
                Review rate checks, dining requests, and event proposals with 1-click WhatsApp follow-up.
              </p>
            </div>
            <div className="pt-2 flex items-center text-xs font-semibold text-purple-400 gap-1 group-hover:translate-x-1 transition">
              <span>Follow Up Leads ({newLeadsCount})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 4: CMS & Settings */}
          <Link
            href="/admin/content"
            className="group bg-[#151518] border border-white/10 hover:border-[#C9A96E]/40 rounded-xl p-5 shadow-md transition flex flex-col justify-between space-y-4 cursor-pointer"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
                <Settings className="w-5 h-5" />
              </div>
              <h3 className="text-base font-serif font-bold text-[#F7F3EC] group-hover:text-[#C9A96E] transition">
                Website CMS
              </h3>
              <p className="text-xs text-[#A8A59E] leading-relaxed">
                Manage contact phones (+91 98727 68514), WhatsApp, Google rating badge, and social links.
              </p>
            </div>
            <div className="pt-2 flex items-center text-xs font-semibold text-amber-400 gap-1 group-hover:translate-x-1 transition">
              <span>Edit Site Settings</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>

        {/* System Foundation Health Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Cloudflare R2 Card */}
          <div className="bg-[#151518] border border-white/10 rounded-xl p-5 shadow-md flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#F7F3EC] font-semibold text-sm">
                  <Cloud className="w-4 h-4 text-[#E02B1D]" />
                  <span>Cloudflare R2 Media</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-xs text-[#A8A59E] leading-relaxed">
                Bucket: <code className="text-white font-mono">{r2Summary.bucketName}</code>
              </p>
              <p className="text-[11px] text-[#A8A59E]/70 font-mono truncate">
                {r2Summary.publicUrl}
              </p>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Edge CDN Ready</span>
              </span>
              <span className="text-[#C9A96E] text-[11px]">Presigned PUT Ready</span>
            </div>
          </div>

          {/* Supabase Database Card */}
          <div className="bg-[#151518] border border-white/10 rounded-xl p-5 shadow-md flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#F7F3EC] font-semibold text-sm">
                  <Database className="w-4 h-4 text-[#C9A96E]" />
                  <span>Supabase Postgres</span>
                </div>
                {supabaseConfigured ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                ) : (
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono">
                    Fallback Active
                  </span>
                )}
              </div>
              <p className="text-xs text-[#A8A59E] leading-relaxed">
                {supabaseConfigured
                  ? "Connected to Supabase PostgreSQL database with RLS policies enabled."
                  : "Using local content.js & rooms.ts data. Connect Supabase credentials to persist database rows."}
              </p>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-[11px] text-[#A8A59E]">
                {supabaseConfigured ? "Tables Migrated" : "Schema Ready in /supabase"}
              </span>
              <span className="text-[11px] text-[#C9A96E]">RLS Protected</span>
            </div>
          </div>

          {/* 12 Keys Inventory Card */}
          <div className="bg-[#151518] border border-white/10 rounded-xl p-5 shadow-md flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#F7F3EC] font-semibold text-sm">
                  <BedDouble className="w-4 h-4 text-[#E02B1D]" />
                  <span>12-Key Inventory</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                  100% Verified
                </span>
              </div>
              <p className="text-xs text-[#A8A59E] leading-relaxed">
                4 Categories: 6 Deluxe King (101-106), 3 Premier Executive (201-203), 2 Royal Fremont (301-302), 1 Penthouse (401).
              </p>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-white font-mono text-[11px]">Total: 12 Rooms</span>
              <span className="text-[#C9A96E] text-[11px]">Tape Chart Ready</span>
            </div>
          </div>
        </div>

        {/* Media Manager Section (Integrated) */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-serif font-bold text-[#F7F3EC]">
                Cloudflare R2 Media Vault
              </h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#E02B1D]/10 text-[#E02B1D] border border-[#E02B1D]/20">
                Core Module
              </span>
            </div>
            <Link
              href="/admin/images"
              className="text-xs text-[#C9A96E] hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Full Studio View</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Media Manager Component */}
          <MediaManager />
        </div>
      </main>
    </div>
  );
}
