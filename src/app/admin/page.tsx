import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/actions/auth";
import { getRoomsWithStatusAction, getBookingsAction } from "@/actions/rooms";
import { getEnquiriesAction } from "@/actions/enquiries";
import { getReservationsAction } from "@/actions/reservations";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";
import {
  BedDouble,
  CalendarCheck,
  Calendar,
  Users,
  MessageSquare,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ImageIcon,
  ChevronRight,
  Phone,
  Building,
  CreditCard,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Dashboard Overview | Hotel Fremont Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  const [roomsRes, bookingsRes, enquiriesRes, reservationsRes] = await Promise.all([
    getRoomsWithStatusAction(),
    getBookingsAction(),
    getEnquiriesAction(),
    getReservationsAction(),
  ]);

  const rooms = roomsRes.rooms;
  const bookings = bookingsRes.bookings;
  const enquiries = enquiriesRes.enquiries;
  const reservations = reservationsRes.reservations || [];

  const totalKeys = 21;
  const todayStr = new Date().toISOString().slice(0, 10);

  // Active in-house stays TONIGHT (check_in <= todayStr && check_out > todayStr)
  // Future bookings for tomorrow or next month must NEVER count towards today's occupancy
  const activeTonightBookings = bookings.filter(
    (b) =>
      b.checkIn <= todayStr &&
      b.checkOut > todayStr &&
      (b.status === "paid" || b.status === "confirmed" || b.status === "checked_in")
  );
  const activeTonightRefs = new Set(activeTonightBookings.map((b) => b.bookingCode).filter(Boolean));

  const activeTonightReservations = reservations.filter(
    (r) =>
      r.check_in <= todayStr &&
      r.check_out > todayStr &&
      (r.status === "confirmed" || r.status === "converted" || r.status === "paid" || r.status === "checked_in") &&
      !activeTonightRefs.has(r.reference_code || "")
  );

  const activeInHouseRoomsCount =
    activeTonightBookings.reduce((sum, b) => sum + (b.roomsRequested || 1), 0) +
    activeTonightReservations.reduce((sum, r) => sum + (r.rooms_requested || 1), 0);

  const physicalOccupiedCount = rooms.filter((r) => r.status === "occupied").length;
  const occupiedCount = Math.min(totalKeys, Math.max(physicalOccupiedCount, activeInHouseRoomsCount));
  const availableCount = Math.max(0, totalKeys - occupiedCount);

  // Today's arrivals (deduplicated between online bookings and reservations)
  const arrivalsFromBookings = bookings.filter((b) => b.checkIn === todayStr);
  const arrivalsFromRes = reservations.filter((r) => r.check_in === todayStr);
  const arrivalsList: {
    id: string;
    ref: string;
    name: string;
    phone: string;
    roomType: string;
    guests: number;
    status: string;
    isPaid: boolean;
    amount: number;
  }[] = [];

  // 1. Online bookings take precedence
  arrivalsFromBookings.forEach((b) => {
    arrivalsList.push({
      id: b.id,
      ref: b.bookingCode,
      name: b.guestName,
      phone: b.guestPhone,
      roomType: b.categoryName || b.categorySlug,
      guests: b.guestsCount || 1,
      status: b.status,
      isPaid: b.status === "paid" || b.status === "confirmed" || Boolean(b.amountPaid && b.amountPaid > 0),
      amount: b.totalAmount,
    });
  });

  // 2. Add direct reservations (skip if reference code already present)
  arrivalsFromRes.forEach((r) => {
    const ref = r.reference_code || `RES-${r.id.slice(0, 6)}`;
    if (arrivalsList.some((item) => item.ref === ref)) return;
    arrivalsList.push({
      id: r.id,
      ref,
      name: r.full_name,
      phone: r.phone,
      roomType: r.room_type,
      guests: r.guests || 1,
      status: r.status,
      isPaid: r.status === "paid" || r.channel === "razorpay" || Boolean(r.amount_paid && r.amount_paid > 0),
      amount: r.estimated_total,
    });
  });

  const todaysArrivals = arrivalsList;

  // Today's departures (deduplicated)
  const departuresFromBookings = bookings.filter((b) => b.checkOut === todayStr);
  const departuresFromRes = reservations.filter((r) => r.check_out === todayStr);
  const departuresList: {
    id: string;
    ref: string;
    name: string;
    roomType: string;
    status: string;
  }[] = [];

  departuresFromBookings.forEach((b) => {
    departuresList.push({
      id: b.id,
      ref: b.bookingCode,
      name: b.guestName,
      roomType: b.categoryName || b.categorySlug,
      status: b.status,
    });
  });

  departuresFromRes.forEach((r) => {
    const ref = r.reference_code || `RES-${r.id.slice(0, 6)}`;
    if (departuresList.some((item) => item.ref === ref)) return;
    departuresList.push({
      id: r.id,
      ref,
      name: r.full_name,
      roomType: r.room_type,
      status: r.status,
    });
  });

  const todaysDepartures = departuresList;

  // Secondary counts
  const pendingReservations = reservations.filter((r) => r.status === "new" || r.status === "in_discussion");
  const pendingPayments = bookings.filter((b) => b.status === "pending");
  const newEnquiries = enquiries.filter((e) => e.status === "new");

  // Reservations requiring attention (new leads or unverified pending bookings)
  const attentionItems = [
    ...pendingReservations.slice(0, 4).map((r) => ({
      id: r.id,
      title: `${r.full_name} (${r.room_type})`,
      desc: `${r.check_in} to ${r.check_out} · ₹${r.estimated_total?.toLocaleString("en-IN") || 0}`,
      tag: "Pending Review",
      link: "/admin/reservations",
      time: r.created_at,
    })),
    ...newEnquiries.slice(0, 3).map((e) => ({
      id: e.id,
      title: `${e.name} (${e.type.replace(/_/g, " ")})`,
      desc: `Phone: ${e.phone} · Received today`,
      tag: "New Lead",
      link: "/admin/enquiries",
      time: e.createdAt,
    })),
  ];

  return (
    <AdminLayoutShell
      userEmail={user.email}
      title="Front Desk & Operations Overview"
      subtitle="Hotel Fremont · Sector 80, Airport Road, Mohali · 21 Verified Keys"
    >
      {/* Top 4 Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Rooms */}
        <div className="bg-[#1A191D] border border-[#373138] hover:border-[#C6A16A]/30 rounded-2xl p-5 shadow-sm transition">
          <div className="flex items-center justify-between text-xs font-medium text-[#B7A9A7]">
            <span>Available Rooms</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 flex items-center justify-center">
              <BedDouble className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-[#F5F2EF]">
              {availableCount}
            </span>
            <span className="text-xs font-sans text-[#8E8A85]">/ {totalKeys} Keys</span>
          </div>
          <div className="mt-2 text-[11px] font-medium text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Ready for walk-in or booking</span>
          </div>
        </div>

        {/* Occupied Rooms */}
        <div className="bg-[#1A191D] border border-[#373138] hover:border-[#742B40]/60 rounded-2xl p-5 shadow-sm transition">
          <div className="flex items-center justify-between text-xs font-medium text-[#B7A9A7]">
            <span>Occupied Tonight</span>
            <div className="w-8 h-8 rounded-xl bg-[#742B40]/25 text-[#ED252C] border border-[#742B40]/40 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-[#ED252C]">
              {occupiedCount}
            </span>
            <span className="text-xs font-sans text-[#8E8A85]">
              ({Math.round((occupiedCount / totalKeys) * 100)}% occupancy)
            </span>
          </div>
          <div className="mt-2 text-[11px] font-medium text-[#ED252C] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ED252C]" />
            <span>In-house staying guests</span>
          </div>
        </div>

        {/* Today's Arrivals */}
        <div className="bg-[#1A191D] border border-[#373138] hover:border-blue-500/40 rounded-2xl p-5 shadow-sm transition">
          <div className="flex items-center justify-between text-xs font-medium text-[#B7A9A7]">
            <span>Today&apos;s Arrivals</span>
            <div className="w-8 h-8 rounded-xl bg-blue-950/60 text-blue-400 border border-blue-800/40 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-[#F5F2EF]">
              {todaysArrivals.length}
            </span>
            <span className="text-xs font-sans text-[#8E8A85]">Expected</span>
          </div>
          <div className="mt-2 text-[11px] font-medium text-blue-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Standard check-in 1:00 PM</span>
          </div>
        </div>

        {/* Today's Departures */}
        <div className="bg-[#1A191D] border border-[#373138] hover:border-amber-500/40 rounded-2xl p-5 shadow-sm transition">
          <div className="flex items-center justify-between text-xs font-medium text-[#B7A9A7]">
            <span>Today&apos;s Departures</span>
            <div className="w-8 h-8 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-800/40 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-[#F5F2EF]">
              {todaysDepartures.length}
            </span>
            <span className="text-xs font-sans text-[#8E8A85]">Check-outs</span>
          </div>
          <div className="mt-2 text-[11px] font-medium text-amber-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Standard check-out 11:00 AM</span>
          </div>
        </div>
      </div>

      {/* Secondary Information Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/admin/reservations"
          className="bg-[#1A191D] border border-[#373138] hover:border-[#742B40]/60 rounded-xl px-4 py-3 flex items-center justify-between transition group shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#232126] border border-[#373138] flex items-center justify-center text-[#C6A16A] group-hover:text-white">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-[#B7A9A7] block">Pending Reservations</span>
              <span className="text-sm font-semibold text-[#F5F2EF]">
                {pendingReservations.length} to confirm
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#8E8A85] group-hover:text-[#C6A16A] transition" />
        </Link>

        <Link
          href="/admin/payments"
          className="bg-[#1A191D] border border-[#373138] hover:border-[#742B40]/60 rounded-xl px-4 py-3 flex items-center justify-between transition group shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#232126] border border-[#373138] flex items-center justify-center text-[#C6A16A] group-hover:text-white">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-[#B7A9A7] block">Pending Payments</span>
              <span className="text-sm font-semibold text-[#F5F2EF]">
                {pendingPayments.length} transactions
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#8E8A85] group-hover:text-[#C6A16A] transition" />
        </Link>

        <Link
          href="/admin/enquiries"
          className="bg-[#1A191D] border border-[#373138] hover:border-[#742B40]/60 rounded-xl px-4 py-3 flex items-center justify-between transition group shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#232126] border border-[#373138] flex items-center justify-center text-[#C6A16A] group-hover:text-white">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-[#B7A9A7] block">New Enquiries &amp; Leads</span>
              <span className="text-sm font-semibold text-[#F5F2EF]">
                {newEnquiries.length} uncontacted
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#8E8A85] group-hover:text-[#C6A16A] transition" />
        </Link>
      </div>

      {/* Main Grid: Arrivals / Departures & Attention List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Operational Board */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Today's Arrivals */}
          <div className="bg-[#1A191D] border border-[#373138] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#373138] pb-3">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-serif font-bold text-[#F5F2EF]">
                  Today&apos;s Expected Arrivals ({todaysArrivals.length})
                </h3>
              </div>
              <Link
                href="/admin/reservations"
                className="text-xs text-[#C6A16A] hover:text-[#DFC28A] font-medium"
              >
                View all reservations &rarr;
              </Link>
            </div>

            {todaysArrivals.length > 0 ? (
              <div className="divide-y divide-[#373138]">
                {todaysArrivals.map((arrival) => (
                  <div
                    key={arrival.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#F5F2EF]">{arrival.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#232126] text-[#B7A9A7] border border-[#373138]">
                          {arrival.ref}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#8E8A85] mt-0.5 flex items-center gap-2">
                        <span>{arrival.roomType}</span>
                        <span>&bull;</span>
                        <span>{arrival.guests} Guests</span>
                        <span>&bull;</span>
                        <span className="font-mono">{arrival.phone}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          arrival.isPaid
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50"
                            : "bg-amber-950/60 text-amber-400 border border-amber-800/50"
                        }`}
                      >
                        {arrival.isPaid ? "Paid Online" : "Payment Pending"}
                      </span>
                      <Link
                        href={`/admin/reservations?id=${arrival.id}`}
                        className="px-3 py-1 rounded-lg bg-[#742B40] hover:bg-[#8B344D] text-white border border-[#C6A16A]/20 text-[11px] font-medium transition cursor-pointer"
                      >
                        Check In
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#8E8A85]">
                No new guest arrivals scheduled for today.
              </div>
            )}
          </div>

          {/* Section 2: Today's Departures */}
          <div className="bg-[#1A191D] border border-[#373138] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#373138] pb-3">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-serif font-bold text-[#F5F2EF]">
                  Today&apos;s Departures &amp; Check-outs ({todaysDepartures.length})
                </h3>
              </div>
              <span className="text-[11px] text-[#8E8A85]">Standard: 11:00 AM</span>
            </div>

            {todaysDepartures.length > 0 ? (
              <div className="divide-y divide-[#373138]">
                {todaysDepartures.map((departure) => (
                  <div
                    key={departure.id}
                    className="py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-[#F5F2EF]">{departure.name}</span>
                      <div className="text-[11px] text-[#8E8A85] mt-0.5">
                        {departure.roomType} · Ref: {departure.ref}
                      </div>
                    </div>

                    <Link
                      href={`/admin/reservations?id=${departure.id}`}
                      className="px-3 py-1 rounded-lg bg-[#232126] hover:bg-[#2A2830] text-[#F5F2EF] text-[11px] font-medium border border-[#373138] transition"
                    >
                      Process Check-Out
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#8E8A85]">
                No guest departures scheduled for today.
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Attention Items & Quick Actions Hub */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-[#1A191D] border border-[#373138] rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-sans tracking-wider uppercase font-bold text-[#8E8A85]">
              Operational Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                href="/admin/reservations?action=new"
                className="p-3 rounded-xl bg-[#232126] hover:bg-[#742B40] text-[#F5F2EF] hover:text-white transition group border border-[#373138] hover:border-[#C6A16A]/30 flex flex-col justify-between space-y-2"
              >
                <Plus className="w-4 h-4 text-[#C6A16A] group-hover:text-white transition" />
                <span className="font-medium text-xs leading-tight">New Reservation</span>
              </Link>

              <Link
                href="/admin/calendar"
                className="p-3 rounded-xl bg-[#232126] hover:bg-[#742B40] text-[#F5F2EF] hover:text-white transition group border border-[#373138] hover:border-[#C6A16A]/30 flex flex-col justify-between space-y-2"
              >
                <Calendar className="w-4 h-4 text-[#C6A16A] group-hover:text-white transition" />
                <span className="font-medium text-xs leading-tight">Room Calendar</span>
              </Link>

              <Link
                href="/admin/enquiries"
                className="p-3 rounded-xl bg-[#232126] hover:bg-[#742B40] text-[#F5F2EF] hover:text-white transition group border border-[#373138] hover:border-[#C6A16A]/30 flex flex-col justify-between space-y-2"
              >
                <MessageSquare className="w-4 h-4 text-[#C6A16A] group-hover:text-white transition" />
                <span className="font-medium text-xs leading-tight">Add Enquiry</span>
              </Link>

              <Link
                href="/admin/images"
                className="p-3 rounded-xl bg-[#232126] hover:bg-[#742B40] text-[#F5F2EF] hover:text-white transition group border border-[#373138] hover:border-[#C6A16A]/30 flex flex-col justify-between space-y-2"
              >
                <ImageIcon className="w-4 h-4 text-[#C6A16A] group-hover:text-white transition" />
                <span className="font-medium text-xs leading-tight">Website Media</span>
              </Link>
            </div>
          </div>

          {/* Reservations Requiring Attention */}
          <div className="bg-[#1A191D] border border-[#373138] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#373138] pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#C6A16A]" />
                <h3 className="text-sm font-serif font-bold text-[#F5F2EF]">
                  Requires Attention
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#8E8A85]">
                {attentionItems.length} items
              </span>
            </div>

            {attentionItems.length > 0 ? (
              <div className="space-y-3">
                {attentionItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.link}
                    className="block p-3 rounded-xl bg-[#232126] hover:bg-[#2A2830] transition border border-[#373138] space-y-1 group"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#F5F2EF] group-hover:text-[#C6A16A] transition truncate max-w-[180px]">
                        {item.title}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/50">
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8E8A85] truncate">{item.desc}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[#8E8A85]">
                All reservations and leads are up to date.
              </div>
            )}
          </div>

          {/* Quick Property Info */}
          <div className="bg-[#141316] border border-[#373138] rounded-2xl p-4 text-xs text-[#8E8A85] space-y-2">
            <div className="flex items-center gap-2 text-[#F5F2EF] font-semibold">
              <Building className="w-4 h-4 text-[#C6A16A]" />
              <span>Hotel Fremont Property Details</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Khasra No 186, Sector 80, Village Mauli Baidwan, Airport Road, Mohali · Reception +91 79734 50281
            </p>
          </div>
        </div>
      </div>
    </AdminLayoutShell>
  );
}
