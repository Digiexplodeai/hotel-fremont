import type { Metadata } from "next";
import PolicyLayout from "@/components/PolicyLayout";
import { siteConfig } from "@/lib/site-config";
import Link from "next/link";
import { Scale, Clock, ShieldAlert, CreditCard, Building, AlertTriangle, FileCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms and Conditions | Hotel Fremont",
  description:
    "Terms and Conditions governing room reservations, guest stays, check-in requirements, and hotel policies at Hotel Fremont, Mohali.",
  alternates: {
    canonical: `${siteConfig.siteUrl}/terms-and-conditions`,
  },
  openGraph: {
    title: "Terms and Conditions | Hotel Fremont",
    description:
      "Official Terms and Conditions for reservations and guest accommodation at Hotel Fremont, Mohali.",
    url: `${siteConfig.siteUrl}/terms-and-conditions`,
    siteName: siteConfig.siteName,
  },
};

export default function TermsAndConditionsPage() {
  return (
    <PolicyLayout
      title="Terms and Conditions"
      subtitle="Please review these terms and conditions carefully before reserving accommodation or utilizing our hospitality services."
    >
      {/* Intro Box */}
      <div className="bg-[#151518] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
        <h2 className="text-xl font-serif font-bold text-[#F7F3EC] m-0 border-none pb-0">
          Agreement to Terms
        </h2>
        <p className="text-[#A8A59E] leading-relaxed text-sm sm:text-base m-0">
          These Terms and Conditions constitute a legally binding agreement between you (the &quot;Guest&quot; or &quot;Customer&quot;) and <strong>{siteConfig.siteName}</strong> (Proprietor: <strong>{siteConfig.proprietorName}</strong>, situated at <em>{siteConfig.address}</em>). By initiating a reservation request, completing an advance deposit or full payment, or taking occupancy of a room or suite, you acknowledge that you have read, understood, and agreed to be bound by these terms.
        </p>
      </div>

      {/* 1. Booking & Confirmation */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#F7F3EC] pb-2 border-b border-white/10 flex items-center gap-2.5">
          <FileCheck className="w-5 h-5 text-[#C9A96E]" />
          <span>1. Booking, Confirmation &amp; Cancellation Rules</span>
        </h2>
        <ul className="space-y-2 list-disc pl-6 text-[#A8A59E]">
          <li>
            <strong className="text-[#F7F3EC]">Inventory Allocation:</strong> Hotel Fremont operates an intimate boutique inventory of exactly 12 luxury rooms and suites. All reservations are subject to real-time room availability.
          </li>
          <li>
            <strong className="text-[#F7F3EC]">Binding Confirmation:</strong> A reservation is considered confirmed only after the required advance payment or authorization has been successfully validated and an official booking confirmation voucher containing a unique reference code (e.g. <code>FRM-XXXXXX</code>) is issued via email or WhatsApp.
          </li>
          <li>
            <strong className="text-[#F7F3EC]">Cancellation &amp; Refund Rules:</strong> All cancellations, no-shows, and refunds are governed strictly by our <Link href="/cancellation-refund-policy" className="text-[#C9A96E] underline hover:text-white transition-colors">Cancellation &amp; Refund Policy</Link>. Notice provided at least {siteConfig.cancellation.freeCancellationHours} before check-in qualifies for a full refund. Cancellations made less than {siteConfig.cancellation.freeCancellationHours} prior to check-in retain {siteConfig.cancellation.lateCancellationCharge}. No-shows retain {siteConfig.cancellation.noShowCharge}, and early departures are non-refundable for unused nights unless approved by management.
          </li>
          <li>
            <strong className="text-[#F7F3EC]">Guest Occupancy Limits:</strong> Each suite category maintains strict maximum guest occupancy limits to guarantee fire safety and refined comfort. Exceeding designated room capacity without prior written concierge approval is strictly prohibited.
          </li>
        </ul>
      </section>

      {/* 2. Rates, Currency & Taxes */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#F7F3EC] pb-2 border-b border-white/10 flex items-center gap-2.5">
          <CreditCard className="w-5 h-5 text-[#C9A96E]" />
          <span>2. Tariff, Currency &amp; Goods and Services Tax (GST)</span>
        </h2>
        <ul className="space-y-2 list-disc pl-6 text-[#A8A59E]">
          <li>
            All room tariffs, dining menus, and event venue packages are published and billed in <strong>Indian Rupees (INR ₹)</strong>.
          </li>
          <li>
            Applicable Goods and Services Tax (GST) and statutory state/central government hospitality levies will be added to the room tariff in accordance with prevailing Indian tax laws.
          </li>
          <li>
            Online payments are processed securely via our authorized payment partner, <strong>Razorpay</strong>. Guests will receive a digitally generated tax invoice upon departure.
          </li>
        </ul>
      </section>

      {/* 3. Check-In & Check-Out Times */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#F7F3EC] pb-2 border-b border-white/10 flex items-center gap-2.5">
          <Clock className="w-5 h-5 text-[#C9A96E]" />
          <span>3. Check-In &amp; Check-Out Schedule</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#151518] border border-white/10 rounded-xl p-5 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A96E] block">
              Standard Check-In
            </span>
            <div className="text-lg font-serif font-bold text-[#F7F3EC]">
              {siteConfig.checkInTime}
            </div>
            <p className="text-xs text-[#A8A59E]">
              Early arrival is subject to availability upon request. Guaranteed early check-in before standard hours may incur a supplemental day tariff.
            </p>
          </div>

          <div className="bg-[#151518] border border-white/10 rounded-xl p-5 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A96E] block">
              Standard Check-Out
            </span>
            <div className="text-lg font-serif font-bold text-[#F7F3EC]">
              {siteConfig.checkOutTime}
            </div>
            <p className="text-xs text-[#A8A59E]">
              Late check-out requires prior management clearance. Unauthorized late departures will incur additional half-day or full-day charges.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Mandatory Identification Requirements */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#F7F3EC] pb-2 border-b border-white/10 flex items-center gap-2.5">
          <ShieldAlert className="w-5 h-5 text-[#C9A96E]" />
          <span>4. Mandatory Government Identification</span>
        </h2>
        <div className="bg-[#151518] border border-white/10 rounded-2xl p-6 space-y-3">
          <p className="text-sm text-[#F7F3EC] font-medium leading-relaxed">
            In compliance with Indian statutory guidelines and local police directives:
          </p>
          <ul className="space-y-2 list-disc pl-6 text-xs sm:text-sm text-[#A8A59E]">
            <li>
              Every adult occupant (18 years and above) must present an <strong>original, valid government-issued photo identity document</strong> bearing a clear photograph and residential address upon check-in.
            </li>
            <li>
              <strong className="text-[#F7F3EC]">Accepted Indian IDs:</strong> Aadhaar Card, Passport, Driving License, or Voter ID Card. <em>PAN Cards are legally not accepted as proof of residence for hotel registration.</em>
            </li>
            <li>
              <strong className="text-[#F7F3EC]">Foreign Nationals:</strong> Must present an original valid Passport, valid Indian Visa, and where applicable, Overseas Citizen of India (OCI) registration. Form C registration is mandatorily submitted to immigration authorities.
            </li>
            <li>
              Hotel Fremont reserves the right to deny check-in without refund if valid identification is not produced upon arrival.
            </li>
          </ul>
        </div>
      </section>

      {/* 5. Guest Conduct & Property Damage */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#F7F3EC] pb-2 border-b border-white/10 flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-[#C9A96E]" />
          <span>5. Guest Conduct, Decorum &amp; Property Damages</span>
        </h2>
        <ul className="space-y-2 list-disc pl-6 text-[#A8A59E]">
          <li>
            <strong className="text-[#F7F3EC]">Sanctuary Decorum:</strong> Guests are expected to maintain civilized conduct and respect the tranquility of other patrons. Loud music, disruptive behaviour, or unlawful activities are grounds for immediate eviction without refund.
          </li>
          <li>
            <strong className="text-[#F7F3EC]">Damage Liability:</strong> The primary guest named on the booking is financially responsible for any breakage, staining, structural damage, or missing fixtures within the allocated room or public areas caused by themselves or their invited visitors. Full replacement or restoration costs will be charged directly prior to departure.
          </li>
          <li>
            <strong className="text-[#F7F3EC]">Non-Smoking Policy:</strong> All guest rooms and indoor suites are strictly non-smoking. A specialized cleaning recovery fee of ₹5,000 will be levied if evidence of indoor smoking is detected. Designated outdoor smoking zones are provided.
          </li>
        </ul>
      </section>

      {/* 6. Force Majeure */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#F7F3EC] pb-2 border-b border-white/10 flex items-center gap-2.5">
          <Building className="w-5 h-5 text-[#C9A96E]" />
          <span>6. Force Majeure</span>
        </h2>
        <p>
          Hotel Fremont shall not be held in breach of contract, nor liable for any delay or failure in performance of our hospitality services, arising from events beyond our reasonable control. Such &quot;Force Majeure&quot; events include acts of God, flood, earthquake, extreme weather disasters, civil unrest, war, governmental curfew or state travel lockdowns, utility grid collapse, or telecommunication outages. In such circumstances, our liability is limited strictly to rescheduling the reservation or issuing a future credit note at management discretion.
        </p>
      </section>

      {/* 7. Limitation of Liability */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#F7F3EC] pb-2 border-b border-white/10 flex items-center gap-2.5">
          <Scale className="w-5 h-5 text-[#C9A96E]" />
          <span>7. Limitation of Liability</span>
        </h2>
        <p>
          To the maximum extent permitted by Indian law:
        </p>
        <ul className="space-y-2 list-disc pl-6 text-[#A8A59E]">
          <li>
            Hotel Fremont’s maximum aggregate liability for any direct claims, losses, or damages arising out of your booking or stay shall strictly not exceed the total room tariff amount actually paid by you for the specific reservation.
          </li>
          <li>
            Electronic in-room digital safes are provided in all suites. The hotel assumes no liability for the loss, theft, or damage of personal jewelry, cash, laptops, or valuable effects left unattended in suites, vehicles, or public areas.
          </li>
        </ul>
      </section>

      {/* 8. Governing Law & Jurisdiction */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#F7F3EC] pb-2 border-b border-white/10 flex items-center gap-2.5">
          <Scale className="w-5 h-5 text-[#C9A96E]" />
          <span>8. Governing Law &amp; Exclusive Jurisdiction</span>
        </h2>
        <div className="bg-[#151518] border border-white/10 rounded-2xl p-6 text-sm text-[#A8A59E] leading-relaxed">
          These Terms and Conditions, all reservations, and any dispute or controversy arising out of or related to your relationship with Hotel Fremont shall be governed by, interpreted, and construed strictly in accordance with the substantive <strong>laws of the Republic of India</strong>.
          <p className="mt-3 text-[#F7F3EC] font-semibold">
            Any legal dispute, action, or proceeding shall be subject to the exclusive jurisdiction of the competent courts situated at <strong>SAS Nagar (Mohali), Punjab, India</strong>.
          </p>
        </div>
      </section>

      {/* 9. Contact Details */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#F7F3EC] pb-2 border-b border-white/10 flex items-center gap-2.5">
          <Building className="w-5 h-5 text-[#C9A96E]" />
          <span>9. Official Contact Information</span>
        </h2>
        <p>For any queries regarding these Terms &amp; Conditions, please contact:</p>
        <div className="bg-[#151518] border border-white/10 rounded-xl p-5 text-xs sm:text-sm space-y-1.5 text-[#A8A59E]">
          <p className="text-[#F7F3EC] font-semibold">{siteConfig.siteName}</p>
          <p>Proprietor: {siteConfig.proprietorName}</p>
          <p>{siteConfig.address}</p>
          <p>Phone: <a href={siteConfig.phoneTel} className="text-[#C9A96E] hover:underline">{siteConfig.phone}</a></p>
          <p>Email: <a href={`mailto:${siteConfig.email}`} className="text-[#C9A96E] hover:underline">{siteConfig.email}</a></p>
        </div>
      </section>
    </PolicyLayout>
  );
}
