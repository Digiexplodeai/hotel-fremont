"use client";

import { useState } from "react";
import Image from "next/image";
import { Utensils, Clock, Users, Calendar } from "lucide-react";
import { siteConfig } from "@/data/content";
import { useSiteSlots } from "@/context/SiteSlotsContext";
import DiningModal from "./DiningModal";
import PhotoComingSoon from "@/components/PhotoComingSoon";

export default function DiningSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { dining } = siteConfig;
  const { slots } = useSiteSlots();

  const bannerImage = slots["restaurant"]?.url || slots["dining.banner_primary"]?.url || "";

  return (
    <section id="dining" className="relative py-20 lg:py-28 bg-[#0E0E10] text-[#F7F3EC] overflow-hidden scroll-mt-20 lg:scroll-mt-24">
      {/* Background Lighting */}
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-[#E02B1D]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
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

        {/* Featured Dining Hall Banner Card */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-[0_25px_70px_rgba(0,0,0,0.7)] mb-14 bg-[#151518]">
          <div className="relative w-full aspect-[16/10] sm:aspect-[21/9] min-h-[380px] sm:min-h-[440px]">
            {bannerImage ? (
              <Image
                src={bannerImage}
                alt="Hotel Fremont Dining Hall Ground Floor"
                fill
                sizes="100vw"
                className="object-cover object-center"
              />
            ) : (
              <PhotoComingSoon
                title="Hotel Fremont Dining Hall"
                category="In-House Dining · Ground Floor"
                aspectRatio="aspect-[21/9]"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E10] via-[#0E0E10]/60 to-black/30 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0E0E10]/90 via-[#0E0E10]/50 to-transparent pointer-events-none" />
          </div>

          {/* Overlay Floating Card */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 lg:p-14 z-10">
            <div className="max-w-xl">
              <span className="px-3 py-1 rounded-full bg-[#E02B1D] text-white text-[10px] font-sans font-bold tracking-widest uppercase mb-4 inline-block shadow">
                GROUND FLOOR DINING HALL
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
                  <Users className="w-3.5 h-3.5 text-[#C9A96E]" />
                  <span>{dining.covers}</span>
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
                className="px-7 py-3 rounded-full bg-[#E02B1D] hover:bg-[#c82215] text-xs font-sans uppercase tracking-[0.2em] text-white font-semibold transition-all duration-300 shadow-[0_4px_25px_rgba(224,43,29,0.45)] flex items-center space-x-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>ENQUIRE FOR DINING</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <DiningModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
}
