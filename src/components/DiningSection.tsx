"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Utensils, Clock, Wine, Sparkles, Calendar } from "lucide-react";
import { siteConfig } from "@/data/content";
import DiningModal from "./DiningModal";

export default function DiningSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { dining } = siteConfig;

  return (
    <section id="dining" className="relative py-24 lg:py-32 bg-[#0E0E10] text-[#F7F3EC] overflow-hidden">
      {/* Background Lighting */}
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-[#E02B1D]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center space-x-2 text-[11px] font-sans tracking-[0.3em] text-[#C9A96E] uppercase font-semibold mb-3">
            <span className="w-6 h-[1.5px] bg-[#E02B1D]" />
            <span>{dining.eyebrow}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#F7F3EC] leading-tight mb-4">
            {dining.name}
          </h2>
          <p className="text-xs sm:text-sm text-[#A8A59E] font-light leading-relaxed">
            {dining.description}
          </p>
        </div>

        {/* Featured Atmospheric Banner with Parallax Feel & Split Content */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-[0_25px_70px_rgba(0,0,0,0.7)] mb-16">
          <div className="relative w-full aspect-[16/9] md:aspect-[21/9] min-h-[420px]">
            <Image
              src={dining.imagePrimary}
              alt="Aura Fine Dining Restaurant and Lounge"
              fill
              sizes="100vw"
              className="object-cover scale-105 transition-transform duration-1000 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E10] via-[#0E0E10]/60 to-black/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0E0E10]/90 via-[#0E0E10]/50 to-transparent" />
          </div>

          {/* Overlay Floating Card */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 lg:p-14 z-10">
            <div className="max-w-xl">
              <span className="px-3 py-1 rounded-full bg-[#E02B1D] text-white text-[10px] font-sans font-bold tracking-widest uppercase mb-4 inline-block">
                Signature Fine Dining
              </span>

              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#F7F3EC] mb-3">
                {dining.tagline}
              </h3>

              <div className="flex flex-wrap items-center gap-4 text-xs text-[#C9A96E] mb-6 font-sans">
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#E02B1D]" />
                  <span>{dining.timing}</span>
                </div>
                <span className="text-white/20">&bull;</span>
                <div className="flex items-center space-x-1.5">
                  <Wine className="w-3.5 h-3.5 text-[#C9A96E]" />
                  <span>Curated Cellar</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {dining.features.map((feat, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-md bg-[#0E0E10]/80 border border-[#C9A96E]/20 text-[11px] text-[#F7F3EC]/90"
                  >
                    {feat}
                  </span>
                ))}
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="px-8 py-3.5 rounded-full bg-[#E02B1D] hover:bg-[#c82215] text-xs font-sans uppercase tracking-[0.22em] text-white font-semibold transition-all duration-300 shadow-[0_4px_25px_rgba(224,43,29,0.45)] flex items-center space-x-2 btn-magnetic"
              >
                <Calendar className="w-4 h-4" />
                <span>Reserve a Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Chef's Signature Menu Highlights */}
        <div>
          <div className="flex items-center justify-between mb-8 pb-3 border-b border-white/10">
            <div>
              <span className="text-[10px] font-sans tracking-[0.25em] text-[#C9A96E] uppercase font-semibold">
                CHEF’S RECOMMENDATIONS
              </span>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#F7F3EC] mt-0.5">
                Gastronomic Highlights
              </h3>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="text-xs uppercase tracking-widest text-[#E02B1D] hover:text-white transition-colors flex items-center space-x-1 font-semibold link-underline"
            >
              <span>Book Table</span>
              <span>&rarr;</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dining.highlights.map((dish, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="p-5 sm:p-6 rounded-2xl bg-[#151518]/80 border border-white/5 hover:border-[#C9A96E]/30 transition-all duration-300 flex items-start justify-between group"
              >
                <div className="pr-4">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-base font-serif font-bold text-[#F7F3EC] group-hover:text-[#C9A96E] transition-colors">
                      {dish.name}
                    </h4>
                  </div>
                  <p className="text-xs text-[#A8A59E] font-light leading-relaxed mt-1">
                    {dish.desc}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-base font-serif font-bold text-[#C9A96E]">
                    {dish.price}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Table Reservation Modal */}
      <DiningModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
}
