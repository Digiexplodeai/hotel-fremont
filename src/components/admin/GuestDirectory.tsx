"use client";

import React, { useState, useMemo } from "react";
import { BookingRecord } from "@/actions/rooms";
import { ReservationRecord } from "@/actions/reservations";
import { formatINR } from "@/config/hotel";
import {
  Users,
  Search,
  Filter,
  Phone,
  Mail,
  Calendar,
  IndianRupee,
  BedDouble,
  MessageSquare,
  Sparkles,
  ChevronRight,
  X,
  History,
  Tag,
  ShieldCheck,
  CheckCircle2,
  MoreVertical,
  Trash2,
  Archive,
  Edit3,
  AlertTriangle,
  UserX,
} from "lucide-react";
import {
  deleteGuestDataAction,
  archiveGuestAction,
} from "@/actions/recordManagement";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

export interface GuestProfile {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  totalStays: number;
  totalSpend: number;
  firstStay: string;
  lastStay: string;
  preferredRoom: string;
  isRepeatGuest: boolean;
  notes: string[];
  records: {
    type: "booking" | "reservation";
    reference: string;
    checkIn: string;
    checkOut: string;
    roomType: string;
    amount: number;
    status: string;
  }[];
}

interface GuestDirectoryProps {
  bookings: BookingRecord[];
  reservations: ReservationRecord[];
}

export default function GuestDirectory({ bookings, reservations }: GuestDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "repeat" | "high_spend">("all");
  const [selectedGuest, setSelectedGuest] = useState<GuestProfile | null>(null);

  // Action menu & deletion state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [deleteModalGuest, setDeleteModalGuest] = useState<GuestProfile | null>(null);
  const [activeStayWarning, setActiveStayWarning] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [deletedGuestKeys, setDeletedGuestKeys] = useState<string[]>([]);

  // Close menu on click outside
  React.useEffect(() => {
    const handleWindowClick = () => setActiveMenuId(null);
    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, []);

  const handleInitiateDeleteGuest = (guest: GuestProfile) => {
    setActiveMenuId(null);
    setActiveStayWarning(null);

    const todayStr = new Date().toISOString().slice(0, 10);
    const activeStay = guest.records.find(
      (r) => r.checkOut >= todayStr && (r.status === "confirmed" || r.status === "paid")
    );

    if (activeStay) {
      setActiveStayWarning(
        `Cannot delete ${guest.name}: Guest has an active or upcoming stay (${activeStay.roomType}, Booking ${activeStay.reference} until ${activeStay.checkOut}). Please complete checkout or cancel the stay first.`
      );
      return;
    }

    setDeleteModalGuest(guest);
  };

  const handleArchiveGuest = async (guest: GuestProfile) => {
    setActiveMenuId(null);
    const res = await archiveGuestAction(
      { phone: guest.phone, email: guest.email || undefined, name: guest.name },
      "Archived from guest directory"
    );
    if (res.success) {
      const cleanPhone = guest.phone ? guest.phone.replace(/\D/g, "").slice(-10) : "";
      const key = cleanPhone || guest.email?.toLowerCase() || guest.name.toLowerCase();
      setDeletedGuestKeys((prev) => [...prev, key]);
      setActionFeedback(`Guest ${guest.name} archived.`);
      setTimeout(() => setActionFeedback(null), 4000);
    } else {
      alert(res.error || "Failed to archive guest.");
    }
  };

  const handleConfirmDeleteGuest = async () => {
    if (!deleteModalGuest) return;
    const res = await deleteGuestDataAction(
      {
        phone: deleteModalGuest.phone,
        email: deleteModalGuest.email || undefined,
        name: deleteModalGuest.name,
      },
      { reason: "Permanently deleted customer data from guest directory" }
    );

    if (res.success) {
      const cleanPhone = deleteModalGuest.phone ? deleteModalGuest.phone.replace(/\D/g, "").slice(-10) : "";
      const key = cleanPhone || deleteModalGuest.email?.toLowerCase() || deleteModalGuest.name.toLowerCase();
      setDeletedGuestKeys((prev) => [...prev, key]);
      setActionFeedback(`Customer data for ${deleteModalGuest.name} permanently deleted.`);
      setTimeout(() => setActionFeedback(null), 4000);
    } else {
      throw new Error(res.error || "Failed to delete customer data.");
    }
  };

  // Aggregate unique guests
  const guestProfiles = useMemo(() => {
    const map = new Map<string, GuestProfile>();

    const getCleanPhone = (phone: string) => phone.replace(/\D/g, "").slice(-10);

    // Process online bookings
    bookings.forEach((b) => {
      const cleanPhone = getCleanPhone(b.guestPhone || "");
      const key = cleanPhone || b.guestEmail?.toLowerCase() || b.guestName.toLowerCase();
      if (!key) return;

      const existing = map.get(key);
      const record = {
        type: "booking" as const,
        reference: b.bookingCode,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        roomType: b.categoryName || b.categorySlug,
        amount: b.totalAmount || 0,
        status: b.status,
      };

      if (existing) {
        existing.totalStays += 1;
        existing.totalSpend += b.totalAmount || 0;
        existing.isRepeatGuest = true;
        if (new Date(b.checkIn) > new Date(existing.lastStay)) {
          existing.lastStay = b.checkIn;
          existing.preferredRoom = b.categoryName || b.categorySlug;
        }
        if (b.notes && !existing.notes.includes(b.notes)) {
          existing.notes.push(b.notes);
        }
        existing.records.push(record);
      } else {
        map.set(key, {
          id: b.id,
          name: b.guestName,
          phone: b.guestPhone,
          email: b.guestEmail || null,
          totalStays: 1,
          totalSpend: b.totalAmount || 0,
          firstStay: b.checkIn,
          lastStay: b.checkIn,
          preferredRoom: b.categoryName || b.categorySlug,
          isRepeatGuest: false,
          notes: b.notes ? [b.notes] : [],
          records: [record],
        });
      }
    });

    // Process front desk reservations
    reservations.forEach((r) => {
      const cleanPhone = getCleanPhone(r.phone || "");
      const key = cleanPhone || r.email?.toLowerCase() || r.full_name.toLowerCase();
      if (!key) return;

      const existing = map.get(key);
      const record = {
        type: "reservation" as const,
        reference: r.reference_code || r.id.slice(0, 8),
        checkIn: r.check_in,
        checkOut: r.check_out,
        roomType: r.room_type,
        amount: r.estimated_total || 0,
        status: r.status,
      };

      if (existing) {
        existing.totalStays += 1;
        existing.totalSpend += r.estimated_total || 0;
        existing.isRepeatGuest = true;
        if (new Date(r.check_in) > new Date(existing.lastStay)) {
          existing.lastStay = r.check_in;
          existing.preferredRoom = r.room_type;
        }
        if (r.special_request && !existing.notes.includes(r.special_request)) {
          existing.notes.push(r.special_request);
        }
        existing.records.push(record);
      } else {
        map.set(key, {
          id: r.id,
          name: r.full_name,
          phone: r.phone,
          email: r.email,
          totalStays: 1,
          totalSpend: r.estimated_total || 0,
          firstStay: r.check_in,
          lastStay: r.check_in,
          preferredRoom: r.room_type,
          isRepeatGuest: false,
          notes: r.special_request ? [r.special_request] : [],
          records: [record],
        });
      }
    });

    return Array.from(map.entries())
      .filter(([key]) => !deletedGuestKeys.includes(key))
      .map(([, val]) => val)
      .sort((a, b) => new Date(b.lastStay).getTime() - new Date(a.lastStay).getTime());
  }, [bookings, reservations, deletedGuestKeys]);

  // Filtered guest list
  const filteredGuests = useMemo(() => {
    return guestProfiles.filter((g) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        g.name.toLowerCase().includes(q) ||
        g.phone.includes(q) ||
        (g.email && g.email.toLowerCase().includes(q)) ||
        g.preferredRoom.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (filterType === "repeat") return g.isRepeatGuest;
      if (filterType === "high_spend") return g.totalSpend >= 5000;

      return true;
    });
  }, [guestProfiles, searchQuery, filterType]);

  const totalRevenue = useMemo(() => {
    return guestProfiles.reduce((acc, g) => acc + g.totalSpend, 0);
  }, [guestProfiles]);

  const repeatCount = useMemo(() => {
    return guestProfiles.filter((g) => g.isRepeatGuest).length;
  }, [guestProfiles]);

  return (
    <div className="space-y-6">
      {/* Feedback & Warnings */}
      {activeStayWarning && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-300 text-xs flex items-start gap-2.5 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block mb-0.5">Active Reservation Conflict</span>
            <span>{activeStayWarning}</span>
          </div>
          <button onClick={() => setActiveStayWarning(null)} className="text-amber-400 hover:text-amber-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1A191D] border border-[#373138] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8A85]">
              Total Guest Profiles
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#742B40]/25 text-[#ED252C] border border-[#742B40]/40 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-[#F5F2EF] mt-2">
            {guestProfiles.length}
          </div>
          <p className="text-xs text-[#8E8A85] mt-1">Direct booking &amp; reservation contacts</p>
        </div>

        <div className="bg-[#1A191D] border border-[#373138] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8A85]">
              Repeat Guests
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-[#F5F2EF] mt-2">
            {repeatCount}
          </div>
          <p className="text-xs text-[#8E8A85] mt-1">Multi-stay loyal customers</p>
        </div>

        <div className="bg-[#1A191D] border border-[#373138] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8A85]">
              Total Lifetime Spend
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#232126] border border-[#373138] text-[#C6A16A] flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-[#ED252C] mt-2">
            {formatINR(totalRevenue)}
          </div>
          <p className="text-xs text-[#8E8A85] mt-1">Online &amp; confirmed reservations</p>
        </div>

        <div className="bg-[#1A191D] border border-[#373138] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8A85]">
              Avg. Spend / Guest
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-950/60 text-blue-400 border border-blue-800/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-[#F5F2EF] mt-2">
            {guestProfiles.length > 0 ? formatINR(Math.round(totalRevenue / guestProfiles.length)) : "₹0"}
          </div>
          <p className="text-xs text-[#8E8A85] mt-1">Across all room categories</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-[#1A191D] border border-[#373138] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#8E8A85] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, email, room..."
            className="w-full pl-10 pr-4 py-2 bg-[#0D0D10] border border-[#373138] rounded-xl text-xs text-[#F5F2EF] placeholder-[#8E8A85] focus:outline-none focus:border-[#C6A16A] transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8A85] hover:text-[#F5F2EF] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              filterType === "all"
                ? "bg-[#742B40] text-white border border-[#C6A16A]/20 shadow-sm"
                : "bg-[#232126] text-[#B7A9A7] hover:text-[#F5F2EF] border border-[#373138]"
            }`}
          >
            All Guests ({guestProfiles.length})
          </button>
          <button
            onClick={() => setFilterType("repeat")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              filterType === "repeat"
                ? "bg-[#742B40] text-white border border-[#C6A16A]/20 shadow-sm"
                : "bg-[#232126] text-[#B7A9A7] hover:text-[#F5F2EF] border border-[#373138]"
            }`}
          >
            Repeat Guests ({repeatCount})
          </button>
          <button
            onClick={() => setFilterType("high_spend")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              filterType === "high_spend"
                ? "bg-[#742B40] text-white border border-[#C6A16A]/20 shadow-sm"
                : "bg-[#232126] text-[#B7A9A7] hover:text-[#F5F2EF] border border-[#373138]"
            }`}
          >
            High Spend (&gt; ₹5,000)
          </button>
        </div>
      </div>

      {/* Guest Directory Table */}
      <div className="bg-[#1A191D] border border-[#373138] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#232126] border-b border-[#373138] text-[#8E8A85] uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Guest Profile</th>
                <th className="py-3 px-4">Contact Details</th>
                <th className="py-3 px-4">Total Stays</th>
                <th className="py-3 px-4">Lifetime Spend</th>
                <th className="py-3 px-4">Preferred Category</th>
                <th className="py-3 px-4">Last Stay</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#373138]">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8E8A85]">
                    No guest profiles found matching your search.
                  </td>
                </tr>
              ) : (
                filteredGuests.map((guest) => {
                  const cleanPhone = guest.phone ? guest.phone.replace(/\D/g, "").slice(-10) : "";
                  return (
                    <tr
                      key={guest.id}
                      className="hover:bg-[#232126]/60 transition cursor-pointer"
                      onClick={() => setSelectedGuest(guest)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#742B40]/25 text-[#C6A16A] border border-[#742B40]/40 flex items-center justify-center font-bold font-serif text-sm">
                            {guest.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-[#F5F2EF] flex items-center gap-2">
                              <span>{guest.name}</span>
                              {guest.isRepeatGuest && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 text-[10px] font-bold border border-emerald-800/50">
                                  Repeat
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#8E8A85]">
                              {guest.records.length} booking record{guest.records.length > 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-[#F5F2EF] font-mono">
                          <Phone className="w-3 h-3 text-[#8E8A85]" />
                          <span>{guest.phone || "—"}</span>
                        </div>
                        {guest.email && (
                          <div className="flex items-center gap-1.5 text-[#8E8A85]">
                            <Mail className="w-3 h-3 text-[#8E8A85]" />
                            <span className="truncate max-w-[180px]">{guest.email}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-[#F5F2EF]">
                        {guest.totalStays} stay{guest.totalStays > 1 ? "s" : ""}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-[#ED252C] font-mono">
                        {formatINR(guest.totalSpend)}
                      </td>

                      <td className="py-3.5 px-4 text-[#B7A9A7]">
                        <span className="px-2 py-1 rounded-lg bg-[#232126] border border-[#373138] text-[11px] font-medium">
                          {guest.preferredRoom || "Standard"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-[#8E8A85] font-mono">
                        {guest.lastStay ? new Date(guest.lastStay).toLocaleDateString("en-IN") : "—"}
                      </td>

                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 relative">
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/91${cleanPhone}?text=Hello%20${encodeURIComponent(guest.name)},%20greetings%20from%20Hotel%20Fremont%20Mohali.`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-900/60 transition"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {cleanPhone && (
                            <a
                              href={`tel:+91${cleanPhone}`}
                              className="p-1.5 rounded-lg bg-blue-950/60 text-blue-400 border border-blue-800/40 hover:bg-blue-900/60 transition"
                              title="Call Guest"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => setSelectedGuest(guest)}
                            className="p-1.5 rounded-lg text-[#8E8A85] hover:text-[#C6A16A] hover:bg-[#232126] transition cursor-pointer"
                            title="View Guest History"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>

                          {/* Three-dot action menu */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === guest.id ? null : guest.id);
                              }}
                              className="p-1.5 rounded-lg text-[#8E8A85] hover:text-[#F5F2EF] hover:bg-[#232126] border border-transparent hover:border-[#373138] transition cursor-pointer"
                              title="Customer Controls"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {activeMenuId === guest.id && (
                              <div
                                className="absolute right-0 top-full mt-1 w-52 bg-[#1A191D] border border-[#373138] rounded-xl shadow-xl py-1 z-30 text-left text-xs animate-in fade-in duration-150 text-[#F5F2EF]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setSelectedGuest(guest);
                                  }}
                                  className="w-full px-3 py-1.5 hover:bg-[#232126] text-[#F5F2EF] flex items-center gap-2 transition cursor-pointer"
                                >
                                  <Users className="w-3.5 h-3.5 text-[#C6A16A]" />
                                  <span>View Guest Profile</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setSelectedGuest(guest);
                                  }}
                                  className="w-full px-3 py-1.5 hover:bg-[#232126] text-[#F5F2EF] flex items-center gap-2 transition cursor-pointer"
                                >
                                  <History className="w-3.5 h-3.5 text-[#C6A16A]" />
                                  <span>View Stay History</span>
                                </button>
                                <button
                                  onClick={() => handleArchiveGuest(guest)}
                                  className="w-full px-3 py-1.5 hover:bg-[#232126] text-[#B7A9A7] flex items-center gap-2 transition cursor-pointer"
                                >
                                  <Archive className="w-3.5 h-3.5 text-[#8E8A85]" />
                                  <span>Archive Guest</span>
                                </button>
                                <div className="border-t border-[#373138] my-1" />
                                <button
                                  onClick={() => handleInitiateDeleteGuest(guest)}
                                  className="w-full px-3 py-1.5 hover:bg-rose-950/40 text-rose-400 flex items-center gap-2 transition cursor-pointer font-medium"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete Customer Data</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guest Details Drawer */}
      {selectedGuest && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end">
          <div className="w-full max-w-lg bg-[#1A191D] border-l border-[#373138] text-[#F5F2EF] h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div>
              {/* Header */}
              <div className="p-6 border-b border-[#373138] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#742B40] border border-[#C6A16A]/30 text-white flex items-center justify-center font-serif font-bold text-lg">
                    {selectedGuest.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-serif text-[#F5F2EF] flex items-center gap-2">
                      <span>{selectedGuest.name}</span>
                      {selectedGuest.isRepeatGuest && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 text-[10px] font-bold">
                          VIP Repeat
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-[#8E8A85]">Customer History &amp; CRM Profile</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedGuest(null)}
                  className="p-2 rounded-xl text-[#8E8A85] hover:text-[#F5F2EF] hover:bg-[#232126] transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Guest Summary Card */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#232126] border border-[#373138]">
                    <span className="text-[10px] uppercase font-semibold text-[#8E8A85] block">
                      Lifetime Spend
                    </span>
                    <span className="text-lg font-bold font-mono text-[#ED252C] mt-1 block">
                      {formatINR(selectedGuest.totalSpend)}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#232126] border border-[#373138]">
                    <span className="text-[10px] uppercase font-semibold text-[#8E8A85] block">
                      Total Stays
                    </span>
                    <span className="text-lg font-bold font-mono text-[#F5F2EF] mt-1 block">
                      {selectedGuest.totalStays} reservation{selectedGuest.totalStays > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Contact details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8E8A85]">
                    Contact Information
                  </h4>
                  <div className="p-4 rounded-xl border border-[#373138] bg-[#232126] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8E8A85]">Phone:</span>
                      <span className="font-mono font-semibold text-[#F5F2EF]">
                        {selectedGuest.phone || "—"}
                      </span>
                    </div>
                    {selectedGuest.email && (
                      <div className="flex items-center justify-between">
                        <span className="text-[#8E8A85]">Email:</span>
                        <span className="font-mono text-[#F5F2EF]">{selectedGuest.email}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[#8E8A85]">Preferred Category:</span>
                      <span className="font-semibold text-[#C6A16A]">
                        {selectedGuest.preferredRoom || "Standard"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stay History Timeline */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8E8A85] flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-[#C6A16A]" />
                    <span>Booking &amp; Stay History ({selectedGuest.records.length})</span>
                  </h4>

                  <div className="space-y-2">
                    {selectedGuest.records.map((rec, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl border border-[#373138] bg-[#232126] hover:border-[#C6A16A]/40 transition space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-[#F5F2EF]">
                            {rec.reference}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-[#742B40]/25 text-[#ED252C] border border-[#742B40]/40">
                            {rec.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-[#8E8A85]">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#8E8A85]" />
                            <span>
                              {rec.checkIn} → {rec.checkOut}
                            </span>
                          </div>
                          <span className="font-bold text-[#ED252C] font-mono">
                            {formatINR(rec.amount)}
                          </span>
                        </div>

                        <div className="text-[11px] text-[#B7A9A7] flex items-center gap-1">
                          <BedDouble className="w-3 h-3 text-[#8E8A85]" />
                          <span>{rec.roomType}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Guest notes */}
                {selectedGuest.notes.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8E8A85]">
                      Special Requests &amp; Notes
                    </h4>
                    <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300 space-y-1">
                      {selectedGuest.notes.map((note, i) => (
                        <p key={i} className="leading-relaxed">
                          • {note}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-6 border-t border-[#373138] bg-[#232126] flex items-center gap-3">
              {selectedGuest.phone && (
                <a
                  href={`https://wa.me/91${selectedGuest.phone.replace(/\D/g, "").slice(-10)}?text=Hello%20${encodeURIComponent(selectedGuest.name)},%20Hotel%20Fremont%20front%20desk%20here.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp Guest</span>
                </a>
              )}
              {selectedGuest.phone && (
                <a
                  href={`tel:+91${selectedGuest.phone.replace(/\D/g, "").slice(-10)}`}
                  className="px-4 py-2.5 rounded-xl bg-[#1A191D] border border-[#373138] hover:bg-[#2A2830] text-[#F5F2EF] text-xs font-semibold transition flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4 text-[#8E8A85]" />
                  <span>Call</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Customer Data Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={Boolean(deleteModalGuest)}
        onClose={() => setDeleteModalGuest(null)}
        onConfirm={handleConfirmDeleteGuest}
        title={`Delete Customer Data · ${deleteModalGuest?.name}?`}
        description="This will permanently delete or anonymize this customer's personal data from the guest directory. Their past stay count and transaction references will be preserved for financial auditing."
        impactDetails={
          deleteModalGuest
            ? [
                { label: "Customer Name", value: deleteModalGuest.name },
                { label: "Phone Number", value: deleteModalGuest.phone || "—" },
                { label: "Email Address", value: deleteModalGuest.email || "—" },
                { label: "Total Past Stays", value: `${deleteModalGuest.totalStays} Stays` },
                { label: "Lifetime Spend", value: formatINR(deleteModalGuest.totalSpend) },
              ]
            : []
        }
        requireTypeDelete={true}
        requiredConfirmationText="DELETE"
        confirmButtonText="Delete Customer Data"
      />
    </div>
  );
}
