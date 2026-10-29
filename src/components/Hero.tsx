"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { ArrowDown, Sparkles, MapPin, Award } from "lucide-react";
import { siteConfig } from "@/data/content";
import { useIntro } from "@/context/IntroContext";
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

const heroSlides = [
  { src: "/assets/hero/hero-exterior.webp", label: "Exterior" },
  { src: "/assets/hero/hero-lobby.webp", label: "Grand Lobby" },
  { src: "/assets/hero/hero-pool.webp", label: "Poolside" },
  { src: "/assets/hero/hero-suite.webp", label: "Luxury Suites" },
];

export default function Hero({ onCheckAvailability, onExploreSuites }: HeroProps) {
  const { isIntroDone } = useIntro();
  const [currentSlide, setCurrentSlide] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const { scrollY } = useScroll();

  // Subtle parallax (max 8% movement)
  const yParallax = useTransform(scrollY, [0, 1000], [0, 60]);

  // Start crossfade slider ONLY after intro is done
  useEffect(() => {
    if (!isIntroDone || shouldReduceMotion) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isIntroDone, shouldReduceMotion]);

  const words = ["Stay", "Beyond", "Ordinary."];

  return (
    <section className="relative min-h-[100svh] w-full flex flex-col justify-between pt-28 sm:pt-32 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Media Container with Ken Burns & Parallax */}
      <motion.div
        style={{ y: shouldReduceMotion ? 0 : yParallax }}
        className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              scale: shouldReduceMotion || !isIntroDone ? 1 : [1.0, 1.08],
            }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 1.2, ease: "easeInOut" },
              scale: { duration: 18, ease: "linear", repeat: Infinity },
            }}
            className="absolute inset-0 w-full h-full"
          >
            <Image
              src={heroSlides[currentSlide].src}
              alt={`Hotel Fremont ${heroSlides[currentSlide].label}`}
              fill
              priority={currentSlide === 0}
              quality={85}
              sizes="100vw"
              className="object-cover object-[center_60%]"
            />
          </motion.div>
        </AnimatePresence>

        {/* Soft Luxury Gradients: from-black/55 via-black/25 to-black/70 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/55" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/20 to-black/80" />

        {/* Subtle Film Grain / Vignette */}
        <div className="absolute inset-0 bg-grain opacity-25" />
      </motion.div>

      {/* Hero Central Content - Starts with opacity: 0 via CSS until isIntroDone */}
      <div
        className="relative z-10 max-w-5xl mx-auto w-full text-center my-auto pt-6 pb-6 transition-opacity duration-300"
        style={{ opacity: isIntroDone ? 1 : 0 }}
      >
        {/* Eyebrow Badge (0.0s after intro) */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={isIntroDone ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border border-[#C9A96E]/40 bg-[#0E0E10]/70 backdrop-blur-md mb-6 shadow-lg"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#E02B1D]" />
          <span className="text-[10px] sm:text-[11px] font-sans tracking-[0.25em] text-[#C9A96E] uppercase font-semibold">
            {siteConfig.hero.eyebrow}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#E02B1D]" />
          <span className="text-[10px] tracking-[0.18em] text-[#F7F3EC]/85 uppercase hidden sm:inline">
            10 Mins From IXC Airport
          </span>
        </motion.div>

        {/* Serif Headline with 0.12s Word-by-Word Stagger Reveal & Subtle Text Shadow */}
        <h1 className="text-[clamp(2.5rem,6.5vw,5.5rem)] font-serif font-bold text-[#F7F3EC] tracking-tight leading-[1.12] mb-6 [text-shadow:_0_2px_20px_rgba(0,0,0,0.85)]">
          {words.map((word, i) => (
            <span key={i} className="inline-block overflow-hidden mr-2.5 sm:mr-4 align-top">
              <motion.span
                className={`inline-block ${
                  word === "Ordinary." ? "text-[#C9A96E] italic font-normal" : "text-[#F7F3EC]"
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

        {/* Cinematic Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 25 }}
          animate={isIntroDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 25 }}
          transition={{ duration: 0.8, delay: isIntroDone ? 0.55 : 0, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-white/85 font-light leading-relaxed mb-6 [text-shadow:_0_1px_10px_rgba(0,0,0,0.8)]"
        >
          {siteConfig.hero.description}
        </motion.p>

        {/* Address & 5-Star Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isIntroDone ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, delay: isIntroDone ? 0.75 : 0 }}
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs font-sans text-[#C9A96E] mb-6"
        >
          <div className="flex items-center space-x-1.5 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
            <MapPin className="w-3.5 h-3.5 text-[#E02B1D]" />
            <span className="tracking-widest uppercase text-[11px] text-[#F7F3EC]/90">
              Sector 80, Airport Road, Mohali
            </span>
          </div>
          <span className="text-white/20 hidden sm:inline">&bull;</span>
          <div className="flex items-center space-x-1.5 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
            <Award className="w-3.5 h-3.5 text-[#C9A96E]" />
            <span className="tracking-widest uppercase text-[11px] text-[#F7F3EC]/90">
              5-Star Boutique Hospitality
            </span>
          </div>
        </motion.div>
      </div>

      {/* Floating Glassmorphism Booking Bar (Slides up 0.9s duration) */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isIntroDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ duration: 0.9, delay: isIntroDone ? 0.95 : 0, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-20 w-full mb-4"
        style={{ opacity: isIntroDone ? 1 : 0 }}
      >
        <BookingBar onCheckAvailability={onCheckAvailability} />
      </motion.div>

      {/* Bottom Row: Slider Indicators (Left) & Animated Scroll Down (Right) */}
      <div
        className="relative z-10 flex items-center justify-between max-w-5xl mx-auto w-full px-2 transition-opacity duration-300"
        style={{ opacity: isIntroDone ? 1 : 0 }}
      >
        {/* Slider Progress Indicators (Bottom-Left) */}
        <div className="flex items-center space-x-2">
          {heroSlides.map((slide, idx) => (
            <button
              key={slide.src}
              onClick={() => setCurrentSlide(idx)}
              className="group py-2 focus:outline-none cursor-pointer"
              aria-label={`Go to slide ${idx + 1}: ${slide.label}`}
            >
              <div
                className={`h-1 rounded-full transition-all duration-500 ${
                  currentSlide === idx
                    ? "w-8 bg-[#E02B1D] shadow-[0_0_8px_#E02B1D]"
                    : "w-3 bg-white/30 group-hover:bg-white/60"
                }`}
              />
            </button>
          ))}
        </div>

        {/* Scroll Indicator (Right) */}
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
              onExploreSuites();
            }}
            className="flex items-center space-x-2 text-[#F7F3EC]/70 hover:text-[#C9A96E] transition-colors group cursor-pointer text-[10px] uppercase tracking-[0.25em]"
            aria-label="Scroll to discover suites"
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
