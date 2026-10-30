"use client";

import { useState } from "react";
import {
  PhysicalRoom,
  BookingRecord,
  RoomStatus,
  BookingStatus,
  updateRoomStatusAction,
  createBookingAction,
  updateBookingStatusAction,
} from "@/actions/rooms";
import { roomCategories } from "@/data/rooms";
import {
  BedDouble,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  Printer,
  X,
  AlertTriangle,
  User,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";

interface RoomsManagerProps {
  initialRooms: PhysicalRoom[];
  initialBookings: BookingRecord[];
  isDatabase: boolean;
}

const statusConfig: Record<
  RoomStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  available: {
    label: "Available",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  occupied: {
    label: "Occupied",
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/30",
    dot: "bg-rose-400",
  },
  cleaning: {
    label: "Cleaning",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
    dot: "bg-amber-400 animate-pulse",
  },
  maintenance: {
    label: "Maintenance",
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/30",
    dot: "bg-orange-400",
  },
  blocked: {
    label: "Blocked",
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    border: "border-slate-500/30",
    dot: "bg-slate-400",
  },
};

export default function RoomsManager({
  initialRooms,
  initialBookings,
  isDatabase,
}: RoomsManagerProps) {
  const [rooms, setRooms] = useState<PhysicalRoom[]>(initialRooms);
  const [bookings, setBookings] = useState<BookingRecord[]>(initialBookings);
  const [activeTab, setActiveTab] = useState<"board" | "tape-chart" | "bookings">("board");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  // New Booking Modal State
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    guestName: "",
    guestPhone: "",
    guestEmail: "",
    categorySlug: "deluxe-king",
    roomNumber: "101",
    checkIn: new Date().toISOString().slice(0, 10),
    checkOut: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    guestsCount: 2,
    advancePaid: 0,
    source: "phone" as "phone" | "walk_in" | "whatsapp" | "website",
    notes: "",
  });
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);

  // Printable Invoice/Voucher Modal State
  const [selectedBookingForVoucher, setSelectedBookingForVoucher] = useState<BookingRecord | null>(null);

  // Tape Chart Date Window
  const [timelineStart, setTimelineStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 2); // Start 2 days ago
    return d;
  });

  // Calculate Metrics
  const totalRooms = rooms.length;
  const availableRooms = rooms.filter((r) => r.status === "available").length;
  const occupiedRooms = rooms.filter((r) => r.status === "occupied").length;
  const cleaningRooms = rooms.filter((r) => r.status === "cleaning").length;
  const maintenanceRooms = rooms.filter((r) => r.status === "maintenance" || r.status === "blocked").length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  // Filtered Rooms
  const filteredRooms = rooms.filter((r) => {
    if (statusFilter === "all") return true;
    return r.status === statusFilter;
  });

  // Change room status handler
  const handleStatusChange = async (roomNumber: string, newStatus: RoomStatus) => {
    setIsUpdatingStatus(roomNumber);
    try {
      const res = await updateRoomStatusAction(roomNumber, newStatus);
      if (res.success) {
        setRooms((prev) =>
          prev.map((r) => (r.roomNumber === roomNumber ? { ...r, status: newStatus } : r))
        );
      }
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  // Submit new booking
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);
    setIsCreatingBooking(true);

    try {
      const res = await createBookingAction({
        ...bookingForm,
        advancePaid: Number(bookingForm.advancePaid) || 0,
        guestsCount: Number(bookingForm.guestsCount) || 1,
      });

      if (!res.success) {
        setBookingError(res.error || "Failed to create booking");
        return;
      }

      // Add to local state
      const category = roomCategories.find((c) => c.slug === bookingForm.categorySlug);
      const nights = Math.max(
        1,
        Math.ceil(
          (new Date(bookingForm.checkOut).getTime() - new Date(bookingForm.checkIn).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );
      const base = nights * (category?.price || 5499);
      const totalAmount = base + Math.round(base * 0.18);

      const created: BookingRecord = {
        id: `b-${Date.now()}`,
        bookingCode: res.bookingCode || `HF-${Date.now()}`,
        guestName: bookingForm.guestName,
        guestPhone: bookingForm.guestPhone,
        guestEmail: bookingForm.guestEmail || undefined,
        categorySlug: bookingForm.categorySlug,
        categoryName: category?.name || bookingForm.categorySlug,
        roomNumber: bookingForm.roomNumber,
        checkIn: bookingForm.checkIn,
        checkOut: bookingForm.checkOut,
        guestsCount: Number(bookingForm.guestsCount),
        totalAmount,
        advancePaid: Number(bookingForm.advancePaid) || 0,
        status: "confirmed",
        source: bookingForm.source,
        notes: bookingForm.notes,
        createdAt: new Date().toISOString(),
      };

      setBookings((prev) => [created, ...prev]);

      // If check-in is today, mark room occupied
      const todayStr = new Date().toISOString().slice(0, 10);
      if (bookingForm.checkIn <= todayStr && bookingForm.checkOut > todayStr) {
        setRooms((prev) =>
          prev.map((r) =>
            r.roomNumber === bookingForm.roomNumber
              ? {
                  ...r,
                  status: "occupied",
                  currentBooking: {
                    bookingCode: created.bookingCode,
                    guestName: created.guestName,
                    checkIn: created.checkIn,
                    checkOut: created.checkOut,
                  },
                }
              : r
          )
        );
      }

      setIsNewBookingOpen(false);
      // Reset form
      setBookingForm({
        guestName: "",
        guestPhone: "",
        guestEmail: "",
        categorySlug: "deluxe-king",
        roomNumber: "101",
        checkIn: new Date().toISOString().slice(0, 10),
        checkOut: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
        guestsCount: 2,
        advancePaid: 0,
        source: "phone",
        notes: "",
      });
    } catch (err: unknown) {
      setBookingError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setIsCreatingBooking(false);
    }
  };

  // Generate 14-day window for tape chart
  const timelineDays: Date[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(timelineStart);
    d.setDate(d.getDate() + i);
    timelineDays.push(d);
  }

  return (
    <div className="space-y-6">
      {/* KPI Overview Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-[#151518] border border-white/10 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-[#A8A59E]">Total Keys</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-white">{totalRooms}</span>
            <span className="text-[10px] text-[#C9A96E] font-medium">Boutique</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#151518] border border-emerald-500/20 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-emerald-400">Available</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-emerald-400">{availableRooms}</span>
            <span className="text-[10px] text-emerald-400/70 font-mono">Ready</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#151518] border border-rose-500/20 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-rose-400">Occupied</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-rose-400">{occupiedRooms}</span>
            <span className="text-[10px] text-rose-400/70 font-mono">In-House</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#151518] border border-amber-500/20 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-amber-400">Housekeeping</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-amber-400">{cleaningRooms}</span>
            <span className="text-[10px] text-amber-400/70 font-mono">Cleaning</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#151518] border border-slate-500/20 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-slate-400">Maintenance</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-slate-300">{maintenanceRooms}</span>
            <span className="text-[10px] text-slate-400/70 font-mono">Blocked</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#151518] border border-[#C9A96E]/30 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-[#C9A96E]">Occupancy</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-[#C9A96E]">{occupancyRate}%</span>
            <span className="text-[10px] text-[#A8A59E] font-mono">Live</span>
          </div>
        </div>
      </div>

      {/* Navigation & Controls Bar */}
      <div className="bg-[#151518] border border-white/10 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        {/* View Mode Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-black/40 border border-white/5 rounded-lg w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("board")}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-md text-xs font-medium transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "board"
                ? "bg-[#C9A96E] text-[#0E0E10] font-semibold shadow-sm"
                : "text-[#A8A59E] hover:text-white"
            }`}
          >
            <BedDouble className="w-3.5 h-3.5" />
            <span>12 Keys Board</span>
          </button>

          <button
            onClick={() => setActiveTab("tape-chart")}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-md text-xs font-medium transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "tape-chart"
                ? "bg-[#C9A96E] text-[#0E0E10] font-semibold shadow-sm"
                : "text-[#A8A59E] hover:text-white"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Tape Chart Calendar</span>
          </button>

          <button
            onClick={() => setActiveTab("bookings")}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-md text-xs font-medium transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "bookings"
                ? "bg-[#C9A96E] text-[#0E0E10] font-semibold shadow-sm"
                : "text-[#A8A59E] hover:text-white"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Reservations ({bookings.length})</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {activeTab === "board" && (
            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-[#A8A59E]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-[#F7F3EC] focus:outline-none focus:border-[#C9A96E]"
              >
                <option value="all">All Statuses ({rooms.length})</option>
                <option value="available">Available ({availableRooms})</option>
                <option value="occupied">Occupied ({occupiedRooms})</option>
                <option value="cleaning">Cleaning ({cleaningRooms})</option>
                <option value="maintenance">Maintenance ({maintenanceRooms})</option>
              </select>
            </div>
          )}

          <button
            onClick={() => setIsNewBookingOpen(true)}
            className="px-4 py-2 rounded-lg bg-[#E02B1D] hover:bg-[#c42215] text-white text-xs font-semibold tracking-wide transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-950/30"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Reservation</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: 12 KEYS ROOM STATUS BOARD */}
      {/* ======================================================== */}
      {activeTab === "board" && (
        <div className="space-y-6">
          {/* Grouped by Floors & Categories */}
          {["deluxe-king", "premier-executive", "royal-fremont", "presidential-penthouse"].map((slug) => {
            const catRooms = filteredRooms.filter((r) => r.categorySlug === slug);
            if (catRooms.length === 0) return null;
            const categoryMeta = roomCategories.find((c) => c.slug === slug);

            return (
              <div key={slug} className="space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-serif font-bold text-[#F7F3EC]">
                      {categoryMeta?.name || slug}
                    </span>
                    <span className="text-xs text-[#C9A96E] font-mono">
                      (₹{categoryMeta?.price.toLocaleString("en-IN")}/night · Max {categoryMeta?.maxGuests} Guests)
                    </span>
                  </div>
                  <span className="text-xs text-[#A8A59E] font-mono">
                    Floor {catRooms[0]?.floor} · {catRooms.length} {catRooms.length === 1 ? "Key" : "Keys"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {catRooms.map((room) => {
                    const cfg = statusConfig[room.status];
                    const isBusy = isUpdatingStatus === room.roomNumber;

                    return (
                      <div
                        key={room.roomNumber}
                        className="bg-[#151518] border border-white/10 hover:border-white/20 rounded-xl p-4 transition-all shadow-md flex flex-col justify-between space-y-4 relative overflow-hidden"
                      >
                        {/* Status bar accent */}
                        <div
                          className={`absolute top-0 left-0 right-0 h-1 ${
                            room.status === "available"
                              ? "bg-emerald-500"
                              : room.status === "occupied"
                              ? "bg-rose-500"
                              : room.status === "cleaning"
                              ? "bg-amber-500"
                              : "bg-slate-500"
                          }`}
                        />

                        {/* Room Number & Category */}
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-mono font-bold text-white">
                                Key #{room.roomNumber}
                              </span>
                              <span className="text-[10px] font-mono text-[#A8A59E] px-1.5 py-0.5 rounded bg-black/40">
                                Floor {room.floor}
                              </span>
                            </div>

                            {/* Status Badge */}
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 ${cfg.bg} ${cfg.text} ${cfg.border}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                              <span>{cfg.label}</span>
                            </span>
                          </div>

                          <p className="text-xs text-[#A8A59E] mt-1">
                            {room.categoryName}
                          </p>
                        </div>

                        {/* Current Occupant Details (if occupied) */}
                        {room.status === "occupied" && room.currentBooking ? (
                          <div className="bg-black/40 border border-white/5 rounded-lg p-2.5 space-y-1 text-xs">
                            <div className="flex items-center justify-between text-[#C9A96E]">
                              <span className="font-semibold flex items-center gap-1 truncate">
                                <User className="w-3 h-3 shrink-0" />
                                <span className="truncate">{room.currentBooking.guestName}</span>
                              </span>
                              <span className="font-mono text-[10px] text-[#A8A59E]">
                                {room.currentBooking.bookingCode}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#A8A59E] flex items-center justify-between">
                              <span>Through {room.currentBooking.checkOut}</span>
                              <span className="text-emerald-400 font-medium">In-House</span>
                            </div>
                          </div>
                        ) : room.status === "cleaning" ? (
                          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-2.5 text-xs text-amber-300 flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 shrink-0" />
                            <span>Housekeeping sanitization in progress</span>
                          </div>
                        ) : null}

                        {/* Status switcher actions */}
                        <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-[#A8A59E] font-mono">Change Status:</span>
                          <select
                            disabled={isBusy}
                            value={room.status}
                            onChange={(e) =>
                              handleStatusChange(room.roomNumber, e.target.value as RoomStatus)
                            }
                            className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-xs text-[#F7F3EC] focus:outline-none focus:border-[#C9A96E] cursor-pointer"
                          >
                            <option value="available">Available (Vacant)</option>
                            <option value="occupied">Occupied (Guest In)</option>
                            <option value="cleaning">Cleaning (Housekeeping)</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="blocked">Blocked</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: VISUAL TAPE CHART CALENDAR */}
      {/* ======================================================== */}
      {activeTab === "tape-chart" && (
        <div className="bg-[#151518] border border-white/10 rounded-xl p-4 shadow-md space-y-4">
          {/* Timeline Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#C9A96E]" />
              <h3 className="text-sm font-serif font-bold text-[#F7F3EC]">
                12-Room Availability Timeline (14-Day Tape Chart)
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const d = new Date(timelineStart);
                  d.setDate(d.getDate() - 7);
                  setTimelineStart(d);
                }}
                className="p-1.5 rounded-lg border border-white/10 hover:border-white/20 text-[#A8A59E] hover:text-white transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTimelineStart(new Date())}
                className="px-2.5 py-1 rounded-lg border border-white/10 text-xs text-[#A8A59E] hover:text-white transition"
              >
                Today
              </button>
              <button
                onClick={() => {
                  const d = new Date(timelineStart);
                  d.setDate(d.getDate() + 7);
                  setTimelineStart(d);
                }}
                className="p-1.5 rounded-lg border border-white/10 hover:border-white/20 text-[#A8A59E] hover:text-white transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tape Chart Grid */}
          <div className="overflow-x-auto pb-4">
            <div className="min-w-[900px]">
              {/* Header: Dates */}
              <div className="grid grid-cols-[140px_repeat(14,1fr)] gap-1 border-b border-white/10 pb-2 text-center text-xs">
                <div className="text-left font-mono text-[#A8A59E] pl-2 font-bold">Room Key</div>
                {timelineDays.map((d, idx) => {
                  const isToday = d.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);
                  const dayNum = d.getDate();
                  const monthStr = d.toLocaleDateString("en-US", { month: "short" });
                  const weekDay = d.toLocaleDateString("en-US", { weekday: "narrow" });

                  return (
                    <div
                      key={idx}
                      className={`p-1 rounded ${
                        isToday ? "bg-[#C9A96E]/20 text-[#C9A96E] font-bold border border-[#C9A96E]/30" : "text-[#A8A59E]"
                      }`}
                    >
                      <div className="text-[10px]">{weekDay}</div>
                      <div className="font-mono text-xs">{dayNum} {monthStr}</div>
                    </div>
                  );
                })}
              </div>

              {/* Rows: 12 Rooms */}
              <div className="divide-y divide-white/5">
                {rooms.map((room) => {
                  return (
                    <div
                      key={room.roomNumber}
                      className="grid grid-cols-[140px_repeat(14,1fr)] gap-1 items-center py-2 text-xs hover:bg-white/[0.02]"
                    >
                      {/* Room Label */}
                      <div className="flex items-center justify-between pr-2 pl-2">
                        <span className="font-mono font-bold text-white">#{room.roomNumber}</span>
                        <span className="text-[10px] text-[#A8A59E] truncate max-w-[80px]">
                          {room.categorySlug.split("-")[0]}
                        </span>
                      </div>

                      {/* 14 Day Columns */}
                      {timelineDays.map((day, dIdx) => {
                        const dateStr = day.toISOString().slice(0, 10);

                        // Find booking for this room & date
                        const matchingBooking = bookings.find((b) => {
                          if (b.status === "cancelled" || b.status === "no_show") return false;
                          if (b.roomNumber !== room.roomNumber) return false;
                          return dateStr >= b.checkIn && dateStr < b.checkOut;
                        });

                        const isStart = matchingBooking?.checkIn === dateStr;

                        return (
                          <div
                            key={dIdx}
                            className={`h-8 rounded flex items-center justify-center text-[10px] transition-all relative ${
                              matchingBooking
                                ? "bg-[#E02B1D]/25 border border-[#E02B1D]/40 text-white font-medium cursor-pointer hover:bg-[#E02B1D]/40"
                                : room.status === "occupied" && dateStr === new Date().toISOString().slice(0, 10)
                                ? "bg-rose-950/40 border border-rose-800/40 text-rose-300"
                                : "bg-black/20 hover:bg-white/5 border border-white/[0.02]"
                            }`}
                            onClick={() => {
                              if (matchingBooking) {
                                setSelectedBookingForVoucher(matchingBooking);
                              }
                            }}
                            title={
                              matchingBooking
                                ? `${matchingBooking.guestName} (${matchingBooking.bookingCode})\n${matchingBooking.checkIn} to ${matchingBooking.checkOut}`
                                : `Room ${room.roomNumber} is open`
                            }
                          >
                            {isStart && (
                              <span className="truncate px-1 text-[9px] font-bold text-[#F7F3EC]">
                                {matchingBooking.guestName.split(" ")[0]}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs pt-2 border-t border-white/5 text-[#A8A59E]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#E02B1D]/40 border border-[#E02B1D]" />
              <span>Confirmed Reservation (Click for Voucher)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-black/20 border border-white/10" />
              <span>Available for Booking</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: BOOKINGS & RESERVATIONS LIST */}
      {/* ======================================================== */}
      {activeTab === "bookings" && (
        <div className="bg-[#151518] border border-white/10 rounded-xl overflow-hidden shadow-md">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-serif font-bold text-[#F7F3EC]">
              All Reservations ({bookings.length})
            </h3>
            <span className="text-xs text-[#A8A59E] font-mono">
              {isDatabase ? "Synced with Supabase" : "Demo & Fallback State"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/40 text-[#A8A59E] font-mono border-b border-white/10 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Code / Guest</th>
                  <th className="py-3 px-4">Category &amp; Key</th>
                  <th className="py-3 px-4">Dates &amp; Stay</th>
                  <th className="py-3 px-4">Total / Advance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[#F7F3EC]">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3 px-4">
                      <div className="font-mono text-[11px] text-[#C9A96E] font-bold">
                        {booking.bookingCode}
                      </div>
                      <div className="font-medium text-white mt-0.5">{booking.guestName}</div>
                      <div className="text-[11px] text-[#A8A59E]">{booking.guestPhone}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium">{booking.categoryName}</div>
                      <div className="text-[11px] text-[#A8A59E] font-mono">
                        Key #{booking.roomNumber || "Unassigned"} · {booking.guestsCount} Guests
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <div>In: {booking.checkIn}</div>
                      <div>Out: {booking.checkOut}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-white">
                        ₹{booking.totalAmount.toLocaleString("en-IN")}
                      </div>
                      <div className="text-[11px] text-emerald-400 font-mono">
                        Paid: ₹{booking.advancePaid.toLocaleString("en-IN")}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          booking.status === "confirmed"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                            : booking.status === "checked_in"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : booking.status === "checked_out"
                            ? "bg-slate-500/10 text-slate-400 border border-slate-500/30"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {booking.status.replace("_", " ")}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedBookingForVoucher(booking)}
                          className="px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-[#C9A96E] text-[#A8A59E] hover:text-[#C9A96E] transition flex items-center gap-1 text-[11px] cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Voucher</span>
                        </button>

                        {booking.status === "confirmed" && (
                          <button
                            onClick={async () => {
                              await updateBookingStatusAction(booking.id, "checked_in");
                              setBookings((prev) =>
                                prev.map((b) => (b.id === booking.id ? { ...b, status: "checked_in" } : b))
                              );
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition text-[11px] cursor-pointer"
                          >
                            Check-In
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: NEW MANUAL RESERVATION */}
      {/* ======================================================== */}
      {isNewBookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xl bg-[#151518] border border-[#C9A96E]/30 rounded-2xl shadow-2xl p-6 sm:p-8 text-[#F7F3EC] max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsNewBookingOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-[#A8A59E] hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#E02B1D]" />
              <span className="text-[10px] font-mono uppercase text-[#C9A96E] tracking-wider">
                Direct Front Desk Entry
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-serif font-bold text-white mb-4">
              Create New Reservation
            </h3>

            {bookingError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            <form onSubmit={handleCreateBooking} className="space-y-4 text-xs">
              {/* Guest Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A8A59E] mb-1 font-medium">Guest Full Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Vikram Malhotra"
                    value={bookingForm.guestName}
                    onChange={(e) => setBookingForm({ ...bookingForm, guestName: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-[#F7F3EC] focus:outline-none focus:border-[#C9A96E]"
                  />
                </div>

                <div>
                  <label className="block text-[#A8A59E] mb-1 font-medium">Phone Number *</label>
                  <input
                    required
                    type="tel"
                    placeholder="+91 98727 68514"
                    value={bookingForm.guestPhone}
                    onChange={(e) => setBookingForm({ ...bookingForm, guestPhone: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-[#F7F3EC] focus:outline-none focus:border-[#C9A96E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#A8A59E] mb-1 font-medium">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="guest@example.com"
                  value={bookingForm.guestEmail}
                  onChange={(e) => setBookingForm({ ...bookingForm, guestEmail: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-[#F7F3EC] focus:outline-none focus:border-[#C9A96E]"
                />
              </div>

              {/* Category & Room Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A8A59E] mb-1 font-medium">Room Category *</label>
                  <select
                    value={bookingForm.categorySlug}
                    onChange={(e) => {
                      const newSlug = e.target.value;
                      const cat = roomCategories.find((c) => c.slug === newSlug);
                      setBookingForm({
                        ...bookingForm,
                        categorySlug: newSlug,
                        roomNumber: cat ? cat.roomNumbers[0] : "101",
                        guestsCount: Math.min(bookingForm.guestsCount, cat?.maxGuests || 2),
                      });
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-[#F7F3EC] focus:outline-none focus:border-[#C9A96E]"
                  >
                    {roomCategories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name} (₹{c.price.toLocaleString("en-IN")})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#A8A59E] mb-1 font-medium">Select Physical Key *</label>
                  <select
                    value={bookingForm.roomNumber}
                    onChange={(e) => setBookingForm({ ...bookingForm, roomNumber: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-[#F7F3EC] focus:outline-none focus:border-[#C9A96E]"
                  >
                    {roomCategories
                      .find((c) => c.slug === bookingForm.categorySlug)
                      ?.roomNumbers.map((rNum) => (
                        <option key={rNum} value={rNum}>
                          Room #{rNum}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A8A59E] mb-1 font-medium">Check-In Date *</label>
                  <input
                    required
                    type="date"
                    value={bookingForm.checkIn}
                    onChange={(e) => setBookingForm({ ...bookingForm, checkIn: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-[#F7F3EC] focus:outline-none focus:border-[#C9A96E]"
                  />
                </div>

                <div>
                  <label className="block text-[#A8A59E] mb-1 font-medium">Check-Out Date *</label>
                  <input
                    required
                    type="date"
                    value={bookingForm.checkOut}
                    onChange={(e) => setBookingForm({ ...bookingForm, checkOut: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-[#F7F3EC] focus:outline-none focus:border-[#C9A96E]"
                  />
                </div>
              </div>

              {/* Guests Count & Advance Paid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A8A59E] mb-1 font-medium">
                    Guests (Max{" "}
                    {roomCategories.find((c) => c.slug === bookingForm.categorySlug)?.maxGuests || 2})
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={roomCategories.find((c) => c.slug === bookingForm.categorySlug)?.maxGuests || 2}
                    value={bookingForm.guestsCount}
                    onChange={(e) => setBookingForm({ ...bookingForm, guestsCount: Number(e.target.value) })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-[#F7F3EC] focus:outline-none focus:border-[#C9A96E]"
                  />
                </div>

                <div>
                  <label className="block text-[#A8A59E] mb-1 font-medium">Advance Paid (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={bookingForm.advancePaid}
                    onChange={(e) => setBookingForm({ ...bookingForm, advancePaid: Number(e.target.value) })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-[#F7F3EC] focus:outline-none focus:border-[#C9A96E]"
                  />
                </div>
              </div>

              {/* Source & Notes */}
              <div>
                <label className="block text-[#A8A59E] mb-1 font-medium">Booking Source</label>
                <select
                  value={bookingForm.source}
                  onChange={(e) =>
                    setBookingForm({
                      ...bookingForm,
                      source: e.target.value as "phone" | "walk_in" | "whatsapp" | "website",
                    })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-[#F7F3EC] focus:outline-none focus:border-[#C9A96E]"
                >
                  <option value="phone">Phone Call</option>
                  <option value="walk_in">Walk-In Guest</option>
                  <option value="whatsapp">WhatsApp Inquiry</option>
                  <option value="website">Direct Website</option>
                </select>
              </div>

              <div>
                <label className="block text-[#A8A59E] mb-1 font-medium">Special Notes / Requests</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Early check-in requested, VIP champagne arrival..."
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-[#F7F3EC] focus:outline-none focus:border-[#C9A96E]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewBookingOpen(false)}
                  className="px-4 py-2.5 rounded-lg border border-white/10 text-[#A8A59E] hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingBooking}
                  className="px-5 py-2.5 rounded-lg bg-[#E02B1D] hover:bg-[#c42215] text-white font-semibold transition cursor-pointer flex items-center gap-2"
                >
                  {isCreatingBooking ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Checking Availability...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm Reservation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: PRINTABLE RESERVATION VOUCHER / INVOICE */}
      {/* ======================================================== */}
      {selectedBookingForVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-white text-black rounded-2xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
            {/* Action Bar (Top) */}
            <div className="flex items-center justify-between pb-6 border-b border-gray-200 print:hidden">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E02B1D]" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                  Official Guest Voucher &amp; Invoice
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-lg bg-[#0E0E10] text-white text-xs font-semibold hover:bg-gray-800 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Voucher</span>
                </button>
                <button
                  onClick={() => setSelectedBookingForVoucher(null)}
                  className="p-2 rounded-full text-gray-400 hover:text-black transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Voucher Document Body */}
            <div className="pt-6 space-y-6">
              {/* Hotel Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-serif font-black tracking-tight text-[#E02B1D]">
                    HOTEL FREMONT
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">Boutique Luxury Sanctuary · 12 Exclusive Keys</p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Direct Expressway, Airport Road, Mohali, Punjab · +91 98727 68514
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono text-gray-400 uppercase block">Booking Reference</span>
                  <span className="text-sm font-mono font-bold text-gray-900">
                    {selectedBookingForVoucher.bookingCode}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold block uppercase mt-0.5">
                    ● Confirmed
                  </span>
                </div>
              </div>

              {/* Guest & Stay Details Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                <div>
                  <span className="text-gray-400 block font-mono text-[10px] uppercase">Guest Name</span>
                  <span className="text-sm font-bold text-gray-900">{selectedBookingForVoucher.guestName}</span>
                  <div className="text-gray-600 text-[11px] mt-0.5">{selectedBookingForVoucher.guestPhone}</div>
                  {selectedBookingForVoucher.guestEmail && (
                    <div className="text-gray-500 text-[11px]">{selectedBookingForVoucher.guestEmail}</div>
                  )}
                </div>

                <div>
                  <span className="text-gray-400 block font-mono text-[10px] uppercase">Suite Reserved</span>
                  <span className="text-sm font-bold text-gray-900">{selectedBookingForVoucher.categoryName}</span>
                  <div className="text-gray-600 text-[11px] mt-0.5">
                    Key #{selectedBookingForVoucher.roomNumber || "Assigned on arrival"} · {selectedBookingForVoucher.guestsCount} Guests
                  </div>
                </div>
              </div>

              {/* Stay Timeline */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-center font-mono">
                <div>
                  <span className="text-gray-400 text-[10px] uppercase block">Check-In</span>
                  <span className="font-bold text-gray-900 text-sm">{selectedBookingForVoucher.checkIn}</span>
                  <span className="text-[10px] text-gray-500 block">From 2:00 PM</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] uppercase block">Check-Out</span>
                  <span className="font-bold text-gray-900 text-sm">{selectedBookingForVoucher.checkOut}</span>
                  <span className="text-[10px] text-gray-500 block">Until 11:00 AM</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] uppercase block">Booking Source</span>
                  <span className="font-bold text-gray-900 text-sm capitalize">{selectedBookingForVoucher.source}</span>
                  <span className="text-[10px] text-gray-500 block">Direct Channel</span>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
                <div className="bg-gray-100 p-3 font-semibold text-gray-700 flex justify-between">
                  <span>Billing Summary</span>
                  <span>Amount (INR)</span>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Room Charges (including applicable GST)</span>
                    <span className="font-mono">₹{selectedBookingForVoucher.totalAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Advance Deposit Paid</span>
                    <span className="font-mono">- ₹{selectedBookingForVoucher.advancePaid.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-bold text-gray-900">
                    <span>Balance Due Upon Check-In</span>
                    <span className="font-mono">
                      ₹{Math.max(0, selectedBookingForVoucher.totalAmount - selectedBookingForVoucher.advancePaid).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hotel Policies Footer */}
              <div className="pt-4 border-t border-gray-200 text-[10px] text-gray-500 space-y-1">
                <p>
                  <strong>Check-in Requirement:</strong> Valid Government-issued photo identification (Aadhaar / Passport / Driving License) is mandatory for all staying guests upon arrival.
                </p>
                <p>
                  <strong>Cancellation Policy:</strong> Free cancellation up to 24 hours prior to check-in. For late cancellations or no-shows, a 1-night retention fee applies.
                </p>
                <p className="text-center pt-2 font-mono text-gray-400">
                  Hotel Fremont · Authorized Guest Voucher · Generated on {new Date().toLocaleDateString("en-IN")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

