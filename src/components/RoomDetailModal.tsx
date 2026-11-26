"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, BedDouble, Maximize2, Users, Calendar, Sparkles, Utensils, ShieldCheck } from "lucide-react";
import { RoomCategory } from "@/data/rooms";
import { lockScroll, unlockScroll } from "@/lib/scroll";
import { formatINR } from "@/config/hotel";
import PhotoComingSoon from "@/components/PhotoComingSoon";

export type RoomType = RoomCategory;

interface RoomDetailModalProps {
  room: RoomType | null;
  onClose: () => void;
  onBookRoom: (roomId: string) => void;
}

export default function RoomDetailModal({ room, onClose, onBookRoom }: RoomDetailModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setActiveImageIndex(0);
    setFailedImages({});
  }, [room]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (room) {
      window.addEventListener("keydown", handleKeyDown);
      lockScroll();
    } else {
      unlockScroll();
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      unlockScroll();
    };
  }, [room, onClose]);

  if (!room) return null;

  const hasPhoto = room.image && room.image.trim().length > 0 && !failedImages[`${room.id}-${activeImageIndex}`];
  const ratePlans = room.ratePlans || {
    cpDouble: 2799,
    cpSingle: 2499,
    epDouble: 2499,
    epSingle: 2299,
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0E0E10]/90 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="relative w-full max-w-4xl bg-[#151518] border border-white/10 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.85)] overflow-hidden z-10 my-auto text-[#F7F3EC]"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-[#0E0E10]/80 text-[#F7F3EC] hover:text-[#E02B1D] hover:bg-[#0E0E10] border border-white/10 transition-colors cursor-pointer"
            aria-label="Close room details"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 max-h-[85vh] overflow-y-auto">
            {/* Visual Column */}
            <div className="lg:col-span-6 p-4 sm:p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10">
              <div>
                <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden mb-4 border border-white/10 bg-[#0E0E10]">
                  {hasPhoto ? (
                    <Image
                      src={room.gallery[activeImageIndex] || room.image}
                      alt={room.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                      onError={() =>
                        setFailedImages((prev) => ({
                          ...prev,
                          [`${room.id}-${activeImageIndex}`]: true,
                        }))
                      }
                    />
                  ) : (
                    <PhotoComingSoon
                      title={room.title}
                      category="Hotel Fremont"
                      aspectRatio="aspect-[16/10]"
                    />
                  )}

                  <div className="absolute top-3 left-3 flex items-center space-x-2">
                    {room.tag && (
                      <div className="px-3 py-1 rounded-full bg-[#E02B1D] text-white text-[10px] uppercase font-bold tracking-widest shadow-md">
                        {room.tag}
                      </div>
                    )}
                    {room.inventoryLabel && (
                      <div className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[#F7F3EC] text-[10px] font-semibold">
                        {room.inventoryLabel}
                      </div>
                    )}
                  </div>
                </div>

                {/* Key Room Metrics */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
                  <div className="p-2.5 rounded-lg bg-[#0E0E10] border border-white/5">
                    <Maximize2 className="w-3.5 h-3.5 mx-auto mb-1 text-[#C9A96E]" />
                    <span className="text-[10px] text-[#A8A59E] block">Size</span>
                    <span className="font-semibold">{room.size}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0E0E10] border border-white/5">
                    <BedDouble className="w-3.5 h-3.5 mx-auto mb-1 text-[#C9A96E]" />
                    <span className="text-[10px] text-[#A8A59E] block">Bedding</span>
                    <span className="font-semibold">{room.bed}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0E0E10] border border-white/5">
                    <Users className="w-3.5 h-3.5 mx-auto mb-1 text-[#C9A96E]" />
                    <span className="text-[10px] text-[#A8A59E] block">Max Guests</span>
                    <span className="font-semibold">{room.occupancy}</span>
                  </div>
                </div>
              </div>

              {/* Inclusions */}
              <div className="p-3.5 rounded-xl bg-[#0E0E10] border border-white/5 space-y-2">
                <span className="text-[10px] font-sans tracking-[0.2em] text-[#C9A96E] uppercase font-semibold block">
                  Included Amenities
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-xs text-[#F7F3EC]/80">
                  {room.amenities.map((am, i) => (
                    <div key={i} className="flex items-center space-x-1.5">
                      <Check className="w-3 h-3 text-[#E02B1D] shrink-0" />
                      <span className="truncate">{am}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rates & Booking Column */}
            <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-sans tracking-[0.25em] text-[#C9A96E] uppercase font-semibold">
                  Hotel Fremont · Mohali
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#F7F3EC] mt-1 mb-2">
                  {room.title}
                </h3>

                <p className="text-xs text-[#A8A59E] font-light leading-relaxed mb-5">
                  {room.longDescription || room.description}
                </p>

                {/* 4 Rate Plans Table */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase tracking-wider font-semibold text-[#F7F3EC]">
                      Rate Plans (Per Room / Night)
                    </span>
                    <span className="text-[10px] text-[#C9A96E]">+ Applicable Taxes</span>
                  </div>

                  <div className="rounded-xl border border-white/10 overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-black/40 border-b border-white/10 text-[10px] uppercase text-[#A8A59E] font-sans">
                          <th className="p-2.5">Rate Plan</th>
                          <th className="p-2.5 text-right">Double (2 Guests)</th>
                          <th className="p-2.5 text-right">Single (1 Guest)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-sans">
                        <tr className="hover:bg-white/[0.02]">
                          <td className="p-2.5 font-medium text-white flex items-center gap-1.5">
                            <Utensils className="w-3 h-3 text-[#E02B1D]" />
                            <span>With Breakfast</span>
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-[#F7F3EC]">
                            {formatINR(ratePlans.cpDouble)}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-[#F7F3EC]">
                            {formatINR(ratePlans.cpSingle)}
                          </td>
                        </tr>
                        <tr className="hover:bg-white/[0.02]">
                          <td className="p-2.5 font-medium text-white/80">
                            <span>Without Breakfast</span>
                          </td>
                          <td className="p-2.5 text-right font-mono text-white/90">
                            {formatINR(ratePlans.epDouble)}
                          </td>
                          <td className="p-2.5 text-right font-mono text-white/90">
                            {formatINR(ratePlans.epSingle)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p className="text-[10px] text-[#A8A59E] mt-2 leading-relaxed">
                    Breakfast buffet included with breakfast rates. 5% GST applies for tariffs up to ₹7,500/night; 18% GST applies above ₹7,500/night.
                  </p>
                </div>

                {/* Policies Box */}
                <div className="p-3.5 rounded-xl bg-red-950/20 border-l-4 border-[#E02B1D] text-xs space-y-1 mb-6">
                  <div className="flex items-center gap-1.5 text-red-300 font-semibold text-[11px] uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#E02B1D]" />
                    <span>24-Hour Cancellation Policy</span>
                  </div>
                  <p className="text-white/70 text-[11px] leading-relaxed">
                    Full refund for cancellations made 24+ hours before check-in (12:00 PM). Cancellations within 24 hours are charged 1 Night Room Tariff. Valid photo ID required for all staying guests.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    onClose();
                    onBookRoom(room.id);
                  }}
                  className="w-full py-3.5 rounded-xl bg-[#E02B1D] text-white hover:bg-[#c82215] transition-all duration-300 font-semibold text-xs uppercase tracking-[0.2em] shadow-[0_4px_25px_rgba(224,43,29,0.4)] flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book {room.title}</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
