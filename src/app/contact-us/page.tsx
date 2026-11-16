import type { Metadata } from "next";
import PolicyLayout from "@/components/PolicyLayout";
import { siteConfig } from "@/lib/site-config";
import { siteConfig as contentConfig } from "@/data/content";
import Link from "next/link";
import { MapPin, Phone, Mail, Clock, ExternalLink, MessageSquare, Compass, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us | Hotel Fremont",
  description:
    "Official contact information, physical address, proprietor details, phone number, and directions for Hotel Fremont, Sector 80, Airport Road, Mohali.",
  alternates: {
    canonical: `${siteConfig.siteUrl}/contact-us`,
  },
  openGraph: {
    title: "Contact Us | Hotel Fremont",
    description:
      "Get in touch with Hotel Fremont. Official phone, email, proprietor, and location details in Mohali, Punjab.",
    url: `${siteConfig.siteUrl}/contact-us`,
    siteName: siteConfig.siteName,
  },
};

export default function ContactUsPage() {
  const { contact, location } = contentConfig;

  return (
    <PolicyLayout
      title="Contact Us"
      subtitle="Connect with Hotel Fremont reservations, concierge, and management. We are at your service 24 hours a day, 7 days a week."
    >
      {/* Official Merchant Details Card (Razorpay Required) */}
      <div className="bg-[#151518] border border-[#C9A96E]/20 rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E02B1D]/10 border border-[#E02B1D]/20 text-[11px] font-mono tracking-wider text-[#C9A96E] uppercase">
          <Shield className="w-3.5 h-3.5 text-[#E02B1D]" />
          <span>VERIFIED BUSINESS ENTITY</span>
        </div>
        <h2 className="text-xl font-serif font-bold text-[#F7F3EC] m-0 border-none pb-0">
          Official Establishment & Proprietor Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs sm:text-sm text-[#A8A59E]">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#C9A96E] block mb-1">
              Legal Trade Name
            </span>
            <p className="text-[#F7F3EC] font-semibold text-base">{siteConfig.tradeName}</p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#C9A96E] block mb-1">
              Proprietor / Managing Authority
            </span>
            <p className="text-[#F7F3EC] font-semibold text-base">{siteConfig.proprietorName}</p>
          </div>

          <div className="sm:col-span-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#C9A96E] block mb-1">
              Complete Registered & Physical Address
            </span>
            <p className="text-[#F7F3EC] font-medium leading-relaxed">{siteConfig.address}</p>
          </div>
        </div>
      </div>

      {/* Direct Contact Channels Grid */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#F7F3EC] pb-2 border-b border-white/10 flex items-center gap-2.5">
          <Phone className="w-5 h-5 text-[#C9A96E]" />
          <span>Direct Contact Channels</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Phone Card */}
          <div className="bg-[#151518] border border-white/10 rounded-2xl p-6 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#E02B1D]/10 border border-[#E02B1D]/20 flex items-center justify-center text-[#E02B1D]">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="text-base font-serif font-bold text-[#F7F3EC]">Telephone & Concierge</h3>
              <p className="text-xs text-[#A8A59E]">24/7 Front desk support and reservation inquiries.</p>
            </div>
            <div className="pt-3 border-t border-white/5">
              <a
                href={siteConfig.phoneTel}
                className="text-sm font-semibold text-[#C9A96E] hover:text-white transition"
              >
                {siteConfig.phone}
              </a>
            </div>
          </div>

          {/* Email Card */}
          <div className="bg-[#151518] border border-white/10 rounded-2xl p-6 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#C9A96E]/10 border border-[#C9A96E]/20 flex items-center justify-center text-[#C9A96E]">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-base font-serif font-bold text-[#F7F3EC]">Official Email</h3>
              <p className="text-xs text-[#A8A59E]">Direct booking desk, billing inquiries, and corporate requests.</p>
            </div>
            <div className="pt-3 border-t border-white/5">
              <a
                href={`mailto:${siteConfig.email}`}
                className="text-sm font-semibold text-[#C9A96E] hover:text-white transition break-all"
              >
                {siteConfig.email}
              </a>
            </div>
          </div>

          {/* WhatsApp Card */}
          <div className="bg-[#151518] border border-white/10 rounded-2xl p-6 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-serif font-bold text-[#F7F3EC]">WhatsApp Concierge</h3>
              <p className="text-xs text-[#A8A59E]">Instant messaging assistance and transit coordination.</p>
            </div>
            <div className="pt-3 border-t border-white/5">
              <a
                href={contact.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-emerald-400 hover:text-white transition flex items-center gap-1.5"
              >
                <span>Chat on WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Location, Directions & Map */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#F7F3EC] pb-2 border-b border-white/10 flex items-center gap-2.5">
          <MapPin className="w-5 h-5 text-[#C9A96E]" />
          <span>Location & Strategic Connectivity</span>
        </h2>
        <p className="text-[#A8A59E] leading-relaxed">
          {location.description}
        </p>

        {/* Transit Distance Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {location.distances.map((dist, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                dist.highlight
                  ? "bg-[#E02B1D]/10 border-[#E02B1D]/30 text-[#F7F3EC]"
                  : "bg-[#151518] border-white/5 text-[#A8A59E]"
              }`}
            >
              <span className="font-medium truncate pr-2">{dist.destination}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-[#C9A96E]">{dist.dist}</span>
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-semibold text-white">
                  {dist.time}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Google Maps Actions & Embed */}
        <div className="bg-[#151518] border border-white/10 rounded-2xl overflow-hidden p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-serif font-bold text-[#F7F3EC]">Find Us on Google Maps</h3>
              <p className="text-xs text-[#A8A59E]">Airport Road, Sector 80, SAS Nagar, Mohali, Punjab</p>
            </div>
            <a
              href={siteConfig.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-[#E02B1D] hover:bg-[#c82215] text-white text-xs font-semibold tracking-wider uppercase transition flex items-center gap-2 shrink-0 shadow"
            >
              <Compass className="w-4 h-4" />
              <span>Open in Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
            </a>
          </div>

          <div className="relative aspect-[16/9] sm:aspect-[21/9] rounded-xl overflow-hidden border border-white/10 bg-black">
            <iframe
              src={contact.mapEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Hotel Fremont Location Map"
              className="w-full h-full filter invert-[0.9] hue-rotate-180 contrast-[1.2]"
            />
          </div>
        </div>
      </section>
    </PolicyLayout>
  );
}
