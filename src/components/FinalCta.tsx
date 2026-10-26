"use client";

import { motion } from "framer-motion";
import { Calendar, Phone, Sparkles, ShieldCheck } from "lucide-react";
import { siteConfig } from "@/data/content";

interface FinalCtaProps {
  onOpenBooking: () => void;
}

export default function FinalCta({ onOpenBooking }: FinalCtaProps) {
  const { finalCta, contact } = siteConfig;

  return (
    <section className="relative py-28 lg:py-36 bg-[#0E0E10] text-[#F7F3EC] overflow-hidden border-t border-white/5">
      {/* Background Cinematic Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,_rgba(224,43,29,0.12)_0%,_rgba(201,169,110,0.06)_40%,_transparent_70%)] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center space-x-2 text-[11px] font-sans tracking-[0.3em] text-[#C9A96E] uppercase font-semibold mb-6"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#E02B1D]" />
          <span>{finalCta.eyebrow}</span>
          <Sparkles className="w-3.5 h-3.5 text-[#E02B1D]" />
        </motion.div>

        {/* Big Serif Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#F7F3EC] leading-[1.12] mb-6 max-w-4xl mx-auto"
        >
          {finalCta.title}
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-sm sm:text-base text-[#A8A59E] font-light max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          {finalCta.subtitle}
        </motion.p>

        {/* Action Buttons Row */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto"
        >
          <button
            onClick={onOpenBooking}
            className="w-full sm:w-auto px-9 py-4 rounded-full bg-[#E02B1D] hover:bg-[#c82215] text-white text-xs font-sans uppercase tracking-[0.22em] font-bold shadow-[0_4px_30px_rgba(224,43,29,0.5)] hover:shadow-[0_4px_35px_rgba(224,43,29,0.7)] transition-all duration-300 flex items-center justify-center space-x-2.5 btn-magnetic"
          >
            <Calendar className="w-4 h-4" />
            <span>Book Your Stay</span>
          </button>

          <a
            href={contact.phoneTel}
            className="w-full sm:w-auto px-7 py-4 rounded-full glass-panel border border-[#C9A96E]/40 hover:border-[#C9A96E] text-xs font-sans uppercase tracking-[0.2em] text-[#C9A96E] hover:text-[#F7F3EC] transition-all flex items-center justify-center space-x-2 font-semibold"
          >
            <Phone className="w-3.5 h-3.5 text-[#E02B1D]" />
            <span>Speak With Desk</span>
          </a>
        </motion.div>

        {/* Trust Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-[11px] font-sans text-[#A8A59E]">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-[#C9A96E]" />
            <span>Guaranteed Best Online Rate</span>
          </div>
          <span className="text-white/20">&bull;</span>
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-[#C9A96E]" />
            <span>Instant Confirmation & Flexible Cancellation</span>
          </div>
        </div>
      </div>
    </section>
  );
}
