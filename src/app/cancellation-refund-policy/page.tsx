import type { Metadata } from "next";
import PolicyLayout from "@/components/PolicyLayout";
import { siteConfig } from "@/lib/site-config";
import { RotateCcw, Clock, AlertCircle, CreditCard, Mail, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy | Hotel Fremont",
  description:
    "Official Cancellation and Refund Policy of Hotel Fremont, Mohali. Clear details on cancellation windows, charges, refund timelines, and Razorpay reversals.",
  alternates: {
    canonical: `${siteConfig.siteUrl}/cancellation-refund-policy`,
  },
  openGraph: {
    title: "Cancellation & Refund Policy | Hotel Fremont",
    description:
      "Official Cancellation and Refund terms for room reservations and bookings at Hotel Fremont, Mohali.",
    url: `${siteConfig.siteUrl}/cancellation-refund-policy`,
    siteName: siteConfig.siteName,
  },
};

export default function CancellationRefundPolicyPage() {
  const { cancellation, checkInTime } = siteConfig;

  return (
    <PolicyLayout
      title="Cancellation & Refund Policy"
      subtitle="Clear, fair, and transparent cancellation guidelines and electronic refund procedures for all direct hotel bookings."
    >
      {/* Policy Summary Matrix */}
      <div className="bg-white border border-[#E5DFD7] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#24272B] m-0 border-none pb-1">
            Summary of Cancellation &amp; Refund Terms
          </h2>
          <p className="text-xs sm:text-sm text-[#64615D] m-0 font-normal">
            Applicable to all direct website bookings and reservation deposits processed for Hotel Fremont.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-[#F8F6F2] border border-[#E5DFD7] rounded-xl p-4 space-y-1.5">
            <span className="text-[10px] font-sans uppercase tracking-wider text-[#742B40] font-bold block">
              Free Cancellation Window
            </span>
            <div className="text-sm font-semibold text-[#24272B]">{cancellation.freeCancellationHours}</div>
            <p className="text-[11px] text-[#64615D]">Prior to scheduled standard check-in time ({checkInTime}).</p>
          </div>

          <div className="bg-[#F8F6F2] border border-[#E5DFD7] rounded-xl p-4 space-y-1.5">
            <span className="text-[10px] font-sans uppercase tracking-wider text-[#742B40] font-bold block">
              Late Cancellation Charge
            </span>
            <div className="text-sm font-semibold text-[#24272B]">{cancellation.lateCancellationCharge}</div>
            <p className="text-[11px] text-[#64615D]">Applicable when cancelled less than {cancellation.freeCancellationHours} before check-in.</p>
          </div>

          <div className="bg-[#F8F6F2] border border-[#E5DFD7] rounded-xl p-4 space-y-1.5">
            <span className="text-[10px] font-sans uppercase tracking-wider text-[#742B40] font-bold block">
              No-Show Charge
            </span>
            <div className="text-sm font-semibold text-[#24272B]">{cancellation.noShowCharge}</div>
            <p className="text-[11px] text-[#64615D]">When guest fails to arrive without prior notice.</p>
          </div>

          <div className="bg-[#F8F6F2] border border-[#E5DFD7] rounded-xl p-4 space-y-1.5">
            <span className="text-[10px] font-sans uppercase tracking-wider text-[#742B40] font-bold block">
              Refund Timeline
            </span>
            <div className="text-sm font-semibold text-[#24272B]">{cancellation.refundDays}</div>
            <p className="text-[11px] text-[#64615D]">From date of verified cancellation approval.</p>
          </div>

          <div className="bg-[#F8F6F2] border border-[#E5DFD7] rounded-xl p-4 space-y-1.5 sm:col-span-2">
            <span className="text-[10px] font-sans uppercase tracking-wider text-[#742B40] font-bold block">
              Refund Settlement Method
            </span>
            <div className="text-sm font-semibold text-[#24272B]">{cancellation.refundMethod}</div>
            <p className="text-[11px] text-[#64615D]">Reversed back to original payment method via Razorpay.</p>
          </div>
        </div>
      </div>

      {/* 1. Cancellation Windows & Charges */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#24272B] pb-2 border-b border-[#E5DFD7] flex items-center gap-2.5">
          <Clock className="w-5 h-5 text-[#742B40]" />
          <span>1. Cancellation Windows &amp; Associated Charges</span>
        </h2>
        <p className="text-[#64615D]">
          At Hotel Fremont, we maintain a clear and transparent cancellation policy. Our cancellation rules are applied as follows:
        </p>
        <ul className="space-y-3 list-disc pl-6 text-[#64615D]">
          <li>
            <strong className="text-[#24272B]">Free Cancellation:</strong> Cancellations made at least {cancellation.freeCancellationHours} (24 hours or more) before the scheduled check-in time ({checkInTime} on the arrival date) are eligible for a <strong>full refund of the amount paid</strong> with zero penalty.
          </li>
          <li>
            <strong className="text-[#24272B]">Late Cancellation:</strong> Cancellations made less than {cancellation.freeCancellationHours} before the scheduled check-in time are <strong>non-refundable</strong>.
          </li>
          <li>
            <strong className="text-[#24272B]">No-Show Policy:</strong> Guests who fail to arrive on the scheduled check-in date without prior documented written notice are <strong>non-refundable</strong>, and the remaining nights of the booking will be released for re-allocation.
          </li>
          <li>
            <strong className="text-[#24272B]">Early Check-Out:</strong> In the event of an early check-out or departure after arrival, no refund will be provided for unused nights unless approved in advance by hotel management.
          </li>
        </ul>
      </section>

      {/* 2. Refund Method & Processing */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#24272B] pb-2 border-b border-[#E5DFD7] flex items-center gap-2.5">
          <CreditCard className="w-5 h-5 text-[#742B40]" />
          <span>2. Refund Mechanism &amp; Payment Gateway Reversals</span>
        </h2>
        <div className="bg-[#F8F6F2] border border-[#E5DFD7] rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-serif font-semibold text-[#24272B]">
            <RotateCcw className="w-4 h-4 text-[#742B40]" />
            <span>Strict Reversal to Original Payment Method</span>
          </div>
          <p className="text-xs sm:text-sm text-[#64615D] leading-relaxed">
            In compliance with Reserve Bank of India (RBI) mandates and payment gateway partner standards:
          </p>
          <ul className="space-y-2 list-disc pl-6 text-xs sm:text-sm text-[#64615D]">
            <li>
              <strong className="text-[#24272B]">All eligible refunds for online bookings are credited strictly back to the original source payment method</strong> (credit card, debit card, net banking account, or UPI handle) utilized at the time of reservation.
            </li>
            <li>
              <strong className="text-[#24272B]">No Cash Refunds:</strong> Under no circumstances will refunds for digital online payments be remitted in cash or transferred to an alternate third-party account.
            </li>
            <li>
              <strong className="text-[#24272B]">Refund Timeline:</strong> Refunds are processed within <strong>{cancellation.refundDays}</strong> after the cancellation is verified by hotel management, credited directly to the {cancellation.refundMethod} via <strong>Razorpay</strong>, subject to your issuing bank&apos;s settlement schedule.
            </li>
          </ul>
        </div>
      </section>

      {/* 3. How to Request Cancellation */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#24272B] pb-2 border-b border-[#E5DFD7] flex items-center gap-2.5">
          <Mail className="w-5 h-5 text-[#742B40]" />
          <span>3. How to Submit a Cancellation Request</span>
        </h2>
        <p className="text-[#64615D]">To avoid dispute, cancellations must be formally submitted through one of our official communication channels:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-[#E5DFD7] rounded-xl p-5 space-y-2 shadow-sm">
            <div className="flex items-center gap-2 text-[#742B40] font-semibold text-xs uppercase tracking-wider">
              <Mail className="w-4 h-4" />
              <span>Written Request via Email (Recommended)</span>
            </div>
            <p className="text-xs text-[#64615D] leading-relaxed">
              Send an email to <a href={`mailto:${siteConfig.email}`} className="text-[#742B40] underline font-semibold">{siteConfig.email}</a> stating your <strong>Booking Reference Code</strong> (e.g. <code>FRM-XXXXXX</code>), registered guest name, and arrival dates.
            </p>
          </div>

          <div className="bg-white border border-[#E5DFD7] rounded-xl p-5 space-y-2 shadow-sm">
            <div className="flex items-center gap-2 text-[#742B40] font-semibold text-xs uppercase tracking-wider">
              <Phone className="w-4 h-4" />
              <span>Direct Front Desk Assistance</span>
            </div>
            <p className="text-xs text-[#64615D] leading-relaxed">
              Call our front desk team directly at <a href={siteConfig.phoneTel} className="text-[#742B40] underline font-semibold">{siteConfig.phone}</a>. Our team will authenticate your reservation and guide you through the process.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Special Events & Peak Season Packages */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#24272B] pb-2 border-b border-[#E5DFD7] flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-[#742B40]" />
          <span>4. Peak Dates, Banquets &amp; Group Bookings</span>
        </h2>
        <p className="text-[#64615D]">
          Reservations booked under non-refundable promotional tariffs, banquet venue agreements (Cloud Six Banquet or Conference Hall), or peak periods may be subject to specialized contractual cancellation terms indicated on your booking agreement. In the event of a conflict, terms in your signed event contract supersede general website policies.
        </p>
      </section>
    </PolicyLayout>
  );
}
