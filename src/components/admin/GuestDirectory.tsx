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
} from "lucide-react";

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

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastStay).getTime() - new Date(a.lastStay).getTime()
    );
  }, [bookings, reservations]);

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
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#EAE8E3] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
              Total Guest Profiles
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#742B40]/10 text-[#742B40] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-[#24272B] mt-2">
            {guestProfiles.length}
          </div>
          <p className="text-xs text-[#6B7280] mt-1">Direct booking &amp; reservation contacts</p>
        </div>

        <div className="bg-white border border-[#EAE8E3] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
              Repeat Guests
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-[#24272B] mt-2">
            {repeatCount}
          </div>
          <p className="text-xs text-[#6B7280] mt-1">Multi-stay loyal customers</p>
        </div>

        <div className="bg-white border border-[#EAE8E3] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
              Total Lifetime Spend
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#B69A68]/15 text-[#B69A68] flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-[#24272B] mt-2">
            {formatINR(totalRevenue)}
          </div>
          <p className="text-xs text-[#6B7280] mt-1">Online &amp; confirmed reservations</p>
        </div>

        <div className="bg-white border border-[#EAE8E3] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
              Avg. Spend / Guest
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-[#24272B] mt-2">
            {guestProfiles.length > 0 ? formatINR(Math.round(totalRevenue / guestProfiles.length)) : "₹0"}
          </div>
          <p className="text-xs text-[#6B7280] mt-1">Across all room categories</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-[#EAE8E3] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, email, room..."
            className="w-full pl-10 pr-4 py-2 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl text-xs text-[#24272B] placeholder-[#9CA3AF] focus:outline-none focus:border-[#742B40] transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#24272B]"
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
                ? "bg-[#742B40] text-white shadow-sm"
                : "bg-[#F8F7F4] text-[#4B5563] hover:text-[#24272B] border border-[#EAE8E3]"
            }`}
          >
            All Guests ({guestProfiles.length})
          </button>
          <button
            onClick={() => setFilterType("repeat")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              filterType === "repeat"
                ? "bg-[#742B40] text-white shadow-sm"
                : "bg-[#F8F7F4] text-[#4B5563] hover:text-[#24272B] border border-[#EAE8E3]"
            }`}
          >
            Repeat Guests ({repeatCount})
          </button>
          <button
            onClick={() => setFilterType("high_spend")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              filterType === "high_spend"
                ? "bg-[#742B40] text-white shadow-sm"
                : "bg-[#F8F7F4] text-[#4B5563] hover:text-[#24272B] border border-[#EAE8E3]"
            }`}
          >
            High Spend (&gt; ₹5,000)
          </button>
        </div>
      </div>

      {/* Guest Directory Table */}
      <div className="bg-white border border-[#EAE8E3] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9F7] border-b border-[#EAE8E3] text-[#6B7280] uppercase tracking-wider text-[11px] font-semibold">
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
            <tbody className="divide-y divide-[#EAE8E3]">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#6B7280]">
                    No guest profiles found matching your search.
                  </td>
                </tr>
              ) : (
                filteredGuests.map((guest) => {
                  const cleanPhone = guest.phone ? guest.phone.replace(/\D/g, "").slice(-10) : "";
                  return (
                    <tr
                      key={guest.id}
                      className="hover:bg-[#FAF9F7] transition cursor-pointer"
                      onClick={() => setSelectedGuest(guest)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#742B40]/10 text-[#742B40] flex items-center justify-center font-bold font-serif text-sm">
                            {guest.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-[#24272B] flex items-center gap-2">
                              <span>{guest.name}</span>
                              {guest.isRepeatGuest && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                  Repeat
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#6B7280]">
                              {guest.records.length} booking record{guest.records.length > 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-[#24272B] font-mono">
                          <Phone className="w-3 h-3 text-[#6B7280]" />
                          <span>{guest.phone || "—"}</span>
                        </div>
                        {guest.email && (
                          <div className="flex items-center gap-1.5 text-[#6B7280]">
                            <Mail className="w-3 h-3 text-[#9CA3AF]" />
                            <span className="truncate max-w-[180px]">{guest.email}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-[#24272B]">
                        {guest.totalStays} stay{guest.totalStays > 1 ? "s" : ""}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-[#742B40] font-mono">
                        {formatINR(guest.totalSpend)}
                      </td>

                      <td className="py-3.5 px-4 text-[#4B5563]">
                        <span className="px-2 py-1 rounded-lg bg-[#F8F7F4] border border-[#EAE8E3] text-[11px] font-medium">
                          {guest.preferredRoom || "Standard"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-[#6B7280] font-mono">
                        {guest.lastStay ? new Date(guest.lastStay).toLocaleDateString("en-IN") : "—"}
                      </td>

                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/91${cleanPhone}?text=Hello%20${encodeURIComponent(guest.name)},%20greetings%20from%20Hotel%20Fremont%20Mohali.`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {cleanPhone && (
                            <a
                              href={`tel:+91${cleanPhone}`}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                              title="Call Guest"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => setSelectedGuest(guest)}
                            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#742B40] hover:bg-[#F8F7F4] transition"
                            title="View Guest History"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div>
              {/* Header */}
              <div className="p-6 border-b border-[#EAE8E3] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#742B40] text-white flex items-center justify-center font-serif font-bold text-lg">
                    {selectedGuest.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-serif text-[#24272B] flex items-center gap-2">
                      <span>{selectedGuest.name}</span>
                      {selectedGuest.isRepeatGuest && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          VIP Repeat
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-[#6B7280]">Customer History &amp; CRM Profile</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedGuest(null)}
                  className="p-2 rounded-xl text-[#6B7280] hover:text-[#24272B] hover:bg-[#F8F7F4] transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Guest Summary Card */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#F8F7F4] border border-[#EAE8E3]">
                    <span className="text-[10px] uppercase font-semibold text-[#6B7280] block">
                      Lifetime Spend
                    </span>
                    <span className="text-lg font-bold font-mono text-[#742B40] mt-1 block">
                      {formatINR(selectedGuest.totalSpend)}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F8F7F4] border border-[#EAE8E3]">
                    <span className="text-[10px] uppercase font-semibold text-[#6B7280] block">
                      Total Stays
                    </span>
                    <span className="text-lg font-bold font-mono text-[#24272B] mt-1 block">
                      {selectedGuest.totalStays} reservation{selectedGuest.totalStays > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Contact details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                    Contact Information
                  </h4>
                  <div className="p-4 rounded-xl border border-[#EAE8E3] bg-[#FAF9F7] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#6B7280]">Phone:</span>
                      <span className="font-mono font-semibold text-[#24272B]">
                        {selectedGuest.phone || "—"}
                      </span>
                    </div>
                    {selectedGuest.email && (
                      <div className="flex items-center justify-between">
                        <span className="text-[#6B7280]">Email:</span>
                        <span className="font-mono text-[#24272B]">{selectedGuest.email}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[#6B7280]">Preferred Category:</span>
                      <span className="font-semibold text-[#742B40]">
                        {selectedGuest.preferredRoom || "Standard"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stay History Timeline */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    <span>Booking &amp; Stay History ({selectedGuest.records.length})</span>
                  </h4>

                  <div className="space-y-2">
                    {selectedGuest.records.map((rec, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl border border-[#EAE8E3] bg-white hover:border-[#742B40]/40 transition space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-[#24272B]">
                            {rec.reference}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-[#742B40]/10 text-[#742B40]">
                            {rec.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-[#6B7280]">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#9CA3AF]" />
                            <span>
                              {rec.checkIn} → {rec.checkOut}
                            </span>
                          </div>
                          <span className="font-bold text-[#742B40] font-mono">
                            {formatINR(rec.amount)}
                          </span>
                        </div>

                        <div className="text-[11px] text-[#4B5563] flex items-center gap-1">
                          <BedDouble className="w-3 h-3 text-[#9CA3AF]" />
                          <span>{rec.roomType}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Guest notes */}
                {selectedGuest.notes.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                      Special Requests &amp; Notes
                    </h4>
                    <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-900 space-y-1">
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
            <div className="p-6 border-t border-[#EAE8E3] bg-[#FAF9F7] flex items-center gap-3">
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
                  className="px-4 py-2.5 rounded-xl bg-white border border-[#EAE8E3] hover:bg-[#F8F7F4] text-[#24272B] text-xs font-semibold transition flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4 text-[#6B7280]" />
                  <span>Call</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
