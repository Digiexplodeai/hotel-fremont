"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Crown, Users, Maximize2, Sparkles, Calendar, ArrowRight } from "lucide-react";
import { siteConfig } from "@/data/content";
import EventEnquiryModal from "./EventEnquiryModal";

export default function EventsSection() {
  const [selectedVenue, setSelectedVenue] = useState<string>("The Grand Fremont Ballroom");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { events } = siteConfig;

  const handleEnquire = (venueName: string) => {
    setSelectedVenue(venueName);
    setIsModalOpen(true);
  };

  return (
    <section id="events" className="relative py-24 lg:py-32 bg-[#0E0E10] text-[#F7F3EC] overflow-hidden">
      {/* Subtle Ambient Red Glow */}
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-[#E02B1D]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center space-x-2 text-[11px] font-sans tracking-[0.3em] text-[#C9A96E] uppercase font-semibold mb-3">
              <span className="w-6 h-[1.5px] bg-[#E02B1D]" />
              <span>{events.eyebrow}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#F7F3EC] leading-tight">
              {events.title}
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xs sm:text-sm text-[#A8A59E] font-light max-w-sm mt-4 md:mt-0"
          >
            {events.subtitle}
          </motion.p>
        </div>

        {/* Venues Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {events.venues.map((venue, index) => (
            <motion.div
              key={venue.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: index * 0.15 }}
              className="group rounded-2xl bg-[#151518] border border-white/10 hover:border-[#C9A96E]/40 overflow-hidden shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Venue Visual */}
                <div className="relative w-full aspect-[16/11] overflow-hidden">
                  <Image
                    src={venue.image}
                    alt={venue.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#151518] via-transparent to-black/20" />

                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#E02B1D] text-white text-[10px] font-sans font-bold tracking-widest uppercase shadow">
                    {venue.type}
                  </div>
                </div>

                {/* Venue Info */}
                <div className="p-6">
                  <h3 className="text-xl font-serif font-bold text-[#F7F3EC] group-hover:text-[#C9A96E] transition-colors mb-2">
                    {venue.name}
                  </h3>

                  <p className="text-xs text-[#A8A59E] font-light leading-relaxed mb-5">
                    {venue.desc}
                  </p>

                  <div className="grid grid-cols-2 gap-2 py-3 border-y border-white/5 text-xs text-[#F7F3EC] mb-4">
                    <div className="flex items-center space-x-1.5">
                      <Users className="w-3.5 h-3.5 text-[#E02B1D]" />
                      <span className="text-[11px] font-semibold">{venue.capacity}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-[#E02B1D]" />
                      <span className="text-[11px] font-semibold">{venue.area}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-6 pt-0">
                <button
                  onClick={() => handleEnquire(venue.name)}
                  className="w-full py-3 rounded-xl border border-[#C9A96E]/40 hover:border-[#E02B1D] hover:bg-[#E02B1D] text-xs font-sans uppercase tracking-[0.18em] text-[#F7F3EC] font-semibold transition-all duration-300 flex items-center justify-center space-x-2 group/btn"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#C9A96E] group-hover/btn:text-white" />
                  <span>Enquire For Dates</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Event Enquiry Modal */}
      <EventEnquiryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        preSelectedVenue={selectedVenue}
      />
    </section>
  );
}
