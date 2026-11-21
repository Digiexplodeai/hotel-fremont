import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/actions/auth";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";
import {
  Settings,
  Building,
  Clock,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Shield,
  CreditCard,
  ImageIcon,
  Globe,
  Bell,
} from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Hotel Settings & Operational Rules | Hotel Fremont Admin",
  robots: {
    index: false,
    follow: false,
  },
};

import TestDataCleanup from "@/components/admin/TestDataCleanup";

export default async function AdminSettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <AdminLayoutShell
      userEmail={user.email}
      title="Hotel Settings & Operational Rules"
      subtitle="Hotel Fremont · Check-in/out timings, contact details, front-desk notifications, and direct CMS links"
    >
      <div className="space-y-6">
        {/* Core Hotel Profile */}
        <div className="bg-white border border-[#EAE8E3] rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#EAE8E3] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#742B40]/10 text-[#742B40] flex items-center justify-center">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#24272B]">
                  Hotel Fremont · Official Profile
                </h3>
                <p className="text-xs text-[#6B7280]">
                  3-Star Boutique Hotel · 21 Verified Physical Keys
                </p>
              </div>
            </div>

            <Link
              href="/admin/content"
              className="px-4 py-2 rounded-xl bg-[#742B40] text-white text-xs font-semibold hover:bg-[#5b2232] transition flex items-center gap-2"
            >
              <span>Edit via Website CMS</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
            <div className="p-4 rounded-xl bg-[#FAF9F7] border border-[#EAE8E3] space-y-1.5">
              <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider block">
                Official Address
              </span>
              <p className="font-medium text-[#24272B] leading-relaxed">
                Hotel Fremont, Khasra No 186, Sector 80, Village Mauli Baidwan, Airport Road, Mohali (SAS Nagar), Punjab - 140308
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF9F7] border border-[#EAE8E3] space-y-1.5">
              <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider block">
                Front Desk &amp; WhatsApp
              </span>
              <p className="font-mono font-bold text-sm text-[#24272B]">+91 79734 50281</p>
              <p className="text-[11px] text-[#6B7280]">Primary line for bookings, enquiries, and guest support</p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF9F7] border border-[#EAE8E3] space-y-1.5">
              <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider block">
                Notification Email
              </span>
              <p className="font-mono font-bold text-xs text-[#742B40]">hotelfremont1@gmail.com</p>
              <p className="text-[11px] text-[#6B7280]">Receives instant notifications for new bookings and leads</p>
            </div>
          </div>
        </div>

        {/* Razorpay Test Mode & Test Data Cleanup */}
        <TestDataCleanup />

        {/* Operating Hours & Timings */}
        <div className="bg-white border border-[#EAE8E3] rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-[#EAE8E3] pb-3">
            <Clock className="w-4 h-4 text-[#742B40]" />
            <h3 className="font-serif font-bold text-sm text-[#24272B]">
              Standard Timings &amp; Service Hours
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#FAF9F7] border border-[#EAE8E3]">
              <span className="text-[10px] text-[#6B7280] uppercase block font-semibold">Standard Check-In</span>
              <span className="text-base font-bold font-serif text-[#24272B] mt-1 block">12:00 PM (Noon)</span>
              <span className="text-[10px] text-[#6B7280] block mt-0.5">Early check-in subject to room readiness</span>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF9F7] border border-[#EAE8E3]">
              <span className="text-[10px] text-[#6B7280] uppercase block font-semibold">Standard Check-Out</span>
              <span className="text-base font-bold font-serif text-[#24272B] mt-1 block">11:00 AM</span>
              <span className="text-[10px] text-[#6B7280] block mt-0.5">Late check-out available on request</span>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF9F7] border border-[#EAE8E3]">
              <span className="text-[10px] text-[#6B7280] uppercase block font-semibold">In-House Restaurant</span>
              <span className="text-base font-bold font-serif text-[#24272B] mt-1 block">7:00 AM – 11:00 PM</span>
              <span className="text-[10px] text-[#6B7280] block mt-0.5">Ground floor · Room service active</span>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF9F7] border border-[#EAE8E3]">
              <span className="text-[10px] text-[#6B7280] uppercase block font-semibold">Front Desk Reception</span>
              <span className="text-base font-bold font-serif text-emerald-700 mt-1 block">24 Hours Open</span>
              <span className="text-[10px] text-[#6B7280] block mt-0.5">Round-the-clock security &amp; assistance</span>
            </div>
          </div>
        </div>

        {/* Quick Management Shortcuts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link
            href="/admin/images"
            className="p-5 rounded-2xl bg-white border border-[#EAE8E3] hover:border-[#742B40]/40 shadow-sm transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#742B40]/10 text-[#742B40] flex items-center justify-center mb-3">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h4 className="font-serif font-bold text-sm text-[#24272B] group-hover:text-[#742B40] transition">
              Media Library &amp; R2 Vault
            </h4>
            <p className="text-xs text-[#6B7280] mt-1">
              Replace hotel exterior, room, and banquet photos directly without code changes.
            </p>
          </Link>

          <Link
            href="/admin/rates"
            className="p-5 rounded-2xl bg-white border border-[#EAE8E3] hover:border-[#742B40]/40 shadow-sm transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#B69A68]/15 text-[#B69A68] flex items-center justify-center mb-3">
              <CreditCard className="w-5 h-5" />
            </div>
            <h4 className="font-serif font-bold text-sm text-[#24272B] group-hover:text-[#742B40] transition">
              Rates, Tariffs &amp; Plans
            </h4>
            <p className="text-xs text-[#6B7280] mt-1">
              Adjust EP and CP rates across Deluxe, Super Deluxe, and Premium categories.
            </p>
          </Link>

          <Link
            href="/admin/content"
            className="p-5 rounded-2xl bg-white border border-[#EAE8E3] hover:border-[#742B40]/40 shadow-sm transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Globe className="w-5 h-5" />
            </div>
            <h4 className="font-serif font-bold text-sm text-[#24272B] group-hover:text-[#742B40] transition">
              Website CMS &amp; Content
            </h4>
            <p className="text-xs text-[#6B7280] mt-1">
              Edit facilities, venues, nearby landmarks, Google review links, and policy text.
            </p>
          </Link>
        </div>
      </div>
    </AdminLayoutShell>
  );
}
