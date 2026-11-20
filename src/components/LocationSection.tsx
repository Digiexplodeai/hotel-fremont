"use client";

import { motion } from "framer-motion";
import { MapPin, Navigation, CheckCircle2, Info } from "lucide-react";
import { siteConfig } from "@/data/content";

export default function LocationSection() {
  const { location, contact } = siteConfig;

  return (
    <section id="location" className="relative py-20 lg:py-28 bg-[#EEE8DF] text-[#24272B] overflow-hidden scroll-mt-20 lg:scroll-mt-24">
      {/* Subtle Background Lighting Accent */}
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#B69A68]/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center space-x-2 text-[11px] font-sans tracking-[0.3em] text-[#742B40] uppercase font-bold mb-3">
            <span className="w-6 h-[2px] bg-[#742B40]" />
            <span>ACCESSIBILITY &amp; LOCATION</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#24272B] leading-tight mb-4">
            Airport Road, Sector 80, Mohali
          </h2>
          <p className="text-xs sm:text-sm text-[#64615D] font-normal leading-relaxed">
            Situated conveniently along Airport Road in Sector 80, Mohali, offering straightforward access to key business hubs, religious landmarks, shopping centers, and transit routes across the Tricity.
          </p>
        </div>

        {/* Grid: Google Map Embed + Location & Contact Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Google Map Embed */}
          <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-[#E5DFD7] shadow-xl min-h-[380px] lg:min-h-[460px] relative bg-white">
            <iframe
              src="https://maps.google.com/maps?q=Hotel+Fremont+Airport+Road+Sector+80+SAS+Nagar+Mohali+Punjab&t=&z=14&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: "380px" }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Hotel Fremont Location Map"
              className="w-full h-full"
            />
          </div>

          {/* Location & Contact Info Card */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-2xl bg-white border border-[#E5DFD7] flex flex-col justify-between shadow-xl text-[#24272B]">
            <div>
              <div className="flex items-center space-x-2 text-[10px] font-sans tracking-[0.2em] text-[#742B40] uppercase font-bold mb-3">
                <MapPin className="w-3.5 h-3.5 text-[#742B40]" />
                <span>EXACT PROPERTY ADDRESS</span>
              </div>

              <h4 className="text-lg sm:text-xl font-serif font-bold text-[#24272B] mb-2 leading-snug">
                {contact.address}
              </h4>

              <div className="flex items-center gap-1.5 p-2.5 rounded-lg bg-[#F8F6F2] border border-[#E5DFD7] text-[11px] text-[#64615D] mb-5">
                <Info className="w-3.5 h-3.5 text-[#742B40] shrink-0" />
                <span>Travel times vary with route and traffic conditions.</span>
              </div>

              {/* Nearby Places List */}
              <div className="mb-6">
                <span className="text-[10px] font-sans uppercase tracking-wider text-[#742B40] font-bold block mb-2">
                  Nearby Destinations &amp; Hubs
                </span>
                <div className="space-y-1.5 text-xs text-[#24272B]">
                  {location.nearbyPlaces.map((place, idx) => (
                    <div key={idx} className="flex items-center space-x-2 p-2 rounded-lg bg-[#F8F6F2] border border-[#E5DFD7]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#742B40] shrink-0" />
                      <span className="truncate">{place}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Convenient For */}
              <div className="mb-6">
                <span className="text-[10px] font-sans uppercase tracking-wider text-[#64615D] block mb-2 font-semibold">
                  Convenient Choice For:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {location.convenientFor.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-[#F8F6F2] text-[11px] text-[#64615D] border border-[#E5DFD7]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Contact & Directions Row */}
            <div className="pt-4 border-t border-[#E5DFD7] space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#64615D]">Front Desk Assistance:</span>
                <a href={contact.phoneTel} className="text-[#742B40] hover:text-[#24272B] font-semibold">
                  {contact.phone}
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#64615D]">Email:</span>
                <a href={`mailto:${contact.email}`} className="text-[#742B40] hover:text-[#24272B] font-semibold">
                  {contact.email}
                </a>
              </div>
              <a
                href={contact.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-2 py-3 rounded-xl bg-[#742B40] hover:bg-[#5C2033] text-white text-xs font-sans uppercase tracking-[0.16em] font-semibold transition-all flex items-center justify-center space-x-2 shadow-md cursor-pointer"
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
