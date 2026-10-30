"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, BedDouble, Maximize2, Users, Eye, Calendar, Sparkles } from "lucide-react";
import { RoomCategory } from "@/data/rooms";

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

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (room) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [room, onClose]);

  if (!room) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop with blur & light-dismiss */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0E0E10]/90 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="relative w-full max-w-4xl bg-[#151518] border border-[#C9A96E]/30 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.8)] overflow-hidden z-10 my-auto text-[#F7F3EC]"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-[#0E0E10]/80 text-[#F7F3EC] hover:text-[#E02B1D] hover:bg-[#0E0E10] border border-white/10 transition-colors"
            aria-label="Close suite details"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 max-h-[85vh] overflow-y-auto">
            {/* Gallery Column */}
            <div className="lg:col-span-7 p-4 sm:p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10">
              {/* Main Active Image */}
              <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden mb-4 border border-white/10 bg-[#0E0E10]">
                {!failedImages[`${room.id}-${activeImageIndex}`] ? (
                  <Image
                    src={room.gallery[activeImageIndex] || room.image}
                    alt={`${room.title} - View ${activeImageIndex + 1}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover transition-all duration-500"
                    onError={() =>
                      setFailedImages((prev) => ({
                        ...prev,
                        [`${room.id}-${activeImageIndex}`]: true,
                      }))
                    }
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1C1C22] via-[#0E0E10] to-[#141417] flex flex-col items-center justify-center p-6 text-center">
                    <div className="relative w-40 h-12 mb-3 opacity-90">
                      <Image
                        src="/assets/logo.png"
                        alt="Hotel Fremont"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-[#C9A96E] font-sans font-semibold">
                      {room.title}
                    </span>
                  </div>
                )}
                <div className="absolute top-3 left-3 flex items-center space-x-2">
                  <div className="px-3 py-1 rounded-full bg-[#E02B1D] text-white text-[10px] uppercase font-bold tracking-widest shadow-md">
                    {room.badge}
                  </div>
                  {room.inventoryLabel && (
                    <div className="px-2.5 py-1 rounded-full bg-[#0E0E10]/85 backdrop-blur-md border border-[#C9A96E]/40 text-[#C9A96E] text-[10px] uppercase font-semibold tracking-wider shadow-md">
                      {room.inventoryLabel}
                    </div>
                  )}
                </div>
              </div>

              {/* Thumbnails Row */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {room.gallery.map((imgUrl, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIndex(i)}
                    className={`relative aspect-[16/10] rounded-lg overflow-hidden border-2 transition-all bg-[#0E0E10] ${
                      activeImageIndex === i
                        ? "border-[#E02B1D] ring-2 ring-[#E02B1D]/40"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    {!failedImages[`thumb-${room.id}-${i}`] ? (
                      <Image
                        src={imgUrl}
                        alt={`Thumbnail ${i + 1}`}
                        fill
                        className="object-cover"
                        onError={() =>
                          setFailedImages((prev) => ({
                            ...prev,
                            [`thumb-${room.id}-${i}`]: true,
                          }))
                        }
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center p-2 bg-[#1A1A1E]">
                        <span className="text-[9px] uppercase tracking-wider text-[#C9A96E] font-sans">
                          View {i + 1}
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Inclusions summary */}
              <div className="mt-6 p-4 rounded-xl bg-[#0E0E10]/70 border border-[#C9A96E]/20">
                <div className="text-[11px] font-sans tracking-[0.2em] text-[#C9A96E] uppercase font-semibold mb-2 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#E02B1D]" />
                  <span>Complimentary Privileges</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {room.highlights.map((h, i) => (
                    <div key={i} className="flex items-center space-x-2 text-xs text-[#F7F3EC]/90">
                      <Check className="w-3.5 h-3.5 text-[#E02B1D] shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Room Info & Booking Column */}
            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-sans tracking-[0.25em] text-[#C9A96E] uppercase font-semibold">
                  Hotel Fremont Mohali
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#F7F3EC] mt-1 mb-2">
                  {room.title}
                </h3>

                {/* Price Display */}
                <div className="flex items-baseline space-x-2 mb-4 pb-4 border-b border-white/10">
                  <span className="text-2xl sm:text-3xl font-serif font-bold text-[#E02B1D]">
                    {room.priceLabel}
                  </span>
                  <span className="text-xs text-[#A8A59E] uppercase tracking-wider font-sans">
                    / Night + Taxes
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[#F7F3EC]/75 leading-relaxed font-light mb-6">
                  {room.description}
                </p>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-2.5 rounded-lg bg-[#0E0E10]/60 border border-white/5">
                    <div className="flex items-center space-x-1.5 text-[10px] text-[#C9A96E] uppercase tracking-wider mb-0.5">
                      <Maximize2 className="w-3 h-3 text-[#E02B1D]" />
                      <span>Dimensions</span>
                    </div>
                    <div className="text-xs font-semibold text-[#F7F3EC]">{room.size}</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#0E0E10]/60 border border-white/5">
                    <div className="flex items-center space-x-1.5 text-[10px] text-[#C9A96E] uppercase tracking-wider mb-0.5">
                      <Users className="w-3 h-3 text-[#E02B1D]" />
                      <span>Occupancy</span>
                    </div>
                    <div className="text-xs font-semibold text-[#F7F3EC]">{room.occupancy}</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#0E0E10]/60 border border-white/5">
                    <div className="flex items-center space-x-1.5 text-[10px] text-[#C9A96E] uppercase tracking-wider mb-0.5">
                      <BedDouble className="w-3 h-3 text-[#E02B1D]" />
                      <span>Bedding</span>
                    </div>
                    <div className="text-xs font-semibold text-[#F7F3EC] truncate">{room.bed}</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#0E0E10]/60 border border-white/5">
                    <div className="flex items-center space-x-1.5 text-[10px] text-[#C9A96E] uppercase tracking-wider mb-0.5">
                      <Eye className="w-3 h-3 text-[#E02B1D]" />
                      <span>View</span>
                    </div>
                    <div className="text-xs font-semibold text-[#F7F3EC] truncate">{room.view}</div>
                  </div>
                </div>

                {/* Amenities Badges */}
                <div className="mb-6">
                  <span className="text-[10px] uppercase tracking-wider text-[#A8A59E] block mb-2 font-sans">
                    Room Features
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {room.amenities.map((am, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-md bg-white/5 text-[11px] text-[#F7F3EC]/80 border border-white/5"
                      >
                        {am}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-white/10 space-y-2">
                <button
                  onClick={() => {
                    onClose();
                    onBookRoom(room.id);
                  }}
                  className="w-full py-3.5 rounded-xl bg-[#E02B1D] text-white hover:bg-[#c82215] transition-all duration-300 font-semibold text-xs uppercase tracking-[0.2em] shadow-[0_4px_25px_rgba(224,43,29,0.4)] flex items-center justify-center space-x-2 btn-magnetic"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Reserve {room.title}</span>
                </button>

                <p className="text-[10px] text-center text-[#A8A59E]">
                  Guaranteed Best Rates &bull; Free Cancellation Up to 24h Before Check-In
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
