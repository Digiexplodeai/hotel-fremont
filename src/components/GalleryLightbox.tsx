"use client";

import { useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export interface GalleryItem {
  id: number;
  title: string;
  category: string;
  src: string;
  span?: string;
}

interface GalleryLightboxProps {
  items: GalleryItem[];
  currentIndex: number | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function GalleryLightbox({
  items,
  currentIndex,
  onClose,
  onNext,
  onPrev,
}: GalleryLightboxProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    };

    if (currentIndex !== null) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [currentIndex, onClose, onNext, onPrev]);

  if (currentIndex === null || !items[currentIndex]) return null;

  const currentItem = items[currentIndex];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Dark Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0E0E10]/95 backdrop-blur-xl"
        />

        {/* Modal Content */}
        <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
          {/* Top Bar: Title & Close */}
          <div className="w-full flex items-center justify-between py-3 mb-2 text-[#F7F3EC]">
            <div>
              <span className="text-[10px] font-sans tracking-[0.25em] text-[#C9A96E] uppercase font-semibold">
                {currentItem.category}
              </span>
              <h4 className="text-lg font-serif font-bold text-[#F7F3EC]">
                {currentItem.title}
              </h4>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-xs text-[#A8A59E] font-sans">
                {currentIndex + 1} / {items.length}
              </span>

              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-[#E02B1D] text-white transition-colors"
                aria-label="Close lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Visual with Navigation Arrows */}
          <div className="relative w-full aspect-[16/10] max-h-[75vh] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <motion.div
              key={currentItem.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="relative w-full h-full"
            >
              <Image
                src={currentItem.src}
                alt={currentItem.title}
                fill
                priority
                sizes="(max-width: 1200px) 100vw, 1200px"
                className="object-contain"
              />
            </motion.div>

            {/* Left Nav Button */}
            <button
              onClick={onPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-[#0E0E10]/70 hover:bg-[#E02B1D] text-white border border-white/10 transition-colors shadow-lg"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Right Nav Button */}
            <button
              onClick={onNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-[#0E0E10]/70 hover:bg-[#E02B1D] text-white border border-white/10 transition-colors shadow-lg"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
}
