"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { BedDouble, Maximize2, Users, ArrowRight, Eye, Calendar, Sparkles } from "lucide-react";
import { siteConfig } from "@/data/content";
import { useSiteSlots } from "@/context/SiteSlotsContext";
import RoomDetailModal, { RoomType } from "./RoomDetailModal";

interface RoomsSectionProps {
  onBookRoom: (roomId: string) => void;
}

export default function RoomsSection({ onBookRoom }: RoomsSectionProps) {
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const { slots } = useSiteSlots();

  const rooms = (siteConfig.rooms as RoomType[]).map((room) => {
    const mainSlot = slots[`rooms.${room.id}.main`];
    const g1Slot = slots[`rooms.${room.id}.gallery.1`];
    const g2Slot = slots[`rooms.${room.id}.gallery.2`];
    return {
      ...room,
      image: mainSlot?.url || room.image,
      gallery: [
        g1Slot?.url || room.gallery?.[0] || room.image,
        g2Slot?.url || room.gallery?.[1] || room.image,
      ],
    };
  });

  return (
    <section id="rooms" className="relative py-24 lg:py-32 bg-[#0E0E10] text-[#F7F3EC] overflow-hidden">
      {/* Decorative Gold & Red Lighting Gradients */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-[#C9A96E]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-[500px] h-[500px] bg-[#E02B1D]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
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
              <span>ACCOMMODATION & SUITES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#F7F3EC] leading-tight">
              Curated Sanctuaries of Pure Refinement
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xs sm:text-sm text-[#A8A59E] font-light max-w-sm mt-4 md:mt-0"
          >
            Each suite features bespoke Italian marble en-suites, acoustic triple glazing, high-speed Wi-Fi 6, and complimentary airport drop service.
          </motion.p>
        </div>

        {/* Rooms Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {rooms.map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.15 }}
              className="group relative rounded-2xl bg-[#151518] border border-white/10 hover:border-[#C9A96E]/40 transition-all duration-500 overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.6)] flex flex-col justify-between"
            >
              {/* Image Container with Safe Zoom and Badge */}
              <div className="relative w-full aspect-[16/10] overflow-hidden bg-[#0E0E10]">
                {!failedImages[room.id] ? (
                  <Image
                    src={room.image}
                    alt={room.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    onError={() => setFailedImages((prev) => ({ ...prev, [room.id]: true }))}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1C1C22] via-[#0E0E10] to-[#141417] flex flex-col items-center justify-center p-6 text-center">
                    <div className="relative w-44 h-14 mb-3 opacity-90">
                      <Image
                        src="/assets/logo.png"
                        alt="Hotel Fremont"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#0E0E10]/80 border border-[#C9A96E]/30">
                      <Sparkles className="w-3 h-3 text-[#E02B1D]" />
                      <span className="text-[10px] uppercase tracking-widest text-[#C9A96E] font-sans font-semibold">
                        {room.title}
                      </span>
                    </div>
                  </div>
                )}

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#151518] via-transparent to-black/30 pointer-events-none" />

                {/* Badges: Category Tag & Inventory Chip */}
                <div className="absolute top-4 left-4 flex items-center space-x-2">
                  <div className="px-3 py-1 rounded-full bg-[#E02B1D] text-white text-[10px] font-sans font-bold tracking-widest uppercase shadow-lg">
                    {room.badge}
                  </div>
                  {room.inventoryLabel && (
                    <div className="px-2.5 py-1 rounded-full bg-[#0E0E10]/85 backdrop-blur-md border border-[#C9A96E]/40 text-[#C9A96E] text-[10px] font-sans font-semibold tracking-wider uppercase shadow-md">
                      {room.inventoryLabel}
                    </div>
                  )}
                </div>

                {/* Price Tag Pill */}
                <div className="absolute bottom-4 right-4 glass-panel px-3.5 py-1.5 rounded-xl border border-[#C9A96E]/30 flex items-baseline space-x-1">
                  <span className="text-[10px] text-[#A8A59E] uppercase font-sans">from</span>
                  <span className="text-lg font-serif font-bold text-[#F7F3EC]">{room.priceLabel}</span>
                  <span className="text-[10px] text-[#C9A96E] font-sans">/night</span>
                </div>
              </div>

              {/* Card Details Body */}
              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl font-serif font-bold text-[#F7F3EC] group-hover:text-[#C9A96E] transition-colors mb-2">
                    {room.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#A8A59E] line-clamp-2 font-light leading-relaxed mb-5">
                    {room.description}
                  </p>

                  {/* Room Specs Row */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/5 text-xs text-[#F7F3EC]/80 mb-6">
                    <div className="flex items-center space-x-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-[#E02B1D] shrink-0" />
                      <span className="text-[11px] truncate">{room.size}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Users className="w-3.5 h-3.5 text-[#E02B1D] shrink-0" />
                      <span className="text-[11px] truncate">
                        {room.maxGuests ? `${room.maxGuests} Guests` : room.occupancy}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <BedDouble className="w-3.5 h-3.5 text-[#E02B1D] shrink-0" />
                      <span className="text-[11px] truncate">King Bed</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3 pt-2">
                  <button
                    onClick={() => setSelectedRoom(room)}
                    className="flex-1 py-3 rounded-xl border border-[#C9A96E]/30 text-xs font-sans uppercase tracking-[0.16em] text-[#C9A96E] hover:bg-[#C9A96E]/10 hover:border-[#C9A96E] transition-all flex items-center justify-center space-x-1.5 font-semibold group/btn"
                  >
                    <Eye className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110" />
                    <span>View Suite</span>
                  </button>

                  <button
                    onClick={() => onBookRoom(room.id)}
                    className="flex-1 py-3 rounded-xl bg-[#E02B1D] hover:bg-[#c82215] text-xs font-sans uppercase tracking-[0.16em] text-white transition-all shadow-[0_4px_16px_rgba(224,43,29,0.35)] hover:shadow-[0_4px_22px_rgba(224,43,29,0.6)] flex items-center justify-center space-x-1.5 font-semibold btn-magnetic"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Book Now</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Room Detail Modal with Gallery */}
      <RoomDetailModal
        room={selectedRoom}
        onClose={() => setSelectedRoom(null)}
        onBookRoom={onBookRoom}
      />
    </section>
  );
}
