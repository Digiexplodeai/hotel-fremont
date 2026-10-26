"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowDown, Sparkles, MapPin, Award } from "lucide-react";
import { siteConfig } from "@/data/content";
import BookingBar from "./BookingBar";

interface HeroProps {
  onCheckAvailability: (bookingData: {
    checkIn: string;
    checkOut: string;
    roomType: string;
    guests: number;
  }) => void;
  onExploreSuites: () => void;
}

export default function Hero({ onCheckAvailability, onExploreSuites }: HeroProps) {
  const words = ["Stay", "Beyond", "Ordinary."];

  return (
    <section className="relative min-h-screen w-full flex flex-col justify-between pt-32 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Media with Parallax & Dark Gradient Overlays */}
      <div className="absolute inset-0 z-0">
        <Image
          src={siteConfig.hero.bgImage}
          alt="Hotel Fremont Luxury Architecture"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-105 transform duration-1000 ease-out"
        />

        {/* Multi-tier Cinematic Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E10] via-[#0E0E10]/60 to-[#0E0E10]/75" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#0E0E10]/40 to-[#0E0E10]/95" />
        <div className="absolute inset-0 bg-grain opacity-40 pointer-events-none" />
      </div>

      {/* Hero Central Content */}
      <div className="relative z-10 max-w-5xl mx-auto w-full text-center my-auto pt-6 pb-8">
        {/* Eyebrow Pill */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border border-[#C9A96E]/30 bg-[#16161A]/80 backdrop-blur-md mb-6"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#E02B1D]" />
          <span className="text-[11px] font-sans tracking-[0.28em] text-[#C9A96E] uppercase font-semibold">
            {siteConfig.hero.eyebrow}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#E02B1D]" />
          <span className="text-[10px] tracking-[0.2em] text-[#F7F3EC]/80 uppercase hidden sm:inline">
            10 Mins From IXC Airport
          </span>
        </motion.div>

        {/* Split-Word Animated Serif Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-bold text-[#F7F3EC] tracking-tight leading-[1.08] mb-6">
          {words.map((word, i) => (
            <motion.span
              key={i}
              className={`inline-block mr-3 sm:mr-4 ${
                word === "Ordinary." ? "gold-gradient-text italic font-normal" : ""
              }`}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.85,
                delay: 0.4 + i * 0.18,
                ease: [0.2, 0.65, 0.3, 0.9],
              }}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        {/* Cinematic Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-[#F7F3EC]/80 font-light leading-relaxed mb-8"
        >
          {siteConfig.hero.description}
        </motion.p>

        {/* Quick Highlights Row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-sans text-[#C9A96E] mb-10"
        >
          <div className="flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#E02B1D]" />
            <span className="tracking-widest uppercase">Sector 80, Airport Road, Mohali</span>
          </div>
          <span className="text-white/20 hidden sm:inline">&bull;</span>
          <div className="flex items-center space-x-1.5">
            <Award className="w-3.5 h-3.5 text-[#C9A96E]" />
            <span className="tracking-widest uppercase">5-Star Boutique Hospitality</span>
          </div>
        </motion.div>
      </div>

      {/* Floating Glassmorphism Booking Bar */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="relative z-20 w-full"
      >
        <BookingBar onCheckAvailability={onCheckAvailability} />
      </motion.div>

      {/* Animated Scroll Down Indicator */}
      <div className="relative z-10 flex justify-center mt-6">
        <a
          href="#about"
          className="flex flex-col items-center group cursor-pointer text-[#A8A59E] hover:text-[#C9A96E] transition-colors"
          aria-label="Scroll to about section"
        >
          <span className="text-[9px] uppercase tracking-[0.3em] font-sans mb-1.5">
            Scroll To Discover
          </span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <ArrowDown className="w-3.5 h-3.5 text-[#E02B1D]" />
          </motion.div>
        </a>
      </div>
    </section>
  );
}
