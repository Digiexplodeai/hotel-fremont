import type { Metadata } from "next";
import PolicyLayout from "@/components/PolicyLayout";
import { siteConfig, formatPolicyValue, TO_BE_CONFIRMED_MARKER } from "@/lib/site-config";
import Link from "next/link";
import { RotateCcw, Clock, AlertCircle, CreditCard, Mail, Phone, CheckCircle2 } from "lucide-react";

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
  const { cancellation } = siteConfig;

  const freeHoursDisplay = formatPolicyValue(cancellation.freeCancellationHours, " hours");
  const lateChargeDisplay = formatPolicyValue(cancellation.lateCancellationCharge);
  const noShowDisplay = formatPolicyValue(cancellation.noShowCharge);
  const refundDaysDisplay = formatPolicyValue(cancellation.refundDays, " business days");
  const refundMethodDisplay = cancellation.refundMethod;

  const renderValueOrBadge = (val: string) => {
    if (val === TO_BE_CONFIRMED_MARKER) {
      return (
        <span className="inline-block px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-semibold">
          {TO_BE_CONFIRMED_MARKER}
        </span>
      );
    }
    return <span className="font-semibold text-[#F7F3EC]">{val}</span>;
  };

  return (
    <PolicyLayout
      title="Cancellation & Refund Policy"
      subtitle="Clear, fair, and transparent cancellation guidelines and electronic refund procedures for all direct hotel bookings."
    >
      {/* Policy Summary Matrix */}
      <div className="bg-[#151518] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#F7F3EC] m-0 border-none pb-1">
            Summary of Cancellation & Refund Terms
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
            <div className="text-sm">{renderValueOrBadge(freeHoursDisplay)}</div>
            <p className="text-[11px] text-[#A8A59E]">Prior to scheduled standard check-in time.</p>
          </div>

          <div className="bg-[#0E0E10] border border-white/5 rounded-xl p-4 space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A96E] block">
              Late Cancellation Charge
            </span>
            <div className="text-sm">{renderValueOrBadge(lateChargeDisplay)}</div>
            <p className="text-[11px] text-[#A8A59E]">Applicable when cancelled past the free window.</p>
          </div>

          <div className="bg-[#0E0E10] border border-white/5 rounded-xl p-4 space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A96E] block">
              No-Show Charge
            </span>
            <div className="text-sm">{renderValueOrBadge(noShowDisplay)}</div>
            <p className="text-[11px] text-[#A8A59E]">When guest fails to arrive without notice.</p>
          </div>

          <div className="bg-[#0E0E10] border border-white/5 rounded-xl p-4 space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A96E] block">
              Refund Timeline
            </span>
            <div className="text-sm">{renderValueOrBadge(refundDaysDisplay)}</div>
            <p className="text-[11px] text-[#A8A59E]">From date of verified cancellation approval.</p>
          </div>

          <div className="bg-[#0E0E10] border border-white/5 rounded-xl p-4 space-y-1.5 sm:col-span-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A96E] block">
              Refund Settlement Method
            </span>
            <div className="text-sm font-semibold text-[#F7F3EC]">{refundMethodDisplay}</div>
            <p className="text-[11px] text-[#A8A59E]">Reversed back to original payment method via Razorpay.</p>
          </div>
        </div>
      </div>

      {/* 1. Cancellation Windows & Charges */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#F7F3EC] pb-2 border-b border-white/10 flex items-center gap-2.5">
          <Clock className="w-5 h-5 text-[#C9A96E]" />
          <span>1. Cancellation Windows & Associated Charges</span>
        </h2>
        <p>
          Because Hotel Fremont maintains an exclusive sanctuary of only 12 luxury keys, late cancellations significantly impact our availability. Our cancellation rules are applied as follows:
        </p>
        <ul className="space-y-3 list-disc pl-6 text-[#A8A59E]">
          <li>
            <strong className="text-[#F7F3EC]">Free Cancellation:</strong> You may cancel your reservation with zero penalty if notice is received at least{" "}
            {freeHoursDisplay === TO_BE_CONFIRMED_MARKER ? (
              <span className="font-mono text-xs text-amber-300 font-semibold">[TO BE CONFIRMED]</span>
            ) : (
              freeHoursDisplay
            )}{" "}
            prior to scheduled check-in date and time.
          </li>
          <li>
            <strong className="text-[#F7F3EC]">Late Cancellation:</strong> Cancellations submitted within less than the free cancellation window will be subject to a cancellation fee of{" "}
            {lateChargeDisplay === TO_BE_CONFIRMED_MARKER ? (
              <span className="font-mono text-xs text-amber-300 font-semibold">[TO BE CONFIRMED]</span>
            ) : (
              lateChargeDisplay
            )}.
          </li>
          <li>
            <strong className="text-[#F7F3EC]">No-Show Policy:</strong> Guests who do not arrive on the scheduled check-in date without prior documented written notice will be treated as a No-Show. The room reservation will be released for re-allocation and a fee of{" "}
            {noShowDisplay === TO_BE_CONFIRMED_MARKER ? (
              <span className="font-mono text-xs text-amber-300 font-semibold">[TO BE CONFIRMED]</span>
            ) : (
              noShowDisplay
            )}{" "}
            will be retained.
          </li>
        </ul>
      </section>

      {/* 2. Refund Method & Processing */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#F7F3EC] pb-2 border-b border-white/10 flex items-center gap-2.5">
          <CreditCard className="w-5 h-5 text-[#C9A96E]" />
          <span>2. Refund Mechanism & Payment Gateway Reversals</span>
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
              <strong>No Cash Refunds:</strong> Under no circumstances will refunds for digital online payments be remitted in cash or transferred to an alternate account.
            </li>
            <li>
              <strong>Refund Timeline:</strong> Once cancellation is verified by hotel management, the refund instruction is triggered through <strong>Razorpay</strong>. The amount typically reflects in the customer&apos;s account within{" "}
              {refundDaysDisplay === TO_BE_CONFIRMED_MARKER ? (
                <span className="font-mono text-xs text-amber-300 font-semibold">[TO BE CONFIRMED]</span>
              ) : (
                refundDaysDisplay
              )}
              , depending on your issuing bank&apos;s settlement schedule.
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
              Send an email to <a href={`mailto:${siteConfig.email}`} className="text-[#F7F3EC] underline font-medium">{siteConfig.email}</a> stating your <strong>Booking Reference Code</strong>, registered guest name, and arrival dates.
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
          <span>4. Peak Dates, Banquets & Group Bookings</span>
        </h2>
        <p>
          Reservations booked under non-refundable promotional tariffs, wedding banquet venue agreements (Grand Fremont Ballroom or Fremont Lawn), or peak holiday periods (such as New Year Eve celebrations) may be subject to specialized contractual cancellation terms indicated on your booking agreement. In the event of a conflict, terms in your signed event contract supersede general website policies.
        </p>
      </section>
    </PolicyLayout>
  );
}
