"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { ArrowDown, Sparkles, MapPin } from "lucide-react";
import { siteConfig } from "@/data/content";
import { useIntro } from "@/context/IntroContext";
import { useSiteSlots } from "@/context/SiteSlotsContext";
import BookingBar from "./BookingBar";

interface HeroProps {
  onCheckAvailability: (bookingData: {
    checkIn: string;
    checkOut: string;
    roomType: string;
    guests: number;
  }) => void;
  onExploreSuites?: () => void;
  onExploreRooms?: () => void;
}

export default function Hero({ onCheckAvailability, onExploreSuites, onExploreRooms }: HeroProps) {
  const { isIntroDone } = useIntro();
  const { slots } = useSiteSlots();

  // Prefer the real exterior photo slot uploaded via admin Image Manager
  const exteriorPhoto = slots["exterior"]?.url || slots["hero.slide_1"]?.url || "";

  const shouldReduceMotion = useReducedMotion();
  const { scrollY } = useScroll();

  const yParallax = useTransform(scrollY, [0, 1000], [0, 60]);

  const words = ["A", "comfortable", "stay", "in", "Mohali."];

  const handleExplore = () => {
    if (onExploreRooms) onExploreRooms();
    else if (onExploreSuites) onExploreSuites();
  };

  return (
    <section className="relative min-h-[100svh] w-full flex flex-col justify-between pt-28 sm:pt-32 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Media Container */}
      <motion.div
        style={{ y: shouldReduceMotion ? 0 : yParallax }}
        className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
      >
        <div className="absolute inset-0 w-full h-full bg-[#0E0E10]">
          {exteriorPhoto ? (
            <Image
              src={exteriorPhoto}
              alt="Hotel Fremont - Exterior on Airport Road, Mohali"
              fill
              priority
              quality={85}
              sizes="100vw"
              className="object-cover object-center"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a20] via-[#101014] to-[#0A0A0C]" />
          )}
        </div>

        {/* Ambient Gradients for Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E10] via-black/40 to-black/60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/20 to-black/80" />
        <div className="absolute inset-0 bg-grain opacity-25" />
      </motion.div>

      {/* Hero Central Content */}
      <div
        className="relative z-10 max-w-5xl mx-auto w-full text-center my-auto pt-6 pb-6 transition-opacity duration-300"
        style={{ opacity: isIntroDone ? 1 : 0 }}
      >
        {/* Eyebrow Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={isIntroDone ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border border-[#C9A96E]/40 bg-[#0E0E10]/70 backdrop-blur-md mb-6 shadow-lg"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#E02B1D]" />
          <span className="text-[10px] sm:text-[11px] font-sans tracking-[0.25em] text-[#C9A96E] uppercase font-semibold">
            {siteConfig.brand.badge || "3-Star Hotel"}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#E02B1D]" />
          <span className="text-[10px] tracking-[0.18em] text-[#F7F3EC]/85 uppercase">
            {siteConfig.brand.subline || "A convenient address on Airport Road"}
          </span>
        </motion.div>

        {/* Headline */}
        <h1 className="text-[clamp(2.5rem,6.5vw,5rem)] font-serif font-bold text-[#F7F3EC] tracking-tight leading-[1.12] mb-6 [text-shadow:_0_2px_20px_rgba(0,0,0,0.85)]">
          {words.map((word, i) => (
            <span key={i} className="inline-block overflow-hidden mr-2.5 sm:mr-3.5 align-top">
              <motion.span
                className={`inline-block ${
                  word === "Mohali." ? "text-[#C9A96E] italic font-normal" : "text-[#F7F3EC]"
                }`}
                initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
                animate={
                  isIntroDone
                    ? { opacity: 1, y: 0, filter: "blur(0px)" }
                    : { opacity: 0, y: 40, filter: "blur(8px)" }
                }
                transition={{
                  duration: 0.9,
                  delay: isIntroDone ? 0.12 * i : 0,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {word}
              </motion.span>
            </span>
          ))}
        </h1>

        {/* Tagline / Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 25 }}
          animate={isIntroDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 25 }}
          transition={{ duration: 0.8, delay: isIntroDone ? 0.55 : 0, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-white/90 font-light leading-relaxed mb-6 [text-shadow:_0_1px_10px_rgba(0,0,0,0.8)]"
        >
          {siteConfig.brand.tagline}
        </motion.p>

        {/* Address Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isIntroDone ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, delay: isIntroDone ? 0.75 : 0 }}
          className="flex items-center justify-center text-xs font-sans text-[#C9A96E] mb-6"
        >
          <div className="flex items-center space-x-1.5 bg-black/50 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10">
            <MapPin className="w-3.5 h-3.5 text-[#E02B1D]" />
            <span className="tracking-widest uppercase text-[11px] text-[#F7F3EC]/90">
              Sector 80, Airport Road, Mohali · 21 Rooms
            </span>
          </div>
        </motion.div>
      </div>

      {/* Floating Booking Bar */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isIntroDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ duration: 0.9, delay: isIntroDone ? 0.95 : 0, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-20 w-full mb-4"
        style={{ opacity: isIntroDone ? 1 : 0 }}
      >
        <BookingBar onCheckAvailability={onCheckAvailability} />
      </motion.div>

      {/* Bottom Scroll Down CTA */}
      <div
        className="relative z-10 flex items-center justify-end max-w-5xl mx-auto w-full px-2 transition-opacity duration-300"
        style={{ opacity: isIntroDone ? 1 : 0 }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={isIntroDone ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: isIntroDone ? 1.15 : 0 }}
          className="flex justify-center"
        >
          <a
            href="#rooms"
            onClick={(e) => {
              e.preventDefault();
              handleExplore();
            }}
            className="flex items-center space-x-2 text-[#F7F3EC]/70 hover:text-[#C9A96E] transition-colors group cursor-pointer text-[10px] uppercase tracking-[0.25em]"
            aria-label="Scroll to discover rooms"
          >
            <span>Scroll To Discover</span>
            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <ArrowDown className="w-3.5 h-3.5 text-[#E02B1D]" />
            </motion.div>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
