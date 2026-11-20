"use client";

import { motion } from "framer-motion";
import { MapPin, Navigation, Phone, Mail, CheckCircle2, Info } from "lucide-react";
import { siteConfig } from "@/data/content";

export default function LocationSection() {
  const { location, contact } = siteConfig;

  return (
    <section id="location" className="relative py-20 lg:py-28 bg-[#0E0E10] text-[#F7F3EC] overflow-hidden scroll-mt-20 lg:scroll-mt-24">
      {/* Subtle Background Lighting */}
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#E02B1D]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center space-x-2 text-[11px] font-sans tracking-[0.3em] text-[#C9A96E] uppercase font-semibold mb-3">
            <span className="w-6 h-[1.5px] bg-[#E02B1D]" />
            <span>ACCESSIBILITY &amp; LOCATION</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#F7F3EC] leading-tight mb-4">
            Airport Road, Sector 80, Mohali
          </h2>
          <p className="text-xs sm:text-sm text-[#A8A59E] font-light leading-relaxed">
            Situated conveniently along Airport Road in Sector 80, Mohali, offering straightforward access to key business hubs, religious landmarks, shopping centers, and transit routes across the Tricity.
          </p>
        </div>

        {/* Grid: Google Map Embed + Location & Contact Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Google Map Embed */}
          <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-white/10 shadow-2xl min-h-[380px] lg:min-h-[460px] relative">
            <iframe
              src="https://maps.google.com/maps?q=Hotel+Fremont+Airport+Road+Sector+80+SAS+Nagar+Mohali+Punjab&t=&z=14&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: "380px", filter: "invert(90%) hue-rotate(180deg) contrast(100%)" }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Hotel Fremont Location Map"
              className="w-full h-full"
            />
          </div>

          {/* Location & Contact Info Card */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-2xl bg-[#151518] border border-white/10 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center space-x-2 text-[10px] font-sans tracking-[0.2em] text-[#C9A96E] uppercase font-semibold mb-3">
                <MapPin className="w-3.5 h-3.5 text-[#E02B1D]" />
                <span>EXACT PROPERTY ADDRESS</span>
              </div>

              <h4 className="text-lg sm:text-xl font-serif font-bold text-[#F7F3EC] mb-2 leading-snug">
                {contact.address}
              </h4>

              <div className="flex items-center gap-1.5 p-2.5 rounded-lg bg-white/5 border border-white/5 text-[11px] text-[#A8A59E] mb-5">
                <Info className="w-3.5 h-3.5 text-[#C9A96E] shrink-0" />
                <span>Travel times vary with route and traffic.</span>
              </div>

              {/* Nearby Places List */}
              <div className="mb-6">
                <span className="text-[10px] font-sans uppercase tracking-wider text-[#C9A96E] font-semibold block mb-2">
                  Nearby Destinations &amp; Hubs
                </span>
                <div className="space-y-1.5 text-xs text-[#F7F3EC]/85">
                  {location.nearbyPlaces.map((place, idx) => (
                    <div key={idx} className="flex items-center space-x-2 p-2 rounded-lg bg-[#0E0E10] border border-white/5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#E02B1D] shrink-0" />
                      <span className="truncate">{place}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Convenient For */}
              <div className="mb-6">
                <span className="text-[10px] font-sans uppercase tracking-wider text-[#A8A59E] block mb-2 font-semibold">
                  Convenient Choice For:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {location.convenientFor.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-white/5 text-[11px] text-[#F7F3EC]/80 border border-white/5"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Contact & Directions Row */}
            <div className="pt-4 border-t border-white/10 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#A8A59E]">Front Desk Assistance:</span>
                <a href={contact.phoneTel} className="text-[#C9A96E] hover:text-white font-medium">
                  {contact.phone}
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#A8A59E]">Email:</span>
                <a href={`mailto:${contact.email}`} className="text-[#C9A96E] hover:text-white font-medium">
                  {contact.email}
                </a>
              </div>
              <a
                href={contact.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-2 py-3 rounded-xl bg-[#E02B1D] hover:bg-[#c82215] text-white text-xs font-sans uppercase tracking-[0.16em] font-semibold transition-all flex items-center justify-center space-x-2 shadow-md cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Get Directions in Google Maps</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
