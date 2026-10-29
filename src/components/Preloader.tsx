"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useIntro } from "@/context/IntroContext";

export default function Preloader() {
  const { isIntroActive, completeIntro } = useIntro();
  const [showCurtain, setShowCurtain] = useState(isIntroActive);
  const [progress, setProgress] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isIntroActive || shouldReduceMotion) {
      setShowCurtain(false);
      completeIntro();
      return;
    }

    setShowCurtain(true);

    const startTime = performance.now();
    const minDuration = 1800; // 1.8s minimum visible time
    let animationFrameId: number;
    let completeTimerId: ReturnType<typeof setTimeout>;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const pct = Math.min(100, (elapsed / minDuration) * 100);
      setProgress(pct);

      if (pct < 100) {
        animationFrameId = requestAnimationFrame(tick);
      } else {
        // Progress filled, trigger curtain exit
        setShowCurtain(false);
        // As curtain lifts away (1.0s), mark intro done so hero & navbar reveal
        completeTimerId = setTimeout(() => {
          completeIntro();
        }, 900);
      }
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(completeTimerId);
    };
  }, [isIntroActive, shouldReduceMotion, completeIntro]);

  if (!isIntroActive && !showCurtain) return null;

  return (
    <AnimatePresence>
      {showCurtain && (
        <motion.div
          key="fremont-preloader-curtain"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0E0E10] text-center overflow-hidden"
          initial={{ y: "0%" }}
          exit={{
            y: "-100%",
            transition: {
              duration: 1.0,
              ease: [0.76, 0, 0.24, 1], // Exact cubic-bezier(0.76, 0, 0.24, 1) luxury curtain lift
            },
          }}
        >
          {/* Ambient Deep Red Core Glow */}
          <div className="absolute w-[600px] h-[600px] rounded-full bg-[#E02B1D]/15 blur-[140px] pointer-events-none" />

          {/* Centered Content Container */}
          <div className="relative z-10 flex flex-col items-center px-6 max-w-lg w-full">
            {/* Logo fades in + slides up slightly (0.8s, ease power3.out) */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mb-8 flex justify-center w-full"
            >
              <Image
                src="/assets/logo.png"
                alt="HOTEL FREMONT"
                width={500}
                height={56}
                priority
                style={{ width: "auto" }}
                className="h-12 sm:h-14 object-contain drop-shadow-[0_4px_30px_rgba(224,43,29,0.45)]"
              />
            </motion.div>

            {/* Thin red progress line under it fills from 0 to 100% over ~1.6s */}
            <div className="w-56 sm:w-64 h-[2px] bg-white/10 overflow-hidden rounded-full mb-4">
              <motion.div
                className="h-full bg-[#E02B1D] shadow-[0_0_14px_#E02B1D]"
                style={{ width: `${progress}%` }}
                transition={{ ease: "easeOut" }}
              />
            </div>

            {/* Subtle Mohali Subtitle */}
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-[10px] sm:text-[11px] font-sans tracking-[0.3em] text-[#C9A96E] uppercase font-medium"
            >
              Mohali &bull; Airport Road
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
