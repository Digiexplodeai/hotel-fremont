import type { Metadata } from "next";
import PolicyLayout from "@/components/PolicyLayout";
import { siteConfig } from "@/lib/site-config";
import Link from "next/link";
import { Truck, Mail, Smartphone, CheckCircle, HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy | Hotel Fremont",
  description:
    "Shipping and Delivery Policy of Hotel Fremont, Mohali. Explaining digital voucher delivery for hospitality services and accommodation.",
  alternates: {
    canonical: `${siteConfig.siteUrl}/shipping-policy`,
  },
  openGraph: {
    title: "Shipping & Delivery Policy | Hotel Fremont",
    description:
      "Hotel Fremont provides hospitality services only. Booking confirmations are delivered digitally via email and WhatsApp.",
    url: `${siteConfig.siteUrl}/shipping-policy`,
    siteName: siteConfig.siteName,
  },
};

export default function ShippingPolicyPage() {
  return (
    <PolicyLayout
      title="Shipping & Delivery Policy"
      subtitle="Hotel Fremont provides hospitality, accommodation, and dining services. Learn how booking confirmations are issued."
    >
      {/* Scope Overview Card */}
      <div className="bg-[#151518] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A96E]/10 border border-[#C9A96E]/20 text-[11px] font-mono tracking-wider text-[#C9A96E] uppercase">
          <Truck className="w-3.5 h-3.5 text-[#C9A96E]" />
          <span>HOSPITALITY SERVICES ONLY</span>
        </div>
        <h2 className="text-xl font-serif font-bold text-[#F7F3EC] m-0 border-none pb-0">
          No Physical Goods Shipped
        </h2>
        <p className="text-[#A8A59E] leading-relaxed text-sm sm:text-base m-0">
          <strong>Hotel Fremont</strong> is a contemporary hotel offering accommodation across 21 guest rooms, an in-house restaurant, a dedicated banquet venue and a conference room. <strong>We do not sell, package, or dispatch tangible physical products or merchandise requiring postal or courier delivery.</strong>
        </p>
      </div>

      {/* 1. Digital Delivery of Confirmations */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#F7F3EC] pb-2 border-b border-white/10 flex items-center gap-2.5">
          <Mail className="w-5 h-5 text-[#C9A96E]" />
          <span>1. Electronic Delivery of Booking Confirmations</span>
        </h2>
        <p>
          Upon successful payment or reservation confirmation through our website or authorized channels, your booking entitlement is delivered digitally via electronic communication:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#151518] border border-white/5 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-[#C9A96E] font-medium text-xs uppercase tracking-wider">
              <Mail className="w-4 h-4 text-[#E02B1D]" />
              <span>Email Confirmation</span>
            </div>
            <p className="text-xs text-[#A8A59E] leading-relaxed">
              A comprehensive digital booking confirmation voucher, itemized GST receipt, and reservation summary is transmitted immediately or within 24 hours to the registered email address provided by the guest.
            </p>
          </div>

          <div className="bg-[#151518] border border-white/5 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-[#C9A96E] font-medium text-xs uppercase tracking-wider">
              <Smartphone className="w-4 h-4 text-[#E02B1D]" />
              <span>WhatsApp / SMS Confirmation</span>
            </div>
            <p className="text-xs text-[#A8A59E] leading-relaxed">
              An instant reservation reference notification and contact card is delivered to your designated Indian or international mobile number.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Redemption at Check-In */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#F7F3EC] pb-2 border-b border-white/10 flex items-center gap-2.5">
          <CheckCircle className="w-5 h-5 text-[#C9A96E]" />
          <span>2. Service Redemption at the Property</span>
        </h2>
        <ul className="space-y-2 list-disc pl-6 text-[#A8A59E]">
          <li>
            <strong className="text-[#F7F3EC]">Digital Presentation:</strong> Guests are not required to print physical paper vouchers. Simply present your digital confirmation on your smartphone or quote your reservation reference code at our reception desk.
          </li>
          <li>
            <strong className="text-[#F7F3EC]">Identification Proof:</strong> Along with the digital confirmation, guests must present original, valid government-issued photo ID cards for all adult occupants (Aadhaar, Passport, Driving License, or Voter ID).
          </li>
        </ul>
      </section>

      {/* 3. Delivery Support & Inquiries */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#F7F3EC] pb-2 border-b border-white/10 flex items-center gap-2.5">
          <HelpCircle className="w-5 h-5 text-[#C9A96E]" />
          <span>3. Inquiries Concerning Your Confirmation</span>
        </h2>
        <p>
          If you have completed payment but have not received your digital confirmation within 2 hours, please check your email spam/junk folder or contact our front desk directly:
        </p>
        <div className="bg-[#151518] border border-white/10 rounded-xl p-5 text-xs sm:text-sm space-y-1.5 text-[#A8A59E]">
          <p className="text-[#F7F3EC] font-semibold">{siteConfig.siteName} Concierge Desk</p>
          <p>Phone: <a href={siteConfig.phoneTel} className="text-[#C9A96E] hover:underline">{siteConfig.phone}</a></p>
          <p>Email: <a href={`mailto:${siteConfig.email}`} className="text-[#C9A96E] hover:underline">{siteConfig.email}</a></p>
          <p>Physical Location: {siteConfig.address}</p>
        </div>
      </section>
    </PolicyLayout>
  );
}

