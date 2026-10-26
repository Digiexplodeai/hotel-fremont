"use client";

import { motion } from "framer-motion";
import { MapPin, Navigation, Plane, Phone, Mail, MessageSquare, ExternalLink, Clock } from "lucide-react";
import { siteConfig } from "@/data/content";

export default function LocationSection() {
  const { location, contact } = siteConfig;

  return (
    <section id="location" className="relative py-24 lg:py-32 bg-[#0E0E10] text-[#F7F3EC] overflow-hidden">
      {/* Subtle Background Lighting */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#E02B1D]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center space-x-2 text-[11px] font-sans tracking-[0.3em] text-[#C9A96E] uppercase font-semibold mb-3">
            <span className="w-6 h-[1.5px] bg-[#E02B1D]" />
            <span>{location.eyebrow}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#F7F3EC] leading-tight mb-4">
            {location.headline}
          </h2>
          <p className="text-xs sm:text-sm text-[#A8A59E] font-light leading-relaxed">
            {location.description}
          </p>
        </div>

        {/* Airport Proximity USP Banner */}
        <div className="mb-12 p-6 sm:p-8 rounded-2xl glass-panel border border-[#C9A96E]/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
          <div className="flex items-start sm:items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-[#E02B1D]/15 border border-[#E02B1D] flex items-center justify-center text-[#E02B1D] shrink-0">
              <Plane className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-sans font-bold tracking-widest text-[#E02B1D] uppercase">
                  Major Proximity USP
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-[9px] uppercase tracking-wider text-white">
                  Prime Arterial
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#F7F3EC] mt-0.5">
                Minutes from Chandigarh International Airport (IXC)
              </h3>
              <p className="text-xs text-[#A8A59E] font-light mt-1">
                Direct, traffic-free expressway access. Complimentary chauffeured airport transfers provided for select suites.
              </p>
            </div>
          </div>

          <a
            href={contact.directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-full bg-[#E02B1D] hover:bg-[#c82215] text-white text-xs font-sans uppercase tracking-[0.18em] font-semibold transition-all duration-300 shadow-md flex items-center space-x-2 shrink-0 btn-magnetic"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Get Directions</span>
          </a>
        </div>

        {/* Grid: Interactive Google Map + Address & Transit Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Google Map Embed */}
          <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-white/10 shadow-2xl min-h-[380px] lg:min-h-[460px] relative">
            <iframe
              src={contact.mapEmbedUrl}
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

              {/* Exact Address */}
              <h4 className="text-xl font-serif font-bold text-[#F7F3EC] mb-2 leading-snug">
                {contact.address}
              </h4>

              <p className="text-xs text-[#A8A59E] mb-6 font-light">
                Situated prominently on Airport Road with private driveway and secure subterranean valet parking.
              </p>

              {/* Distances List */}
              <div className="space-y-2.5 mb-6">
                <span className="text-[10px] font-sans uppercase tracking-wider text-[#A8A59E] block mb-1">
                  Key Transit Distances
                </span>
                {location.distances.map((dist, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                      dist.highlight
                        ? "bg-[#E02B1D]/10 border-[#E02B1D]/30 text-[#F7F3EC]"
                        : "bg-[#0E0E10] border-white/5 text-[#A8A59E]"
                    }`}
                  >
                    <span className="font-medium text-[#F7F3EC] truncate pr-2">
                      {dist.destination}
                    </span>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[11px] text-[#C9A96E]">{dist.dist}</span>
                      <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-semibold text-white">
                        {dist.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Contact Row */}
            <div className="pt-4 border-t border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#A8A59E]">Direct Inquiries:</span>
                <a href={contact.phoneTel} className="text-[#C9A96E] hover:text-white font-medium">
                  {contact.phone}
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#A8A59E]">Booking Desk:</span>
                <a href={`mailto:${contact.bookingEmail}`} className="text-[#C9A96E] hover:text-white font-medium">
                  {contact.bookingEmail}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
