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
      <main className="min-h-screen bg-[#F8F6F2] text-[#24272B] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white border border-[#E5DFD7] rounded-2xl p-8 text-center shadow-lg">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 text-2xl font-bold">
            ✕
          </div>
          <h1 className="text-xl font-serif font-bold text-[#24272B] mb-2">Booking Not Found</h1>
          <p className="text-[#64615D] text-sm mb-6 font-normal">
            We could not locate this reservation or the access link is invalid. If you recently completed payment,
            please allow a moment for confirmation or contact our front desk directly.
          </p>
          <div className="bg-[#F8F6F2] border border-[#E5DFD7] rounded-xl p-4 mb-6 text-left text-xs space-y-1">
            <p className="text-[#24272B] font-semibold">{SITE_CONFIG.siteName}</p>
            <p className="text-[#64615D]">Phone: <a href={`tel:${SITE_CONFIG.phone}`} className="text-[#742B40] underline font-semibold">{SITE_CONFIG.phone}</a></p>
            <p className="text-[#64615D]">Email: <a href={`mailto:${SITE_CONFIG.email}`} className="text-[#742B40] underline font-semibold">{SITE_CONFIG.email}</a></p>
          </div>
          <Link
            href="/"
            className="inline-block w-full py-3 bg-[#742B40] hover:bg-[#5C2033] text-white font-semibold text-sm rounded-xl transition shadow-md"
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
    <main className="min-h-screen bg-[#F8F6F2] text-[#24272B] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block group">
            <span className="text-xs uppercase tracking-[0.3em] text-[#742B40] font-bold block mb-1">
              Airport Road · Mohali
            </span>
            <span className="text-2xl sm:text-3xl font-serif font-bold tracking-widest text-[#24272B] group-hover:text-[#742B40] transition">
              HOTEL FREMONT
            </span>
          </Link>
        </div>

        {/* Confirmation Card */}
        <div className="bg-white border border-[#E5DFD7] rounded-2xl overflow-hidden shadow-xl print:border-black print:bg-white print:text-black">
          {/* Status Header Banner */}
          <div
            className={`px-6 py-6 sm:px-8 border-b ${
              isPaid
                ? "bg-emerald-50 border-emerald-200"
                : isCancelled
                ? "bg-red-50 border-red-200"
                : isRefunded
                ? "bg-purple-50 border-purple-200"
                : "bg-amber-50 border-amber-200"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 ${
                    isPaid
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : isCancelled
                      ? "bg-red-100 text-red-800 border border-red-300"
                      : isRefunded
                      ? "bg-purple-100 text-purple-800 border border-purple-300"
                      : "bg-amber-100 text-amber-800 border border-amber-300"
                  }`}
                >
                  ● {isPaid ? "Confirmed & Paid in Full" : booking.status.toUpperCase()}
                </span>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#24272B] print:text-black">
                  Reservation Confirmation
                </h1>
                <p className="text-xs sm:text-sm text-[#64615D] print:text-gray-600 mt-1 font-normal">
                  Thank you, {booking.guest_name}. Your reservation is fully confirmed.
                </p>
              </div>

              <div className="bg-white border border-[#E5DFD7] rounded-xl p-3 text-right shadow-sm">
                <span className="text-[11px] uppercase tracking-wider text-[#64615D] block font-semibold">Booking Reference</span>
                <span className="text-xl font-mono font-bold text-[#742B40] tracking-wide block">
                  {booking.booking_ref}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* Stay Details Grid */}
            <div>
              <h2 className="text-xs uppercase tracking-widest text-[#742B40] font-bold mb-4">
                Stay Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#F8F6F2] border border-[#E5DFD7] rounded-xl p-4">
                  <span className="text-xs text-[#64615D] block mb-1">Room Category</span>
                  <p className="text-base font-semibold text-[#24272B]">{roomName}</p>
                  <p className="text-xs text-[#64615D] mt-1 font-normal">
                    {booking.rooms_requested || booking.rooms_count || 1} Room(s) · {mealPlanLabel}
                  </p>
                  <p className="text-xs text-[#742B40] font-semibold mt-0.5">{occupancyLabel}</p>
                </div>

                <div className="bg-[#F8F6F2] border border-[#E5DFD7] rounded-xl p-4">
                  <span className="text-xs text-[#64615D] block mb-1">Duration of Stay</span>
                  <p className="text-base font-semibold text-[#24272B]">
                    {booking.nights} Night{booking.nights > 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-[#64615D] mt-1 font-normal">
                    Check-in: {booking.check_in} (from {SITE_CONFIG.checkInTime})
                  </p>
                  <p className="text-xs text-[#64615D] font-normal">
                    Check-out: {booking.check_out} (until {SITE_CONFIG.checkOutTime})
                  </p>
                </div>
              </div>
            </div>

            {/* Guest Information */}
            <div>
              <h2 className="text-xs uppercase tracking-widest text-[#742B40] font-bold mb-4">
                Guest Information
              </h2>
              <div className="bg-[#F8F6F2] border border-[#E5DFD7] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-xs text-[#64615D] block">Primary Guest</span>
                  <span className="font-semibold text-[#24272B]">{booking.guest_name}</span>
                </div>
                <div>
                  <span className="text-xs text-[#64615D] block">Phone</span>
                  <span className="font-semibold text-[#24272B]">{booking.phone}</span>
                </div>
                <div>
                  <span className="text-xs text-[#64615D] block">Email</span>
                  <span className="font-semibold text-[#24272B] truncate block">{booking.email}</span>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div>
              <h2 className="text-xs uppercase tracking-widest text-[#742B40] font-bold mb-4">
                Payment Breakdown
              </h2>
              <div className="bg-[#F8F6F2] border border-[#E5DFD7] rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm text-[#64615D]">
                  <span>
                    Base Room Tariff ({booking.nights} night{booking.nights > 1 ? "s" : ""}
                    {(booking.rooms_requested || booking.rooms_count || 1) > 1 ? ` × ${booking.rooms_requested || booking.rooms_count} rooms` : ""})
                  </span>
                  <span className="text-[#24272B] font-semibold font-mono">
                    {formatINR(Number(booking.base_amount || (booking.total_amount * 100 / (100 + gstPercent))))}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-[#64615D]">
                  <span>Goods & Services Tax (GST {gstPercent}%)</span>
                  <span className="text-[#24272B] font-semibold font-mono">
                    {formatINR(Number(booking.gst_amount || (booking.total_amount - (booking.base_amount || (booking.total_amount * 100 / (100 + gstPercent))))))}
                  </span>
                </div>
                <div className="border-t border-[#E5DFD7] pt-3 flex justify-between items-baseline">
                  <div>
                    <span className="text-base font-serif font-bold text-[#24272B] block">Total Paid Online</span>
                    <span className="text-xs text-emerald-700 font-semibold">100% Full Payment Settled via Razorpay</span>
                  </div>
                  <span className="text-2xl font-bold text-[#742B40] font-mono">
                    {formatINR(Number(booking.amount_paid || booking.total_amount))}
                  </span>
                </div>
                {booking.razorpay_payment_id && (
                  <div className="pt-2 text-xs text-[#64615D] flex justify-between">
                    <span>Razorpay Payment ID:</span>
                    <span className="font-mono text-[#24272B] font-medium">{booking.razorpay_payment_id}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ID Requirement Note */}
            <div className="bg-[#F8F6F2] border border-[#E5DFD7] rounded-xl p-4 text-xs space-y-1">
              <p className="font-semibold text-[#742B40]">Guest ID Requirement & Front Desk</p>
              <p className="text-[#64615D] font-normal leading-relaxed">
                A valid government-issued photo ID is required at check-in for all staying guests. Front desk is operational 24x7.
              </p>
            </div>

            {/* Hotel Location & Contacts */}
            <div className="bg-[#F8F6F2] border border-[#E5DFD7] rounded-xl p-4 text-sm">
              <h2 className="text-xs uppercase tracking-widest text-[#742B40] font-bold mb-2">
                Property & Contact Information
              </h2>
              <p className="font-semibold text-[#24272B]">{SITE_CONFIG.siteName}</p>
              <p className="text-[#64615D] text-xs mt-1 font-normal">{SITE_CONFIG.address}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-xs">
                <span>Phone: <a href={`tel:${SITE_CONFIG.phone}`} className="text-[#742B40] font-semibold">{SITE_CONFIG.phone}</a></span>
                <span>WhatsApp: <a href={SITE_CONFIG.whatsappLink} target="_blank" className="text-emerald-700 font-semibold">Chat on WhatsApp</a></span>
                <span>Email: <a href={`mailto:${SITE_CONFIG.email}`} className="text-[#742B40] font-semibold">{SITE_CONFIG.email}</a></span>
              </div>
            </div>

            {/* Policy & Cancellation Box */}
            <div className="bg-red-50 border-l-4 border-[#742B40] p-4 rounded-r-xl text-xs space-y-2">
              <p className="font-semibold text-red-800 uppercase tracking-wider text-[11px]">
                Cancellation & Refund Terms (24-Hour Rule)
              </p>
              <p className="text-[#64615D] leading-relaxed font-normal">
                {PAYMENT_CONFIG.CANCELLATION_SUMMARY}
              </p>
              <div>
                <Link
                  href="/cancellation-refund-policy"
                  className="text-[#742B40] hover:underline font-semibold"
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
            className="text-sm text-[#64615D] hover:text-[#742B40] font-medium transition inline-flex items-center gap-1"
          >
            &larr; Return to Hotel Fremont Homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
