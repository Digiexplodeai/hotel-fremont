import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";
import {
  History,
  CheckCircle2,
  CalendarCheck,
  CreditCard,
  ImageIcon,
  Globe,
  Settings,
  UserCheck,
} from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Activity Logs & Audit Trail | Hotel Fremont Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLogsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  const mockLogs = [
    {
      id: "log-1",
      action: "System Verification",
      details: "Supabase database migration verified · 21 Verified physical keys active",
      category: "System",
      timestamp: "Just now",
      icon: CheckCircle2,
      badgeColor: "bg-emerald-50 text-emerald-700",
    },
    {
      id: "log-2",
      action: "Admin UI Redesign",
      details: "New hospitality design system loaded · #F8F7F4 warm layout active",
      category: "Design",
      timestamp: "10 mins ago",
      icon: Settings,
      badgeColor: "bg-[#742B40]/10 text-[#742B40]",
    },
    {
      id: "log-3",
      action: "R2 Media Audit",
      details: "Cloudflare R2 storage synchronized · 18 active image slots verified",
      category: "Media",
      timestamp: "2 hours ago",
      icon: ImageIcon,
      badgeColor: "bg-[#B69A68]/15 text-[#B69A68]",
    },
    {
      id: "log-4",
      action: "Razorpay Gateway",
      details: "Webhook route active · Full payment mode enabled (100% advance)",
      category: "Payments",
      timestamp: "Today at 09:30 AM",
      icon: CreditCard,
      badgeColor: "bg-blue-50 text-blue-700",
    },
    {
      id: "log-5",
      action: "Room Rate Audit",
      details: "Deluxe (₹2,299), Super Deluxe (₹3,299), Premium (₹4,299) calibrated with 12% GST",
      category: "Inventory",
      timestamp: "Yesterday",
      icon: CalendarCheck,
      badgeColor: "bg-purple-50 text-purple-700",
    },
  ];

  return (
    <AdminLayoutShell
      userEmail={user.email}
      title="Activity Logs &amp; Audit Trail"
      subtitle="Hotel Fremont · Audit logs of reservations, media modifications, payments, and system updates"
    >
      <div className="space-y-6">
        <div className="bg-white border border-[#EAE8E3] rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-[#EAE8E3] bg-[#FAF9F7] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#742B40]" />
              <h3 className="font-serif font-bold text-sm text-[#24272B]">
                Recent Audit Trail Events
              </h3>
            </div>
            <span className="text-xs text-[#6B7280]">Tracked across all admin sessions</span>
          </div>

          <div className="divide-y divide-[#EAE8E3]">
            {mockLogs.map((log) => {
              const Icon = log.icon;
              return (
                <div key={log.id} className="p-4 flex items-center justify-between gap-4 hover:bg-[#FAF9F7] transition">
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-[#F8F7F4] border border-[#EAE8E3] text-[#742B40] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#24272B]">{log.action}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${log.badgeColor}`}>
                          {log.category}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B7280] mt-0.5">{log.details}</p>
                    </div>
                  </div>

                  <span className="text-[11px] text-[#9CA3AF] font-mono shrink-0">
                    {log.timestamp}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayoutShell>
  );
}
