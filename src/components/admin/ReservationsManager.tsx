"use client";

import React, { useState, useMemo } from "react";
import {
  BookingRecord,
  BookingStatus,
  updateBookingStatusAction,
  createBookingAction,
} from "@/actions/rooms";
import {
  ReservationRecord,
  ReservationStatus,
  updateReservationStatusAction,
} from "@/actions/reservations";
import {
  deleteReservationAction,
  archiveReservationAction,
} from "@/actions/recordManagement";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import {
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Printer,
  X,
  Plus,
  CheckCircle2,
  AlertCircle,
  Eye,
  CreditCard,
  Building,
  BedDouble,
  ChevronRight,
  ExternalLink,
  MoreVertical,
  Trash2,
  Archive,
  XCircle,
  Edit3,
} from "lucide-react";

export interface UnifiedBooking {
  id: string;
  source: "online_booking" | "reservation";
  ref: string;
  guestName: string;
  phone: string;
  email?: string | null;
  roomCategory: string;
  roomNumber?: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalAmount: number;
  bookingStatus: "confirmed" | "checked_in" | "checked_out" | "pending" | "cancelled";
  paymentStatus: "paid" | "pending" | "refunded" | "failed";
  paymentMethod?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  paymentEnvironment?: "TEST" | "LIVE";
  paymentGateway?: string;
  notes?: string;
  createdAt: string;
}

interface ReservationsManagerProps {
  initialBookings: BookingRecord[];
  initialReservations: ReservationRecord[];
}

export default function ReservationsManager({
  initialBookings,
  initialReservations,
}: ReservationsManagerProps) {
  // Convert into unified list
  const unifiedList = useMemo<UnifiedBooking[]>(() => {
    const list: UnifiedBooking[] = [];

    // 1. Online Razorpay Bookings
    initialBookings.forEach((b) => {
      let bStatus: UnifiedBooking["bookingStatus"] = "confirmed";
      if (b.status === "cancelled") bStatus = "cancelled";
      else if (b.status === "pending") bStatus = "pending";
      else if (b.status === "checked_in") bStatus = "checked_in";
      else if (b.status === "checked_out") bStatus = "checked_out";
      else if (b.status === "paid" || b.status === "confirmed") bStatus = "confirmed";

      let pStatus: UnifiedBooking["paymentStatus"] = "pending";
      if (b.status === "paid" || (b.amountPaid && b.amountPaid > 0)) pStatus = "paid";
      else if (b.status === "refunded") pStatus = "refunded";
      else if (b.status === "failed") pStatus = "failed";

      list.push({
        id: b.id,
        source: "online_booking",
        ref: b.bookingCode,
        guestName: b.guestName,
        phone: b.guestPhone,
        email: b.guestEmail || undefined,
        roomCategory: b.categoryName || b.categorySlug,
        roomNumber: b.roomNumber,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        nights: Math.max(1, Math.round((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / 86400000)),
        guests: b.guestsCount || 2,
        totalAmount: b.totalAmount,
        bookingStatus: bStatus,
        paymentStatus: pStatus,
        paymentMethod: b.paymentMethod,
        razorpayPaymentId: b.razorpayPaymentId,
        razorpayOrderId: b.razorpayOrderId,
        paymentEnvironment: b.paymentEnvironment || (b.razorpayPaymentId ? "TEST" : undefined),
        paymentGateway: b.paymentGateway || (b.razorpayPaymentId ? "Razorpay" : undefined),
        createdAt: b.createdAt,
      });
    });

    // 2. Direct Front-Desk Reservations (Deduplicated with existing online bookings)
    initialReservations.forEach((r) => {
      const ref = r.reference_code || `FRM-${r.id.slice(0, 6).toUpperCase()}`;

      // STRICT DEDUPLICATION: If this reference already exists in list (from bookings table), DO NOT duplicate!
      if (list.some((existing) => existing.ref === ref)) {
        return;
      }

      let bStatus: UnifiedBooking["bookingStatus"] = "confirmed";
      if (r.status === "cancelled" || r.status === "closed") bStatus = "cancelled";
      else if (r.status === "new" || r.status === "in_discussion") bStatus = "pending";
      else if (r.status === "checked_in") bStatus = "checked_in";
      else if (r.status === "checked_out") bStatus = "checked_out";
      else if (r.status === "confirmed" || r.status === "converted" || r.status === "paid") bStatus = "confirmed";

      let pStatus: UnifiedBooking["paymentStatus"] = "pending";
      if (r.status === "paid" || (r.amount_paid && r.amount_paid >= (r.estimated_total || 0))) {
        pStatus = "paid";
      }

      list.push({
        id: r.id,
        source: "reservation",
        ref,
        guestName: r.full_name,
        phone: r.phone,
        email: r.email,
        roomCategory: r.room_type,
        roomNumber: (r as any).room_number || undefined,
        checkIn: r.check_in,
        checkOut: r.check_out,
        nights: r.nights || 1,
        guests: r.guests || 2,
        totalAmount: r.estimated_total || 0,
        bookingStatus: bStatus,
        paymentStatus: pStatus,
        paymentMethod: r.payment_method || undefined,
        razorpayPaymentId: r.razorpay_payment_id || undefined,
        razorpayOrderId: r.razorpay_order_id || undefined,
        paymentEnvironment: r.payment_environment,
        paymentGateway: r.payment_gateway || (r.channel === "razorpay" ? "Razorpay" : "Front Desk"),
        notes: r.special_request || undefined,
        createdAt: r.created_at,
      });
    });

    // Sort newest first
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [initialBookings, initialReservations]);

  const [bookings, setBookings] = useState<UnifiedBooking[]>(unifiedList);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  // Drawer & modal state
  const [selectedBooking, setSelectedBooking] = useState<UnifiedBooking | null>(null);
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Three-dot action menu & deletion state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [deleteModalBooking, setDeleteModalBooking] = useState<UnifiedBooking | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Close menu on click outside
  React.useEffect(() => {
    const handleWindowClick = () => setActiveMenuId(null);
    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, []);

  const handleCancelReservation = async (booking: UnifiedBooking) => {
    setActiveMenuId(null);
    if (!confirm(`Are you sure you want to cancel reservation ${booking.ref}? Room availability will be released.`)) {
      return;
    }
    await handleUpdateStatus(booking, "cancelled");
    setActionFeedback(`Reservation ${booking.ref} cancelled successfully.`);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleArchiveReservation = async (booking: UnifiedBooking) => {
    setActiveMenuId(null);
    const res = await archiveReservationAction(booking.id, "Archived from reservations manager");
    if (res.success) {
      setBookings((prev) => prev.filter((b) => b.id !== booking.id));
      setActionFeedback(`Reservation ${booking.ref} archived.`);
      setTimeout(() => setActionFeedback(null), 4000);
    } else {
      alert(res.error || "Failed to archive reservation.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalBooking) return;
    const res = await deleteReservationAction(
      deleteModalBooking.id,
      "Permanently deleted test reservation via admin panel"
    );
    if (res.success) {
      setBookings((prev) => prev.filter((b) => b.id !== deleteModalBooking.id && b.ref !== deleteModalBooking.ref));
      setActionFeedback(`Record ${deleteModalBooking.ref} permanently deleted.`);
      setTimeout(() => setActionFeedback(null), 4000);
    } else {
      throw new Error(res.error || "Failed to delete record.");
    }
  };

  // Filtered rows
  const [statusErrorMessage, setStatusErrorMessage] = useState<string | null>(null);
  const [roomNumberInput, setRoomNumberInput] = useState<string>("");
  const [showAdminOverride, setShowAdminOverride] = useState<boolean>(false);

  // Sync roomNumberInput when selectedBooking changes
  React.useEffect(() => {
    if (selectedBooking) {
      setRoomNumberInput(selectedBooking.roomNumber || "");
      setStatusErrorMessage(null);
      setShowAdminOverride(false);
    }
  }, [selectedBooking?.id]);

  const filteredRows = useMemo(() => {
    return bookings.filter((item) => {
      if (categoryFilter !== "all") {
        const cat = item.roomCategory.toLowerCase();
        if (categoryFilter === "deluxe" && (cat.includes("super") || !cat.includes("deluxe"))) return false;
        if (categoryFilter === "super-deluxe" && !cat.includes("super")) return false;
        if (categoryFilter === "premium" && !cat.includes("premium")) return false;
      }

      if (statusFilter !== "all" && item.bookingStatus !== statusFilter) {
        return false;
      }

      if (paymentFilter !== "all" && item.paymentStatus !== paymentFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.guestName.toLowerCase().includes(q);
        const matchPhone = item.phone.includes(q);
        const matchRef = item.ref.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchRef) return false;
      }

      return true;
    });
  }, [bookings, categoryFilter, statusFilter, paymentFilter, searchQuery]);

  // Handle status update with strict state machine and error handling
  const handleUpdateStatus = async (
    booking: UnifiedBooking,
    newStatus: UnifiedBooking["bookingStatus"],
    roomNumber?: string,
    override = false
  ) => {
    setIsUpdatingStatus(true);
    setStatusErrorMessage(null);
    try {
      let res: { success: boolean; error?: string };
      const targetRoom = roomNumber !== undefined ? roomNumber : (roomNumberInput.trim() || booking.roomNumber);

      if (booking.source === "online_booking") {
        res = await updateBookingStatusAction(booking.id, newStatus as any, targetRoom, override);
      } else {
        res = await updateReservationStatusAction(booking.id, newStatus as any, override, targetRoom);
      }

      if (!res.success) {
        const errMsg = res.error || "Failed to update reservation status.";
        setStatusErrorMessage(errMsg);
        return;
      }

      const finalRoom = targetRoom || booking.roomNumber;
      setBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id ? { ...b, bookingStatus: newStatus, roomNumber: finalRoom } : b
        )
      );
      if (selectedBooking && selectedBooking.id === booking.id) {
        setSelectedBooking((prev) =>
          prev ? { ...prev, bookingStatus: newStatus, roomNumber: finalRoom } : null
        );
      }
      setActionFeedback(`Status updated to ${newStatus.replace(/_/g, " ").toUpperCase()}`);
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      const msg = err?.message || "Failed to update status";
      setStatusErrorMessage(msg);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Printable confirmation voucher
  const handlePrintVoucher = (booking: UnifiedBooking) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reservation Confirmation - ${booking.ref}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #24272B; line-height: 1.6; }
            .header { border-bottom: 2px solid #742B40; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .brand { font-size: 24px; font-weight: bold; color: #742B40; }
            .ref { font-family: monospace; font-size: 16px; background: #F8F7F4; padding: 4px 10px; border-radius: 6px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .card { background: #FAF9F7; padding: 15px; border-radius: 8px; border: 1px solid #EAE8E3; }
            .card h4 { margin: 0 0 10px; color: #742B40; font-size: 13px; text-transform: uppercase; }
            .total { font-size: 20px; font-weight: bold; color: #742B40; margin-top: 20px; text-align: right; }
            .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #EAE8E3; font-size: 12px; color: #6B7280; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">HOTEL FREMONT</div>
              <div style="font-size: 12px; color: #6B7280;">Khasra No 186, Sector 80, Airport Road, Mohali, Punjab</div>
              <div style="font-size: 12px; color: #6B7280;">Front Desk: +91 79734 50281 · hotelfremont1@gmail.com</div>
            </div>
            <div>
              <div style="font-size: 11px; text-transform: uppercase; color: #6B7280;">Booking Reference</div>
              <div class="ref">${booking.ref}</div>
            </div>
          </div>

          <div class="grid">
            <div class="card">
              <h4>Guest Details</h4>
              <div><strong>Name:</strong> ${booking.guestName}</div>
              <div><strong>Phone:</strong> ${booking.phone}</div>
              ${booking.email ? `<div><strong>Email:</strong> ${booking.email}</div>` : ""}
              <div><strong>Guests:</strong> ${booking.guests} Guest(s)</div>
            </div>

            <div class="card">
              <h4>Stay Information</h4>
              <div><strong>Category:</strong> ${booking.roomCategory}</div>
              <div><strong>Check-in:</strong> ${booking.checkIn} (from 1:00 PM)</div>
              <div><strong>Check-out:</strong> ${booking.checkOut} (until 11:00 AM)</div>
              <div><strong>Duration:</strong> ${booking.nights} Night(s)</div>
            </div>
          </div>

          <div class="card">
            <h4>Billing & Payment</h4>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Room Tariff & Taxes:</span>
              <span>₹${booking.totalAmount.toLocaleString("en-IN")}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Booking Status:</span>
              <span style="font-weight: bold; text-transform: uppercase;">${booking.bookingStatus.toUpperCase()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: bold; color: #742B40; margin-bottom: 5px;">
              <span>Payment Status:</span>
              <span style="text-transform: uppercase;">${booking.paymentStatus === "paid" ? "PAID" : "PENDING"}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Payment Gateway:</span>
              <span>${booking.paymentGateway || (booking.razorpayPaymentId ? "Razorpay" : "Front Desk")}</span>
            </div>
            ${booking.paymentEnvironment ? `<div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Payment Environment:</span>
              <span style="font-family: monospace; font-weight: bold; color: ${booking.paymentEnvironment === "TEST" ? "#B45309" : "#15803D"};">${booking.paymentEnvironment}</span>
            </div>` : ""}
            ${booking.razorpayPaymentId ? `<div style="font-size: 11px; color: #6B7280; margin-top: 5px;">Razorpay Payment ID: ${booking.razorpayPaymentId}</div>` : ""}
            ${booking.razorpayOrderId ? `<div style="font-size: 11px; color: #6B7280; margin-top: 2px;">Razorpay Order ID: ${booking.razorpayOrderId}</div>` : ""}
          </div>

          <div class="footer">
            Cancellation Policy: Free cancellation up to 24 hours prior to scheduled check-in time. Government-issued photo ID required at check-in.
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {actionFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-[#1A191D] border border-[#373138] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[#8E8A85] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by guest name, phone, or booking ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0D0D10] border border-[#373138] text-xs text-[#F5F2EF] placeholder-[#8E8A85] focus:outline-none focus:border-[#C6A16A] transition"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#0D0D10] border border-[#373138] text-xs text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A] cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="deluxe">Deluxe Room (9)</option>
            <option value="super-deluxe">Super Deluxe (10)</option>
            <option value="premium">Premium Room (2)</option>
          </select>

          {/* Booking Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#0D0D10] border border-[#373138] text-xs text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A] cursor-pointer"
          >
            <option value="all">All Bookings</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked In</option>
            <option value="checked_out">Checked Out</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Payment Status */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#0D0D10] border border-[#373138] text-xs text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A] cursor-pointer"
          >
            <option value="all">All Payments</option>
            <option value="paid">Paid (Razorpay)</option>
            <option value="pending">Pending Payment</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Booking Management Table */}
      <div className="bg-[#1A191D] border border-[#373138] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#141316] border-b border-[#373138] text-[11px] font-sans font-bold uppercase tracking-wider text-[#8E8A85]">
                <th className="py-3.5 px-4">Booking Ref</th>
                <th className="py-3.5 px-4">Guest Details</th>
                <th className="py-3.5 px-4">Stay Dates</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-center">Booking Status</th>
                <th className="py-3.5 px-4 text-center">Payment Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#373138]">
              {filteredRows.length > 0 ? (
                filteredRows.map((booking) => {
                  return (
                    <tr
                      key={`${booking.source}-${booking.id}`}
                      className="hover:bg-[#232126]/60 transition cursor-pointer"
                      onClick={() => setSelectedBooking(booking)}
                    >
                      {/* Ref */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#C6A16A]">
                        {booking.ref}
                      </td>

                      {/* Guest */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#F5F2EF]">{booking.guestName}</div>
                        <div className="text-[11px] text-[#8E8A85] font-mono">{booking.phone}</div>
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#F5F2EF]">
                          {booking.checkIn} &rarr; {booking.checkOut}
                        </div>
                        <div className="text-[11px] text-[#8E8A85]">
                          {booking.nights} Night{booking.nights > 1 ? "s" : ""} · {booking.guests} Guests
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 font-medium text-[#F5F2EF]">
                        {booking.roomCategory}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right font-serif font-bold text-sm text-[#F5F2EF]">
                        ₹{booking.totalAmount.toLocaleString("en-IN")}
                      </td>

                      {/* Booking Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            booking.bookingStatus === "confirmed"
                              ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/40"
                              : booking.bookingStatus === "checked_in"
                              ? "bg-blue-950/40 text-blue-300 border-blue-800/40"
                              : booking.bookingStatus === "checked_out"
                              ? "bg-[#232126] text-[#8E8A85] border-[#373138]"
                              : booking.bookingStatus === "pending"
                              ? "bg-amber-950/40 text-amber-300 border-amber-800/40"
                              : "bg-rose-950/40 text-rose-300 border-rose-800/40"
                          }`}
                        >
                          {booking.bookingStatus.replace(/_/g, " ").toUpperCase()}
                        </span>
                      </td>

                      {/* Payment Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                              booking.paymentStatus === "paid"
                                ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/40"
                                : booking.paymentStatus === "refunded"
                                ? "bg-purple-950/40 text-purple-300 border-purple-800/40"
                                : booking.paymentStatus === "failed"
                                ? "bg-rose-950/40 text-rose-300 border-rose-800/40"
                                : "bg-amber-950/40 text-amber-300 border-amber-800/40"
                            }`}
                          >
                            {booking.paymentStatus === "paid"
                              ? "PAID ONLINE"
                              : booking.paymentStatus.toUpperCase()}
                          </span>
                          {booking.paymentEnvironment === "TEST" && (
                            <span className="inline-block px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-700/60 text-[9px] font-mono font-bold tracking-wider">
                              TEST MODE
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5 relative">
                          <button
                            onClick={() => handlePrintVoucher(booking)}
                            className="p-1.5 rounded-lg text-[#8E8A85] hover:text-[#C6A16A] hover:bg-[#232126] border border-transparent hover:border-[#373138] transition cursor-pointer"
                            title="Print Voucher"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedBooking(booking)}
                            className="px-2.5 py-1 rounded-lg bg-[#232126] hover:bg-[#2c2a30] text-[#F5F2EF] font-medium text-[11px] border border-[#373138] transition cursor-pointer"
                          >
                            Details
                          </button>

                          {/* Three-dot action menu */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === booking.id ? null : booking.id);
                              }}
                              className="p-1.5 rounded-lg text-[#8E8A85] hover:text-[#F5F2EF] hover:bg-[#232126] border border-transparent hover:border-[#373138] transition cursor-pointer"
                              title="More Options"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {activeMenuId === booking.id && (
                              <div
                                className="absolute right-0 top-full mt-1 w-48 bg-[#1A191D] border border-[#373138] rounded-xl shadow-2xl py-1 z-30 text-left text-xs animate-in fade-in duration-150"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setSelectedBooking(booking);
                                  }}
                                  className="w-full px-3 py-1.5 hover:bg-[#232126] text-[#F5F2EF] flex items-center gap-2 transition cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-[#C6A16A]" />
                                  <span>View Dossier</span>
                                </button>

                                {/* Strict State-Machine Operations */}
                                {booking.bookingStatus === "confirmed" && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        handleUpdateStatus(booking, "checked_in");
                                      }}
                                      className="w-full px-3 py-1.5 hover:bg-blue-950/40 text-blue-300 flex items-center gap-2 transition cursor-pointer font-medium"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                                      <span>Mark Checked In</span>
                                    </button>
                                    <button
                                      onClick={() => handleCancelReservation(booking)}
                                      className="w-full px-3 py-1.5 hover:bg-amber-950/40 text-amber-300 flex items-center gap-2 transition cursor-pointer"
                                    >
                                      <XCircle className="w-3.5 h-3.5 text-amber-400" />
                                      <span>Cancel Reservation</span>
                                    </button>
                                  </>
                                )}

                                {booking.bookingStatus === "checked_in" && (
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      handleUpdateStatus(booking, "checked_out");
                                    }}
                                    className="w-full px-3 py-1.5 hover:bg-emerald-950/40 text-emerald-300 flex items-center gap-2 transition cursor-pointer font-medium"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Mark Checked Out</span>
                                  </button>
                                )}

                                {booking.bookingStatus === "pending" && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        handleUpdateStatus(booking, "confirmed");
                                      }}
                                      className="w-full px-3 py-1.5 hover:bg-emerald-950/40 text-emerald-300 flex items-center gap-2 transition cursor-pointer font-medium"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>Confirm Booking</span>
                                    </button>
                                    <button
                                      onClick={() => handleCancelReservation(booking)}
                                      className="w-full px-3 py-1.5 hover:bg-amber-950/40 text-amber-300 flex items-center gap-2 transition cursor-pointer"
                                    >
                                      <XCircle className="w-3.5 h-3.5 text-amber-400" />
                                      <span>Cancel Reservation</span>
                                    </button>
                                  </>
                                )}

                                <button
                                  onClick={() => handleArchiveReservation(booking)}
                                  className="w-full px-3 py-1.5 hover:bg-[#232126] text-[#8E8A85] flex items-center gap-2 transition cursor-pointer"
                                >
                                  <Archive className="w-3.5 h-3.5 text-[#8E8A85]" />
                                  <span>Archive</span>
                                </button>
                                <div className="border-t border-[#373138] my-1" />
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setDeleteModalBooking(booking);
                                  }}
                                  className="w-full px-3 py-1.5 hover:bg-rose-950/40 text-rose-400 flex items-center gap-2 transition cursor-pointer font-medium"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete Test Record</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8E8A85]">
                    No reservations match the selected search or filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reservation Details Drawer */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end">
          <div className="bg-[#1A191D] border-l border-[#373138] w-full max-w-lg h-full shadow-2xl flex flex-col justify-between overflow-y-auto p-6 space-y-6 text-[#F5F2EF]">
            {/* Drawer Header */}
            <div>
              <div className="flex items-center justify-between border-b border-[#373138] pb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#8E8A85] block">
                    Reservation Dossier
                  </span>
                  <h3 className="text-xl font-serif font-bold text-[#C6A16A]">
                    {selectedBooking.ref}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="p-1.5 rounded-lg text-[#8E8A85] hover:text-[#F5F2EF] hover:bg-[#232126] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Guest & Stay Cards */}
              <div className="space-y-4 pt-4 text-xs">
                {/* Guest Card */}
                <div className="p-4 rounded-xl bg-[#141316] border border-[#373138] space-y-2">
                  <span className="text-[10px] uppercase font-bold text-[#8E8A85] tracking-wider block">
                    Guest Information
                  </span>
                  <div className="text-sm font-bold text-[#F5F2EF]">
                    {selectedBooking.guestName}
                  </div>
                  <div className="flex items-center gap-2 text-[#B7A9A7]">
                    <Phone className="w-3.5 h-3.5 text-[#C6A16A]" />
                    <span className="font-mono">{selectedBooking.phone}</span>
                  </div>
                  {selectedBooking.email && (
                    <div className="flex items-center gap-2 text-[#B7A9A7]">
                      <Mail className="w-3.5 h-3.5 text-[#C6A16A]" />
                      <span>{selectedBooking.email}</span>
                    </div>
                  )}
                </div>

                {/* Stay Card */}
                <div className="p-4 rounded-xl bg-[#141316] border border-[#373138] space-y-2">
                  <span className="text-[10px] uppercase font-bold text-[#8E8A85] tracking-wider block">
                    Stay Specifications
                  </span>
                  <div className="font-semibold text-[#F5F2EF]">
                    {selectedBooking.roomCategory}
                  </div>
                  <div className="flex items-center justify-between text-[#B7A9A7]">
                    <span>Check-in:</span>
                    <span className="font-medium text-[#F5F2EF]">{selectedBooking.checkIn} (from 1:00 PM)</span>
                  </div>
                  <div className="flex items-center justify-between text-[#B7A9A7]">
                    <span>Check-out:</span>
                    <span className="font-medium text-[#F5F2EF]">{selectedBooking.checkOut} (until 11:00 AM)</span>
                  </div>
                  <div className="flex items-center justify-between text-[#B7A9A7]">
                    <span>Duration:</span>
                    <span className="font-medium text-[#F5F2EF]">{selectedBooking.nights} Night(s)</span>
                  </div>
                  <div className="flex items-center justify-between text-[#B7A9A7]">
                    <span>Number of Guests:</span>
                    <span className="font-medium text-[#F5F2EF]">{selectedBooking.guests} Guests</span>
                  </div>
                  <div className="flex items-center justify-between text-[#B7A9A7] pt-1 border-t border-[#373138]">
                    <span>Assigned Room:</span>
                    <span className="font-semibold text-[#C6A16A] font-mono">
                      {selectedBooking.roomNumber ? `Room ${selectedBooking.roomNumber}` : "Not Assigned"}
                    </span>
                  </div>
                </div>

                {/* Billing Card */}
                <div className="p-4 rounded-xl bg-[#141316] border border-[#373138] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#8E8A85] tracking-wider block">
                      Financial Summary
                    </span>
                    {selectedBooking.paymentEnvironment && (
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                          selectedBooking.paymentEnvironment === "TEST"
                            ? "bg-amber-950/60 text-amber-300 border-amber-700/60"
                            : "bg-emerald-950/60 text-emerald-300 border-emerald-700/60"
                        }`}
                      >
                        {selectedBooking.paymentEnvironment} ENVIRONMENT
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-base font-bold text-[#F5F2EF]">
                    <span>Total Tariff &amp; Taxes:</span>
                    <span className="font-serif text-[#C6A16A]">₹{selectedBooking.totalAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#B7A9A7]">
                    <span>Operational Status:</span>
                    <span
                      className={`font-semibold uppercase text-[11px] px-2 py-0.5 rounded border ${
                        selectedBooking.bookingStatus === "confirmed"
                          ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/40"
                          : selectedBooking.bookingStatus === "checked_in"
                          ? "bg-blue-950/40 text-blue-300 border-blue-800/40"
                          : selectedBooking.bookingStatus === "checked_out"
                          ? "bg-[#232126] text-[#8E8A85] border-[#373138]"
                          : selectedBooking.bookingStatus === "pending"
                          ? "bg-amber-950/40 text-amber-300 border-amber-800/40"
                          : "bg-rose-950/40 text-rose-300 border-rose-800/40"
                      }`}
                    >
                      {selectedBooking.bookingStatus.replace(/_/g, " ").toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#B7A9A7]">
                    <span>Payment Status:</span>
                    <span
                      className={`font-semibold uppercase text-[11px] ${
                        selectedBooking.paymentStatus === "paid" ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {selectedBooking.paymentStatus === "paid" ? "PAID" : "PENDING"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#B7A9A7]">
                    <span>Payment Gateway:</span>
                    <span className="font-medium text-[#F5F2EF] text-[11px]">
                      {selectedBooking.paymentGateway || (selectedBooking.razorpayPaymentId ? "Razorpay" : "Front Desk Cash")}
                    </span>
                  </div>
                  {selectedBooking.razorpayPaymentId && (
                    <div className="text-[10px] text-[#8E8A85] font-mono pt-1 border-t border-[#373138] space-y-0.5">
                      <div>Payment ID: {selectedBooking.razorpayPaymentId}</div>
                      {selectedBooking.razorpayOrderId && (
                        <div>Order ID: {selectedBooking.razorpayOrderId}</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Status Update Error Toast */}
                {statusErrorMessage && (
                  <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-bold block">Status Transition Blocked</span>
                      <span>{statusErrorMessage}</span>
                    </div>
                  </div>
                )}

                {/* Booking Status Control Section */}
                <div className="p-4 rounded-xl bg-[#141316] border border-[#373138] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#8E8A85] tracking-wider block">
                      Operational Workflow Control
                    </span>
                    <span className="text-[10px] font-mono text-[#8E8A85]">
                      Current: {selectedBooking.bookingStatus.replace(/_/g, " ").toUpperCase()}
                    </span>
                  </div>

                  {/* Context Guidance Message */}
                  {selectedBooking.bookingStatus === "confirmed" && (
                    <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-[11px] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Confirmed reservation. Assign a room and mark Checked In upon arrival.</span>
                    </div>
                  )}
                  {selectedBooking.bookingStatus === "checked_in" && (
                    <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-800/40 text-blue-300 text-[11px] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>Guest is currently in-house. Mark Checked Out upon departure.</span>
                    </div>
                  )}
                  {selectedBooking.bookingStatus === "checked_out" && (
                    <div className="p-2.5 rounded-lg bg-[#232126] border border-[#373138] text-[#8E8A85] text-[11px] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#8E8A85] shrink-0" />
                      <span>Stay completed and checked out. Room is released to housekeeping.</span>
                    </div>
                  )}
                  {selectedBooking.bookingStatus === "cancelled" && (
                    <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-300 text-[11px] flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Reservation cancelled. Inventory returned to hotel pool.</span>
                    </div>
                  )}

                  {/* Room Assignment Field (for check-in) */}
                  {(selectedBooking.bookingStatus === "confirmed" || selectedBooking.bookingStatus === "pending") && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-[#B7A9A7] block">
                        Assign Room Number (e.g. 101, 204):
                      </label>
                      <input
                        type="text"
                        value={roomNumberInput}
                        onChange={(e) => setRoomNumberInput(e.target.value)}
                        placeholder="Enter room number"
                        className="w-full px-3 py-1.5 rounded-lg bg-[#0D0D10] border border-[#373138] text-xs font-mono text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                      />
                    </div>
                  )}

                  {/* Primary Operational Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {/* Mark Checked In */}
                    <button
                      onClick={() => handleUpdateStatus(selectedBooking, "checked_in")}
                      disabled={
                        isUpdatingStatus ||
                        selectedBooking.bookingStatus === "checked_in" ||
                        selectedBooking.bookingStatus === "checked_out" ||
                        selectedBooking.bookingStatus === "cancelled"
                      }
                      title={
                        selectedBooking.bookingStatus === "checked_in"
                          ? "Guest is already checked in"
                          : selectedBooking.bookingStatus === "checked_out"
                          ? "Cannot check in a completed stay"
                          : selectedBooking.bookingStatus === "cancelled"
                          ? "Cannot check in a cancelled booking"
                          : "Mark guest as checked in"
                      }
                      className="px-3 py-2 rounded-xl bg-blue-950/40 text-blue-300 hover:bg-blue-900/60 font-semibold border border-blue-800/40 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-xs flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Checked In</span>
                    </button>

                    {/* Mark Checked Out */}
                    <button
                      onClick={() => handleUpdateStatus(selectedBooking, "checked_out")}
                      disabled={
                        isUpdatingStatus ||
                        selectedBooking.bookingStatus !== "checked_in"
                      }
                      title={
                        selectedBooking.bookingStatus !== "checked_in"
                          ? "Guest must be checked in before checkout"
                          : "Mark stay completed and check out"
                      }
                      className="px-3 py-2 rounded-xl bg-[#232126] text-[#B7A9A7] hover:bg-[#2c2a30] hover:text-[#F5F2EF] font-semibold border border-[#373138] transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-xs flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Checked Out</span>
                    </button>

                    {/* Confirm Booking */}
                    <button
                      onClick={() => handleUpdateStatus(selectedBooking, "confirmed")}
                      disabled={
                        isUpdatingStatus ||
                        selectedBooking.bookingStatus !== "pending"
                      }
                      title={
                        selectedBooking.bookingStatus === "confirmed"
                          ? "Booking is already confirmed"
                          : selectedBooking.bookingStatus !== "pending"
                          ? "Cannot confirm active or closed stay"
                          : "Confirm pending booking"
                      }
                      className="px-3 py-2 rounded-xl bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 font-semibold border border-emerald-800/40 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-xs flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm Booking</span>
                    </button>

                    {/* Cancel Booking */}
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to cancel reservation ${selectedBooking.ref}? Room availability will be released.`)) {
                          handleUpdateStatus(selectedBooking, "cancelled");
                        }
                      }}
                      disabled={
                        isUpdatingStatus ||
                        selectedBooking.bookingStatus === "checked_in" ||
                        selectedBooking.bookingStatus === "checked_out" ||
                        selectedBooking.bookingStatus === "cancelled"
                      }
                      title={
                        selectedBooking.bookingStatus === "checked_in"
                          ? "In-house stay. Use Mark Checked Out for early departure"
                          : selectedBooking.bookingStatus === "checked_out"
                          ? "Cannot cancel a completed stay"
                          : selectedBooking.bookingStatus === "cancelled"
                          ? "Booking is already cancelled"
                          : "Cancel reservation"
                      }
                      className="px-3 py-2 rounded-xl bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 font-semibold border border-rose-800/40 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-xs flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel Booking</span>
                    </button>
                  </div>

                  {/* Administrative Correction Override (For exceptional operational corrections) */}
                  {(selectedBooking.bookingStatus === "checked_out" || selectedBooking.bookingStatus === "cancelled") && (
                    <div className="pt-2 border-t border-[#373138]">
                      <button
                        type="button"
                        onClick={() => setShowAdminOverride(!showAdminOverride)}
                        className="text-[10px] text-[#8E8A85] hover:text-[#C6A16A] underline block cursor-pointer"
                      >
                        {showAdminOverride ? "Hide Administrative Override" : "Need to correct an accidental entry? Admin Override"}
                      </button>

                      {showAdminOverride && (
                        <div className="mt-2 p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-300 text-[11px] space-y-2">
                          <p className="font-semibold text-amber-200">
                            Supervised Administrative Correction:
                          </p>
                          <p className="text-[10px] text-amber-400">
                            Reverting a terminal state requires administrative authorization and audit logging.
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (confirm("Reopen this stay as Confirmed? Availability will be re-validated.")) {
                                  handleUpdateStatus(selectedBooking, "confirmed", undefined, true);
                                }
                              }}
                              disabled={isUpdatingStatus}
                              className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] cursor-pointer"
                            >
                              Reopen as Confirmed
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[#373138] flex items-center justify-between gap-3">
              <button
                onClick={() => handlePrintVoucher(selectedBooking)}
                className="px-4 py-2 rounded-xl bg-[#232126] hover:bg-[#2c2a30] text-[#F5F2EF] font-semibold text-xs border border-[#373138] transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Voucher</span>
              </button>
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 rounded-xl bg-[#742B40] hover:bg-[#5E2233] text-white font-semibold text-xs transition border border-[#C6A16A]/30 cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={Boolean(deleteModalBooking)}
        onClose={() => setDeleteModalBooking(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete Reservation ${deleteModalBooking?.ref}?`}
        description="This will permanently delete this test reservation record from the database. Room availability will be refreshed."
        impactDetails={
          deleteModalBooking
            ? [
                { label: "Booking Reference", value: deleteModalBooking.ref },
                { label: "Guest Name", value: deleteModalBooking.guestName },
                { label: "Room Category", value: deleteModalBooking.roomCategory },
                { label: "Total Amount", value: `₹${deleteModalBooking.totalAmount.toLocaleString("en-IN")}` },
                { label: "Payment Status", value: deleteModalBooking.paymentStatus.toUpperCase() },
                { label: "Environment", value: deleteModalBooking.paymentEnvironment || "TEST MODE" },
              ]
            : []
        }
        requireTypeDelete={true}
        requiredConfirmationText="DELETE"
        confirmButtonText="Delete Permanently"
      />
    </div>
  );
}
