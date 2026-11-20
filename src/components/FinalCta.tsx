"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Calendar, Phone, Sparkles, ShieldCheck } from "lucide-react";
import { siteConfig } from "@/data/content";

interface FinalCtaProps {
  onOpenBooking: () => void;
}

export default function FinalCta({ onOpenBooking }: FinalCtaProps) {
  const { finalCta, contact } = siteConfig;

  return (
    <section className="relative py-28 lg:py-36 bg-[#F8F6F2] text-[#24272B] overflow-hidden border-t border-[#E5DFD7]">
      {/* Background Subtle Accent Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,_rgba(116,43,64,0.06)_0%,_rgba(182,154,104,0.08)_40%,_transparent_70%)] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center space-x-2 text-[11px] font-sans tracking-[0.3em] text-[#742B40] uppercase font-bold mb-6"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#742B40]" />
          <span>{finalCta.eyebrow}</span>
          <Sparkles className="w-3.5 h-3.5 text-[#742B40]" />
        </motion.div>

        {/* Big Serif Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#24272B] leading-[1.12] mb-6 max-w-4xl mx-auto"
        >
          {finalCta.title}
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-sm sm:text-base text-[#64615D] font-normal max-w-2xl mx-auto mb-10 leading-relaxed"
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
            className="w-full sm:w-auto px-9 py-4 rounded-full bg-[#742B40] hover:bg-[#5C2033] text-white text-xs font-sans uppercase tracking-[0.22em] font-bold shadow-[0_4px_30px_rgba(116,43,64,0.35)] hover:shadow-[0_4px_35px_rgba(116,43,64,0.55)] transition-all duration-300 flex items-center justify-center space-x-2.5 btn-magnetic cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>Book Your Stay</span>
          </button>

          <a
            href={contact.phoneTel}
            className="w-full sm:w-auto px-7 py-4 rounded-full bg-white border border-[#B69A68] hover:border-[#742B40] hover:bg-[#742B40] text-xs font-sans uppercase tracking-[0.2em] text-[#742B40] hover:text-white transition-all flex items-center justify-center space-x-2 font-semibold shadow-sm cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5 text-[#742B40] group-hover:text-white" />
            <span>Speak With Desk</span>
          </a>
        </motion.div>

        {/* Trust Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-[11px] font-sans text-[#64615D]">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-[#B69A68]" />
            <span>Guaranteed Best Online Rate</span>
          </div>
          <span className="text-[#E5DFD7]">&bull;</span>
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-[#B69A68]" />
            <span>
              Instant Confirmation | Cancellation as per{" "}
              <Link href="/cancellation-refund-policy" className="underline hover:text-[#742B40] transition-colors">
                policy
              </Link>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
