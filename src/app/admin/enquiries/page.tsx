import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCurrentUser, signOutAction } from "@/actions/auth";
import { getEnquiriesAction } from "@/actions/enquiries";
import EnquiriesManager from "@/components/admin/EnquiriesManager";
import {
  MessageSquare,
  LogOut,
  ExternalLink,
  ChevronLeft,
  ImageIcon,
  BedDouble,
  Settings,
  LayoutDashboard,
} from "lucide-react";

export const metadata = {
  title: "Enquiries & Leads | Hotel Fremont Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminEnquiriesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  const enquiriesRes = await getEnquiriesAction();

  return (
    <div className="min-h-screen bg-[#0E0E10] text-[#F7F3EC] flex flex-col">
      {/* Top Admin Header Bar */}
      <header className="sticky top-0 z-40 bg-[#151518]/95 backdrop-blur-md border-b border-white/10 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand & Section Name */}
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
              <MessageSquare className="w-3.5 h-3.5 text-[#E02B1D]" />
              <span className="text-[#C9A96E] font-serif text-[11px] font-semibold tracking-wider uppercase">
                Guest Leads &amp; Enquiries
              </span>
            </div>
          </div>

          {/* User info & Actions */}
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
            className="px-3 py-1.5 rounded-lg bg-[#E02B1D]/15 text-[#E02B1D] border border-[#E02B1D]/30 font-semibold flex items-center gap-1.5 shrink-0"
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

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header Breadcrumb & Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#A8A59E]">
            <Link href="/admin" className="hover:text-white flex items-center gap-1">
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Admin</span>
            </Link>
            <span>/</span>
            <span className="text-[#C9A96E]">Guest Leads &amp; Enquiries</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F7F3EC]">
                Guest Inquiries &amp; Pipeline
              </h1>
              <p className="text-xs sm:text-sm text-[#A8A59E] mt-1">
                Leads captured from Check Rates, Room Booking, Aura Dining, and Banquet Event forms with instant 1-click WhatsApp and phone follow-up.
              </p>
            </div>
          </div>
        </div>

        {/* Enquiries Manager Component */}
        <EnquiriesManager
          initialEnquiries={enquiriesRes.enquiries}
          isDatabase={enquiriesRes.isDatabase}
        />
      </main>
    </div>
  );
}

