import type { Metadata } from "next";
import PolicyLayout from "@/components/PolicyLayout";
import { siteConfig } from "@/lib/site-config";
import { siteConfig as contentConfig } from "@/data/content";
import { MapPin, Phone, Mail, ExternalLink, MessageSquare, Compass, Shield } from "lucide-react";

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
      subtitle="Connect with Hotel Fremont reservations and front desk. We are at your service 24 hours a day, 7 days a week."
    >
      {/* Official Merchant Details Card (Razorpay Required) */}
      <div className="bg-white border border-[#E5DFD7] rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#742B40]/10 border border-[#742B40]/25 text-[11px] font-sans tracking-wider text-[#742B40] uppercase font-bold">
          <Shield className="w-3.5 h-3.5 text-[#742B40]" />
          <span>VERIFIED BUSINESS ENTITY</span>
        </div>
        <h2 className="text-xl font-serif font-bold text-[#24272B] m-0 border-none pb-0">
          Official Establishment & Proprietor Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs sm:text-sm text-[#64615D]">
          <div>
            <span className="text-[10px] uppercase font-sans tracking-wider text-[#742B40] font-bold block mb-1">
              Legal Trade Name
            </span>
            <p className="text-[#24272B] font-semibold text-base">{siteConfig.tradeName}</p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-sans tracking-wider text-[#742B40] font-bold block mb-1">
              Proprietor / Managing Authority
            </span>
            <p className="text-[#24272B] font-semibold text-base">{siteConfig.proprietorName}</p>
          </div>

          <div className="sm:col-span-2">
            <span className="text-[10px] uppercase font-sans tracking-wider text-[#742B40] font-bold block mb-1">
              Complete Registered & Physical Address
            </span>
            <p className="text-[#24272B] font-medium leading-relaxed">{siteConfig.address}</p>
          </div>
        </div>
      </div>

      {/* Direct Contact Channels Grid */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#24272B] pb-2 border-b border-[#E5DFD7] flex items-center gap-2.5">
          <Phone className="w-5 h-5 text-[#742B40]" />
          <span>Direct Contact Channels</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Phone Card */}
          <div className="bg-white border border-[#E5DFD7] rounded-2xl p-6 space-y-3 flex flex-col justify-between shadow-sm">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#742B40]/10 border border-[#742B40]/25 flex items-center justify-center text-[#742B40]">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="text-base font-serif font-bold text-[#24272B]">Telephone &amp; Front Desk</h3>
              <p className="text-xs text-[#64615D]">24/7 Front desk support and reservation inquiries.</p>
            </div>
            <div className="pt-3 border-t border-[#E5DFD7]">
              <a
                href={siteConfig.phoneTel}
                className="text-sm font-semibold text-[#742B40] hover:text-[#24272B] transition"
              >
                {siteConfig.phone}
              </a>
            </div>
          </div>

          {/* Email Card */}
          <div className="bg-white border border-[#E5DFD7] rounded-2xl p-6 space-y-3 flex flex-col justify-between shadow-sm">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#B69A68]/15 border border-[#B69A68]/30 flex items-center justify-center text-[#742B40]">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-base font-serif font-bold text-[#24272B]">Official Email</h3>
              <p className="text-xs text-[#64615D]">Direct booking desk, billing inquiries, and corporate requests.</p>
            </div>
            <div className="pt-3 border-t border-[#E5DFD7]">
              <a
                href={`mailto:${siteConfig.email}`}
                className="text-sm font-semibold text-[#742B40] hover:text-[#24272B] transition break-all"
              >
                {siteConfig.email}
              </a>
            </div>
          </div>

          {/* WhatsApp Card */}
          <div className="bg-white border border-[#E5DFD7] rounded-2xl p-6 space-y-3 flex flex-col justify-between shadow-sm">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-serif font-bold text-[#24272B]">WhatsApp Concierge</h3>
              <p className="text-xs text-[#64615D]">Instant messaging assistance and transit coordination.</p>
            </div>
            <div className="pt-3 border-t border-[#E5DFD7]">
              <a
                href={contact.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition flex items-center gap-1.5"
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
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#24272B] pb-2 border-b border-[#E5DFD7] flex items-center gap-2.5">
          <MapPin className="w-5 h-5 text-[#742B40]" />
          <span>Location &amp; Neighborhood</span>
        </h2>
        <p className="text-[#64615D] leading-relaxed">
          {contact.address}
        </p>

        {/* Nearby Key Landmarks */}
        <div className="space-y-2 pt-2">
          <h3 className="text-sm font-serif font-semibold text-[#24272B]">Nearby Key Destinations</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {location.nearbyPlaces.map((place: string, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-[#E5DFD7] bg-[#F8F6F2] text-xs text-[#24272B] flex items-center gap-2"
              >
                <MapPin className="w-3.5 h-3.5 text-[#742B40] shrink-0" />
                <span>{place}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#64615D] italic mt-2">{location.note}</p>
        </div>

        {/* Google Maps Actions */}
        <div className="bg-white border border-[#E5DFD7] rounded-2xl overflow-hidden p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-serif font-bold text-[#24272B]">Find Us on Google Maps</h3>
              <p className="text-xs text-[#64615D]">Airport Road, Sector 80, SAS Nagar, Mohali, Punjab</p>
            </div>
            <a
              href={contact.directionsUrl || siteConfig.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-[#742B40] hover:bg-[#5C2033] text-white text-xs font-semibold tracking-wider uppercase transition flex items-center gap-2 shrink-0 shadow-md cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Open in Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
            </a>
          </div>
        </div>
      </section>
    </PolicyLayout>
  );
}
