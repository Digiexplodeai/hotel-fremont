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
import { ReservationRecord } from "@/actions/reservations";
import {
  updateRoomTypeAction,
  addRoomTypeAction,
  deleteRoomTypeAction,
  CalendarDaySummary,
  CalendarDayStay,
} from "@/actions/roomTypes";
import { RoomTypeConfig, DEFAULT_ROOM_TYPES, formatINR } from "@/config/hotel";
import ReservationsList from "@/components/admin/ReservationsList";
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
  Settings,
  Edit,
  Save,
  Trash2,
  DoorClosed,
  AlertCircle,
  Users,
  MessageSquare,
} from "lucide-react";

interface RoomsManagerProps {
  initialRooms: PhysicalRoom[];
  initialBookings?: BookingRecord[];
  initialReservations?: ReservationRecord[];
  initialRoomTypes?: RoomTypeConfig[];
  initialCalendar?: CalendarDaySummary[];
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
  initialBookings = [],
  initialReservations = [],
  initialRoomTypes = DEFAULT_ROOM_TYPES,
  initialCalendar = [],
  isDatabase,
}: RoomsManagerProps) {
  const [rooms, setRooms] = useState<PhysicalRoom[]>(initialRooms);
  const [bookings, setBookings] = useState<BookingRecord[]>(initialBookings);
  const [roomTypes, setRoomTypes] = useState<RoomTypeConfig[]>(initialRoomTypes);
  const [calendar, setCalendar] = useState<CalendarDaySummary[]>(initialCalendar);
  const [activeTab, setActiveTab] = useState<"board" | "tape-chart" | "inventory" | "bookings">("board");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  // Room Type Edit Modal State
  const [editingRoomType, setEditingRoomType] = useState<RoomTypeConfig | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    slug: string;
    pricePerNight: number;
    totalRooms: number;
    maxGuests: number;
    sizeSqft: number;
    bedType: string;
    tag: string;
    shortDescription: string;
    amenities: string;
    imageSlot: string;
    rateCpDouble: number;
    rateCpSingle: number;
    rateEpDouble: number;
    rateEpSingle: number;
    isActive: boolean;
  }>({
    name: "",
    slug: "",
    pricePerNight: 2299,
    totalRooms: 1,
    maxGuests: 2,
    sizeSqft: 160,
    bedType: "Plush King-size bed",
    tag: "",
    shortDescription: "",
    amenities: "",
    imageSlot: "",
    rateCpDouble: 2799,
    rateCpSingle: 2499,
    rateEpDouble: 2499,
    rateEpSingle: 2299,
    isActive: true,
  });
  const [editWarning, setEditWarning] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [rateChangeConfirmed, setRateChangeConfirmed] = useState(false);
  const [isSavingRoomType, setIsSavingRoomType] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [canDeactivateInstead, setCanDeactivateInstead] = useState(false);
  const [isDeletingRoomType, setIsDeletingRoomType] = useState(false);
  const [isNewRoomTypeOpen, setIsNewRoomTypeOpen] = useState(false);
  const [newRoomTypeForm, setNewRoomTypeForm] = useState({
    name: "",
    code: "",
    roomsTotal: 1,
    sizeSqft: 160,
    bedType: "Plush King-size bed",
    tag: "",
    shortDescription: "",
    amenities: "Air Conditioning, Smart TV, Tea & Coffee Kettle, Wi-Fi",
    imageSlot: "",
    rateCpDouble: 2799,
    rateCpSingle: 2499,
    rateEpDouble: 2499,
    rateEpSingle: 2299,
  });
  const [isCreatingRoomType, setIsCreatingRoomType] = useState(false);
  const [createRoomTypeError, setCreateRoomTypeError] = useState<string | null>(null);

  // Selected Day for In-House Stays inspection
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<CalendarDaySummary | null>(null);

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

  // Open Room Type editor
  const handleOpenEditRoomType = (rt: RoomTypeConfig) => {
    setEditingRoomType(rt);
    setEditForm({
      name: rt.name,
      slug: rt.slug || rt.code,
      pricePerNight: rt.pricePerNight,
      totalRooms: rt.totalRooms || rt.roomsTotal || 1,
      maxGuests: rt.maxGuests || 2,
      sizeSqft: rt.sizeSqft || 160,
      bedType: rt.bedType || "Plush King-size bed",
      tag: rt.tag || rt.badge || "",
      shortDescription: rt.shortDescription || rt.description || "",
      amenities: Array.isArray(rt.amenities) ? rt.amenities.join(", ") : "",
      imageSlot: rt.imageSlot || "",
      rateCpDouble: rt.rateCpDouble || 2799,
      rateCpSingle: rt.rateCpSingle || 2499,
      rateEpDouble: rt.rateEpDouble || 2499,
      rateEpSingle: rt.rateEpSingle || rt.pricePerNight || 2299,
      isActive: rt.isActive,
    });
    setRateChangeConfirmed(false);
    setEditWarning(null);
    setEditError(null);
    setDeleteError(null);
    setCanDeactivateInstead(false);
  };

  // Save Room Type updates
  const handleSaveRoomType = async (forceOverride: boolean = false) => {
    if (!editingRoomType) return;

    // Check if any rates changed
    const ratesChanged =
      editForm.rateCpDouble !== editingRoomType.rateCpDouble ||
      editForm.rateCpSingle !== editingRoomType.rateCpSingle ||
      editForm.rateEpDouble !== editingRoomType.rateEpDouble ||
      editForm.rateEpSingle !== editingRoomType.rateEpSingle;

    if (ratesChanged && !rateChangeConfirmed && !forceOverride) {
      setRateChangeConfirmed(true);
      return;
    }

    setIsSavingRoomType(true);
    setEditError(null);
    try {
      const amenitiesArr = editForm.amenities
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await updateRoomTypeAction(editingRoomType.code, {
        name: editForm.name,
        slug: editForm.slug,
        pricePerNight: Number(editForm.rateEpSingle),
        totalRooms: Number(editForm.totalRooms),
        roomsTotal: Number(editForm.totalRooms),
        maxGuests: Number(editForm.maxGuests),
        sizeSqft: Number(editForm.sizeSqft),
        bedType: editForm.bedType,
        tag: editForm.tag,
        shortDescription: editForm.shortDescription,
        longDescription: editForm.shortDescription,
        amenities: amenitiesArr,
        imageSlot: editForm.imageSlot,
        rateCpDouble: Number(editForm.rateCpDouble),
        rateCpSingle: Number(editForm.rateCpSingle),
        rateEpDouble: Number(editForm.rateEpDouble),
        rateEpSingle: Number(editForm.rateEpSingle),
        isActive: editForm.isActive,
        forceOverride,
      });

      if (!res.success) {
        if (res.warning) {
          setEditWarning(res.warning);
        } else {
          setEditError(res.error || "Failed to update room configuration.");
        }
        return;
      }

      // Update local state
      setRoomTypes((prev) =>
        prev.map((rt) =>
          rt.code === editingRoomType.code
            ? {
                ...rt,
                name: editForm.name,
                slug: editForm.slug,
                pricePerNight: Number(editForm.rateEpSingle),
                totalRooms: Number(editForm.totalRooms),
                roomsTotal: Number(editForm.totalRooms),
                maxGuests: Number(editForm.maxGuests),
                sizeSqft: Number(editForm.sizeSqft),
                bedType: editForm.bedType,
                tag: editForm.tag,
                badge: editForm.tag,
                shortDescription: editForm.shortDescription,
                amenities: amenitiesArr,
                imageSlot: editForm.imageSlot,
                rateCpDouble: Number(editForm.rateCpDouble),
                rateCpSingle: Number(editForm.rateCpSingle),
                rateEpDouble: Number(editForm.rateEpDouble),
                rateEpSingle: Number(editForm.rateEpSingle),
                isActive: editForm.isActive,
              }
            : rt
        )
      );
      setEditingRoomType(null);
    } catch (err: any) {
      setEditError(err?.message || "Failed to save configuration.");
    } finally {
      setIsSavingRoomType(false);
    }
  };

  // Delete Room Type handler
  const handleDeleteRoomType = async (code: string) => {
    setIsDeletingRoomType(true);
    setDeleteError(null);
    setCanDeactivateInstead(false);
    try {
      const res = await deleteRoomTypeAction(code);
      if (!res.success) {
        setDeleteError(res.error || "Failed to delete room category.");
        if (res.canDeactivate || res.error?.includes("booking") || res.error?.includes("reservation")) {
          setCanDeactivateInstead(true);
        }
        return;
      }
      setRoomTypes((prev) => prev.filter((rt) => rt.code !== code));
      setEditingRoomType(null);
    } catch (err: any) {
      setDeleteError(err?.message || "Failed to delete room category.");
    } finally {
      setIsDeletingRoomType(false);
    }
  };

  // Deactivate Room Type instead of delete
  const handleDeactivateCategory = async (code: string) => {
    setIsSavingRoomType(true);
    try {
      const res = await updateRoomTypeAction(code, { isActive: false });
      if (res.success) {
        setRoomTypes((prev) =>
          prev.map((rt) => (rt.code === code ? { ...rt, isActive: false } : rt))
        );
        setEditingRoomType(null);
      } else {
        setDeleteError(res.error || "Failed to deactivate category.");
      }
    } finally {
      setIsSavingRoomType(false);
    }
  };

  // Create new Room Type
  const handleCreateRoomType = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingRoomType(true);
    setCreateRoomTypeError(null);

    try {
      const amenitiesArr = newRoomTypeForm.amenities
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await addRoomTypeAction({
        name: newRoomTypeForm.name,
        code: newRoomTypeForm.code,
        roomsTotal: Number(newRoomTypeForm.roomsTotal),
        sizeSqft: Number(newRoomTypeForm.sizeSqft),
        bedType: newRoomTypeForm.bedType,
        tag: newRoomTypeForm.tag,
        shortDescription: newRoomTypeForm.shortDescription,
        amenities: amenitiesArr,
        imageSlot: newRoomTypeForm.imageSlot,
        rateCpDouble: Number(newRoomTypeForm.rateCpDouble),
        rateCpSingle: Number(newRoomTypeForm.rateCpSingle),
        rateEpDouble: Number(newRoomTypeForm.rateEpDouble),
        rateEpSingle: Number(newRoomTypeForm.rateEpSingle),
        pricePerNight: Number(newRoomTypeForm.rateEpSingle),
        maxGuests: 2,
        isActive: true,
      });

      if (!res.success) {
        setCreateRoomTypeError(res.error || "Failed to add room category.");
        return;
      }

      // Add to local state
      const newCode = (newRoomTypeForm.code || newRoomTypeForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")).replace(/(^-|-$)/g, "");
      setRoomTypes((prev) => [
        ...prev,
        {
          code: newCode,
          slug: newCode,
          name: newRoomTypeForm.name,
          roomsTotal: Number(newRoomTypeForm.roomsTotal),
          totalRooms: Number(newRoomTypeForm.roomsTotal),
          sizeSqft: Number(newRoomTypeForm.sizeSqft),
          bedType: newRoomTypeForm.bedType,
          tag: newRoomTypeForm.tag,
          shortDescription: newRoomTypeForm.shortDescription,
          amenities: amenitiesArr,
          imageSlot: newRoomTypeForm.imageSlot,
          rateCpDouble: Number(newRoomTypeForm.rateCpDouble),
          rateCpSingle: Number(newRoomTypeForm.rateCpSingle),
          rateEpDouble: Number(newRoomTypeForm.rateEpDouble),
          rateEpSingle: Number(newRoomTypeForm.rateEpSingle),
          pricePerNight: Number(newRoomTypeForm.rateEpSingle),
          maxGuests: 2,
          isActive: true,
          sortOrder: prev.length + 1,
        },
      ]);
      setIsNewRoomTypeOpen(false);
    } catch (err: any) {
      setCreateRoomTypeError(err?.message || "Failed to create category.");
    } finally {
      setIsCreatingRoomType(false);
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
        <div className="p-4 rounded-xl bg-[#1A191D] border border-[#373138] shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-[#8E8A85]">Total Keys</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-[#F5F2EF]">{totalRooms}</span>
            <span className="text-[10px] text-[#C6A16A] font-medium">Rooms</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#1A191D] border border-emerald-800/40 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-emerald-400">Available</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-emerald-400">{availableRooms}</span>
            <span className="text-[10px] text-emerald-400/70 font-mono">Ready</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#1A191D] border border-rose-800/40 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-rose-400">Occupied</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-rose-400">{occupiedRooms}</span>
            <span className="text-[10px] text-rose-400/70 font-mono">In-House</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#1A191D] border border-amber-800/40 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-amber-400">Housekeeping</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-amber-400">{cleaningRooms}</span>
            <span className="text-[10px] text-amber-400/70 font-mono">Cleaning</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#1A191D] border border-slate-700/50 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-slate-400">Maintenance</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-slate-300">{maintenanceRooms}</span>
            <span className="text-[10px] text-slate-400/70 font-mono">Blocked</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#1A191D] border border-[#C6A16A]/30 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-[#C6A16A]">Occupancy</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-[#C6A16A]">{occupancyRate}%</span>
            <span className="text-[10px] text-[#8E8A85] font-mono">Live</span>
          </div>
        </div>
      </div>

      {/* Navigation & Controls Bar */}
      <div className="bg-[#1A191D] border border-[#373138] rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        {/* View Mode Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#141316] border border-[#373138] rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("board")}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "board"
                ? "bg-[#742B40] text-white border border-[#C6A16A]/30 shadow-sm"
                : "text-[#B7A9A7] hover:text-[#F5F2EF] hover:bg-[#232126]"
            }`}
          >
            <BedDouble className="w-3.5 h-3.5" />
            <span>Room Status Board</span>
          </button>

          <button
            onClick={() => setActiveTab("tape-chart")}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "tape-chart"
                ? "bg-[#742B40] text-white border border-[#C6A16A]/30 shadow-sm"
                : "text-[#B7A9A7] hover:text-[#F5F2EF] hover:bg-[#232126]"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>60-Day Availability</span>
          </button>

          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "inventory"
                ? "bg-[#742B40] text-white border border-[#C6A16A]/30 shadow-sm"
                : "text-[#B7A9A7] hover:text-[#F5F2EF] hover:bg-[#232126]"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>
              Suites &amp; Rates ({roomTypes.reduce((acc, r) => acc + (r.isActive ? r.totalRooms : 0), 0)} Keys)
            </span>
          </button>

          <button
            onClick={() => setActiveTab("bookings")}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "bookings"
                ? "bg-[#742B40] text-white border border-[#C6A16A]/30 shadow-sm"
                : "text-[#B7A9A7] hover:text-[#F5F2EF] hover:bg-[#232126]"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Reservations ({initialReservations.length})</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {activeTab === "board" && (
            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-[#8E8A85]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#0D0D10] border border-[#373138] rounded-xl px-2.5 py-1.5 text-xs text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A] cursor-pointer"
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
            className="px-4 py-2 rounded-xl bg-[#742B40] hover:bg-[#5E2233] text-white text-xs font-semibold tracking-wide transition flex items-center gap-1.5 cursor-pointer border border-[#C6A16A]/30 shadow-md shadow-[#742B40]/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Reservation</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: ROOM STATUS BOARD */}
      {/* ======================================================== */}
      {activeTab === "board" && (
        <div className="space-y-6">
          {/* Grouped by Floors & Categories */}
          {roomCategories.map((cat) => {
            const slug = cat.slug;
            const catRooms = filteredRooms.filter((r) => r.categorySlug === slug);
            if (catRooms.length === 0) return null;
            const categoryMeta = cat;

            return (
              <div key={slug} className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#373138] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-serif font-bold text-[#F5F2EF]">
                      {categoryMeta?.name || slug}
                    </span>
                    <span className="text-xs text-[#C6A16A] font-mono">
                      (₹{categoryMeta?.price.toLocaleString("en-IN")}/night · Max {categoryMeta?.maxGuests} Guests)
                    </span>
                  </div>
                  <span className="text-xs text-[#8E8A85] font-mono">
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
                        className="bg-[#1A191D] border border-[#373138] hover:border-[#C6A16A]/40 rounded-2xl p-4 transition-all shadow-md flex flex-col justify-between space-y-4 relative overflow-hidden"
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
                              <span className="text-xl font-mono font-bold text-[#F5F2EF]">
                                Key #{room.roomNumber}
                              </span>
                              <span className="text-[10px] font-mono text-[#8E8A85] px-1.5 py-0.5 rounded bg-[#0D0D10] border border-[#373138]">
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

                          <p className="text-xs text-[#8E8A85] mt-1">
                            {room.categoryName}
                          </p>
                        </div>

                        {/* Current Occupant Details (if occupied) */}
                        {room.status === "occupied" && room.currentBooking ? (
                          <div className="bg-[#141316] border border-[#373138] rounded-xl p-2.5 space-y-1 text-xs">
                            <div className="flex items-center justify-between text-[#C6A16A]">
                              <span className="font-semibold flex items-center gap-1 truncate text-[#F5F2EF]">
                                <User className="w-3 h-3 text-[#C6A16A] shrink-0" />
                                <span className="truncate">{room.currentBooking.guestName}</span>
                              </span>
                              <span className="font-mono text-[10px] text-[#8E8A85]">
                                {room.currentBooking.bookingCode}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#8E8A85] flex items-center justify-between">
                              <span>Through {room.currentBooking.checkOut}</span>
                              <span className="text-emerald-400 font-medium">In-House</span>
                            </div>
                          </div>
                        ) : room.status === "cleaning" ? (
                          <div className="bg-amber-950/20 border border-amber-800/30 rounded-xl p-2.5 text-xs text-amber-300 flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 shrink-0" />
                            <span>Housekeeping sanitization in progress</span>
                          </div>
                        ) : null}

                        {/* Status switcher actions */}
                        <div className="pt-3 border-t border-[#373138] flex items-center justify-between gap-2">
                          <span className="text-[11px] text-[#8E8A85] font-mono">Change Status:</span>
                          <select
                            disabled={isBusy}
                            value={room.status}
                            onChange={(e) =>
                              handleStatusChange(room.roomNumber, e.target.value as RoomStatus)
                            }
                            className="bg-[#0D0D10] border border-[#373138] rounded-xl px-2 py-1 text-xs text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A] cursor-pointer"
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
      {/* TAB 2: 60-DAY AVAILABILITY CALENDAR & OCCUPANCY MATRIX */}
      {/* ======================================================== */}
      {activeTab === "tape-chart" && (
        <div className="space-y-4">
          <div className="bg-[#1A191D] border border-[#373138] rounded-2xl p-5 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#373138] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#C6A16A]" />
                  <h3 className="text-base font-serif font-bold text-[#F5F2EF]">
                    60-Day Availability &amp; Occupancy Calendar
                  </h3>
                </div>
                <p className="text-xs text-[#8E8A85] mt-0.5">
                  Live inventory across all rooms. Click any date to view in-house guest stays and room allocations.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-3 py-1.5 rounded-xl bg-[#141316] border border-[#373138] font-mono text-[#C6A16A]">
                  Total Hotel Keys: {totalRooms || 21} Rooms
                </span>
              </div>
            </div>

            {/* 60-Day Matrix Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-2.5 pt-4">
              {calendar.slice(0, 56).map((day) => {
                const isToday = day.date === new Date().toISOString().slice(0, 10);
                const isSoldOut = day.totalOccupied >= day.totalInventory;
                const isHighOccupancy = day.occupancyPercentage >= 75;

                return (
                  <div
                    key={day.date}
                    onClick={() => setSelectedCalendarDay(day)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between hover:scale-[1.02] hover:shadow-lg ${
                      isToday
                        ? "bg-[#742B40]/20 border-[#C6A16A] shadow-[0_0_15px_rgba(198,161,106,0.15)]"
                        : isSoldOut
                        ? "bg-rose-950/30 border-rose-600/40 hover:border-rose-500"
                        : isHighOccupancy
                        ? "bg-amber-950/20 border-amber-600/30 hover:border-amber-500"
                        : "bg-[#141316] border-[#373138] hover:border-[#C6A16A]/40"
                    }`}
                  >
                    {/* Date Header */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-[#8E8A85]">
                        {day.dayOfWeek}
                      </span>
                      <span
                        className={`text-xs font-mono font-bold ${
                          isToday ? "text-[#C6A16A]" : "text-[#F5F2EF]"
                        }`}
                      >
                        {new Date(day.date).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Occupancy Indicator */}
                    <div className="my-2.5">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-[10px] uppercase font-mono text-[#8E8A85]">
                          Booked
                        </span>
                        <span
                          className={`text-xs font-mono font-bold ${
                            isSoldOut
                              ? "text-[#ED252C]"
                              : isHighOccupancy
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {day.totalOccupied}/{day.totalInventory || 21}
                        </span>
                      </div>

                      {/* Mini Progress Bar */}
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isSoldOut
                              ? "bg-[#ED252C]"
                              : isHighOccupancy
                              ? "bg-amber-400"
                              : "bg-emerald-400"
                          }`}
                          style={{ width: `${Math.min(100, day.occupancyPercentage)}%` }}
                        />
                      </div>
                    </div>

                    {/* Category-wise breakdown badge */}
                    <div className="pt-2 border-t border-[#373138] space-y-0.5 text-[10px] font-mono">
                      {Object.entries(day.byRoomType).map(([catSlug, catData]) => (
                        <div key={catSlug} className="flex justify-between text-[#8E8A85]">
                          <span className="capitalize">{catSlug.replace(/-/g, " ")}:</span>
                          <span className="text-[#F5F2EF]">{catData?.booked || 0}/{catData?.total || 0}</span>
                        </div>
                      ))}
                    </div>

                    {day.activeStays.length > 0 && (
                      <span className="mt-2 text-[9px] text-[#C6A16A] font-medium text-center block hover:underline">
                        {day.activeStays.length} In-House Stay{day.activeStays.length > 1 ? "s" : ""} &rarr;
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-5 text-xs pt-4 mt-4 border-t border-[#373138] text-[#8E8A85]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/60" />
                <span>Available (&lt; 75% booked)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500/60" />
                <span>High Demand (&ge; 75% booked)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-500/40 border border-[#ED252C]" />
                <span>Sold Out (All Rooms Occupied)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: ROOMS & RATES INVENTORY CONFIGURATION */}
      {/* ======================================================== */}
      {activeTab === "inventory" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-[#1A191D] border border-[#373138] rounded-2xl p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#C6A16A]" />
                <h3 className="text-base font-serif font-bold text-[#F5F2EF]">
                  Rooms Inventory &amp; Rate Configuration
                </h3>
              </div>
              <p className="text-xs text-[#8E8A85] mt-0.5 max-w-2xl">
                Database single source of truth for all room categories, total keys, pricing, and guest capacity. Changes reflect instantly on the public website and reservation engine.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-xl bg-[#141316] border border-[#373138] text-right">
                <span className="text-[10px] uppercase font-mono text-[#8E8A85] block">Total Property Keys</span>
                <span className="text-[#F5F2EF] font-mono font-bold text-base">
                  {roomTypes.reduce((acc, r) => acc + (r.isActive ? r.totalRooms : 0), 0)} Rooms
                </span>
              </div>
            </div>
          </div>

          {/* Room Types Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roomTypes.map((rt) => {
              return (
                <div
                  key={rt.code}
                  className="bg-[#1A191D] border border-[#373138] hover:border-[#C6A16A]/40 rounded-2xl p-5 shadow-md flex flex-col justify-between space-y-4 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-serif font-bold text-[#F5F2EF]">
                          {rt.name}
                        </h4>
                        {rt.isActive ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            Inactive
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-[#8E8A85]">
                        Code: {rt.code}
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenEditRoomType(rt)}
                      className="px-3 py-1.5 rounded-xl bg-[#232126] hover:bg-[#2c2a30] border border-[#373138] text-xs text-[#C6A16A] hover:text-[#F5F2EF] transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Rates &amp; Keys</span>
                    </button>
                  </div>

                  {/* Attributes Grid */}
                  <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-[#141316] border border-[#373138] text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-[#8E8A85] block">Rate / Night</span>
                      <span className="text-sm font-mono font-bold text-[#C6A16A]">
                        {formatINR(rt.pricePerNight)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono text-[#8E8A85] block">Total Rooms</span>
                      <span className="text-sm font-mono font-bold text-[#F5F2EF]">
                        {rt.totalRooms} {rt.totalRooms === 1 ? "Key" : "Keys"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono text-[#8E8A85] block">Max Guests</span>
                      <span className="text-sm font-mono font-bold text-[#C6A16A]">
                        {rt.maxGuests} Guests
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-[#8E8A85] flex items-center justify-between border-t border-[#373138] pt-2">
                    <span>Tax Line: 18% Luxury GST applicable</span>
                    <span className="font-mono text-[10px]">Sort Order: {rt.sortOrder}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: BOOKINGS & RESERVATIONS LIST */}
      {/* ======================================================== */}
      {activeTab === "bookings" && (
        <ReservationsList initialReservations={initialReservations} />
      )}

      {/* ======================================================== */}
      {/* MODAL: NEW MANUAL RESERVATION */}
      {/* ======================================================== */}
      {isNewBookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-xl bg-[#1A191D] border border-[#373138] rounded-2xl shadow-2xl p-6 sm:p-8 text-[#F5F2EF] max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsNewBookingOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-[#232126] text-[#8E8A85] hover:text-[#F5F2EF] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#ED252C]" />
              <span className="text-[10px] font-mono uppercase text-[#C6A16A] tracking-wider">
                Direct Front Desk Entry
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#F5F2EF] mb-4">
              Create New Reservation
            </h3>

            {bookingError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            <form onSubmit={handleCreateBooking} className="space-y-4 text-xs">
              {/* Guest Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#B7A9A7] mb-1 font-medium">Guest Full Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Guest Full Name"
                    value={bookingForm.guestName}
                    onChange={(e) => setBookingForm({ ...bookingForm, guestName: e.target.value })}
                    className="w-full bg-[#0D0D10] border border-[#373138] rounded-xl p-2.5 text-[#F5F2EF] placeholder-[#8E8A85] focus:outline-none focus:border-[#C6A16A]"
                  />
                </div>

                <div>
                  <label className="block text-[#B7A9A7] mb-1 font-medium">Phone Number *</label>
                  <input
                    required
                    type="tel"
                    placeholder="+91 98727 68514"
                    value={bookingForm.guestPhone}
                    onChange={(e) => setBookingForm({ ...bookingForm, guestPhone: e.target.value })}
                    className="w-full bg-[#0D0D10] border border-[#373138] rounded-xl p-2.5 text-[#F5F2EF] placeholder-[#8E8A85] focus:outline-none focus:border-[#C6A16A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#B7A9A7] mb-1 font-medium">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="guest@example.com"
                  value={bookingForm.guestEmail}
                  onChange={(e) => setBookingForm({ ...bookingForm, guestEmail: e.target.value })}
                  className="w-full bg-[#0D0D10] border border-[#373138] rounded-xl p-2.5 text-[#F5F2EF] placeholder-[#8E8A85] focus:outline-none focus:border-[#C6A16A]"
                />
              </div>

              {/* Category & Room Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#B7A9A7] mb-1 font-medium">Room Category *</label>
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
                    className="w-full bg-[#0D0D10] border border-[#373138] rounded-xl p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A] cursor-pointer"
                  >
                    {roomCategories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name} (₹{c.price.toLocaleString("en-IN")})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#B7A9A7] mb-1 font-medium">Select Physical Key *</label>
                  <select
                    value={bookingForm.roomNumber}
                    onChange={(e) => setBookingForm({ ...bookingForm, roomNumber: e.target.value })}
                    className="w-full bg-[#0D0D10] border border-[#373138] rounded-xl p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A] cursor-pointer"
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
                  <label className="block text-[#B7A9A7] mb-1 font-medium">Check-In Date *</label>
                  <input
                    required
                    type="date"
                    value={bookingForm.checkIn}
                    onChange={(e) => setBookingForm({ ...bookingForm, checkIn: e.target.value })}
                    className="w-full bg-[#0D0D10] border border-[#373138] rounded-xl p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                  />
                </div>

                <div>
                  <label className="block text-[#B7A9A7] mb-1 font-medium">Check-Out Date *</label>
                  <input
                    required
                    type="date"
                    value={bookingForm.checkOut}
                    onChange={(e) => setBookingForm({ ...bookingForm, checkOut: e.target.value })}
                    className="w-full bg-[#0D0D10] border border-[#373138] rounded-xl p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                  />
                </div>
              </div>

              {/* Guests Count & Advance Paid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#B7A9A7] mb-1 font-medium">
                    Guests (Max{" "}
                    {roomCategories.find((c) => c.slug === bookingForm.categorySlug)?.maxGuests || 2})
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={roomCategories.find((c) => c.slug === bookingForm.categorySlug)?.maxGuests || 2}
                    value={bookingForm.guestsCount}
                    onChange={(e) => setBookingForm({ ...bookingForm, guestsCount: Number(e.target.value) })}
                    className="w-full bg-[#0D0D10] border border-[#373138] rounded-xl p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                  />
                </div>

                <div>
                  <label className="block text-[#B7A9A7] mb-1 font-medium">Advance Paid (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={bookingForm.advancePaid}
                    onChange={(e) => setBookingForm({ ...bookingForm, advancePaid: Number(e.target.value) })}
                    className="w-full bg-[#0D0D10] border border-[#373138] rounded-xl p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                  />
                </div>
              </div>

              {/* Source & Notes */}
              <div>
                <label className="block text-[#B7A9A7] mb-1 font-medium">Booking Source</label>
                <select
                  value={bookingForm.source}
                  onChange={(e) =>
                    setBookingForm({
                      ...bookingForm,
                      source: e.target.value as "phone" | "walk_in" | "whatsapp" | "website",
                    })
                  }
                  className="w-full bg-[#0D0D10] border border-[#373138] rounded-xl p-2.5 text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A] cursor-pointer"
                >
                  <option value="phone">Phone Call</option>
                  <option value="walk_in">Walk-In Guest</option>
                  <option value="whatsapp">WhatsApp Inquiry</option>
                  <option value="website">Direct Website</option>
                </select>
              </div>

              <div>
                <label className="block text-[#B7A9A7] mb-1 font-medium">Special Notes / Requests</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Early check-in requested, VIP champagne arrival..."
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  className="w-full bg-[#0D0D10] border border-[#373138] rounded-xl p-2.5 text-[#F5F2EF] placeholder-[#8E8A85] focus:outline-none focus:border-[#C6A16A]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewBookingOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#373138] text-[#8E8A85] hover:text-[#F5F2EF] hover:bg-[#232126] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingBooking}
                  className="px-5 py-2.5 rounded-xl bg-[#742B40] hover:bg-[#5E2233] text-white font-semibold transition cursor-pointer flex items-center gap-2 border border-[#C6A16A]/30"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-white text-black rounded-2xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
            {/* Action Bar (Top) */}
            <div className="flex items-center justify-between pb-6 border-b border-gray-200 print:hidden">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ED252C]" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                  Official Guest Voucher &amp; Invoice
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-[#742B40] text-white text-xs font-semibold hover:bg-[#5E2233] transition flex items-center gap-1.5 cursor-pointer shadow-sm"
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
                  <h2 className="text-2xl font-serif font-black tracking-tight text-[#742B40]">
                    HOTEL FREMONT
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">Thoughtful comfort. Warm hospitality. · 21 Rooms</p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Sector 80, Airport Road, Mohali, Punjab · +91 79734 50281
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
                  <strong>Cancellation Policy:</strong> Free cancellation up to 24 hours prior to check-in (12:00 PM). Cancellations under 24 hours and no-shows are charged 1 Night Room Tariff.
                </p>
                <p className="text-center pt-2 font-mono text-gray-400">
                  Hotel Fremont · Authorized Guest Voucher · Generated on {new Date().toLocaleDateString("en-IN")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT ROOM CATEGORY & 4-RATE INVENTORY */}
      {/* ======================================================== */}
      {editingRoomType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-[#1A191D] border border-[#373138] rounded-2xl shadow-2xl p-6 text-[#F5F2EF] space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#373138] pb-3">
              <div>
                <h3 className="text-lg font-serif font-bold text-[#F5F2EF]">
                  Edit Room Category
                </h3>
                <span className="text-[11px] font-mono text-[#C6A16A]">
                  Code: {editingRoomType.code}
                </span>
              </div>
              <button
                onClick={() => setEditingRoomType(null)}
                className="p-1 rounded-lg text-[#8E8A85] hover:text-[#F5F2EF] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error or Warning Banner */}
            {editError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            {deleteError && (
              <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Cannot Delete Room Category</span>
                </div>
                <p className="leading-relaxed">{deleteError}</p>
                {canDeactivateInstead && (
                  <button
                    type="button"
                    onClick={() => handleDeactivateCategory(editingRoomType.code)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#742B40] hover:bg-[#5b2232] text-white font-semibold text-xs transition cursor-pointer"
                  >
                    Deactivate Category Instead
                  </button>
                )}
              </div>
            )}

            {rateChangeConfirmed && (
              <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs space-y-2 animate-fadeIn">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Confirm Rate Adjustment</span>
                </div>
                <p className="leading-relaxed">
                  New bookings and online payments will use these rates immediately.
                </p>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveRoomType(false);
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C6A16A] mb-1 font-semibold">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0D0D10] border border-[#373138] text-xs text-[#F5F2EF] focus:border-[#C6A16A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C6A16A] mb-1 font-semibold">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={editForm.slug}
                    onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0D0D10] border border-[#373138] text-xs text-[#F5F2EF] focus:border-[#C6A16A] focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* 4 Rate Plans Matrix */}
              <div className="p-3.5 rounded-xl bg-[#141316] border border-[#373138] space-y-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#C6A16A] font-bold block">
                  4 Rate Plans (Excl. Taxes in INR)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[10px] text-[#8E8A85] mb-1 font-medium">
                      With Breakfast · Double
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={editForm.rateCpDouble}
                      onChange={(e) => {
                        setEditForm({ ...editForm, rateCpDouble: Number(e.target.value) });
                        setRateChangeConfirmed(false);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#0D0D10] border border-[#373138] text-xs text-[#F5F2EF] font-mono focus:border-[#C6A16A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#8E8A85] mb-1 font-medium">
                      With Breakfast · Single
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={editForm.rateCpSingle}
                      onChange={(e) => {
                        setEditForm({ ...editForm, rateCpSingle: Number(e.target.value) });
                        setRateChangeConfirmed(false);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#0D0D10] border border-[#373138] text-xs text-[#F5F2EF] font-mono focus:border-[#C6A16A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#8E8A85] mb-1 font-medium">
                      Without Breakfast · Double
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={editForm.rateEpDouble}
                      onChange={(e) => {
                        setEditForm({ ...editForm, rateEpDouble: Number(e.target.value) });
                        setRateChangeConfirmed(false);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#0D0D10] border border-[#373138] text-xs text-[#F5F2EF] font-mono focus:border-[#C6A16A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#8E8A85] mb-1 font-medium">
                      Without Breakfast · Single
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={editForm.rateEpSingle}
                      onChange={(e) => {
                        setEditForm({ ...editForm, rateEpSingle: Number(e.target.value) });
                        setRateChangeConfirmed(false);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#0D0D10] border border-[#373138] text-xs text-[#F5F2EF] font-mono focus:border-[#C6A16A] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Physical Attributes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C6A16A] mb-1 font-semibold">
                    Total Rooms (Keys) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={50}
                    value={editForm.totalRooms}
                    onChange={(e) => setEditForm({ ...editForm, totalRooms: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0D0D10] border border-[#373138] text-xs text-[#F5F2EF] focus:border-[#C6A16A] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C6A16A] mb-1 font-semibold">
                    Size (sq ft)
                  </label>
                  <input
                    type="number"
                    min={50}
                    value={editForm.sizeSqft}
                    onChange={(e) => setEditForm({ ...editForm, sizeSqft: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0D0D10] border border-[#373138] text-xs text-[#F5F2EF] focus:border-[#C6A16A] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C6A16A] mb-1 font-semibold">
                    Bed Type
                  </label>
                  <input
                    type="text"
                    value={editForm.bedType}
                    onChange={(e) => setEditForm({ ...editForm, bedType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0D0D10] border border-[#373138] text-xs text-[#F5F2EF] focus:border-[#C6A16A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C6A16A] mb-1 font-semibold">
                    Status
                  </label>
                  <select
                    value={editForm.isActive ? "active" : "inactive"}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === "active" })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0D0D10] border border-[#373138] text-xs text-[#F5F2EF] focus:border-[#C6A16A] focus:outline-none cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C6A16A] mb-1 font-semibold">
                    Tag / Badge (e.g. Best choice for corporate stays)
                  </label>
                  <input
                    type="text"
                    value={editForm.tag}
                    onChange={(e) => setEditForm({ ...editForm, tag: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0D0D10] border border-[#373138] text-xs text-[#F5F2EF] focus:border-[#C6A16A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C6A16A] mb-1 font-semibold">
                    Photo Slot Key (e.g. super-deluxe, premium)
                  </label>
                  <input
                    type="text"
                    value={editForm.imageSlot}
                    onChange={(e) => setEditForm({ ...editForm, imageSlot: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0D0D10] border border-[#373138] text-xs text-[#F5F2EF] focus:border-[#C6A16A] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C6A16A] mb-1 font-semibold">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  value={editForm.shortDescription}
                  onChange={(e) => setEditForm({ ...editForm, shortDescription: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0D0D10] border border-[#373138] text-xs text-[#F5F2EF] focus:border-[#C6A16A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C6A16A] mb-1 font-semibold">
                  Amenities (comma separated)
                </label>
                <input
                  type="text"
                  value={editForm.amenities}
                  onChange={(e) => setEditForm({ ...editForm, amenities: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0D0D10] border border-[#373138] text-xs text-[#F5F2EF] focus:border-[#C6A16A] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#373138]">
                <button
                  type="button"
                  onClick={() => handleDeleteRoomType(editingRoomType.code)}
                  disabled={isDeletingRoomType}
                  className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeletingRoomType ? "Checking..." : "Delete Category"}</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingRoomType(null)}
                    className="px-4 py-2 rounded-xl bg-[#232126] text-xs text-[#8E8A85] hover:text-[#F5F2EF] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingRoomType}
                    className="px-5 py-2.5 rounded-xl bg-[#742B40] hover:bg-[#5b2232] disabled:opacity-50 text-white font-semibold text-xs tracking-wider uppercase transition cursor-pointer flex items-center gap-1.5 border border-[#C6A16A]/30 shadow-md shadow-[#742B40]/20"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>
                      {isSavingRoomType
                        ? "Saving..."
                        : rateChangeConfirmed
                        ? "Confirm & Publish Rates"
                        : "Save Changes"}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD NEW ROOM CATEGORY */}
      {/* ======================================================== */}
      {isNewRoomTypeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-xl bg-[#1A191D] border border-[#373138] rounded-2xl shadow-2xl p-6 text-[#F5F2EF] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#373138] pb-3">
              <div>
                <h3 className="text-lg font-serif font-bold text-[#F5F2EF]">
                  Add New Room Category
                </h3>
                <span className="text-[11px] text-[#8E8A85]">
                  Create an inventory category for Hotel Fremont
                </span>
              </div>
              <button
                onClick={() => setIsNewRoomTypeOpen(false)}
                className="p-1 rounded-lg text-[#8E8A85] hover:text-[#F5F2EF] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createRoomTypeError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/40 text-rose-200 text-xs">
                {createRoomTypeError}
              </div>
            )}

            <form onSubmit={handleCreateRoomType} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C6A16A] mb-1 font-semibold">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Executive Studio"
                    value={newRoomTypeForm.name}
                    onChange={(e) => setNewRoomTypeForm({ ...newRoomTypeForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0D0D10] border border-[#373138] text-xs text-[#F5F2EF] placeholder-[#8E8A85] focus:border-[#C6A16A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C6A16A] mb-1 font-semibold">
                    Code / Slug (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. executive-studio"
                    value={newRoomTypeForm.code}
                    onChange={(e) => setNewRoomTypeForm({ ...newRoomTypeForm, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0D0D10] border border-[#373138] text-xs text-[#F5F2EF] placeholder-[#8E8A85] focus:border-[#C6A16A] focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* 4 Rates */}
              <div className="p-3.5 rounded-xl bg-[#141316] border border-[#373138] space-y-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#C6A16A] font-bold block">
                  4 Rate Plans (Excl. Taxes in INR)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[10px] text-[#8E8A85] mb-1 font-medium">
                      With Breakfast · Double
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newRoomTypeForm.rateCpDouble}
                      onChange={(e) => setNewRoomTypeForm({ ...newRoomTypeForm, rateCpDouble: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#0D0D10] border border-[#373138] text-xs text-[#F5F2EF] font-mono focus:border-[#C6A16A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#8E8A85] mb-1 font-medium">
                      With Breakfast · Single
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newRoomTypeForm.rateCpSingle}
                      onChange={(e) => setNewRoomTypeForm({ ...newRoomTypeForm, rateCpSingle: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#0D0D10] border border-[#373138] text-xs text-[#F5F2EF] font-mono focus:border-[#C6A16A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#8E8A85] mb-1 font-medium">
                      Without Breakfast · Double
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newRoomTypeForm.rateEpDouble}
                      onChange={(e) => setNewRoomTypeForm({ ...newRoomTypeForm, rateEpDouble: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#0D0D10] border border-[#373138] text-xs text-[#F5F2EF] font-mono focus:border-[#C6A16A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#8E8A85] mb-1 font-medium">
                      Without Breakfast · Single
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newRoomTypeForm.rateEpSingle}
                      onChange={(e) => setNewRoomTypeForm({ ...newRoomTypeForm, rateEpSingle: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#0D0D10] border border-[#373138] text-xs text-[#F5F2EF] font-mono focus:border-[#C6A16A] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C6A16A] mb-1 font-semibold">
                    Total Rooms (Keys) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={50}
                    value={newRoomTypeForm.roomsTotal}
                    onChange={(e) => setNewRoomTypeForm({ ...newRoomTypeForm, roomsTotal: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0D0D10] border border-[#373138] text-xs text-[#F5F2EF] focus:border-[#C6A16A] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C6A16A] mb-1 font-semibold">
                    Size (sq ft)
                  </label>
                  <input
                    type="number"
                    min={50}
                    value={newRoomTypeForm.sizeSqft}
                    onChange={(e) => setNewRoomTypeForm({ ...newRoomTypeForm, sizeSqft: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0D0D10] border border-[#373138] text-xs text-[#F5F2EF] focus:border-[#C6A16A] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C6A16A] mb-1 font-semibold">
                    Bed Type
                  </label>
                  <input
                    type="text"
                    value={newRoomTypeForm.bedType}
                    onChange={(e) => setNewRoomTypeForm({ ...newRoomTypeForm, bedType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0D0D10] border border-[#373138] text-xs text-[#F5F2EF] focus:border-[#C6A16A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#373138]">
                <button
                  type="button"
                  onClick={() => setIsNewRoomTypeOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#232126] text-xs text-[#8E8A85] hover:text-[#F5F2EF] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingRoomType}
                  className="px-5 py-2.5 rounded-xl bg-[#742B40] hover:bg-[#5b2232] disabled:opacity-50 text-white font-semibold text-xs tracking-wider uppercase transition cursor-pointer flex items-center gap-1.5 border border-[#C6A16A]/30 shadow-md shadow-[#742B40]/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isCreatingRoomType ? "Creating..." : "Create Category"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: IN-HOUSE STAYS INSPECTION FOR CALENDAR DAY */}
      {/* ======================================================== */}
      {selectedCalendarDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-xl bg-[#1A191D] border border-[#373138] rounded-2xl shadow-2xl p-6 text-[#F5F2EF] space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#373138] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#C6A16A]" />
                  <h3 className="text-lg font-serif font-bold text-[#F5F2EF]">
                    In-House Stays: {new Date(selectedCalendarDay.date).toLocaleDateString("en-IN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </h3>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono font-bold text-[#C6A16A]">
                    {selectedCalendarDay.totalOccupied} of {selectedCalendarDay.totalInventory || 21} Keys Booked ({selectedCalendarDay.occupancyPercentage}% Occupancy)
                  </span>
                  <span className="text-[#8E8A85] text-xs">·</span>
                  <span className="text-xs font-mono text-emerald-400">
                    {Math.max(0, (selectedCalendarDay.totalInventory || 21) - selectedCalendarDay.totalOccupied)} Rooms Available
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedCalendarDay(null)}
                className="p-1 rounded-lg text-[#8E8A85] hover:text-[#F5F2EF] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of confirmed in-house bookings */}
            <div className="space-y-3">
              {selectedCalendarDay.activeStays.length === 0 ? (
                <div className="py-8 text-center text-[#8E8A85] space-y-2">
                  <DoorClosed className="w-8 h-8 mx-auto text-[#C6A16A]/60" />
                  <p className="text-sm font-medium text-[#F5F2EF]">All Rooms Vacant</p>
                  <p className="text-xs text-[#8E8A85]">
                    No confirmed guest reservations staying in-house on this night.
                  </p>
                </div>
              ) : (
                selectedCalendarDay.activeStays.map((stay) => {
                  const cleanPhone = stay.guestPhone.replace(/\D/g, "").slice(-10);
                  const waUrl = `https://wa.me/91${cleanPhone}?text=Hello%20${encodeURIComponent(
                    stay.guestName
                  )},%20greeting%20from%20Hotel%20Fremont%20front%20desk.`;

                  return (
                    <div
                      key={stay.reservationId}
                      className="p-4 rounded-xl bg-[#141316] border border-[#373138] hover:border-[#C6A16A]/40 transition space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#F5F2EF] text-sm">{stay.guestName}</span>
                          <span className="px-1.5 py-0.5 rounded bg-[#0D0D10] border border-[#373138] font-mono text-[10px] text-[#C6A16A]">
                            {stay.referenceCode}
                          </span>
                        </div>
                        <span className="font-mono text-xs text-emerald-400 font-semibold">
                          {stay.roomsCount} {stay.roomsCount === 1 ? "Room" : "Rooms"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[#8E8A85]">
                        <span className="text-[#C6A16A] font-medium">{stay.roomTypeName}</span>
                        <span className="font-mono text-[11px]">
                          {stay.checkIn} to {stay.checkOut}
                        </span>
                      </div>

                      {/* Quick Contact Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-[#373138]">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/40 font-medium text-[11px] flex items-center gap-1 transition"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                        <a
                          href={`tel:+91${cleanPhone}`}
                          className="px-3 py-1 rounded-lg bg-[#232126] hover:bg-[#2c2a30] text-[#F5F2EF] border border-[#373138] font-medium text-[11px] flex items-center gap-1 transition"
                        >
                          <Phone className="w-3 h-3 text-[#C6A16A]" />
                          <span>Call +91 {cleanPhone}</span>
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedCalendarDay(null)}
                className="px-4 py-2 rounded-xl bg-[#232126] hover:bg-[#2c2a30] text-xs text-[#F5F2EF] transition border border-[#373138] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

