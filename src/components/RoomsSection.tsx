"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { BedDouble, Maximize2, Users, Eye, Calendar, Sparkles } from "lucide-react";
import { siteConfig } from "@/data/content";
import { useSiteSlots } from "@/context/SiteSlotsContext";
import RoomDetailModal, { RoomType } from "./RoomDetailModal";
import PhotoComingSoon from "@/components/PhotoComingSoon";

interface RoomsSectionProps {
  onBookRoom: (roomId: string) => void;
}

export default function RoomsSection({ onBookRoom }: RoomsSectionProps) {
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const { slots } = useSiteSlots();

  const rooms = (siteConfig.rooms as RoomType[]).map((room) => {
    const slug = room.slug || room.id;
    let mainSlotUrl = "";
    let mainAlt = room.name || room.title;

    if (slug === "super-deluxe-room" || slug === "super-deluxe") {
      mainSlotUrl = slots["super-deluxe"]?.url || slots["rooms.super-deluxe-room.main"]?.url || "";
    } else if (slug === "premium-room" || slug === "premium") {
      mainSlotUrl = slots["premium"]?.url || slots["rooms.premium-room.main"]?.url || "";
    } else if (slug === "deluxe-room") {
      mainSlotUrl = slots["deluxe-room"]?.url || slots["rooms.deluxe-room.main"]?.url || "";
    } else {
      mainSlotUrl = slots[`rooms.${slug}.main`]?.url || "";
    }

    const galleryUrls: string[] = [];
    if (mainSlotUrl) galleryUrls.push(mainSlotUrl);

    return {
      ...room,
      image: mainSlotUrl,
      altText: mainAlt,
      gallery: galleryUrls,
    };
  });

  return (
    <section id="rooms" className="relative py-20 lg:py-28 bg-[#EEE8DF] text-[#24272B] overflow-hidden scroll-mt-20 lg:scroll-mt-24">
      {/* Decorative Subtle Accent Lighting */}
      <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-[#B69A68]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-[400px] h-[400px] bg-[#742B40]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center space-x-2 text-[11px] font-sans tracking-[0.3em] text-[#742B40] uppercase font-bold mb-3">
              <span className="w-6 h-[2px] bg-[#742B40]" />
              <span>ROOMS &amp; STAYS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#24272B] leading-tight">
              Thoughtfully Appointed Rooms
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xs sm:text-sm text-[#64615D] font-normal max-w-sm mt-4 md:mt-0"
          >
            21 guest rooms across 3 categories. All rooms include plush king-size beds, air-conditioning, Smart TV, tea/coffee maker, and complimentary Wi-Fi.
          </motion.p>
        </div>

        {/* 3 Rooms Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {rooms.map((room, index) => {
            const hasRealPhoto = room.image && room.image.trim().length > 0 && !failedImages[room.id];

            return (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: index * 0.12 }}
                className="group relative rounded-2xl bg-white border border-[#E5DFD7] hover:border-[#B69A68] transition-all duration-300 overflow-hidden shadow-md hover:shadow-xl flex flex-col justify-between"
              >
                {/* Image Container with Safe Ratio */}
                <div className="relative w-full aspect-[16/10] overflow-hidden bg-[#F8F6F2]">
                  {hasRealPhoto ? (
                    <Image
                      src={room.image}
                      alt={room.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      onError={() => setFailedImages((prev) => ({ ...prev, [room.id]: true }))}
                    />
                  ) : (
                    <PhotoComingSoon
                      title={room.title}
                      category="Guest Room"
                      aspectRatio="aspect-[16/10]"
                    />
                  )}

                  {/* Gradient Overlay for photo contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                    {room.tag && (
                      <span className="px-3 py-1 rounded-full bg-[#742B40] text-white text-[10px] font-sans font-bold tracking-widest uppercase shadow">
                        {room.tag}
                      </span>
                    )}
                    {room.inventoryLabel && (
                      <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-[#E5DFD7] text-[#24272B] text-[10px] font-sans font-semibold">
                        {room.inventoryLabel}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Container */}
                <div className="p-6 flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <h3 className="text-xl font-serif font-bold text-[#24272B] group-hover:text-[#742B40] transition-colors">
                        {room.title}
                      </h3>
                    </div>

                    <div className="mb-4">
                      <span className="text-lg font-serif font-bold text-[#742B40]">
                        {room.startingPriceLabel || `From ${room.priceLabel} + taxes`}
                      </span>
                      <span className="text-[11px] text-[#64615D] block">
                        Base tariff · 4 rate plans available
                      </span>
                    </div>

                    <p className="text-xs text-[#64615D] font-normal leading-relaxed mb-5 line-clamp-3">
                      {room.shortDescription || room.description}
                    </p>

                    {/* Room Specs */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-[#24272B]/85 mb-6 pb-5 border-b border-[#E5DFD7] font-sans">
                      <div className="flex items-center space-x-1.5">
                        <Maximize2 className="w-3.5 h-3.5 text-[#B69A68]" />
                        <span>{room.size}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <BedDouble className="w-3.5 h-3.5 text-[#B69A68]" />
                        <span>{room.bed}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Users className="w-3.5 h-3.5 text-[#B69A68]" />
                        <span>{room.occupancy}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-emerald-700 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Free Wi-Fi</span>
                      </div>
                    </div>
                  </div>

                  {/* CTAs */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelectedRoom(room)}
                      className="w-full py-2.5 px-3 rounded-xl border border-[#B69A68] hover:border-[#742B40] text-[#742B40] hover:text-white hover:bg-[#742B40] text-xs font-sans uppercase tracking-[0.14em] font-semibold transition-all duration-300 flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Room</span>
                    </button>

                    <button
                      onClick={() => onBookRoom(room.id)}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#742B40] hover:bg-[#5C2033] text-white text-xs font-sans uppercase tracking-[0.14em] font-semibold transition-all duration-300 shadow-[0_4px_15px_rgba(116,43,64,0.3)] hover:shadow-[0_4px_20px_rgba(116,43,64,0.5)] flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Book Now</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Room Detail Modal */}
      <RoomDetailModal
        room={selectedRoom}
        onClose={() => setSelectedRoom(null)}
        onBookRoom={onBookRoom}
      />
    </section>
  );
}
