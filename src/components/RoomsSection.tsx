"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { BedDouble, Maximize2, Users, ArrowRight, Eye, Calendar, Sparkles } from "lucide-react";
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
    // Map specific slots
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
    <section id="rooms" className="relative py-20 lg:py-28 bg-[#0E0E10] text-[#F7F3EC] overflow-hidden scroll-mt-20 lg:scroll-mt-24">
      {/* Decorative Subtle Lighting */}
      <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-[#C9A96E]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-[400px] h-[400px] bg-[#E02B1D]/5 rounded-full blur-[120px] pointer-events-none" />

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
            <div className="inline-flex items-center space-x-2 text-[11px] font-sans tracking-[0.3em] text-[#C9A96E] uppercase font-semibold mb-3">
              <span className="w-6 h-[1.5px] bg-[#E02B1D]" />
              <span>ROOMS &amp; STAYS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#F7F3EC] leading-tight">
              Thoughtfully Appointed Rooms
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xs sm:text-sm text-[#A8A59E] font-light max-w-sm mt-4 md:mt-0"
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
                className="group relative rounded-2xl bg-[#151518] border border-white/10 hover:border-[#C9A96E]/40 transition-all duration-300 overflow-hidden shadow-xl flex flex-col justify-between"
              >
                {/* Image Container with Safe Ratio */}
                <div className="relative w-full aspect-[16/10] overflow-hidden bg-[#0E0E10]">
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

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#151518] via-transparent to-transparent pointer-events-none" />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                    {room.tag && (
                      <span className="px-3 py-1 rounded-full bg-[#E02B1D] text-white text-[10px] font-sans font-bold tracking-widest uppercase shadow">
                        {room.tag}
                      </span>
                    )}
                    {room.inventoryLabel && (
                      <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[#F7F3EC] text-[10px] font-sans font-medium">
                        {room.inventoryLabel}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Container */}
                <div className="p-6 flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <h3 className="text-xl font-serif font-bold text-[#F7F3EC] group-hover:text-[#C9A96E] transition-colors">
                        {room.title}
                      </h3>
                    </div>

                    <div className="mb-4">
                      <span className="text-lg font-serif font-bold text-[#E02B1D]">
                        {room.startingPriceLabel || `From ${room.priceLabel} + taxes`}
                      </span>
                      <span className="text-[11px] text-[#A8A59E] block">
                        Base tariff · 4 rate plans available
                      </span>
                    </div>

                    <p className="text-xs text-[#A8A59E] font-light leading-relaxed mb-5 line-clamp-3">
                      {room.shortDescription || room.description}
                    </p>

                    {/* Room Specs */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-[#F7F3EC]/80 mb-6 pb-5 border-b border-white/5 font-sans">
                      <div className="flex items-center space-x-1.5">
                        <Maximize2 className="w-3.5 h-3.5 text-[#C9A96E]" />
                        <span>{room.size}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <BedDouble className="w-3.5 h-3.5 text-[#C9A96E]" />
                        <span>{room.bed}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Users className="w-3.5 h-3.5 text-[#C9A96E]" />
                        <span>{room.occupancy}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-emerald-400">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Free Wi-Fi</span>
                      </div>
                    </div>
                  </div>

                  {/* CTAs */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelectedRoom(room)}
                      className="w-full py-2.5 px-3 rounded-xl border border-[#C9A96E]/30 hover:border-[#C9A96E] text-[#C9A96E] hover:text-white hover:bg-white/5 text-xs font-sans uppercase tracking-[0.14em] font-medium transition-all duration-300 flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Room</span>
                    </button>

                    <button
                      onClick={() => onBookRoom(room.id)}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#E02B1D] hover:bg-[#c82215] text-white text-xs font-sans uppercase tracking-[0.14em] font-semibold transition-all duration-300 shadow-[0_4px_15px_rgba(224,43,29,0.35)] flex items-center justify-center space-x-1.5 cursor-pointer"
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
