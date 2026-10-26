"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface PreloaderProps {
  onLoadingComplete?: () => void;
}

export default function Preloader({ onLoadingComplete }: PreloaderProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Check if session already played the preloader
    const hasLoaded = sessionStorage.getItem("fremont_preloaded");
    if (hasLoaded) {
      setShow(false);
      onLoadingComplete?.();
      return;
    }

    const timer = setTimeout(() => {
      setShow(false);
      sessionStorage.setItem("fremont_preloaded", "true");
      onLoadingComplete?.();
    }, 2400);

    return () => clearTimeout(timer);
  }, [onLoadingComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="preloader"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0E0E10] text-center"
          initial={{ opacity: 1 }}
          exit={{
            y: "-100%",
            transition: { duration: 0.85, ease: [0.77, 0, 0.175, 1] },
          }}
        >
          {/* Subtle Ambient Red Glow */}
          <div className="absolute w-96 h-96 rounded-full bg-[#E02B1D]/10 blur-3xl pointer-events-none" />

          {/* Logo Container with Mask & Line Animation */}
          <div className="relative z-10 flex flex-col items-center max-w-sm px-6">
            {/* Animated F Monogram */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative w-28 h-28 mb-6"
            >
              <Image
                src="/assets/f-icon.png"
                alt="Hotel Fremont Monogram"
                fill
                priority
                className="object-contain drop-shadow-[0_0_20px_rgba(224,43,29,0.35)]"
              />
            </motion.div>

            {/* Red Line Draw Animation */}
            <div className="relative w-48 h-1 mb-6 bg-white/10 overflow-hidden rounded-full">
              <motion.div
                className="h-full bg-[#E02B1D] shadow-[0_0_12px_#E02B1D]"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.6, ease: "easeInOut" }}
              />
            </div>

            {/* Wordmark Reveal */}
            <motion.h2
              className="text-2xl md:text-3xl font-serif font-bold tracking-[0.25em] text-[#F7F3EC] uppercase"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              Hotel Fremont
            </motion.h2>

            {/* Tagline */}
            <motion.p
              className="mt-2 text-xs md:text-sm font-sans tracking-[0.35em] text-[#C9A96E] uppercase font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.8 }}
            >
              Stay Beyond Ordinary
            </motion.p>
          </div>

          {/* Bottom Progress Indicator */}
          <div className="absolute bottom-10 flex items-center space-x-2 text-[11px] font-sans tracking-[0.2em] text-[#A8A59E]/70 uppercase">
            <span>Mohali</span>
            <span>&bull;</span>
            <span>Airport Road</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
