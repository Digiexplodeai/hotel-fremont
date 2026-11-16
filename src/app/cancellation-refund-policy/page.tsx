import type { Metadata } from "next";
import PolicyLayout from "@/components/PolicyLayout";
import { siteConfig } from "@/lib/site-config";
import { RotateCcw, Clock, AlertCircle, CreditCard, Mail, Phone, CalendarCheck } from "lucide-react";

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
      <div className="bg-[#151518] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#F7F3EC] m-0 border-none pb-1">
            Summary of Cancellation &amp; Refund Terms
          </h2>
          <p className="text-xs sm:text-sm text-[#A8A59E] m-0">
            Applicable to all direct website bookings and reservation deposits processed for Hotel Fremont.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-[#0E0E10] border border-white/5 rounded-xl p-4 space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A96E] block">
              Free Cancellation Window
            </span>
            <div className="text-sm font-semibold text-[#F7F3EC]">{cancellation.freeCancellationHours}</div>
            <p className="text-[11px] text-[#A8A59E]">Prior to scheduled standard check-in time ({checkInTime}).</p>
          </div>

          <div className="bg-[#0E0E10] border border-white/5 rounded-xl p-4 space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A96E] block">
              Late Cancellation Charge
            </span>
            <div className="text-sm font-semibold text-[#F7F3EC]">{cancellation.lateCancellationCharge}</div>
            <p className="text-[11px] text-[#A8A59E]">Applicable when cancelled less than {cancellation.freeCancellationHours} before check-in.</p>
          </div>

          <div className="bg-[#0E0E10] border border-white/5 rounded-xl p-4 space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A96E] block">
              No-Show Charge
            </span>
            <div className="text-sm font-semibold text-[#F7F3EC]">{cancellation.noShowCharge}</div>
            <p className="text-[11px] text-[#A8A59E]">When guest fails to arrive without prior notice.</p>
          </div>

          <div className="bg-[#0E0E10] border border-white/5 rounded-xl p-4 space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A96E] block">
              Refund Timeline
            </span>
            <div className="text-sm font-semibold text-[#F7F3EC]">{cancellation.refundDays}</div>
            <p className="text-[11px] text-[#A8A59E]">From date of verified cancellation approval.</p>
          </div>

          <div className="bg-[#0E0E10] border border-white/5 rounded-xl p-4 space-y-1.5 sm:col-span-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A96E] block">
              Refund Settlement Method
            </span>
            <div className="text-sm font-semibold text-[#F7F3EC]">{cancellation.refundMethod}</div>
            <p className="text-[11px] text-[#A8A59E]">Reversed back to original payment method via Razorpay.</p>
          </div>
        </div>
      </div>

      {/* 1. Cancellation Windows & Charges */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#F7F3EC] pb-2 border-b border-white/10 flex items-center gap-2.5">
          <Clock className="w-5 h-5 text-[#C9A96E]" />
          <span>1. Cancellation Windows &amp; Associated Charges</span>
        </h2>
        <p>
          Because Hotel Fremont operates an intimate boutique sanctuary of only 12 luxury keys, cancellations directly affect room availability. Our cancellation rules are applied as follows:
        </p>
        <ul className="space-y-3 list-disc pl-6 text-[#A8A59E]">
          <li>
            <strong className="text-[#F7F3EC]">Free Cancellation:</strong> Cancellations made at least {cancellation.freeCancellationHours} (48 hours or more) before the scheduled check-in time ({checkInTime} on the arrival date) are eligible for a <strong>full refund of the amount paid</strong> with zero penalty.
          </li>
          <li>
            <strong className="text-[#F7F3EC]">Late Cancellation:</strong> Cancellations made less than {cancellation.freeCancellationHours} before the scheduled check-in time will incur a retention fee of <strong>{cancellation.lateCancellationCharge}</strong>, and the balance (if any) will be refunded.
          </li>
          <li>
            <strong className="text-[#F7F3EC]">No-Show Policy:</strong> Guests who fail to arrive on the scheduled check-in date without prior documented written notice will be treated as a No-Show. In such cases, <strong>{cancellation.noShowCharge}</strong> is retained, and the remaining nights of the booking will be released for re-allocation.
          </li>
          <li>
            <strong className="text-[#F7F3EC]">Early Check-Out:</strong> In the event of an early check-out or departure after arrival, no refund will be provided for unused nights unless approved in advance by hotel management.
          </li>
        </ul>
      </section>

      {/* 2. Refund Method & Processing */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#F7F3EC] pb-2 border-b border-white/10 flex items-center gap-2.5">
          <CreditCard className="w-5 h-5 text-[#C9A96E]" />
          <span>2. Refund Mechanism &amp; Payment Gateway Reversals</span>
        </h2>
        <div className="bg-[#151518] border border-white/10 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-serif font-semibold text-[#F7F3EC]">
            <RotateCcw className="w-4 h-4 text-[#E02B1D]" />
            <span>Strict Reversal to Original Payment Method</span>
          </div>
          <p className="text-xs sm:text-sm text-[#A8A59E] leading-relaxed">
            In compliance with Reserve Bank of India (RBI) mandates and payment gateway partner standards:
          </p>
          <ul className="space-y-2 list-disc pl-6 text-xs sm:text-sm text-[#A8A59E]">
            <li>
              <strong>All eligible refunds for online bookings are credited strictly back to the original source payment method</strong> (credit card, debit card, net banking account, or UPI handle) utilized at the time of reservation.
            </li>
            <li>
              <strong>No Cash Refunds:</strong> Under no circumstances will refunds for digital online payments be remitted in cash or transferred to an alternate third-party account.
            </li>
            <li>
              <strong>Refund Timeline:</strong> Refunds are processed within <strong>{cancellation.refundDays}</strong> after the cancellation is verified by hotel management, credited directly to the {cancellation.refundMethod} via <strong>Razorpay</strong>, subject to your issuing bank&apos;s settlement schedule.
            </li>
          </ul>
        </div>
      </section>

      {/* 3. How to Request Cancellation */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#F7F3EC] pb-2 border-b border-white/10 flex items-center gap-2.5">
          <Mail className="w-5 h-5 text-[#C9A96E]" />
          <span>3. How to Submit a Cancellation Request</span>
        </h2>
        <p>To avoid dispute, cancellations must be formally submitted through one of our official communication channels:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#151518] border border-white/10 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-[#C9A96E] font-medium text-xs uppercase tracking-wider">
              <Mail className="w-4 h-4" />
              <span>Written Request via Email (Recommended)</span>
            </div>
            <p className="text-xs text-[#A8A59E] leading-relaxed">
              Send an email to <a href={`mailto:${siteConfig.email}`} className="text-[#F7F3EC] underline font-medium">{siteConfig.email}</a> stating your <strong>Booking Reference Code</strong> (e.g. <code>FRM-XXXXXX</code>), registered guest name, and arrival dates.
            </p>
          </div>

          <div className="bg-[#151518] border border-white/10 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-[#C9A96E] font-medium text-xs uppercase tracking-wider">
              <Phone className="w-4 h-4" />
              <span>Direct Concierge Assistance</span>
            </div>
            <p className="text-xs text-[#A8A59E] leading-relaxed">
              Call our front desk team directly at <a href={siteConfig.phoneTel} className="text-[#F7F3EC] underline font-medium">{siteConfig.phone}</a>. Our concierge will authenticate your reservation and guide you through the process.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Special Events & Peak Season Packages */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#F7F3EC] pb-2 border-b border-white/10 flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-[#C9A96E]" />
          <span>4. Peak Dates, Banquets &amp; Group Bookings</span>
        </h2>
        <p>
          Reservations booked under non-refundable promotional tariffs, wedding banquet venue agreements (Grand Fremont Ballroom or Fremont Lawn), or peak holiday periods (such as New Year Eve celebrations) may be subject to specialized contractual cancellation terms indicated on your booking agreement. In the event of a conflict, terms in your signed event contract supersede general website policies.
        </p>
      </section>
    </PolicyLayout>
  );
}
