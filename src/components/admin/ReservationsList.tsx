"use client";

import { useState } from "react";
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
  AlertCircle,
  Loader2,
  User,
  CreditCard,
  ShieldCheck,
  Search,
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
  paid: {
    label: "Paid Online",
    bg: "bg-emerald-500/15",
    text: "text-emerald-300",
    border: "border-emerald-500/40",
    dot: "bg-emerald-400",
  },
  confirmed: {
    label: "Confirmed",
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/30",
    dot: "bg-purple-400",
  },
  pending: {
    label: "Pending Payment",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
    dot: "bg-amber-400",
  },
  contacted: {
    label: "Contacted",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/30",
    dot: "bg-blue-400",
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
  refunded: {
    label: "Refunded",
    bg: "bg-purple-500/15",
    text: "text-purple-300",
    border: "border-purple-500/40",
    dot: "bg-purple-400",
  },
  failed: {
    label: "Payment Failed",
    bg: "bg-rose-500/15",
    text: "text-rose-400",
    border: "border-rose-500/30",
    dot: "bg-rose-400",
  },
  expired: {
    label: "Expired",
    bg: "bg-zinc-500/10",
    text: "text-zinc-400",
    border: "border-zinc-500/30",
    dot: "bg-zinc-400",
  },
  checked_in: {
    label: "Checked In",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/30",
    dot: "bg-blue-400 animate-pulse",
  },
  checked_out: {
    label: "Checked Out",
    bg: "bg-zinc-500/10",
    text: "text-zinc-400",
    border: "border-zinc-500/30",
    dot: "bg-zinc-400",
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
  const [filterDate, setFilterDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
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

  // Status change handler (including Cancelled & Refunded)
  const handleStatusChange = async (id: string, newStatus: ReservationStatus) => {
    setUpdatingId(id);
    setErrorNotice(null);
    try {
      const res = await updateReservationStatusAction(id, newStatus);
      if (res.success) {
        setReservations((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
        );
        setSuccessNotice(`Reservation status updated to '${newStatus}'.`);
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

  // Filtered list by status, date and search query
  const filtered = reservations.filter((r) => {
    // Status filter
    if (filterStatus !== "all") {
      if (filterStatus === "paid" && r.status !== "paid") return false;
      if (filterStatus === "pending" && r.status !== "pending") return false;
      if (filterStatus === "confirmed" && r.status !== "confirmed" && r.status !== "paid") return false;
      if (filterStatus === "cancelled" && r.status !== "cancelled") return false;
      if (filterStatus === "refunded" && r.status !== "refunded") return false;
      if (filterStatus === "failed" && r.status !== "failed") return false;
    }

    // Date filter (matches check_in or check_out)
    if (filterDate) {
      if (r.check_in !== filterDate && r.check_out !== filterDate) {
        return false;
      }
    }

    // Search query filter (matches name, phone, ref, or payment id)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchName = r.full_name?.toLowerCase().includes(q);
      const matchPhone = r.phone?.includes(q);
      const matchRef = r.reference_code?.toLowerCase().includes(q);
      const matchPayId = r.razorpay_payment_id?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchRef && !matchPayId) {
        return false;
      }
    }

    return true;
  });

  const paidCount = reservations.filter((r) => r.status === "paid").length;

  return (
    <div className="bg-white border border-[#EAE8E3] rounded-2xl overflow-hidden shadow-xl">
      {/* Header Bar */}
      <div className="p-5 border-b border-[#EAE8E3] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-black/40 via-transparent to-black/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-base sm:text-lg font-serif font-bold text-[#24272B]">
              Bookings &amp; Online Payments
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-[#742B40]/15 text-[#742B40] border border-[#742B40]/30 text-[11px] font-bold font-mono">
              {reservations.length} Total
            </span>
            {paidCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                {paidCount} Paid Online
              </span>
            )}
          </div>
          <p className="text-xs text-[#6B7280]">
            Real-time Razorpay checkout transactions and confirmed stays from <code className="text-[#B69A68] font-mono">public.bookings</code> &amp; <code className="text-[#B69A68] font-mono">public.reservations</code>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-[#F8F7F4] hover:bg-white/5 border border-[#EAE8E3] hover:border-[#EAE8E3] text-xs text-[#24272B] flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            title="Reload from Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#B69A68] ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-black/30 border-b border-[#EAE8E3] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between text-xs">
        {/* Status Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "all", label: "All" },
            { id: "paid", label: "Paid" },
            { id: "confirmed", label: "Confirmed" },
            { id: "pending", label: "Pending" },
            { id: "cancelled", label: "Cancelled" },
            { id: "refunded", label: "Refunded" },
            { id: "failed", label: "Failed" },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setFilterStatus(st.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
                filterStatus === st.id
                  ? "bg-[#742B40] text-white font-semibold shadow"
                  : "text-[#6B7280] hover:text-white bg-[#F8F7F4] border border-[#EAE8E3]"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Date & Search Inputs */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Date Picker Filter */}
          <div className="flex items-center gap-1.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl px-2.5 py-1.5 text-xs text-[#24272B]">
            <Calendar className="w-3.5 h-3.5 text-[#B69A68]" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-transparent text-xs text-[#24272B] focus:outline-none [color-scheme:dark]"
              title="Filter by stay date"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate("")}
                className="text-white/40 hover:text-white text-xs ml-1"
                title="Clear date filter"
              >
                ✕
              </button>
            )}
          </div>

          {/* Search box */}
          <div className="flex items-center gap-1.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl px-3 py-1.5 text-xs text-[#24272B] w-full sm:w-48">
            <Search className="w-3.5 h-3.5 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search ref, guest, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent w-full text-xs text-[#24272B] focus:outline-none placeholder-[#A8A59E]/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-white/40 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
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
          <Loader2 className="w-8 h-8 text-[#742B40] animate-spin mx-auto" />
          <p className="text-xs text-[#6B7280]">Fetching records from Supabase...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center space-y-3 px-4">
          <div className="w-12 h-12 rounded-full bg-white/5 border border-[#EAE8E3] mx-auto flex items-center justify-center text-[#6B7280]">
            <Calendar className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-serif font-bold text-[#24272B]">
            {filterStatus === "all" && !filterDate && !searchQuery
              ? "No reservations found"
              : "No matching reservations for selected filters"}
          </h4>
          <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
            Bookings made through Razorpay or front desk reservations will be displayed here in real time.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/50 text-[#6B7280] font-mono border-b border-[#EAE8E3] uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Booking Ref &amp; Guest</th>
                <th className="py-3 px-4">Suite &amp; Stay Dates</th>
                <th className="py-3 px-4">Payment Details</th>
                <th className="py-3 px-4">Status &amp; Channel</th>
                <th className="py-3 px-4">Update Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[#24272B]">
              {filtered.map((r) => {
                const conf = statusConfig[r.status] || statusConfig.new;
                const cleanPhone = r.phone?.replace(/\D/g, "") || "";
                const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : "#";

                const dIn = new Date(r.check_in);
                const dOut = new Date(r.check_out);
                const diffDays = Math.max(1, Math.round((dOut.getTime() - dIn.getTime()) / (1000 * 3600 * 24)));

                const isPaidOnline = r.status === "paid" || (r.amount_paid && r.amount_paid > 0);

                return (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition">
                    {/* Booking Ref & Guest */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-[#742B40] text-xs">
                          {r.reference_code || `FRM-${r.id.slice(0, 6).toUpperCase()}`}
                        </span>
                        {r.channel === "razorpay" && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-mono font-semibold">
                            Razorpay
                          </span>
                        )}
                      </div>
                      <div className="font-semibold text-white text-sm flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#B69A68]" />
                        <span>{r.full_name}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-[#6B7280]">
                        <a
                          href={`tel:${r.phone}`}
                          className="hover:text-white flex items-center gap-1 font-mono"
                        >
                          <Phone className="w-3 h-3 text-[#742B40]" />
                          <span>{r.phone}</span>
                        </a>
                        {cleanPhone && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#25D366] hover:underline flex items-center gap-1"
                            title="Chat on WhatsApp"
                          >
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>
                      {r.email && (
                        <div className="flex items-center gap-1 text-[11px] text-[#6B7280] mt-0.5">
                          <Mail className="w-3 h-3 text-[#B69A68]" />
                          <span className="truncate max-w-[200px]">{r.email}</span>
                        </div>
                      )}
                      {r.special_request && (
                        <div className="mt-1.5 p-1.5 rounded-lg bg-[#F8F7F4] border border-[#EAE8E3] text-[11px] text-[#B69A68] max-w-xs">
                          <span className="font-semibold uppercase text-[9px] block text-[#6B7280]">
                            Request:
                          </span>
                          {r.special_request}
                        </div>
                      )}
                    </td>

                    {/* Suite & Stay Dates */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-white">{r.room_type}</div>
                      <div className="text-[11px] text-[#6B7280] flex items-center gap-1 mt-0.5 font-mono">
                        <Users className="w-3 h-3 text-[#B69A68]" />
                        <span>
                          {r.rooms_requested || 1} Room(s) · {r.guests} Guest(s)
                        </span>
                      </div>
                      <div className="mt-2 font-mono text-[11px]">
                        <div className="text-white">In: {r.check_in}</div>
                        <div className="text-[#6B7280]">Out: {r.check_out} ({diffDays}N)</div>
                      </div>
                    </td>

                    {/* Payment Details */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="font-mono font-bold text-white text-sm">
                          ₹{Number(r.estimated_total).toLocaleString("en-IN")}
                        </div>

                        {isPaidOnline ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Paid in Full</span>
                          </div>
                        ) : r.status === "refunded" ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-semibold">
                            <span>Refund Processed</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-amber-400 font-mono">
                            Pending Payment
                          </div>
                        )}

                        {r.razorpay_payment_id && (
                          <div className="text-[10px] font-mono text-white/50 pt-1" title={r.razorpay_payment_id}>
                            Pay ID: <span className="text-white/80">{r.razorpay_payment_id.slice(-8)}</span>
                          </div>
                        )}
                        {r.payment_method && (
                          <div className="text-[10px] uppercase font-mono text-white/40">
                            Method: {r.payment_method}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${conf.bg} ${conf.text} border ${conf.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                        {conf.label}
                      </span>
                      <div className="text-[10px] text-[#6B7280]/60 font-mono mt-1">
                        {new Date(r.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                    </td>

                    {/* Update Status Dropdown (Cancelled, Refunded, etc.) */}
                    <td className="py-3.5 px-4">
                      <select
                        disabled={updatingId === r.id}
                        value={r.status}
                        onChange={(e) => handleStatusChange(r.id, e.target.value as ReservationStatus)}
                        className="bg-black/60 border border-[#EAE8E3] rounded-lg px-2.5 py-1.5 text-[11px] text-[#24272B] focus:border-[#742B40] focus:outline-none cursor-pointer"
                      >
                        <option value="paid">Mark as: Paid</option>
                        <option value="confirmed">Mark as: Confirmed</option>
                        <option value="cancelled">Mark as: Cancelled</option>
                        <option value="refunded">Mark as: Refunded</option>
                        <option value="contacted">Mark as: Contacted</option>
                      </select>
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
