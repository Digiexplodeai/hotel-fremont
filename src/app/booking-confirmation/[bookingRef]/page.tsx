import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { DEFAULT_ROOM_TYPES, formatINR } from "@/config/hotel";
import { SITE_CONFIG } from "@/lib/site-config";
import { PAYMENT_CONFIG } from "@/lib/payment-config";
import ConfirmationActions from "./ConfirmationActions";

export const metadata: Metadata = {
  title: "Booking Confirmation | Hotel Fremont",
  description: "Official confirmed booking receipt and stay pass for Hotel Fremont, Mohali.",
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  params: Promise<{ bookingRef: string }>;
  searchParams: Promise<{ t?: string }>;
}

export default async function BookingConfirmationPage({ params, searchParams }: PageProps) {
  const { bookingRef } = await params;
  const { t: accessToken } = await searchParams;

  if (!bookingRef) {
    notFound();
  }

  const supabase = createAdminSupabaseClient();
  let booking: any = null;

  if (supabase) {
    let query = supabase.from("bookings").select("*").eq("booking_ref", bookingRef);
    if (accessToken) {
      query = query.eq("access_token", accessToken);
    }
    const { data } = await query.maybeSingle();
    booking = data;
  }

  if (!booking) {
    return (
      <main className="min-h-screen bg-[#0a0a0b] text-[#eaeaea] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-[#121214] border border-white/10 rounded-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-400 text-2xl">
            ✕
          </div>
          <h1 className="text-xl font-serif font-bold text-white mb-2">Booking Not Found</h1>
          <p className="text-white/60 text-sm mb-6">
            We could not locate this reservation or the access link is invalid. If you recently completed payment,
            please allow a moment for confirmation or contact our front desk directly.
          </p>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6 text-left text-xs space-y-1">
            <p className="text-white/80 font-semibold">{SITE_CONFIG.siteName}</p>
            <p className="text-white/60">Phone: <a href={`tel:${SITE_CONFIG.phone}`} className="text-[#E02B1D] underline">{SITE_CONFIG.phone}</a></p>
            <p className="text-white/60">Email: <a href={`mailto:${SITE_CONFIG.email}`} className="text-[#E02B1D] underline">{SITE_CONFIG.email}</a></p>
          </div>
          <Link
            href="/"
            className="inline-block w-full py-3 bg-[#E02B1D] hover:bg-[#c82417] text-white font-medium text-sm rounded-lg transition"
          >
            Return to Homepage
          </Link>
        </div>
      </main>
    );
  }

  const room = DEFAULT_ROOM_TYPES.find(
    (r) =>
      r.code.toLowerCase() === (booking.room_category || "").toLowerCase() ||
      r.name.toLowerCase() === (booking.room_category || "").toLowerCase()
  );
  const roomName = room?.name || booking.room_category;

  const isPaid = booking.status === "paid";
  const isCancelled = booking.status === "cancelled";
  const isRefunded = booking.status === "refunded";

  const gstPercent =
    booking.gst_percent ||
    (booking.rate_per_night && booking.rate_per_night > 7500 ? 18 : 5);

  const mealPlanLabel =
    booking.meal_plan === "with_breakfast" || booking.meal_plan === "cp"
      ? "With Breakfast (Buffet Included)"
      : "Without Breakfast (Room Only)";

  const occupancyLabel =
    booking.occupancy === "single" ? "Single Occupancy (1 Guest)" : "Double Occupancy (2 Guests)";

  return (
    <main className="min-h-screen bg-[#0a0a0b] text-[#eaeaea] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block group">
            <span className="text-xs uppercase tracking-[0.3em] text-[#c5a880] block mb-1">
              Airport Road · Mohali
            </span>
            <span className="text-2xl sm:text-3xl font-serif font-bold tracking-widest text-white group-hover:text-[#E02B1D] transition">
              HOTEL FREMONT
            </span>
          </Link>
        </div>

        {/* Confirmation Card */}
        <div className="bg-[#121214] border border-white/10 rounded-2xl overflow-hidden shadow-2xl print:border-black print:bg-white print:text-black">
          {/* Status Header Banner */}
          <div
            className={`px-6 py-6 sm:px-8 border-b ${
              isPaid
                ? "bg-gradient-to-r from-emerald-950/60 to-emerald-900/40 border-emerald-500/20"
                : isCancelled
                ? "bg-gradient-to-r from-red-950/60 to-red-900/40 border-red-500/20"
                : isRefunded
                ? "bg-gradient-to-r from-purple-950/60 to-purple-900/40 border-purple-500/20"
                : "bg-gradient-to-r from-amber-950/60 to-amber-900/40 border-amber-500/20"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 ${
                    isPaid
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : isCancelled
                      ? "bg-red-500/20 text-red-300 border border-red-500/30"
                      : isRefunded
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  ● {isPaid ? "Confirmed & Paid in Full" : booking.status.toUpperCase()}
                </span>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white print:text-black">
                  Reservation Confirmation
                </h1>
                <p className="text-xs sm:text-sm text-white/60 print:text-gray-600 mt-1">
                  Thank you, {booking.guest_name}. Your reservation is fully confirmed.
                </p>
              </div>

              <div className="bg-black/30 border border-white/10 rounded-lg p-3 text-right">
                <span className="text-[11px] uppercase tracking-wider text-white/50 block">Booking Reference</span>
                <span className="text-xl font-mono font-bold text-[#E02B1D] tracking-wide block">
                  {booking.booking_ref}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* Stay Details Grid */}
            <div>
              <h2 className="text-xs uppercase tracking-widest text-[#c5a880] font-semibold mb-4">
                Stay Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                  <span className="text-xs text-white/50 block mb-1">Room Category</span>
                  <p className="text-base font-semibold text-white">{roomName}</p>
                  <p className="text-xs text-white/60 mt-1">
                    {booking.rooms_requested || booking.rooms_count || 1} Room(s) · {mealPlanLabel}
                  </p>
                  <p className="text-xs text-[#C9A96E] mt-0.5">{occupancyLabel}</p>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                  <span className="text-xs text-white/50 block mb-1">Duration of Stay</span>
                  <p className="text-base font-semibold text-white">
                    {booking.nights} Night{booking.nights > 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-white/60 mt-1">
                    Check-in: {booking.check_in} (from {SITE_CONFIG.checkInTime})
                  </p>
                  <p className="text-xs text-white/60">
                    Check-out: {booking.check_out} (until {SITE_CONFIG.checkOutTime})
                  </p>
                </div>
              </div>
            </div>

            {/* Guest Information */}
            <div>
              <h2 className="text-xs uppercase tracking-widest text-[#c5a880] font-semibold mb-4">
                Guest Information
              </h2>
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-xs text-white/50 block">Primary Guest</span>
                  <span className="font-medium text-white">{booking.guest_name}</span>
                </div>
                <div>
                  <span className="text-xs text-white/50 block">Phone</span>
                  <span className="font-medium text-white">{booking.phone}</span>
                </div>
                <div>
                  <span className="text-xs text-white/50 block">Email</span>
                  <span className="font-medium text-white truncate block">{booking.email}</span>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div>
              <h2 className="text-xs uppercase tracking-widest text-[#c5a880] font-semibold mb-4">
                Payment Breakdown
              </h2>
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm text-white/70">
                  <span>
                    Base Room Tariff ({booking.nights} night{booking.nights > 1 ? "s" : ""}
                    {(booking.rooms_requested || booking.rooms_count || 1) > 1 ? ` × ${booking.rooms_requested || booking.rooms_count} rooms` : ""})
                  </span>
                  <span className="text-white font-medium">
                    {formatINR(Number(booking.base_amount || (booking.total_amount * 100 / (100 + gstPercent))))}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-white/70">
                  <span>Goods & Services Tax (GST {gstPercent}%)</span>
                  <span className="text-white font-medium">
                    {formatINR(Number(booking.gst_amount || (booking.total_amount - (booking.base_amount || (booking.total_amount * 100 / (100 + gstPercent))))))}
                  </span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between items-baseline">
                  <div>
                    <span className="text-base font-semibold text-white block">Total Paid Online</span>
                    <span className="text-xs text-emerald-400">100% Full Payment Settled via Razorpay</span>
                  </div>
                  <span className="text-2xl font-bold text-white font-mono">
                    {formatINR(Number(booking.amount_paid || booking.total_amount))}
                  </span>
                </div>
                {booking.razorpay_payment_id && (
                  <div className="pt-2 text-xs text-white/40 flex justify-between">
                    <span>Razorpay Payment ID:</span>
                    <span className="font-mono text-white/60">{booking.razorpay_payment_id}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ID Requirement Note */}
            <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-xs space-y-1">
              <p className="font-semibold text-[#C9A96E]">Guest ID Requirement & Front Desk</p>
              <p className="text-white/70">
                A valid government-issued photo ID is required at check-in for all staying guests. Front desk is operational 24x7.
              </p>
            </div>

            {/* Hotel Location & Contacts */}
            <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-sm">
              <h2 className="text-xs uppercase tracking-widest text-[#c5a880] font-semibold mb-2">
                Property & Contact Information
              </h2>
              <p className="font-semibold text-white">{SITE_CONFIG.siteName}</p>
              <p className="text-white/60 text-xs mt-1">{SITE_CONFIG.address}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-xs">
                <span>Phone: <a href={`tel:${SITE_CONFIG.phone}`} className="text-[#E02B1D] font-medium">{SITE_CONFIG.phone}</a></span>
                <span>WhatsApp: <a href={SITE_CONFIG.whatsappLink} target="_blank" className="text-emerald-400 font-medium">Chat on WhatsApp</a></span>
                <span>Email: <a href={`mailto:${SITE_CONFIG.email}`} className="text-[#E02B1D] font-medium">{SITE_CONFIG.email}</a></span>
              </div>
            </div>

            {/* Policy & Cancellation Box */}
            <div className="bg-red-950/20 border-l-4 border-[#E02B1D] p-4 rounded-r-xl text-xs space-y-2">
              <p className="font-semibold text-red-300 uppercase tracking-wider text-[11px]">
                Cancellation & Refund Terms (24-Hour Rule)
              </p>
              <p className="text-white/75 leading-relaxed">
                {PAYMENT_CONFIG.CANCELLATION_SUMMARY}
              </p>
              <div>
                <Link
                  href="/cancellation-refund-policy"
                  className="text-red-400 hover:text-red-300 underline font-medium"
                >
                  View complete cancellation and refund policy &rarr;
                </Link>
              </div>
            </div>

            {/* Client Interactive Action Buttons (Print & WhatsApp) */}
            <ConfirmationActions
              bookingRef={booking.booking_ref}
              guestName={booking.guest_name}
              roomName={roomName}
              checkIn={booking.check_in}
              checkOut={booking.check_out}
              totalAmount={Number(booking.total_amount)}
            />
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-8 print:hidden">
          <Link
            href="/"
            className="text-sm text-white/50 hover:text-white transition inline-flex items-center gap-1"
          >
            &larr; Return to Hotel Fremont Homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
