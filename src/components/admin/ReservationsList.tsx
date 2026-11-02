"use client";

import { useState, useTransition } from "react";
import {
  ReservationRecord,
  ReservationStatus,
  getReservationsAction,
  updateReservationStatusAction,
  deleteReservationAction,
} from "@/actions/reservations";
import {
  RefreshCw,
  Trash2,
  Phone,
  Mail,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  MessageSquare,
  AlertCircle,
  Loader2,
  ChevronRight,
  User,
} from "lucide-react";

interface ReservationsListProps {
  initialReservations: ReservationRecord[];
}

const statusConfig: Record<
  ReservationStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  new: {
    label: "New Request",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    dot: "bg-emerald-400 animate-pulse",
  },
  contacted: {
    label: "Contacted",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/30",
    dot: "bg-blue-400",
  },
  confirmed: {
    label: "Confirmed",
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/30",
    dot: "bg-purple-400",
  },
  converted: {
    label: "Converted",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  in_discussion: {
    label: "In Discussion",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
    dot: "bg-amber-400",
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/30",
    dot: "bg-rose-400",
  },
  closed: {
    label: "Closed",
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    border: "border-slate-500/30",
    dot: "bg-slate-400",
  },
};

export default function ReservationsList({
  initialReservations,
}: ReservationsListProps) {
  const [reservations, setReservations] = useState<ReservationRecord[]>(initialReservations);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Manual refresh from Supabase
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setErrorNotice(null);
    try {
      const res = await getReservationsAction();
      if (res.success) {
        setReservations(res.reservations);
        setSuccessNotice("Reservations refreshed from Supabase.");
        setTimeout(() => setSuccessNotice(null), 3000);
      } else {
        setErrorNotice(res.error || "Failed to refresh reservations.");
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorNotice(error.message || "Network error while refreshing.");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Status change handler
  const handleStatusChange = async (id: string, newStatus: ReservationStatus) => {
    setUpdatingId(id);
    setErrorNotice(null);
    try {
      const res = await updateReservationStatusAction(id, newStatus);
      if (res.success) {
        setReservations((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
        );
        setSuccessNotice(`Reservation updated to '${newStatus}'.`);
        setTimeout(() => setSuccessNotice(null), 3000);
      } else {
        setErrorNotice(res.error || "Failed to update reservation status.");
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorNotice(error.message || "Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete handler
  const handleDelete = async (id: string, guestName: string) => {
    if (!confirm(`Are you sure you want to permanently delete the reservation for "${guestName}"?`)) {
      return;
    }

    setDeletingId(id);
    setErrorNotice(null);
    try {
      const res = await deleteReservationAction(id);
      if (res.success) {
        setReservations((prev) => prev.filter((r) => r.id !== id));
        setSuccessNotice(`Reservation for "${guestName}" deleted.`);
        setTimeout(() => setSuccessNotice(null), 3000);
      } else {
        setErrorNotice(res.error || "Failed to delete reservation.");
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorNotice(error.message || "Failed to delete reservation.");
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered list
  const filtered = reservations.filter((r) => {
    if (filterStatus === "all") return true;
    return r.status === filterStatus;
  });

  const newCount = reservations.filter((r) => r.status === "new").length;

  return (
    <div className="bg-[#151518] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
      {/* Header Bar */}
      <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-black/40 via-transparent to-black/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h3 className="text-base sm:text-lg font-serif font-bold text-[#F7F3EC]">
              Online Guest Reservations
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-[#E02B1D]/15 text-[#E02B1D] border border-[#E02B1D]/30 text-[11px] font-bold font-mono">
              {reservations.length} Total
            </span>
            {newCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {newCount} New
              </span>
            )}
          </div>
          <p className="text-xs text-[#A8A59E]">
            Directly synced with <code className="text-[#C9A96E] font-mono">public.reservations</code> in Supabase PostgreSQL
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1 text-xs">
            {["all", "new", "contacted", "confirmed", "cancelled"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg font-medium capitalize transition cursor-pointer ${
                  filterStatus === st
                    ? "bg-[#E02B1D] text-white font-semibold"
                    : "text-[#A8A59E] hover:text-white"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-black/40 hover:bg-white/5 border border-white/10 hover:border-white/20 text-xs text-[#F7F3EC] flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            title="Reload from Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C9A96E] ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorNotice && (
        <div className="px-5 py-3 bg-red-950/60 border-b border-red-500/30 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {successNotice && (
        <div className="px-5 py-2.5 bg-emerald-950/60 border-b border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Table / List */}
      {isRefreshing && reservations.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#E02B1D] animate-spin mx-auto" />
          <p className="text-xs text-[#A8A59E]">Fetching reservations from Supabase...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center space-y-3 px-4">
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-[#A8A59E]">
            <Calendar className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-serif font-bold text-[#F7F3EC]">
            {filterStatus === "all" ? "No reservation requests yet" : `No reservations marked '${filterStatus}'`}
          </h4>
          <p className="text-xs text-[#A8A59E] max-w-sm mx-auto">
            When guests submit reservation requests from the website, they will appear here in real time.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/50 text-[#A8A59E] font-mono border-b border-white/10 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Guest Details</th>
                <th className="py-3 px-4">Suite &amp; Guests</th>
                <th className="py-3 px-4">Stay Dates</th>
                <th className="py-3 px-4">Est. Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[#F7F3EC]">
              {filtered.map((r) => {
                const conf = statusConfig[r.status] || statusConfig.new;
                const cleanPhone = r.phone.replace(/\D/g, "");
                const waUrl = `https://wa.me/${cleanPhone}`;

                // Calculate duration in days
                const dIn = new Date(r.check_in);
                const dOut = new Date(r.check_out);
                const diffDays = Math.max(1, Math.round((dOut.getTime() - dIn.getTime()) / (1000 * 3600 * 24)));

                return (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition">
                    {/* Guest Details */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white text-sm flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#C9A96E]" />
                        <span>{r.full_name}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-[#A8A59E]">
                        <a
                          href={`tel:${r.phone}`}
                          className="hover:text-white flex items-center gap-1 font-mono"
                        >
                          <Phone className="w-3 h-3 text-[#E02B1D]" />
                          <span>{r.phone}</span>
                        </a>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#25D366] hover:underline flex items-center gap-1"
                          title="Chat on WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                      {r.email && (
                        <div className="flex items-center gap-1 text-[11px] text-[#A8A59E] mt-0.5">
                          <Mail className="w-3 h-3 text-[#C9A96E]" />
                          <span className="truncate max-w-[200px]">{r.email}</span>
                        </div>
                      )}
                      {r.special_request && (
                        <div className="mt-1.5 p-1.5 rounded-lg bg-black/40 border border-white/5 text-[11px] text-[#C9A96E] max-w-xs">
                          <span className="font-semibold uppercase text-[9px] block text-[#A8A59E]">
                            Note:
                          </span>
                          {r.special_request}
                        </div>
                      )}
                    </td>

                    {/* Suite & Guests */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-white">{r.room_type}</div>
                      <div className="text-[11px] text-[#A8A59E] flex items-center gap-1 mt-0.5 font-mono">
                        <Users className="w-3 h-3 text-[#C9A96E]" />
                        <span>
                          {r.guests} {r.guests === 1 ? "Guest" : "Guests"}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#A8A59E]/60 font-mono mt-1">
                        Received: {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>

                    {/* Stay Dates */}
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div className="text-white">In: {r.check_in}</div>
                      <div className="text-[#A8A59E]">Out: {r.check_out}</div>
                      <div className="text-[#C9A96E] text-[10px] font-semibold mt-0.5">
                        {diffDays} {diffDays === 1 ? "Night" : "Nights"}
                      </div>
                    </td>

                    {/* Estimated Total */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-white text-sm">
                        ₹{Number(r.estimated_total).toLocaleString("en-IN")}
                      </div>
                      <span className="text-[10px] text-[#A8A59E] font-mono">Incl. Taxes & GST</span>
                    </td>

                    {/* Status with Live Changer */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${conf.bg} ${conf.text} border ${conf.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                          {conf.label}
                        </span>

                        <div>
                          <select
                            disabled={updatingId === r.id}
                            value={r.status}
                            onChange={(e) => handleStatusChange(r.id, e.target.value as ReservationStatus)}
                            className="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none cursor-pointer"
                          >
                            <option value="new">Mark as: New</option>
                            <option value="contacted">Mark as: Contacted</option>
                            <option value="confirmed">Mark as: Confirmed</option>
                            <option value="cancelled">Mark as: Cancelled</option>
                          </select>
                        </div>
                      </div>
                    </td>

                    {/* Delete Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(r.id, r.full_name)}
                        disabled={deletingId === r.id}
                        className="p-2 rounded-lg border border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-950/30 transition cursor-pointer disabled:opacity-50"
                        title="Delete reservation"
                      >
                        {deletingId === r.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

