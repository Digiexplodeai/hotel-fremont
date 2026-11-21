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

  // Filtered rows
  const filteredRows = useMemo(() => {
    return bookings.filter((item) => {
      if (categoryFilter !== "all") {
        const cat = item.roomCategory.toLowerCase();
        if (categoryFilter === "deluxe" && !cat.includes("deluxe")) return false;
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

  // Handle status update
  const handleUpdateStatus = async (booking: UnifiedBooking, newStatus: UnifiedBooking["bookingStatus"]) => {
    setIsUpdatingStatus(true);
    try {
      if (booking.source === "online_booking") {
        const bStatus: BookingStatus =
          newStatus === "cancelled" ? "cancelled" : newStatus === "pending" ? "pending" : "confirmed";
        await updateBookingStatusAction(booking.id, bStatus);
      } else {
        const rStatus: ReservationStatus =
          newStatus === "cancelled" ? "cancelled" : newStatus === "pending" ? "new" : "confirmed";
        await updateReservationStatusAction(booking.id, rStatus);
      }

      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, bookingStatus: newStatus } : b))
      );
      if (selectedBooking && selectedBooking.id === booking.id) {
        setSelectedBooking({ ...selectedBooking, bookingStatus: newStatus });
      }
    } catch {
      alert("Failed to update status");
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
      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-[#EAE8E3] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by guest name, phone, or booking ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F8F7F4] border border-[#EAE8E3] text-xs text-[#24272B] placeholder-[#9CA3AF] focus:outline-none focus:border-[#742B40] transition"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#F8F7F4] border border-[#EAE8E3] text-xs text-[#24272B] focus:outline-none focus:border-[#742B40]"
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
            className="px-3 py-2 rounded-xl bg-[#F8F7F4] border border-[#EAE8E3] text-xs text-[#24272B] focus:outline-none focus:border-[#742B40]"
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
            className="px-3 py-2 rounded-xl bg-[#F8F7F4] border border-[#EAE8E3] text-xs text-[#24272B] focus:outline-none focus:border-[#742B40]"
          >
            <option value="all">All Payments</option>
            <option value="paid">Paid (Razorpay)</option>
            <option value="pending">Pending Payment</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Booking Management Table */}
      <div className="bg-white border border-[#EAE8E3] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF9F7] border-b border-[#EAE8E3] text-[11px] font-sans font-bold uppercase tracking-wider text-[#6B7280]">
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
            <tbody className="divide-y divide-[#EAE8E3]">
              {filteredRows.length > 0 ? (
                filteredRows.map((booking) => {
                  return (
                    <tr
                      key={`${booking.source}-${booking.id}`}
                      className="hover:bg-[#FAF9F7] transition cursor-pointer"
                      onClick={() => setSelectedBooking(booking)}
                    >
                      {/* Ref */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#742B40]">
                        {booking.ref}
                      </td>

                      {/* Guest */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#24272B]">{booking.guestName}</div>
                        <div className="text-[11px] text-[#6B7280] font-mono">{booking.phone}</div>
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#24272B]">
                          {booking.checkIn} &rarr; {booking.checkOut}
                        </div>
                        <div className="text-[11px] text-[#6B7280]">
                          {booking.nights} Night{booking.nights > 1 ? "s" : ""} · {booking.guests} Guests
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 font-medium text-[#24272B]">
                        {booking.roomCategory}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right font-serif font-bold text-sm text-[#24272B]">
                        ₹{booking.totalAmount.toLocaleString("en-IN")}
                      </td>

                      {/* Booking Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            booking.bookingStatus === "confirmed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : booking.bookingStatus === "checked_in"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : booking.bookingStatus === "checked_out"
                              ? "bg-gray-100 text-gray-700 border-gray-200"
                              : booking.bookingStatus === "pending"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
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
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : booking.paymentStatus === "refunded"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : booking.paymentStatus === "failed"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {booking.paymentStatus === "paid"
                              ? "PAID ONLINE"
                              : booking.paymentStatus.toUpperCase()}
                          </span>
                          {booking.paymentEnvironment === "TEST" && (
                            <span className="inline-block px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-300 text-[9px] font-mono font-bold tracking-wider">
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
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handlePrintVoucher(booking)}
                            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#742B40] hover:bg-white border border-transparent hover:border-[#EAE8E3] transition"
                            title="Print Voucher"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedBooking(booking)}
                            className="px-2.5 py-1 rounded-lg bg-[#F8F7F4] hover:bg-[#EAE8E3] text-[#24272B] font-medium text-[11px] border border-[#EAE8E3] transition"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#6B7280]">
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col justify-between overflow-y-auto p-6 space-y-6">
            {/* Drawer Header */}
            <div>
              <div className="flex items-center justify-between border-b border-[#EAE8E3] pb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#9CA3AF] block">
                    Reservation Dossier
                  </span>
                  <h3 className="text-xl font-serif font-bold text-[#742B40]">
                    {selectedBooking.ref}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#24272B] hover:bg-[#F8F7F4]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Guest & Stay Cards */}
              <div className="space-y-4 pt-4 text-xs">
                {/* Guest Card */}
                <div className="p-4 rounded-xl bg-[#FAF9F7] border border-[#EAE8E3] space-y-2">
                  <span className="text-[10px] uppercase font-bold text-[#9CA3AF] tracking-wider block">
                    Guest Information
                  </span>
                  <div className="text-sm font-bold text-[#24272B]">
                    {selectedBooking.guestName}
                  </div>
                  <div className="flex items-center gap-2 text-[#6B7280]">
                    <Phone className="w-3.5 h-3.5 text-[#B69A68]" />
                    <span className="font-mono">{selectedBooking.phone}</span>
                  </div>
                  {selectedBooking.email && (
                    <div className="flex items-center gap-2 text-[#6B7280]">
                      <Mail className="w-3.5 h-3.5 text-[#B69A68]" />
                      <span>{selectedBooking.email}</span>
                    </div>
                  )}
                </div>

                {/* Stay Card */}
                <div className="p-4 rounded-xl bg-[#FAF9F7] border border-[#EAE8E3] space-y-2">
                  <span className="text-[10px] uppercase font-bold text-[#9CA3AF] tracking-wider block">
                    Stay Specifications
                  </span>
                  <div className="font-semibold text-[#24272B]">
                    {selectedBooking.roomCategory}
                  </div>
                  <div className="flex items-center justify-between text-[#6B7280]">
                    <span>Check-in:</span>
                    <span className="font-medium text-[#24272B]">{selectedBooking.checkIn} (from 1:00 PM)</span>
                  </div>
                  <div className="flex items-center justify-between text-[#6B7280]">
                    <span>Check-out:</span>
                    <span className="font-medium text-[#24272B]">{selectedBooking.checkOut} (until 11:00 AM)</span>
                  </div>
                  <div className="flex items-center justify-between text-[#6B7280]">
                    <span>Duration:</span>
                    <span className="font-medium text-[#24272B]">{selectedBooking.nights} Night(s)</span>
                  </div>
                  <div className="flex items-center justify-between text-[#6B7280]">
                    <span>Number of Guests:</span>
                    <span className="font-medium text-[#24272B]">{selectedBooking.guests} Guests</span>
                  </div>
                </div>

                {/* Billing Card */}
                <div className="p-4 rounded-xl bg-[#FAF9F7] border border-[#EAE8E3] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#9CA3AF] tracking-wider block">
                      Financial Summary
                    </span>
                    {selectedBooking.paymentEnvironment && (
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                          selectedBooking.paymentEnvironment === "TEST"
                            ? "bg-amber-50 text-amber-800 border-amber-300"
                            : "bg-emerald-50 text-emerald-800 border-emerald-300"
                        }`}
                      >
                        {selectedBooking.paymentEnvironment} ENVIRONMENT
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-base font-bold text-[#742B40]">
                    <span>Total Tariff &amp; Taxes:</span>
                    <span className="font-serif">₹{selectedBooking.totalAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#6B7280]">
                    <span>Booking Status:</span>
                    <span className="font-semibold uppercase text-[11px] text-[#24272B]">
                      {selectedBooking.bookingStatus.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#6B7280]">
                    <span>Payment Status:</span>
                    <span
                      className={`font-semibold uppercase text-[11px] ${
                        selectedBooking.paymentStatus === "paid" ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {selectedBooking.paymentStatus === "paid" ? "PAID" : "PENDING"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#6B7280]">
                    <span>Payment Gateway:</span>
                    <span className="font-medium text-[#24272B] text-[11px]">
                      {selectedBooking.paymentGateway || (selectedBooking.razorpayPaymentId ? "Razorpay" : "Front Desk Cash")}
                    </span>
                  </div>
                  {selectedBooking.razorpayPaymentId && (
                    <div className="text-[10px] text-[#6B7280] font-mono pt-1 border-t border-[#EAE8E3] space-y-0.5">
                      <div>Payment ID: {selectedBooking.razorpayPaymentId}</div>
                      {selectedBooking.razorpayOrderId && (
                        <div>Order ID: {selectedBooking.razorpayOrderId}</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Booking Status Control */}
                <div className="p-4 rounded-xl bg-white border border-[#EAE8E3] space-y-2">
                  <span className="text-[10px] uppercase font-bold text-[#9CA3AF] tracking-wider block">
                    Update Operational Status
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleUpdateStatus(selectedBooking, "checked_in")}
                      disabled={isUpdatingStatus || selectedBooking.bookingStatus === "checked_in"}
                      className="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold border border-blue-200 transition disabled:opacity-50 cursor-pointer"
                    >
                      Mark Checked In
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedBooking, "checked_out")}
                      disabled={isUpdatingStatus || selectedBooking.bookingStatus === "checked_out"}
                      className="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold border border-gray-300 transition disabled:opacity-50 cursor-pointer"
                    >
                      Mark Checked Out
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedBooking, "confirmed")}
                      disabled={isUpdatingStatus || selectedBooking.bookingStatus === "confirmed"}
                      className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold border border-emerald-200 transition disabled:opacity-50 cursor-pointer"
                    >
                      Confirm Booking
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to cancel this reservation?")) {
                          handleUpdateStatus(selectedBooking, "cancelled");
                        }
                      }}
                      disabled={isUpdatingStatus || selectedBooking.bookingStatus === "cancelled"}
                      className="px-3 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold border border-rose-200 transition disabled:opacity-50 cursor-pointer"
                    >
                      Cancel Booking
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[#EAE8E3] flex items-center justify-between gap-3">
              <button
                onClick={() => handlePrintVoucher(selectedBooking)}
                className="px-4 py-2 rounded-xl bg-[#F8F7F4] hover:bg-[#EAE8E3] text-[#24272B] font-semibold text-xs border border-[#EAE8E3] transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Voucher</span>
              </button>
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 rounded-xl bg-[#742B40] hover:bg-[#5E2233] text-white font-semibold text-xs transition cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
