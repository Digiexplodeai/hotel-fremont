"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Users, Calendar } from "lucide-react";
import { siteConfig } from "@/data/content";
import { useSiteSlots } from "@/context/SiteSlotsContext";
import PhotoComingSoon from "@/components/PhotoComingSoon";
import EventEnquiryModal from "./EventEnquiryModal";

export default function EventsSection() {
  const [selectedVenue, setSelectedVenue] = useState<string>("Cloud Six Banquet");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { events } = siteConfig;
  const { slots } = useSiteSlots();

  const venues = events.venues.map((venue) => {
    const slotKey = venue.imageSlot || "cloud-six-banquet";
    const slotData = slots[slotKey];
    return {
      ...venue,
      imageUrl: (slotData?.isActive !== false && slotData?.is_active !== false && slotData?.url) ? slotData.url : null,
    };
  });

  const handleEnquire = (venueName: string) => {
    setSelectedVenue(venueName);
    setIsModalOpen(true);
  };

  return (
    <section id="events" className="relative py-24 lg:py-32 bg-[#F8F6F2] text-[#24272B] overflow-hidden scroll-mt-20 lg:scroll-mt-24">
      {/* Subtle Ambient Glow Accent */}
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-[#B69A68]/10 rounded-full blur-3xl pointer-events-none" />

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
            <div className="inline-flex items-center space-x-2 text-[11px] font-sans tracking-[0.3em] text-[#742B40] uppercase font-bold mb-3">
              <span className="w-6 h-[2px] bg-[#742B40]" />
              <span>{events.eyebrow}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#24272B] leading-tight">
              {events.title}
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xs sm:text-sm text-[#64615D] font-normal max-w-sm mt-4 md:mt-0"
          >
            {events.subtitle}
          </motion.p>
        </div>

        {/* Venues Grid (2 Venues) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {venues.map((venue, index) => (
            <motion.div
              key={venue.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: index * 0.15 }}
              className="group rounded-2xl bg-white border border-[#E5DFD7] hover:border-[#B69A68] overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Venue Visual */}
                <div className="relative w-full aspect-[16/11] overflow-hidden bg-[#F8F6F2]">
                  {venue.imageUrl ? (
                    <>
                      <Image
                        src={venue.imageUrl}
                        alt={venue.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    </>
                  ) : (
                    <PhotoComingSoon
                      title={venue.name}
                      category={venue.type}
                      aspectRatio="aspect-[16/11]"
                    />
                  )}

                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#742B40] text-white text-[10px] font-sans font-bold tracking-widest uppercase shadow">
                    {venue.type}
                  </div>
                </div>

                {/* Venue Info */}
                <div className="p-6">
                  <h3 className="text-xl font-serif font-bold text-[#24272B] group-hover:text-[#742B40] transition-colors mb-2">
                    {venue.name}
                  </h3>

                  <p className="text-xs text-[#64615D] font-normal leading-relaxed mb-5">
                    {venue.desc}
                  </p>

                  <div className="py-3 border-y border-[#E5DFD7] text-xs text-[#24272B] mb-4">
                    <div className="flex items-center space-x-1.5">
                      <Users className="w-3.5 h-3.5 text-[#742B40]" />
                      <span className="text-[11px] font-semibold">{venue.capacity}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-6 pt-0">
                <button
                  onClick={() => handleEnquire(venue.name)}
                  className="w-full py-3 rounded-xl border border-[#B69A68] hover:border-[#742B40] hover:bg-[#742B40] text-xs font-sans uppercase tracking-[0.18em] text-[#742B40] hover:text-white font-semibold transition-all duration-300 flex items-center justify-center space-x-2 group/btn cursor-pointer shadow-sm"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#742B40] group-hover/btn:text-white" />
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
