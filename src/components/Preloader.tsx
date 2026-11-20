"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useIntro } from "@/context/IntroContext";

export default function Preloader() {
  const { isIntroActive, completeIntro } = useIntro();
  const [showCurtain, setShowCurtain] = useState(isIntroActive);
  const [progress, setProgress] = useState(0);
  const hasTriggeredExitRef = useRef(false);

  // Manual skip handler
  const handleManualSkip = useCallback(() => {
    if (hasTriggeredExitRef.current) return;
    hasTriggeredExitRef.current = true;
    setShowCurtain(false);
    completeIntro();
  }, [completeIntro]);

  // Lock body scroll while intro/curtain is visible
  useEffect(() => {
    if (showCurtain) {
      document.body.style.overflow = "hidden";
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showCurtain]);

  useEffect(() => {
    if (!isIntroActive) {
      return;
    }

    hasTriggeredExitRef.current = false;

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
        if (hasTriggeredExitRef.current) return;
        hasTriggeredExitRef.current = true;
        setShowCurtain(false);
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
  }, [isIntroActive, completeIntro]);

  if (!isIntroActive && !showCurtain) return null;

  return (
    <AnimatePresence>
      {showCurtain && (
        <motion.div
          key="fremont-preloader-curtain"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#24272B] text-center overflow-hidden text-white"
          initial={{ y: "0%" }}
          exit={{
            y: "-100%",
            transition: {
              duration: 1.0,
              ease: [0.76, 0, 0.24, 1], // Luxury curtain lift
            },
          }}
        >
          {/* Skip Button */}
          <button
            type="button"
            onClick={handleManualSkip}
            className="absolute top-6 right-6 z-20 text-[11px] font-sans tracking-[0.2em] text-white/50 hover:text-[#DFC28A] uppercase transition-colors px-3 py-1.5 rounded cursor-pointer border border-transparent hover:border-white/20"
            aria-label="Skip Intro"
          >
            Skip
          </button>

          {/* Ambient Burgundy Glow */}
          <div className="absolute w-[600px] h-[600px] rounded-full bg-[#742B40]/25 blur-[140px] pointer-events-none" />

          {/* Centered Content Container */}
          <div className="relative z-10 flex flex-col items-center px-6 max-w-lg w-full">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mb-8 flex justify-center w-full"
            >
              <Image
                src="/assets/logo.png"
                alt="Hotel Fremont"
                width={340}
                height={26}
                priority
                style={{ height: "auto" }}
                className="w-[280px] sm:w-[320px] md:w-[340px] max-w-[70vw] object-contain drop-shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
              />
            </motion.div>

            {/* Burgundy progress line */}
            <div className="w-56 sm:w-64 h-[2px] bg-white/10 overflow-hidden rounded-full mb-4">
              <motion.div
                className="h-full bg-[#742B40] shadow-[0_0_14px_#742B40]"
                style={{ width: `${progress}%` }}
                transition={{ ease: "easeOut" }}
              />
            </div>

            {/* Mohali Subtitle */}
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-[10px] sm:text-[11px] font-sans tracking-[0.3em] text-[#DFC28A] uppercase font-semibold"
            >
              Mohali &bull; Airport Road
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
