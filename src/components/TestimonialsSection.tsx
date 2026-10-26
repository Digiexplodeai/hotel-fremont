"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote, CheckCircle2 } from "lucide-react";
import { siteConfig } from "@/data/content";

export default function TestimonialsSection() {
  const { testimonials } = siteConfig;
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-slide every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const current = testimonials[currentIndex];

  return (
    <section className="relative py-24 lg:py-32 bg-[#0E0E10] text-[#F7F3EC] overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#E02B1D]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Eyebrow & Google Review Tag */}
        <div className="inline-flex items-center space-x-2 text-[11px] font-sans tracking-[0.3em] text-[#C9A96E] uppercase font-semibold mb-3">
          <span className="w-5 h-[1.5px] bg-[#E02B1D]" />
          <span>GUEST TESTIMONIALS</span>
          <span className="w-5 h-[1.5px] bg-[#E02B1D]" />
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#F7F3EC] leading-tight mb-4">
          Words of Distinction
        </h2>

        {/* Google 4.9 Star Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#151518] border border-[#C9A96E]/30 mb-12 shadow">
          <div className="flex items-center space-x-0.5 text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="text-xs font-bold text-[#F7F3EC] font-sans">4.9 / 5.0</span>
          <span className="text-[11px] text-[#A8A59E] font-sans">&bull; Google Verified Reviews</span>
        </div>

        {/* Carousel Container */}
        <div className="relative glass-panel rounded-3xl p-8 sm:p-12 lg:p-16 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.7)] min-h-[300px] flex flex-col justify-between">
          <Quote className="w-12 h-12 text-[#E02B1D]/20 absolute top-8 left-8 -z-0 pointer-events-none" />

          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="relative z-10 space-y-6"
            >
              {/* Star Rating */}
              <div className="flex justify-center space-x-1 text-amber-400">
                {[...Array(current.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote Text */}
              <p className="text-base sm:text-xl lg:text-2xl font-serif font-normal italic text-[#F7F3EC] leading-relaxed max-w-3xl mx-auto">
                &ldquo;{current.text}&rdquo;
              </p>

              {/* Reviewer Details */}
              <div className="pt-4">
                <div className="text-base font-serif font-bold text-[#F7F3EC]">
                  {current.name}
                </div>
                <div className="text-xs font-sans text-[#C9A96E] tracking-wider mt-0.5">
                  {current.role}
                </div>
                <div className="inline-flex items-center space-x-1 text-[11px] text-[#A8A59E] mt-1">
                  <CheckCircle2 className="w-3 h-3 text-[#E02B1D]" />
                  <span>{current.source} &bull; {current.date}</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Controls: Prev / Next & Indicators */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/10">
            <button
              onClick={handlePrev}
              className="p-3 rounded-full bg-[#0E0E10] hover:bg-[#E02B1D] text-white border border-white/10 transition-colors"
              aria-label="Previous review"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Pagination Dots */}
            <div className="flex space-x-2">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentIndex === idx ? "w-8 bg-[#E02B1D]" : "w-2 bg-white/20"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="p-3 rounded-full bg-[#0E0E10] hover:bg-[#E02B1D] text-white border border-white/10 transition-colors"
              aria-label="Next review"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
