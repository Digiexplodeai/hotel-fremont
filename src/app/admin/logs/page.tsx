import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { getAuditLogsAction, AuditLogEntry } from "@/actions/recordManagement";
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
  Trash2,
  Archive,
  ShieldAlert,
  AlertCircle,
  Users,
  MessageSquare,
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

  const { logs = [] } = await getAuditLogsAction();

  const getEntityIcon = (type: string, action: string) => {
    const act = action.toLowerCase();
    if (act.includes("delete") || act.includes("cleanup")) return Trash2;
    if (act.includes("archive")) return Archive;
    if (act.includes("blocked")) return ShieldAlert;
    if (type === "reservation" || type === "booking") return CalendarCheck;
    if (type === "guest") return Users;
    if (type === "enquiry") return MessageSquare;
    if (type === "system") return Settings;
    return History;
  };

  const getBadgeStyle = (outcome: string, action: string) => {
    const act = action.toLowerCase();
    if (outcome === "blocked" || act.includes("blocked")) {
      return "bg-rose-50 text-rose-700 border-rose-200";
    }
    if (act.includes("delete") || act.includes("cleanup")) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    if (act.includes("archive")) {
      return "bg-slate-50 text-slate-700 border-slate-200";
    }
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  };

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return ts;
    }
  };

  return (
    <AdminLayoutShell
      userEmail={user.email}
      title="Activity Logs &amp; Audit Trail"
      subtitle="Hotel Fremont · Audit logs of deletions, reservations, customer privacy actions, and system updates"
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
            <span className="text-xs text-[#6B7280]">
              {logs.length} event{logs.length !== 1 ? "s" : ""} recorded
            </span>
          </div>

          {logs.length > 0 ? (
            <div className="divide-y divide-[#EAE8E3]">
              {logs.map((log) => {
                const Icon = getEntityIcon(log.entityType, log.action);
                const badgeClass = getBadgeStyle(log.outcome, log.action);

                return (
                  <div
                    key={log.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF9F7] transition"
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-[#F8F7F4] border border-[#EAE8E3] text-[#742B40] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-xs text-[#24272B]">
                            {log.action}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${badgeClass}`}
                          >
                            {log.entityType} · {log.outcome}
                          </span>
                          <span className="text-[10px] font-mono text-[#9CA3AF] bg-[#F8F7F4] px-1.5 py-0.5 rounded border border-[#EAE8E3]">
                            By {log.adminEmail}
                          </span>
                        </div>
                        <p className="text-xs text-[#6B7280]">{log.details}</p>
                      </div>
                    </div>

                    <span className="text-[11px] text-[#9CA3AF] font-mono shrink-0 pl-12 sm:pl-0">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center space-y-2">
              <History className="w-8 h-8 text-[#9CA3AF] mx-auto" />
              <h4 className="text-sm font-semibold text-[#24272B]">No audit events logged yet</h4>
              <p className="text-xs text-[#6B7280]">
                Administrative operations like deletions, status changes, and data cleanups will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayoutShell>
  );
}
