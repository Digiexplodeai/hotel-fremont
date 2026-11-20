"use client";

import { useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { lockScroll, unlockScroll } from "@/lib/scroll";

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
      lockScroll();
    } else {
      unlockScroll();
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      unlockScroll();
    };
  }, [currentIndex, onClose, onNext, onPrev]);

  if (currentIndex === null || !items[currentIndex]) return null;

  const currentItem = items[currentIndex];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Dark Backdrop for photography focus */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/95 backdrop-blur-xl"
        />

        {/* Modal Content */}
        <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
          {/* Top Bar: Title & Close */}
          <div className="w-full flex items-center justify-between py-3 mb-2 text-white">
            <div>
              <span className="text-[10px] font-sans tracking-[0.25em] text-[#DFC28A] uppercase font-semibold">
                {currentItem.category}
              </span>
              <h4 className="text-lg font-serif font-bold text-white">
                {currentItem.title}
              </h4>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-xs text-white/70 font-sans">
                {currentIndex + 1} / {items.length}
              </span>

              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-[#742B40] text-white transition-colors cursor-pointer"
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
              className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-[#742B40] text-white border border-white/20 transition-colors shadow-lg cursor-pointer"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Right Nav Button */}
            <button
              onClick={onNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-[#742B40] text-white border border-white/20 transition-colors shadow-lg cursor-pointer"
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
